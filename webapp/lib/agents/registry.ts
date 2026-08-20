import type { AgentImpl } from "@/lib/agents/types";
import { documentReaderAgent } from "@/lib/agents/doc/document-reader";
import { classifierAgent } from "@/lib/agents/ec/classifier";
import { webBriefAgent } from "@/lib/agents/web/brief";
import { webEstimateAgent } from "@/lib/agents/web/estimate";
import { webIaAgent } from "@/lib/agents/web/ia";
import { webMeasureAgent } from "@/lib/agents/web/measure";
import { webProposalAgent } from "@/lib/agents/web/proposal";
import { webPreflightAgent } from "@/lib/agents/web/preflight";

/**
 * 中身のあるAgentの一覧。
 *
 * ここに載っていないAgentは、契約があっても動かない。
 * 動かないことを「中身なし」として記録する。勝手に完了扱いしない。
 *
 * 契約（lib/data/agents.ts）と実体（ここ）を分けてあるのは、
 * 契約だけ書いて実装したつもりになるのを防ぐため。
 * 前はこれが無く、契約に書いた「得意なこと」を実績として記録していた。
 */
const IMPLS: AgentImpl[] = [
  documentReaderAgent,
  classifierAgent,
  webBriefAgent,
  webIaAgent,
  webEstimateAgent,
  webMeasureAgent,
  webPreflightAgent,
  webProposalAgent,
];

export const AGENT_IMPLS: Record<string, AgentImpl> = Object.fromEntries(
  IMPLS.map((i) => [i.agentId, i]),
);

export function findImpl(agentId: string): AgentImpl | undefined {
  return AGENT_IMPLS[agentId];
}

/** 中身のあるAgentのID一覧。画面で「動く/動かない」を出すのに使う。 */
export const IMPLEMENTED_AGENT_IDS = IMPLS.map((i) => i.agentId);
