import type {
  ApprovalRequest,
  AuditEvent,
  Run,
  RunStep,
} from "@/lib/domain/types";
import type { TenantProfile } from "@/lib/domain/tenant";
import { findAgent } from "@/lib/data/agents";
import { findPack } from "@/lib/data/domain-packs";
import type { CaseRecord } from "@/lib/store/cases";

/**
 * 案件の実行エンジン。
 *
 * 現時点で、Agentの中身の処理そのものは行っていない。
 * 実行しているのは「順序」「停止条件」「記録」の3つ。
 *
 * これは手抜きではなく、順序が正しい。中身の精度は後から差し替えられるが、
 * 承認せずに送ってしまった、記録が無いから説明できない、は後から直せない。
 * 先に器を正しくしておく。
 *
 * 中身を本物にするときは runStep() の中だけを差し替える。
 * 画面もこのファイルの外側も触らずに済む。
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

  for (const agentId of tenant.requiredAgents) {
    const agent = findAgent(agentId);
    if (!agent) continue;

    // 承認Agentは並びの中では素通しし、実行系の手前で止める役に徹する
    if (agentId === "approval" || agentId === "audit") continue;

    if (stopped) {
      steps.push({
        stepId: shortId("s"),
        agentId,
        status: "PENDING",
        summary: `${agent.name} は承認後に実行します。`,
        waitingFor: "承認",
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

    // 承認の要らない工程。読み取り・検証・下書きなど
    const completedAt = nowIso();
    steps.push({
      stepId: shortId("s"),
      agentId,
      status: "COMPLETED",
      completedAt: timeLabel(completedAt),
      summary: agent.expertise[0] ?? agent.purpose,
    });
    record({
      kind: "Agent",
      agentId,
      timestamp: timeLabel(completedAt),
      actor: agent.name,
      actorType: "agent",
      action: `${agent.expertise[0] ?? agent.purpose} を実施しました。`,
      status: "成功",
      detail: pack ? `適用パック：${pack.name}` : undefined,
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
    // 止まっている案件を「実行中」と表示しない
    status: stopped ? "HUMAN_REVIEW" : "SUCCEEDED",
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

  for (const s of record.run.steps) {
    if (s.status === "WAITING_APPROVAL" || s.status === "PENDING") {
      const agent = findAgent(s.agentId);
      s.status = "COMPLETED";
      s.completedAt = at;
      s.summary = `承認後に実行しました。${agent?.expertise[0] ?? ""}`;
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
        action: `承認済みの操作を実行しました。`,
        status: "成功",
      });
    }
  }

  record.run.status = "SUCCEEDED";
  return record;
}
