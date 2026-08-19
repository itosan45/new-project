"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Card, CardHeader, Icon, RunStatusBadge } from "@/components/ui";
import type { CaseRecord } from "@/lib/store/cases";
import type { TenantProfile } from "@/lib/domain/tenant";

/**
 * 案件を受け付ける窓口と、進行中の案件。
 *
 * 承認ボタンは実際にファイルへ書き込む。押した記録が消えないことが、
 * この画面がデモではなく職場である条件になる。
 */

/** 工程の進み具合を点で表す。表とスマホ用カードの両方で使う。 */
function StepDots({ steps }: { steps: CaseRecord["run"]["steps"] }) {
  return (
    <div className="flex gap-0.5">
      {steps.map((s) => (
        <span
          key={s.stepId}
          title={`${s.agentId}: ${s.summary}`}
          className={`size-2 rounded-full ${
            s.status === "COMPLETED"
              ? "bg-ok"
              : s.status === "WAITING_APPROVAL" || s.status === "NEEDS_INPUT"
                ? "bg-warn"
                : s.status === "SKIPPED"
                  ? "bg-danger"
                  : "bg-idle"
          }`}
        />
      ))}
    </div>
  );
}

export function CaseDesk({
  tenants,
  cases,
}: {
  tenants: TenantProfile[];
  cases: CaseRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantId, setTenantId] = useState(tenants[0]?.tenantId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [priority, setPriority] = useState<"通常" | "最優先">("通常");

  const tenant = tenants.find((t) => t.tenantId === tenantId);

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          title,
          description,
          requestedBy,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "受付に失敗しました");
      setTitle("");
      setDescription("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "受付に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function decide(
    record: CaseRecord,
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
  ) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: record.run.tenantId,
          runId: record.run.runId,
          approvalId,
          decision,
          actor: "承認者",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "処理に失敗しました");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "処理に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const waiting = cases.filter((c) =>
    c.approvals.some((a) => a.status === "PENDING"),
  );
  const done = cases.filter(
    (c) => !c.approvals.some((a) => a.status === "PENDING"),
  );

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-soft px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Icon name="inbox" className="size-4 text-primary" />
              案件を受け付ける
            </span>
          }
        />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">顧客</span>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink"
              >
                {tenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.name}（{t.industry}）
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">依頼者</span>
              <input
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder={tenant?.people[0]?.name ?? "担当者"}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-muted">件名</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tenant?.primaryWorkflow ?? "案件の件名"}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-muted">内容</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="処理してほしい内容"
              className="resize-none rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
            />
          </label>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">優先度</span>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value === "最優先" ? "最優先" : "通常")
                }
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink"
              >
                <option value="通常">通常</option>
                <option value="最優先">最優先</option>
              </select>
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={busy || pending || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
            >
              <Icon name="send" className="size-3.5" />
              {busy ? "処理中…" : "受け付ける"}
            </button>
          </div>

          {tenant && (
            <p className="rounded-lg bg-surface-muted px-3 py-2 text-[10px] leading-relaxed text-ink-muted">
              {tenant.name} では{" "}
              <b className="text-ink">{tenant.requiredAgents.length}体</b>{" "}
              のAgentが順に動き、
              <b className="text-warn">{tenant.approvalReasons.join("・")}</b>{" "}
              にあたる工程の手前で必ず停止します。
            </p>
          )}
        </div>
      </Card>

      {waiting.length > 0 && (
        <Card>
          <CardHeader
            title="承認待ち"
            badge={<Badge tone="warn">{waiting.length}件</Badge>}
          />
          <div className="flex flex-col gap-2.5">
            {waiting.map((c) =>
              c.approvals
                .filter((a) => a.status === "PENDING")
                .map((a) => (
                  <div
                    key={a.approvalId}
                    className="rounded-lg border border-warn/30 bg-warn-soft/30 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink">
                          {a.title}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-muted">
                          {c.run.tenantId} ・ {a.requestedBy} ・{" "}
                          {a.requestedAt}
                        </p>
                        {/* なぜ止まっているか */}
                        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-danger">
                          ⛔ {a.reason}にあたるため停止しています
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            decide(c, a.approvalId, "APPROVED")
                          }
                          disabled={busy}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          承認する
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            decide(c, a.approvalId, "REJECTED")
                          }
                          disabled={busy}
                          className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs text-ink disabled:opacity-40"
                        >
                          差し戻す
                        </button>
                      </div>
                    </div>
                  </div>
                )),
            )}
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-1 border-b border-line px-4 py-3 sm:px-5 sm:py-3.5">
          <h2 className="text-[15px] font-semibold text-ink">案件の記録</h2>
          <span className="text-[11px] text-ink-muted">
            {cases.length}件（すべてリポジトリに保存されています）
          </span>
        </div>
        {cases.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-ink-muted">
            まだ案件がありません。上のフォームから受け付けてください。
          </p>
        ) : (
          <>
            {/* スマホ: 1件1枚のカードに積み替える。
                横スクロールする表は、指では読めない */}
            <div className="flex flex-col divide-y divide-line sm:hidden">
              {[...waiting, ...done].map((c) => (
                <div key={c.run.runId} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-[13px] font-medium text-ink">
                      {c.run.title}
                    </span>
                    <RunStatusBadge status={c.run.status} />
                  </div>
                  <StepDots steps={c.run.steps} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                    <span>{c.run.tenantId}</span>
                    <span>{c.run.startedAt.slice(5, 16).replace("T", " ")}</span>
                  </div>
                  <span className="font-mono text-[10px] text-ink-subtle">
                    {c.run.runId}
                  </span>
                </div>
              ))}
            </div>

            {/* PC: 表のまま */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-line text-[10px] text-ink-muted">
                    <th className="px-5 py-2.5 font-medium">件名</th>
                    <th className="px-3 py-2.5 font-medium">顧客</th>
                    <th className="px-3 py-2.5 font-medium">工程</th>
                    <th className="px-3 py-2.5 font-medium">状態</th>
                    <th className="px-5 py-2.5 text-right font-medium">受付</th>
                  </tr>
                </thead>
                <tbody>
                  {[...waiting, ...done].map((c) => (
                    <tr
                      key={c.run.runId}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-5 py-2.5">
                        <div className="text-xs font-medium text-ink">
                          {c.run.title}
                        </div>
                        <div className="font-mono text-[10px] text-ink-subtle">
                          {c.run.runId}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-ink-muted">
                        {c.run.tenantId}
                      </td>
                      <td className="px-3 py-2.5">
                        <StepDots steps={c.run.steps} />
                      </td>
                      <td className="px-3 py-2.5">
                        <RunStatusBadge status={c.run.status} />
                      </td>
                      <td className="px-5 py-2.5 text-right text-[10px] text-ink-subtle">
                        {c.run.startedAt.slice(5, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
