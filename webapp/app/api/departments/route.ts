import { NextResponse } from "next/server";
import { listDir } from "@/lib/github";

export async function GET() {
  const entries = await listDir("departments");
  const departments = entries
    .filter((e) => e.type === "dir")
    .map((e) => e.name)
    .sort();
  return NextResponse.json({ departments });
}
