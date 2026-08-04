import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, titleFromBody } from "./frontmatter.mjs";

const TOP_LEVEL_TYPES = {
  notes: "note",
  decisions: "decision",
  tasks: "task",
  outputs: "output",
  references: "reference",
};

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dir) {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md") {
      files.push(path.join(dir, entry.name));
    }
  }
  return files.sort();
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function buildNodeFromFile(root, absPath, type, extra = {}) {
  const relPath = toPosix(path.relative(root, absPath));
  const raw = await readFile(absPath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    id: relPath,
    type: meta.type || type,
    path: relPath,
    title: meta.title || titleFromBody(body, path.basename(absPath)),
    createdAt: meta.date || meta.createdAt || null,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    status: meta.status || null,
    artifactId: meta.artifactId || null,
    version: typeof meta.version === "number" ? meta.version : null,
    supersedes: meta.supersedes || null,
    relations: normalizeRelations(meta),
    body,
    ...extra,
  };
}

function normalizeRelations(meta) {
  const rel = {};
  for (const key of ["relatesTo", "basedOn", "partOf", "reviews"]) {
    const value = meta[key];
    if (!value) continue;
    rel[key] = Array.isArray(value) ? value.map(String) : [String(value)];
  }
  return rel;
}

/**
 * Scans the whole project (top-level note-ish folders + secretary/ +
 * departments/) and returns a flat list of node objects.
 */
export async function scanProject(root) {
  const nodes = [];

  for (const [dir, type] of Object.entries(TOP_LEVEL_TYPES)) {
    const files = await listMarkdownFiles(path.join(root, dir));
    for (const file of files) {
      nodes.push(await buildNodeFromFile(root, file, type));
    }
  }

  // secretary/inbox -> note (subtype: inbox), secretary/logs -> log
  const inboxFiles = await listMarkdownFiles(path.join(root, "secretary", "inbox"));
  for (const file of inboxFiles) {
    nodes.push(await buildNodeFromFile(root, file, "note", { subtype: "inbox" }));
  }
  const logFiles = await listMarkdownFiles(path.join(root, "secretary", "logs"));
  for (const file of logFiles) {
    nodes.push(await buildNodeFromFile(root, file, "log"));
  }

  // departments/<name>/README.md -> department node
  // departments/<name>/rules.md -> decision (subtype: rule)
  // departments/<name>/notes/*.md -> note (subtype: department-note)
  const departmentsDir = path.join(root, "departments");
  if (await exists(departmentsDir)) {
    const entries = await readdir(departmentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDir?.() && !entry.isDirectory()) continue;
      const deptDir = path.join(departmentsDir, entry.name);
      const deptId = toPosix(path.relative(root, deptDir));

      const readmePath = path.join(deptDir, "README.md");
      if (await exists(readmePath)) {
        const raw = await readFile(readmePath, "utf-8");
        const { meta, body } = parseFrontmatter(raw);
        nodes.push({
          id: deptId,
          type: "department",
          path: toPosix(path.relative(root, readmePath)),
          title: meta.title || entry.name,
          createdAt: null,
          tags: [],
          status: null,
          artifactId: null,
          version: null,
          supersedes: null,
          relations: {},
          body,
        });
      }

      const rulesPath = path.join(deptDir, "rules.md");
      if (await exists(rulesPath)) {
        nodes.push(
          await buildNodeFromFile(root, rulesPath, "decision", {
            subtype: "rule",
            department: deptId,
          })
        );
      }

      const deptNotes = await listMarkdownFiles(path.join(deptDir, "notes"));
      for (const file of deptNotes) {
        nodes.push(
          await buildNodeFromFile(root, file, "note", {
            subtype: "department-note",
            department: deptId,
          })
        );
      }
    }
  }

  return nodes;
}
