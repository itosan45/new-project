import assert from "node:assert/strict";
import test from "node:test";
import {
  checkGate,
  unansweredConcerns,
  type Engagement,
  type EngagementStage,
  type Proposal,
} from "@/lib/domain/engagement";
import { STAGE_DEFINITIONS } from "@/lib/data/stages";
import { findAgent } from "@/lib/data/agents";

/**
 * 段階を進める条件の検証。
 *
 * ここが緩いと、聞けていないのに提案へ、承諾されていないのに制作へ、
 * が通ってしまう。あとの段階で必ず戻ってくる。
 */

function blank(stage: EngagementStage): Engagement {
  return {
    engagementId: "eng_test",
    clientId: "client_test",
    clientName: "テスト工務店",
    title: "テスト案件",
    stage,
    leadSource: "紹介",
    hearing: {
      meetings: [],
      problem: "",
      baseline: "",
      existingTools: [],
      untouchable: [],
      decisionMaker: "",
      concern: "",
    },
    proposals: [],
    runIds: [],
    deliverables: [],
    incidents: [],
    history: [],
    createdAt: "2026-08-19T09:00:00+09:00",
    updatedAt: "2026-08-19T09:00:00+09:00",
  };
}

function meeting(round: number, stillUnknown: string[]) {
  return {
    meetingId: `mtg_${round}`,
    round,
    heldAt: "2026-08-19T10:00:00+09:00",
    attendees: ["社長"],
    learned: ["現状は手書き"],
    stillUnknown,
    nextAction: "次回までに件数をもらう",
    materials: [],
  };
}

function proposal(over: Partial<Proposal> = {}): Proposal {
  return {
    version: 1,
    clientWish: "手書きの調査票をなんとかしたい",
    opinions: [
      {
        agentId: "document-reader",
        ideas: ["調査票をスマホ撮影して読み取る"],
        concerns: [{ concern: "手書きの1と7を取り違える", answer: "全件を人が確認する" }],
        cannotDo: ["読めなかった項目の推測"],
        feasibility: "条件つきでできる",
      },
    ],
    scope: ["調査票の読み取り"],
    outOfScope: ["基幹システムへの登録"],
    amount: 300000,
    duration: "1か月",
    assumptions: ["調査票の様式が変わらない"],
    ...over,
  };
}

test("何も聞いていない状態では、相談から先へ進めない", () => {
  const gate = checkGate(blank("相談"));
  assert.equal(gate.next, "提案");
  assert.equal(gate.canAdvance, false);
});

test("分からないことが残っているうちは、提案へ進めない", () => {
  const e = blank("相談");
  e.hearing = {
    ...e.hearing,
    meetings: [meeting(1, ["月あたりの件数"])],
    problem: "調査票の転記に時間がかかる",
    baseline: "月120件・1件15分",
    untouchable: ["基幹システム"],
    invasionLevel: "L1",
    decisionMaker: "社長",
  };
  assert.equal(checkGate(e).canAdvance, false);

  // 2回目で解消したら進める
  e.hearing.meetings.push(meeting(2, []));
  assert.equal(checkGate(e).canAdvance, true);
});

test("侵襲度と決裁者が決まらないと、提案へ進めない", () => {
  const e = blank("相談");
  e.hearing = {
    ...e.hearing,
    meetings: [meeting(1, [])],
    problem: "転記に時間がかかる",
    baseline: "月120件",
    untouchable: ["基幹システム"],
    decisionMaker: "",
  };
  assert.equal(checkGate(e).canAdvance, false, "決裁者が空でも進めてしまった");

  e.hearing.decisionMaker = "社長";
  assert.equal(checkGate(e).canAdvance, false, "侵襲度が空でも進めてしまった");

  e.hearing.invasionLevel = "L2";
  assert.equal(checkGate(e).canAdvance, true);
});

test("承諾を得ていない提案では、制作へ進めない", () => {
  const e = blank("提案");
  e.proposals = [proposal()];
  assert.equal(checkGate(e).canAdvance, false);

  e.proposals[0].outcome = "修正依頼";
  assert.equal(checkGate(e).canAdvance, false, "修正依頼で進めてしまった");

  e.proposals[0].outcome = "承諾";
  assert.equal(checkGate(e).canAdvance, true);
});

test("答えていない懸念が残っていると、制作へ進めない", () => {
  const e = blank("提案");
  const p = proposal({ outcome: "承諾" });
  p.opinions[0].concerns.push({ concern: "様式が変わると読めなくなる" });
  e.proposals = [p];

  assert.equal(unansweredConcerns(e).length, 1);
  assert.equal(checkGate(e).canAdvance, false);

  p.opinions[0].concerns[1].answer = "様式変更時は再調整（別見積）と前提に明記";
  assert.equal(unansweredConcerns(e).length, 0);
  assert.equal(checkGate(e).canAdvance, true);
});

test("前の版に指摘を残さずに、次の版を出せない", () => {
  const e = blank("提案");
  const v1 = proposal({ version: 1, outcome: "修正依頼" }); // feedback なし
  const v2 = proposal({ version: 2, outcome: "承諾" });
  e.proposals = [v1, v2];
  assert.equal(checkGate(e).canAdvance, false, "指摘を残さず版を重ねられた");

  v1.feedback = "金額が予算を超えている";
  assert.equal(checkGate(e).canAdvance, true);
});

test("渡していない成果物では、完了にできない", () => {
  const e = blank("納品");
  e.deliverables = [
    {
      deliverableId: "d1",
      name: "読み取りツール",
      format: "Webアプリ",
      handoverMethod: "URLを共有",
    },
  ];
  assert.equal(checkGate(e).canAdvance, false);
});

test("行き止まりの段階には次がない", () => {
  for (const stage of ["見送り", "中止"] as EngagementStage[]) {
    const gate = checkGate(blank(stage));
    assert.equal(gate.next, null);
    assert.equal(gate.canAdvance, false);
  }
});

test("すべての段階に、あなたの判断が1つ以上ある", () => {
  // 全部AIに任せる段階を作らない
  for (const def of STAGE_DEFINITIONS) {
    assert.ok(
      def.decisions.length > 0,
      `${def.stage}: 人が決めることが無い段階になっている`,
    );
  }
});

test("段階の定義に、存在しないAgentが書かれていない", () => {
  for (const def of STAGE_DEFINITIONS) {
    for (const a of def.agents) {
      assert.ok(
        findAgent(a.agentId),
        `${def.stage}: 未定義のAgent（${a.agentId}）が割り当てられている`,
      );
    }
  }
});
