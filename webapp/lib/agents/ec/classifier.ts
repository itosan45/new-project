import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import { findPack } from "@/lib/data/domain-packs";
import { 項目を取り出す } from "@/lib/agents/doc/extract";

/**
 * Classifier。
 *
 * 問い合わせ・案件の本文を、ドメインパックが定義した区分に振り分ける。
 * Document Reader と同じ「共通Agent × ドメインパック」の考え方で、
 * 探し方の実体（項目を取り出す）も同じものを使う。違うのは入力の形だけ。
 * Document Reader は複数の書類（ファイル名＋全文）を受け取るが、
 * Classifier は1件のテキスト（問い合わせ本文）を受け取る。
 *
 * 契約の notSuitableFor が「感情の強さの最終判断ではなく検知までが担当」
 * と書いてある通り、連続値（0〜1のような実数）は作らない。
 * 区分（例：強い／通常）に振り分けるところまでが仕事。
 */

export interface ClassificationResult {
  区分: { field: string; 値: string; required: boolean; 取れたか: boolean }[];
  使ったパック: string;
  /** 自動で探せない項目。パックに探し方が書かれていないもの */
  自動化していない項目: string[];
}

export function classify(
  request: string,
  packId: string,
): ClassificationResult | { missing: string[] } {
  const pack = findPack(packId);
  if (!pack) return { missing: [`ドメインパック（${packId}）`] };
  if (!request.trim()) return { missing: ["対象テキスト（問い合わせの本文）"] };

  const 自動化していない項目 = pack.extractionFields
    .filter((f) => !f.kind)
    .map((f) => f.field);

  const 区分 = pack.extractionFields.map((f) => {
    const 値 = 項目を取り出す(f, request);
    return {
      field: f.field,
      値,
      required: f.required,
      取れたか: 値.trim().length > 0,
    };
  });

  return { 区分, 使ったパック: pack.name, 自動化していない項目 };
}

export const classifierAgent: AgentImpl = {
  agentId: "classifier",
  run(ctx): AgentResult {
    const missing: string[] = [];
    if (!ctx.request || !ctx.request.trim())
      missing.push("対象テキスト（問い合わせの本文）");
    if (!ctx.packId) missing.push("ドメインパックの指定");
    if (missing.length > 0) return needsInput(missing, "自分");

    const result = classify(ctx.request!, ctx.packId!);
    if ("missing" in result) return needsInput(result.missing, "自分");

    const 未取得 = result.区分.filter((r) => r.required && !r.取れたか);
    const evidence = [
      `適用パック: ${result.使ったパック}`,
      ...result.区分
        .filter((r) => r.取れたか)
        .map((r) => `${r.field}: ${r.値}`),
    ];
    if (result.自動化していない項目.length > 0) {
      // できないことを黙らない。読み手が手当てを用意できなくなる
      evidence.push(
        `自動で探せない項目（人が判断する）: ${result.自動化していない項目.join("・")}`,
      );
    }

    if (未取得.length > 0) {
      return {
        status: "人に回す",
        summary: `必須項目のうち${未取得.length}件（${未取得
          .map((r) => r.field)
          .join("・")}）を区分できませんでした`,
        output: result,
        evidence,
        reason: 未取得.map(
          (r) => `${r.field} がどの区分にも当てはまらなかった`,
        ),
      };
    }

    return {
      status: "完了",
      summary: `${result.区分.filter((r) => r.取れたか).length}/${result.区分.length}項目を区分しました`,
      output: result,
      evidence,
    };
  },
};
