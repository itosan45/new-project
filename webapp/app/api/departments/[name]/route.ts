import { NextRequest, NextResponse } from "next/server";
import { appendToFile, getFile } from "@/lib/github";

function notePath(name: string) {
  const date = new Date().toISOString().slice(0, 10);
  return { date, path: `departments/${name}/notes/${date}.md` };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { date, path: noteFilePath } = notePath(name);

  const [readme, rules, note] = await Promise.all([
    getFile(`departments/${name}/README.md`),
    getFile(`departments/${name}/rules.md`),
    getFile(noteFilePath),
  ]);

  return NextResponse.json({
    name,
    date,
    readme: readme?.content ?? "",
    rules: rules?.content ?? "",
    note: note?.content ?? "",
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { date, path } = notePath(name);
  const time = new Date().toISOString().slice(11, 16);
  await appendToFile(path, `- ${time} ${content}\n`, `${name}: note ${date}`, `# ${date}`);
  return NextResponse.json({ ok: true });
}
