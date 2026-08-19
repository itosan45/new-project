import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import type { PrimaryAction, WebBrief } from "@/lib/domain/web-project";

/**
 * 計測設計 Agent。
 *
 * 基準値が無ければ止まる。ここを飛ばすと、公開後に
 * 「増えました」と言えなくなる。比較対象が消えるため。
 *
 * アクセス数は成果ではないので、数える対象に入れない。
 */

export interface MeasureOutput {
  数えるもの: string;
  数える場所: string;
  基準値: string;
  評価時期: string;
  /** 数えられない落とし穴と、その対処 */
  注意: string[];
}

const WHAT_TO_COUNT: Record<PrimaryAction, { 数えるもの: string; 数える場所: string; 注意: string[] }> = {
  フォームから問い合わせ: {
    数えるもの: "フォームの送信完了数",
    数える場所: "送信完了ページの表示回数",
    注意: ["迷惑メールに入って届いていない場合があるので、月1で実際に送って確かめる"],
  },
  電話をかける: {
    数えるもの: "サイト経由の着信数",
    数える場所: "サイト専用の番号、または受電時の聞き取り",
    注意: [
      "電話はそのままでは数えられない。番号を分けるか、聞き取りを決めておく",
      "受付時間外の着信は数に出ない。時間外の件数も別に把握する",
    ],
  },
  LINEで友だち追加: {
    数えるもの: "友だち追加数と、そこからの相談数",
    数える場所: "LINE公式アカウントの管理画面",
    注意: ["追加だけして何も言わない人が多いので、相談数まで数える"],
  },
  予約する: {
    数えるもの: "予約完了数",
    数える場所: "予約システムの管理画面",
    注意: ["キャンセル分を引いた実来店数も別に数える"],
  },
  資料をダウンロード: {
    数えるもの: "資料の請求数",
    数える場所: "フォーム送信完了",
    注意: ["請求後に連絡が取れた数まで数えないと、成果に繋がらない"],
  },
  購入する: {
    数えるもの: "購入完了数と売上",
    数える場所: "カートの管理画面",
    注意: ["カートに入れて買わなかった数も見る。そこに直せる問題がある"],
  },
  応募する: {
    数えるもの: "応募数",
    数える場所: "応募フォームの送信完了",
    注意: ["応募数より、面接まで進んだ数のほうが実態を表す"],
  },
};

export function planMeasurement(brief: WebBrief): MeasureOutput | { missing: string[] } {
  const missing: string[] = [];
  if (!brief.primaryAction.value) missing.push("してほしい行動（primaryAction）");
  // 基準値が無いまま進めない。後で効果を言えなくなる
  if (!brief.measurement.value?.trim())
    missing.push("いまの件数＝基準値（measurement）");
  if (missing.length > 0) return { missing };

  const base = WHAT_TO_COUNT[brief.primaryAction.value!];
  return {
    数えるもの: base.数えるもの,
    数える場所: base.数える場所,
    基準値: brief.measurement.value!,
    評価時期: "公開から3か月後（月ごとの波があるので1か月では判断できない）",
    注意: [
      ...base.注意,
      "アクセス数は成果ではない。増えても行動が増えていなければ意味がない",
      "計測は公開前に入れる。後から入れると公開直後の山を取り逃す",
    ],
  };
}

export const webMeasureAgent: AgentImpl = {
  agentId: "web-measure",
  run(ctx): AgentResult {
    if (!ctx.brief) return needsInput(["Web制作の設計内容（WebBrief）"], "自分");

    const result = planMeasurement(ctx.brief);
    if ("missing" in result) return needsInput(result.missing);

    return {
      status: "完了",
      summary: `「${result.数えるもの}」を数える。基準値は「${result.基準値}」`,
      output: result,
      evidence: [
        `してほしい行動「${ctx.brief.primaryAction.value}」から数える対象を決めた`,
        `基準値: ${result.基準値}`,
        result.評価時期,
      ],
    };
  },
};
