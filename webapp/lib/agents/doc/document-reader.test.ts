import assert from "node:assert/strict";
import test from "node:test";
import { documentReaderAgent, readDocuments } from "@/lib/agents/doc/document-reader";
import { ACCOUNTING_PACK, CONSTRUCTION_PACK } from "@/lib/data/domain-packs";

/**
 * Document Reader の検証。
 *
 * 一番大事なのは「取れなかったのに完了にしないこと」。
 * 空欄のまま次へ渡すと、読み違えたまま見積が作られる。
 */

const 領収書 = {
  ファイル名: "領収書01.jpg",
  全文: [
    "領収書",
    "発行日 2026年8月12日",
    "宛名: 山田太郎 様",
    "但し: 事務用品代として",
    "発行元: 株式会社サンプル商会",
    "小計 3,000円",
    "消費税 300円",
    "合計 ¥3,300",
    "TEL 03-1234-5678",
  ].join("\n"),
};

test("領収書から日付・金額・宛名を取り出せる", () => {
  const r = readDocuments([領収書], ACCOUNTING_PACK.packId);
  assert.ok(!("missing" in r));
  if ("missing" in r) return;
  const 項目 = Object.fromEntries(r.書類[0].項目.map((i) => [i.field, i.値]));
  assert.equal(項目["取引日"], "2026-08-12");
  assert.equal(項目["合計金額"], "3300", "小計ではなく合計を採るべき");
  assert.equal(項目["取引先名"], "株式会社サンプル商会");
  assert.equal(項目["但し書き"], "事務用品代として");
});

test("短い手がかりは、長い語に食われる（既知の落とし穴）", () => {
  // 「発行」を手がかりにすると「発行日 2026年8月12日」に当たり、
  // 取引先名の欄に日付が入る。パック側は長めの語にしてある
  const 手がかりが短い = readDocuments(
    [{ ファイル名: "x.jpg", 全文: "発行日 2026年8月12日\n発行元: 株式会社サンプル商会" }],
    ACCOUNTING_PACK.packId,
  );
  if ("missing" in 手がかりが短い) throw new Error("パックが引けない");
  const 取引先 = 手がかりが短い.書類[0].項目.find((i) => i.field === "取引先名");
  assert.equal(取引先?.値, "株式会社サンプル商会", "日付を拾ってしまっている");
});

test("必須項目が取れなければ、完了ではなく人に回す", () => {
  const r = documentReaderAgent.run({
    documents: [{ ファイル名: "白紙.jpg", 全文: "かすれていて読めません" }],
    packId: ACCOUNTING_PACK.packId,
  });
  assert.equal(r.status, "人に回す");
  if (r.status !== "人に回す") return;
  assert.ok(r.reason.length > 0, "理由が空");
  assert.match(r.reason[0], /取れていない/);
});

test("すべて取れれば完了になる", () => {
  const 全部ある = {
    ファイル名: "調査票01.jpg",
    全文: [
      "現場調査票",
      "調査日 令和8年8月14日",
      "住所: 愛知県豊橋市1-2-3",
      "施主: 佐藤花子 様",
      "被害箇所: 床下",
      "被害程度: 中程度",
      "施工面積: 32㎡",
      "概算金額 480,000円",
    ].join("\n"),
  };
  const r = documentReaderAgent.run({
    documents: [全部ある],
    packId: CONSTRUCTION_PACK.packId,
  });
  assert.equal(r.status, "完了", "必須が揃っているのに完了になっていない");
  if (r.status !== "完了") return;
  const out = r.output as { 書類: { 項目: { field: string; 値: string }[] }[] };
  const 項目 = Object.fromEntries(out.書類[0].項目.map((i) => [i.field, i.値]));
  assert.equal(項目["調査日"], "2026-08-14", "令和が西暦になっていない");
  assert.equal(項目["施主名"], "佐藤花子", "敬称が落ちていない");
});

test("書類が渡っていなければ止まる。空で読んだことにしない", () => {
  const r = documentReaderAgent.run({ packId: ACCOUNTING_PACK.packId });
  assert.equal(r.status, "入力が足りない");
});

test("パックの指定が無ければ止まる", () => {
  const r = documentReaderAgent.run({ documents: [領収書] });
  assert.equal(r.status, "入力が足りない");
});

test("業種が変われば、探す項目も変わる（Agentは同じ）", () => {
  // 「共通Agent × ドメインパック」が効いていることの確認
  const 建設 = readDocuments([領収書], CONSTRUCTION_PACK.packId);
  const 会計 = readDocuments([領収書], ACCOUNTING_PACK.packId);
  if ("missing" in 建設 || "missing" in 会計) throw new Error("パックが引けない");
  const 建設項目 = 建設.書類[0].項目.map((i) => i.field);
  const 会計項目 = 会計.書類[0].項目.map((i) => i.field);
  assert.notDeepEqual(建設項目, 会計項目);
  assert.ok(建設項目.includes("施工面積"));
  assert.ok(会計項目.includes("インボイス番号"));
});

test("自動で探せない項目は、探せないと言う", () => {
  // 黙って空欄にすると、運用側で手当てを用意できない
  const r = documentReaderAgent.run({
    documents: [領収書],
    packId: ACCOUNTING_PACK.packId,
  });
  if (r.status === "入力が足りない" || r.status === "未実装") throw new Error("止まった");
  assert.ok(
    r.evidence.some((e) => e.includes("自動で探せない項目")),
    "税抜金額・消費税額など、探し方の無い項目が申告されていない",
  );
});
