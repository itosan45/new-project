"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EntryForm({
  action,
  placeholder,
  label,
}: {
  action: string;
  placeholder: string;
  label: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "送信に失敗しました");
      }
      setContent("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-md border border-neutral-200 bg-transparent p-2 text-base outline-none focus:border-neutral-400 dark:border-neutral-700"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting || !content.trim()}
        className="ml-auto rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {submitting ? "送信中…" : label}
      </button>
    </div>
  );
}
