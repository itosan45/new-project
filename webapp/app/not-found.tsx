import Link from "next/link";
import { Card, Icon } from "@/components/ui";

/**
 * ナビには設計書に出てくる画面名を先に全部並べてある。
 * まだ作っていない画面を踏んだとき、素の404ではなく「未実装」と分かるようにする。
 * どこまで作ったかが自分で見て分かる状態を保つため。
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-md text-center">
        <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-idle-soft text-ink-muted">
          <Icon name="flow" className="size-5" />
        </span>
        <h1 className="text-base font-semibold text-ink">
          この画面はまだ作っていません
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          ナビゲーションには設計書にある画面名を先に並べてあります。
          <br />
          中身はこれから実装する部分です。
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-white"
        >
          <Icon name="home" className="size-3.5" />
          画面一覧へ戻る
        </Link>
      </Card>
    </main>
  );
}
