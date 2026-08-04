import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanProject } from "./lib/scan.mjs";
import { buildStructuralEdges, buildInferredEdges } from "./lib/infer.mjs";
import { validateGraph } from "./lib/validate.mjs";
import { renderHtml } from "./lib/render.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function stripBodyForOutput(nodes) {
  // body text is useful for inference but is already on disk; keep the
  // JSON small and avoid duplicating full file contents in graph.json.
  return nodes.map(({ body, ...rest }) => rest);
}

async function main() {
  const nodes = await scanProject(ROOT);
  const structuralEdges = buildStructuralEdges(nodes);
  const inferredEdges = buildInferredEdges(nodes);
  const edges = [...structuralEdges, ...inferredEdges];

  const { errors, warnings } = validateGraph(nodes, edges);

  const manifest = {
    generatedAt: new Date().toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    structuralEdgeCount: structuralEdges.length,
    inferredEdgeCount: inferredEdges.length,
    errors,
    warnings,
  };

  const outNodes = stripBodyForOutput(nodes);
  const graphData = { nodes: outNodes, edges, manifest };

  await mkdir(path.join(ROOT, "graph"), { recursive: true });
  await writeFile(
    path.join(ROOT, "graph", "graph.json"),
    JSON.stringify(graphData, null, 2) + "\n",
    "utf-8"
  );
  await writeFile(
    path.join(ROOT, "graph", "index.html"),
    renderHtml(graphData),
    "utf-8"
  );

  console.log(`ノード: ${nodes.length}件 / エッジ: ${edges.length}件`);
  console.log(`  うち確定的な線: ${structuralEdges.length}件, 推測の線: ${inferredEdges.length}件`);
  if (warnings.length) {
    console.log("警告:");
    for (const w of warnings) console.log("  - " + w);
  }
  if (errors.length) {
    console.error("エラー:");
    for (const e of errors) console.error("  - " + e);
    process.exitCode = 1;
    return;
  }
  console.log("書き出し完了: graph/graph.json, graph/index.html");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
