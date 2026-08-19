import type {
  ApprovalRequest,
  AuditEvent,
  Run,
  RunStep,
} from "@/lib/domain/types";
import type { TenantProfile } from "@/lib/domain/tenant";
import { findAgent } from "@/lib/data/agents";
import { findPack } from "@/lib/data/domain-packs";
import { findImpl } from "@/lib/agents/registry";
import type { AgentContext } from "@/lib/agents/types";
import type { CaseRecord } from "@/lib/store/cases";

/**
 * 案件の実行エンジン。
 *
 * 実行しているのは「順序」「停止条件」「記録」、そして
 * 実体のあるAgentの呼び出し。
 *
 * ここで一番大事なのは、**やっていないことを完了にしない**こと。
 *
 * - 実体が無い          → NOT_IMPLEMENTED（中身なし）
 * - 実体はあるが入力不足 → NEEDS_INPUT（入力待ち）で、そこから先を止める
 * - 実体があって動いた   → COMPLETED。要約も根拠も、実行結果から取る
 *
 * 以前はここで、契約に書いた「得意なこと」の1行目を実績として
 * 監査ログに書いていた。処理をしていないのに、した記録が残っていた。
 * 蓋を開けたら何も定義されていないのに動いて見える、の正体がこれ。
 */

function nowIso(): string {
  return new Date().toISOString();
}

function timeLabel(iso: string): string {
  return iso.slice(11, 16);
}

let counter = 0;
function shortId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

/** 承認が要る操作かを、Agent契約の副作用区分から判定する。 */
function needsApproval(agentId: string): boolean {
  const agent = findAgent(agentId);
  if (!agent) return false;
  return (
    agent.sideEffectClass === "SIDE_EFFECT" ||
    agent.sideEffectClass === "IRREVERSIBLE"
  );
}

export interface StartCaseInput {
  tenant: TenantProfile;
  title: string;
  description: string;
  requestedBy: string;
  priority: Run["priority"];
}

/**
 * 案件を受け付けて、承認が必要な手前まで進める。
 *
 * 承認が要る手前で必ず止まる。ここを通り越して実行できる経路を
 * 作らないことが、このエンジンの唯一の仕事と言ってよい。
 */
export function startCase(input: StartCaseInput): CaseRecord {
  const { tenant, title, description, requestedBy, priority } = input;
  const startedAt = nowIso();
  const runId = `RUN-${startedAt.slice(0, 10).replace(/-/g, "")}-${shortId("c").slice(-6)}`;
  const pack = findPack(tenant.domainPack);

  const audit: AuditEvent[] = [];
  const approvals: ApprovalRequest[] = [];
  const steps: RunStep[] = [];

  const record = (
    e: Omit<AuditEvent, "tenantId" | "workspaceId" | "eventId" | "runId">,
  ) => {
    audit.push({
      tenantId: tenant.tenantId,
      workspaceId: "default",
      eventId: shortId("ev"),
      runId,
      ...e,
    });
  };

  record({
    kind: "Execution",
    timestamp: timeLabel(startedAt),
    actor: requestedBy,
    actorType: "human",
    action: `案件を受け付けました：${title}`,
    status: "成功",
  });

  let stopped = false;
  /** 入力不足で止まったか。承認待ちとは別の理由なので分けて数える */
  let needsInputStop = false;
  /** 中身の無いAgentがあったか。あったら「成功」とは呼べない */
  let notImplemented = false;

  /*
   * Agentに渡す材料。
   *
   * 書類（documents）はまだ受け口が無い。案件の受付に添付が無いため。
   * 渡らないので Document Reader は「入力待ち」で止まる。
   * 止まるのが正しい。空のまま読み取ったことにはしない。
   */
  const ctx: AgentContext = { request: description, packId: tenant.domainPack };

  for (const agentId of tenant.requiredAgents) {
    const agent = findAgent(agentId);
    if (!agent) continue;

    // 承認Agentは並びの中では素通しし、実行系の手前で止める役に徹する
    if (agentId === "approval" || agentId === "audit") continue;

    if (stopped) {
      // 止まった理由によって、人がやることが違う。
      // 「承認後に実行します」と一律に書くと、押せばよいと誤解される
      const 待ち = needsInputStop ? "足りない項目の確認" : "承認";
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "PENDING",
        summary: `${agent.name} は${待ち}のあとに実行します。`,
        waitingFor: 待ち,
      });
      continue;
    }

    if (needsApproval(agentId)) {
      // ここが承認ゲート。実行系の手前で必ず止まる
      const approvalId = shortId("ap");
      const reason = tenant.approvalReasons[0] ?? "外部送信";
      approvals.push({
        tenantId: tenant.tenantId,
        workspaceId: "default",
        approvalId,
        runId,
        title: `${title}（${agent.name} の実行）`,
        reason,
        requestedBy: agent.name,
        requestedAt: timeLabel(nowIso()),
        agentId,
        priority: priority === "最優先" ? "高優先度" : "通常",
        classification: tenant.dataClassifications[0] ?? "INTERNAL",
        detail: description,
        status: "PENDING",
        approvalScopeHash: `${runId}:${agentId}:v1`,
      });

      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "WAITING_APPROVAL",
        summary: `${reason}にあたるため、承認を待っています。`,
        waitingFor: `${reason}の承認`,
      });

      record({
        kind: "Decision",
        agentId: "approval",
        timestamp: timeLabel(nowIso()),
        actor: "Approval Agent",
        actorType: "agent",
        action: `${agent.name} の実行を停止しました（理由：${reason}）`,
        status: "承認待ち",
      });

      stopped = true;
      continue;
    }

    // 承認の要らない工程。ここで実体を呼ぶ
    const impl = findImpl(agentId);
    const at = nowIso();

    if (!impl) {
      // 契約だけで中身が無い。完了にはしない
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "NOT_IMPLEMENTED",
        summary: `${agent.name} はまだ中身がありません（契約のみ）。`,
      });
      record({
        kind: "Agent",
        agentId,
        timestamp: timeLabel(at),
        actor: agent.name,
        actorType: "agent",
        action: `${agent.name} は中身が無いため実行していません。`,
        status: "未実行",
        detail: "契約は定義済み。実体は lib/agents/registry.ts に未登録",
      });
      notImplemented = true;
      continue;
    }

    const result = impl.run(ctx);

    if (result.status === "入力が足りない") {
      // 推測で埋めずに止める。ここから先も動かさない
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "NEEDS_INPUT",
        summary: `未回答: ${result.missing.join(" / ")}`,
        waitingFor: `${result.askWho}への確認`,
      });
      record({
        kind: "Agent",
        agentId,
        timestamp: timeLabel(at),
        actor: agent.name,
        actorType: "agent",
        action: `入力が足りないため実行していません（${result.missing.length}件）。`,
        status: "未実行",
        detail: result.missing.join(" / "),
      });
      needsInputStop = true;
      stopped = true;
      continue;
    }

    if (result.status === "未実装") {
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "NOT_IMPLEMENTED",
        summary: result.summary,
      });
      notImplemented = true;
      continue;
    }

    if (result.status === "人に回す") {
      // 処理はできたが、そのまま次に渡すと読み違えたまま先へ進む
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "NEEDS_REVIEW",
        summary: result.summary,
        waitingFor: "人の確認",
      });
      record({
        kind: "Agent",
        agentId,
        timestamp: timeLabel(at),
        actor: agent.name,
        actorType: "agent",
        action: result.summary,
        status: "承認待ち",
        detail: [...result.reason, ...result.evidence].join(" / "),
      });
      stopped = true;
      continue;
    }

    // ここまで来て初めて完了。要約も根拠も実行結果から取る
    steps.push({
      stepId: shortId("s"),
      agentId,
      status: "COMPLETED",
      completedAt: timeLabel(at),
      summary: result.summary,
    });
    record({
      kind: "Agent",
      agentId,
      timestamp: timeLabel(at),
      actor: agent.name,
      actorType: "agent",
      action: result.summary,
      status: "成功",
      detail: [
        ...result.evidence,
        pack ? `適用パック：${pack.name}` : "",
      ]
        .filter(Boolean)
        .join(" / "),
    });
  }

  if (needsInputStop) {
    // 承認待ちと入力待ちは、人がやることが違う。記録で区別する
    record({
      kind: "Execution",
      timestamp: timeLabel(nowIso()),
      actor: "実行エンジン",
      actorType: "system",
      action: "入力が足りないため、この先の工程を実行していません。",
      status: "停止",
      detail: "承認待ちではありません。足りない項目を確認してください",
    });
  }

  // ハンドオフ先を後ろから埋める
  for (let i = 0; i < steps.length - 1; i++) {
    steps[i].handoffTo = steps[i + 1].agentId;
  }

  const run: Run = {
    tenantId: tenant.tenantId,
    workspaceId: "default",
    runId,
    idempotencyKey: `${tenant.tenantId}:${title}:${startedAt}`,
    workflowId: tenant.domainPack,
    workflowVersion: "1.0.0",
    title,
    /*
     * 止まっている案件を「実行中」と表示しない。
     * 中身の無いAgentが混ざっていた場合も成功とは呼ばない。
     * ここを SUCCEEDED にすると、何も処理していない案件が
     * 実績として数えられてしまう。
     */
    status: stopped
      ? "HUMAN_REVIEW"
      : notImplemented
        ? "PARTIAL_SUCCESS"
        : "SUCCEEDED",
    startedAt,
    trigger: "手動実行",
    priority,
    requestedBy,
    description,
    steps,
    decisions: [],
    contextSources: [],
    contextChips: [
      { label: "業種", value: tenant.industry },
      { label: "パック", value: pack?.name ?? "なし" },
    ],
  };

  return { run, approvals, audit };
}

/**
 * 承認する、または差し戻す。
 *
 * 承認したら、止まっていた工程から先を実行する。
 * 差し戻したら未実行として残す。成功にはしない。
 */
export function decideApproval(
  record: CaseRecord,
  approvalId: string,
  decision: "APPROVED" | "REJECTED",
  actor: string,
): CaseRecord {
  const approval = record.approvals.find((a) => a.approvalId === approvalId);
  if (!approval || approval.status !== "PENDING") return record;

  const at = timeLabel(nowIso());
  approval.status = decision;

  record.audit.push({
    tenantId: record.run.tenantId,
    workspaceId: "default",
    eventId: shortId("ev"),
    runId: record.run.runId,
    kind: "HumanAction",
    timestamp: at,
    actor,
    actorType: "human",
    action:
      decision === "APPROVED"
        ? `${approval.title} を承認しました。`
        : `${approval.title} を差し戻しました。`,
    status: decision === "APPROVED" ? "成功" : "停止",
  });

  if (decision === "REJECTED") {
    for (const s of record.run.steps) {
      if (s.status === "WAITING_APPROVAL" || s.status === "PENDING") {
        s.status = "SKIPPED";
        s.summary = "差し戻されたため実行していません。";
      }
    }
    // 差し戻しは失敗ではない。未実行として残す
    record.run.status = "BLOCKED";
    return record;
  }

  /*
   * 承認が下りても、実体の無いAgentは動かない。
   * 承認＝実行ではない。ここを COMPLETED にすると、
   * 「承認したので実行されたはず」という記録だけが残る。
   */
  let notImplemented = false;
  const ctx: AgentContext = {
    request: record.run.description,
    packId: record.run.workflowId,
  };

  for (const s of record.run.steps) {
    if (s.status !== "WAITING_APPROVAL" && s.status !== "PENDING") continue;

    const agent = findAgent(s.agentId);
    const impl = findImpl(s.agentId);

    if (!impl) {
      s.status = "NOT_IMPLEMENTED";
      s.summary = `承認は下りましたが、${agent?.name ?? s.agentId} はまだ中身がありません。`;
      record.audit.push({
        tenantId: record.run.tenantId,
        workspaceId: "default",
        eventId: shortId("ev"),
        runId: record.run.runId,
        kind: "Execution",
        agentId: s.agentId,
        timestamp: at,
        actor: agent?.name ?? s.agentId,
        actorType: "agent",
        action: "承認済みですが、中身が無いため実行していません。",
        status: "未実行",
      });
      notImplemented = true;
      continue;
    }

    const result = impl.run(ctx);
    if (result.status !== "完了") {
      s.status =
        result.status === "入力が足りない"
          ? "NEEDS_INPUT"
          : result.status === "人に回す"
            ? "NEEDS_REVIEW"
            : "NOT_IMPLEMENTED";
      s.summary = result.summary;
      record.audit.push({
        tenantId: record.run.tenantId,
        workspaceId: "default",
        eventId: shortId("ev"),
        runId: record.run.runId,
        kind: "Execution",
        agentId: s.agentId,
        timestamp: at,
        actor: agent?.name ?? s.agentId,
        actorType: "agent",
        action: result.summary,
        status: "未実行",
      });
      notImplemented = true;
      continue;
    }

    s.status = "COMPLETED";
    s.completedAt = at;
    s.summary = result.summary;
    record.audit.push({
      tenantId: record.run.tenantId,
      workspaceId: "default",
      eventId: shortId("ev"),
      runId: record.run.runId,
      kind: "Execution",
      agentId: s.agentId,
      timestamp: at,
      actor: agent?.name ?? s.agentId,
      actorType: "agent",
      action: result.summary,
      status: "成功",
      detail: result.evidence.join(" / "),
    });
  }

  record.run.status = notImplemented ? "PARTIAL_SUCCESS" : "SUCCEEDED";
  return record;
}
