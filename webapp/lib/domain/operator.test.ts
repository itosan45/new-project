import assert from "node:assert/strict";
import test from "node:test";
import { SOLO_LIMITS, checkCapacity, isTooDeep } from "@/lib/domain/operator";
import { AGENT_CONTRACTS } from "@/lib/data/agents";
import { INVASION_LEVELS } from "@/lib/domain/engagement";

/**
 * 一人で回す前提の検証。
 *
 * 人が増えたつもりの数字や、架空の担当者が混ざると、
 * 「誰かがやってくれる」ように見えてしまう。
 */

test("承認待ちが上限に達したら、受けられない状態になる", () => {
  const ok = checkCapacity({ pendingApprovals: 0, activeEngagements: 0 });
  assert.ok(ok.every((c) => !c.full));

  const full = checkCapacity({
    pendingApprovals: SOLO_LIMITS.maxPendingApprovals,
    activeEngagements: 0,
  });
  assert.equal(full.find((c) => c.label === "承認待ち")?.full, true);
});

test("上限には、超えたときに何が起きるかが必ず書いてある", () => {
  // 数字だけ見せても、止めるべきかどうか判断できない
  for (const c of checkCapacity({ pendingApprovals: 1, activeEngagements: 1 })) {
    assert.ok(c.consequence.trim().length > 0, `${c.label}: 結果が書かれていない`);
  }
});

test("一人のうちは、業務システムに書き込む仕事を受けない", () => {
  assert.equal(isTooDeep("L2"), false);
  assert.equal(isTooDeep("L3"), true, "L3を受けられることになっている");
  assert.equal(isTooDeep("L4"), true);
});

test("上限の侵襲度は、実在する段である", () => {
  assert.ok(SOLO_LIMITS.maxInvasionLevel in INVASION_LEVELS);
});

test("架空の担当者を置かない", () => {
  // 人間は自分1人しかいない。名前が並んでいると、
  // 誰かに任せられるように見えてしまう
  const allowed = new Set(["自分", "秘書"]);
  for (const a of AGENT_CONTRACTS) {
    assert.ok(
      allowed.has(a.owner),
      `${a.agentId}: 存在しない担当者が設定されている（${a.owner}）`,
    );
  }
});
