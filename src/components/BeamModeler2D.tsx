import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type SupportType = 'None' | 'Pinned' | 'Roller' | 'Fixed';
type LoadType = 'Point' | 'Line' | 'Area';

interface BeamNode {
  id: string;
  x: number;
  y: number;
  support: SupportType;
}

interface BeamLoad {
  id: string;
  type: LoadType;
  fromNodeId: string;
  toNodeId?: string;
  magnitude: number;
  direction: 'Down' | 'Up';
}

const makeId = () => Math.random().toString(36).slice(2, 9);

export const BeamModeler2D: React.FC = () => {
  const [nodes, setNodes] = useState<BeamNode[]>([
    { id: makeId(), x: 0, y: 0, support: 'Pinned' },
    { id: makeId(), x: 20, y: 0, support: 'Roller' },
  ]);
  const [loads, setLoads] = useState<BeamLoad[]>([]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.x - b.x), [nodes]);

  const addNode = () => {
    const nextX = sortedNodes.length ? sortedNodes[sortedNodes.length - 1].x + 10 : 0;
    setNodes((prev) => [...prev, { id: makeId(), x: nextX, y: 0, support: 'None' }]);
  };

  const updateNode = (id: string, patch: Partial<BeamNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setLoads((prev) => prev.filter((l) => l.fromNodeId !== id && l.toNodeId !== id));
  };

  const addLoad = () => {
    if (!nodes.length) return;
    setLoads((prev) => [
      ...prev,
      {
        id: makeId(),
        type: 'Point',
        fromNodeId: nodes[0].id,
        toNodeId: nodes.length > 1 ? nodes[nodes.length - 1].id : nodes[0].id,
        magnitude: 1,
        direction: 'Down',
      },
    ]);
  };

  const updateLoad = (id: string, patch: Partial<BeamLoad>) => {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLoad = (id: string) => setLoads((prev) => prev.filter((l) => l.id !== id));

  const analysis = useMemo(() => {
    if (sortedNodes.length < 2) return null;
    const left = sortedNodes[0].x;
    const right = sortedNodes[sortedNodes.length - 1].x;
    const L = right - left;
    if (L <= 0) return null;

    const pointLoads: Array<{ x: number; P: number }> = [];
    const distLoads: Array<{ x1: number; x2: number; w: number }> = [];

    for (const load of loads) {
      const n1 = nodes.find((node) => node.id === load.fromNodeId);
      if (!n1) continue;
      const sign = load.direction === 'Down' ? 1 : -1;

      if (load.type === 'Point') {
        pointLoads.push({ x: n1.x, P: sign * load.magnitude });
      } else {
        const n2 = nodes.find((node) => node.id === load.toNodeId) ?? n1;
        const x1 = Math.max(left, Math.min(n1.x, n2.x));
        const x2 = Math.min(right, Math.max(n1.x, n2.x));
        if (x2 > x1) distLoads.push({ x1, x2, w: sign * load.magnitude });
      }
    }

    const totalPoint = pointLoads.reduce((s, p) => s + p.P, 0);
    const totalDist = distLoads.reduce((s, d) => s + d.w * (d.x2 - d.x1), 0);

    const momentAboutLeft =
      pointLoads.reduce((s, p) => s + p.P * (p.x - left), 0) +
      distLoads.reduce((s, d) => s + (d.w * (d.x2 - d.x1)) * (((d.x1 + d.x2) / 2) - left), 0);

    const Rb = momentAboutLeft / L;
    const Ra = totalPoint + totalDist - Rb;

    const nPts = 120;
    const xs = Array.from({ length: nPts + 1 }, (_, i) => left + (L * i) / nPts);

    const V = xs.map((x) => {
      let v = Ra;
      pointLoads.forEach((p) => { if (p.x <= x) v -= p.P; });
      distLoads.forEach((d) => {
        const covered = Math.max(0, Math.min(x, d.x2) - d.x1);
        v -= d.w * covered;
      });
      return v;
    });

    const M: number[] = new Array(xs.length).fill(0);
    for (let i = 1; i < xs.length; i++) {
      const dx = xs[i] - xs[i - 1];
      M[i] = M[i - 1] + ((V[i - 1] + V[i]) / 2) * dx;
    }

    const maxV = Math.max(...V.map((v) => Math.abs(v)));
    const maxM = Math.max(...M.map((m) => Math.abs(m)));

    return { L, Ra, Rb, maxV, maxM };
  }, [sortedNodes, loads, nodes]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
        Beam Analysis v1.1: fixes blank-page bug, adds partial-span line/area loads, and reaction/internal force summaries.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Nodes & Supports</h3>
            <button onClick={addNode} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm"><Plus size={14} /> Node</button>
          </div>
          <div className="space-y-2">
            {sortedNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-12 gap-2 items-center text-sm border border-gray-100 rounded p-2">
                <input className="col-span-3 border rounded p-1" type="number" value={node.x} onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })} />
                <input className="col-span-2 border rounded p-1" type="number" value={node.y} onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })} />
                <select className="col-span-5 border rounded p-1" value={node.support} onChange={(e) => updateNode(node.id, { support: e.target.value as SupportType })}><option>None</option><option>Pinned</option><option>Roller</option><option>Fixed</option></select>
                <button onClick={() => removeNode(node.id)} className="col-span-2 text-red-600 flex justify-center"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Loads</h3>
            <button onClick={addLoad} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 text-white text-sm"><Plus size={14} /> Load</button>
          </div>
          <div className="space-y-2">
            {loads.length === 0 && <div className="text-sm text-gray-500">No loads added.</div>}
            {loads.map((load) => (
              <div key={load.id} className="grid grid-cols-12 gap-2 items-center text-sm border border-gray-100 rounded p-2">
                <select className="col-span-2 border rounded p-1" value={load.type} onChange={(e) => updateLoad(load.id, { type: e.target.value as LoadType })}><option>Point</option><option>Line</option><option>Area</option></select>
                <select className="col-span-3 border rounded p-1" value={load.fromNodeId} onChange={(e) => updateLoad(load.id, { fromNodeId: e.target.value })}>{sortedNodes.map((n) => <option key={n.id} value={n.id}>from x={n.x}</option>)}</select>
                {(load.type === 'Line' || load.type === 'Area') ? (
                  <select className="col-span-3 border rounded p-1" value={load.toNodeId} onChange={(e) => updateLoad(load.id, { toNodeId: e.target.value })}>{sortedNodes.map((n) => <option key={n.id} value={n.id}>to x={n.x}</option>)}</select>
                ) : <div className="col-span-3 text-xs text-gray-400">point @ node</div>}
                <input className="col-span-2 border rounded p-1" type="number" step="0.01" value={load.magnitude} onChange={(e) => updateLoad(load.id, { magnitude: Number(e.target.value) })} />
                <select className="col-span-1 border rounded p-1" value={load.direction} onChange={(e) => updateLoad(load.id, { direction: e.target.value as 'Down' | 'Up' })}><option>↓</option><option>↑</option></select>
                <button onClick={() => removeLoad(load.id)} className="col-span-1 text-red-600 flex justify-center"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-semibold text-gray-900">Results v1.1</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="p-3 rounded bg-gray-50 border">Span: <b>{analysis.L.toFixed(2)} ft</b></div>
            <div className="p-3 rounded bg-gray-50 border">RA: <b>{analysis.Ra.toFixed(2)} k</b></div>
            <div className="p-3 rounded bg-gray-50 border">RB: <b>{analysis.Rb.toFixed(2)} k</b></div>
            <div className="p-3 rounded bg-gray-50 border">|V|max: <b>{analysis.maxV.toFixed(2)} k</b></div>
            <div className="p-3 rounded bg-gray-50 border">|M|max: <b>{analysis.maxM.toFixed(2)} kip-ft</b></div>
          </div>
        </div>
      )}
    </div>
  );
};
