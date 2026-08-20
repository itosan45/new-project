/**
 * 業務自動化ハーネス — ドメイン型
 *
 * 設計コンテキストの「11. 重要な設計ルール」「17. Workflow / Agent実行契約」に
 * 対応する。画面はすべてここで定義した型だけを読む。UIに都合のよい形の
 * データを別に作らないこと。作った瞬間に、画面と実体がずれ始める。
 */

// ---------------------------------------------------------------------------
// 全データ共通のメタデータ（設計書 5. 必須メタデータ）
// ---------------------------------------------------------------------------

/** 会社の識別子。これを持たないデータは存在してはいけない。 */
export type TenantId = string;

export type DataClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "PERSONAL"
  | "FINANCIAL"
  | "SECRET";

export interface TenantScoped {
  tenantId: TenantId;
  workspaceId: string;
}

// ---------------------------------------------------------------------------
// 実行の状態（設計書 14. 状態モデル）
// ---------------------------------------------------------------------------

export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "RETRYING"
  | "RECOVERING"
  | "VERIFYING"
  | "SUCCEEDED"
  | "PARTIAL_SUCCESS"
  | "BLOCKED"
  | "FAILED"
  | "HUMAN_REVIEW";

/**
 * 「成功」「部分成功」「未実行」を混ぜないための表示区分。
 * 設計書が目標ゼロに置いている「未実行を成功扱いした件数」は、
 * ここを曖昧にした瞬間に発生する。
 */
export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  QUEUED: "待機中",
  RUNNING: "実行中",
  RETRYING: "再試行中",
  RECOVERING: "復旧中",
  VERIFYING: "検証中",
  SUCCEEDED: "成功",
  PARTIAL_SUCCESS: "部分成功",
  BLOCKED: "未実行",
  FAILED: "失敗",
  HUMAN_REVIEW: "要確認",
};

export type StepStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "WAITING_APPROVAL"
  | "SKIPPED"
  | "FAILED"
  /** 入力が揃っていないので実行していない。推測で埋めるくらいなら止める。 */
  | "NEEDS_INPUT"
  /** Agentの中身がまだ無い。契約だけの状態。 */
  | "NOT_IMPLEMENTED"
  /** 処理はできたが、人が見ないと次へ渡せない。完了ではない。 */
  | "NEEDS_REVIEW";

export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  PENDING: "待機中",
  RUNNING: "実行中",
  COMPLETED: "完了",
  WAITING_APPROVAL: "承認待ち",
  SKIPPED: "スキップ",
  FAILED: "失敗",
  NEEDS_INPUT: "入力待ち",
  NOT_IMPLEMENTED: "中身なし",
  NEEDS_REVIEW: "要確認",
};

// ---------------------------------------------------------------------------
// Agent（設計書 17. Agent契約）
// ---------------------------------------------------------------------------

/** 副作用の重さ。再実行してよいかがこれで決まる。 */
export type SideEffectClass =
  | "READ_ONLY"
  | "DRAFT_ONLY"
  | "REVERSIBLE"
  | "SIDE_EFFECT"
  | "IRREVERSIBLE";

export const SIDE_EFFECT_LABEL: Record<SideEffectClass, string> = {
  READ_ONLY: "読み取りのみ",
  DRAFT_ONLY: "下書きのみ",
  REVERSIBLE: "取り消し可能",
  SIDE_EFFECT: "外部に影響あり",
  IRREVERSIBLE: "取り消し不可",
};

export type AgentCategory = "調査" | "分析" | "実行" | "管理" | "収益";

export type AgentHealth = "正常" | "注意" | "異常";

/** 実装の段階。設計だけのものを稼働中と混ぜない。 */
/**
 * Agentがどこまで本物か。
 *
 * 「実装済み」という言葉は使わない。契約（何をしてよいか）を書いただけの
 * ものを実装済みと呼ぶと、動くと思って仕事を受けてしまう。
 *
 * 「動く」を名乗れるのは、レジストリ（lib/agents/registry.ts）に
 * 実体があるものだけ。テストで固定してあるので、ラベルだけ書き換えても通らない。
 */
export type AgentMaturity =
  /** エンジンから呼ばれて実際に処理する。レジストリに実体がある */
  | "動く"
  /** 実際に動くコードが別にあるが、まだ繋いでいない */
  | "中身あり・未接続"
  /** 権限と守備範囲は決まっているが、中身の処理は無い */
  | "契約だけ"
  /** 要るかどうかも決まっていない */
  | "検討中";

/**
 * Agentの経験。
 *
 * 「ベテラン」を経歴文で書いても飾りにしかならない。
 * 実際にベテランと素人を分けているのは次の4つなので、それを持たせる。
 *
 * ここを書き換えると Agent の出力が変わる、という状態にしてある。
 * 参照されない経歴は、ただの飾り。
 */
export interface AgentExperience {
  level: "見習い" | "一人前" | "ベテラン";

  /** 初心者が持っていない判断基準。「こういう時はこうする」 */
  judgment: { 状況: string; 判断: string; 理由: string }[];

  /** 経験者だけが知っている地雷 */
  traps: string[];

  /** 相場観。見積と提案の裏付けになる数字 */
  benchmarks: { 項目: string; 値: string; 根拠: string }[];

  /**
   * いまの標準。
   *
   * 必ず確認日を持たせる。日付の無いトレンド情報は、
   * 去年の常識で提案する原因になる。
   */
  currentPractice: { 項目: string; いま: string; 確認日: string }[];

  /** この知識が古くなる目安（日数）。過ぎたら画面で要確認と出す。 */
  staleAfterDays: number;
}

/** 経験が古くなっていないか。トレンドは黙って腐るので、腐ったことが分かるようにする。 */
export function isStale(
  exp: AgentExperience,
  today: Date = new Date(),
): boolean {
  const dates = exp.currentPractice
    .map((p) => Date.parse(p.確認日))
    .filter((n) => !Number.isNaN(n));
  if (dates.length === 0) return true;
  const newest = Math.max(...dates);
  const days = (today.getTime() - newest) / 86_400_000;
  return days > exp.staleAfterDays;
}

export interface AgentContract {
  agentId: string;
  agentVersion: string;
  name: string;
  category: AgentCategory;
  purpose: string;

  // --- 権限（何をしてよいか） ---
  allowedActions: string[];
  /** 明示的に禁止する操作。allowedActions の裏返しではなく、別に書く。 */
  forbiddenActions: string[];
  allowedDataScopes: DataClassification[];
  sideEffectClass: SideEffectClass;

  // --- 専門性（何ができるか） ---
  /**
   * 具体的に何が得意か。「分析する」のような曖昧な記述は書かない。
   * ここが曖昧なAgentは、依頼が集中して結局どれも中途半端になる。
   */
  expertise: string[];
  /**
   * 使ってはいけない場面。
   *
   * expertise より重要。できることの一覧だけ書くと、
   * 「たぶんできるだろう」で守備範囲外の仕事が回ってきて事故る。
   */
  notSuitableFor: string[];
  /** 動作に必要な入力。これが揃わないなら起動させない。 */
  requiredInputs: string[];
  /** 出力するもの */
  produces: string[];
  /** 既知の弱点。隠さず書く。運用の回避策はここから決まる。 */
  qualityRisks: string[];
  /** 人間に引き渡す条件。確信度以外のトリガー。 */
  escalatesWhen: string[];

  // --- 運用 ---
  timeoutSeconds: number;
  maxRetries: number;
  /** これを下回る確信度なら人間に回す。 */
  confidenceThreshold: number;
  /**
   * このAgentの出力に責任を持つ人。
   *
   * 人間は自分1人しかいないので、実際は全部「自分」になる。
   * それでも項目として残してあるのは、他社に売るときに
   * 別の人が入る場所だから。いま架空の担当者名を置くと、
   * 誰かがやってくれるように見えてしまう。
   */
  owner: string;
  maturity: AgentMaturity;

  /**
   * この分野での経験。
   *
   * 判断を伴う仕事をするAgentには必須。持たないAgentは、
   * 決まった手順を流すだけのものに限る。
   */
  experience?: AgentExperience;
}

/**
 * ドメインパック（分野別の専門知識）。
 *
 * 業種ごとにAgentを作り分けると、業種 × Agent の数だけ実装が要る。
 * 設計書の「共通の実行エンジン + 会社別設定」に従い、
 * Agentは共通のまま、分野知識を差し込む形にする。
 *
 *     専門性 = 共通Agent × ドメインパック
 *
 * 建設向けのData Analystと、EC向けのData Analystは同じ実装で、
 * 読み込むパックが違うだけ。ここを分けた瞬間に横展開できなくなる。
 */
/**
 * 何を、どうやって取り出すか。
 *
 * 「共通Agent × ドメインパック」を実際に動かしているのがここ。
 * Document Reader の実装は業種を知らない。何を探すかはパックが持つ。
 * 新しい業種が来たら、足すのはパック1つで、Agentは触らない。
 *
 * 元は ocr-excel/設定.yaml の「種類」と「手がかり」。同じ考え方で揃えてある。
 */
export type ExtractionKind =
  | "日付"
  | "金額"
  | "電話番号"
  | "キーワード"
  | "ファイル名"
  | "全文"
  /**
   * あらかじめ決めた区分の中から、手がかりの言葉で1つを選ぶ。
   * 「感情の強さ」「緊急度」のような連続値をここに含めないこと。
   * 根拠のない実数（0.73 など）を作る原因になる。区分に振り分ける
   * ところまでを機械の仕事にする。
   */
  | "区分";

export interface ExtractionField {
  field: string;
  hint: string;
  required: boolean;
  /** どう探すか。無い項目はまだ自動で取れない */
  kind?: ExtractionKind;
  /** kind が「キーワード」のとき、この言葉の右か次の行を拾う */
  clues?: string[];
  /** kind が「区分」のとき、選べる区分と、それぞれの手がかり */
  categories?: { label: string; clues: string[] }[];
  /** kind が「区分」のとき、どの区分にも当たらなかった場合の既定値。無指定なら空欄のまま */
  fallback?: string;
}

export interface DomainPack {
  packId: string;
  name: string;
  /** この分野の業種 */
  industries: string[];
  /** このパックを差し込むAgent */
  appliesTo: string[];
  /** 分野固有の語彙。OCRと分類の精度はここで決まる。 */
  vocabulary: { term: string; meaning: string }[];
  /** 抽出すべき項目と、その手がかり */
  extractionFields: ExtractionField[];
  /** この分野での検証ルール */
  validationRules: string[];
  /** この分野で必ず人間に回すもの。業界の慣習や法令に由来する。 */
  alwaysEscalate: string[];
}

export interface AgentRuntimeState {
  agentId: string;
  health: AgentHealth;
  /** 稼働中か。停止していても契約は残る。 */
  active: boolean;
  processedToday: number;
  successRate: number;
  lastRunAt: string;
  assignee: string;
}

// ---------------------------------------------------------------------------
// Run（1件の処理）
// ---------------------------------------------------------------------------

export interface RunStep {
  stepId: string;
  agentId: string;
  status: StepStatus;
  startedAt?: string;
  completedAt?: string;
  summary: string;
  /** 進捗を出せる処理だけが持つ。持たない処理で 0% と出さないこと。 */
  progress?: { done: number; total: number; label: string };
  handoffTo?: string;
  /** 開始条件。待機中のステップが「何を待っているか」を画面に出すため。 */
  waitingFor?: string;
}

export interface Evidence {
  label: string;
  detail: string;
}

export interface Decision {
  agentId: string;
  conclusion: string;
  evidence: Evidence[];
  /** 0〜1。設計書の confidence_threshold と突き合わせる。 */
  confidence: number;
  nextAction: string;
  decidedAt: string;
}

export interface ContextSource {
  sourceId: string;
  name: string;
  kind: "csv" | "pdf" | "database" | "spreadsheet" | "mail";
  access: "読取" | "書込" | "不可";
  updatedAt: string;
  classification: DataClassification;
}

export interface Run extends TenantScoped {
  runId: string;
  /** 同じ入力での二重実行を防ぐ鍵。設計書 17. の必須条件。 */
  idempotencyKey: string;
  workflowId: string;
  /** 開始時点で固定する。途中で最新版に差し替えない。 */
  workflowVersion: string;
  title: string;
  status: RunStatus;
  startedAt: string;
  expectedEndAt?: string;
  trigger: "手動実行" | "スケジュール" | "イベント";
  priority: "最優先" | "高" | "通常" | "低";
  requestedBy: string;
  description: string;
  steps: RunStep[];
  decisions: Decision[];
  contextSources: ContextSource[];
  /** 現在の入力条件。画面ではチップで出す。 */
  contextChips: { label: string; value: string }[];
}

// ---------------------------------------------------------------------------
// 承認（設計書 16. 権限・承認ポリシー）
// ---------------------------------------------------------------------------

export type ApprovalReason =
  | "外部送信"
  | "金額変更"
  | "社外共有"
  | "削除"
  | "契約"
  | "公開";

export interface ApprovalRequest extends TenantScoped {
  approvalId: string;
  runId?: string;
  title: string;
  /** なぜ人間の承認が要るのか。ここが空の承認は作らせない。 */
  reason: ApprovalReason;
  requestedBy: string;
  requestedAt: string;
  agentId?: string;
  priority: "高優先度" | "通常";
  classification: DataClassification;
  detail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  /** 承認後にこれらが変わったら、承認を無効にして取り直す。 */
  approvalScopeHash: string;
}

// ---------------------------------------------------------------------------
// 成果物（設計書 15. Agent作業データ・ログ・成果物の保存設計）
// ---------------------------------------------------------------------------

export type ArtifactStatus =
  | "CREATED"
  | "VALIDATING"
  | "DRAFT"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "EXPORTED"
  | "ARCHIVED"
  | "INVALID"
  | "QUARANTINED"
  | "SUPERSEDED";

export type ArtifactZone =
  | "00_input"
  | "10_raw"
  | "20_working"
  | "30_evidence"
  | "40_output"
  | "50_review"
  | "60_export"
  | "90_quarantine";

export interface Artifact extends TenantScoped {
  artifactId: string;
  runId: string;
  agentId: string;
  name: string;
  artifactType: string;
  zone: ArtifactZone;
  version: number;
  status: ArtifactStatus;
  /** ファイル名でなく ID で系譜をつなぐ。「この数字はどこから来たか」に答えるため。 */
  sourceArtifactIds: string[];
  contentHash: string;
  createdAt: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// 監査ログ（設計書 15. ログの分離）
// ---------------------------------------------------------------------------

export type AuditLogKind =
  | "Execution"
  | "Agent"
  | "Decision"
  | "DataAccess"
  | "Artifact"
  | "ErrorRecovery"
  | "HumanAction";

export interface AuditEvent extends TenantScoped {
  eventId: string;
  kind: AuditLogKind;
  runId?: string;
  agentId?: string;
  timestamp: string;
  /** 人か Agent か。ここを混ぜると責任の所在が消える。 */
  actor: string;
  actorType: "human" | "agent" | "system";
  action: string;
  /**
   * 「未実行」を独立させてある。
   * 成功でも失敗でもない。やっていない、が正確な記録。
   */
  status: "成功" | "失敗" | "承認待ち" | "停止" | "未実行";
  detail?: string;
}

// ---------------------------------------------------------------------------
// 社員向け（設計書 8. お仕事コックピット）
// ---------------------------------------------------------------------------

export interface EmployeeTask {
  taskId: string;
  order: number;
  title: string;
  dueLabel: string;
  dueUrgent: boolean;
  status: "未対応" | "進行中" | "承認待ち";
  description: string;
  actionLabel: string;
  icon: "mail" | "chart" | "doc";
}

export interface AutomatedWork {
  workId: string;
  title: string;
  completedAt: string;
  /** 削減できた分数。根拠を持たない推定値をここに入れないこと。 */
  savedMinutes: number;
  icon: "mail" | "doc" | "people" | "cloud";
}

export interface AssistantMessage {
  role: "user" | "assistant";
  time: string;
  text: string;
  bullets?: string[];
  /** 出典。これが付けられない回答は画面に出さない。 */
  sources?: { name: string; kind: "spreadsheet" | "database" | "doc" }[];
}

// ---------------------------------------------------------------------------
// CEO向け（設計書 9. CEOアシスタント）
// ---------------------------------------------------------------------------

export interface Instruction extends TenantScoped {
  instructionId: string;
  title: string;
  assignee: string;
  priority: "最優先" | "高" | "中" | "通常";
  dueLabel: string;
  progress: number;
  subStatus: string;
  status: "進行中" | "完了";
}

export interface SecretaryActivity {
  time: string;
  actor: string;
  actorType: "human" | "agent" | "system";
  action: string;
  status: "進行中" | "完了" | "承認待ち";
}

// ---------------------------------------------------------------------------
// 効果測定
// ---------------------------------------------------------------------------

/**
 * 削減効果。
 *
 * basis を必ず持たせている。設計書に算出方法の定義がなく、推定値のまま
 * ROI 提案に使うと商談で崩れるため、根拠を型として強制する。
 */
export interface SavingMetric {
  label: string;
  value: string;
  unit: string;
  deltaLabel?: string;
  deltaDirection?: "up" | "down" | "flat";
  basis: string;
}
