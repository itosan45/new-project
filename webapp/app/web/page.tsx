import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import { WEB_DECISIONS } from "@/lib/data/web-decisions";
import { WEB_AGENTS, WEB_HANDOFF } from "@/lib/data/web-agents";
import { findImpl } from "@/lib/agents/registry";
import { agentName } from "@/lib/data/agents";
import { isStale, type AgentContract } from "@/lib/domain/types";

export const metadata = { title: "Web制作" };

/**
 * Web制作の設計。
 *
 * 「ホームページ作ってください」は、それ自体では発注になっていない。
 * 決めなければいけないことを全部並べて、
 * 決まらないまま進むと何が起きるかまで書いてある。
 */

const ROUNDS = ["1回目", "2回目以降", "制作前"] as const;

const ROUND_NOTE: Record<string, string> = {
  "1回目": "ここが決まらないと、そもそも受けるかどうかが判断できない",
  "2回目以降": "1回目で全部聞こうとすると、相手が疲れて雑な答えが返る",
  制作前: "作り始める前に確定していればよいもの",
};

function DecisionCard({
  spec,
  index,
}: {
  spec: (typeof WEB_DECISIONS)[number];
  index: number;
}) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-medium leading-relaxed text-ink">
          <span className="mr-1.5 text-ink-subtle">{index}.</span>
          {spec.question}
        </p>
        {spec.blocksEstimate && (
          <Badge tone="warn">
            <span className="whitespace-nowrap">見積が出せない</span>
          </Badge>
        )}
      </div>

      {spec.options && (
        <div className="mt-2 flex flex-wrap gap-1">
          {spec.options.map((o) => (
            <span
              key={o}
              className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] text-ink"
            >
              {o}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[11px] leading-relaxed text-ink-muted">
          <span className="font-medium text-ink">なぜ聞くか：</span>
          {spec.why}
        </p>
        <p className="text-[11px] leading-relaxed text-danger">
          <span className="font-medium">決まらないと：</span>
          {spec.ifUnanswered}
        </p>
      </div>
    </div>
  );
}

function ExperienceBlock({ agent }: { agent: AgentContract }) {
  const exp = agent.experience;
  if (!exp) return null;
  const stale = isStale(exp);

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={exp.level === "ベテラン" ? "primary" : "idle"}>
          {exp.level}
        </Badge>
        {stale && <Badge tone="warn">この分野の知識は要確認</Badge>}
      </div>

      <div>
        <p className="text-[10px] font-medium text-ink-muted">判断基準</p>
        <div className="mt-1 flex flex-col gap-1.5">
          {exp.judgment.map((j) => (
            <div key={j.状況} className="text-[11px] leading-relaxed">
              <span className="text-ink-muted">{j.状況}</span>
              <span className="text-ink-subtle"> → </span>
              <span className="font-medium text-ink">{j.判断}</span>
              <div className="text-[10px] text-ink-muted">{j.理由}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium text-danger">地雷</p>
        <ul className="mt-1 flex flex-col gap-1">
          {exp.traps.map((t) => (
            <li key={t} className="text-[11px] leading-relaxed text-ink">
              ・{t}
            </li>
          ))}
        </ul>
      </div>

      {exp.benchmarks.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-ink-muted">相場</p>
          <div className="mt-1 flex flex-col gap-1">
            {exp.benchmarks.map((b) => (
              <div key={b.項目} className="text-[11px] leading-relaxed">
                <span className="text-ink-muted">{b.項目}: </span>
                <span className="tabular font-medium text-ink">{b.値}</span>
                <div className="text-[10px] text-ink-subtle">{b.根拠}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-medium text-ink-muted">
          いまの標準（確認日つき）
        </p>
        <div className="mt-1 flex flex-col gap-1">
          {exp.currentPractice.map((p) => (
            <div key={p.項目} className="text-[11px] leading-relaxed">
              <span className="text-ink-muted">{p.項目}: </span>
              <span className="text-ink">{p.いま}</span>
              <span className="ml-1 font-mono text-[10px] text-ink-subtle">
                {p.確認日}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentContract }) {
  const runs = Boolean(findImpl(agent.agentId));
  const tone: Tone = runs ? "ok" : "idle";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <IconTile name={runs ? "play" : "doc"} tone={tone} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">{agent.name}</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {agent.purpose}
            </p>
          </div>
        </div>
        <Badge tone={tone}>{runs ? "動く" : "契約だけ"}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-medium text-ink-muted">
            これが無ければ動かない
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {agent.requiredInputs.map((i) => (
              <li key={i} className="text-[11px] leading-relaxed text-ink">
                ・{i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-medium text-danger">やらせないこと</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {agent.forbiddenActions.map((f) => (
              <li key={f} className="text-[11px] leading-relaxed text-ink">
                ・{f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ExperienceBlock agent={agent} />
    </Card>
  );
}

/**
 * 回ごとの項目と、通し番号の開始位置。
 *
 * 通し番号は回をまたいで続ける。WEB_DECISIONS の並び順と
 * 聞く回の順序は別物なので、位置ではなく積み上げで数える。
 */
const roundBlocks = ROUNDS.map((round) => ({
  round,
  items: WEB_DECISIONS.filter((d) => d.stage === round),
})).reduce<{ round: string; items: typeof WEB_DECISIONS; offset: number }[]>(
  (acc, block) => {
    if (block.items.length === 0) return acc;
    const offset = acc.reduce((n, b) => n + b.items.length, 0);
    return [...acc, { ...block, offset }];
  },
  [],
);

export default function WebPage() {
  const runnable = WEB_AGENTS.filter((a) => findImpl(a.agentId));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 仕事場へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">Web制作</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          「ホームページを作ってください」は、
          <span className="font-medium text-ink">
            それ自体では発注になっていません。
          </span>
          どこに出すのか、雛形か作り込みか、何のためのサイトで、誰が見て、
          その人に何をさせたいのか。動画やアニメーションは要るのか。SNSや公式LINEに繋ぐのか。
          ここが決まらないと、見積も工程も出ません。
        </p>
      </header>

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">決めること</h2>
          <div className="flex gap-1.5">
            <Badge tone="idle">{WEB_DECISIONS.length}項目</Badge>
            <Badge tone="warn">
              うち見積を止める{" "}
              {WEB_DECISIONS.filter((d) => d.blocksEstimate).length}項目
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
          1回の打ち合わせで18項目は聞けません。どの回で聞くかまで決めてあります。
          未回答が残っているうちは、
          <b className="text-ink">Agentは見積も構成も出しません</b>
          （推測で埋めるくらいなら止まる、という作りにしてあります）。
        </p>
      </Card>

      {roundBlocks.map(({ round, items, offset }) => {
        return (
          <section key={round} className="mb-6">
            <div className="mb-2">
              <h2 className="text-base font-bold text-ink">
                {round}に聞くこと
                <span className="ml-2 text-[11px] font-normal text-ink-muted">
                  {items.length}項目
                </span>
              </h2>
              <p className="text-[11px] leading-relaxed text-ink-muted">
                {ROUND_NOTE[round]}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {items.map((spec, i) => (
                <DecisionCard key={spec.key} spec={spec} index={offset + i + 1} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="mb-6">
        <div className="mb-2">
          <h2 className="text-base font-bold text-ink">
            役割分担
            <span className="ml-2 text-[11px] font-normal text-ink-muted">
              {WEB_AGENTS.length}体（うち動くのは {runnable.length}体）
            </span>
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            業種パック（相手の分野の知識）とは別の軸です。こちらは
            <b className="text-ink">うちの作業の役割分担</b>。
            建設会社のHP案件なら、この役割分担 × 建設パックになります。
            <br />
            「動く」と出ているものだけが実際に処理します。
            それ以外は契約（何をしてよいか）を決めただけで、実際に手を動かすのは秘書です。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {WEB_AGENTS.map((a) => (
            <AgentCard key={a.agentId} agent={a} />
          ))}
        </div>
      </section>

      <Card>
        <h2 className="text-sm font-semibold text-ink">受け渡しの順番</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          誰から受け取り、誰に渡すか。ここが決まっていないと、
          手が空いたAgentが勝手に先に進んでしまいます。
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {WEB_HANDOFF.map((h) => (
            <div
              key={`${h.from}-${h.to}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]"
            >
              <span className="font-medium text-ink">{agentName(h.from)}</span>
              <span className="text-ink-subtle">→</span>
              <span className="font-medium text-ink">{agentName(h.to)}</span>
              <span className="text-ink-muted">（{h.渡すもの}）</span>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
