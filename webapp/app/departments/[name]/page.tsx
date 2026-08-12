import EntryForm from "@/components/EntryForm";
import { getFile } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const [readme, rules, note] = await Promise.all([
    getFile(`departments/${name}/README.md`),
    getFile(`departments/${name}/rules.md`),
    getFile(`departments/${name}/notes/${today}.md`),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">{name}</h1>

      <section className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500">役割</h2>
        <pre className="mt-1 whitespace-pre-wrap break-words text-sm">
          {readme?.content || "(未設定)"}
        </pre>
      </section>

      <section className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500">rules</h2>
        <pre className="mt-1 whitespace-pre-wrap break-words text-sm">
          {rules?.content || "(まだルールはありません)"}
        </pre>
      </section>

      <EntryForm
        action={`/api/departments/${name}`}
        placeholder={`${name} 宛のメモを書く`}
        label="メモを追記"
      />

      <section className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <h2 className="text-sm font-medium text-neutral-500">
          今日の記録 ({today})
        </h2>
        <pre className="mt-1 whitespace-pre-wrap break-words text-sm">
          {note?.content || "まだ記録がありません"}
        </pre>
      </section>
    </div>
  );
}
