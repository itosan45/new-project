import { NextRequest, NextResponse } from "next/server";
import { decideApproval } from "@/lib/engine/pipeline";
import { loadCase, saveCase } from "@/lib/store/cases";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId : "";
  const runId = typeof body?.runId === "string" ? body.runId : "";
  const approvalId =
    typeof body?.approvalId === "string" ? body.approvalId : "";
  const decision = body?.decision === "REJECTED" ? "REJECTED" : "APPROVED";
  const actor = typeof body?.actor === "string" ? body.actor.trim() : "承認者";

  if (!tenantId || !runId || !approvalId) {
    return NextResponse.json({ error: "指定が不足しています" }, { status: 400 });
  }

  try {
    const record = await loadCase(tenantId, runId);
    if (!record) {
      return NextResponse.json(
        { error: "案件が見つかりません" },
        { status: 404 },
      );
    }
    const updated = decideApproval(record, approvalId, decision, actor);
    await saveCase(updated);
    return NextResponse.json({ ok: true, run: updated.run });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "処理に失敗しました" },
      { status: 500 },
    );
  }
}
