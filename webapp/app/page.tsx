import Link from "next/link";
import { getFile, getLatestFile, listDir } from "@/lib/github";

export const dynamic = "force-dynamic";

function extractRole(content: string): string {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.find((l) => l.startsWith("役割")) ?? lines.find((l) => !l.startsWith("#")) ?? "";
}

export default async function Home() {
  const [inboxEntries, departmentEntries] = await Promise.all([
    listDir("secretary/inbox"),
    listDir("departments"),
  ]);

  const inboxCount = inboxEntries.filter(
    (e) => e.type === "file" && e.name !== "README.md"
  ).length;
  const departmentNames = departmentEntries
    .filter((e) => e.type === "dir")
    .map((e) => e.name)
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const todayLog = await getFile(`secretary/logs/${today}.md`);

  const departments = await Promise.all(
    departmentNames.map(async (name) => {
      const [readme, latestNote] = await Promise.all([
        getFile(`departments/${name}/README.md`),
        getLatestFile(`departments/${name}/notes`),
      ]);
      return {
        name,
        role: readme ? extractRole(readme.content) : "",
        latestNoteDate: latestNote?.name.replace(/\.md$/, "") ?? null,
        latestNoteContent: latestNote?.content ?? null,
      };
    })
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">受信箱</h2>
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

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">部署の動き</h2>
        {departments.map((dept) => (
          <Link
            key={dept.name}
            href={`/departments/${dept.name}`}
            className="block rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{dept.name}</span>
              {dept.latestNoteDate && (
                <span className="text-xs text-neutral-500">
                  最終更新 {dept.latestNoteDate}
                </span>
              )}
            </div>
            {dept.role && (
              <p className="mt-1 text-xs text-neutral-500">{dept.role}</p>
            )}
            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-600 dark:text-neutral-400">
              {dept.latestNoteContent
                ? dept.latestNoteContent.trim()
                : "まだ記録がありません"}
            </pre>
          </Link>
        ))}
      </section>
    </div>
  );
}
