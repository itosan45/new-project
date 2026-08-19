import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import {
  MATERIAL_WAIT_WEEKS,
  WEEKLY_CAPACITY_DAYS,
  estimateTiers,
} from "@/lib/data/service-tiers";
import { INVASION_LEVELS, type InvasionLevel } from "@/lib/domain/engagement";
import { SOLO_LIMITS, isTooDeep } from "@/lib/domain/operator";
import { ALL_AGENTS } from "@/lib/data/agents";
import { findImpl } from "@/lib/agents/registry";
import { DESIGN_ROUTES, TOOLS, type ToolState } from "@/lib/data/tools";

export const metadata = { title: "できること" };

/**
 * いま受けられる仕事と、受けられない仕事。
 *
 * 「Agent 25体」では判断できない。**このぐらいなら作れる、が要る。**
 * 工数の数字は見積Agentに計算させている。ここに直接書くと、
 * 単価表を直したときにずれる。
 */

const CANNOT: { what: string; why: string }[] = [
  {
    what: "独自ドメインの購入手続き",
    why: "支払いはあなたが押す。空き確認と料金確認まではこちらでできる",
  },
  {
    what: "DNSの設定",
    why: "管理画面のログインが要る。ログイン情報は預かりません",
  },
  { what: "写真の撮影", why: "素材はそちらか、フリー素材を使う" },
  { what: "動画の撮影・編集", why: "埋め込みはできる。制作は別の仕事" },
  { what: "ロゴの制作・商標登録", why: "デザインの専門と法的手続き" },
  {
    what: "相手のサーバーへのFTP納品",
    why: "認証情報を預かれない。Vercel か WordPress.com なら出せる",
  },
  { what: "検索で上位に出ることの保証", why: "誰にも保証できない" },
  { what: "広告の運用", why: "扱っていない" },
  {
    what: "24時間の障害対応",
    why: "人間が1人なので受けられない。日中の対応まで",
  },
];

const TOOL_TONE: Record<ToolState, Tone> = {
  使える: "ok",
  権限が足りない: "warn",
  認証がまだ: "warn",
  未接続: "idle",
};

const LEVEL_ORDER: InvasionLevel[] = ["L0", "L1", "L2", "L3", "L4"];

const EXAMPLES: Record<InvasionLevel, string[]> = {
  L0: [
    "ホームページ・LP制作",
    "記事・SNS投稿の作成",
    "調査レポート",
    "提案資料・図解",
  ],
  L1: ["手書き書類のデータ化", "もらったExcelの集計", "問い合わせの分類"],
  L2: ["指定のExcelへの転記", "スプレッドシートの定期更新", "見積書の自動生成"],
  L3: [],
  L4: [],
};

export default function CanPage() {
  const tiers = estimateTiers();
  const 動く = ALL_AGENTS.filter((a) => findImpl(a.agentId));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 仕事場へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">できること・できないこと</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          仕事の話が来たとき、その場で答えられるように。
          <span className="font-medium text-ink">
            できないことも同じ重さで書いてあります。
          </span>
          できることの一覧しか無いと、守備範囲の外の仕事を受けて事故ります。
        </p>
      </header>

      {/* ここが本題。「このぐらいなら作れる」 */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-bold text-ink">
          ホームページなら、このぐらい
        </h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
          出しているのは<b className="text-ink">かかる時間だけ</b>です。
          金額は出しません（いくらで売るかを決めるのはあなたです）。
          時間を出す理由は、一人でやる以上、
          受けられるかどうかがこれで決まるからです。
          <br />
          工数はその場で計算しています（単価表を直すとこの数字も変わります）。
          期間は「週{WEEKLY_CAPACITY_DAYS}日ぶんをこの案件に充てる＋素材待ち
          {MATERIAL_WAIT_WEEKS.low}〜{MATERIAL_WAIT_WEEKS.high}週」の前提。
          <b className="text-ink">作業日数と納期は別物です。</b>
        </p>

        <div className="flex flex-col gap-3">
          {tiers.map((t, i) => (
            <Card key={t.tier.name}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <IconTile
                    name="doc"
                    tone={(["ok", "primary", "warn"] as Tone[])[i]}
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink">
                      {t.tier.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                      {t.tier.forWhom}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="tabular text-sm font-semibold text-ink">
                    {t.週.下}〜{t.週.上}週
                  </div>
                  <div className="tabular text-[10px] text-ink-subtle">
                    作業 {t.人日.下}〜{t.人日.上}人日
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-medium text-ok">含むもの</p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {t.tier.includes.map((x) => (
                      <li
                        key={x}
                        className="text-[11px] leading-relaxed text-ink"
                      >
                        ・{x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-danger">
                    含まないもの
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {t.tier.excludes.map((x) => (
                      <li
                        key={x}
                        className="text-[11px] leading-relaxed text-ink"
                      >
                        ・{x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <details className="mt-3 border-t border-line pt-2">
                <summary className="cursor-pointer text-[11px] text-ink-muted">
                  内訳を見る
                </summary>
                <div className="mt-2 flex flex-col gap-1">
                  {t.内訳.map((l) => (
                    <div
                      key={l.項目}
                      className="flex justify-between gap-3 text-[11px]"
                    >
                      <span className="text-ink">{l.項目}</span>
                      <span className="tabular shrink-0 text-ink-muted">
                        {l.人日}人日
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* どこまで踏み込むか */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-bold text-ink">
          受けられる仕事・受けられない仕事
        </h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
          相手のシステムにどこまで踏み込むかで分けています。
          人間が1人なので <b className="text-ink">{SOLO_LIMITS.maxInvasionLevel} まで</b>。
        </p>
        <div className="flex flex-col gap-2">
          {LEVEL_ORDER.map((key) => {
            const v = INVASION_LEVELS[key];
            const 無理 = isTooDeep(key);
            return (
              <div
                key={key}
                className={`rounded-lg border p-3 ${
                  無理 ? "border-danger/30 bg-danger-soft/20" : "border-line"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={無理 ? "danger" : "ok"}>
                    {無理 ? "受けない" : "受けられる"}
                  </Badge>
                  <span className="text-[13px] font-medium text-ink">
                    {key} {v.label}
                  </span>
                  <span className="text-[11px] text-ink-muted">{v.detail}</span>
                </div>
                {EXAMPLES[key].length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {EXAMPLES[key].map((e) => (
                      <span
                        key={e}
                        className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] text-ink"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-danger">
                    {v.example} など。{v.risk}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 使う道具。状態を確認した日つきで出す */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-bold text-ink">使う道具</h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
          「使えます」と書く前に、実際に繋がっているかを確かめたもの。
          <b className="text-ink">繋がっていても権限が足りないことがあります。</b>
          状態は変わるので確認日を付けてあります。
        </p>
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-line">
            {TOOLS.map((t) => (
              <div key={t.name} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TOOL_TONE[t.state]}>{t.state}</Badge>
                  <span className="text-[13px] font-medium text-ink">
                    {t.name}
                  </span>
                  <span className="text-[11px] text-ink-muted">{t.用途}</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {t.detail}
                </p>
                {t.必要な操作 && (
                  <p className="mt-1 text-[11px] leading-relaxed text-warn">
                    使えるようにするには：{t.必要な操作}（あなたの操作）
                  </p>
                )}
                <p className="mt-1 font-mono text-[10px] text-ink-subtle">
                  確認 {t.確認日}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-3">
          <p className="mb-2 text-[11px] font-medium text-ink">
            デザインが絡む仕事で、いま取れる道
          </p>
          <div className="flex flex-col gap-2">
            {DESIGN_ROUTES.map((r) => (
              <div key={r.route} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[12px] font-medium text-ink">
                    {r.route}
                  </span>
                  <span className="text-[10px] text-ink-subtle">
                    {r.使う道具}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  向いている場面：{r.向いている場面}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-danger">
                  制約：{r.制約}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* できないこと */}
      <section className="mb-8">
        <h2 className="mb-1 text-base font-bold text-ink">できないこと</h2>
        <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
          聞かれたら、この場で「できません」と言ってよいもの。
        </p>
        <Card padded={false}>
          <div className="flex flex-col divide-y divide-line">
            {CANNOT.map((c) => (
              <div key={c.what} className="px-4 py-2.5">
                <p className="text-[12px] font-medium text-ink">{c.what}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {c.why}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 自動化の実態 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">
            どこまで自動で動くか
          </h2>
          <Badge tone="idle">
            {ALL_AGENTS.length}体中 {動く.length}体
          </Badge>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
          実際に処理をするのは下の{動く.length}体だけです。
          残り{ALL_AGENTS.length - 動く.length}体は
          <b className="text-ink">
            何をしてよいかを決めただけで、中身はありません
          </b>
          。仕事の中身は秘書とあなたがやっています。
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {動く.map((a) => (
            <div key={a.agentId} className="text-[11px] leading-relaxed">
              <span className="font-medium text-ink">{a.name}</span>
              <span className="text-ink-muted"> — {a.purpose}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-ink-muted">
          決めごとが埋まっていないと、この{動く.length}体は
          <b className="text-ink">それらしい答えを出さずに止まります</b>。
          何が足りないかは{" "}
          <Link href="/web" className="text-primary hover:underline">
            Web制作
          </Link>{" "}
          に並べてあります。
        </p>
      </Card>
    </main>
  );
}
