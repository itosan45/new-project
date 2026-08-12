const RELATION_EDGE_TYPES = {
  relatesTo: "RELATES_TO",
  basedOn: "SUPPORTED_BY",
  partOf: "PART_OF",
  reviews: "REVIEWS",
};

function edge(from, to, type, source, confidence, evidence = null) {
  return { from, to, type, source, confidence, evidence };
}

/**
 * Deterministic edges: folder structure + explicit frontmatter fields.
 * These always get confidence 1.0 because they come straight from
 * human-authored data (a file's location or its own metadata), not a guess.
 */
export function buildStructuralEdges(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = [];

  for (const node of nodes) {
    if (node.department && byId.has(node.department)) {
      edges.push(edge(node.id, node.department, "BELONGS_TO", "structural", 1.0));
    }
    if ((node.type === "note" && node.subtype === "inbox") || node.type === "log") {
      if (byId.has("secretary")) {
        edges.push(edge(node.id, "secretary", "BELONGS_TO", "structural", 1.0));
      }
    }

    for (const [field, edgeType] of Object.entries(RELATION_EDGE_TYPES)) {
      for (const targetId of node.relations?.[field] || []) {
        if (byId.has(targetId)) {
          edges.push(edge(node.id, targetId, edgeType, "frontmatter", 1.0));
        }
      }
    }

    if (node.supersedes && byId.has(node.supersedes)) {
      edges.push(edge(node.id, node.supersedes, "SUPERSEDES", "frontmatter", 1.0));
    }
  }

  return edges;
}

/**
 * Lightweight heuristic "inference" — shared tags and title mentions.
 * This is NOT a real AI call. It's a stand-in with the same shape
 * (confidence + evidence) so a real model can slot in later without
 * changing the graph format.
 */
export function buildInferredEdges(nodes) {
  const edges = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const a = nodes[i];
      const b = nodes[j];

      const sharedTags = (a.tags || []).filter((t) => (b.tags || []).includes(t));
      if (sharedTags.length >= 2) {
        edges.push(
          edge(
            a.id,
            b.id,
            "RELATED_TO",
            "inferred",
            0.5,
            `共通タグ: ${sharedTags.join(", ")}`
          )
        );
      }

      if (b.title && a.body && a.body.includes(b.title) && b.title.length >= 6) {
        edges.push(
          edge(
            a.id,
            b.id,
            "REFERENCES",
            "inferred",
            0.7,
            `本文中に「${b.title}」への言及`
          )
        );
      }
    }
  }

  return dedupe(edges);
}

function dedupe(edges) {
  const seen = new Set();
  return edges.filter((e) => {
    const key = `${e.from}|${e.to}|${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
