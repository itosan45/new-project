import type {
  ApprovalRequest,
  AssistantMessage,
  AutomatedWork,
  EmployeeTask,
  Instruction,
  SavingMetric,
  SecretaryActivity,
} from "@/lib/domain/types";

const TENANT = { tenantId: "demo-company", workspaceId: "sales-ops" };

// ---------------------------------------------------------------------------
// 社員向け（お仕事コックピット）
// ---------------------------------------------------------------------------

export const CURRENT_EMPLOYEE = {
  name: "田中 太郎",
  displayName: "田中",
  department: "営業企画",
};

export const EMPLOYEE_TASKS: EmployeeTask[] = [
  {
    taskId: "t1",
    order: 1,
    title: "見積依頼メールを確認",
    dueLabel: "今日 10:00",
    dueUrgent: true,
    status: "未対応",
    description:
      "A社からの見積依頼メールが届いています。内容を確認してください。",
    actionLabel: "メールを開く",
    icon: "mail",
  },
  {
    taskId: "t2",
    order: 2,
    title: "先週の商談データを整理",
    dueLabel: "今日 15:00",
    dueUrgent: true,
    status: "進行中",
    description:
      "先週の商談データを自動収集しました。内容を確認し、レポートを更新してください。",
    actionLabel: "データを確認する",
    icon: "chart",
  },
  {
    taskId: "t3",
    order: 3,
    title: "マーケティング調査レポートを承認",
    dueLabel: "明日 11:00",
    dueUrgent: false,
    status: "承認待ち",
    description:
      "AIが生成したマーケティング調査レポートの内容を確認し、承認をお願いします。",
    actionLabel: "レポートを確認する",
    icon: "doc",
  },
];

export const AUTOMATED_WORK: AutomatedWork[] = [
  {
    workId: "w1",
    title: "顧客からの問い合わせメールを分類・振り分け",
    completedAt: "今日 08:15",
    savedMinutes: 25,
    icon: "mail",
  },
  {
    workId: "w2",
    title: "週次の売上レポートを自動作成",
    completedAt: "今日 07:45",
    savedMinutes: 40,
    icon: "doc",
  },
  {
    workId: "w3",
    title: "商談議事録を要約・CRMに更新",
    completedAt: "昨日 17:30",
    savedMinutes: 35,
    icon: "people",
  },
  {
    workId: "w4",
    title: "競合ニュースを収集・要約",
    completedAt: "昨日 09:20",
    savedMinutes: 20,
    icon: "cloud",
  },
];

export const ASSISTANT_THREAD: AssistantMessage[] = [
  {
    role: "user",
    time: "09:16",
    text: "今週の失注理由をまとめて",
  },
  {
    role: "assistant",
    time: "09:16",
    text: "今週の失注理由の要約です。\n（5/12〜5/16）",
    bullets: [
      "価格が高い: 42%（5件）",
      "導入時期の不一致: 25%（3件）",
      "競合製品の選定: 17%（2件）",
      "機能要件の不一致: 8%（1件）",
      "その他: 8%（1件）",
    ],
    sources: [
      { name: "失注分析レポート_5月第2週", kind: "spreadsheet" },
      { name: "CRM_失注データ", kind: "database" },
    ],
  },
];

export const EMPLOYEE_APPROVALS: ApprovalRequest[] = [
  {
    ...TENANT,
    approvalId: "ap1",
    title: "マーケティング調査レポート（新規市場調査）",
    reason: "公開",
    requestedBy: "佐藤 花子",
    requestedAt: "今日 09:30",
    priority: "高優先度",
    classification: "INTERNAL",
    detail: "AIが生成した新規市場調査レポート。社内公開前の確認が必要です。",
    status: "PENDING",
    approvalScopeHash: "h-ap1-v1",
  },
  {
    ...TENANT,
    approvalId: "ap2",
    title: "広告出稿計画（6月分）",
    reason: "金額変更",
    requestedBy: "鈴木 一郎",
    requestedAt: "昨日 16:45",
    priority: "通常",
    classification: "FINANCIAL",
    detail: "6月分の広告出稿計画。予算配分の変更を含みます。",
    status: "PENDING",
    approvalScopeHash: "h-ap2-v1",
  },
];

/**
 * 削減効果。
 * basis に算出根拠を必ず書く。ここが「推定」のままだと商談で崩れる。
 */
export const EMPLOYEE_SAVINGS: SavingMetric[] = [
  {
    label: "削減",
    value: "4.5",
    unit: "時間",
    deltaLabel: "手作業の時間を削減",
    basis: "自動処理した各作業の、自動化前の実測平均処理時間の合計",
  },
  {
    label: "処理",
    value: "18",
    unit: "件",
    deltaLabel: "自動で処理した件数",
    basis: "今週 SUCCEEDED で完了した Run の件数",
  },
  {
    label: "確認済み",
    value: "96",
    unit: "%",
    deltaLabel: "確認・レビュー完了率",
    basis: "人間の確認を要した件数のうち、期限内に確認された割合",
  },
];

export const WEEKLY_AUTOMATION_SUMMARY = "今週これまでに 1.8時間の作業を自動化しました";

// ---------------------------------------------------------------------------
// CEO向け
// ---------------------------------------------------------------------------

export const CEO_SAMPLE_INSTRUCTION =
  "今週の重要な会議を整理し、優先順位と事前準備をまとめてください。\n社外秘資料は私の承認なしに共有しないでください。";

export const CEO_INSTRUCTIONS: Instruction[] = [
  {
    ...TENANT,
    instructionId: "i1",
    title: "役員会議の準備",
    assignee: "CEO秘書",
    priority: "最優先",
    dueLabel: "今日 17:00",
    progress: 70,
    subStatus: "会議アジェンダ整理中",
    status: "進行中",
  },
  {
    ...TENANT,
    instructionId: "i2",
    title: "重要顧客への返信案",
    assignee: "AI秘書",
    priority: "高",
    dueLabel: "今日 15:00",
    progress: 40,
    subStatus: "返信案を作成中（3案作成済み）",
    status: "進行中",
  },
  {
    ...TENANT,
    instructionId: "i3",
    title: "出張スケジュール調整",
    assignee: "CEO秘書",
    priority: "中",
    dueLabel: "明日 10:00",
    progress: 100,
    subStatus: "航空券・宿泊の候補を提示済み",
    status: "完了",
  },
];

export const SECRETARY_ACTIVITY: SecretaryActivity[] = [
  {
    time: "10:32",
    actor: "AI秘書",
    actorType: "agent",
    action: "会議情報を収集中｜関連資料を検索・要約しています",
    status: "進行中",
  },
  {
    time: "10:18",
    actor: "CEO秘書",
    actorType: "human",
    action: "アジェンダ案を作成中｜会議の目的と議題案を作成しました",
    status: "進行中",
  },
  {
    time: "10:05",
    actor: "AI秘書",
    actorType: "agent",
    action: "リスク事項を抽出｜過去の議事録からリスクを抽出しました",
    status: "完了",
  },
  {
    time: "09:50",
    actor: "CEO秘書",
    actorType: "human",
    action: "準備資料を収集｜社内資料を収集し、要点を整理しました",
    status: "完了",
  },
  {
    time: "09:35",
    actor: "承認ゲート",
    actorType: "system",
    action: "社内秘資料の共有｜社外共有にはCEOの承認が必要です",
    status: "承認待ち",
  },
];

export const CEO_APPROVALS: ApprovalRequest[] = [
  {
    ...TENANT,
    approvalId: "cap1",
    title: "社外送信前のメール",
    reason: "外部送信",
    requestedBy: "AI秘書",
    requestedAt: "10:24",
    priority: "高優先度",
    classification: "CONFIDENTIAL",
    detail: "送信先：株式会社ABC 担当役員",
    status: "PENDING",
    approvalScopeHash: "h-cap1-v1",
  },
  {
    ...TENANT,
    approvalId: "cap2",
    title: "会食候補の最終確認",
    reason: "社外共有",
    requestedBy: "CEO秘書",
    requestedAt: "10:11",
    priority: "通常",
    classification: "INTERNAL",
    detail: "候補日：5/28（水）19:00〜",
    status: "PENDING",
    approvalScopeHash: "h-cap2-v1",
  },
  {
    ...TENANT,
    approvalId: "cap3",
    title: "機密資料の共有範囲",
    reason: "社外共有",
    requestedBy: "AI秘書",
    requestedAt: "09:58",
    priority: "高優先度",
    classification: "SECRET",
    detail: "資料名：新規事業計画（案）",
    status: "PENDING",
    approvalScopeHash: "h-cap3-v1",
  },
];

export const CEO_METRICS: SavingMetric[] = [
  {
    label: "未処理",
    value: "6",
    unit: "件",
    deltaLabel: "前日比 -2件",
    deltaDirection: "down",
    basis: "CEO確認待ちのまま残っている指示・承認の件数",
  },
  {
    label: "今日の削減時間",
    value: "2.8",
    unit: "時間",
    deltaLabel: "前日比 +0.6時間",
    deltaDirection: "up",
    basis: "秘書業務の自動化前実測時間との差分の合計",
  },
  {
    label: "承認待ち",
    value: "3",
    unit: "件",
    deltaLabel: "前日比 ±0件",
    deltaDirection: "flat",
    basis: "PENDING 状態の承認要求の件数",
  },
  {
    label: "機密操作",
    value: "0",
    unit: "件",
    deltaLabel: "前日比 ±0件",
    deltaDirection: "flat",
    basis: "SECRET 分類データに対して実行された操作の件数",
  },
];
