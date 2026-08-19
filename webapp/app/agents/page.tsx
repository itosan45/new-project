import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import type { AgentContract, DomainPack } from "@/lib/domain/types";
import { SIDE_EFFECT_LABEL } from "@/lib/domain/types";
import { AGENT_CONTRACTS } from "@/lib/data/agents";
import { DOMAIN_PACKS, packsForAgent } from "@/lib/data/domain-packs";
import { TENANTS } from "@/lib/data/tenants";

export const metadata = { title: "Agentの専門性" };

const CATEGORY_TONE: Record<AgentContract["category"], Tone> = {
  調査: "info",
  分析: "primary",
  実行: "warn",
  管理: "ok",
  収益: "danger",
};

const MATURITY_TONE: Record<AgentContract["maturity"], Tone> = {
  "中身あり・未接続": "ok",
  契約だけ: "warn",
  検討中: "idle",
};

const SIDE_EFFECT_TONE: Record<AgentContract["sideEffectClass"], Tone> = {
  READ_ONLY: "ok",
  DRAFT_ONLY: "info",
  REVERSIBLE: "primary",
  SIDE_EFFECT: "warn",
  IRREVERSIBLE: "danger",
};

const AGENT_ICON: Record<string, string> = {
  intake: "inbox",
  "document-reader": "file",
  classifier: "grid",
  "marketing-research": "search",
  "voice-of-customer": "people",
  "data-analyst": "chart",
  "revenue-analyst": "money",
  "draft-writer": "edit",
  "report-generator": "doc",
  validator: "check",
  qa: "shield",
  approval: "lock",
  audit: "history",
  recovery: "undo",
  executor: "send",
  notification: "bell",
};

function List({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "ink" | "danger" | "ok" | "warn";
}) {
  if (items.length === 0) return null;
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "ok"
        ? "text-ok"
        : tone === "warn"
          ? "text-warn"
          : "text-ink";
  return (
    <div>
      <p className="text-[10px] font-medium text-ink-muted">{label}</p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {items.map((i) => (
          <li key={i} className={`flex gap-1.5 text-[11px] leading-relaxed ${color}`}>
            <span className="text-ink-subtle">・</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentContract }) {
  const packs = packsForAgent(agent.agentId);
  const users = TENANTS.filter((t) => t.requiredAgents.includes(agent.agentId));

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-start gap-3">
          <IconTile
            name={AGENT_ICON[agent.agentId] ?? "robot"}
            tone={CATEGORY_TONE[agent.category]}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">{agent.name}</h3>
              <Badge tone={CATEGORY_TONE[agent.category]}>
                {agent.category}
              </Badge>
              <Badge tone={MATURITY_TONE[agent.maturity]}>
                {agent.maturity}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              {agent.purpose}
            </p>
            <p className="mt-1 font-mono text-[10px] text-ink-subtle">
              {agent.agentId} v{agent.agentVersion}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={SIDE_EFFECT_TONE[agent.sideEffectClass]}>
            {SIDE_EFFECT_LABEL[agent.sideEffectClass]}
          </Badge>
          <span className="tabular text-[10px] text-ink-muted">
            確信度しきい値 {agent.confidenceThreshold}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-3 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <List label="得意なこと" items={agent.expertise} tone="ink" />
          {/* できることより重要。ここが無いと守備範囲外の仕事が回ってくる */}
          <div className="rounded-lg bg-danger-soft/40 p-2.5">
            <List
              label="使ってはいけない場面"
              items={agent.notSuitableFor}
              tone="danger"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <List label="必要な入力" items={agent.requiredInputs} tone="ink" />
          <List label="出力するもの" items={agent.produces} tone="ink" />
          <div className="rounded-lg bg-warn-soft/40 p-2.5">
            <List label="既知の弱点" items={agent.qualityRisks} tone="warn" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-ok-soft/50 p-2.5">
            <List
              label="人間に引き渡す条件"
              items={agent.escalatesWhen}
              tone="ok"
            />
          </div>
          <List
            label="禁止されている操作"
            items={agent.forbiddenActions}
            tone="danger"
          />
          {packs.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-ink-muted">
                差し込めるドメインパック
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {packs.map((p) => (
                  <Badge key={p.packId} tone="primary">
                    {p.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {users.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-ink-muted">
                必要としている顧客
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {users.map((t) => (
                  <span
                    key={t.tenantId}
                    className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] text-ink"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function PackCard({ pack }: { pack: DomainPack }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{pack.name}</h3>
          <p className="mt-1 text-[10px] text-ink-muted">
            {pack.industries.join("・")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pack.appliesTo.map((a) => (
            <Badge key={a} tone="idle">
              {a}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="mb-1.5 text-[10px] font-medium text-ink-muted">
            分野の語彙
          </p>
          <dl className="flex flex-col gap-1.5">
            {pack.vocabulary.map((v) => (
              <div key={v.term}>
                <dt className="text-[11px] font-medium text-ink">{v.term}</dt>
                <dd className="text-[10px] leading-relaxed text-ink-muted">
                  {v.meaning}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium text-ink-muted">
            抽出する項目
          </p>
          <ul className="flex flex-col gap-1.5">
            {pack.extractionFields.map((f) => (
              <li key={f.field}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-ink">
                    {f.field}
                  </span>
                  {f.required && <Badge tone="danger">必須</Badge>}
                </div>
                <p className="text-[10px] leading-relaxed text-ink-muted">
                  {f.hint}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-medium text-ink-muted">
            検証ルール
          </p>
          <ul className="flex flex-col gap-1">
            {pack.validationRules.map((r) => (
              <li
                key={r}
                className="flex gap-1.5 text-[10px] leading-relaxed text-ink"
              >
                <Icon name="check" className="mt-0.5 size-3 shrink-0 text-ok" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* 業界の慣習・法令に由来する。ここを削ると業務で使えなくなる */}
        <div className="rounded-lg bg-danger-soft/40 p-2.5">
          <p className="mb-1.5 text-[10px] font-medium text-danger">
            必ず人間に回すもの
          </p>
          <ul className="flex flex-col gap-1">
            {pack.alwaysEscalate.map((e) => (
              <li
                key={e}
                className="flex gap-1.5 text-[10px] leading-relaxed text-ink"
              >
                <span className="text-danger">⛔</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default function AgentsPage() {
  const wired = AGENT_CONTRACTS.filter(
    (a) => a.maturity === "中身あり・未接続",
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 画面一覧へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">
          Agentの専門性{" "}
          <span className="text-sm font-normal text-ink-subtle">
            （{AGENT_CONTRACTS.length}体 / うち中身のあるもの {wired.length}体）
          </span>
        </h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          各Agentは「できること」と同じ重さで
          <span className="font-medium text-ink">「使ってはいけない場面」</span>
          を持つ。できることの一覧しか無いと、「たぶんできるだろう」で
          守備範囲外の仕事が回ってきて事故る。
          追加の基準は「仮想顧客3社のどれかが実際に必要としているか」だけで、
          あったら便利そう、では足さない。
        </p>
      </header>

      {/* 専門性をどう持たせるかの方針。ここが分かれ道になる */}
      <Card className="mb-6 border-primary/30 bg-primary-soft/30">
        <div className="flex items-start gap-3">
          <IconTile name="sparkle" tone="primary" />
          <div>
            <h2 className="text-sm font-semibold text-ink">
              専門性 = 共通Agent × ドメインパック
            </h2>
            <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-ink-muted">
              業種ごとにAgentを作り分けると、<b className="text-ink">業種 × Agent</b>
              の数だけ実装が要る。建設向けのDocument Readerと会計向けの
              Document Readerは同じ実装にして、読み込む
              <b className="text-ink">ドメインパック</b>だけを変える。
              新しい業種の顧客が来たときに追加するのはパック1つで、Agentは触らない。
              ここを分けた瞬間に横展開できなくなる。
            </p>
          </div>
        </div>
      </Card>

      {/* どの顧客がどのAgentを要るか。全部を全社に配らない */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          顧客ごとに必要なAgent
        </h2>
        <Card padded={false}>
          {/* スマホ: 縦横の表は指では読めないので、Agentごとに1枚 */}
          <div className="flex flex-col divide-y divide-line sm:hidden">
            {AGENT_CONTRACTS.map((a) => (
              <div key={a.agentId} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconTile
                      name={AGENT_ICON[a.agentId] ?? "robot"}
                      tone={CATEGORY_TONE[a.category]}
                      size="sm"
                    />
                    <span className="min-w-0 text-[12px] font-medium text-ink">
                      {a.name}
                    </span>
                  </div>
                  <Badge tone={MATURITY_TONE[a.maturity]}>{a.maturity}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {TENANTS.filter((t) =>
                    t.requiredAgents.includes(a.agentId),
                  ).map((t) => (
                    <Badge key={t.tenantId} tone="ok">
                      {t.name}
                    </Badge>
                  ))}
                  {TENANTS.every((t) => !t.requiredAgents.includes(a.agentId)) && (
                    <span className="text-[11px] text-ink-subtle">
                      どの顧客にも配っていない
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-line text-[10px] text-ink-muted">
                  <th className="px-4 py-2.5 font-medium">Agent</th>
                  {TENANTS.map((t) => (
                    <th key={t.tenantId} className="px-3 py-2.5 text-center font-medium">
                      {t.name}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_CONTRACTS.map((a) => (
                  <tr key={a.agentId} className="border-b border-line last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <IconTile
                          name={AGENT_ICON[a.agentId] ?? "robot"}
                          tone={CATEGORY_TONE[a.category]}
                          size="sm"
                        />
                        <span className="text-[11px] font-medium text-ink">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    {TENANTS.map((t) => (
                      <td key={t.tenantId} className="px-3 py-2 text-center">
                        {t.requiredAgents.includes(a.agentId) ? (
                          <Icon
                            name="check"
                            className="mx-auto size-3.5 text-ok"
                          />
                        ) : (
                          <span className="text-[10px] text-ink-subtle">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <Badge tone={MATURITY_TONE[a.maturity]}>
                        {a.maturity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-2 text-[11px] text-ink-muted">
          使わないAgentは配らない。権限の穴にしかならないため。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          ドメインパック{" "}
          <span className="font-normal text-ink-subtle">
            （{DOMAIN_PACKS.length}分野）
          </span>
        </h2>
        <div className="flex flex-col gap-3">
          {DOMAIN_PACKS.map((p) => (
            <PackCard key={p.packId} pack={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Agent契約</h2>
        <div className="flex flex-col gap-3">
          {AGENT_CONTRACTS.map((a) => (
            <AgentCard key={a.agentId} agent={a} />
          ))}
        </div>
      </section>
    </main>
  );
}
