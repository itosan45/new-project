import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { parseFrontmatter } from "./lib/frontmatter.mjs";
import { scanProject } from "./lib/scan.mjs";
import { buildStructuralEdges, buildInferredEdges } from "./lib/infer.mjs";
import { validateGraph } from "./lib/validate.mjs";

test("parseFrontmatter splits meta and body", () => {
  const raw = "---\ntitle: 例のメモ\ntags: [a, b]\n---\n本文です\n";
  const { meta, body } = parseFrontmatter(raw);
  assert.equal(meta.title, "例のメモ");
  assert.deepEqual(meta.tags, ["a", "b"]);
  assert.equal(body.trim(), "本文です");
});

test("parseFrontmatter handles files with no frontmatter", () => {
  const { meta, body } = parseFrontmatter("ただのメモ\n");
  assert.deepEqual(meta, {});
  assert.equal(body, "ただのメモ\n");
});

test("validateGraph catches duplicate ids and dangling edges", () => {
  const nodes = [
    { id: "notes/a.md", title: "a" },
    { id: "notes/a.md", title: "a-dup" },
  ];
  const edges = [{ from: "notes/a.md", to: "notes/missing.md", type: "RELATES_TO" }];
  const { errors } = validateGraph(nodes, edges);
  assert.ok(errors.some((e) => e.includes("重複したノードID")));
  assert.ok(errors.some((e) => e.includes("notes/missing.md")));
});

test("validateGraph passes on a clean graph", () => {
  const nodes = [
    { id: "notes/a.md", title: "a" },
    { id: "notes/b.md", title: "b" },
  ];
  const edges = [{ from: "notes/a.md", to: "notes/b.md", type: "RELATES_TO" }];
  const { errors } = validateGraph(nodes, edges);
  assert.deepEqual(errors, []);
});

test("buildInferredEdges finds shared-tag and title-mention edges", () => {
  const nodes = [
    { id: "a", title: "経費精算ルール", tags: ["経理", "ルール"], body: "" },
    { id: "b", title: "b", tags: ["経理", "ルール"], body: "経費精算ルールについて検討した" },
  ];
  const edges = buildInferredEdges(nodes);
  assert.ok(edges.some((e) => e.type === "RELATED_TO" && e.from === "a" && e.to === "b"));
  assert.ok(edges.some((e) => e.type === "REFERENCES" && e.from === "b" && e.to === "a"));
});

test("buildStructuralEdges links department notes to their department", () => {
  const nodes = [
    { id: "departments/marketing", type: "department" },
    { id: "departments/marketing/notes/2026-08-01.md", type: "note", department: "departments/marketing" },
  ];
  const edges = buildStructuralEdges(nodes);
  assert.deepEqual(edges, [
    {
      from: "departments/marketing/notes/2026-08-01.md",
      to: "departments/marketing",
      type: "BELONGS_TO",
      source: "structural",
      confidence: 1.0,
      evidence: null,
    },
  ]);
});

test("scanProject reads notes/decisions/tasks/outputs/references and departments", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "graph-test-"));
  try {
    await mkdir(path.join(root, "notes"), { recursive: true });
    await writeFile(
      path.join(root, "notes", "idea.md"),
      "---\ntitle: アイデア\ntags: [test]\n---\n本文\n"
    );

    await mkdir(path.join(root, "departments", "marketing", "notes"), { recursive: true });
    await writeFile(
      path.join(root, "departments", "marketing", "README.md"),
      "---\ntitle: マーケティング\n---\n役割説明\n"
    );
    await writeFile(
      path.join(root, "departments", "marketing", "notes", "2026-08-01.md"),
      "- 09:00 テスト用の記録\n"
    );

    const nodes = await scanProject(root);
    const ids = nodes.map((n) => n.id);
    assert.ok(ids.includes("notes/idea.md"));
    assert.ok(ids.includes("departments/marketing"));
    assert.ok(ids.includes("departments/marketing/notes/2026-08-01.md"));

    const dept = nodes.find((n) => n.id === "departments/marketing");
    assert.equal(dept.type, "department");
    assert.equal(dept.title, "マーケティング");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
