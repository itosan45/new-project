import { Fragment } from "react";
import Link from "next/link";
import { ADMIN_NAV } from "@/components/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { Shell, UserChip } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  HealthBadge,
  Icon,
  IconTile,
  LinkAction,
  Metric,
  Sparkline,
  type Tone,
} from "@/components/ui";
import { AGENT_RUNTIME, agentName, findAgent } from "@/lib/data/agents";
import {
  ADMIN_APPROVAL_QUEUE,
  ADMIN_KPIS,
  ADMIN_TREND_SUMMARY,
  AUTOMATION_TREND,
  WORKFLOW_HEALTH_ORDER,
} from "@/lib/data/workspace";

export const metadata = { title: "エージェント運用センター" };

const KPI_ICON = ["robot", "inbox", "clock", "money"];
const KPI_TONE: Tone[] = ["ok", "primary", "warn", "ok"];
const KPI_SPARK = [
  [3, 5, 4, 6, 7, 6, 8],
  [820, 900, 870, 1010, 1120, 1180, 1284],
  [4, 6, 5, 8, 7, 10, 12],
  [900, 1050, 1200, 1350, 1500, 1700, 1860],
];

function AgentHealthCard({ agentId }: { agentId: string }) {
  const runtime = AGENT_RUNTIME.find((a) => a.agentId === agentId);
  const contract = findAgent(agentId);
  if (!runtime || !contract) return null;
  return (
    <div className="min-w-[132px] flex-1 rounded-lg border border-line p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink">
          <IconTile
            name={
              agentId === "marketing-research"
                ? "search"
                : agentId === "data-analyst"
                  ? "chart"
                  : agentId === "executor"
                    ? "send"
                    : "shield"
            }
            tone={runtime.health === "注意" ? "warn" : "primary"}
            size="sm"
          />
          <span className="truncate">{contract.name}</span>
        </span>
      </div>
      <div className="mt-2">
        <HealthBadge health={runtime.health} />
      </div>
      <dl className="mt-2 flex flex-col gap-0.5 text-[10px] text-ink-muted">
        <div className="flex justify-between">
          <dt>処理数（本日）</dt>
          <dd className="tabular text-ink">{runtime.processedToday}</dd>
        </div>
        <div className="flex justify-between">
          <dt>成功率</dt>
          <dd className="tabular text-ink">
            {(runtime.successRate * 100).toFixed(1)}%
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** 自動化効果の推移。ライブラリを足さずに SVG で描く。 */
function TrendChart() {
  const w = 620;
  const h = 150;
  const pad = { l: 34, r: 34, t: 10, b: 20 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const maxLeft = Math.max(...AUTOMATION_TREND.map((d) => Math.max(d.hours, d.cost)));
  const maxRight = Math.max(...AUTOMATION_TREND.map((d) => d.cumulative));

  const x = (i: number) => pad.l + (i / (AUTOMATION_TREND.length - 1)) * iw;
  const yL = (v: number) => pad.t + ih - (v / maxLeft) * ih;
  const yR = (v: number) => pad.t + ih - (v / maxRight) * ih;

  const line = (key: "hours" | "cost", scale: (v: number) => number) =>
    AUTOMATION_TREND.map(
      (d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${scale(d[key]).toFixed(1)}`,
    ).join(" ");

  const cumulative = AUTOMATION_TREND.map(
    (d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yR(d.cumulative).toFixed(1)}`,
  ).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad.l}
          x2={w - pad.r}
          y1={pad.t + ih * t}
          y2={pad.t + ih * t}
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      <path d={line("hours", yL)} fill="none" stroke="var(--ok)" strokeWidth={2} />
      <path d={line("cost", yL)} fill="none" stroke="var(--primary)" strokeWidth={2} />
      <path
        d={cumulative}
        fill="none"
        stroke="var(--warn)"
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      {AUTOMATION_TREND.map((d, i) => (
        <text
          key={d.day}
          x={x(i)}
          y={h - 4}
          textAnchor="middle"
          className="fill-[var(--text-subtle)] text-[9px]"
        >
          {d.day}
        </text>
      ))}
    </svg>
  );
}

export default function AdminOpsCenter() {
  return (
    <Shell
      nav={ADMIN_NAV}
      activeHref="/admin"
      brand={
        <div className="text-nav-text-active">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="size-4" />
            <span className="text-[13px] font-semibold">業務自動化ハーネス</span>
          </div>
          <p className="mt-0.5 pl-6 text-[10px] text-nav-text">
            コントロールセンター
          </p>
        </div>
      }
      footer={
        <span className="cursor-pointer text-[11px] text-nav-text hover:text-nav-text-active">
          ≪ メニューを折りたたむ
        </span>
      }
    >
      <div className="flex items-center justify-end gap-2 border-b border-line bg-surface px-4 py-2.5 sm:px-7">
        <Link
          href="/tenants"
          className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[11px] text-ink hover:border-primary/40"
        >
          <Icon name="building" className="size-3.5 text-ink-muted" />
          Demo Company ⌄
        </Link>
        <button
          type="button"
          aria-label="通知"
          className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted"
        >
          <Icon name="bell" className="size-4" />
        </button>
        <UserChip name="Admin User" sub="システム管理者" dark={false} />
        <LogoutButton />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-7 sm:py-5">
        <div>
          <h1 className="text-lg font-bold text-ink">エージェント運用センター</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            AIエージェントの運用状況を監視し、業務自動化を最適化します。
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ADMIN_KPIS.map((kpi, i) => (
            <Card key={kpi.label}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <IconTile name={KPI_ICON[i]} tone={KPI_TONE[i]} />
                  <Metric
                    label={kpi.label}
                    value={kpi.value}
                    delta={kpi.deltaLabel}
                    direction={kpi.deltaDirection}
                    basis={kpi.basis}
                  />
                </div>
                <Sparkline
                  points={KPI_SPARK[i]}
                  tone={i === 2 ? "warn" : "ok"}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* ワークフロー健康状態 + 承認待ちキュー */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader
              title="ワークフロー健康状態"
              action={
                <span className="flex items-center gap-3 text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-ok" />正常
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-warn" />注意
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-danger" />異常
                  </span>
                </span>
              }
            />
            <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
              {WORKFLOW_HEALTH_ORDER.map((id, i) => (
                <Fragment key={id}>
                  <AgentHealthCard agentId={id} />
                  {i < WORKFLOW_HEALTH_ORDER.length - 1 && (
                    <span className="self-center shrink-0 text-ink-subtle">→</span>
                  )}
                </Fragment>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-muted">
              <span className="text-ink-subtle">↑</span>
              フィードバックループ
            </p>
          </Card>

          <Card>
            <CardHeader
              title="承認待ちキュー"
              action={
                <Badge tone="idle">{ADMIN_APPROVAL_QUEUE.length}件 表示中</Badge>
              }
            />
            <div className="flex flex-col gap-2.5">
              {ADMIN_APPROVAL_QUEUE.map((ap) => (
                <div
                  key={ap.approvalId}
                  className="flex items-start gap-2.5 rounded-lg border border-line p-3"
                >
                  <IconTile
                    name={
                      ap.agentId === "executor"
                        ? "send"
                        : ap.agentId === "data-analyst"
                          ? "database"
                          : "doc"
                    }
                    tone={ap.priority === "高優先度" ? "warn" : "idle"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink">
                      {ap.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {agentName(ap.agentId ?? "")}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      申請者：{ap.requestedBy}
                    </p>
                    {/* 承認理由を必ず出す。理由の無い承認は作らせない */}
                    <div className="mt-1">
                      <Badge
                        tone={ap.reason === "外部送信" ? "danger" : "idle"}
                      >
                        {ap.reason}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex w-[92px] shrink-0 flex-col items-end gap-2">
                    <span className="text-[10px] text-ink-subtle">
                      {ap.requestedAt}
                    </span>
                    <Button variant="primary" size="sm" full>
                      承認
                    </Button>
                    <Button variant="default" size="sm" full>
                      レビュー
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 推移 + Agent活動 */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
          <Card>
            <CardHeader
              title="自動化効果の推移"
              action={
                <span className="flex gap-2 text-[11px] text-ink-muted">
                  <span className="flex min-h-[36px] items-center rounded-md border border-line px-3 py-2">
                    今月 ⌄
                  </span>
                  <span className="flex min-h-[36px] items-center rounded-md border border-line px-3 py-2">
                    日次 ⌄
                  </span>
                </span>
              }
            />
            <div className="mb-2 flex flex-wrap gap-4 text-[10px] text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-ok" />削減時間（時間）
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 bg-primary" />削減コスト（万円）
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 border-t-2 border-dashed border-warn" />
                累積削減コスト（万円）
              </span>
            </div>
            <TrendChart />
            <div className="mt-3 grid grid-cols-1 gap-4 border-t border-line pt-3 sm:grid-cols-3">
              {ADMIN_TREND_SUMMARY.map((m, i) => (
                <div key={m.label} className="flex items-center gap-2.5">
                  <IconTile
                    name={["clock", "money", "chart"][i]}
                    tone={["ok", "primary", "warn"][i] as Tone}
                    size="sm"
                  />
                  <Metric
                    label={m.label}
                    value={m.value}
                    unit={m.unit}
                    delta={m.deltaLabel}
                    direction={m.deltaDirection}
                    basis={m.basis}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="エージェント活動状況"
              action={
                <Link href="/agents">
                  <LinkAction>Agent一覧（全17体）</LinkAction>
                </Link>
              }
            />
            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="sticky top-0 border-b border-line bg-surface text-[10px] text-ink-muted">
                    <th className="pb-2 font-medium">Agent</th>
                    <th className="pb-2 font-medium">担当</th>
                    <th className="pb-2 text-right font-medium">処理数</th>
                    <th className="pb-2 font-medium">状態</th>
                    <th className="pb-2 text-right font-medium">最終実行</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENT_RUNTIME.map((a) => (
                    <tr key={a.agentId} className="border-b border-line last:border-0">
                      <td className="py-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-ink">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${
                              a.health === "正常" ? "bg-ok" : "bg-warn"
                            }`}
                          />
                          <span className="truncate">{agentName(a.agentId)}</span>
                        </span>
                      </td>
                      <td className="py-2 text-[11px] text-ink-muted">
                        {a.assignee}
                      </td>
                      <td className="tabular py-2 text-right text-[11px] text-ink-muted">
                        {a.processedToday}
                      </td>
                      <td className="py-2">
                        <Badge tone={a.health === "正常" ? "ok" : "warn"}>
                          {a.health === "正常" ? "稼働中" : "注意"}
                        </Badge>
                      </td>
                      <td className="py-2 text-right text-[10px] text-ink-subtle">
                        {a.lastRunAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[10px] text-ink-subtle">
              契約は17体。うち稼働中の状態を持つ{AGENT_RUNTIME.length}体を表示
            </p>
          </Card>
        </div>

        {/* Agentごとの処理内訳。KPIの「本日の処理」の内訳をそのまま出す */}
        <Card>
          <CardHeader
            title="本日の処理内訳（Agentごと）"
            badge={
              <span className="text-[10px] font-normal text-ink-subtle">
                稼働中Agentの processedToday を降順で表示
              </span>
            }
          />
          <div className="flex flex-col gap-2">
            {[...AGENT_RUNTIME]
              .sort((a, b) => b.processedToday - a.processedToday)
              .map((a) => {
                const max = Math.max(...AGENT_RUNTIME.map((r) => r.processedToday));
                const pct = max > 0 ? Math.round((a.processedToday / max) * 100) : 0;
                return (
                  <div key={a.agentId} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-[11px] text-ink">
                      {agentName(a.agentId)}
                    </span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={`h-full rounded-full ${
                          a.health === "正常" ? "bg-ok" : "bg-warn"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="tabular w-10 shrink-0 text-right text-[11px] text-ink-muted">
                      {a.processedToday}
                    </span>
                  </div>
                );
              })}
          </div>
        </Card>

        <p className="flex items-center gap-1.5 text-[10px] text-ink-subtle">
          <Icon name="clock" className="size-3" />
          データは5分ごとに更新されます
          <span className="ml-auto">最終更新：10:30</span>
        </p>
      </div>
    </Shell>
  );
}
