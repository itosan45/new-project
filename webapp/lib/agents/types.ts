import type { WebBrief } from "@/lib/domain/web-project";

/**
 * Agentの実体。
 *
 * ここが今までの穴だった。契約（何をしてよいか）だけがあって、
 * 中身が無いのに「実装済み」と表示していた。
 *
 * この形にした理由はひとつで、
 * **入力が揃っていないAgentを動かさない**ため。
 *
 * 蓋を開けたら何も定義されていないのに動いてしまい、
 * それらしい出力が出てくる、という状態を作らない。
 * 足りないときは「足りない」と言って止まる。推測で埋めない。
 */

export interface AgentContext {
  /** Web制作案件の設計内容。分野が違えばここが変わる。 */
  brief?: WebBrief;
  /** 自由記述の依頼文 */
  request?: string;
  /** 顧客名。成果物に載る */
  clientName?: string;
  /**
   * 読み取り済みの書類。
   *
   * 画像から文字を読むのはここではない（スキャナやGoogleドライブ側）。
   * 受け取るのは全文。ocr-excel も同じ前提。
   */
  documents?: { ファイル名: string; 全文: string }[];
  /** どのドメインパックを使うか。何を探すかはパックが持つ */
  packId?: string;
  /**
   * 前のAgentが出したもの。agentId をキーにする。
   *
   * 受け渡しの順番（WEB_HANDOFF）は定義してあったのに、
   * 実際には何も渡していなかった。5体が独立に動いているだけだった。
   * ここを通すことで、後ろのAgentが前の結果を使って組み立てられる。
   */
  prior?: Record<string, unknown>;
}

export type AgentResult =
  | {
      status: "完了";
      /** 何をしたか。1行。 */
      summary: string;
      /** 出力。型はAgentごとに違う。 */
      output: unknown;
      /** そう判断した根拠。根拠を出せない出力は返さない。 */
      evidence: string[];
    }
  | {
      status: "入力が足りない";
      /** 何が足りないか。項目名で返す。 */
      missing: string[];
      /** 誰に聞けばよいか */
      askWho: "顧客" | "自分";
      summary: string;
    }
  | {
      /**
       * 処理はできたが、人が見ないと先に進めない。
       *
       * 「入力が足りない」とは別物。入力はあり、出力も出ている。
       * ただし必須項目が取れなかった・値が疑わしい、といった理由で
       * そのまま次の工程に渡してはいけない状態。
       *
       * これを「完了」に混ぜると、読み違えたまま見積が作られる。
       */
      status: "人に回す";
      summary: string;
      output: unknown;
      evidence: string[];
      /** なぜ人に回すのか */
      reason: string[];
    }
  | {
      status: "未実装";
      summary: string;
    };

export interface AgentImpl {
  agentId: string;
  /** 実際に処理する。入力が足りなければ、その旨を返して止まる。 */
  run(ctx: AgentContext): AgentResult;
}

/** 入力不足を組み立てるための共通処理。 */
export function needsInput(
  missing: string[],
  askWho: "顧客" | "自分" = "顧客",
): AgentResult {
  return {
    status: "入力が足りない",
    missing,
    askWho,
    summary: `${missing.length}件が未回答のため実行していません`,
  };
}
