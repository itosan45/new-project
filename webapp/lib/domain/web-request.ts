import type { WebBrief } from "@/lib/domain/web-project";

/**
 * ダッシュボードから出す依頼。
 *
 * これが無いと、依頼は秘書（人）に口頭で伝わるだけで、
 * **Agentが1体も動かないまま秘書が全部やってしまう。**
 * 実際にそうなっていた。仕組みとして通す口を用意する。
 *
 * 1依頼 = 1ファイル。Agentが返したものをそのまま残す。
 * 「何が足りないか」も記録に残す。次の打ち合わせの議題になる。
 */

export interface AgentRunResult {
  agentId: string;
  agentName: string;
  status: "完了" | "入力が足りない" | "人に回す" | "未実装";
  summary: string;
  evidence: string[];
  /** 入力が足りないとき、何が足りないか */
  missing?: string[];
  /** 誰に聞けばよいか */
  askWho?: "顧客" | "自分";
  output?: unknown;
}

/**
 * 成果物。
 *
 * ハーネスから実際に出てくるもの。これまでは記録しか出しておらず、
 * 実物は秘書が手で作って、エンジンの外に置いていた。
 */
/**
 * 成果物の種類。
 *
 * ホームページの仕事は、着工前に**モック**を出して合意を取る。
 * モックはURLやHTMLで渡さない。相手はURLを見て「これは公開されたのか」と
 * 迷うし、リンクは切れる。画像かPDFで渡すと、そのまま社内で回覧できる。
 */
export type DeliverableKind = "提案書" | "モック" | "議事録" | "見積" | "その他";

export type DeliverableFormat = "md" | "pdf" | "png" | "jpg" | "html";

/** 顧客にそのまま送れる形式かどうか。 */
export function isSendable(f: DeliverableFormat): boolean {
  return f === "pdf" || f === "png" || f === "jpg";
}

export interface Deliverable {
  fileName: string;
  /** 保存先。リポジトリ上のパス */
  path: string;
  kind: DeliverableKind;
  format: DeliverableFormat;
  /** 文字の成果物。画像・PDFのときは空 */
  content?: string;
  /** 画像・PDFのとき。base64 */
  base64?: string;
  /** バイト数 */
  bytes: number;
  /** 顧客に出せる状態か */
  readyForClient: boolean;
  /** 出せない理由 */
  undecided: string[];
  /** 誰が作ったか */
  byAgent: string;
  createdAt: string;
}

export interface WebRequest {
  requestId: string;
  clientName: string;
  /** 今あるサイト */
  siteUrl?: string;
  /** 依頼の内容。相手の言葉のまま */
  summary: string;
  brief: WebBrief;
  createdAt: string;
  results: AgentRunResult[];
  /** できあがったもの。Agentが出せなければ空 */
  deliverables: Deliverable[];
}

/** 依頼ぜんたいの状態。Agentの結果から決まる。 */
export type WebRequestState = "進められる" | "聞くことがある" | "手が止まる";

export function stateOf(req: WebRequest): WebRequestState {
  const 足りない = req.results.filter((r) => r.status === "入力が足りない");
  if (足りない.length === 0) return "進められる";
  // 自分の手落ちで止まっているなら、聞く相手は自分
  return 足りない.some((r) => r.askWho === "顧客")
    ? "聞くことがある"
    : "手が止まる";
}

/** 顧客に聞くべきことを、依頼ぜんたいから集める。 */
export function questionsForClient(req: WebRequest): string[] {
  const seen = new Set<string>();
  for (const r of req.results) {
    if (r.status !== "入力が足りない" || r.askWho !== "顧客") continue;
    for (const m of r.missing ?? []) seen.add(m);
  }
  return [...seen];
}
