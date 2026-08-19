import { WEB_DECISIONS } from "@/lib/data/web-decisions";
import type { AgentImpl, AgentResult } from "@/lib/agents/types";
import type { DecisionSpec, WebBrief } from "@/lib/domain/web-project";

/**
 * ヒアリング設計 Agent。
 *
 * まだ答えの無い決めごとを、聞く順に並べる。
 * この Agent だけは入力不足で止まらない。未回答を出すのが仕事なので。
 */

const ROUND_ORDER = ["1回目", "2回目以降", "制作前"] as const;

/** 答えが入っているか。空文字・空配列は「未回答」として扱う。 */
function answered(brief: WebBrief, key: DecisionSpec["key"]): boolean {
  const d = brief[key] as { value?: unknown } | undefined;
  const v = d?.value;
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export interface BriefOutput {
  rounds: { round: string; questions: DecisionSpec[] }[];
  /** 見積を止めている未回答 */
  blockingEstimate: DecisionSpec[];
  answeredCount: number;
  totalCount: number;
}

export function planHearing(brief: WebBrief): BriefOutput {
  const open = WEB_DECISIONS.filter((d) => !answered(brief, d.key));

  const rounds = ROUND_ORDER.map((round) => ({
    round,
    questions: open
      .filter((d) => d.stage === round)
      // 見積を止めるものから聞く。順番を間違えると、
      // 細かい話で時間を使い切って肝心のところが決まらない
      .sort((a, b) => Number(b.blocksEstimate) - Number(a.blocksEstimate)),
  })).filter((r) => r.questions.length > 0);

  return {
    rounds,
    blockingEstimate: open.filter((d) => d.blocksEstimate),
    answeredCount: WEB_DECISIONS.length - open.length,
    totalCount: WEB_DECISIONS.length,
  };
}

export const webBriefAgent: AgentImpl = {
  agentId: "web-brief",
  run(ctx): AgentResult {
    if (!ctx.brief) {
      // 設計内容そのものが渡っていない。これは顧客ではなく自分の手落ち
      return {
        status: "入力が足りない",
        missing: ["Web制作の設計内容（WebBrief）"],
        askWho: "自分",
        summary: "設計内容が渡っていないため実行していません",
      };
    }

    const out = planHearing(ctx.brief);
    const blocking = out.blockingEstimate.length;

    return {
      status: "完了",
      summary:
        blocking > 0
          ? `未回答 ${out.totalCount - out.answeredCount}件。うち見積を止めるもの ${blocking}件`
          : `未回答 ${out.totalCount - out.answeredCount}件。見積は出せます`,
      output: out,
      evidence: [
        `Web制作の決めごと ${out.totalCount}項目と突き合わせた`,
        `回答済み ${out.answeredCount}項目`,
        blocking > 0
          ? `見積を止めている項目: ${out.blockingEstimate.map((d) => d.key).join(", ")}`
          : "見積を止めている項目は無い",
      ],
    };
  },
};
