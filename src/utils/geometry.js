export function dist(nodeA, nodeB) {
  return Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
}

export function buildGraph(nodes, edges) {
  const graph = {};
  Object.keys(nodes).forEach(n => graph[n] = []);
  edges.forEach(([a, b]) => {
    if (!nodes[a] || !nodes[b]) return; // Skip invalid edges
    const w = dist(nodes[a], nodes[b]);
    graph[a].push({ to: b, weight: w });
    graph[b].push({ to: a, weight: w });
  });
  return graph;
}

export function dijkstra(graph, start, end) {
  if (!graph[start] || !graph[end]) return [];
  const d = {};
  const prev = {};
  const visited = new Set();
  
  Object.keys(graph).forEach(n => d[n] = Infinity);
  d[start] = 0;
  
  while (visited.size < Object.keys(graph).length) {
    let cur = null;
    for (const n in d) {
      if (!visited.has(n) && (cur === null || d[n] < d[cur])) {
        cur = n;
      }
    }
    
    if (cur === null || d[cur] === Infinity) break;
    visited.add(cur);
    if (cur === end) break;
    
    graph[cur].forEach(e => {
      const nd = d[cur] + e.weight;
      if (nd < d[e.to]) {
        d[e.to] = nd;
        prev[e.to] = cur;
      }
    });
  }
  
  const path = [];
  let n = end;
  while (n) {
    path.unshift(n);
    n = prev[n];
  }
  return path[0] === start ? path : [];
}

export function bearing(nodeA, nodeB) {
  return Math.atan2(nodeB.y - nodeA.y, nodeB.x - nodeA.x);
}

export function buildSteps(path, nodes) {
  if (!path || path.length < 2) return [];
  const steps = [`Mulai dari ${nodes[path[0]].label || 'Titik Awal'}`];
  
  for (let i = 1; i < path.length - 1; i++) {
    let diff = bearing(nodes[path[i]], nodes[path[i+1]]) - bearing(nodes[path[i-1]], nodes[path[i]]);
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    
    const deg = (diff * 180) / Math.PI;
    if (Math.abs(deg) < 25) continue; // Straight
    
    steps.push(deg > 0 ? "Belok kanan" : "Belok kiri");
  }
  
  steps.push(`Sampai di ${nodes[path[path.length-1]].label || 'Tujuan'}`);
  return steps;
}
