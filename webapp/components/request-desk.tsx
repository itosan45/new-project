"use client";

import { useState } from "react";
import { Badge, Card, Icon, type Tone } from "@/components/ui";
import { WEB_DECISIONS } from "@/lib/data/web-decisions";
import type {
  AgentRunResult,
  Deliverable,
  WebRequest,
} from "@/lib/domain/web-request";

/**
 * 依頼を出す窓口。
 *
 * ここから出すと Agent が動く。秘書に口頭で頼むと、秘書が全部やってしまい
 * Agent が1体も動かない。実際にそうなっていたので、口を用意した。
 *
 * 埋まっていない欄は、埋めずに出してよい。
 * **何が足りないかを教えるのが、この画面の仕事**なので。
 */

const STATUS_TONE: Record<AgentRunResult["status"], Tone> = {
  完了: "ok",
  入力が足りない: "warn",
  人に回す: "warn",
  未実装: "idle",
};

/** 選択肢のある項目は選ばせる。自由記述は書かせる。 */
const FIELDS = WEB_DECISIONS.map((d) => ({
  key: d.key,
  label: d.question,
  why: d.why,
  options: d.options,
  blocks: d.blocksEstimate,
  stage: d.stage,
}));

function Field({
  f,
  value,
  onChange,
}: {
  f: (typeof FIELDS)[number];
  value: string;
  onChange: (v: string) => void;
}) {
  const cls =
    "w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50";
  return (
    <label className="flex flex-col gap-1">
      <span className="flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed text-ink">
        {f.label}
        {f.blocks && <Badge tone="warn">見積が出せない</Badge>}
      </span>
      {f.options ? (
        <select
          className={cls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">（まだ分からない）</option>
          {f.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : f.key === "pages" ? (
        <textarea
          className={`${cls} resize-none`}
          rows={2}
          value={value}
          placeholder="トップ、サービス、実績…（読点か改行で区切る）"
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={cls}
          value={value}
          placeholder="分からなければ空のまま"
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <span className="text-[10px] leading-relaxed text-ink-subtle">
        {f.why}
      </span>
    </label>
  );
}

function ResultCard({ r }: { r: AgentRunResult }) {
  const out = r.output as Record<string, unknown> | undefined;
  return (
    <div className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{r.agentName}</span>
        <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
        {r.summary}
      </p>

      {r.missing && r.missing.length > 0 && (
        <div className="mt-2 rounded-md bg-warn-soft/40 p-2.5">
          <p className="text-[10px] font-medium text-warn">
            {r.askWho === "顧客" ? "顧客に聞くこと" : "こちらで用意すること"}
          </p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {r.missing.map((m) => (
              <li key={m} className="text-[11px] leading-relaxed text-ink">
                ・{m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.evidence.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[10px] text-ink-muted">
            根拠を見る（{r.evidence.length}）
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1">
            {r.evidence.map((e, i) => (
              <li key={i} className="text-[10px] leading-relaxed text-ink-muted">
                ・{e}
              </li>
            ))}
          </ul>
        </details>
      )}

      {out && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[10px] text-ink-muted">
            出したものを見る
          </summary>
          <pre className="mt-1.5 max-h-64 overflow-auto rounded-md bg-surface-muted p-2 text-[10px] leading-relaxed text-ink">
            {JSON.stringify(out, null, 1)}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * 成果物。
 *
 * ここが「どこから出てくるのか」への答え。
 * 中身をそのまま見せて、コピーもできるようにする。
 * 保存先のパスも出す。どこに置かれたか分からない成果物は無いのと同じ。
 */
function DeliverableCard({ d }: { d: Deliverable }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card
      className={d.readyForClient ? "border-ok/40" : "border-warn/40"}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="doc" className="size-4 text-primary" />
            <span className="text-[13px] font-medium text-ink">
              {d.fileName}
            </span>
            <Badge tone={d.readyForClient ? "ok" : "warn"}>
              {d.readyForClient ? "顧客に出せる" : "社内用（未確定あり）"}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-[10px] text-ink-subtle">{d.path}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(d.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-[11px] text-ink"
        >
          {copied ? "コピーしました" : "全文をコピー"}
        </button>
      </div>

      {d.undecided.length > 0 && (
        <div className="mt-3 rounded-md bg-warn-soft/40 p-2.5">
          <p className="text-[10px] font-medium text-warn">
            決まっていないもの（{d.undecided.length}件）。これが埋まるまで顧客には出せません
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink">
            {d.undecided.join("・")}
          </p>
        </div>
      )}

      <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-surface-muted p-3 text-[11px] leading-relaxed text-ink">
        {d.content}
      </pre>
    </Card>
  );
}

export function RequestDesk({ initial }: { initial: WebRequest[] }) {
  const [clientName, setClientName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<WebRequest | null>(null);
  const [past] = useState<WebRequest[]>(initial);
  const [open, setOpen] = useState(false);

  async function submit() {
    if (!clientName.trim() || !summary.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSaveError(null);
    try {
      const res = await fetch("/api/web-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, siteUrl, summary, brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "受付に失敗しました");
      setResult(data.request as WebRequest);
      setSaveError(data.saveError ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "受付に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  const askClient = result
    ? [
        ...new Set(
          result.results
            .filter((r) => r.status === "入力が足りない" && r.askWho === "顧客")
            .flatMap((r) => r.missing ?? []),
        ),
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-danger-soft px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-ink">依頼を出す</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
          分からない欄は<b className="text-ink">空のまま出してください</b>。
          何が足りないかを返すのが、この画面の仕事です。
        </p>

        <div className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">顧客名</span>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="株式会社〇〇"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-ink-muted">
                今あるサイト（あれば）
              </span>
              <input
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://…（入れると「作り直し」として扱います）"
                className="rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-muted">
              依頼の内容（相手の言葉のまま）
            </span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="例: 知り合いの運送会社のHPを、今風に作り直したい"
              className="resize-none rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-primary/50"
            />
          </label>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="self-start text-[11px] text-primary hover:underline"
          >
            {open ? "決まっていることを閉じる" : "決まっていることを入れる（18項目）"}
          </button>

          {open && (
            <div className="flex flex-col gap-5 rounded-lg border border-line bg-surface-muted p-3">
              {(["1回目", "2回目以降", "制作前"] as const).map((stage) => (
                <div key={stage}>
                  <p className="mb-2 text-[11px] font-medium text-ink">
                    {stage}に聞くこと
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {FIELDS.filter((f) => f.stage === stage).map((f) => (
                      <Field
                        key={f.key}
                        f={f}
                        value={brief[f.key] ?? ""}
                        onChange={(v) =>
                          setBrief((b) => ({ ...b, [f.key]: v }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy || !clientName.trim() || !summary.trim()}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
          >
            <Icon name="send" className="size-3.5" />
            {busy ? "Agentが動いています…" : "Agentに投げる"}
          </button>
        </div>
      </Card>

      {result && result.deliverables.length > 0 && (
        <DeliverableCard d={result.deliverables[0]} />
      )}

      {result && (
        <>
          {askClient.length > 0 && (
            <Card className="border-warn/40 bg-warn-soft/25">
              <h2 className="text-sm font-semibold text-ink">
                次の打ち合わせで聞くこと
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                Agentが止まった理由をまとめたものです。これが埋まれば先へ進みます。
              </p>
              <ul className="mt-2 flex flex-col gap-1">
                {askClient.map((q) => (
                  <li key={q} className="text-[12px] leading-relaxed text-ink">
                    ・{q}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Agentが返したもの</h2>
              <span className="font-mono text-[10px] text-ink-subtle">
                {result.requestId}
              </span>
            </div>
            {saveError && (
              <p className="mt-2 rounded-md bg-warn-soft/50 p-2 text-[10px] leading-relaxed text-warn">
                保存はできませんでした（{saveError}）。結果は下に出ています。
              </p>
            )}
            <div className="mt-3 flex flex-col gap-2.5">
              {result.results.map((r) => (
                <ResultCard key={r.agentId} r={r} />
              ))}
            </div>
          </Card>
        </>
      )}

      {past.length > 0 && (
        <Card padded={false}>
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">これまでの依頼</h2>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {past.map((p) => (
              <div key={p.requestId} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">
                    {p.clientName}
                  </span>
                  <span className="font-mono text-[10px] text-ink-subtle">
                    {p.createdAt.slice(0, 10)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {p.summary}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
