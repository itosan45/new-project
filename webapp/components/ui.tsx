import type { ReactNode } from "react";
import type {
  AgentHealth,
  RunStatus,
  StepStatus,
} from "@/lib/domain/types";
import { RUN_STATUS_LABEL, STEP_STATUS_LABEL } from "@/lib/domain/types";

// ---------------------------------------------------------------------------
// 面（カード）
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-surface ${
        padded ? "p-4 sm:p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  action,
  badge,
}: {
  title: ReactNode;
  action?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {badge}
      </div>
      {action}
    </div>
  );
}

export function LinkAction({ children }: { children: ReactNode }) {
  return (
    <span className="cursor-pointer text-xs text-ink-muted hover:text-primary">
      {children} ›
    </span>
  );
}

// ---------------------------------------------------------------------------
// バッジ
// ---------------------------------------------------------------------------

export type Tone =
  | "ok"
  | "warn"
  | "danger"
  | "info"
  | "idle"
  | "primary";

const TONE_CLASS: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  idle: "bg-idle-soft text-ink-muted",
  primary: "bg-primary-soft text-primary-text",
};

export function Badge({
  children,
  tone = "idle",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden />
      )}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 状態表示
//
// 「成功 / 部分成功 / 未実行 / 失敗」を見た目で必ず区別する。
// 設計書が目標ゼロに置く「未実行を成功扱い」は、ここを同色にした瞬間に起きる。
// ---------------------------------------------------------------------------

const RUN_TONE: Record<RunStatus, Tone> = {
  QUEUED: "idle",
  RUNNING: "info",
  RETRYING: "warn",
  RECOVERING: "warn",
  VERIFYING: "info",
  SUCCEEDED: "ok",
  PARTIAL_SUCCESS: "warn",
  BLOCKED: "danger",
  FAILED: "danger",
  HUMAN_REVIEW: "warn",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <Badge tone={RUN_TONE[status]} dot={status === "RUNNING"}>
      {RUN_STATUS_LABEL[status]}
    </Badge>
  );
}

const STEP_TONE: Record<StepStatus, Tone> = {
  PENDING: "idle",
  RUNNING: "primary",
  COMPLETED: "ok",
  WAITING_APPROVAL: "warn",
  SKIPPED: "idle",
  FAILED: "danger",
};

export function StepStatusBadge({ status }: { status: StepStatus }) {
  return (
    <Badge tone={STEP_TONE[status]} dot={status === "RUNNING"}>
      {STEP_STATUS_LABEL[status]}
    </Badge>
  );
}

const HEALTH_TONE: Record<AgentHealth, Tone> = {
  正常: "ok",
  注意: "warn",
  異常: "danger",
};

export function HealthBadge({ health }: { health: AgentHealth }) {
  return <Badge tone={HEALTH_TONE[health]}>{health}</Badge>;
}

// ---------------------------------------------------------------------------
// ボタン
// ---------------------------------------------------------------------------

export function Button({
  children,
  variant = "default",
  size = "md",
  full = false,
}: {
  children: ReactNode;
  variant?: "primary" | "default" | "outline" | "warn" | "ghost";
  size?: "sm" | "md";
  full?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-[13px]",
  };
  const variants = {
    primary: "bg-primary text-white hover:opacity-90",
    default:
      "border border-line-strong bg-surface text-ink hover:bg-surface-muted",
    outline:
      "border border-primary/30 bg-surface text-primary-text hover:bg-primary-soft",
    warn: "bg-warn text-white hover:opacity-90",
    ghost: "text-ink-muted hover:bg-surface-muted",
  };
  return (
    <button
      type="button"
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        full ? "w-full" : ""
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 指標
// ---------------------------------------------------------------------------

export function Metric({
  label,
  value,
  unit,
  delta,
  direction,
  basis,
  icon,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  direction?: "up" | "down" | "flat";
  /** 算出根拠。ホバーで出す。根拠を書けない数字は画面に出さない。 */
  basis?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "±";
  const deltaColor =
    direction === "up"
      ? "text-ok"
      : direction === "down"
        ? "text-ink-muted"
        : "text-ink-subtle";
  return (
    <div className="flex flex-col gap-1" title={basis}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-ink-muted">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="tabular text-2xl font-semibold text-ink">{value}</span>
        {unit && <span className="text-xs text-ink-muted">{unit}</span>}
      </div>
      {delta && (
        <span className={`text-[11px] ${deltaColor}`}>
          {arrow} {delta}
        </span>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 進捗
// ---------------------------------------------------------------------------

export function ProgressBar({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "ok" | "warn";
}) {
  const color =
    tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-warn" : "bg-primary";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-idle-soft">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 44,
}: {
  value: number;
  size?: number;
}) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = Math.min(100, Math.max(0, value));
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--idle-soft)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done >= 100 ? "var(--ok)" : "var(--primary)"}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (c * done) / 100}
        strokeLinecap="round"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="tabular rotate-90 fill-ink text-[10px] font-semibold"
        style={{ transformOrigin: "center" }}
      >
        {done}%
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 簡易チャート（外部ライブラリを入れずに済む範囲）
// ---------------------------------------------------------------------------

export function Sparkline({
  points,
  tone = "primary",
}: {
  points: number[];
  tone?: "primary" | "ok" | "warn";
}) {
  if (points.length < 2) return null;
  const w = 56;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color =
    tone === "ok"
      ? "var(--ok)"
      : tone === "warn"
        ? "var(--warn)"
        : "var(--primary)";
  return (
    <svg width={w} height={h} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// アイコン（依存を増やさないため最小限を自前で持つ）
// ---------------------------------------------------------------------------

export function Icon({
  name,
  className = "size-4",
}: {
  name: string;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    home: <path d="M3 10.5 12 3l9 7.5V21H3z" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    doc: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-4-4.9" />
      </>
    ),
    cloud: <path d="M6 18a4 4 0 0 1 .8-7.9 5.5 5.5 0 0 1 10.6 1.4A3.5 3.5 0 0 1 17.5 18z" />,
    sparkle: (
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
    ),
    check: <path d="m4 12 5 5L20 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    shield: <path d="M12 3l8 3v6c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V6z" />,
    database: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
        <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
    sheet: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 10v10" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    ),
    list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </>
    ),
    play: <path d="M6 4l14 8-14 8z" />,
    pause: <path d="M8 4v16M16 4v16" />,
    stop: <rect x="5" y="5" width="14" height="14" rx="2" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2 20h20z" />
        <path d="M12 9v5M12 17h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    robot: (
      <>
        <rect x="4" y="8" width="16" height="12" rx="3" />
        <path d="M12 4v4M9 14h.01M15 14h.01" />
      </>
    ),
    flow: (
      <>
        <rect x="3" y="4" width="6" height="5" rx="1" />
        <rect x="15" y="15" width="6" height="5" rx="1" />
        <path d="M9 6.5h4a2 2 0 0 1 2 2v9" />
      </>
    ),
    plug: (
      <>
        <path d="M9 3v6M15 3v6" />
        <path d="M6 9h12v3a6 6 0 0 1-12 0z" />
        <path d="M12 18v3" />
      </>
    ),
    book: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
        <path d="M8 3v18" />
      </>
    ),
    send: <path d="M4 12 21 3l-6 18-3.5-7z" />,
    file: (
      <>
        <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
        <path d="M13 3v6h6" />
      </>
    ),
    food: (
      <>
        <path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" />
        <path d="M16 3c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6zM16 9v12" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 9h8M8 13h8M12 6v12" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4L20 8l-4-4L4 16z" />
        <path d="M14 6l4 4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    inbox: (
      <>
        <path d="M3 12h5l2 3h4l2-3h5" />
        <path d="M4 6h16l1 6v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
      </>
    ),
    undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name] ?? paths.doc}
    </svg>
  );
}

/** アイコンを色付きの角丸タイルに載せる。カード先頭の視認性のため。 */
export function IconTile({
  name,
  tone = "primary",
  size = "md",
}: {
  name: string;
  tone?: Tone;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-7" : "size-9";
  return (
    <span
      className={`inline-flex ${box} shrink-0 items-center justify-center rounded-lg ${TONE_CLASS[tone]}`}
    >
      <Icon name={name} className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
