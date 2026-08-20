import Link from "next/link";
import { Badge, Card, Icon, IconTile, type Tone } from "@/components/ui";
import { listDeliverables, type DeliverableFile } from "@/lib/store/deliverables";

export const metadata = { title: "成果物" };
export const dynamic = "force-dynamic";

/**
 * 成果物の受け取り窓口。
 *
 * 「成果物はどこから出てくるのか」への答えがこの画面。
 * 作られたものは全部ここに並び、ここから取り出して相手に送る。
 *
 * ホームページのような見た目で判断するものは、URLやHTMLで渡さない。
 * **画像とPDFで渡す。** 相手はURLを見て「これは公開されたのか」と迷うし、
 * リンクは切れる。画像なら、そのまま社内で回覧できる。
 */

const FORMAT_LABEL: Record<DeliverableFile["format"], string> = {
  md: "文書",
  pdf: "PDF",
  png: "画像",
  jpg: "画像",
  html: "HTML",
  その他: "ファイル",
};

const FORMAT_TONE: Record<DeliverableFile["format"], Tone> = {
  md: "info",
  pdf: "ok",
  png: "ok",
  jpg: "ok",
  html: "warn",
  その他: "idle",
};

function FileRow({ f }: { f: DeliverableFile }) {
  const isImage = f.format === "png" || f.format === "jpg";
  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            name={isImage ? "chart" : f.format === "pdf" ? "doc" : "file"}
            className="size-4 shrink-0 text-primary"
          />
          <span className="min-w-0 text-[12.5px] font-medium text-ink">
            {f.fileName}
          </span>
          <Badge tone={FORMAT_TONE[f.format]}>{FORMAT_LABEL[f.format]}</Badge>
          {f.format === "html" && (
            <Badge tone="warn">そのままは渡さない</Badge>
          )}
        </div>
        <a
          href={f.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[11px] text-ink hover:border-primary/50"
        >
          開く・保存
        </a>
      </div>

      {isImage && (
        <a href={f.url} target="_blank" rel="noreferrer" className="mt-2 block">
          {/* 中身が見えないと、送る前の確認ができない */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={f.url}
            alt={f.fileName}
            className="max-h-[360px] w-full rounded-lg border border-line object-cover object-top"
          />
        </a>
      )}

      <p className="mt-1.5 font-mono text-[10px] text-ink-subtle">{f.path}</p>
    </div>
  );
}

export default async function DeliverablesPage() {
  let groups: Awaited<ReturnType<typeof listDeliverables>> = [];
  let loadError: string | null = null;
  try {
    groups = await listDeliverables();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "読み込みに失敗しました";
  }

  const total = groups.reduce((n, g) => n + g.files.length, 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-primary"
        >
          <Icon name="home" className="size-3" /> 仕事場へ戻る
        </Link>
        <h1 className="text-xl font-bold text-ink">成果物</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          できあがったものは、全部ここに並びます。
          <span className="font-medium text-ink">
            相手に渡すときは、ここから取り出します。
          </span>
        </p>
      </header>

      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <IconTile name="doc" tone="ok" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-ink">
              見た目で判断するものは、画像とPDFで渡す
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              モック（デザイン案）を <b className="text-ink">URLやHTMLで渡しません</b>。
              相手はURLを見て「これはもう公開されたのか」と迷いますし、リンクはいずれ切れます。
              画像かPDFなら、そのまま社内で回覧できて、印刷して見せることもできます。
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              ホームページの仕事は、
              <b className="text-ink">着工前にモックを出して合意を取ってから</b>作り始めます。
              その合意の記録がここに残ります。
            </p>
          </div>
        </div>
      </Card>

      {loadError && (
        <Card className="mb-4 border-warn/40 bg-warn-soft/30">
          <p className="text-[11px] leading-relaxed text-ink-muted">
            読み込めませんでした（{loadError}）。
            保存先の鍵（GITHUB_TOKEN など）が設定されているか確認してください。
          </p>
        </Card>
      )}

      {!loadError && total === 0 && (
        <Card>
          <p className="text-center text-xs text-ink-muted">
            まだ成果物がありません。
            <Link href="/request" className="text-primary hover:underline">
              依頼を出す
            </Link>
            と、Agentが作ったものがここに並びます。
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <Card key={g.requestId} padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <span className="font-mono text-[11px] text-ink">{g.requestId}</span>
              <span className="text-[10px] text-ink-subtle">
                {g.files.length}点
              </span>
            </div>
            <div className="flex flex-col divide-y divide-line">
              {g.files.map((f) => (
                <FileRow key={f.path} f={f} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
