import { estimate } from "@/lib/agents/web/estimate";
import { emptyBrief, type WebBrief } from "@/lib/domain/web-project";

/**
 * 「このぐらいなら作れます」の基準。
 *
 * 人日はここに書かない。**見積Agentに実際に計算させる。**
 * 直接書くと、単価表を直したときにずれる。
 *
 * 期間も人日から出す。人日と納期は別物なので、前提を画面に明示する。
 */

/** この案件に週に何日ぶん手を割けるか。一人なので他の案件と分け合う。 */
export const WEEKLY_CAPACITY_DAYS = 3;

/** 素材（文章・写真）待ちで止まる週数。制作が止まる原因の1位。 */
export const MATERIAL_WAIT_WEEKS = { low: 1, high: 3 };

export interface ServiceTier {
  name: string;
  /** どんなときに選ぶか */
  forWhom: string;
  brief: WebBrief;
  includes: string[];
  excludes: string[];
}

function tier(over: {
  buildStyle: NonNullable<WebBrief["buildStyle"]["value"]>;
  pages: string[];
  motion: NonNullable<WebBrief["motion"]["value"]>;
  content: string;
  chat: NonNullable<WebBrief["chat"]["value"]>;
}): WebBrief {
  const b = emptyBrief();
  b.buildStyle.value = over.buildStyle;
  b.pages.value = over.pages;
  b.motion.value = over.motion;
  b.content.value = over.content;
  b.chat.value = over.chat;
  b.existingSite.value = "新規";
  b.hosting.value = "Vercel";
  return b;
}

export const SERVICE_TIERS: ServiceTier[] = [
  {
    name: "1ページ（名刺代わり）",
    forWhom: "まず存在を示したい。名刺やチラシからの受け皿がほしい",
    brief: tier({
      buildStyle: "雛形をそのまま",
      pages: ["トップ"],
      motion: "動きなし",
      content: "文章は先方から支給",
      chat: "置かない",
    }),
    includes: [
      "1ページに全部載せる形",
      "スマホ対応",
      "問い合わせフォーム",
      "地図・電話へのリンク",
    ],
    excludes: ["文章の作成", "写真の撮影", "更新用の管理画面"],
  },
  {
    name: "5ページ（いちばん多い形）",
    forWhom: "問い合わせを増やしたい。実績を見せて信用してもらいたい",
    brief: tier({
      buildStyle: "雛形を調整",
      pages: ["トップ", "サービス", "実績", "よくある質問", "お問い合わせ"],
      motion: "軽く動かす",
      content: "文章はこちらで作成、写真は先方支給",
      chat: "置かない",
    }),
    includes: [
      "狙いに合わせたページ構成",
      "文章の作成（取材あり）",
      "軽い動き",
      "スマホ対応",
      "問い合わせフォーム・LINE導線",
      "アクセス計測",
    ],
    excludes: ["写真の撮影", "ロゴ制作", "動画制作"],
  },
  {
    name: "しっかり作る",
    forWhom: "他社と並べて選ばれたい。採用や高単価の商材を扱う",
    brief: tier({
      buildStyle: "デザインから作る",
      pages: [
        "トップ",
        "サービス",
        "実績",
        "お客様の声",
        "会社情報",
        "よくある質問",
        "お問い合わせ",
      ],
      motion: "しっかり動かす",
      content: "文章はこちらで作成",
      chat: "よくある質問だけ",
    }),
    includes: [
      "デザインから作る",
      "文章の作成（取材あり）",
      "しっかりした動き",
      "よくある質問の自動応答",
      "スマホ対応・表示速度の調整",
      "アクセス計測と3か月後の振り返り",
    ],
    excludes: ["写真の撮影", "動画制作", "広告運用"],
  },
];

export interface TierEstimate {
  tier: ServiceTier;
  人日: { 下: number; 上: number };
  週: { 下: number; 上: number };
  内訳: { 項目: string; 人日: number }[];
}

/** 各段階の工数と期間を、見積Agentに計算させる。 */
export function estimateTiers(): TierEstimate[] {
  const 週 = (d: number) => Math.ceil((d / WEEKLY_CAPACITY_DAYS) * 10) / 10;
  return SERVICE_TIERS.map((t) => {
    const r = estimate(t.brief);
    if ("missing" in r) {
      throw new Error(
        `${t.name}: 見積に必要な項目が足りない（${r.missing.join(", ")}）`,
      );
    }
    return {
      tier: t,
      人日: { 下: r.下振れ, 上: r.上振れ },
      週: {
        下: 週(r.下振れ) + MATERIAL_WAIT_WEEKS.low,
        上: 週(r.上振れ) + MATERIAL_WAIT_WEEKS.high,
      },
      内訳: r.内訳.map((l) => ({ 項目: l.項目, 人日: l.人日 })),
    };
  });
}
