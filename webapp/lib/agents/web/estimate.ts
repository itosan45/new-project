import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import {
  BASE_DAYS,
  CHAT_DAYS,
  COPY_PER_PAGE_DAYS,
  MOTION_DAYS,
  PER_PAGE_DAYS,
  RANGE_HIGH,
  RANGE_LOW,
  REBUILD_DAYS,
} from "@/lib/data/web-rates";
import type { WebBrief } from "@/lib/domain/web-project";

/**
 * 見積根拠 Agent。
 *
 * 工数を出すだけで、金額は決めない。
 * 単価は lib/data/web-rates.ts を見る。契約に書いてある相場と同じ数字。
 *
 * 内訳の無い合計は返さない。合計だけ渡すと、
 * 前提が変わったときにどこが動くのか説明できなくなる。
 */

export interface EstimateLine {
  項目: string;
  人日: number;
  根拠: string;
}

export interface EstimateOutput {
  内訳: EstimateLine[];
  合計人日: number;
  下振れ: number;
  上振れ: number;
  /** この見積が崩れる条件。ここが再見積の線引きになる */
  崩れる条件: string[];
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export function estimate(brief: WebBrief): EstimateOutput | { missing: string[] } {
  const missing: string[] = [];
  if (!brief.buildStyle.value || brief.buildStyle.value === "未定")
    missing.push("作り方（buildStyle）");
  if (!brief.pages.value || brief.pages.value.length === 0)
    missing.push("ページ数（pages）");
  if (!brief.motion.value) missing.push("動きの程度（motion）");
  if (!brief.content.value?.trim()) missing.push("文章の担当（content）");
  if (!brief.chat.value) missing.push("チャットの有無（chat）");
  if (missing.length > 0) return { missing };

  const style = brief.buildStyle.value as Exclude<typeof brief.buildStyle.value, "未定" | undefined>;
  const pages = brief.pages.value!;
  const lines: EstimateLine[] = [];

  lines.push({
    項目: `土台（${style}）`,
    人日: BASE_DAYS[style],
    根拠: "設計・実装・確認まで",
  });

  // 1ページ目は土台に含まれる
  const extra = Math.max(0, pages.length - 1);
  if (extra > 0) {
    lines.push({
      項目: `ページ追加 ${extra}ページ`,
      人日: round(extra * PER_PAGE_DAYS),
      根拠: `1ページ ${PER_PAGE_DAYS}人日（文章が用意されている場合）`,
    });
  }

  // 制作で一番時間を食うのはここ。サービス扱いさせない
  const content = brief.content.value!;
  if (/こちら|自社|当方|うち/.test(content)) {
    lines.push({
      項目: `文章の作成 ${pages.length}ページ`,
      人日: round(pages.length * COPY_PER_PAGE_DAYS),
      根拠: "取材と事実確認を含む。制作に含まれると思われやすいが別工程",
    });
  }

  const motion = brief.motion.value!;
  if (MOTION_DAYS[motion] > 0) {
    lines.push({
      項目: `動き（${motion}）`,
      人日: MOTION_DAYS[motion],
      根拠: "表示速度の調整を含む。動画そのものの制作費は含まない",
    });
  }

  const chat = brief.chat.value!;
  if (CHAT_DAYS[chat] > 0) {
    lines.push({
      項目: `チャット（${chat}）`,
      人日: CHAT_DAYS[chat],
      根拠:
        chat === "AIチャット"
          ? "答えさせない範囲の設計を含む"
          : "設置と初期の項目づくり",
    });
  }

  const rebuild = /作り直し|リニューアル|既存/.test(brief.existingSite.value ?? "");
  if (rebuild) {
    lines.push({
      項目: "作り直しの引き継ぎ",
      人日: REBUILD_DAYS,
      根拠: "旧URLと新URLの対応付け。やらないと検索から来ていた人が全員行き止まりになる",
    });
  }

  const total = round(lines.reduce((s, l) => s + l.人日, 0));

  const 崩れる条件 = [
    "ページ数が増えたとき",
    "文章と写真の用意が、決めた期日を過ぎたとき",
    "修正が3回を超えたとき",
    "公開後の更新作業を含めることになったとき",
  ];
  if (brief.hosting.value === "相手の既存サーバー") {
    崩れる条件.push("既存サーバーが想定と違ったとき（触ってみるまで読めない）");
  }

  return {
    内訳: lines,
    合計人日: total,
    下振れ: round(total * RANGE_LOW),
    上振れ: round(total * RANGE_HIGH),
    崩れる条件,
  };
}

export const webEstimateAgent: AgentImpl = {
  agentId: "web-estimate",
  run(ctx): AgentResult {
    if (!ctx.brief) return needsInput(["Web制作の設計内容（WebBrief）"], "自分");

    const result = estimate(ctx.brief);
    if ("missing" in result) return needsInput(result.missing);

    return {
      status: "完了",
      summary: `${result.下振れ}〜${result.上振れ}人日（内訳${result.内訳.length}件）`,
      output: result,
      evidence: [
        "単価は lib/data/web-rates.ts の表を使用",
        ...result.内訳.map((l) => `${l.項目}: ${l.人日}人日 — ${l.根拠}`),
        `幅は ${RANGE_LOW}倍〜${RANGE_HIGH}倍。1点で出すとその数字で握られる`,
        "金額は決めていない。工数と根拠までが担当",
      ],
    };
  },
};
