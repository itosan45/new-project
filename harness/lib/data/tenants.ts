import type { TenantProfile } from "@/lib/domain/tenant";

/**
 * 仮想顧客3社。
 *
 * 業種はわざと散らしてある。3社とも承認ゲートを必要とするが、
 * 守っているものが違う（品質 / 責任 / 爆発半径）。
 * この違いが、同じ仕組みを別業種へ横展開できる根拠になる。
 */

/** A社: 手書き書類が詰まりの中心。今作っているOCR案件と同じ形。 */
export const MIKAWA_HOUSE: TenantProfile = {
  tenantId: "mikawa-house",
  name: "三河ハウスサポート",
  industry: "住宅リフォーム・防蟻工事",
  location: "愛知県岡崎市",
  employeeCount: 24,
  annualRevenue: "4.2億円",

  primaryWorkflow: "現場調査票（手書き）→ 見積書への転記",
  bottleneck:
    "調査員が現場で手書きした調査票を、事務所に戻ってExcelの見積テンプレートに転記している。1件あたり約20分。",
  baseline: "転記 20分/件 × 8件/日 × 3名 = 8時間/日",

  existingTools: ["Excel（見積テンプレート）", "LINE WORKS", "弥生会計", "Googleドライブ"],
  firstConnectors: ["Googleドライブ", "Excel/スプレッドシート"],

  people: [
    {
      name: "高木 誠",
      age: 38,
      role: "現場調査員",
      department: "工事部",
      screen: "employee",
      itLiteracy: "低",
      painPoint:
        "調査が終わっても転記のために事務所へ戻らないといけない。直帰できれば1日1時間浮く。",
      concern:
        "スマホで写真を撮るところまではできる。それ以上の操作を覚えるつもりはない。",
      successCriteria: "現場で写真を撮って送るだけで終わること。",
    },
    {
      name: "三河 富雄",
      age: 61,
      role: "代表取締役",
      department: "経営",
      screen: "ceo",
      itLiteracy: "低",
      painPoint:
        "転記が無駄なのは分かっているが、何をどう変えればいいか分からない。",
      concern:
        "見積金額をAIが勝手に決めて出してしまわないか。金額の間違いは即クレームになる。",
      successCriteria: "金額は必ず人が確認してから出ると、目で見て分かること。",
    },
    {
      name: "加藤 舞",
      age: 29,
      role: "総務（実質の情シス）",
      department: "管理部",
      screen: "admin",
      itLiteracy: "高",
      painPoint:
        "調査票のフォーマットが調査員ごとに微妙に違い、転記ミスの問い合わせが自分に集まる。",
      concern: "また自分の仕事が増えるだけの仕組みなら要らない。",
      successCriteria: "自分が毎日触らなくても回ること。",
    },
  ],

  approvalReasons: ["金額変更"],
  dataClassifications: ["INTERNAL", "PERSONAL", "FINANCIAL"],

  requiredAgents: [
    "intake",
    "document-reader",
    "validator",
    "approval",
    "executor",
    "audit",
  ],
  domainPack: "construction",

  approvalGatePurpose:
    "品質の担保。手書きOCRは必ず読み違える。人が最後に見る工程を残すことが、精度の不足を運用で埋める唯一の方法になる。",

  savingsDefinition:
    "自動化前に実測した転記時間（20分/件）× 処理件数。推定値は使わない。",
  expectedMonthlySaving: "約 176時間/月（8時間/日 × 22日）",

  stressTests: [
    "OCRの読み取り結果を人が直す確認画面",
    "スマホからの入力（ITリテラシーが低い利用者）",
    "既存Excelテンプレートの指定セルへの書き込み",
  ],
  failureCost:
    "見積金額の誤りがそのまま顧客へ出る。金額は取り消しがきかないため、承認前に必ず止める。",
};

/** B社: 他社データの混入が廃業に直結する。テナント分離の試験台。 */
export const MIRAI_KAIKEI: TenantProfile = {
  tenantId: "mirai-kaikei",
  name: "みらい会計パートナーズ",
  industry: "税理士法人",
  location: "東京都中野区",
  employeeCount: 14,
  annualRevenue: "2.8億円（顧問先180社）",

  primaryWorkflow: "顧問先から届く領収書・請求書 → 会計ソフトへの入力代行",
  bottleneck:
    "月初10日間に入力が集中する。顧問先1社あたり平均80枚。繁忙期は残業が常態化。",
  baseline: "入力 1.5分/枚 × 80枚 × 180社 = 360時間/月",

  existingTools: ["freee", "マネーフォワード", "Dropbox", "Microsoft 365"],
  firstConnectors: ["Dropbox", "freee"],

  people: [
    {
      name: "白井 亜季",
      age: 26,
      role: "記帳担当",
      department: "業務部",
      screen: "employee",
      itLiteracy: "中",
      painPoint:
        "同じ作業を1日中続ける。集中力が切れた後半にミスが増えるのが自分でも分かる。",
      concern:
        "AIの入力を全部見直すことになるなら、自分で打った方が速い。",
      successCriteria:
        "怪しい箇所だけが色分けされていて、そこだけ見れば済むこと。",
    },
    {
      name: "溝口 健三",
      age: 54,
      role: "代表社員・税理士",
      department: "経営",
      screen: "ceo",
      itLiteracy: "中",
      painPoint:
        "繁忙期の人手不足。しかし品質を落とすと顧問契約を失う。",
      concern:
        "AIが間違えたとき、誰が責任を取るのか。顧問先に説明できない仕組みは使えない。",
      successCriteria:
        "何をどう判断したかの記録が残り、後から顧問先に説明できること。",
    },
    {
      name: "平田 遼",
      age: 33,
      role: "事務長",
      department: "管理部",
      screen: "admin",
      itLiteracy: "高",
      painPoint: "繁忙期だけ人を増やせない。平準化の手段がない。",
      concern:
        "A社の資料がB社のフォルダに入ることが一度でもあれば、その時点で終わり。",
      successCriteria: "顧問先ごとのデータが完全に分かれていると確認できること。",
    },
  ],

  approvalReasons: ["外部送信", "金額変更", "削除"],
  dataClassifications: ["CONFIDENTIAL", "PERSONAL", "FINANCIAL", "SECRET"],

  requiredAgents: [
    "intake",
    "document-reader",
    "validator",
    "qa",
    "approval",
    "audit",
  ],
  domainPack: "accounting",

  approvalGatePurpose:
    "責任の所在。士業は「なぜそう判断したか」を説明する義務がある。承認記録と判断根拠が残らない限り、AIの出力は業務に使えない。",

  savingsDefinition:
    "自動化前に実測した入力時間（1.5分/枚）× 処理枚数 − 確認にかかった時間。確認時間を引かずに削減効果と呼ばない。",
  expectedMonthlySaving: "約 216時間/月（360時間の6割を自動化、確認時間を差し引き後）",

  stressTests: [
    "顧問先ごとのテナント分離（tenant_id の完全性）",
    "監査ログと判断根拠の保存",
    "確信度がしきい値を下回った項目の人間への差し戻し",
  ],
  failureCost:
    "他社データの混入は守秘義務違反。1件で顧問契約の一斉解約と業務停止に至る。他の全機能より優先して守る。",
};

/** C社: 1回の誤送信が数万人に届く。二重実行防止の試験台。 */
export const LUMIERE: TenantProfile = {
  tenantId: "lumiere",
  name: "ルミエール",
  industry: "化粧品D2C（EC）",
  location: "大阪市中央区",
  employeeCount: 52,
  annualRevenue: "11億円",

  primaryWorkflow: "問い合わせメールの分類・一次回答案の作成",
  bottleneck:
    "問い合わせが1日180件。うち7割が「配送状況」「返品方法」など定型。定型対応にCSの時間が食われ、クレーム対応が後回しになる。",
  baseline: "一次対応 6分/件 × 126件（定型分）/日 = 12.6時間/日",

  existingTools: ["Shopify", "Zendesk", "Google Ads", "Slack", "BigQuery"],
  firstConnectors: ["Zendesk", "Shopify"],

  people: [
    {
      name: "森 千夏",
      age: 31,
      role: "CSリーダー",
      department: "カスタマーサクセス",
      screen: "employee",
      itLiteracy: "高",
      painPoint:
        "定型対応に追われて、本当に対応すべきクレームに時間を使えていない。",
      concern:
        "クレームを定型と誤判定して、AIがテンプレ返信を送ったら火に油を注ぐ。",
      successCriteria:
        "定型だけAIが下書きし、少しでも怪しいものは自分に回ってくること。",
    },
    {
      name: "相良 拓真",
      age: 44,
      role: "事業責任者",
      department: "経営",
      screen: "ceo",
      itLiteracy: "高",
      painPoint: "CS人員を増やさずに問い合わせ増に対応したい。",
      concern:
        "一斉配信の事故。宛先間違いや二重送信は、その日のうちにSNSで広がる。",
      successCriteria: "外部送信は必ず自分の承認を通ると保証されていること。",
    },
    {
      name: "木下 陸",
      age: 27,
      role: "マーケティング運用",
      department: "マーケティング部",
      screen: "admin",
      itLiteracy: "高",
      painPoint: "広告レポートの集計に毎週半日取られる。",
      concern: "自動化の効果を数字で説明できないと、来期の予算が取れない。",
      successCriteria: "削減効果が根拠つきでレポートに出せること。",
    },
  ],

  approvalReasons: ["外部送信", "公開", "社外共有"],
  dataClassifications: ["INTERNAL", "PERSONAL", "CONFIDENTIAL"],

  requiredAgents: [
    "intake",
    "classifier",
    "draft-writer",
    "voice-of-customer",
    "data-analyst",
    "qa",
    "approval",
    "executor",
  ],
  domainPack: "ecommerce",

  approvalGatePurpose:
    "爆発半径の抑制。1件の誤送信が数万人に届く。取り消せない操作の前で必ず止めることが、事故の規模を1件に留める唯一の方法になる。",

  savingsDefinition:
    "自動化前に実測した一次対応時間（6分/件）× AIが下書きした件数 × 採用率。下書きが破棄された分は削減に数えない。",
  expectedMonthlySaving: "約 198時間/月（12.6時間/日 × 22日 × 採用率71%）",

  stressTests: [
    "idempotency key による二重送信の防止",
    "Executor の実行前ポリシー判定",
    "QA Agent による件数・宛先の突合",
  ],
  failureCost:
    "一斉配信の誤りは取り消せない。数万人に届いた後では、謝罪しか手段がない。",
};

export const TENANTS: TenantProfile[] = [MIKAWA_HOUSE, MIRAI_KAIKEI, LUMIERE];

export function findTenant(tenantId: string): TenantProfile | undefined {
  return TENANTS.find((t) => t.tenantId === tenantId);
}
