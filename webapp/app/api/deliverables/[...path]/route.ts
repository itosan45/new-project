import { NextRequest, NextResponse } from "next/server";
import { getBinaryFile } from "@/lib/github";

export const dynamic = "force-dynamic";

/**
 * 成果物を渡す口。
 *
 * 保存してあるだけでは受け取れない。ここを通してダウンロードする。
 *
 * リポジトリは非公開なので、GitHubの生URLは相手に渡せない。
 * この口を通し、ログインした人だけが取れるようにする（認証は proxy.ts）。
 */

const TYPES: Record<string, string> = {
  md: "text/markdown; charset=utf-8",
  html: "text/html; charset=utf-8",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const rel = path.join("/");

  // deliverables/ の外は渡さない
  if (rel.includes("..")) {
    return NextResponse.json({ error: "不正なパスです" }, { status: 400 });
  }

  try {
    const file = await getBinaryFile(`deliverables/${rel}`);
    if (!file) {
      return NextResponse.json({ error: "見つかりません" }, { status: 404 });
    }
    const ext = rel.split(".").pop()?.toLowerCase() ?? "";
    const body = Buffer.from(file.base64, "base64");
    const name = decodeURIComponent(rel.split("/").pop() ?? "file");
    // 画像とPDFはその場で開き、それ以外は保存させる
    const inline = ["pdf", "png", "jpg", "jpeg"].includes(ext);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "読み込みに失敗しました" },
      { status: 500 },
    );
  }
}
