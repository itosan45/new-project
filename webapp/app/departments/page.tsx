import Link from "next/link";
import { listDir } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const entries = await listDir("departments");
  const departments = entries
    .filter((e) => e.type === "dir")
    .map((e) => e.name)
    .sort();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">departments</h1>
      <ul className="flex flex-col gap-2">
        {departments.map((name) => (
          <li
            key={name}
            className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
          >
            <Link href={`/departments/${name}`} className="underline">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
