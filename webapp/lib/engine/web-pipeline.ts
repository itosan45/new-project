import { agentName } from "@/lib/data/agents";
import { WEB_HANDOFF } from "@/lib/data/web-agents";
import { findImpl } from "@/lib/agents/registry";
import type { AgentContext } from "@/lib/agents/types";
import type { WebBrief } from "@/lib/domain/web-project";
import type { AgentRunResult, WebRequest } from "@/lib/domain/web-request";

/**
 * 依頼をAgentに通す。
 *
 * 順番は WEB_HANDOFF（受け渡しの順番）から取る。
 * ここに順番を書き直すと、契約側の順番とずれる。
 *
 * 途中で止まっても、後ろのAgentは動かす。
 * 何が足りないかを**まとめて**知りたいのであって、
 * 1件ずつ聞きに行くと打ち合わせが何回にも増える。
 */

/** 受け渡しの順番から、中身のあるAgentだけを取り出す。 */
export function webAgentOrder(): string[] {
  const seen: string[] = [];
  for (const h of WEB_HANDOFF) {
    for (const id of [h.from, h.to]) {
      if (!seen.includes(id) && findImpl(id)) seen.push(id);
    }
  }
  return seen;
}

let counter = 0;
function newId(): string {
  counter += 1;
  return `REQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString(36).slice(-5)}${counter}`;
}

export function runWebRequest(input: {
  clientName: string;
  siteUrl?: string;
  summary: string;
  brief: WebBrief;
}): WebRequest {
  const ctx: AgentContext = { brief: input.brief, request: input.summary };
  const results: AgentRunResult[] = [];

  for (const agentId of webAgentOrder()) {
    const impl = findImpl(agentId);
    if (!impl) continue;
    const r = impl.run(ctx);
    const base = { agentId, agentName: agentName(agentId) };

    if (r.status === "入力が足りない") {
      results.push({
        ...base,
        status: "入力が足りない",
        summary: r.summary,
        evidence: [],
        missing: r.missing,
        askWho: r.askWho,
      });
      continue;
    }
    if (r.status === "未実装") {
      results.push({ ...base, status: "未実装", summary: r.summary, evidence: [] });
      continue;
    }
    results.push({
      ...base,
      status: r.status,
      summary: r.summary,
      evidence: r.evidence,
      output: r.output,
    });
  }

  return {
    requestId: newId(),
    clientName: input.clientName,
    siteUrl: input.siteUrl,
    summary: input.summary,
    brief: input.brief,
    createdAt: new Date().toISOString(),
    results,
  };
}
