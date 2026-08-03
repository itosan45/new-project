import EntryForm from "@/components/EntryForm";
import { getFile } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const file = await getFile(`secretary/logs/${today}.md`);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">logs / {today}</h1>
      <EntryForm
        action="/api/logs"
        placeholder="記録しておきたいことを書く"
        label="ログに追記"
      />
      <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <pre className="whitespace-pre-wrap break-words text-sm">
          {file?.content || "まだ今日の記録はありません"}
        </pre>
      </div>
    </div>
  );
}
