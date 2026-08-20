import { ADMIN_NAV } from "@/components/admin-nav";
import { Shell } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Icon,
  IconTile,
  ProgressBar,
  StepStatusBadge,
  type Tone,
} from "@/components/ui";
import { agentName } from "@/lib/data/agents";
import { LIVE_RUN, LIVE_RUN_LOG } from "@/lib/data/runs";

export const metadata = { title: "ライブ実行トレース" };

const AGENT_ICON: Record<string, string> = {
  intake: "inbox",
  "marketing-research": "search",
  "data-analyst": "chart",
  approval: "shield",
  executor: "send",
};

const LOG_STATUS_TONE: Record<string, Tone> = {
  成功: "ok",
  失敗: "danger",
  承認待ち: "warn",
  停止: "danger",
};

const SOURCE_ICON: Record<string, string> = {
  csv: "sheet",
  pdf: "file",
  database: "database",
  spreadsheet: "sheet",
  mail: "mail",
};

export default function LiveTrace() {
  const run = LIVE_RUN;
  const runningStep = run.steps.find((s) => s.status === "RUNNING");
  const decision = run.decisions[0];
  const progressPct = runningStep?.progress
    ? Math.round(
        (runningStep.progress.done / runningStep.progress.total) * 100,
      )
    : 0;

  return (
    <Shell
      nav={ADMIN_NAV}
      activeHref="/admin/live"
      brand={
        <div className="flex items-center gap-2 text-nav-text-active">
          <Icon name="robot" className="size-4" />
          <span className="text-[13px] font-semibold">業務自動化ハーネス</span>
        </div>
      }
      footer={
        <span className="cursor-pointer text-[11px] text-nav-text hover:text-nav-text-active">
          ≪ メニューを折りたたむ
        </span>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-7 sm:py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold text-ink">ライブ実行トレース</h1>
          <Badge tone="ok" dot>
            実行中
          </Badge>
          {/* run_id は常に見える位置に出す。監査で最初に必要になる情報 */}
          <span className="tabular flex items-center gap-1.5 text-[11px] text-ink-muted">
            Run ID:{" "}
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-ink">
              {run.runId}
            </span>
            <span className="cursor-pointer">⧉</span>
          </span>
          <span className="text-[11px] text-ink-muted">
            開始時刻: {run.startedAt}
          </span>
          <span className="tabular text-[11px] text-ink-muted">
            経過時間: 00:00:26
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm">
            <Icon name="pause" className="size-3.5" /> 一時停止
          </Button>
          <Button variant="warn" size="sm">
            <Icon name="stop" className="size-3.5" /> 停止
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-7 sm:py-5 xl:grid-cols-[1fr_290px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* パイプライン。5枚をスマホ幅に押し込むと文字が縦一列に割れるので、
              横スクロールさせる（ページ全体は横に伸ばさない） */}
          <div className="-mx-4 flex items-stretch gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {run.steps.map((step, i) => {
              const active = step.status === "RUNNING";
              return (
                <div key={step.stepId} className="flex min-w-[150px] flex-1 items-center gap-1.5">
                  <div
                    className={`flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-3 ${
                      active
                        ? "border-primary bg-surface ring-2 ring-primary/15"
                        : "border-line bg-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <IconTile
                          name={AGENT_ICON[step.agentId] ?? "robot"}
                          tone={
                            step.status === "COMPLETED"
                              ? "ok"
                              : active
                                ? "primary"
                                : step.status === "WAITING_APPROVAL"
                                  ? "warn"
                                  : "idle"
                          }
                          size="sm"
                        />
                        <span className="truncate">
                          {agentName(step.agentId)}
                        </span>
                      </span>
                      {step.status === "COMPLETED" && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-ok text-white">
                          <Icon name="check" className="size-2.5" />
                        </span>
                      )}
                      {active && (
                        <span className="size-2 animate-pulse rounded-full bg-primary" />
                      )}
                    </div>
                    <StepStatusBadge status={step.status} />
                    <p className="text-[11px] leading-relaxed text-ink-muted">
                      {step.summary}
                    </p>
                    {step.completedAt && (
                      <p className="text-[10px] text-ink-subtle">
                        完了時刻: {step.completedAt}
                      </p>
                    )}
                    {step.progress && (
                      <>
                        <p className="text-[10px] text-ink-subtle">
                          処理件数{" "}
                          <span className="tabular text-ink">
                            {step.progress.done.toLocaleString()} /{" "}
                            {step.progress.total.toLocaleString()} 件
                          </span>
                        </p>
                        <p className="text-[10px] text-ink-subtle">
                          現在のアクション
                          <br />
                          {step.progress.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={progressPct} />
                          <span className="tabular shrink-0 text-[10px] text-ink-muted">
                            {progressPct}%
                          </span>
                        </div>
                      </>
                    )}
                    {/* 待機中は「何を待っているか」を必ず出す */}
                    {step.waitingFor && (
                      <p className="text-[10px] text-ink-subtle">
                        開始条件: {step.waitingFor}
                      </p>
                    )}
                    {step.handoffTo && (
                      <p className="mt-auto border-t border-line pt-2 text-[10px] text-ink-muted">
                        {step.status === "COMPLETED" ? "ハンドオフ先" : "次のハンドオフ先"}
                        :{" "}
                        <span className="text-primary-text">
                          {agentName(step.handoffTo)} ›
                        </span>
                      </p>
                    )}
                  </div>
                  {i < run.steps.length - 1 && (
                    <span className="shrink-0 text-ink-subtle">→</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            {/* 実行ログ */}
            <Card padded={false}>
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 className="text-[15px] font-semibold text-ink">実行ログ</h2>
                <span className="flex items-center gap-3 text-[10px] text-ink-muted">
                  <span className="flex items-center gap-1">
                    自動スクロール
                    <span className="inline-flex h-3.5 w-6 items-center rounded-full bg-primary px-0.5">
                      <span className="ml-auto size-2.5 rounded-full bg-white" />
                    </span>
                  </span>
                  <span className="cursor-pointer">⚙ フィルター</span>
                </span>
              </div>
              <div className="max-h-[340px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-surface-muted">
                    <tr className="text-[10px] text-ink-muted">
                      <th className="px-3 py-2 font-medium">時刻</th>
                      <th className="px-2 py-2 font-medium">エージェント</th>
                      <th className="px-2 py-2 font-medium">イベント</th>
                      <th className="px-3 py-2 text-right font-medium">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {LIVE_RUN_LOG.map((log) => (
                      <tr
                        key={log.eventId}
                        className={`border-b border-line align-top last:border-0 ${
                          log.detail ? "bg-primary-soft/40" : ""
                        }`}
                      >
                        <td className="tabular whitespace-nowrap px-3 py-2 text-[10px] text-ink-subtle">
                          {log.timestamp}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-[10px] text-ink">
                          {log.actor}
                        </td>
                        <td className="px-2 py-2 text-[11px] leading-snug text-ink">
                          {log.action}
                          {log.detail && (
                            <div className="mt-2 rounded-lg bg-surface p-2.5">
                              <p className="text-[10px] font-medium text-ink-muted">
                                詳細情報
                              </p>
                              <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                                {log.detail}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Badge tone={LOG_STATUS_TONE[log.status]}>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* 判断理由 */}
            <Card>
              <CardHeader
                title={`判断理由（${agentName(decision.agentId)}）`}
              />
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[10px] font-medium text-ink-muted">結論</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink">
                    {decision.conclusion}
                  </p>
                </div>
                {/* 根拠のない結論は表示しない。監査で最初に問われる部分 */}
                <div>
                  <p className="text-[10px] font-medium text-ink-muted">
                    根拠（エビデンス）
                  </p>
                  <ul className="mt-1 flex flex-col gap-1">
                    {decision.evidence.map((e) => (
                      <li
                        key={e.label}
                        className="flex gap-1.5 text-[10px] leading-relaxed text-ink"
                      >
                        <span className="text-ink-subtle">•</span>
                        {e.detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg bg-ok-soft p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-muted">信頼度</span>
                    <span className="tabular text-sm font-semibold text-ok">
                      {Math.round(decision.confidence * 100)}%
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-ink-muted">
                    <span className="font-medium text-ok">高</span>{" "}
                    データの完全性と一貫性が確認されています。
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-ink-muted">
                    次のアクション
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-ink">
                    • {decision.nextAction}
                  </p>
                </div>
                <Button variant="default" size="sm" full>
                  詳細な分析結果を表示 ↗
                </Button>
              </div>
            </Card>
          </div>

          {/* タイムライン */}
          <Card>
            <div className="flex items-center justify-between text-[10px] text-ink-muted">
              <span>{run.startedAt.split(" ")[1]} 開始</span>
              <span>{run.expectedEndAt} 予定終了</span>
            </div>
            <div className="relative mt-3 flex items-center">
              <div className="absolute inset-x-0 h-0.5 bg-line" />
              <div className="absolute left-0 h-0.5 w-1/2 bg-ok" />
              {run.steps.map((step, i) => {
                const pos = (i / (run.steps.length - 1)) * 100;
                const done = step.status === "COMPLETED";
                const active = step.status === "RUNNING";
                return (
                  <span
                    key={step.stepId}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${pos}%` }}
                  >
                    <span
                      className={`block rounded-full ${
                        done
                          ? "size-3 bg-ok"
                          : active
                            ? "size-4 border-[3px] border-primary bg-surface"
                            : step.status === "WAITING_APPROVAL"
                              ? "size-3 bg-warn"
                              : "size-3 bg-idle"
                      }`}
                    />
                  </span>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 右カラム：コンテキスト */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="現在のコンテキスト"
              action={<Icon name="history" className="size-3.5 text-ink-subtle" />}
            />
            <p className="mb-2 text-[10px] font-medium text-ink-muted">
              ソースファイルとデータ
            </p>
            <div className="flex flex-col gap-2">
              {run.contextSources.map((src) => (
                <div
                  key={src.sourceId}
                  className="rounded-lg border border-line p-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon
                      name={SOURCE_ICON[src.kind]}
                      className="size-3.5 shrink-0 text-ok"
                    />
                    <span className="truncate text-[11px] text-ink">
                      {src.name}
                    </span>
                  </div>
                  {/* 権限を毎回明示する。読めるはずのないデータを黙って使わせない */}
                  <div className="mt-1.5">
                    <Badge tone="ok">アクセス可（{src.access}）</Badge>
                  </div>
                  <p className="mt-1 text-[9px] text-ink-subtle">
                    最終更新: {src.updatedAt}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[10px] font-medium text-ink-muted">
              データチップ（現在の入力）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {run.contextChips.map((chip) => (
                <span
                  key={chip.label}
                  className="rounded-md bg-surface-muted px-2 py-1 text-[10px] text-ink"
                >
                  {chip.label}: {chip.value}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[10px] font-medium text-ink-muted">
              メタ情報
            </p>
            <dl className="flex flex-col gap-1.5 text-[10px]">
              {[
                ["実行タイプ", run.trigger],
                ["優先度", run.priority],
                ["トリガー", run.requestedBy],
                ["説明", run.description],
                ["Workflow", `${run.workflowId} v${run.workflowVersion}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-ink-muted">{k}</dt>
                  <dd className="truncate text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {/* 二重実行を防ぐ鍵。ここが見えると事故調査が早い */}
            <p className="mt-2 truncate border-t border-line pt-2 text-[9px] text-ink-subtle">
              idempotency: {run.idempotencyKey}
            </p>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
