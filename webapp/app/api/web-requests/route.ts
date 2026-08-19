import { NextRequest, NextResponse } from "next/server";
import { runWebRequest } from "@/lib/engine/web-pipeline";
import { listWebRequests, saveWebRequest } from "@/lib/store/web-requests";
import { emptyBrief, type WebBrief } from "@/lib/domain/web-project";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ requests: await listWebRequests() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "読み込みに失敗しました" },
      { status: 500 },
    );
  }
}

/** 画面から来た値を WebBrief に詰める。空欄は未回答のまま残す。 */
function toBrief(raw: unknown): WebBrief {
  const b = emptyBrief();
  if (!raw || typeof raw !== "object") return b;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(b) as (keyof WebBrief)[]) {
    const v = src[key];
    if (v == null) continue;
    if (typeof v === "string") {
      const t = v.trim();
      if (!t) continue;
      // 配列で持つ項目は、改行と読点で分ける
      if (key === "pages" || key === "snsLinks") {
        (b[key] as { value?: string[] }).value = t
          .split(/[\n、,／/]/)
          .map((x) => x.trim())
          .filter(Boolean);
      } else {
        (b[key] as { value?: string }).value = t;
      }
    }
  }
  return b;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const clientName =
    typeof body?.clientName === "string" ? body.clientName.trim() : "";
  const summary = typeof body?.summary === "string" ? body.summary.trim() : "";
  const siteUrl = typeof body?.siteUrl === "string" ? body.siteUrl.trim() : "";

  if (!clientName) {
    return NextResponse.json({ error: "顧客名を入れてください" }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json(
      { error: "依頼の内容を入れてください" },
      { status: 400 },
    );
  }

  const brief = toBrief(body?.brief);

  /*
   * 上で「今あるサイト」を書いてもらっているのに、
   * Agentが「今あるサイトはありますか」と聞き返していた。
   * 一度言ったことを二度聞かない。
   */
  if (siteUrl && !brief.existingSite.value?.trim()) {
    brief.existingSite.value = `既存サイトの作り直し（${siteUrl}）`;
    brief.existingSite.note = "依頼フォームのURL欄から補った";
  }

  const request = runWebRequest({
    clientName,
    siteUrl: siteUrl || undefined,
    summary,
    brief,
  });

  // 保存できなくても、Agentの結果は返す。
  // 鍵が無いから何も分からない、という状態にはしない
  let saveError: string | null = null;
  try {
    await saveWebRequest(request);
  } catch (e) {
    saveError = e instanceof Error ? e.message : "保存に失敗しました";
  }

  return NextResponse.json({ request, saveError });
}
