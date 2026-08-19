import type {
  ApprovalReason,
  DataClassification,
  TenantId,
} from "@/lib/domain/types";

/**
 * 仮想顧客（テナント）の輪郭。
 *
 * 「どの会社でも一定範囲の業務自動化に対応できる」を目指すと、何も決まらない。
 * 具体的な会社を3社置いて、そこから逆算する。
 *
 * ここが決まると、コネクタの優先順位・承認理由の種類・効果測定の定義が
 * 自動的に決まる。逆に、ここが決まらないうちは決めようがない。
 */

/** その会社で実際に画面を触る人。役割ではなく個人として定義する。 */
export interface Persona {
  name: string;
  age: number;
  role: string;
  /** 画面上の表示部署 */
  department: string;
  /** どの画面に入るか */
  screen: "employee" | "ceo" | "admin";
  /** ITへの慣れ。ここを読み違えると、使われない画面ができる。 */
  itLiteracy: "低" | "中" | "高";
  /** この人が本当に困っていること */
  painPoint: string;
  /** この人がAIに対して抱く警戒。ここに答えられないと導入されない。 */
  concern: string;
  /** この人にとっての「使えた」の基準 */
  successCriteria: string;
}

export interface TenantProfile {
  tenantId: TenantId;
  name: string;
  industry: string;
  location: string;
  employeeCount: number;
  annualRevenue: string;

  /** 最初に自動化する1業務。ここを広げないことが導入成功の条件。 */
  primaryWorkflow: string;
  /** 現状の詰まり。数字で言えないものは自動化候補にしない。 */
  bottleneck: string;
  /** 現状かかっている時間。効果測定の基準値になる。 */
  baseline: string;

  /** すでに使っている道具。ここに繋がらないと机上の空論になる。 */
  existingTools: string[];
  /** 最初に作るべきコネクタ。existingTools から決まる。 */
  firstConnectors: string[];

  people: Persona[];

  /** この会社で実際に発生する承認理由。全種類を実装しない判断材料。 */
  approvalReasons: ApprovalReason[];
  /** 日常的に扱うデータ分類。ここが重いほど権限設計が要る。 */
  dataClassifications: DataClassification[];

  /**
   * この会社にとって承認ゲートが果たす役割。
   * 同じ仕組みでも、業種によって守っているものが違う。
   */
  approvalGatePurpose: string;

  /** 効果測定の定義。推定値でなく実測に紐づける。 */
  savingsDefinition: string;
  /** 想定される月次の削減 */
  expectedMonthlySaving: string;

  /** この顧客がハーネスのどこを試すか。3社で重ならないように選ぶ。 */
  stressTests: string[];
  /** 失敗したときに何が起きるか。設計の優先順位はここで決まる。 */
  failureCost: string;
}
