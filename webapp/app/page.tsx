import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import { ALL_AGENTS } from "@/lib/data/agents";
import { TENANTS } from "@/lib/data/tenants";
import { listAllCases, type CaseRecord } from "@/lib/store/cases";
import { SOLO_LIMITS, checkCapacity } from "@/lib/domain/operator";

export const dynamic = "force-dynamic";

/**
 * 仕事場（入口）。
 *
 * この組織に人間は1人しかいない。社員はいない。
 * だから役割ごとに入口を分けない。分ける相手がいない。
 *
 * 役割で分かれた画面（社員 / 経営 / 管理者）は、このシステムを
 * 社員のいる会社に売るときに必要になる形として残してある。
 * いま使うものと混ぜて並べると、自分が誰なのか分からなくなる。
 */

type Screen = {
  href: string;
  title: string;
  desc: string;
  icon: string;
  tone: Tone;
};

/** いま自分が使うもの */
const IN_USE: Screen[] = [
  {
    href: "/can",
    title: "できること・できないこと",
    desc: "仕事の話が来たとき、その場で答えるためのもの。ホームページなら何週間でどこまで作れるか。",
    icon: "check",
    tone: "ok",
  },
  {
    href: "/cases",
    title: "案件",
    desc: "案件を受け付け、Agentが処理し、承認を経て記録が積み上がる。実際に保存される。",
    icon: "inbox",
    tone: "warn",
  },
  {
    href: "/flow",
    title: "仕事の流れ",
    desc: "相談から運用までの6段階。誰が何をするか、次へ進める条件は何か。",
    icon: "flow",
    tone: "info",
  },
  {
    href: "/web",
    title: "Web制作",
    desc: "「ホームページ作って」で決めることが18項目。役割分担Agentと、その判断基準・地雷・相場。",
    icon: "doc",
    tone: "primary",
  },
];

/** 設計の前提。画面を触る前にここを見る */
const REFERENCE: Screen[] = [
  {
    href: "/agents",
    title: "Agentの専門性",
    desc: "得意なこと・使ってはいけない場面・既知の弱点。分野別のドメインパック。",
    icon: "robot",
    tone: "primary",
  },
  {
    href: "/tenants",
    title: "仮想顧客",
    desc: "3社。承認ゲートが守るものが業種ごとに違う、という設計の根拠。",
    icon: "people",
    tone: "ok",
  },
];

/** 社員のいる会社に売るときの形。いま自分が使うものではない */
const FOR_SALE: Screen[] = [
  {
    href: "/employee",
    title: "お仕事コックピット",
    desc: "社員が、自分の仕事の進みと確認すべきことだけを見る画面。",
    icon: "home",
    tone: "idle",
  },
  {
    href: "/ceo",
    title: "CEOアシスタント",
    desc: "経営者が指示を出し、機密操作の承認を握る画面。",
    icon: "building",
    tone: "idle",
  },
  {
    href: "/admin",
    title: "エージェント運用センター",
    desc: "管理者が全社のAgent稼働と承認待ちを監視する画面。",
    icon: "grid",
    tone: "idle",
  },
  {
    href: "/admin/live",
    title: "ライブ実行トレース",
    desc: "1件の処理を、Agentの引き渡しと判断根拠まで追う画面。",
    icon: "play",
    tone: "idle",
  },
];

const PRINCIPLES = [
  "送信・削除・金額変更・契約は、AIだけで確定させない",
  "「成功」「部分成功」「未実行」を同じ色で表示しない",
  "Runのバージョンは開始時に固定し、途中で差し替えない",
  "根拠と出典を出せない結果は画面に出さない",
  "全データに tenant_id を持たせ、会社をまたがせない",
];

function ScreenGrid({ screens }: { screens: Screen[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {screens.map((s) => (
        <Link key={s.href} href={s.href}>
          <Card className="h-full transition-colors hover:border-primary/40">
            <div className="flex items-start gap-3">
              <IconTile name={s.icon} tone={s.tone} />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  {s.desc}
                </p>
                <p className="mt-2 font-mono text-[10px] text-ink-subtle">
                  {s.href}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function Home() {
  let cases: CaseRecord[] = [];
  try {
    cases = await listAllCases(TENANTS.map((t) => t.tenantId));
  } catch {
    // 鍵が未設定でも入口は開く。件数が出ないだけ
  }

  const pendingApprovals = cases.filter((c) =>
    c.approvals.some((a) => a.status === "PENDING"),
  ).length;
  const activeEngagements = cases.filter(
    (c) => c.run.status !== "SUCCEEDED" && c.run.status !== "BLOCKED",
  ).length;
  const capacity = checkCapacity({ pendingApprovals, activeEngagements });
  const anyFull = capacity.some((c) => c.full);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-12">
      <header className="mb-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Icon name="robot" className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-ink">仕事場</h1>
            <p className="text-xs text-ink-muted">
              人間は自分1人。動くのは自分とAgentだけ
            </p>
          </div>
        </div>
      </header>

      {/* 一人でやれる量には上限がある。数字と、超えたら何が起きるかを並べる */}
      <Card className={`mb-6 ${anyFull ? "border-danger/40" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">いまの余力</h2>
          <Badge tone={anyFull ? "danger" : "ok"}>
            {anyFull ? "これ以上受けない" : "受けられる"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {capacity.map((c) => (
            <div
              key={c.label}
              className={`rounded-lg border p-3 ${
                c.full ? "border-danger/40 bg-danger-soft/30" : "border-line"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] text-ink-muted">{c.label}</span>
                <span className="tabular text-sm font-semibold text-ink">
                  {c.now}
                  <span className="text-[11px] font-normal text-ink-subtle">
                    {" "}
                    / {c.limit}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-ink-muted">
                {c.consequence}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
          判断はすべて自分1人を通ります。Agentは並列に動きますが、
          <b className="text-ink">詰まるのは必ずここ</b>です。
          受けられる侵襲度も{" "}
          <b className="text-ink">{SOLO_LIMITS.maxInvasionLevel} まで</b>
          にしてあります。それ以上は、事故ったときに復旧できる人間が
          自分しかいない状態で、相手の業務を止めることになるためです。
        </p>
      </Card>

      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold text-ink">いま使うもの</h2>
        <p className="mb-3 text-[11px] text-ink-muted">
          仕事はここで回ります。
        </p>
        <ScreenGrid screens={IN_USE} />
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold text-ink">設計の前提</h2>
        <p className="mb-3 text-[11px] text-ink-muted">
          画面を触る前にここを見る。何を作るかの根拠が置いてあります。
        </p>
        <ScreenGrid screens={REFERENCE} />
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            骨組み（lib/domain/types.ts）
          </h2>
          <ul className="flex flex-col gap-2 text-xs text-ink-muted">
            {[
              ["Engagement", "相談から運用までの案件。6段階で進む"],
              ["Run / RunStep", "制作で発生する1件の処理と、その各工程"],
              ["AgentContract", "何をしてよく、何が禁止かの契約"],
              ["ApprovalRequest", "なぜ人間の承認が要るかを持つ承認要求"],
              ["OperatorLimits", "一人で回せる量の上限"],
              ["AuditEvent", "誰が・いつ・何をしたかの記録"],
            ].map(([name, desc]) => (
              <li key={name} className="flex gap-2">
                <code className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-primary-text">
                  {name}
                </code>
                <span className="leading-relaxed">{desc}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            守っている設計ルール
          </h2>
          <ul className="flex flex-col gap-2">
            {PRINCIPLES.map((p) => (
              <li
                key={p}
                className="flex gap-2 text-xs leading-relaxed text-ink-muted"
              >
                <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-ok" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* 混ぜない。いま自分が使うものではない */}
      <section className="mb-8">
        <h2 className="mb-1 text-sm font-semibold text-ink">
          社員がいる会社に売るときの形
        </h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
          役割ごとに入口を分けた画面。
          <b className="text-ink">いま自分が使うものではありません。</b>
          社員が入ったとき、あるいはこの仕組みを他社に納めるときに要るものとして
          置いてあります。上の画面と混ぜて並べると、自分がどれを使えばよいか
          分からなくなるため、ここに分けています。
        </p>
        <ScreenGrid screens={FOR_SALE} />
      </section>

      <p className="text-[11px] text-ink-subtle">
        Agent {ALL_AGENTS.length}体。うち実際に動くのは{" "}
        <b className="text-ink">
          {ALL_AGENTS.filter((a) => a.maturity === "動く").length}体
        </b>{" "}
        で、残りは契約（何をしてよいか）を決めた段階です。
        「動く」と表示できるのは、実体が登録されているものだけ。
        テストで固定してあるので、表示だけ書き換えることはできません。
        責任者はすべて自分。架空の担当者は置いていません。
      </p>
    </main>
  );
}
