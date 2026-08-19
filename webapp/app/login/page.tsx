"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Icon } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // 認証が通ってから画面が切り替わるまでの間、無言にしない
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        throw new Error("パスワードが違います");
      }
      setDone(true);
      // 成功表示を一瞬見せてから遷移する
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-sm text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-ok-soft text-ok">
            <Icon name="check" className="size-6" />
          </span>
          <p className="text-sm font-semibold text-ink">ログインしました</p>
          <p className="mt-1.5 text-[11px] text-ink-muted">
            職場を開いています…
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <span className="mx-auto mb-2.5 flex size-11 items-center justify-center rounded-xl bg-primary text-white">
            <Icon name="robot" className="size-6" />
          </span>
          <h1 className="text-base font-bold text-ink">業務自動化ハーネス</h1>
          <p className="mt-1 text-[11px] text-ink-muted">
            コントロールセンター
          </p>
        </div>

        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] text-ink-muted">パスワード</span>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-primary/50"
              />
            </label>

            {error && (
              <p className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
                <Icon name="alert" className="size-3.5 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {loading ? "確認中…" : "ログイン"}
            </button>
          </form>
        </Card>

        <p className="mt-3 text-center text-[10px] text-ink-subtle">
          すべての操作は記録・監査されます
        </p>
      </div>
    </main>
  );
}
