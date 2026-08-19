import assert from "node:assert/strict";
import test from "node:test";
import { emptyBrief, type WebBrief } from "@/lib/domain/web-project";
import { webBriefAgent } from "@/lib/agents/web/brief";
import { webIaAgent } from "@/lib/agents/web/ia";
import { webEstimateAgent } from "@/lib/agents/web/estimate";
import { webMeasureAgent } from "@/lib/agents/web/measure";
import { webPreflightAgent } from "@/lib/agents/web/preflight";
import { webProposalAgent } from "@/lib/agents/web/proposal";
import { runWebRequest } from "@/lib/engine/web-pipeline";
import { WEB_AGENTS } from "@/lib/data/web-agents";
import { BASE_DAYS, PER_PAGE_DAYS } from "@/lib/data/web-rates";

/**
 * Web制作Agentの検証。
 *
 * 一番大事なのは「入力が無いときに、それらしい出力を出さないこと」。
 * 蓋を開けたら何も決まっていないのに動いてしまう、を防ぐ。
 */

function fullBrief(): WebBrief {
  const b = emptyBrief();
  b.goal.value = "問い合わせを増やす";
  b.persona.value = "50代の戸建て所有者。スマホで夜に見る";
  b.primaryAction.value = "フォームから問い合わせ";
  b.hosting.value = "Vercel";
  b.domain.value = "取得済み（example.co.jp）";
  b.buildStyle.value = "雛形を調整";
  b.pages.value = ["トップ", "サービス", "実績", "お問い合わせ"];
  b.content.value = "文章はこちらで作成、写真は先方支給";
  b.motion.value = "軽く動かす";
  b.chat.value = "置かない";
  b.form.value = "info@example.co.jp";
  b.measurement.value = "いまは月3件";
  b.updates.value = "先方が月1回";
  b.deadline.value = "2026-10-01";
  b.budget.value = "50万円前後";
  b.existingSite.value = "新規";
  b.snsLinks.value = ["Instagram"];
  b.lineAccount.value = "あり";
  return b;
}

// --- ヒアリング設計 --------------------------------------------------------

test("ヒアリング設計: 何も決まっていなければ、18項目すべてを聞く", () => {
  const r = webBriefAgent.run({ brief: emptyBrief() });
  assert.equal(r.status, "完了");
  if (r.status !== "完了") return;
  const out = r.output as { totalCount: number; answeredCount: number };
  assert.equal(out.answeredCount, 0);
  assert.equal(out.totalCount, 18);
});

test("ヒアリング設計: 見積を止める項目から先に聞く", () => {
  const r = webBriefAgent.run({ brief: emptyBrief() });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as {
    rounds: { round: string; questions: { blocksEstimate: boolean }[] }[];
  };
  const first = out.rounds[0];
  assert.equal(first.round, "1回目");
  assert.equal(
    first.questions[0].blocksEstimate,
    true,
    "見積を止めない質問が先頭に来ている",
  );
});

test("ヒアリング設計: 全部埋まっていれば、見積を止めるものは無くなる", () => {
  const r = webBriefAgent.run({ brief: fullBrief() });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { blockingEstimate: unknown[] };
  assert.equal(out.blockingEstimate.length, 0);
});

test("ヒアリング設計: 設計内容そのものが無ければ止まる", () => {
  const r = webBriefAgent.run({});
  assert.equal(r.status, "入力が足りない");
});

// --- 情報設計 --------------------------------------------------------------

test("情報設計: 狙いが決まっていなければ構成を出さない", () => {
  const r = webIaAgent.run({ brief: emptyBrief() });
  assert.equal(r.status, "入力が足りない");
  if (r.status !== "入力が足りない") return;
  assert.ok(r.missing.some((m) => m.includes("goal")));
  assert.ok(r.missing.some((m) => m.includes("primaryAction")));
});

test("情報設計: 揃っていれば構成を出し、根拠も返す", () => {
  const r = webIaAgent.run({ brief: fullBrief() });
  assert.equal(r.status, "完了");
  if (r.status !== "完了") return;
  assert.ok(r.evidence.length > 0, "根拠が空");
  const out = r.output as { pages: unknown[]; actionLabel: string };
  assert.equal(out.pages.length, 4, "指定したページ数と合っていない");
  assert.notEqual(out.actionLabel, "お問い合わせ", "何が起きるか分からない文言");
});

test("情報設計: 指定されたページに、噛み合わない用途を貼らない", () => {
  // 並び順で用途を割り当てると「ご依頼の流れ → 連絡する」のような
  // 意味の通らない出力になる。実際に出た
  const b = fullBrief();
  b.pages.value = ["トップ", "業務案内", "中継輸送", "ご依頼の流れ", "会社概要", "採用情報", "お問い合わせ"];
  const r = webIaAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { pages: { name: string; purpose: string }[] };
  const byName = Object.fromEntries(out.pages.map((p) => [p.name, p.purpose]));
  assert.notEqual(byName["ご依頼の流れ"], "連絡する", "順番で用途を貼っている");
  assert.match(byName["ご依頼の流れ"], /次に何が起きる/);
  assert.match(byName["採用情報"], /働く/);
  assert.match(byName["お問い合わせ"], /連絡/);
});

test("情報設計: 見当のつかないページ名は、分からないと言う", () => {
  // 推測で埋めると、それらしい嘘の構成ができる
  const b = fullBrief();
  b.pages.value = ["トップ", "ほげほげ"];
  const r = webIaAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { pages: { name: string; purpose: string }[] };
  assert.equal(out.pages[1].purpose, "（用途を確認する）");
});

test("情報設計: 電話が主導線なら、受付時間を書くよう指示する", () => {
  const b = fullBrief();
  b.primaryAction.value = "電話をかける";
  const r = webIaAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { actionPlacement: string[] };
  assert.ok(
    out.actionPlacement.some((p) => p.includes("受付時間")),
    "時間外にかけて出ないと、その1件は二度と来ない",
  );
});

// --- 見積根拠 --------------------------------------------------------------

test("見積根拠: 仕様が決まっていなければ数字を出さない", () => {
  const r = webEstimateAgent.run({ brief: emptyBrief() });
  assert.equal(r.status, "入力が足りない");
  if (r.status !== "入力が足りない") return;
  assert.ok(r.missing.length >= 5, "足りない項目が列挙されていない");
});

test("見積根拠: 単価表どおりに積み上がる", () => {
  const r = webEstimateAgent.run({ brief: fullBrief() });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 合計人日: number; 内訳: { 人日: number }[] };
  // 土台3 + ページ追加3×0.5 + 文章4×0.5 + 動き1 = 7.5
  const expected = BASE_DAYS.雛形を調整 + 3 * PER_PAGE_DAYS + 4 * 0.5 + 1;
  assert.equal(out.合計人日, expected);
  assert.equal(
    out.内訳.reduce((s, l) => s + l.人日, 0),
    out.合計人日,
    "内訳の合計と総額が合っていない",
  );
});

test("見積根拠: 合計だけでなく内訳と崩れる条件を返す", () => {
  const r = webEstimateAgent.run({ brief: fullBrief() });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 内訳: unknown[]; 崩れる条件: string[] };
  assert.ok(out.内訳.length >= 3);
  assert.ok(out.崩れる条件.length > 0, "再見積の線引きが無い");
  assert.ok(
    r.evidence.some((e) => e.includes("金額は決めていない")),
    "金額を決めない旨が根拠に無い",
  );
});

// --- 計測設計 --------------------------------------------------------------

test("計測設計: 基準値が無ければ止まる", () => {
  const b = fullBrief();
  b.measurement.value = "";
  const r = webMeasureAgent.run({ brief: b });
  assert.equal(r.status, "入力が足りない", "基準値なしで計測設計が通った");
});

test("計測設計: 電話が主導線なら、数えられない問題を指摘する", () => {
  const b = fullBrief();
  b.primaryAction.value = "電話をかける";
  const r = webMeasureAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 注意: string[] };
  assert.ok(out.注意.some((n) => n.includes("数えられない")));
});

test("計測設計: アクセス数を成果として扱わない", () => {
  const r = webMeasureAgent.run({ brief: fullBrief() });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 数えるもの: string; 注意: string[] };
  assert.ok(!out.数えるもの.includes("アクセス"));
  assert.ok(out.注意.some((n) => n.includes("アクセス数は成果ではない")));
});

// --- 公開前チェック --------------------------------------------------------

test("公開前チェック: フォームの送信先が無ければ公開させない", () => {
  const b = fullBrief();
  b.form.value = "";
  const r = webPreflightAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 公開してよいか: string; 止めている理由: string[] };
  assert.equal(out.公開してよいか, "公開できない");
  assert.ok(out.止めている理由[0].includes("誰にも届かない"));
});

test("公開前チェック: 置き場所が決まっていなければ判定しない", () => {
  const b = fullBrief();
  b.hosting.value = "未定";
  const r = webPreflightAgent.run({ brief: b });
  assert.equal(r.status, "入力が足りない");
});

test("公開前チェック: 作り直しならURLの対応表を要求する", () => {
  const b = fullBrief();
  b.existingSite.value = "既存サイトの作り直し";
  const r = webPreflightAgent.run({ brief: b });
  if (r.status !== "完了") throw new Error("完了しなかった");
  const out = r.output as { 公開前にやること: string[] };
  assert.ok(out.公開前にやること.some((x) => x.includes("対応表")));
});

// --- 提案書（成果物の出口） ------------------------------------------------

test("提案書: 前のAgentが動いていなければ作らない", () => {
  // 情報設計も工数も無いのに、それらしい提案書を作ってはいけない
  const r = webProposalAgent.run({ brief: fullBrief(), prior: {} });
  assert.equal(r.status, "入力が足りない");
});

test("提案書: 未確定が残っていれば、顧客に出せないと判定する", () => {
  const b = fullBrief();
  b.deadline.value = "";      // 公開希望日が未定
  b.updates.value = "";       // 更新の担当が未定
  const req = runWebRequest({
    clientName: "テスト運送",
    summary: "作り直したい",
    brief: b,
  });
  const d = req.deliverables[0];
  assert.ok(d, "成果物が出ていない");
  assert.equal(d.readyForClient, false);
  assert.ok(d.undecided.length >= 2, "未確定が数えられていない");
  assert.match(d.content, /未確定/);
});

test("提案書: 用途の分からないページが残っていたら、出せないと判定する", () => {
  // 「（用途を確認する）」を載せたまま顧客に出すと、その欄でそのまま揉める
  const b = fullBrief();
  b.pages.value = ["トップ", "ほげほげ"];
  const req = runWebRequest({ clientName: "テスト運送", summary: "新規", brief: b });
  const d = req.deliverables[0];
  assert.ok(d);
  assert.equal(d.readyForClient, false);
  assert.ok(
    d.undecided.some((u) => u.includes("ほげほげ")),
    "用途の分からないページが未確定に入っていない",
  );
});

test("提案書: 顧客名が入る", () => {
  const req = runWebRequest({
    clientName: "株式会社テスト運送",
    summary: "作り直したい",
    brief: fullBrief(),
  });
  const d = req.deliverables[0];
  assert.ok(d);
  assert.match(d.content, /株式会社テスト運送/);
  assert.ok(!d.content.includes("（顧客名）"), "顧客名が空のまま出ている");
});

test("提案書: 金額を書かない", () => {
  // いくらで売るかは人が決める
  const req = runWebRequest({
    clientName: "テスト運送",
    summary: "作り直したい",
    brief: fullBrief(),
  });
  const d = req.deliverables[0];
  assert.ok(d);
  assert.ok(!/円|¥/.test(d.content), "提案書に金額が書かれている");
  assert.match(d.content, /やらないこと/);
});

test("成果物には保存先のパスが付く", () => {
  // 「どこから出てくるのか」に答えられる状態にする
  const req = runWebRequest({
    clientName: "テスト運送",
    summary: "作り直したい",
    brief: fullBrief(),
  });
  const d = req.deliverables[0];
  assert.ok(d);
  assert.match(d.path, /^deliverables\//);
  assert.ok(d.path.includes(req.requestId));
  assert.ok(d.content.length > 500, "中身が薄い");
});

// --- 経験 ------------------------------------------------------------------

test("ベテランを名乗るなら、判断基準と地雷が入っている", () => {
  for (const a of WEB_AGENTS) {
    if (a.experience?.level !== "ベテラン") continue;
    assert.ok(a.experience.judgment.length > 0, `${a.agentId}: 判断基準が空`);
    assert.ok(a.experience.traps.length > 0, `${a.agentId}: 地雷が空`);
  }
});

test("いまの標準には、必ず確認日が入っている", () => {
  // 日付の無いトレンド情報は、去年の常識で提案する原因になる
  for (const a of WEB_AGENTS) {
    for (const p of a.experience?.currentPractice ?? []) {
      assert.ok(
        /^\d{4}-\d{2}-\d{2}$/.test(p.確認日),
        `${a.agentId}: 確認日が無いか形式が違う（${p.項目}）`,
      );
    }
  }
});

test("判断を伴うAgentには、経験が入っている", () => {
  for (const a of WEB_AGENTS) {
    if (a.maturity !== "動く") continue;
    assert.ok(a.experience, `${a.agentId}: 動くのに経験が無い`);
  }
});
