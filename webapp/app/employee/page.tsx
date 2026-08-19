import { Shell, UserChip, type NavItem } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Icon,
  IconTile,
  LinkAction,
  Metric,
  type Tone,
} from "@/components/ui";
import {
  ASSISTANT_THREAD,
  AUTOMATED_WORK,
  CURRENT_EMPLOYEE,
  EMPLOYEE_APPROVALS,
  EMPLOYEE_SAVINGS,
  EMPLOYEE_TASKS,
  WEEKLY_AUTOMATION_SUMMARY,
} from "@/lib/data/workspace";

export const metadata = { title: "お仕事コックピット" };

const NAV: NavItem[] = [
  { label: "ホーム", href: "/employee", icon: "home" },
  { label: "今日の仕事", href: "/employee/today", icon: "calendar" },
  { label: "AIアシスタント", href: "/employee/assistant", icon: "sparkle" },
  { label: "承認", href: "/employee/approvals", icon: "check", badge: 2 },
  { label: "自分のデータ", href: "/employee/data", icon: "database" },
  { label: "履歴", href: "/employee/history", icon: "history" },
];

const TASK_TONE: Record<string, Tone> = {
  未対応: "info",
  進行中: "primary",
  承認待ち: "warn",
};

const TASK_BUTTON: Record<string, "primary" | "outline"> = {
  未対応: "primary",
  進行中: "outline",
  承認待ち: "outline",
};

export default function EmployeeCockpit() {
  return (
    <Shell
      variant="dark"
      nav={NAV}
      activeHref="/employee"
      brand={
        <div className="flex items-center gap-2 text-nav-text-active">
          <Icon name="grid" className="size-4" />
          <span className="text-[13px] font-semibold">ワークスペース</span>
        </div>
      }
      footer={
        <UserChip
          name={CURRENT_EMPLOYEE.name}
          sub={CURRENT_EMPLOYEE.department}
        />
      }
    >
      <div className="flex items-start justify-between gap-6 px-7 pb-2 pt-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">お仕事コックピット</h1>
          <p className="mt-2 flex items-center gap-2 text-[13px] text-ink-muted">
            <span className="text-warn">☀</span>
            {CURRENT_EMPLOYEE.displayName}さん、おはようございます
            <Badge tone="idle">{CURRENT_EMPLOYEE.department}</Badge>
          </p>
        </div>
        {/* 権限の範囲を常に見せる。設計書 8. の「権限のある社内データだけ」表示 */}
        <Card className="hidden max-w-[330px] shrink-0 lg:block">
          <div className="flex gap-3">
            <IconTile name="lock" tone="primary" />
            <div>
              <p className="text-xs leading-relaxed text-ink">
                あなたが利用できるのは、権限のある社内データのみです
              </p>
              <LinkAction>データの利用範囲を確認</LinkAction>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-7 pb-8 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="今日の優先タスク"
              action={<LinkAction>すべてのタスクを見る</LinkAction>}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {EMPLOYEE_TASKS.map((task) => (
                <div
                  key={task.taskId}
                  className="flex flex-col gap-2.5 rounded-lg border border-line p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-5 items-center justify-center rounded-md bg-idle-soft text-[11px] font-semibold text-ink-muted">
                      {task.order}
                    </span>
                    <IconTile name={task.icon} tone="primary" size="sm" />
                  </div>
                  <h3 className="text-[13px] font-semibold leading-snug text-ink">
                    {task.title}
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    期限:{" "}
                    <span
                      className={
                        task.dueUrgent ? "font-medium text-danger" : "text-ink"
                      }
                    >
                      {task.dueLabel}
                    </span>
                  </p>
                  <Badge tone={TASK_TONE[task.status]}>{task.status}</Badge>
                  <p className="text-[11px] leading-relaxed text-ink-muted">
                    {task.description}
                  </p>
                  <div className="mt-auto pt-1">
                    <Button variant={TASK_BUTTON[task.status]} size="sm" full>
                      {task.actionLabel}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="自動化された作業"
                badge={<Badge tone="ok">完了</Badge>}
                action={<LinkAction>すべて見る</LinkAction>}
              />
              <ul className="flex flex-col">
                {AUTOMATED_WORK.map((work) => (
                  <li
                    key={work.workId}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
                  >
                    <IconTile name={work.icon} tone="idle" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-ink">{work.title}</p>
                      <p className="text-[10px] text-ink-subtle">
                        {work.completedAt}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-[11px] font-medium text-ok">
                      {work.savedMinutes}分 削減
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm">
                        確認
                      </Button>
                      {/* 自動処理は必ず取り消せるようにする */}
                      <Button variant="ghost" size="sm">
                        元に戻す
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-[11px] text-ok">
                <Icon name="check" className="size-3.5" />
                {WEEKLY_AUTOMATION_SUMMARY}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="承認が必要です"
                badge={<Badge tone="warn">{EMPLOYEE_APPROVALS.length}件</Badge>}
                action={<LinkAction>すべて見る</LinkAction>}
              />
              <div className="flex flex-col gap-2.5">
                {EMPLOYEE_APPROVALS.map((ap) => (
                  <div
                    key={ap.approvalId}
                    className={`rounded-lg border p-3 ${
                      ap.priority === "高優先度"
                        ? "border-warn/30 bg-warn-soft/40"
                        : "border-line"
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <IconTile name="doc" tone="idle" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium leading-snug text-ink">
                          {ap.title}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-muted">
                          依頼者: {ap.requestedBy}
                        </p>
                        <p className="text-[10px] text-ink-muted">
                          依頼日時: {ap.requestedAt}
                        </p>
                        <div className="mt-1.5">
                          {ap.priority === "高優先度" ? (
                            <Badge tone="warn">↑ 高優先度</Badge>
                          ) : (
                            <Badge tone="idle">通常</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {ap.priority === "高優先度" && (
                      <div className="mt-2.5 flex gap-2">
                        <Button variant="warn" size="sm">
                          <Icon name="check" className="size-3.5" /> 承認する
                        </Button>
                        <Button variant="default" size="sm">
                          内容を確認
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title={
                <span>
                  今週の自動化効果{" "}
                  <span className="text-[11px] font-normal text-ink-subtle">
                    （5/12〜5/16）
                  </span>
                </span>
              }
              action={<LinkAction>効果の詳細を見る</LinkAction>}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {EMPLOYEE_SAVINGS.map((m, i) => (
                <div key={m.label} className="flex items-center gap-3">
                  <IconTile
                    name={["clock", "inbox", "check"][i]}
                    tone={["ok", "primary", "ok"][i] as Tone}
                  />
                  <Metric
                    label={m.deltaLabel ?? ""}
                    value={m.value}
                    unit={`${m.unit} ${m.label}`}
                    basis={m.basis}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AIアシスタント */}
        <Card className="flex h-fit flex-col xl:sticky xl:top-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Icon name="sparkle" className="size-4 text-primary" />
                AIアシスタント
              </span>
            }
            action={
              <span className="flex gap-2 text-ink-subtle">
                <Icon name="history" className="size-4 cursor-pointer" />
                <span className="cursor-pointer">⋮</span>
              </span>
            }
          />
          <div className="flex flex-col gap-4">
            {ASSISTANT_THREAD.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex flex-col items-end gap-1">
                  <div className="flex w-full items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-idle-soft text-[9px] text-ink-muted">
                      あ
                    </span>
                    <span className="text-[10px] text-ink-subtle">あなた</span>
                    <span className="ml-auto text-[10px] text-ink-subtle">
                      {msg.time}
                    </span>
                  </div>
                  <p className="rounded-lg bg-primary px-3 py-2 text-xs text-white">
                    {msg.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon name="sparkle" className="size-3" />
                    </span>
                    <span className="text-[10px] text-ink-subtle">
                      AIアシスタント
                    </span>
                    <span className="ml-auto text-[10px] text-ink-subtle">
                      {msg.time}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface-muted p-3">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-ink">
                      {msg.text}
                    </p>
                    {msg.bullets && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {msg.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex gap-1.5 text-[11px] text-ink"
                          >
                            <span className="text-ink-subtle">•</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-[11px] text-ink-muted">
                      価格に関する課題が最多でした。
                      <br />
                      提案内容の最適化が有効と考えられます。
                    </p>
                    {/* 出典を必ず添える。出せない回答は画面に出さない */}
                    {msg.sources && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] text-ink-subtle">
                          参照ソース
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {msg.sources.map((s) => (
                            <span
                              key={s.name}
                              className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5 text-[10px] text-ink"
                            >
                              <Icon
                                name={s.kind === "database" ? "database" : "sheet"}
                                className="size-3 text-ok"
                              />
                              <span className="flex-1 truncate">{s.name}</span>
                              <span className="text-ink-subtle">↗</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <Button variant="default" size="sm" full>
                        詳細を見る
                      </Button>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-line px-3 py-2">
            <span className="flex-1 text-xs text-ink-subtle">
              何をお手伝いしましょうか？
            </span>
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
              <Icon name="send" className="size-3.5" />
            </span>
          </div>
          <p className="mt-2 text-center text-[10px] text-ink-subtle">
            AIの回答は参考情報です。最終判断はご自身でお願いします。
          </p>
        </Card>
      </div>
    </Shell>
  );
}
