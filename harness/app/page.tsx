import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import { AGENT_CONTRACTS } from "@/lib/data/agents";

/**
 * 開発用の入口。
 *
 * 実運用では役割ごとに入口が分かれる（社員は /employee にしか入れない）が、
 * 開発中は4画面を行き来したいので、ここから飛べるようにしておく。
 */

const SCREENS: {
  href: string;
  title: string;
  role: string;
  desc: string;
  icon: string;
  tone: Tone;
}[] = [
  {
    href: "/employee",
    title: "お仕事コックピット",
    role: "社員",
    desc: "自分の仕事がどこまで進み、何を確認すべきかだけを見る画面。",
    icon: "home",
    tone: "primary",
  },
  {
    href: "/ceo",
    title: "CEOアシスタント",
    role: "経営",
    desc: "秘書Agent・人間秘書へ指示を出し、機密操作の承認を握る画面。",
    icon: "building",
    tone: "warn",
  },
  {
    href: "/admin",
    title: "エージェント運用センター",
    role: "管理者",
    desc: "全社のAgent稼働・承認待ち・削減効果を監視する画面。",
    icon: "grid",
    tone: "ok",
  },
  {
    href: "/admin/live",
    title: "ライブ実行トレース",
    role: "管理者",
    desc: "1件の処理を、Agentの引き渡しと判断根拠まで追跡する画面。",
    icon: "play",
    tone: "info",
  },
];

const PRINCIPLES = [
  "送信・削除・金額変更・契約は、AIだけで確定させない",
  "「成功」「部分成功」「未実行」を同じ色で表示しない",
  "Runのバージョンは開始時に固定し、途中で差し替えない",
  "根拠と出典を出せない結果は画面に出さない",
  "全データに tenant_id を持たせ、会社をまたがせない",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Icon name="robot" className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-ink">業務自動化ハーネス</h1>
            <p className="text-xs text-ink-muted">
              開発環境 ｜ 共通の実行エンジン + 会社別コネクタ + 承認・監査・復旧
            </p>
          </div>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">画面</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SCREENS.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <IconTile name={s.icon} tone={s.tone} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">
                        {s.title}
                      </h3>
                      <Badge tone="idle">{s.role}</Badge>
                    </div>
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
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            骨組み（lib/domain/types.ts）
          </h2>
          <ul className="flex flex-col gap-2 text-xs text-ink-muted">
            {[
              ["Run / RunStep", "実行と、その中の各ステップの状態"],
              ["AgentContract", "何をしてよく、何が禁止かの契約"],
              ["ApprovalRequest", "なぜ人間の承認が要るかを持つ承認要求"],
              ["Artifact", "成果物と、その元になった成果物の系譜"],
              ["AuditEvent", "誰が・いつ・何をしたかの記録"],
              ["SavingMetric", "削減効果と、その算出根拠"],
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
              <li key={p} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
                <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-ok" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">
          登録済みAgent{" "}
          <span className="font-normal text-ink-subtle">
            （{AGENT_CONTRACTS.length}体）
          </span>
        </h2>
        <Card padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[10px] text-ink-muted">
                <th className="px-4 py-2.5 font-medium">Agent</th>
                <th className="px-3 py-2.5 font-medium">区分</th>
                <th className="px-3 py-2.5 font-medium">副作用</th>
                <th className="px-3 py-2.5 font-medium">扱えるデータ</th>
                <th className="px-4 py-2.5 text-right font-medium">確信度下限</th>
              </tr>
            </thead>
            <tbody>
              {AGENT_CONTRACTS.map((a) => (
                <tr key={a.agentId} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-medium text-ink">{a.name}</div>
                    <div className="text-[10px] text-ink-subtle">
                      {a.agentId} v{a.agentVersion}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone="idle">{a.category}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      tone={
                        a.sideEffectClass === "READ_ONLY"
                          ? "ok"
                          : a.sideEffectClass === "SIDE_EFFECT"
                            ? "warn"
                            : a.sideEffectClass === "IRREVERSIBLE"
                              ? "danger"
                              : "idle"
                      }
                    >
                      {a.sideEffectClass}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-ink-muted">
                    {a.allowedDataScopes.join(", ")}
                  </td>
                  <td className="tabular px-4 py-2.5 text-right text-[11px] text-ink">
                    {a.confidenceThreshold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </main>
  );
}
