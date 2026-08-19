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
  ProgressRing,
  type Tone,
} from "@/components/ui";
import {
  CEO_APPROVALS,
  CEO_INSTRUCTIONS,
  CEO_METRICS,
  CEO_SAMPLE_INSTRUCTION,
  SECRETARY_ACTIVITY,
} from "@/lib/data/workspace";

export const metadata = { title: "CEOアシスタント" };

const NAV: NavItem[] = [
  { label: "経営ホーム", href: "/ceo/home", icon: "home" },
  { label: "秘書への指示", href: "/ceo", icon: "edit" },
  { label: "今日の予定", href: "/ceo/schedule", icon: "calendar" },
  { label: "承認待ち", href: "/ceo/approvals", icon: "check", badge: 3 },
  { label: "重要案件", href: "/ceo/cases", icon: "star" },
  { label: "経営データ", href: "/ceo/data", icon: "chart" },
  { label: "履歴", href: "/ceo/history", icon: "history" },
];

const ACTIVITY_TONE: Record<string, Tone> = {
  進行中: "info",
  完了: "ok",
  承認待ち: "warn",
};

const SELECTS = [
  { label: "優先度", value: "★ 最優先", icon: "star" },
  { label: "期限", value: "今日 17:00", icon: "calendar" },
  { label: "担当者", value: "CEO秘書", icon: "people" },
  { label: "機密レベル", value: "社内秘", icon: "shield" },
];

export default function CeoAssistant() {
  return (
    <Shell
      variant="dark"
      nav={NAV}
      activeHref="/ceo"
      brand={
        <div className="flex items-center gap-2 text-nav-text-active">
          <Icon name="building" className="size-4" />
          <span className="text-[13px] font-semibold">経営室</span>
        </div>
      }
      footer={
        <div className="rounded-lg bg-nav-hover p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-nav-text-active">
            <Icon name="shield" className="size-3.5 text-ok" />
            セキュリティレベル：高
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-nav-text">
            すべての操作は記録・監査されています
          </p>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-7 py-3.5">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-ink">CEOアシスタント</h1>
          <span className="flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] text-ink-muted">
            <Icon name="building" className="size-3.5" />
            経営室 ⌄
          </span>
          <Badge tone="danger">🔒 機密</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Icon name="bell" className="size-4 text-ink-muted" />
          <UserChip name="CEO" dark={false} />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-7 py-5">
        {/* 指示入力 */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Icon name="send" className="size-4 text-primary" />
                秘書に指示する
              </span>
            }
          />
          <div className="rounded-lg border border-line bg-surface-muted p-4">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink">
              {CEO_SAMPLE_INSTRUCTION}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            {SELECTS.map((s) => (
              <div key={s.label} className="min-w-[150px] flex-1">
                <label className="mb-1 block text-[11px] text-ink-muted">
                  {s.label}
                </label>
                <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink">
                  <Icon name={s.icon} className="size-3.5 text-ink-muted" />
                  <span className="flex-1">{s.value}</span>
                  <span className="text-ink-subtle">⌄</span>
                </div>
              </div>
            ))}
            <Button variant="primary">
              <Icon name="send" className="size-3.5" /> 指示を送る
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 進行中の指示 */}
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-1.5">
                  <Icon name="list" className="size-4 text-ink-muted" />
                  進行中の指示
                </span>
              }
              action={<LinkAction>すべて見る</LinkAction>}
            />
            <div className="flex flex-col gap-2.5">
              {CEO_INSTRUCTIONS.map((ins) => (
                <div
                  key={ins.instructionId}
                  className="rounded-lg border border-line p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink">
                        {ins.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <span
                            className={`size-1.5 rounded-full ${
                              ins.assignee === "AI秘書"
                                ? "bg-info"
                                : "bg-primary"
                            }`}
                          />
                          {ins.assignee}
                        </span>
                        <span
                          className={
                            ins.priority === "最優先"
                              ? "text-warn"
                              : ins.priority === "高"
                                ? "text-danger"
                                : ""
                          }
                        >
                          {ins.priority === "最優先" ? "★ " : ""}
                          {ins.priority}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="clock" className="size-3" />
                          {ins.dueLabel}
                        </span>
                      </div>
                    </div>
                    <ProgressRing value={ins.progress} />
                  </div>
                  <p className="mt-2 text-[10px] text-ink-muted">
                    {ins.subStatus}
                  </p>
                  {ins.status === "完了" && (
                    <div className="mt-1.5">
                      <Badge tone="ok">完了</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <LinkAction>すべての進行中の指示を表示</LinkAction>
            </div>
          </Card>

          {/* 秘書チームの活動 */}
          <Card>
            <CardHeader
              title="秘書チームの活動"
              action={<LinkAction>すべて見る</LinkAction>}
            />
            <ul className="flex flex-col">
              {SECRETARY_ACTIVITY.map((a, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-b border-line py-2.5 last:border-0"
                >
                  <span className="tabular w-9 shrink-0 pt-0.5 text-[10px] text-ink-subtle">
                    {a.time}
                  </span>
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[9px] font-semibold ${
                      a.actorType === "agent"
                        ? "bg-info-soft text-info"
                        : a.actorType === "human"
                          ? "bg-primary-soft text-primary-text"
                          : "bg-warn-soft text-warn"
                    }`}
                  >
                    {a.actorType === "agent"
                      ? "AI"
                      : a.actorType === "human"
                        ? "人"
                        : "⚑"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-snug text-ink">
                      <span className="font-medium">{a.actor}</span>が
                      {a.action.split("｜")[0]}
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {a.action.split("｜")[1]}
                    </p>
                  </div>
                  <Badge tone={ACTIVITY_TONE[a.status]}>{a.status}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <LinkAction>すべての活動履歴を表示</LinkAction>
            </div>
          </Card>

          {/* 要確認 */}
          <Card>
            <CardHeader
              title="要確認"
              badge={<Badge tone="warn">{CEO_APPROVALS.length}</Badge>}
            />
            <div className="flex flex-col gap-2.5">
              {CEO_APPROVALS.map((ap) => (
                <div
                  key={ap.approvalId}
                  className="rounded-lg border border-line p-3"
                >
                  <div className="flex gap-2.5">
                    <IconTile
                      name={
                        ap.reason === "外部送信"
                          ? "mail"
                          : ap.title.includes("会食")
                            ? "food"
                            : "lock"
                      }
                      tone="idle"
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink">
                        {ap.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-muted">
                        {ap.detail}
                      </p>
                      {/* なぜ止まっているかを必ず書く */}
                      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-danger">
                        <span>⛔</span>
                        {ap.reason}には承認が必要です
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <Button variant="primary" size="sm">
                        確認
                      </Button>
                      <Button variant="default" size="sm">
                        差し戻す
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <LinkAction>すべての要確認事項を表示</LinkAction>
            </div>
          </Card>
        </div>

        {/* 指標 */}
        <Card>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-5">
            {CEO_METRICS.map((m) => (
              <Metric
                key={m.label}
                label={m.label}
                value={m.value}
                unit={m.unit}
                delta={m.deltaLabel}
                direction={m.deltaDirection}
                basis={m.basis}
              />
            ))}
            <div className="col-span-2 flex items-start gap-3 rounded-lg bg-surface-muted p-3 md:col-span-1">
              <Icon name="shield" className="size-4 shrink-0 text-ok" />
              <div className="min-w-0">
                <p className="text-[11px] leading-snug text-ink">
                  AI秘書は承認が必要な操作を停止しています
                </p>
                <p className="mt-1 text-[10px] text-ink-muted">
                  機密情報の保護とガバナンスを最優先に運用しています。
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone="ok" dot>
                    システム正常
                  </Badge>
                  <Button variant="default" size="sm">
                    監査ログを表示
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
