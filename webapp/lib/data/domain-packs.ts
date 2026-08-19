import type { DomainPack } from "@/lib/domain/types";

/**
 * ドメインパック。
 *
 *     専門性 = 共通Agent × ドメインパック
 *
 * 建設向けのDocument Readerと、会計向けのDocument Readerは同じ実装。
 * 読み込むパックが違うだけ。ここを別Agentにした瞬間、
 * 業種 × Agent の数だけ実装が要ることになり、横展開できなくなる。
 *
 * 新しい業種の顧客が来たら、追加するのはパック1つ。Agentは触らない。
 */

/** 三河ハウスサポート向け。手書きの現場調査票が対象。 */
export const CONSTRUCTION_PACK: DomainPack = {
  packId: "construction",
  name: "建設・リフォーム",
  industries: ["住宅リフォーム", "防蟻工事", "工務店", "設備工事"],
  appliesTo: ["document-reader", "validator", "data-analyst"],

  vocabulary: [
    { term: "㎡ / 平米", meaning: "面積。床面積か施工面積かで単価が変わる" },
    { term: "坪", meaning: "約3.3㎡。見積書では㎡と混在することがある" },
    { term: "一式", meaning: "数量を明示しない計上。単価の検算ができない" },
    { term: "諸経費", meaning: "工事原価に対する比率で計上されることが多い" },
    { term: "床下", meaning: "点検口からの調査範囲。全域を見ていないことがある" },
    { term: "蟻害 / 腐朽", meaning: "被害の種類。区別して記録する必要がある" },
    { term: "基礎断熱 / 床断熱", meaning: "断熱の工法。防蟻の施工方法が変わる" },
  ],

  extractionFields: [
    {
      field: "調査日",
      hint: "和暦表記あり。「R8.8.14」形式も想定",
      required: true,
      kind: "日付",
    },
    {
      field: "物件住所",
      hint: "手書き。番地の数字が読みにくい",
      required: true,
      kind: "キーワード",
      clues: ["住所", "所在地", "物件"],
    },
    {
      field: "施主名",
      hint: "「様」を除去する",
      required: true,
      kind: "キーワード",
      clues: ["施主", "お客様名", "氏名", "宛名"],
    },
    {
      field: "築年数",
      hint: "「築○年」または竣工年",
      required: false,
      kind: "キーワード",
      clues: ["築年数", "築", "竣工"],
    },
    {
      field: "被害箇所",
      hint: "床下・浴室・玄関など。複数選択",
      required: true,
      kind: "キーワード",
      clues: ["被害箇所", "箇所"],
    },
    {
      field: "被害程度",
      hint: "軽微・中程度・重度の3段階",
      required: true,
      kind: "キーワード",
      clues: ["被害程度", "程度"],
    },
    {
      field: "施工面積",
      hint: "㎡または坪。単位を必ず記録",
      required: true,
      kind: "キーワード",
      clues: ["施工面積", "面積"],
    },
    {
      // 金額は最大値を拾う。合計であることが多いため
      field: "概算金額",
      hint: "手書き。桁の読み違えに注意",
      required: false,
      kind: "金額",
    },
  ],

  validationRules: [
    "施工面積の単位（㎡／坪）が記録されていること",
    "被害程度が「重度」なら、被害箇所が複数記載されていること",
    "概算金額 ÷ 施工面積 が、過去実績の単価レンジ内であること",
    "調査日が未来日でないこと",
  ],

  alwaysEscalate: [
    // 金額は取り消しがきかない
    "概算金額が過去実績の単価レンジを2割以上外れる場合",
    "被害程度が「重度」の案件（再調査の要否を人が判断する）",
    "手書きの訂正線が金額欄にかかっている場合",
  ],
};

/** みらい会計パートナーズ向け。顧問先の証憑が対象。 */
export const ACCOUNTING_PACK: DomainPack = {
  packId: "accounting",
  name: "士業・会計",
  industries: ["税理士法人", "会計事務所", "社労士事務所", "記帳代行"],
  appliesTo: ["document-reader", "validator", "audit", "data-analyst"],

  vocabulary: [
    { term: "証憑", meaning: "取引を裏付ける書類。領収書・請求書・契約書など" },
    { term: "勘定科目", meaning: "仕訳の分類。事務所ごとに独自の細目がある" },
    { term: "税区分", meaning: "課税・非課税・不課税・免税。誤ると申告が狂う" },
    { term: "インボイス番号", meaning: "登録番号。T+13桁。仕入税額控除の要件" },
    { term: "但し書き", meaning: "領収書の用途欄。勘定科目の判定根拠になる" },
    { term: "軽減税率", meaning: "8%。同一領収書内に10%と混在することがある" },
    { term: "立替金", meaning: "経費と区別が必要。誤ると損益が狂う" },
  ],

  extractionFields: [
    { field: "取引日", hint: "領収書の発行日。和暦あり", required: true, kind: "日付" },
    {
      /*
       * 手がかりは長めの語にする。
       * 「発行」だけにすると「発行日 2026年8月12日」に食われて、
       * 取引先名として日付が入る。短い語ほど別の語に当たりやすい。
       */
      field: "取引先名",
      hint: "屋号と法人名が異なることがある。上部に無記名で書かれていることも多い",
      required: true,
      kind: "キーワード",
      clues: ["発行元", "発行者", "店名", "屋号", "会社名"],
    },
    {
      field: "インボイス番号",
      hint: "T+13桁。無い場合は控除不可として扱う",
      required: false,
      kind: "キーワード",
      clues: ["登録番号", "インボイス", "適格請求書"],
    },
    {
      // 税抜と合計の区別は文面からは決められない。人が確認する
      field: "合計金額",
      hint: "最大値を拾う。税抜との区別は人が確認する",
      required: true,
      kind: "金額",
    },
    { field: "税抜金額", hint: "内訳に記載がない場合は逆算しない", required: true },
    { field: "消費税額", hint: "税率ごとに分けて記録", required: true },
    { field: "税率", hint: "10%と8%が混在しうる", required: true },
    {
      field: "但し書き",
      hint: "勘定科目の判定に使う",
      required: true,
      kind: "キーワード",
      clues: ["但し", "但", "内容"],
    },
    { field: "支払方法", hint: "現金・カード・振込", required: false },
  ],

  validationRules: [
    "税抜金額 + 消費税額 = 合計金額 が成立すること",
    "税率ごとの内訳の合計が、総額と一致すること",
    "インボイス番号がT+13桁の形式であること",
    "取引先名が顧問先のマスタに存在すること",
    "取引日が対象会計期間内であること",
  ],

  alwaysEscalate: [
    // 士業は判断を説明する義務がある。曖昧なまま通さない
    "但し書きが「品代」など、用途が特定できない場合",
    "同一領収書内に複数税率が混在する場合",
    "インボイス番号が読み取れない、または形式が不正な場合",
    "10万円を超える取引（資産計上の要否を人が判断する）",
    "取引先マスタに存在しない相手先",
  ],
};

/** ルミエール向け。問い合わせメールが対象。 */
export const ECOMMERCE_PACK: DomainPack = {
  packId: "ecommerce",
  name: "EC・D2C",
  industries: ["EC", "D2C", "通販", "サブスクリプション"],
  appliesTo: ["classifier", "draft-writer", "voice-of-customer", "data-analyst"],

  vocabulary: [
    { term: "定期便", meaning: "サブスク。解約・スキップの扱いが都度購入と違う" },
    { term: "スキップ", meaning: "次回配送の見送り。解約ではない" },
    { term: "初回限定", meaning: "継続回数の縛りがある場合、解約可否が変わる" },
    { term: "パッチテスト", meaning: "肌トラブル時の確認事項。回答に必須" },
    { term: "ロット番号", meaning: "製品の製造単位。品質問い合わせで必ず聞く" },
    { term: "開封後", meaning: "返品可否の分岐点" },
  ],

  extractionFields: [
    { field: "問い合わせ区分", hint: "配送・返品・品質・解約・その他", required: true },
    {
      field: "注文番号",
      hint: "本文中の英数字列",
      required: false,
      kind: "キーワード",
      clues: ["注文番号", "ご注文番号", "オーダー"],
    },
    {
      field: "電話番号",
      hint: "折り返し先。本文に書かれていることがある",
      required: false,
      kind: "電話番号",
    },
    { field: "感情の強さ", hint: "0〜1。文面の語調から", required: true },
    { field: "緊急度", hint: "肌トラブルの訴えは最優先", required: true },
    { field: "定期便の有無", hint: "回答テンプレートが変わる", required: false },
  ],

  validationRules: [
    "宛先メールアドレスが注文情報と一致すること",
    "一斉配信の場合、宛先リストに重複がないこと",
    "回答文に、確定していない納期・金額が含まれていないこと",
  ],

  alwaysEscalate: [
    // 化粧品は健康被害の訴えが混ざる。定型返信は火に油
    "肌トラブル・健康被害への言及がある場合",
    "感情の強さが 0.7 を超える場合",
    "「消費者庁」「弁護士」「返金」への言及がある場合",
    "SNSでの発信を示唆する内容",
    "2回以上やり取りが続いている案件",
  ],
};

export const DOMAIN_PACKS: DomainPack[] = [
  CONSTRUCTION_PACK,
  ACCOUNTING_PACK,
  ECOMMERCE_PACK,
];

export function findPack(packId: string): DomainPack | undefined {
  return DOMAIN_PACKS.find((p) => p.packId === packId);
}

/** そのAgentに差し込めるパックを返す */
export function packsForAgent(agentId: string): DomainPack[] {
  return DOMAIN_PACKS.filter((p) => p.appliesTo.includes(agentId));
}
