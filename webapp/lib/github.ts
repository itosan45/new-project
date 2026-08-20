const GITHUB_API = "https://api.github.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function repoInfo() {
  return {
    owner: env("GITHUB_OWNER"),
    repo: env("GITHUB_REPO"),
    branch: process.env.GITHUB_BRANCH || "main",
    token: env("GITHUB_TOKEN"),
  };
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map(encodeURIComponent)
    .join("/");
}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  const { token } = repoInfo();
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} on ${path}: ${text}`);
  }
  return res;
}

export type GhEntry = {
  path: string;
  name: string;
  type: "file" | "dir";
  sha?: string;
};

export async function listDir(path: string): Promise<GhEntry[]> {
  const { owner, repo, branch } = repoInfo();
  const res = await gh(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`
  );
  if (res.status === 404) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((d: { path: string; name: string; type: string; sha: string }) => ({
    path: d.path,
    name: d.name,
    type: d.type === "dir" ? "dir" : "file",
    sha: d.sha,
  }));
}

export async function getFile(
  path: string
): Promise<{ content: string; sha: string } | null> {
  const { owner, repo, branch } = repoInfo();
  const res = await gh(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`
  );
  if (res.status === 404) return null;
  const data = await res.json();
  if (Array.isArray(data) || typeof data.content !== "string") return null;
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

export async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const { owner, repo, branch } = repoInfo();
  await gh(`/repos/${owner}/${repo}/contents/${encodePath(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

/**
 * バイナリのファイルを置く。
 *
 * 成果物には画像とPDFがある。putFile はUTF-8として読んでしまうので、
 * 画像を通すと壊れる。base64をそのまま渡す口を分ける。
 */
export async function putBinaryFile(
  path: string,
  base64: string,
  message: string,
  sha?: string
): Promise<void> {
  const { owner, repo, branch } = repoInfo();
  await gh(`/repos/${owner}/${repo}/contents/${encodePath(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

/** バイナリのファイルを base64 のまま取り出す。画像・PDFの受け渡しに使う。 */
export async function getBinaryFile(
  path: string
): Promise<{ base64: string; sha: string; size: number } | null> {
  const { owner, repo, branch } = repoInfo();
  const res = await gh(
    `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`
  );
  if (res.status === 404) return null;
  const data = await res.json();
  if (Array.isArray(data) || typeof data.content !== "string") return null;
  return {
    base64: data.content.replace(/\n/g, ""),
    sha: data.sha,
    size: typeof data.size === "number" ? data.size : 0,
  };
}

export async function getLatestFile(
  dir: string
): Promise<{ name: string; content: string } | null> {
  const entries = await listDir(dir);
  const files = entries
    .filter((e) => e.type === "file" && e.name !== "README.md")
    .sort((a, b) => (a.name < b.name ? 1 : -1));
  if (files.length === 0) return null;
  const file = await getFile(files[0].path);
  if (!file) return null;
  return { name: files[0].name, content: file.content };
}

export async function appendToFile(
  path: string,
  textToAppend: string,
  commitMessage: string,
  headerIfNew?: string
): Promise<void> {
  const existing = await getFile(path);
  if (existing) {
    const base = existing.content.endsWith("\n")
      ? existing.content
      : `${existing.content}\n`;
    await putFile(path, base + textToAppend, commitMessage, existing.sha);
  } else {
    const header = headerIfNew ? `${headerIfNew}\n\n` : "";
    await putFile(path, header + textToAppend, commitMessage);
  }
}
