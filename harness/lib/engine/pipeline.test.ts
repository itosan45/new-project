import assert from "node:assert/strict";
import test from "node:test";
import { MIKAWA_HOUSE, LUMIERE, MIRAI_KAIKEI } from "@/lib/data/tenants";
import { findAgent } from "@/lib/data/agents";
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

test("承認すると、止まっていた工程が完了して成功になる", () => {
  const record = newCase(LUMIERE);
  const approvalId = record.approvals[0].approvalId;

  const after = decideApproval(record, approvalId, "APPROVED", "承認者");

  assert.equal(after.run.status, "SUCCEEDED");
  assert.ok(
    after.run.steps.every((s) => s.status === "COMPLETED"),
    "承認後に未完了の工程が残っている",
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
  const auditCount = once.audit.length;
  const twice = decideApproval(once, approvalId, "REJECTED", "別の人");

  assert.equal(twice.run.status, "SUCCEEDED", "承認後に差し戻せてしまった");
  assert.equal(twice.audit.length, auditCount, "監査ログが二重に増えた");
});

test("承認が要らない案件は、止まらずに完了する", () => {
  // みらい会計は executor を持たない（実行系がない）
  assert.ok(
    !MIRAI_KAIKEI.requiredAgents.includes("executor"),
    "前提が変わっている：みらい会計に executor が入った",
  );
  const record = newCase(MIRAI_KAIKEI);
  assert.equal(record.run.status, "SUCCEEDED");
  assert.equal(record.approvals.length, 0);
});

test("案件には必ず tenantId と重複防止キーが入る", () => {
  const record = newCase(MIKAWA_HOUSE);
  assert.equal(record.run.tenantId, MIKAWA_HOUSE.tenantId);
  assert.ok(record.run.idempotencyKey.includes(MIKAWA_HOUSE.tenantId));
  for (const e of record.audit) {
    assert.equal(e.tenantId, MIKAWA_HOUSE.tenantId, "監査ログに別会社が混入");
  }
});
