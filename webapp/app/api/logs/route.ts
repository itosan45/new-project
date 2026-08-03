import { NextRequest, NextResponse } from "next/server";
import { appendToFile, getFile } from "@/lib/github";

function todayPath() {
  const date = new Date().toISOString().slice(0, 10);
  return { date, path: `secretary/logs/${date}.md` };
}

export async function GET() {
  const { date, path } = todayPath();
  const file = await getFile(path);
  return NextResponse.json({ date, content: file?.content ?? "" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { date, path } = todayPath();
  const time = new Date().toISOString().slice(11, 16);
  await appendToFile(path, `- ${time} ${content}\n`, `secretary: log entry ${date}`, `# ${date}`);
  return NextResponse.json({ ok: true });
}
