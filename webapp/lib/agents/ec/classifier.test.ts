import assert from "node:assert/strict";
import test from "node:test";
import { classifierAgent, classify } from "@/lib/agents/ec/classifier";
import { ECOMMERCE_PACK } from "@/lib/data/domain-packs";

/**
 * Classifier の検証。
 *
 * 一番大事なのは「感情の強さ・緊急度で、根拠のない実数を作らないこと」。
 * 区分（強い／通常、最優先／通常）に振り分けるところまでが仕事。
 */

test("配送の問い合わせを、配送区分・通常の緊急度に振り分ける", () => {
  const r = classify(
    "配送が予定日を過ぎても届きません。追跡番号も分からず困っています。",
    ECOMMERCE_PACK.packId,
  );
  assert.ok(!("missing" in r));
  if ("missing" in r) return;
  const 区分 = Object.fromEntries(r.区分.map((i) => [i.field, i.値]));
  assert.equal(区分["問い合わせ区分"], "配送");
  assert.equal(区分["緊急度"], "通常");
  assert.equal(区分["感情の強さ"], "通常");
});

test("肌トラブルの訴えは、品質区分・最優先の緊急度になる", () => {
  const r = classify(
    "商品を使ったら肌が荒れてしまいました。すぐに確認してください。",
    ECOMMERCE_PACK.packId,
  );
  if ("missing" in r) throw new Error("パックが引けない");
  const 区分 = Object.fromEntries(r.区分.map((i) => [i.field, i.値]));
  assert.equal(区分["問い合わせ区分"], "品質");
  assert.equal(区分["緊急度"], "最優先", "肌トラブルの訴えは最優先のはず");
});

test("強い苦情の言葉があれば、感情の強さが「強い」になる", () => {
  const r = classify(
    "本当に最悪です。二度と買いません。",
    ECOMMERCE_PACK.packId,
  );
  if ("missing" in r) throw new Error("パックが引けない");
  const 区分 = Object.fromEntries(r.区分.map((i) => [i.field, i.値]));
  assert.equal(区分["感情の強さ"], "強い");
  // 0〜1のような実数をどこにも作っていないことの確認
  for (const i of r.区分) {
    assert.doesNotMatch(i.値, /^0?\.\d+$/, `${i.field}: 根拠のない実数になっている`);
  }
});

test("どの区分の手がかりにも当たらなければ、空欄のまま人に回す", () => {
  const r = classifierAgent.run({
    request: "先日はありがとうございました。",
    packId: ECOMMERCE_PACK.packId,
  });
  assert.equal(r.status, "人に回す", "「その他」と決めつけて完了にしてしまっている");
  if (r.status !== "人に回す") return;
  assert.ok(r.reason.length > 0, "理由が空");
  assert.match(r.reason[0], /問い合わせ区分/);
});

test("すべて区分できれば完了になる", () => {
  const r = classifierAgent.run({
    request: "返品したいです。注文番号は12345です。",
    packId: ECOMMERCE_PACK.packId,
  });
  assert.equal(r.status, "完了");
});

test("対象テキストが無ければ止まる", () => {
  const r = classifierAgent.run({ packId: ECOMMERCE_PACK.packId });
  assert.equal(r.status, "入力が足りない");
});

test("パックの指定が無ければ止まる", () => {
  const r = classifierAgent.run({ request: "配送が遅れています" });
  assert.equal(r.status, "入力が足りない");
});

test("Classifierは業種を知らない。パックが変われば見る項目も変わる", () => {
  // Document Reader と同じ「共通Agent × ドメインパック」の確認。
  // ECの項目名がハードコードされていれば、このテストで気づく
  const r = classify("何か問い合わせ", "construction");
  if ("missing" in r) throw new Error("パックが引けない");
  const 項目名 = r.区分.map((i) => i.field);
  assert.ok(!項目名.includes("問い合わせ区分"), "ECの項目が混ざっている");
  assert.ok(項目名.includes("調査日"), "建設パックの項目が見えていない");
});
