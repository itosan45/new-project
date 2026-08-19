import { needsInput, type AgentImpl, type AgentResult } from "@/lib/agents/types";
import type { PrimaryAction, SiteGoal, WebBrief } from "@/lib/domain/web-project";

/**
 * 情報設計 Agent。
 *
 * 狙いと導線から、ページ構成とボタンの置き場所を決める。
 * 狙いが決まっていないのに構成を出すことはしない。
 * 出せてしまうと、作り手の好みで構成が決まる。
 */

export interface PageSpec {
  name: string;
  purpose: string;
  /** 主導線のボタンを置くページか */
  hasMainAction: boolean;
}

export interface IaOutput {
  /** スマホでの縦の並び順（先に決めるのはこちら） */
  pages: PageSpec[];
  mainAction: PrimaryAction;
  /** ボタンをどこに置くか */
  actionPlacement: string[];
  /** ボタンの文言案。「お問い合わせ」は何が起きるか分からず押されにくい */
  actionLabel: string;
}

/** 狙いごとの基本構成。上から順に並べる。 */
const PAGES_BY_GOAL: Record<SiteGoal, PageSpec[]> = {
  "信用を示す（名刺代わり）": [
    { name: "トップ", purpose: "何をしている会社かを1画面で伝える", hasMainAction: true },
    { name: "実績", purpose: "実際にやった仕事を見せる。信用の中心", hasMainAction: false },
    { name: "会社情報", purpose: "所在地・沿革・代表。実在を示す", hasMainAction: false },
    { name: "お問い合わせ", purpose: "連絡手段", hasMainAction: true },
  ],
  問い合わせを増やす: [
    { name: "トップ", purpose: "困りごとに心当たりを持たせる", hasMainAction: true },
    { name: "サービス", purpose: "何をどこまでやるかを具体的に", hasMainAction: true },
    { name: "実績", purpose: "自分と同じ状況の例を見せる", hasMainAction: true },
    { name: "よくある質問", purpose: "問い合わせ前の不安を先に消す", hasMainAction: true },
    { name: "お問い合わせ", purpose: "連絡する", hasMainAction: true },
  ],
  採用に応募してもらう: [
    { name: "トップ", purpose: "どんな会社かを1画面で", hasMainAction: true },
    { name: "働く人", purpose: "誰と働くか。応募者が最初に知りたいこと", hasMainAction: true },
    { name: "仕事の内容", purpose: "1日の流れ。想像できる形で", hasMainAction: true },
    { name: "募集要項", purpose: "待遇・条件", hasMainAction: true },
    { name: "応募", purpose: "応募する", hasMainAction: true },
  ],
  商品を売る: [
    { name: "トップ", purpose: "何を売っているかを1画面で", hasMainAction: true },
    { name: "商品一覧", purpose: "選べる状態にする", hasMainAction: true },
    { name: "商品詳細", purpose: "買う判断に要る情報を全部置く", hasMainAction: true },
    { name: "買い方・送料", purpose: "買う前の不安を消す", hasMainAction: false },
    { name: "お問い合わせ", purpose: "買えない理由を拾う", hasMainAction: false },
  ],
  予約を取る: [
    { name: "トップ", purpose: "何が予約できるかを1画面で", hasMainAction: true },
    { name: "メニュー・料金", purpose: "予約前に知りたいこと", hasMainAction: true },
    { name: "予約", purpose: "予約する", hasMainAction: true },
    { name: "アクセス", purpose: "行き方。地図と駐車場", hasMainAction: true },
  ],
  資料を請求してもらう: [
    { name: "トップ", purpose: "資料に何が書いてあるかを示す", hasMainAction: true },
    { name: "サービス", purpose: "資料を読む価値を伝える", hasMainAction: true },
    { name: "資料請求", purpose: "資料を受け取る", hasMainAction: true },
  ],
};

/** ボタンの文言。何が起きるかが分かる言葉にする。 */
const ACTION_LABEL: Record<PrimaryAction, string> = {
  フォームから問い合わせ: "相談してみる（無料）",
  電話をかける: "電話で相談する",
  LINEで友だち追加: "LINEで質問する",
  予約する: "空き状況を見る",
  資料をダウンロード: "資料を受け取る",
  購入する: "カートに入れる",
  応募する: "応募する",
};

export function buildIa(brief: WebBrief): IaOutput | { missing: string[] } {
  const missing: string[] = [];
  if (!brief.goal.value) missing.push("狙い（goal）");
  if (!brief.persona.value?.trim()) missing.push("見る人（persona）");
  if (!brief.primaryAction.value) missing.push("してほしい行動（primaryAction）");
  if (missing.length > 0) return { missing };

  const goal = brief.goal.value!;
  const action = brief.primaryAction.value!;

  // 相手がページを指定していれば、そちらを優先する。
  // 勝手に構成を差し替えると、聞いた意味が無くなる
  const listed = brief.pages.value;
  const pages =
    listed && listed.length > 0
      ? listed.map((name, i) => ({
          name,
          purpose: PAGES_BY_GOAL[goal][i]?.purpose ?? "（用途を確認する）",
          hasMainAction: true,
        }))
      : PAGES_BY_GOAL[goal];

  const placement = [
    "全ページの最初の画面内（スクロールせずに見える位置）",
    "全ページの末尾",
  ];
  if (action === "電話をかける") {
    // 時間外にかけて出ないと、その1件は二度と来ない
    placement.push("スマホではタップで発信。受付時間を必ず横に書く");
  }
  if (action === "LINEで友だち追加") {
    placement.push("フォームより上に置く。連絡は結局LINEに来る");
  }

  return { pages, mainAction: action, actionPlacement: placement, actionLabel: ACTION_LABEL[action] };
}

export const webIaAgent: AgentImpl = {
  agentId: "web-ia",
  run(ctx): AgentResult {
    if (!ctx.brief) return needsInput(["Web制作の設計内容（WebBrief）"], "自分");

    const result = buildIa(ctx.brief);
    if ("missing" in result) return needsInput(result.missing);

    return {
      status: "完了",
      summary: `${result.pages.length}ページの構成を作成。主導線は「${result.actionLabel}」`,
      output: result,
      evidence: [
        `狙い「${ctx.brief.goal.value}」の基本構成から組み立てた`,
        `見る人: ${ctx.brief.persona.value}`,
        "主導線は1つに絞っている（2つ以上置くとどちらも押されない）",
        ...result.actionPlacement.map((p) => `配置: ${p}`),
      ],
    };
  },
};
