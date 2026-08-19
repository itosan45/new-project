import type { AgentContract } from "@/lib/domain/types";
import {
  COPY_PER_PAGE_DAYS,
  PER_PAGE_DAYS,
  baseDaysLabel,
  chatDaysLabel,
  motionDaysLabel,
} from "@/lib/data/web-rates";

/**
 * Web制作の役割分担Agent。
 *
 * ここで軸を分けておく。
 *
 * - 業種パック（建設・会計・EC）= 相手の分野の知識。共通Agentに差し込む
 * - 職種Agent（このファイル）  = うちの作業の役割分担。Agentとして足す
 *
 * この2つは別物なので両立する。
 * 建設会社のHP案件 = 職種Agent群 × 建設パック。
 *
 * 「ベテラン」は経歴文では書かない。判断基準・地雷・相場・いまの標準を持たせ、
 * その中身を実際に参照して出力を決める。参照されない経歴は飾りにしかならない。
 */

const 確認日 = "2026-08-19";

export const WEB_AGENTS: AgentContract[] = [
  {
    agentId: "web-brief",
    agentVersion: "1.0.0",
    name: "ヒアリング設計 Agent",
    category: "調査",
    purpose:
      "Web制作で決めなければいけないことのうち、まだ答えが無いものを、聞く順に並べる",
    allowedActions: ["未回答の抽出", "質問の組み立て", "聞く順の決定"],
    forbiddenActions: [
      "未回答項目を推測で埋める",
      "顧客への直接連絡",
      "答えが無いまま次の工程へ渡す",
    ],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "READ_ONLY",
    expertise: [
      "18の決めごとのうち、どれが見積を止めるかの切り分け",
      "1回目に聞くこと・2回目以降でよいことの仕分け",
      "「なぜそれを聞くのか」を相手に説明できる形にする",
    ],
    notSuitableFor: [
      "相手の答えの良し悪しの判断",
      "決めごと自体の追加（項目は設計側で決める）",
    ],
    requiredInputs: ["いまの設計内容（WebBrief。空でもよい）"],
    produces: ["未回答の決めごと", "聞く順", "各項目の理由と、決まらない場合の影響"],
    qualityRisks: [
      "全部を1回で聞こうとすると、相手が疲れて雑な答えが返る",
    ],
    escalatesWhen: ["見積を止める項目が3件以上残っている"],
    timeoutSeconds: 30,
    maxRetries: 1,
    confidenceThreshold: 0.9,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "ベテラン",
      judgment: [
        {
          状況: "相手が「かっこいいサイトが欲しい」としか言わない",
          判断: "狙いと、見た人にしてほしいことを先に確定させる",
          理由:
            "見た目の good/bad は主観で、決着しない。行動が決まれば見た目の判断基準もできる",
        },
        {
          状況: "1回目の打ち合わせ",
          判断: "予算と公開希望日を必ず同じ回で聞く",
          理由:
            "この2つで、雛形か作り込みかがほぼ決まる。後から聞くと提案をやり直すことになる",
        },
        {
          状況: "相手が「文章はそちらで」と言う",
          判断: "その場で工数と金額に乗せ、誰が事実確認するかも決める",
          理由: "文章はサービス扱いされやすいが、実際は制作で一番時間を食う",
        },
      ],
      traps: [
        "「素材は後で送ります」を信じて着手すると、そこで数週間止まる",
        "決裁者が同席していない回で仕様を固めると、次の回でひっくり返る",
        "「今のサイトと同じ内容で」は、たいてい中身を見直したいという意味",
      ],
      benchmarks: [
        {
          項目: "ヒアリング回数",
          値: "1〜4回",
          根拠: "相手の社内で決裁者が増えるほど伸びる",
        },
        {
          項目: "素材待ちで止まる期間",
          値: "2〜4週間",
          根拠: "制作が止まる原因の1位。着手前に締切を決めておく",
        },
      ],
      currentPractice: [
        {
          項目: "問い合わせ導線",
          いま: "フォームだけでなくLINEを併置する。LINEは国内9,700万人が使い、メッセージ開封率は60〜80%",
          確認日,
        },
        {
          項目: "見る端末",
          いま: "スマホ前提で設計する。PCは後から合わせる",
          確認日,
        },
      ],
      staleAfterDays: 180,
    },
  },

  {
    agentId: "web-ia",
    agentVersion: "1.0.0",
    name: "情報設計 Agent",
    category: "分析",
    purpose: "狙いと導線から、ページ構成とボタンの置き場所を決める",
    allowedActions: ["ページ構成の生成", "導線の配置", "各ページの目的の明示"],
    forbiddenActions: [
      "狙いが未確定のまま構成を出す",
      "主導線を2つ以上置く",
      "文章の作成",
    ],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "READ_ONLY",
    expertise: [
      "1つの行動に絞った導線設計",
      "ページごとの役割の切り分け",
      "スマホでの縦の並び順の決定",
    ],
    notSuitableFor: ["デザイン（配色・写真選び）", "文章"],
    requiredInputs: ["狙い", "見る人", "してほしい行動"],
    produces: ["ページ一覧と各ページの目的", "主導線の置き場所", "スマホでの並び順"],
    qualityRisks: [
      "ページを増やすほど良いと思われがちだが、増えるほど導線が薄まる",
    ],
    escalatesWhen: ["狙いが2つ以上ある", "してほしい行動が2つ以上ある"],
    timeoutSeconds: 60,
    maxRetries: 1,
    confidenceThreshold: 0.8,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "ベテラン",
      judgment: [
        {
          状況: "してほしい行動が決まっている",
          判断: "全ページの最初の画面内と、ページ末尾に同じボタンを置く",
          理由: "スマホは途中で読むのをやめる。どこで止まっても押せる位置が要る",
        },
        {
          状況: "狙いが「信用を示す」",
          判断: "実績と会社情報を上に、問い合わせは控えめにする",
          理由: "信用目的の訪問者に売り込むと、逆に警戒される",
        },
        {
          状況: "狙いが「採用」",
          判断: "働く人の写真と1日の流れを最優先に置く",
          理由: "応募者が最初に知りたいのは待遇より、誰と働くか",
        },
        {
          状況: "電話が主導線",
          判断: "スマホではタップで発信できる形にし、受付時間を横に書く",
          理由: "時間外にかけて出ないと、その1件は二度と来ない",
        },
      ],
      traps: [
        "トップページに全部載せると、どこも読まれない",
        "ハンバーガーメニューの中だけに主導線を入れると、押されない",
        "「お問い合わせ」というボタン名は、何が起きるか分からず押されにくい",
      ],
      benchmarks: [
        {
          項目: "小規模サイトのページ数",
          値: "5〜8ページ",
          根拠: "トップ・サービス・実績・会社情報・問い合わせが基本形",
        },
        {
          項目: "主導線の数",
          値: "1つ",
          根拠: "2つ以上置くとどちらも押されなくなる",
        },
      ],
      currentPractice: [
        {
          項目: "設計の起点",
          いま: "スマホの縦1列を先に決めてから、PCの横並びを作る",
          確認日,
        },
      ],
      staleAfterDays: 365,
    },
  },

  {
    agentId: "web-estimate",
    agentVersion: "1.0.0",
    name: "工数見積 Agent",
    category: "収益",
    /*
     * 出すのは時間だけ。金額は出さない。
     * 一番の用途は商談ではなく、「受けられるかどうか」の判断。
     * 一人でやる以上、自分の時間が足りるかが先に分からないと受けられない。
     */
    purpose: "決まった仕様から、かかる時間と内訳を出す（金額は出さない）",
    allowedActions: ["工数の算出", "内訳の提示", "前提条件の明示"],
    // 金額を確定できると、誰も止められなくなる
    forbiddenActions: ["金額の確定", "顧客への提示", "根拠なしの数字を出す"],
    allowedDataScopes: ["INTERNAL", "CONFIDENTIAL"],
    sideEffectClass: "READ_ONLY",
    expertise: [
      "作り方（雛形／作り込み）による工数差の見積",
      "動き・チャット・文章作成の追加分の算出",
      "前提が崩れたときの再見積の条件出し",
    ],
    notSuitableFor: ["値付け（原価は出すが、いくらで売るかは人が決める）"],
    requiredInputs: ["作り方", "ページ数", "動きの程度", "文章の担当", "チャットの有無"],
    produces: ["工数レンジ（人日）", "内訳", "この見積が崩れる条件"],
    qualityRisks: ["前提の変更を工数に反映し忘れると、そのまま赤字になる"],
    escalatesWhen: ["工数レンジの上下が2倍以上開いた"],
    timeoutSeconds: 30,
    maxRetries: 1,
    confidenceThreshold: 0.8,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "ベテラン",
      judgment: [
        {
          状況: "文章をこちらで用意する",
          判断: "ページ数ぶんの工数を別立てで積む",
          理由: "制作に含まれていると思われやすいが、実際は工程が1つ増える",
        },
        {
          状況: "動画を主役にしたいと言われた",
          判断: "動画の制作費は含めず、埋め込みだけを見積る",
          理由: "撮影と編集は別の仕事。混ぜると総額が崩れる",
        },
        {
          状況: "「まずは安く」と言われた",
          判断: "雛形をそのまま使う案を、やらないことを明示して出す",
          理由: "値引きで応じると、次も同じ額を基準にされる",
        },
      ],
      traps: [
        "修正回数を決めずに受けると、公開まで直し続けることになる",
        "公開後の更新を見積に入れ忘れると、無償対応が続く",
        "相手の既存サーバーは、触ってみるまで工数が読めない",
      ],
      benchmarks: [
        // 数字は lib/data/web-rates.ts が唯一の出どころ。
        // 見積Agentの計算も同じものを見るので、ここを書き換えると出力が変わる
        { 項目: "土台の作業", 値: baseDaysLabel(), 根拠: "設計・実装・確認までを含む" },
        { 項目: "1ページ追加", 値: `${PER_PAGE_DAYS}人日`, 根拠: "文章が用意されている場合" },
        {
          項目: "文章をこちらで書く",
          値: `1ページあたり ${COPY_PER_PAGE_DAYS}人日`,
          根拠: "取材と事実確認を含む",
        },
        { 項目: "動きを付ける", 値: motionDaysLabel(), 根拠: "表示速度の調整を含む" },
        { 項目: "チャット設置", 値: chatDaysLabel(), 根拠: "AIは答えさせない範囲の設計を含む" },
      ],
      currentPractice: [
        {
          項目: "表示速度の扱い",
          いま: "工数に必ず含める。LCP 2.5秒以下・INP 200ミリ秒以下・CLS 0.1以下が基準",
          確認日,
        },
      ],
      staleAfterDays: 365,
    },
  },

  {
    agentId: "web-measure",
    agentVersion: "1.0.0",
    name: "計測設計 Agent",
    category: "分析",
    purpose: "何をもって成功とするかを決め、公開前に基準値を取る",
    allowedActions: ["計測項目の決定", "基準値の記録", "目標値の算出"],
    forbiddenActions: ["基準値なしで効果を語る", "計測タグの無断設置"],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "READ_ONLY",
    expertise: [
      "してほしい行動から、数えるべきものを決める",
      "公開前の基準値の取り方",
      "見せかけの数字（アクセス数）と成果の切り分け",
    ],
    notSuitableFor: ["広告の運用", "検索順位の保証"],
    requiredInputs: ["してほしい行動", "いまの件数（基準値）"],
    produces: ["計測項目", "どこで数えるか", "公開前の基準値", "3か月後の目標"],
    qualityRisks: ["アクセス数だけ見て、成果が増えていないのに成功と判断する"],
    escalatesWhen: ["基準値が取れていない"],
    timeoutSeconds: 30,
    maxRetries: 1,
    confidenceThreshold: 0.85,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "ベテラン",
      judgment: [
        {
          状況: "公開前",
          判断: "今の問い合わせ件数を必ず数字で押さえる",
          理由: "後から「増えました」と言えなくなる。ここが唯一の比較対象",
        },
        {
          状況: "電話が主導線",
          判断: "サイト経由と分かる番号を用意するか、聞き取りで記録してもらう",
          理由: "電話はそのままでは数えられず、効果が見えないまま終わる",
        },
      ],
      traps: [
        "アクセス数を成果として報告すると、次の提案で数字を出せなくなる",
        "計測を公開後に付けると、公開直後の山を取り逃す",
      ],
      benchmarks: [
        {
          項目: "評価に必要な期間",
          値: "3か月",
          根拠: "月ごとの波があるため、1か月では判断できない",
        },
      ],
      currentPractice: [
        {
          項目: "数えるもの",
          いま: "アクセス数ではなく、してほしい行動が実際に起きた回数を数える",
          確認日,
        },
      ],
      staleAfterDays: 365,
    },
  },

  {
    agentId: "web-preflight",
    agentVersion: "1.0.0",
    name: "公開前チェック Agent",
    category: "管理",
    purpose: "出してよい状態かを判定し、未了のものを挙げる",
    allowedActions: ["公開条件の検査", "未了項目の列挙", "公開可否の判定"],
    // 判定するだけ。公開そのものはさせない
    forbiddenActions: ["公開の実行", "未了項目の握りつぶし"],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "READ_ONLY",
    expertise: [
      "公開して初めて分かる事故の事前検出",
      "問い合わせが届かない構成の検出",
      "作り直し案件でのURL引き継ぎ漏れの検出",
    ],
    notSuitableFor: ["デザインの良し悪し", "文章の校正"],
    requiredInputs: ["置き場所", "ドメイン", "フォームの送信先"],
    produces: ["公開してよいかの判定", "未了項目", "公開後すぐ確認すること"],
    qualityRisks: ["チェック項目に無い事故は検出できない"],
    escalatesWhen: ["公開不可の項目が1件でもある"],
    timeoutSeconds: 30,
    maxRetries: 1,
    confidenceThreshold: 0.95,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "ベテラン",
      judgment: [
        {
          状況: "フォームの送信先が決まっていない",
          判断: "公開しない",
          理由:
            "問い合わせが誰にも届かない状態で公開すると、来た仕事をそのまま失う。しかも気づくのが数週間後になる",
        },
        {
          状況: "作り直し案件",
          判断: "旧サイトのURLと新URLの対応表を作ってから公開する",
          理由: "検索から来ていた人が全員行き止まりになり、前より悪くなる",
        },
        {
          状況: "公開直後",
          判断: "自分のスマホで、実際にフォームを1件送ってみる",
          理由: "設定は正しくても、迷惑メールに入って届かないことがある",
        },
      ],
      traps: [
        "テスト用の文言（ダミーテキスト）が残ったまま公開する",
        "検索避けの設定を外し忘れて、いつまでも検索に出ない",
        "スマホでだけ崩れているのに、PCしか見ずに公開する",
      ],
      benchmarks: [
        {
          項目: "表示速度の合格ライン",
          値: "LCP 2.5秒以下",
          根拠:
            "3秒を超えるとモバイル利用者の約53%が離脱する。2.5秒から3.5秒に落ちるだけで直帰率が32%増える",
        },
      ],
      currentPractice: [
        {
          項目: "確認する端末",
          いま: "スマホの実機で確認する。PCの縮小表示では気づけない崩れがある",
          確認日,
        },
      ],
      staleAfterDays: 365,
    },
  },

  {
    agentId: "web-proposal",
    agentVersion: "1.0.0",
    name: "提案書作成 Agent",
    category: "分析",
    // ここが成果物の出口。これが無いと、ハーネスは記録しか出さない
    purpose: "前のAgentが出したものを組み立てて、顧客に渡す提案書を作る",
    allowedActions: ["提案書の組み立て", "未確定項目の列挙", "顧客に出せるかの判定"],
    forbiddenActions: [
      "分からない欄を推測で埋める",
      "金額を書く",
      "顧客への送付",
      "未確定を隠して「出せる」と判定する",
    ],
    allowedDataScopes: ["INTERNAL", "CONFIDENTIAL"],
    sideEffectClass: "DRAFT_ONLY",
    expertise: [
      "情報設計と工数の結果を、1つの文書に組み立てる",
      "未確定の欄を空けたまま残す",
      "やらないことを必ず載せる",
    ],
    notSuitableFor: [
      "新しい事実を作ること（前の結果を組み立てるだけ）",
      "値付け",
      "デザインそのもの",
    ],
    requiredInputs: ["情報設計の結果", "工数の結果", "設計内容（WebBrief）"],
    produces: ["提案書（Markdown）", "未確定項目の一覧", "顧客に出せるかの判定"],
    qualityRisks: [
      "前の結果が粗いと、そのまま粗い提案書になる（自分では直せない）",
    ],
    escalatesWhen: ["未確定が1件でも残っている"],
    timeoutSeconds: 60,
    maxRetries: 1,
    confidenceThreshold: 0.9,
    owner: "自分",
    maturity: "動く",
    experience: {
      level: "一人前",
      judgment: [
        {
          状況: "決まっていない項目がある",
          判断: "推測で埋めず「未確定」と書き、社内用として出す",
          理由: "埋めた瞬間、相手はそれを合意事項として読む",
        },
        {
          状況: "提案書を作るとき",
          判断: "「やらないこと」を必ず1節置く",
          理由: "書かれていない作業は、後から必ず無償で降ってくる",
        },
        {
          状況: "金額を書きたくなる",
          判断: "作業量と根拠までにする",
          理由: "いくらで売るかは人が決める。ここで決めると誰も止められない",
        },
      ],
      traps: [
        "未確定を空欄のままにすると、見落として顧客に出してしまう",
        "前のAgentが止まっているのに、それらしい提案書を作ってしまう",
      ],
      benchmarks: [
        {
          項目: "提案書に必ず載せる節",
          値: "狙い / ページ構成 / 作業量 / やらないこと / 効果の測り方 / 公開前",
          根拠: "揉める原因は、この6つのどれかが欠けたとき",
        },
      ],
      currentPractice: [
        {
          項目: "金額の扱い",
          いま: "提案書には作業量までを書き、金額は別紙にする",
          確認日: "2026-08-19",
        },
      ],
      staleAfterDays: 365,
    },
  },

  // --- ここから下は中身が無い。判断が要る仕事なので、実際にやるのは秘書 ---

  {
    agentId: "web-copy",
    agentVersion: "0.1.0",
    name: "コピー Agent",
    category: "分析",
    purpose: "見出し・本文・ボタンの文言を作る",
    allowedActions: ["文案の作成", "複数案の提示"],
    forbiddenActions: ["公開", "事実確認をせずに実績を書く", "誇大な表現"],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "DRAFT_ONLY",
    expertise: ["狙いに合わせた見出しの作成", "専門用語の言い換え"],
    notSuitableFor: ["裏取りが要る数字・実績の記載"],
    requiredInputs: ["狙い", "見る人", "してほしい行動", "事実の材料"],
    produces: ["文案（複数）"],
    qualityRisks: ["自信のある口調で、事実でないことを書く"],
    escalatesWhen: ["実績・数字を書く必要がある"],
    timeoutSeconds: 120,
    maxRetries: 1,
    confidenceThreshold: 0.7,
    owner: "自分",
    maturity: "契約だけ",
  },
  {
    agentId: "web-visual",
    agentVersion: "0.1.0",
    name: "ビジュアル設計 Agent",
    category: "分析",
    purpose: "配色・写真・文字の大きさを決める",
    allowedActions: ["配色案の作成", "写真の選定基準の提示"],
    forbiddenActions: ["権利の確認をしていない画像の使用"],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "DRAFT_ONLY",
    expertise: ["読む人に合わせた文字サイズの決定", "配色と可読性"],
    notSuitableFor: ["撮影", "ロゴの制作"],
    requiredInputs: ["見る人", "狙い", "既存のロゴ・色"],
    produces: ["配色", "文字サイズの基準", "写真の要件"],
    qualityRisks: ["作り手の好みが出て、見る人に合わなくなる"],
    escalatesWhen: ["既存のブランド指定がある"],
    timeoutSeconds: 120,
    maxRetries: 1,
    confidenceThreshold: 0.7,
    owner: "自分",
    maturity: "契約だけ",
  },
  {
    agentId: "web-build",
    agentVersion: "0.1.0",
    name: "実装 Agent",
    category: "実行",
    purpose: "決まった構成とデザインを、実際に動くページにする",
    allowedActions: ["コードの作成", "表示速度の調整", "スマホ対応"],
    forbiddenActions: ["本番公開", "顧客のサーバーへの直接反映"],
    allowedDataScopes: ["INTERNAL"],
    sideEffectClass: "DRAFT_ONLY",
    expertise: ["静的サイトの実装", "スマホ優先の実装", "表示速度の確保"],
    notSuitableFor: ["ドメインの購入", "DNSの設定", "相手のサーバーへの納品"],
    requiredInputs: ["ページ構成", "デザイン", "文章", "置き場所"],
    produces: ["動くページ", "更新方法の説明"],
    qualityRisks: ["スマホでの確認を省くと、崩れたまま出る"],
    escalatesWhen: ["相手の既存サーバーに触る必要がある"],
    timeoutSeconds: 600,
    maxRetries: 1,
    confidenceThreshold: 0.8,
    owner: "自分",
    maturity: "契約だけ",
  },
];

/** 受け渡しの順番。誰から受け取り、誰に渡すか。 */
export const WEB_HANDOFF: { from: string; to: string; 渡すもの: string }[] = [
  { from: "web-brief", to: "web-ia", 渡すもの: "狙い・見る人・してほしい行動" },
  { from: "web-ia", to: "web-estimate", 渡すもの: "ページ構成" },
  { from: "web-estimate", to: "web-preflight", 渡すもの: "工数と内訳" },
  { from: "web-preflight", to: "web-measure", 渡すもの: "公開してよい判定" },
  { from: "web-measure", to: "web-proposal", 渡すもの: "計測の設計" },
  { from: "web-proposal", to: "web-visual", 渡すもの: "承諾された範囲" },
  { from: "web-visual", to: "web-copy", 渡すもの: "配色と文字サイズ" },
  { from: "web-copy", to: "web-build", 渡すもの: "文章" },
  { from: "web-build", to: "web-preflight", 渡すもの: "動くページ" },
];
