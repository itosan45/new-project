import Link from "next/link";
import { getFile, listDir } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [inboxEntries, departmentEntries] = await Promise.all([
    listDir("secretary/inbox"),
    listDir("departments"),
  ]);

  const inboxCount = inboxEntries.filter(
    (e) => e.type === "file" && e.name !== "README.md"
  ).length;
  const departments = departmentEntries
    .filter((e) => e.type === "dir")
    .map((e) => e.name)
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = await getFile(`secretary/logs/${today}.md`);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">inbox</h2>
          <span className="text-2xl font-semibold">{inboxCount}</span>
        </div>
        <Link href="/inbox" className="mt-2 inline-block text-sm underline">
          未処理のメモを見る →
        </Link>
      </section>

      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-medium">今日のログ ({today})</h2>
        <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-600 dark:text-neutral-400">
          {todayLog?.content || "まだ記録がありません"}
        </pre>
        <Link href="/logs" className="mt-2 inline-block text-sm underline">
          ログを見る・追記する →
        </Link>
      </section>

      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="font-medium">departments</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {departments.map((name) => (
            <li key={name}>
              <Link href={`/departments/${name}`} className="underline">
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
