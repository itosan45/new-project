import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import { findPack } from "@/lib/data/domain-packs";
import { 項目を取り出す } from "@/lib/agents/doc/extract";

/**
 * Document Reader。
 *
 * 読み取り済みの全文から、指定された項目を取り出す。
 * 抽出規則は `ocr-excel/lib/抽出.py` を移したもの。
 *
 * この Agent は業種を知らない。**何を探すかはドメインパックが持つ。**
 * 「共通Agent × ドメインパック」を実際に動かしているのがここ。
 * 新しい業種が来たら足すのはパック1つで、この実装は触らない。
 *
 * 取れなかった必須項目があれば「人に回す」。
 * 空欄のまま完了にすると、読み違えたまま見積が作られる。
 */

export interface ExtractedDoc {
  ファイル名: string;
  項目: { field: string; 値: string; required: boolean; 取れたか: boolean }[];
  /** 取れなかった必須項目 */
  未取得の必須項目: string[];
}

export interface DocumentReaderOutput {
  書類: ExtractedDoc[];
  使ったパック: string;
  /** 自動で探せない項目。パックに探し方が書かれていないもの */
  自動化していない項目: string[];
}

export function readDocuments(
  documents: { ファイル名: string; 全文: string }[],
  packId: string,
): DocumentReaderOutput | { missing: string[] } {
  const pack = findPack(packId);
  if (!pack) return { missing: [`ドメインパック（${packId}）`] };
  if (documents.length === 0) return { missing: ["読み取り済みの書類"] };

  const 自動化していない項目 = pack.extractionFields
    .filter((f) => !f.kind)
    .map((f) => f.field);

  const 書類 = documents.map((doc) => {
    const 項目 = pack.extractionFields.map((f) => {
      const 値 = 項目を取り出す(f, doc.全文, doc.ファイル名);
      return {
        field: f.field,
        値,
        required: f.required,
        取れたか: 値.trim().length > 0,
      };
    });
    return {
      ファイル名: doc.ファイル名,
      項目,
      未取得の必須項目: 項目
        .filter((i) => i.required && !i.取れたか)
        .map((i) => i.field),
    };
  });

  return { 書類, 使ったパック: pack.name, 自動化していない項目 };
}

export const documentReaderAgent: AgentImpl = {
  agentId: "document-reader",
  run(ctx): AgentResult {
    const missing: string[] = [];
    if (!ctx.documents || ctx.documents.length === 0)
      missing.push("読み取り済みの全文（画像から文字を読むのは前の工程）");
    if (!ctx.packId) missing.push("ドメインパックの指定");
    if (missing.length > 0) return needsInput(missing, "自分");

    const result = readDocuments(ctx.documents!, ctx.packId!);
    if ("missing" in result) return needsInput(result.missing, "自分");

    const 要確認 = result.書類.filter((d) => d.未取得の必須項目.length > 0);
    const evidence = [
      `適用パック: ${result.使ったパック}`,
      `${result.書類.length}件を処理`,
      ...result.書類.map(
        (d) =>
          `${d.ファイル名}: ${d.項目.filter((i) => i.取れたか).length}/${d.項目.length}項目`,
      ),
    ];
    if (result.自動化していない項目.length > 0) {
      // できないことを黙らない。読み手が手当てを用意できなくなる
      evidence.push(
        `自動で探せない項目（人が入れる）: ${result.自動化していない項目.join("・")}`,
      );
    }

    if (要確認.length > 0) {
      return {
        status: "人に回す",
        summary: `${result.書類.length}件中${要確認.length}件で必須項目が取れませんでした`,
        output: result,
        evidence,
        reason: 要確認.map(
          (d) => `${d.ファイル名}: ${d.未取得の必須項目.join("・")} が取れていない`,
        ),
      };
    }

    return {
      status: "完了",
      summary: `${result.書類.length}件から必須項目を取り出しました`,
      output: result,
      evidence,
    };
  },
};
