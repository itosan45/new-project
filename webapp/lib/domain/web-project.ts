/**
 * Web制作の設計項目。
 *
 * 「ホームページを作ってください」は、それ自体では発注になっていない。
 * どこに出すのか、雛形か作り込みか、何のためのサイトで、誰が見て、
 * その人に何をさせたいのか。動画やアニメーションは要るのか。
 * SNSや公式LINEに繋ぐのか。チャットボットは置くのか。
 * ここが決まらないと、見積も工程も出ない。
 *
 * この型は「聞くべきことの一覧」であると同時に、
 * 「答えが無いまま進むと何が起きるか」を持っている。
 * 未回答のまま作り始めると、必ず作り直しになる場所だから。
 */

// ---------------------------------------------------------------------------
// 選択肢
// ---------------------------------------------------------------------------

/** どこに出すか。運用費と、あとで誰が触れるかが変わる。 */
export type Hosting =
  | "Vercel"
  | "WordPress.com"
  | "レンタルサーバー"
  | "相手の既存サーバー"
  | "未定";

/** 作り方。工数が一桁変わる。 */
export type BuildStyle =
  | "雛形をそのまま"
  | "雛形を調整"
  | "デザインから作る"
  | "未定";

/** サイトの狙い。ここが2つ以上あると、どのページも中途半端になる。 */
export type SiteGoal =
  | "問い合わせを増やす"
  | "採用に応募してもらう"
  | "商品を売る"
  | "信用を示す（名刺代わり）"
  | "予約を取る"
  | "資料を請求してもらう";

/** 見た人に最後にしてほしいこと。1つに絞る。 */
export type PrimaryAction =
  | "フォームから問い合わせ"
  | "電話をかける"
  | "LINEで友だち追加"
  | "予約する"
  | "資料をダウンロード"
  | "購入する"
  | "応募する";

/** 動きをどこまで付けるか。工数と表示速度に直結する。 */
export type MotionLevel =
  | "動きなし"
  | "軽く動かす"
  | "しっかり動かす"
  | "動画を主役にする";

export type ChatSupport = "置かない" | "よくある質問だけ" | "有人チャット" | "AIチャット";

// ---------------------------------------------------------------------------
// 1つの決めごと
// ---------------------------------------------------------------------------

export interface Decision<T> {
  value?: T;
  /** 相手の言葉。要約せずに残す。 */
  note?: string;
}

/**
 * 決めごとの説明。
 *
 * 質問文だけでは足りない。なぜ聞くのかと、
 * 決まらないまま進むと何が起きるかを一緒に持つ。
 * 相手に「なぜそれを聞くのか」と言われたときに答えられないと、
 * ヒアリングが尋問になる。
 */
export interface DecisionSpec {
  key: WebDecisionKey;
  /** 相手にそのまま聞ける形の質問 */
  question: string;
  /** なぜ聞くのか */
  why: string;
  /** 決まらないまま進むと何が起きるか */
  ifUnanswered: string;
  /** 選択肢（自由記述の項目には無い） */
  options?: readonly string[];
  /** これが決まらないと見積が出せない項目か */
  blocksEstimate: boolean;
  /** どの段階で聞くか */
  stage: "1回目" | "2回目以降" | "制作前";
}

export type WebDecisionKey =
  | "goal"
  | "persona"
  | "primaryAction"
  | "hosting"
  | "domain"
  | "buildStyle"
  | "pages"
  | "content"
  | "motion"
  | "snsLinks"
  | "lineAccount"
  | "chat"
  | "form"
  | "measurement"
  | "updates"
  | "deadline"
  | "budget"
  | "existingSite";

// ---------------------------------------------------------------------------
// 案件1件ぶんの設計内容
// ---------------------------------------------------------------------------

export interface WebBrief {
  /** 何のためのサイトか。2つ以上あるならどれが主か決める。 */
  goal: Decision<SiteGoal>;
  /** 誰が見るか。年齢・立場・どんな状況で開くか。 */
  persona: Decision<string>;
  /** その人に最後にしてほしいこと。1つ。 */
  primaryAction: Decision<PrimaryAction>;

  /** どこに出すか */
  hosting: Decision<Hosting>;
  /** 独自ドメイン。持っているか、取るか、取らないか。 */
  domain: Decision<string>;
  /** 雛形か、作り込みか */
  buildStyle: Decision<BuildStyle>;

  /** 必要なページ */
  pages: Decision<string[]>;
  /** 文章と写真を誰が用意するか。ここが一番よく遅れる。 */
  content: Decision<string>;

  /** 動き・動画 */
  motion: Decision<MotionLevel>;
  /** 繋ぐSNS */
  snsLinks: Decision<string[]>;
  /** 公式LINE */
  lineAccount: Decision<string>;
  /** チャットボット */
  chat: Decision<ChatSupport>;
  /** 問い合わせフォームの送信先 */
  form: Decision<string>;

  /** 何をもって成功とするか、どう数えるか */
  measurement: Decision<string>;
  /** 公開後、誰がどれくらい更新するか */
  updates: Decision<string>;

  deadline: Decision<string>;
  budget: Decision<string>;
  /** 今あるサイト。作り直しか新規かで前提が変わる。 */
  existingSite: Decision<string>;
}

export function emptyBrief(): WebBrief {
  return {
    goal: {},
    persona: {},
    primaryAction: {},
    hosting: {},
    domain: {},
    buildStyle: {},
    pages: {},
    content: {},
    motion: {},
    snsLinks: {},
    lineAccount: {},
    chat: {},
    form: {},
    measurement: {},
    updates: {},
    deadline: {},
    budget: {},
    existingSite: {},
  };
}
