/**
 * Structural checks only. These are things that must never happen because
 * they'd make the graph itself broken (dangling reference, duplicate id).
 * Missing-but-optional metadata (no tags, no title override) is not an
 * error — it just means that file wasn't described in as much detail.
 */
export function validateGraph(nodes, edges) {
  const errors = [];
  const warnings = [];

  const idCounts = new Map();
  for (const node of nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) errors.push(`重複したノードID: ${id} (${count}件)`);
  }

  const ids = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    if (!ids.has(e.from)) errors.push(`存在しないノードを参照しています: ${e.from} (edge from)`);
    if (!ids.has(e.to)) errors.push(`存在しないノードを参照しています: ${e.to} (edge to)`);
  }

  for (const node of nodes) {
    if (node.supersedes && node.artifactId) {
      const prev = nodes.find((n) => n.id === node.supersedes);
      if (prev && prev.artifactId && prev.artifactId !== node.artifactId) {
        warnings.push(
          `${node.id} は ${node.supersedes} を supersedes していますが artifactId が異なります`
        );
      }
    }
    if (!node.title) {
      warnings.push(`${node.id} にタイトルがありません`);
    }
  }

  return { errors, warnings };
}
