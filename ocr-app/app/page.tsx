"use client";

import { useRef, useState } from "react";
import type { OcrResult } from "@/lib/ocr";
import { OCR_FIELD_LABELS } from "@/lib/ocr";

type Item = {
  id: number;
  filename: string;
  status: "processing" | "done" | "error";
  result?: OcrResult;
  error?: string;
};

const MAX_LONG_EDGE = 2576; // Claude visionの高解像度上限(長辺)に合わせる
const MAX_PDF_BYTES = 4 * 1024 * 1024;

let nextId = 1;

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function resizeImageToJpegBase64(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("画像を読み込めませんでした"));
      el.src = url;
    });

    const scale = Math.min(1, MAX_LONG_EDGE / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像の変換に失敗しました");
    ctx.drawImage(img, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return dataUrl.slice(dataUrl.indexOf(",") + 1);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateItem(id: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function processFile(file: File) {
    const id = nextId++;
    setItems((prev) => [
      { id, filename: file.name, status: "processing" as const },
      ...prev,
    ]);

    try {
      let mediaType: string;
      let data: string;
      if (file.type === "application/pdf") {
        if (file.size > MAX_PDF_BYTES) {
          throw new Error("PDFが大きすぎます(4MB以下にしてください)");
        }
        mediaType = "application/pdf";
        data = await fileToBase64(file);
      } else {
        mediaType = "image/jpeg";
        data = await resizeImageToJpegBase64(file);
      }

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, data }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.result) {
        throw new Error(json?.error || "読み取りに失敗しました");
      }
      updateItem(id, { status: "done", result: json.result as OcrResult });
    } catch (e) {
      updateItem(id, {
        status: "error",
        error: e instanceof Error ? e.message : "読み取りに失敗しました",
      });
    }
  }

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) void processFile(file);
    e.target.value = "";
  }

  function downloadCsv() {
    const done = items.filter((it) => it.status === "done" && it.result);
    if (done.length === 0) return;

    const header = ["ファイル名", ...OCR_FIELD_LABELS.map((f) => f.label)];
    const rows = done.map((it) => [
      it.filename,
      ...OCR_FIELD_LABELS.map((f) => it.result?.[f.key] ?? ""),
    ]);
    // 先頭のBOMは、ExcelでCSVを開いたときの文字化け防止
    const csv =
      "\uFEFF" +
      [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    a.download = `読み取り結果-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  }

  const doneCount = items.filter((it) => it.status === "done").length;
  const processingCount = items.filter((it) => it.status === "processing").length;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          手書きの書類を撮影するか、写真・PDFを選ぶと、崩れた文字も含めて
          読み取って項目に整理します。
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={onFilesSelected}
          className="hidden"
        />
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-neutral-900 px-4 py-4 text-base font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          📷 撮影 / ファイルを選ぶ
        </button>
        {doneCount > 0 && (
          <button
            onClick={downloadCsv}
            className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium dark:border-neutral-700"
          >
            ⬇️ CSVダウンロード({doneCount}件)
          </button>
        )}
        {processingCount > 0 && (
          <p className="text-sm text-neutral-500">
            読み取り中… {processingCount}件(1枚あたり10〜30秒ほどかかります)
          </p>
        )}
      </section>

      <section className="flex flex-col gap-4">
        {items.map((it) => (
          <article
            key={it.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="truncate text-sm font-medium">{it.filename}</h2>
              {it.status === "processing" && (
                <span className="shrink-0 text-xs text-neutral-500">読み取り中…</span>
              )}
              {it.status === "done" && it.result && (
                <button
                  onClick={() => copyText(it.result!.fullText)}
                  className="shrink-0 text-xs text-neutral-500 hover:underline"
                >
                  全文をコピー
                </button>
              )}
            </div>

            {it.status === "error" && (
              <p className="text-sm text-red-600">{it.error}</p>
            )}

            {it.status === "done" && it.result && (
              <dl className="flex flex-col gap-2 text-sm">
                {OCR_FIELD_LABELS.map((f) => {
                  const value = it.result?.[f.key] ?? "";
                  if (!value) return null;
                  return (
                    <div key={f.key} className="flex flex-col gap-0.5">
                      <dt className="text-xs text-neutral-500">{f.label}</dt>
                      <dd className="whitespace-pre-wrap break-words">{value}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
