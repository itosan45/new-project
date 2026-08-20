import { NextRequest, NextResponse } from "next/server";
import { findTenant, TENANTS } from "@/lib/data/tenants";
import { startCase } from "@/lib/engine/pipeline";
import { listAllCases, listCases, saveCase } from "@/lib/store/cases";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenant");
  try {
    const cases = tenantId
      ? await listCases(tenantId)
      : await listAllCases(TENANTS.map((t) => t.tenantId));
    return NextResponse.json({ cases });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "読み込みに失敗しました" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const requestedBy =
    typeof body?.requestedBy === "string" ? body.requestedBy.trim() : "";
  const priority = body?.priority === "最優先" ? "最優先" : "通常";
  const documents = Array.isArray(body?.documents)
    ? body.documents
        .filter(
          (d: unknown): d is { ファイル名: string; 全文: string } =>
            typeof d === "object" &&
            d !== null &&
            typeof (d as Record<string, unknown>).ファイル名 === "string" &&
            typeof (d as Record<string, unknown>).全文 === "string",
        )
        .map((d: { ファイル名: string; 全文: string }) => ({
          ファイル名: d.ファイル名.trim(),
          全文: d.全文,
        }))
        .filter((d: { ファイル名: string; 全文: string }) => d.全文.trim())
    : [];

  const tenant = findTenant(tenantId);
  if (!tenant) {
    return NextResponse.json(
      { error: "顧客が指定されていません" },
      { status: 400 },
    );
  }
  if (!title) {
    return NextResponse.json({ error: "件名が空です" }, { status: 400 });
  }

  try {
    const record = startCase({
      tenant,
      title,
      description,
      requestedBy: requestedBy || "担当者",
      priority,
      documents: documents.length > 0 ? documents : undefined,
    });
    await saveCase(record);
    return NextResponse.json({ ok: true, run: record.run });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "受付に失敗しました" },
      { status: 500 },
    );
  }
}
