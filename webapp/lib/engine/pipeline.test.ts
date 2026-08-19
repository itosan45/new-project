import assert from "node:assert/strict";
import test from "node:test";
import { MIKAWA_HOUSE, LUMIERE, MIRAI_KAIKEI } from "@/lib/data/tenants";
import { ALL_AGENTS, findAgent } from "@/lib/data/agents";
import { findImpl } from "@/lib/agents/registry";
import { decideApproval, startCase } from "@/lib/engine/pipeline";

/**
 * 承認ゲートの検証。
 *
 * ここが壊れると、AIが承認なしに外部送信できる状態になる。
 * 他のどのテストより優先して通っている必要がある。
 */

function newCase(tenant: typeof MIKAWA_HOUSE) {
  return startCase({
    tenant,
    title: "テスト案件",
    description: "検証用",
    requestedBy: "テスト実行者",
    priority: "通常",
  });
}

test("実行系のAgentは、承認前に完了しない", () => {
  for (const tenant of [MIKAWA_HOUSE, LUMIERE]) {
    const record = newCase(tenant);

    const sideEffectSteps = record.run.steps.filter((s) => {
      const agent = findAgent(s.agentId);
      return (
        agent?.sideEffectClass === "SIDE_EFFECT" ||
        agent?.sideEffectClass === "IRREVERSIBLE"
      );
    });

    assert.ok(
      sideEffectSteps.length > 0,
      `${tenant.name}: 検証対象の実行系Agentが並びに存在しない`,
    );
    for (const s of sideEffectSteps) {
      assert.notEqual(
        s.status,
        "COMPLETED",
        `${tenant.name}: ${s.agentId} が承認前に完了している`,
      );
    }
  }
});

test("承認が要る案件は、成功ではなく要確認で止まる", () => {
  const record = newCase(LUMIERE);
  assert.equal(record.run.status, "HUMAN_REVIEW");
  assert.equal(
    record.approvals.filter((a) => a.status === "PENDING").length,
    1,
  );
});

test("承認要求には必ず理由が入る", () => {
  for (const tenant of [MIKAWA_HOUSE, LUMIERE]) {
    for (const a of newCase(tenant).approvals) {
      assert.ok(a.reason, `${tenant.name}: 理由のない承認要求が作られた`);
      assert.ok(
        tenant.approvalReasons.includes(a.reason),
        `${tenant.name}: その会社で発生しない承認理由が使われた（${a.reason}）`,
      );
    }
  }
});

test("承認しても、中身の無いAgentは実行されない", () => {
  // 承認＝実行ではない。ここを COMPLETED にすると
  // 「承認したので実行されたはず」という記録だけが残る
  const record = newCase(LUMIERE);
  const approvalId = record.approvals[0].approvalId;

  const after = decideApproval(record, approvalId, "APPROVED", "承認者");

  assert.equal(after.approvals[0].status, "APPROVED");
  assert.notEqual(after.run.status, "SUCCEEDED", "中身が無いのに成功になった");
  assert.equal(after.run.status, "PARTIAL_SUCCESS");
  assert.ok(
    after.run.steps.some((s) => s.status === "NOT_IMPLEMENTED"),
    "中身の無い工程が中身なしとして残っていない",
  );
});

test("差し戻すと、失敗ではなく未実行として残る", () => {
  const record = newCase(LUMIERE);
  const approvalId = record.approvals[0].approvalId;

  const after = decideApproval(record, approvalId, "REJECTED", "承認者");

  // ここを SUCCEEDED や FAILED にすると、
  // 「未実行を成功扱いした件数ゼロ」が守れなくなる
  assert.equal(after.run.status, "BLOCKED");
  assert.ok(
    after.run.steps.some((s) => s.status === "SKIPPED"),
    "差し戻したのに実行していない工程が残っていない",
  );
});

test("同じ承認を二度処理しても状態が動かない", () => {
  const record = newCase(LUMIERE);
  const approvalId = record.approvals[0].approvalId;

  const once = decideApproval(record, approvalId, "APPROVED", "承認者");
  const statusAfterFirst = once.run.status;
  const auditCount = once.audit.length;
  const twice = decideApproval(once, approvalId, "REJECTED", "別の人");

  assert.equal(twice.run.status, statusAfterFirst, "承認後に差し戻せてしまった");
  assert.notEqual(twice.run.status, "BLOCKED", "処理済みの承認が覆った");
  assert.equal(twice.audit.length, auditCount, "監査ログが二重に増えた");
});

test("承認が要らない案件でも、中身が無ければ成功にはならない", () => {
  // みらい会計は executor を持たない（実行系がない）
  assert.ok(
    !MIRAI_KAIKEI.requiredAgents.includes("executor"),
    "前提が変わっている：みらい会計に executor が入った",
  );
  const record = newCase(MIRAI_KAIKEI);
  assert.equal(record.approvals.length, 0, "止まる理由が無いはず");
  // 止まらないことと、仕事をしたことは別
  assert.equal(record.run.status, "PARTIAL_SUCCESS");
});

// ---------------------------------------------------------------------------
// 再発防止。
//
// 以前ここで、契約に書いた「得意なこと」を実績として記録していた。
// 処理をしていないのに、した記録が残る状態だった。
// ---------------------------------------------------------------------------

test("実体の無いAgentは、完了にならない", () => {
  const record = newCase(MIKAWA_HOUSE);
  for (const s of record.run.steps) {
    if (findImpl(s.agentId)) continue;
    assert.notEqual(
      s.status,
      "COMPLETED",
      `${s.agentId}: 中身が無いのに完了になっている`,
    );
  }
});

test("契約の「得意なこと」を、やった記録として書かない", () => {
  for (const tenant of [MIKAWA_HOUSE, MIRAI_KAIKEI, LUMIERE]) {
    const record = newCase(tenant);
    for (const e of record.audit) {
      if (!e.agentId) continue;
      const agent = findAgent(e.agentId);
      if (!agent || e.status !== "成功") continue;
      for (const skill of agent.expertise) {
        assert.ok(
          !e.action.includes(skill),
          `${tenant.name} / ${e.agentId}: 契約の文言が実績として記録されている（${skill}）`,
        );
      }
    }
  }
});

test("成功と記録されているのは、実体が動いたものだけ", () => {
  for (const tenant of [MIKAWA_HOUSE, MIRAI_KAIKEI, LUMIERE]) {
    for (const e of newCase(tenant).audit) {
      if (e.actorType !== "agent" || e.status !== "成功") continue;
      assert.ok(
        findImpl(e.agentId ?? ""),
        `${e.agentId}: 実体が無いのに成功として記録されている`,
      );
    }
  }
});

test("「動く」と書いてあるAgentには、必ず実体がある", () => {
  // ラベルだけ書き換えても通らないようにする
  for (const a of ALL_AGENTS) {
    if (a.maturity === "動く") {
      assert.ok(findImpl(a.agentId), `${a.agentId}: 「動く」だが実体が無い`);
    } else {
      assert.ok(
        !findImpl(a.agentId),
        `${a.agentId}: 実体があるのに「${a.maturity}」のまま`,
      );
    }
  }
});

test("案件には必ず tenantId と重複防止キーが入る", () => {
  const record = newCase(MIKAWA_HOUSE);
  assert.equal(record.run.tenantId, MIKAWA_HOUSE.tenantId);
  assert.ok(record.run.idempotencyKey.includes(MIKAWA_HOUSE.tenantId));
  for (const e of record.audit) {
    assert.equal(e.tenantId, MIKAWA_HOUSE.tenantId, "監査ログに別会社が混入");
  }
});
