import yaml from "js-yaml";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

/**
 * Splits a markdown file into { meta, body }.
 * Files without a `---` frontmatter block get meta = {} and the whole
 * file as body.
 */
export function parseFrontmatter(raw) {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const [, yamlBlock, body] = match;
  let meta;
  try {
    meta = yaml.load(yamlBlock) || {};
  } catch {
    meta = {};
  }
  if (typeof meta !== "object" || Array.isArray(meta)) {
    meta = {};
  }
  return { meta, body };
}

export function titleFromBody(body, fallback) {
  const heading = /^#\s+(.+)$/m.exec(body);
  if (heading) return heading[1].trim();
  const firstLine = body.split("\n").find((l) => l.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 80) : fallback;
}
