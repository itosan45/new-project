import type { EngagementStage } from "@/lib/domain/engagement";

/**
 * 各段階で誰が何をするか。
 *
 * 秘書 / Agent / あなた の3者に分ける。
 * ここを曖昧にすると「AIが勝手にやってくれる」という期待だけが残り、
 * 実際には誰も動いていない、という状態になる。
 *
 * 判断（あなた）は必ず1つ以上ある。全部AIに任せる段階を作らない。
 *
 * 「相談」と「提案」は、1回で終わる前提で書かない。
 * 3回4回と回るのが普通なので、この2つだけ「1回まわす手順」を持たせてある。
 */

export interface StageDefinition {
  stage: EngagementStage;
  /** この段階が何のためにあるか */
  purpose: string;
  /** 秘書（窓口）がやること */
  secretary: string[];
  /** どのAgentが動くか */
  agents: { agentId: string; work: string }[];
  /** あなたが判断すること。ここが空の段階は作らない。 */
  decisions: string[];
  /** この段階で作られる記録 */
  outputs: string[];
  /** 相手の返事を待つ段階かどうか */
  waitingOnClient: boolean;
  /** この段階で起きがちな失敗 */
  pitfall: string;
  /**
   * 繰り返す段階かどうか。
   *
   * 繰り返す段階には、1回分の手順（round）を持たせる。
   * これが無いと「打ち合わせ3回目」で何をすればいいか毎回考え直すことになる。
   */
  repeats?: {
    /** 何を1回と数えるか */
    unit: string;
    /** 目安の回数 */
    typicalRounds: string;
    /** 1回分の手順 */
    round: { phase: string; who: "秘書" | "Agent" | "あなた"; work: string }[];
    /** 次の回に行くか、次の段階に進むかの分かれ目 */
    exit: string;
  };
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stage: "相談",
    purpose: "何に困っているのかを、こちらが説明できる状態にする",
    secretary: [
      "壁打ち相手になり、相手が言語化できていない困りごとを引き出す",
      "聞いた内容をヒアリング記録に落とす",
      "前回の「まだ分からないこと」から、次回の質問を組み立てる",
      "似た過去案件があれば引っ張ってくる",
      "触ってはいけないものを必ず聞く",
    ],
    agents: [
      { agentId: "intake", work: "相談内容を構造化し、対象と期限を切り出す" },
      {
        agentId: "marketing-research",
        work: "相手の業界・競合の状況を下調べする",
      },
      {
        agentId: "data-analyst",
        work: "相手からもらった資料を見て、現状の件数・時間を数字にする",
      },
    ],
    decisions: [
      "受けるか、断るか",
      "侵襲度をどこに置くか（L0〜L4）",
      "もう1回聞くか、提案に進むか",
      "自分の手に負える範囲か",
    ],
    outputs: ["打ち合わせ記録（回ごと）", "ヒアリング記録", "侵襲度の判定"],
    waitingOnClient: false,
    pitfall:
      "相手の言った要望をそのまま受け取ってしまう。困りごとと、相手が思いついた解決策は別物。",
    repeats: {
      unit: "打ち合わせ1回",
      typicalRounds: "1〜4回。相手の社内で決裁者が増えるほど伸びる",
      round: [
        {
          phase: "前",
          who: "秘書",
          work: "前回の「まだ分からないこと」を質問の形に直し、聞く順番を決める",
        },
        {
          phase: "前",
          who: "Agent",
          work: "業界の下調べ・もらった資料の集計をして、こちらから出す材料を作る",
        },
        { phase: "当日", who: "あなた", work: "相手と話す。決裁者が出ているかを確認する" },
        {
          phase: "後",
          who: "秘書",
          work: "聞けたこと / まだ分からないこと / 相手の反応 を記録に残す",
        },
        {
          phase: "後",
          who: "あなた",
          work: "もう1回聞くか、提案に進むかを決める",
        },
      ],
      exit:
        "「まだ分からないこと」が空で、侵襲度と決裁者が決まったら提案へ。残っているなら次の回を組む。",
    },
  },
  {
    stage: "提案",
    purpose: "やること・やらないこと・金額を確定させ、相手の判断を仰ぐ",
    secretary: [
      "ヒアリング記録から提案の骨子を作る",
      "やらないことを明示する",
      "過去案件の実績から見積の根拠を出す",
      "断られた版の指摘を残し、次の版の入力にする",
    ],
    agents: [
      {
        agentId: "proposal-architect",
        work: "顧客の希望を各Agentに投げ、案・意見・懸念を集めて提案書に組み立てる",
      },
      {
        agentId: "revenue-analyst",
        work: "削減時間からROIを算出し、金額の根拠を作る",
      },
      { agentId: "draft-writer", work: "提案書の下書きを作る" },
      { agentId: "report-generator", work: "提案資料・プレゼン資料に整える" },
      {
        agentId: "voice-of-customer",
        work: "もらった指摘を分類し、どこを直せば通るかを出す",
      },
      { agentId: "qa", work: "金額・前提・やらないことの記載漏れを検査する" },
    ],
    decisions: [
      "金額を決める",
      "やらないことの線引き",
      "指摘を反映して次の版を出すか、条件が合わないので見送るか",
    ],
    outputs: ["提案書（版ごと）", "見積", "前提条件", "相手からの指摘"],
    waitingOnClient: true,
    pitfall:
      "「やること」だけ書いて出す。書かれていない作業は、後から必ず無償で降ってくる。もう1つは、指摘を記録せずに版だけ重ねて、同じ指摘を二度受けること。",
    repeats: {
      unit: "提案1版",
      typicalRounds: "1〜3版。金額が動くと版が増える",
      round: [
        {
          phase: "前",
          who: "Agent",
          work: "提案設計Agentが各Agentに意見照会し、案・懸念・できないことを集める",
        },
        {
          phase: "前",
          who: "Agent",
          work: "前の版の指摘を分類し、金額・範囲・期間のどこを直すかを出す",
        },
        {
          phase: "前",
          who: "秘書",
          work: "集めた意見を提案書にまとめ、懸念に1つずつ答え、やらないことを明示する",
        },
        { phase: "前", who: "あなた", work: "金額と線引きを決める。出す前に必ず見る" },
        { phase: "当日", who: "あなた", work: "相手に説明する（改善提案のプレゼン）" },
        {
          phase: "後",
          who: "秘書",
          work: "承諾 / 保留 / 修正依頼 / 見送り と、その理由を版に記録する",
        },
      ],
      exit:
        "承諾なら制作へ。修正依頼なら指摘を記録して次の版へ。見送りなら見送り段階へ。",
    },
  },
  {
    stage: "制作",
    purpose: "成果物を作る",
    secretary: [
      "作業をAgentに割り振る",
      "承認が必要な工程で止め、あなたに回す",
      "進捗を案件に記録する",
    ],
    agents: [
      { agentId: "document-reader", work: "資料・書類から必要な情報を取り出す" },
      { agentId: "data-analyst", work: "数値を集計・分析する" },
      { agentId: "draft-writer", work: "文面・コンテンツを作る" },
      { agentId: "validator", work: "作ったものが業務ルールに合うか検証する" },
      { agentId: "qa", work: "件数・金額・宛先・漏れを検査する" },
      { agentId: "executor", work: "承認済みの操作を実行する" },
    ],
    decisions: [
      "承認ゲートで止まった操作を、通すか差し戻すか",
      "品質が納品水準に達しているか",
    ],
    outputs: ["成果物", "作業記録（Run）", "監査ログ"],
    waitingOnClient: false,
    pitfall:
      "承認が溜まって、中身を見ずに押すようになる。そうなった時点で承認ゲートは機能していない。",
  },
  {
    stage: "納品",
    purpose: "成果物を渡し、相手の確認を得る",
    secretary: [
      "納品物一式をまとめる",
      "使い方の説明を用意する",
      "渡した日時を記録する",
    ],
    agents: [
      { agentId: "qa", work: "納品前の最終検査" },
      { agentId: "report-generator", work: "納品書・説明資料を作る" },
      { agentId: "notification", work: "納品したことを通知する" },
    ],
    decisions: ["納品してよいか（出したら取り消せない）"],
    outputs: ["納品物", "納品記録"],
    waitingOnClient: true,
    pitfall:
      "渡して終わりにする。相手が使えていない状態は、納品していないのと同じ。",
  },
  {
    stage: "完了",
    purpose: "検収を得て、請求できる状態にする",
    secretary: ["検収の記録を残す", "請求内容をまとめる", "案件を振り返る"],
    agents: [
      {
        agentId: "revenue-analyst",
        work: "実際の削減効果を測り、提案時の見込みと突き合わせる",
      },
      { agentId: "audit", work: "案件全体の記録を確定させる" },
    ],
    decisions: ["請求してよいか", "運用契約に進むか、ここで終わりか"],
    outputs: ["検収記録", "実績値（次の提案の根拠になる）"],
    waitingOnClient: false,
    pitfall:
      "実績値を測らずに終える。次の案件で「前回はこれだけ効果が出ました」と言えなくなる。",
  },
  {
    stage: "運用",
    purpose: "納品後に起きることを受け止め、次につなげる",
    secretary: [
      "問い合わせ・不具合を受け付ける",
      "原因がどちら側かを切り分ける",
      "追加提案の種を拾う",
    ],
    agents: [
      { agentId: "classifier", work: "問い合わせを不具合・質問・追加要望に分ける" },
      { agentId: "recovery", work: "自動で直せる範囲を復旧する" },
      { agentId: "audit", work: "対応の記録を残す" },
    ],
    decisions: [
      "無償対応か有償対応か（原因がどちら側にあるか）",
      "追加提案を出すか",
    ],
    outputs: ["インシデント記録", "追加提案の候補"],
    waitingOnClient: false,
    pitfall:
      "原因を切り分けないまま対応する。無償対応が無限に増えて、案件の利益が消える。",
  },
  {
    stage: "見送り",
    purpose: "断られた理由を残す",
    secretary: ["断られた理由を記録する", "時期を変えて再提案できるか判断する"],
    agents: [
      {
        agentId: "voice-of-customer",
        work: "失注理由を集計し、提案の改善点を出す",
      },
    ],
    decisions: ["再提案するか、諦めるか"],
    outputs: ["失注理由"],
    waitingOnClient: false,
    pitfall:
      "理由を聞かずに終わる。同じ理由で何度も落とすことになる。",
  },
  {
    stage: "中止",
    purpose: "途中で止まった理由と、そこまでの費用を確定させる",
    secretary: ["中止の理由を記録する", "そこまでの作業量を集計する"],
    agents: [{ agentId: "audit", work: "中止時点の状態を記録として固定する" }],
    decisions: ["途中までの分を請求するか"],
    outputs: ["中止記録", "作業実績"],
    waitingOnClient: false,
    pitfall:
      "口頭で流して費用を請求しない。中止は事故ではなく、起きるものとして扱う。",
  },
];

export function findStage(stage: EngagementStage): StageDefinition | undefined {
  return STAGE_DEFINITIONS.find((s) => s.stage === stage);
}
