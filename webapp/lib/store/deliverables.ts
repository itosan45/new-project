import { listDir } from "@/lib/github";
import type { DeliverableFormat } from "@/lib/domain/web-request";

/**
 * 成果物の受け取り窓口が読むところ。
 *
 * `deliverables/<依頼ID>/<ファイル>` を一覧にする。
 * 中身は読まない（画像を全部読むと重い）。名前と大きさだけ。
 */

export interface DeliverableFile {
  fileName: string;
  path: string;
  format: DeliverableFormat | "その他";
  bytes: number;
  /** 画面から取りに行くURL */
  url: string;
}

export interface DeliverableGroup {
  requestId: string;
  files: DeliverableFile[];
}

function formatOf(name: string): DeliverableFile["format"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md" || ext === "pdf" || ext === "png" || ext === "html") return ext;
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  return "その他";
}

export async function listDeliverables(): Promise<DeliverableGroup[]> {
  const dirs = await listDir("deliverables").catch(() => []);
  const groups: DeliverableGroup[] = [];

  for (const d of dirs) {
    if (d.type !== "dir") continue;
    const entries = await listDir(d.path).catch(() => []);
    const files = entries
      .filter((e) => e.type === "file")
      .map((e) => ({
        fileName: e.name,
        path: e.path,
        format: formatOf(e.name),
        bytes: 0,
        url: `/api/deliverables/${e.path.replace(/^deliverables\//, "")}`,
      }));
    if (files.length > 0) groups.push({ requestId: d.name, files });
  }

  return groups.sort((a, b) => b.requestId.localeCompare(a.requestId));
}
