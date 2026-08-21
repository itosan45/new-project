import assert from "node:assert/strict";
import test from "node:test";
import { MIKAWA_HOUSE, LUMIERE } from "@/lib/data/tenants";
import { startCase } from "@/lib/engine/pipeline";
import {
  pendingApprovalsOf,
  summarize,
  summarizeAgentActivity,
  summarizeByDay,
  type CaseRecord,
} from "@/lib/store/cases";

/**
 * 運用センター（/admin）が使う集計の検証。
 *
 * 表示する数字は必ずここを通す。固定値を置くと、案件が増えても
 * 減っても同じ数字が出続けて、誰も信じなくなる。
 */

function mikawaCase(): CaseRecord {
  return startCase({
    tenant: MIKAWA_HOUSE,
    title: "現場調査",
    description: "検証用",
    requestedBy: "テスト実行者",
    priority: "通常",
    documents: [
      {
        ファイル名: "現場調査票.txt",
        全文: [
          "調査日：2026年8月14日",
          "物件住所：静岡県浜松市中区〇〇1-2-3",
          "施主：田中 一郎 様",
          "被害箇所：床下",
          "被害程度：軽微",
          "施工面積：20㎡",
        ].join("\n"),
      },
    ],
  });
}

function lumiereCase(): CaseRecord {
  return startCase({
    tenant: LUMIERE,
    title: "問い合わせ対応",
    description: "配送が予定日を過ぎても届きません。困っています。",
    requestedBy: "テスト実行者",
    priority: "通常",
  });
}

test("pendingApprovalsOf: 複数の案件・複数のテナントにまたがる承認待ちを1つに平らにする", () => {
  const 三河 = mikawaCase();
  const ルミエール = lumiereCase();
  const pending = pendingApprovalsOf([三河, ルミエール]);

  assert.equal(pending.length, 2, "両方とも executor の承認手前で止まっているはず");
  for (const p of pending) {
    assert.ok(p.caseTitle, "どの案件の承認か分からない");
    assert.ok(p.caseRunId, "runIdが付いていない");
    assert.equal(p.status, "PENDING");
  }
});

test("summarizeAgentActivity: 実際に完了したAgentだけ completed が増える", () => {
  const 三河 = mikawaCase();
  const activity = summarizeAgentActivity([三河], 三河.run.startedAt.slice(0, 10));

  const docReader = activity.get("document-reader");
  assert.ok(docReader, "document-readerの実績が無い");
  assert.equal(docReader.completed, 1);
  assert.equal(docReader.completedToday, 1);
  assert.equal(docReader.totalSteps, 1);

  // validatorは契約だけ（実体が無い）。登場はするが完了はしない
  const validator = activity.get("validator");
  assert.ok(validator);
  assert.equal(validator.completed, 0);

  // 一度も登場しないAgentは、そもそもマップに入らない
  assert.equal(activity.get("web-brief"), undefined);
});

test("summarizeAgentActivity: 今日でない日付は completedToday に数えない", () => {
  const 三河 = mikawaCase();
  const 別の日 = "2000-01-01";
  const activity = summarizeAgentActivity([三河], 別の日);
  const docReader = activity.get("document-reader");
  assert.ok(docReader);
  assert.equal(docReader.completed, 1, "累計は今日と無関係に数える");
  assert.equal(docReader.completedToday, 0, "今日でない日付をcompletedTodayに数えている");
});

test("summarizeByDay: 日付ごとに件数と削減時間を分ける。架空の日を埋めない", () => {
  const 三河 = mikawaCase();
  const 過去の案件 = mikawaCase();
  過去の案件.run.startedAt = "2020-01-01T00:00:00.000Z";
  過去の案件.run.status = "SUCCEEDED";

  const daily = summarizeByDay([三河, 過去の案件], 20);

  assert.equal(daily.length, 2, "2日ぶんのはずが、埋められて増えている");
  assert.equal(daily[0].date, "2020-01-01", "日付順に並んでいない");
  assert.equal(daily[0].cases, 1);
  assert.equal(daily[0].hoursSaved, 20 / 60, "SUCCEEDEDの案件の削減時間が反映されていない");
  assert.equal(daily[1].cases, 1);
  assert.equal(daily[1].hoursSaved, 0, "HUMAN_REVIEWの案件を成果に数えている");
});

test("summarize: 承認待ちの件数は、複数案件をまたいで合計する", () => {
  const 三河 = mikawaCase();
  const ルミエール = lumiereCase();
  const stats = summarize([三河, ルミエール], 20);
  assert.equal(stats.total, 2);
  assert.equal(stats.pendingApprovals, 2);
});
