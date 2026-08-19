import { ADMIN_NAV } from "@/components/admin-nav";
import { CaseDesk } from "@/components/case-desk";
import { LogoutButton } from "@/components/logout-button";
import { Shell, UserChip } from "@/components/shell";
import { Card, Icon, IconTile, Metric } from "@/components/ui";
import { TENANTS } from "@/lib/data/tenants";
import { listAllCases, summarize, type CaseRecord } from "@/lib/store/cases";

export const metadata = { title: "案件" };
export const dynamic = "force-dynamic";

/** 案件1件あたりの削減時間（分）。顧客ごとの実測値に置き換える前の暫定。 */
const MINUTES_PER_CASE = 20;

export default async function CasesPage() {
  let cases: CaseRecord[] = [];
  let loadError: string | null = null;

  try {
    cases = await listAllCases(TENANTS.map((t) => t.tenantId));
  } catch (e) {
    // 鍵が未設定でも画面は出す。何が足りないかを画面で言う
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  const stats = summarize(cases, MINUTES_PER_CASE);

  return (
    <Shell
      nav={ADMIN_NAV}
      activeHref="/cases"
      brand={
        <div className="text-nav-text-active">
          <div className="flex items-center gap-2">
            <Icon name="robot" className="size-4" />
            <span className="text-[13px] font-semibold">業務自動化ハーネス</span>
          </div>
          <p className="mt-0.5 pl-6 text-[10px] text-nav-text">
            コントロールセンター
          </p>
        </div>
      }
    >
      <div className="flex items-center justify-end gap-3 border-b border-line bg-surface px-4 py-3 sm:px-7">
        <UserChip name="Admin User" sub="システム管理者" dark={false} />
        <LogoutButton />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-7 sm:py-5">
        <div>
          <h1 className="text-lg font-bold text-ink">案件</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            仮想顧客の案件を受け付け、Agentが処理し、承認を経て記録として積み上がります。
          </p>
        </div>

        {loadError && (
          <Card className="border-warn/40 bg-warn-soft/30">
            <div className="flex items-start gap-3">
              <IconTile name="alert" tone="warn" />
              <div>
                <p className="text-xs font-medium text-ink">
                  案件の保存先に接続できていません
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  環境変数（GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN）が
                  設定されているか確認してください。
                </p>
                <p className="mt-1 font-mono text-[10px] text-ink-subtle">
                  {loadError}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 実績。固定値ではなく、実際に積み上がった案件から数えている */}
        <Card>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <Metric
              label="受け付けた案件"
              value={String(stats.total)}
              unit="件"
              basis="cases/ 配下に保存されている案件の総数"
            />
            <Metric
              label="完了"
              value={String(stats.byStatus.SUCCEEDED)}
              unit="件"
              basis="承認を経て全工程が完了した案件"
            />
            <Metric
              label="承認待ち"
              value={String(stats.pendingApprovals)}
              unit="件"
              basis="PENDING 状態の承認要求"
            />
            <Metric
              label="削減時間"
              value={(stats.savedMinutes / 60).toFixed(1)}
              unit="時間"
              delta={`完了${stats.savedFromCases}件 × ${MINUTES_PER_CASE}分`}
              direction="up"
              basis="完了した案件のみを数える。承認待ちは含めない"
            />
          </div>
        </Card>

        <CaseDesk tenants={TENANTS} cases={cases} />
      </div>
    </Shell>
  );
}
