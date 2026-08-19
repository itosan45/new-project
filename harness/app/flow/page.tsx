import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import { agentName, findAgent } from "@/lib/data/agents";
import { STAGE_DEFINITIONS, type StageDefinition } from "@/lib/data/stages";
import {
  ACTIVE_STAGES,
  DEAD_END_STAGES,
  INVASION_LEVELS,
  checkGate,
  type Engagement,
  type EngagementStage,
  type InvasionLevel,
  type LeadSource,
} from "@/lib/domain/engagement";

export const metadata = { title: "仕事の流れ" };

/**
 * 案件が「相談」から「運用」まで、どう進むかの設計。
 *
 * 進める条件（ゲート）は、この画面に書いた文章ではなく
 * checkGate() が実際に返すものを表示している。
 * 説明と実装がずれないようにするため。
 */

const STAGE_TONE: Record<string, Tone> = {
  相談: "info",
  提案: "primary",
  制作: "primary",
  納品: "warn",
  完了: "ok",
  運用: "info",
  見送り: "idle",
  中止: "danger",
};

const STAGE_ICON: Record<string, string> = {
  相談: "people",
  提案: "doc",
  制作: "robot",
  納品: "send",
  完了: "check",
  運用: "shield",
  見送り: "undo",
  中止: "alert",
};

const LEAD_SOURCES: { source: LeadSource; note: string }[] = [
  { source: "紹介", note: "一番強い。すでに信用が乗っている状態で始まる" },
  { source: "SNS", note: "こちらの考え方を先に見せられる。相談が具体的になる" },
  { source: "問い合わせフォーム", note: "温度差が大きい。相談の1回目で見極める" },
  { source: "既存顧客からの追加", note: "ヒアリングが短くて済む。侵襲度を上げやすい" },
  { source: "自分から提案", note: "相手に困りごとの自覚がない。相談が長くなる" },
  { source: "その他", note: "分類できないものを無理に振り分けない" },
];

/** ゲートの項目名を、実装（checkGate）から取り出す。 */
function gateLabels(stage: EngagementStage) {
  const blank: Engagement = {
    engagementId: "sample",
    clientId: "sample",
    clientName: "",
    title: "",
    stage,
    leadSource: "その他",
    hearing: {
      meetings: [],
      problem: "",
      baseline: "",
      existingTools: [],
      untouchable: [],
      decisionMaker: "",
      concern: "",
    },
    proposals: [],
    runIds: [],
    deliverables: [],
    incidents: [],
    history: [],
    createdAt: "",
    updatedAt: "",
  };
  return checkGate(blank);
}

function Column({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={`text-[10px] font-medium ${tone}`}>{label}</p>
      <div className="mt-1.5 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Bullet({
  children,
  tone = "text-ink",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className={`flex gap-1.5 text-[11px] leading-relaxed ${tone}`}>
      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-current opacity-40" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function StageCard({ def, index }: { def: StageDefinition; index: number }) {
  const gate = gateLabels(def.stage);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-start gap-3">
          <IconTile
            name={STAGE_ICON[def.stage]}
            tone={STAGE_TONE[def.stage]}
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">
              {index >= 0 && (
                <span className="mr-1.5 text-ink-subtle">{index + 1}.</span>
              )}
              {def.stage}
            </h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              {def.purpose}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {def.repeats && (
            <Badge tone="info">繰り返す（{def.repeats.typicalRounds}）</Badge>
          )}
          <Badge tone={def.waitingOnClient ? "warn" : "idle"}>
            {def.waitingOnClient ? "相手の返事待ちが入る" : "こちらの中で進む"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 pt-4 lg:grid-cols-3">
        <Column label="秘書（窓口）がやること" tone="text-primary">
          {def.secretary.map((s) => (
            <Bullet key={s}>{s}</Bullet>
          ))}
        </Column>

        <Column label="動くAgent" tone="text-info">
          {def.agents.map((a) => (
            <div key={a.agentId} className="text-[11px] leading-relaxed">
              <span className="font-medium text-ink">
                {findAgent(a.agentId) ? agentName(a.agentId) : a.agentId}
              </span>
              <span className="text-ink-muted"> — {a.work}</span>
            </div>
          ))}
        </Column>

        {/* 判断が空の段階は作らない。全部AIに任せる段階を残すと、
            動いていないのに進んだことになる */}
        <Column label="あなたが決めること" tone="text-warn">
          {def.decisions.map((d) => (
            <Bullet key={d} tone="text-ink">
              {d}
            </Bullet>
          ))}
        </Column>
      </div>

      {def.repeats && (
        <div className="mt-4 rounded-lg border border-info/30 bg-info-soft/30 p-3">
          <p className="text-[10px] font-medium text-info">
            {def.repeats.unit}ぶんの手順（1回で終わらない前提）
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {def.repeats.round.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="mt-px w-8 shrink-0 text-right text-[10px] text-ink-subtle">
                  {r.phase}
                </span>
                <Badge
                  tone={
                    r.who === "あなた"
                      ? "warn"
                      : r.who === "秘書"
                        ? "primary"
                        : "info"
                  }
                >
                  {r.who}
                </Badge>
                <span className="min-w-0 flex-1 leading-relaxed text-ink">
                  {r.work}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 border-t border-info/20 pt-2 text-[11px] leading-relaxed text-ink">
            <span className="font-medium text-info">次の回か、次の段階か：</span>{" "}
            {def.repeats.exit}
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {gate.next && (
          <div className="rounded-lg bg-surface-muted p-3">
            <p className="text-[10px] font-medium text-ink-muted">
              「{gate.next}」へ進める条件
            </p>
            <div className="mt-1.5 flex flex-col gap-1">
              {gate.checks.map((c) => (
                <div key={c.label} className="text-[11px] leading-relaxed">
                  <span className="text-ink">□ {c.label}</span>
                  <span className="text-ink-subtle"> — {c.hint}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[10px] font-medium text-ink-muted">残る記録</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {def.outputs.map((o) => (
                <span
                  key={o}
                  className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] text-ink"
                >
                  {o}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-danger-soft/40 p-3">
            <p className="text-[10px] font-medium text-danger">
              ここで起きがちな失敗
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink">
              {def.pitfall}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function FlowPage() {
  const active = ACTIVE_STAGES.map(
    (s) => STAGE_DEFINITIONS.find((d) => d.stage === s)!,
  );
  const deadEnds = DEAD_END_STAGES.map(
    (s) => STAGE_DEFINITIONS.find((d) => d.stage === s)!,
  );
  const levels = Object.entries(INVASION_LEVELS) as [
    InvasionLevel,
    (typeof INVASION_LEVELS)[InvasionLevel],
  ][];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 画面一覧へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">仕事の流れ（6段階）</h1>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          あなたが仕事を取ってくる。秘書が壁打ちと打ち合わせをして、Agentに作業を投げる。
          その一連を6段階に分けたもの。
          <span className="font-medium text-ink">
            段階の切れ目は「相手の返事待ちになる場所」に置いてある。
          </span>
          自分の中だけで進む作業を分けると、動いていないのに段階だけ進む、という
          嘘の進捗が生まれるため。
        </p>
      </header>

      {/* 全体像 */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {active.map((d, i) => (
            <div key={d.stage} className="flex items-center gap-1.5">
              <div
                className={`rounded-lg border px-3 py-2 ${
                  d.waitingOnClient
                    ? "border-warn/40 bg-warn-soft/40"
                    : "border-line bg-surface-muted"
                }`}
              >
                <div className="text-xs font-semibold text-ink">
                  {i + 1}. {d.stage}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-muted">
                  {d.repeats ? `${d.repeats.typicalRounds}` : "1回"}
                </div>
              </div>
              {i < active.length - 1 && (
                <span className="text-ink-subtle">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
          <span className="rounded bg-warn-soft/60 px-1.5 py-0.5 text-warn">
            色つき
          </span>{" "}
          は相手の返事を待つ段階。ここで止まっているのは、こちらのサボりではなく
          正常な状態。分けておかないと、待ちと遅れの区別がつかなくなる。
          途中で終わる道として <b className="text-ink">見送り</b>・
          <b className="text-ink">中止</b> があり、どちらも記録を残して閉じる。
        </p>
      </Card>

      {/* どこから話が来たか */}
      <Card className="mb-5">
        <h2 className="text-[15px] font-semibold text-ink">
          どこから話が来たか（動線）
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          全案件に記録する。あとで「紹介はほぼ決まるが、フォームは半分流れる」
          といったことが数字で分かる。分かって初めて、どこに時間を使うかを決められる。
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEAD_SOURCES.map((l) => (
            <div key={l.source} className="rounded-lg border border-line p-2.5">
              <p className="text-xs font-medium text-ink">{l.source}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-ink-muted">
                {l.note}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* 侵襲度 */}
      <Card className="mb-5" padded={false}>
        <div className="border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-ink">
            どこまで踏み込むか（侵襲度）
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            相談の段階でここを決めないと、提案が書けない。
            低いほど売りやすく、事故っても影響が小さい。高いほど単価が上がるが、
            信頼が要る。<b className="text-ink">下から順に上がっていく</b>もので、
            いきなり上は受けない。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[10px] text-ink-muted">
                <th className="px-5 py-2.5 font-medium">段</th>
                <th className="px-3 py-2.5 font-medium">どこまで</th>
                <th className="px-3 py-2.5 font-medium">具体例</th>
                <th className="px-5 py-2.5 font-medium">事故ったとき</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(([key, v]) => (
                <tr key={key} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        key === "L0" || key === "L1"
                          ? "ok"
                          : key === "L2"
                            ? "warn"
                            : "danger"
                      }
                    >
                      {key} {v.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-ink">{v.detail}</td>
                  <td className="px-3 py-3 text-[11px] text-ink-muted">
                    {v.example}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-ink-muted">
                    {v.risk}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col gap-5">
        {active.map((d, i) => (
          <StageCard key={d.stage} def={d} index={i} />
        ))}

        <div className="mt-2">
          <h2 className="text-base font-bold text-ink">途中で終わる道</h2>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-ink-muted">
            断られる・止まるは事故ではなく、必ず起きるもの。
            記録を残さずに閉じると、同じ理由で何度も落とすことになる。
          </p>
        </div>
        {deadEnds.map((d) => (
          <StageCard key={d.stage} def={d} index={-1} />
        ))}
      </div>
    </main>
  );
}
