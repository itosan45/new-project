import { getFile, listDir, putFile } from "@/lib/github";
import type { WebRequest } from "@/lib/domain/web-request";

/**
 * 依頼の保存先。案件（cases）と同じ考え方で、リポジトリのファイルを台帳にする。
 * 1依頼 = 1ファイル。Agentが返したものをそのまま残す。
 */

const DIR = "web-requests";

function pathOf(requestId: string): string {
  return `${DIR}/${requestId}.json`;
}

export async function saveWebRequest(req: WebRequest): Promise<void> {
  await putFile(
    pathOf(req.requestId),
    JSON.stringify(req, null, 2),
    `依頼を受け付けました: ${req.clientName} / ${req.requestId}`,
  );
}

export async function listWebRequests(): Promise<WebRequest[]> {
  const entries = await listDir(DIR).catch(() => []);
  const out: WebRequest[] = [];
  for (const e of entries) {
    if (e.type !== "file" || !e.name.endsWith(".json")) continue;
    const f = await getFile(`${DIR}/${e.name}`).catch(() => null);
    if (!f) continue;
    try {
      out.push(JSON.parse(f.content) as WebRequest);
    } catch {
      // 壊れたファイルは黙って飛ばさない、が、一覧は出す
      continue;
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
