import Link from "next/link";
import { ADMIN_NAV } from "@/components/admin-nav";
import { LogoutButton } from "@/components/logout-button";
import { Shell, UserChip } from "@/components/shell";
import {
  Badge,
  Card,
  CardHeader,
  Icon,
  IconTile,
  LinkAction,
  Metric,
  type Tone,
} from "@/components/ui";
import { ALL_AGENTS, agentName } from "@/lib/data/agents";
import { TENANTS } from "@/lib/data/tenants";
import {
  listAllCases,
  MINUTES_PER_CASE,
  pendingApprovalsOf,
  summarize,
  summarizeAgentActivity,
  summarizeByDay,
  type CaseRecord,
  type DailyStats,
} from "@/lib/store/cases";
import { IMPLEMENTED_AGENT_IDS } from "@/lib/agents/registry";

export const metadata = { title: "エージェント運用センター" };
export const dynamic = "force-dynamic";

const KPI_ICON = ["robot", "inbox", "clock", "clock"];
const KPI_TONE: Tone[] = ["ok", "primary", "warn", "ok"];

const REASON_ICON: Record<string, string> = {
  外部送信: "send",
  金額変更: "money",
  社外共有: "database",
  削除: "alert",
  契約: "doc",
  公開: "send",
};

/**
 * 自動化効果の推移。ライブラリを足さずに SVG で描く。
 *
 * 架空の推移で滑らかに見せない。件数が少ないうちは点も少ない、
 * それが正しい。2点未満は折れ線にできないので、素直に件数だけ出す。
 */
function TrendChart({ data }: { data: DailyStats[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[150px] flex-col items-center justify-center gap-1 rounded-lg bg-surface-muted text-center">
        <p className="text-[12px] text-ink-muted">
          {data.length === 0
            ? "まだ案件がありません"
            : "推移を描けるほどの日数がまだありません"}
        </p>
        <p className="text-[10px] text-ink-subtle">
          架空の推移で埋めて滑らかに見せることはしません
        </p>
      </div>
    );
  }

  const w = 620;
  const h = 150;
  const pad = { l: 34, r: 34, t: 10, b: 20 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const withCumulative = data.reduce<
    (DailyStats & { cumulative: number })[]
  >((acc, d) => {
    const prev = acc.at(-1)?.cumulative ?? 0;
    acc.push({ ...d, cumulative: prev + d.hoursSaved });
    return acc;
  }, []);

  const maxCases = Math.max(1, ...data.map((d) => d.cases));
  const maxCumulative = Math.max(1, withCumulative.at(-1)?.cumulative ?? 0);

  const x = (i: number) => pad.l + (i / (data.length - 1)) * iw;
  const yCases = (v: number) => pad.t + ih - (v / maxCases) * ih;
  const yCumulative = (v: number) => pad.t + ih - (v / maxCumulative) * ih;

  const casesLine = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yCases(d.cases).toFixed(1)}`)
    .join(" ");
  const cumulativeLine = withCumulative
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yCumulative(d.cumulative).toFixed(1)}`)
    .join(" ");

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
      <path d={casesLine} fill="none" stroke="var(--primary)" strokeWidth={2} />
      <path
        d={cumulativeLine}
        fill="none"
        stroke="var(--ok)"
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      {data.map((d, i) => (
        <text
          key={d.date}
          x={x(i)}
          y={h - 4}
          textAnchor="middle"
          className="fill-[var(--text-subtle)] text-[9px]"
        >
          {d.date.slice(5)}
        </text>
      ))}
    </svg>
  );
}

export default async function AdminOpsCenter() {
  let cases: CaseRecord[] = [];
  let loadError: string | null = null;
  try {
    cases = await listAllCases(TENANTS.map((t) => t.tenantId));
  } catch (e) {
    // 鍵が未設定でも画面は出す。何が足りないかを画面で言う
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const thisMonth = now.toISOString().slice(0, 7);
  const todayCount = cases.filter(
    (c) => c.run.startedAt.slice(0, 10) === today,
  ).length;
  const monthCases = cases.filter(
    (c) => c.run.startedAt.slice(0, 7) === thisMonth,
  );
  const overall = summarize(cases, MINUTES_PER_CASE);
  const monthStats = summarize(monthCases, MINUTES_PER_CASE);
  const implementedCount = IMPLEMENTED_AGENT_IDS.length;
  const totalAgentCount = ALL_AGENTS.length;

  const kpis: {
    label: string;
    value: string;
    unit?: string;
    basis: string;
  }[] = [
    {
      label: "実体のあるAgent",
      value: String(implementedCount),
      unit: `/ ${totalAgentCount}`,
      basis: "lib/agents/registry.ts に実装があるAgent数 / 契約の総数（共通17体＋Web制作9体）",
    },
    {
      label: "本日の処理",
      value: String(todayCount),
      unit: "件",
      basis: "cases/ 配下で、本日 startedAt の案件件数",
    },
    {
      label: "承認待ち",
      value: String(overall.pendingApprovals),
      unit: "件",
      basis: "cases/ 配下の案件のうち、PENDING 状態の承認要求の総数",
    },
    {
      label: "削減時間（今月）",
      value: (monthStats.savedMinutes / 60).toFixed(1),
      unit: "時間",
      basis: `今月 startedAt の案件のうち、完了${monthStats.savedFromCases}件 × ${MINUTES_PER_CASE}分（承認待ちは含めない）`,
    },
  ];

  const pending = pendingApprovalsOf(cases);
  const activity = summarizeAgentActivity(cases, today);
  const daily = summarizeByDay(cases, MINUTES_PER_CASE);
  const implementedActivity = IMPLEMENTED_AGENT_IDS.map(
    (agentId) =>
      activity.get(agentId) ?? {
        agentId,
        totalSteps: 0,
        completed: 0,
        completedToday: 0,
        lastCompletedAt: null,
      },
  );
  const maxCompletedToday = Math.max(
    1,
    ...implementedActivity.map((a) => a.completedToday),
  );

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

        {loadError && (
          <Card className="border-warn/40 bg-warn-soft/30">
            <div className="flex items-start gap-3">
              <IconTile name="alert" tone="warn" />
              <div>
                <p className="text-xs font-medium text-ink">
                  案件の保存先に接続できていません
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  環境変数（GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN）が
                  設定されているか確認してください。このページの数字はすべて0件として出ています。
                </p>
                <p className="mt-1 font-mono text-[10px] text-ink-subtle">
                  {loadError}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* KPI。固定値ではなく cases/ 配下の実際の案件と registry から数える */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <Card key={kpi.label}>
              <div className="flex min-w-0 items-start gap-3">
                <IconTile name={KPI_ICON[i]} tone={KPI_TONE[i]} />
                <Metric
                  label={kpi.label}
                  value={kpi.value}
                  unit={kpi.unit}
                  basis={kpi.basis}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* 承認待ちキュー。cases/ 配下の実際の承認要求（監視のみ。承認・却下は /cases で行う） */}
        <Card>
          <CardHeader
            title="承認待ちキュー"
            action={<Badge tone="idle">{pending.length}件</Badge>}
          />
          {pending.length === 0 ? (
            <p className="rounded-lg bg-surface-muted px-3 py-4 text-center text-[12px] text-ink-muted">
              いま承認待ちの案件はありません
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pending.map((ap) => (
                <div
                  key={ap.approvalId}
                  className="flex items-start gap-2.5 rounded-lg border border-line p-3"
                >
                  <IconTile
                    name={REASON_ICON[ap.reason] ?? "shield"}
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
                      <Badge tone={ap.reason === "外部送信" ? "danger" : "idle"}>
                        {ap.reason}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex w-[104px] shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[10px] text-ink-subtle">
                      {ap.requestedAt}
                    </span>
                    <Link
                      href="/cases"
                      className="min-h-[38px] rounded-lg border border-line-strong bg-surface px-3 py-2 text-center text-[11px] font-medium text-ink hover:bg-surface-muted"
                    >
                      /cases で対応
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 自動化効果の推移。日ごとの実件数から作る */}
        <Card>
          <CardHeader
            title="自動化効果の推移"
            badge={
              <span className="text-[10px] font-normal text-ink-subtle">
                cases/ の実件数から算出
              </span>
            }
          />
          <div className="mb-2 flex flex-wrap gap-4 text-[10px] text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-primary" />受け付けた件数（日次）
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-ok" />
              累積削減時間（時間）
            </span>
          </div>
          <TrendChart data={daily} />
        </Card>

        {/* 実装のあるAgentの稼働状況。共通17体＋Web制作9体のうち、実体があるものだけ */}
        <Card>
          <CardHeader
            title="Agentの稼働状況"
            action={
              <Link href="/agents">
                <LinkAction>Agent一覧（全{totalAgentCount}体）</LinkAction>
              </Link>
            }
          />
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="sticky top-0 border-b border-line bg-surface text-[10px] text-ink-muted">
                  <th className="pb-2 font-medium">Agent</th>
                  <th className="pb-2 text-right font-medium">本日の完了</th>
                  <th className="pb-2 text-right font-medium">累計完了 / 登場</th>
                  <th className="pb-2 font-medium">状態</th>
                  <th className="pb-2 text-right font-medium">最終完了</th>
                </tr>
              </thead>
              <tbody>
                {implementedActivity.map((a) => {
                  const state =
                    a.completed > 0
                      ? { label: "稼働実績あり", tone: "ok" as const }
                      : a.totalSteps > 0
                        ? { label: "登場のみ・未完了", tone: "warn" as const }
                        : { label: "実行なし", tone: "idle" as const };
                  return (
                    <tr key={a.agentId} className="border-b border-line last:border-0">
                      <td className="py-2">
                        <span className="flex items-center gap-1.5 text-[11px] text-ink">
                          <span
                            className={`size-1.5 shrink-0 rounded-full ${
                              state.tone === "ok"
                                ? "bg-ok"
                                : state.tone === "warn"
                                  ? "bg-warn"
                                  : "bg-idle"
                            }`}
                          />
                          <span className="truncate">{agentName(a.agentId)}</span>
                        </span>
                      </td>
                      <td className="tabular py-2 text-right text-[11px] text-ink-muted">
                        {a.completedToday}
                      </td>
                      <td className="tabular py-2 text-right text-[11px] text-ink-muted">
                        {a.completed} / {a.totalSteps}
                      </td>
                      <td className="py-2">
                        <Badge tone={state.tone}>{state.label}</Badge>
                      </td>
                      <td className="py-2 text-right text-[10px] text-ink-subtle">
                        {a.lastCompletedAt?.slice(0, 10) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-ink-subtle">
            契約は{totalAgentCount}体。うち実装があるのは{implementedCount}体
          </p>
        </Card>

        {/* Agentごとの処理内訳（本日）。上の表と同じ実績を降順の棒で見せる */}
        <Card>
          <CardHeader
            title="本日の処理内訳（Agentごと）"
            badge={
              <span className="text-[10px] font-normal text-ink-subtle">
                実装のあるAgentの本日の完了件数を降順で表示
              </span>
            }
          />
          {implementedActivity.every((a) => a.completedToday === 0) ? (
            <p className="rounded-lg bg-surface-muted px-3 py-4 text-center text-[12px] text-ink-muted">
              本日はまだ完了した工程がありません
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...implementedActivity]
                .sort((a, b) => b.completedToday - a.completedToday)
                .map((a) => {
                  const pct = Math.round((a.completedToday / maxCompletedToday) * 100);
                  return (
                    <div key={a.agentId} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-[11px] text-ink">
                        {agentName(a.agentId)}
                      </span>
                      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-ok"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="tabular w-10 shrink-0 text-right text-[11px] text-ink-muted">
                        {a.completedToday}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>

        <p className="flex items-center gap-1.5 text-[10px] text-ink-subtle">
          <Icon name="clock" className="size-3" />
          アクセスするたびに cases/ を数え直します（固定の更新間隔はありません）
        </p>
      </div>
    </Shell>
  );
}
