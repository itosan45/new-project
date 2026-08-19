import type { BuildStyle, ChatSupport, MotionLevel } from "@/lib/domain/web-project";

/**
 * 見積の単価表（人日）。
 *
 * ここが唯一の出どころ。見積Agentの計算も、契約に書いてある相場も、
 * 同じこの数字を見る。2か所に書くと、必ずどちらかが古くなる。
 *
 * **この表を書き換えると、見積の出力が変わる。**
 * 経験を飾りにしないというのは、こういう状態のことを指す。
 *
 * 実際にやってみて外れていたら、その場でここを直す。
 */

/** 土台の作業。設計・実装・確認まで含む。 */
export const BASE_DAYS: Record<Exclude<BuildStyle, "未定">, number> = {
  雛形をそのまま: 1,
  雛形を調整: 3,
  デザインから作る: 8,
};

/** 1ページ追加あたり（文章が用意されている場合） */
export const PER_PAGE_DAYS = 0.5;

/** 文章をこちらで書く場合、1ページあたり（取材と事実確認を含む） */
export const COPY_PER_PAGE_DAYS = 0.5;

/** 動きを付ける追加分。表示速度の調整を含む。 */
export const MOTION_DAYS: Record<MotionLevel, number> = {
  動きなし: 0,
  軽く動かす: 1,
  しっかり動かす: 3,
  動画を主役にする: 2,
};

/** チャット設置の追加分。AIは「答えさせない範囲」の設計を含む。 */
export const CHAT_DAYS: Record<ChatSupport, number> = {
  置かない: 0,
  よくある質問だけ: 1,
  有人チャット: 1,
  AIチャット: 4,
};

/** 作り直し案件の追加分。旧URLとの対応付けが要る。 */
export const REBUILD_DAYS = 1;

/**
 * 見積の幅。
 *
 * 1点で出すと、必ずその数字で握られる。
 * 下振れ・上振れの両方を出して、上振れの条件も一緒に伝える。
 */
export const RANGE_LOW = 0.9;
export const RANGE_HIGH = 1.4;

/** 相場の説明文を、上の数字から組み立てる。契約と実装で数字がずれないようにする。 */
export function baseDaysLabel(): string {
  return `雛形そのまま ${BASE_DAYS.雛形をそのまま}人日 / 雛形調整 ${BASE_DAYS.雛形を調整}人日 / デザインから ${BASE_DAYS.デザインから作る}人日`;
}

export function motionDaysLabel(): string {
  return `軽く +${MOTION_DAYS.軽く動かす}人日 / しっかり +${MOTION_DAYS.しっかり動かす}人日 / 動画主役 +${MOTION_DAYS.動画を主役にする}人日`;
}

export function chatDaysLabel(): string {
  return `よくある質問 +${CHAT_DAYS.よくある質問だけ}人日 / AIチャット +${CHAT_DAYS.AIチャット}人日`;
}
