"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="min-h-[40px] rounded-md px-3 py-2.5 text-[11px] text-ink-muted hover:bg-surface-muted disabled:opacity-40"
    >
      ログアウト
    </button>
  );
}
