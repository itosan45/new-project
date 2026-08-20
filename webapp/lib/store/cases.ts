import { getFile, listDir, putFile } from "@/lib/github";
import type {
  ApprovalRequest,
  AuditEvent,
  Run,
  RunStatus,
} from "@/lib/domain/types";

/**
 * 案件の保存先。
 *
 * GitHubリポジトリのファイルをそのまま台帳として使う。DBを立てない理由は、
 * 秘書アプリで同じ仕組みがすでに動いており、鍵も発行済みで、
 * 追加の契約も運用も要らないため。件数が増えたらPostgreSQLへ移す。
 * そのときも画面は触らない（画面はドメイン型しか読んでいない）。
 *
 * 1案件 = 1ファイル。上書きせず、状態遷移のたびに全体を書き直す。
 * 監査ログは別ファイルに追記専用で持つ（消せる監査ログは監査ログではない）。
 */

const CASES_DIR = "cases";

export interface CaseRecord {
  run: Run;
  approvals: ApprovalRequest[];
  audit: AuditEvent[];
}

function casePath(tenantId: string, runId: string): string {
  return `${CASES_DIR}/${tenantId}/${runId}.json`;
}

export async function saveCase(record: CaseRecord): Promise<void> {
  const path = casePath(record.run.tenantId, record.run.runId);
  const existing = await getFile(path);
  const body = JSON.stringify(record, null, 2) + "\n";
  await putFile(
    path,
    body,
    `${record.run.tenantId}: ${record.run.runId} → ${record.run.status}`,
    existing?.sha,
  );
}

export async function loadCase(
  tenantId: string,
  runId: string,
): Promise<CaseRecord | null> {
  const file = await getFile(casePath(tenantId, runId));
  if (!file) return null;
  try {
    return JSON.parse(file.content) as CaseRecord;
  } catch {
    // 壊れたファイルで一覧全体を落とさない
    return null;
  }
}

/** 1社ぶんの案件を新しい順で返す。 */
export async function listCases(tenantId: string): Promise<CaseRecord[]> {
  const entries = await listDir(`${CASES_DIR}/${tenantId}`);
  const files = entries.filter(
    (e) => e.type === "file" && e.name.endsWith(".json"),
  );
  const records = await Promise.all(
    files.map(async (f) => {
      const file = await getFile(f.path);
      if (!file) return null;
      try {
        return JSON.parse(file.content) as CaseRecord;
      } catch {
        return null;
      }
    }),
  );
  return records
    .filter((r): r is CaseRecord => r !== null)
    .sort((a, b) => (a.run.startedAt < b.run.startedAt ? 1 : -1));
}

/** 全社ぶん。運用センターが使う。 */
export async function listAllCases(
  tenantIds: string[],
): Promise<CaseRecord[]> {
  const perTenant = await Promise.all(tenantIds.map(listCases));
  return perTenant
    .flat()
    .sort((a, b) => (a.run.startedAt < b.run.startedAt ? 1 : -1));
}

// ---------------------------------------------------------------------------
// 集計
//
// 画面に出す数字は、必ずここで実際の案件から数える。
// 固定値を置くと、増えても減っても同じ数字が出続けて、誰も信じなくなる。
// ---------------------------------------------------------------------------

/**
 * 案件1件あたりの削減時間（分）。顧客ごとの実測値に置き換える前の暫定。
 * /cases と /admin の両方が使う。片方だけ数字を変えるとズレるので、ここ1箇所にする。
 */
export const MINUTES_PER_CASE = 20;

export interface CaseStats {
  total: number;
  byStatus: Record<RunStatus, number>;
  pendingApprovals: number;
  /** 完了した案件の削減時間の合計（分）。未完了は数えない。 */
  savedMinutes: number;
  /** 削減時間を数えた対象の件数。分母を隠さないため。 */
  savedFromCases: number;
}

const EMPTY_STATUS: Record<RunStatus, number> = {
  QUEUED: 0,
  RUNNING: 0,
  RETRYING: 0,
  RECOVERING: 0,
  VERIFYING: 0,
  SUCCEEDED: 0,
  PARTIAL_SUCCESS: 0,
  BLOCKED: 0,
  FAILED: 0,
  HUMAN_REVIEW: 0,
};

/**
 * 案件から実績を数える。
 *
 * 削減時間は SUCCEEDED のものだけ数える。承認待ちで止まっている案件を
 * 成果に含めると、設計書が目標ゼロに置く「未実行を成功扱い」になる。
 */
export function summarize(
  records: CaseRecord[],
  minutesPerCase: number,
): CaseStats {
  const byStatus = { ...EMPTY_STATUS };
  let pendingApprovals = 0;
  let succeeded = 0;

  for (const r of records) {
    byStatus[r.run.status] += 1;
    pendingApprovals += r.approvals.filter(
      (a) => a.status === "PENDING",
    ).length;
    if (r.run.status === "SUCCEEDED") succeeded += 1;
  }

  return {
    total: records.length,
    byStatus,
    pendingApprovals,
    savedMinutes: succeeded * minutesPerCase,
    savedFromCases: succeeded,
  };
}
