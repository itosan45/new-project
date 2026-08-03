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
