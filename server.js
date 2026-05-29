/**
 * 🌍 Smart Tourist Travel Route Optimization - Backend
 * Runs Dijkstra & Prim algorithms to optimize tourist routes.
 * Includes static file serving for seamless Render deployment.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files (index.html, etc.)
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// 🔍 DIJKSTRA'S ALGORITHM (Fastest Route)
// ==========================================
function runDijkstra(nodes, edges, startNode) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const pq = [[0, startNode]]; // [cost, node]

  nodes.forEach(n => {
    dist[n] = Infinity;
    prev[n] = null;
  });
  dist[startNode] = 0;

  while (pq.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < pq.length; i++) if (pq[i][0] < pq[minIdx][0]) minIdx = i;
    const [uCost, u] = pq.splice(minIdx, 1)[0];

    if (visited.has(u)) continue;
    visited.add(u);

    edges.filter(e => e.from === u || e.to === u).forEach(e => {
      const v = e.from === u ? e.to : e.from;
      const newCost = uCost + e.cost;
      if (newCost < dist[v]) {
        dist[v] = newCost;
        prev[v] = { from: e.from, to: e.to, cost: e.cost };
        pq.push([newCost, v]);
      }
    });
  }

  const optimizedEdges = [];
  let totalCost = 0;
  Object.keys(prev).forEach(node => {
    if (prev[node]) {
      optimizedEdges.push(prev[node]);
      totalCost += prev[node].cost;
    }
  });

  return { optimizedEdges, totalCost };
}

// ==========================================
// 🌲 PRIM'S ALGORITHM (Minimum Cost Network)
// ==========================================
function runPrim(nodes, edges) {
  const visited = new Set([nodes[0]]);
  const mstEdges = [];
  let totalCost = 0;

  while (visited.size < nodes.length) {
    let minEdge = null;
    let minCost = Infinity;

    edges.forEach(e => {
      const fromVisited = visited.has(e.from) && !visited.has(e.to);
      const toVisited = !visited.has(e.from) && visited.has(e.to);
      
      if ((fromVisited || toVisited) && e.cost < minCost) {
        minCost = e.cost;
        minEdge = e;
      }
    });

    if (!minEdge) break;
    mstEdges.push(minEdge);
    visited.add(minEdge.from);
    visited.add(minEdge.to);
    totalCost += minCost;
  }

  return { optimizedEdges: mstEdges, totalCost };
}

// ==========================================
// 🌐 API ROUTE
// ==========================================
app.post('/optimize-route', (req, res) => {
  try {
    const { algorithm, nodes, edges } = req.body;
    if (!nodes || nodes.length < 2 || !edges || edges.length === 0) {
      return res.status(400).json({ error: 'Insufficient nodes or edges provided.' });
    }

    const startNode = nodes.find(n => n.toLowerCase().includes('hotel') || n.toLowerCase().includes('airport')) || nodes[0];
    let result;

    const originalTotal = edges.reduce((sum, e) => sum + e.cost, 0);

    if (algorithm === 'dijkstra') {
      result = runDijkstra(nodes, edges, startNode);
      result.routeType = 'Fastest Travel Route';
      result.efficiency = Math.round(((originalTotal - result.totalCost) / originalTotal) * 100);
      result.estimatedTime = `${Math.ceil(result.totalCost * 4)} min`;
    } else if (algorithm === 'prim') {
      result = runPrim(nodes, edges);
      result.routeType = 'Minimum Cost Network';
      result.efficiency = Math.round(((originalTotal - result.totalCost) / originalTotal) * 100);
      result.estimatedTime = `${Math.ceil(result.totalCost * 6)} min`;
    } else {
      return res.status(400).json({ error: 'Invalid algorithm. Use "dijkstra" or "prim".' });
    }

    result.originalDistance = originalTotal;
    result.optimizedDistance = result.totalCost;
    result.timeSaved = Math.ceil((originalTotal - result.totalCost) * 5);
    result.costReduction = result.efficiency;

    res.json(result);
  } catch (err) {
    console.error('Optimization Error:', err);
    res.status(500).json({ error: 'Server failed to optimize route.' });
  }
});

// ==========================================
// 🚀 START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Smart Tourism Backend running on port ${PORT}`);
});