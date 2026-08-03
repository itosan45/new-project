import { NextRequest, NextResponse } from "next/server";
import { getFile, listDir, putFile } from "@/lib/github";

const DIR = "secretary/inbox";

export async function GET() {
  const entries = await listDir(DIR);
  const files = entries.filter((e) => e.type === "file" && e.name !== "README.md");
  const items = await Promise.all(
    files.map(async (f) => {
      const file = await getFile(f.path);
      return { name: f.name, path: f.path, content: file?.content ?? "" };
    })
  );
  items.sort((a, b) => (a.name < b.name ? 1 : -1));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const name = `${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
  const path = `${DIR}/${name}`;
  await putFile(path, `${content}\n`, `secretary: add inbox item ${name}`);
  return NextResponse.json({ ok: true, path });
}
