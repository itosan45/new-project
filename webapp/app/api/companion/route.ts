import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.6-flash";
const SYSTEM_PROMPT =
  "あなたはユーザーに毎日話しかける、親しみやすいAIアシスタントです。" +
  "渡された状況の説明を元に、話し言葉で1〜2文の短いひとことを作ってください。" +
  "絵文字や記号、前置きは付けないでください。";

function isAuthorized(req: NextRequest): boolean {
  const provided = req.headers.get("x-companion-secret") ?? "";
  const expected = process.env.COMPANION_SHARED_SECRET ?? "";
  if (!expected) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  const situation =
    typeof body?.situation === "string" ? body.situation.trim() : "";
  if (!situation) {
    return NextResponse.json({ error: "situation is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: situation }] }],
      }),
    },
  );

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "gemini request failed", detail },
      { status: 502 },
    );
  }

  const data = await res.json();
  const message = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return NextResponse.json({ message });
}
