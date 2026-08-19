import Link from "next/link";
import { RequestDesk } from "@/components/request-desk";
import { Card, Icon, IconTile } from "@/components/ui";
import { listWebRequests } from "@/lib/store/web-requests";
import { webAgentOrder } from "@/lib/engine/web-pipeline";
import { agentName } from "@/lib/data/agents";
import type { WebRequest } from "@/lib/domain/web-request";

export const metadata = { title: "依頼を出す" };
export const dynamic = "force-dynamic";

export default async function RequestPage() {
  let past: WebRequest[] = [];
  let loadError: string | null = null;
  try {
    past = await listWebRequests();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  const order = webAgentOrder();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 仕事場へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">依頼を出す</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          仕事の話が来たら、まずここに入れてください。
          <span className="font-medium text-ink">
            ここから出すとAgentが動きます。
          </span>
          口頭で秘書に頼むと、秘書が全部やってしまってAgentが1体も動きません
          （実際にそうなっていたので、この口を作りました）。
        </p>
      </header>

      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <IconTile name="flow" tone="info" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">
              この順番で {order.length}体が動きます
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-ink-muted">
              {order.map((id, i) => (
                <span key={id} className="flex items-center gap-1.5">
                  <span className="text-ink">{agentName(id)}</span>
                  {i < order.length - 1 && (
                    <span className="text-ink-subtle">→</span>
                  )}
                </span>
              ))}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              途中で止まっても、後ろのAgentも動かします。
              足りないものを<b className="text-ink">まとめて</b>知りたいので。
              1件ずつ聞きに行くと、打ち合わせが何回にも増えます。
            </p>
            <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-ink-muted">
              最後の<b className="text-ink">提案書作成</b>が成果物を出します。
              前のAgentが止まっていれば作りません。
              決まっていない欄があるうちは
              <b className="text-ink">「社内用」</b>として出て、顧客には出せない判定になります。
              できたものは <code className="font-mono text-[10px]">deliverables/</code> に保存されます。
            </p>
          </div>
        </div>
      </Card>

      {loadError && (
        <Card className="mb-4 border-warn/40 bg-warn-soft/30">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            これまでの依頼を読み込めませんでした（{loadError}）。
            新しい依頼は出せます。
          </p>
        </Card>
      )}

      <RequestDesk initial={past} />
    </main>
  );
}
