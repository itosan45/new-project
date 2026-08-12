import EntryForm from "@/components/EntryForm";
import { getFile, listDir } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const entries = await listDir("secretary/inbox");
  const files = entries.filter(
    (e) => e.type === "file" && e.name !== "README.md"
  );
  const items = await Promise.all(
    files.map(async (f) => {
      const file = await getFile(f.path);
      return { name: f.name, content: file?.content ?? "" };
    })
  );
  items.sort((a, b) => (a.name < b.name ? 1 : -1));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">inbox</h1>
      <EntryForm
        action="/api/inbox"
        placeholder="判断に迷うことをメモする"
        label="inboxに追加"
      />
      <ul className="flex flex-col gap-2">
        {items.length === 0 && (
          <p className="text-sm text-neutral-500">inboxは空です</p>
        )}
        {items.map((item) => (
          <li
            key={item.name}
            className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <p className="text-xs text-neutral-500">{item.name}</p>
            <pre className="mt-1 whitespace-pre-wrap break-words text-sm">
              {item.content}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
