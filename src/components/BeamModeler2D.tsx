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
  const minX = Math.min(...sortedNodes.map((n) => n.x), 0);
  const maxX = Math.max(...sortedNodes.map((n) => n.x), 20);
  const span = Math.max(maxX - minX, 1);

  const xToPx = (x: number) => 60 + ((x - minX) / span) * 700;
  const yBeam = 120;

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
        magnitude: 1,
        direction: 'Down',
      },
    ]);
  };

  const updateLoad = (id: string, patch: Partial<BeamLoad>) => {
    setLoads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLoad = (id: string) => setLoads((prev) => prev.filter((l) => l.id !== id));

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
        2D Beam Modeler (MVP scaffold): define nodes/supports and assign point, line, or area loads.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Nodes & Supports</h3>
            <button onClick={addNode} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-600 text-white text-sm">
              <Plus size={14} /> Node
            </button>
          </div>

          <div className="space-y-2">
            {sortedNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-12 gap-2 items-center text-sm border border-gray-100 rounded p-2">
                <input className="col-span-3 border rounded p-1" type="number" value={node.x} onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })} />
                <input className="col-span-2 border rounded p-1" type="number" value={node.y} onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })} />
                <select className="col-span-5 border rounded p-1" value={node.support} onChange={(e) => updateNode(node.id, { support: e.target.value as SupportType })}>
                  <option>None</option><option>Pinned</option><option>Roller</option><option>Fixed</option>
                </select>
                <button onClick={() => removeNode(node.id)} className="col-span-2 text-red-600 flex justify-center"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Loads</h3>
            <button onClick={addLoad} className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">
              <Plus size={14} /> Load
            </button>
          </div>
          <div className="space-y-2">
            {loads.length === 0 && <div className="text-sm text-gray-500">No loads added.</div>}
            {loads.map((load) => (
              <div key={load.id} className="grid grid-cols-12 gap-2 items-center text-sm border border-gray-100 rounded p-2">
                <select className="col-span-3 border rounded p-1" value={load.type} onChange={(e) => updateLoad(load.id, { type: e.target.value as LoadType })}>
                  <option>Point</option><option>Line</option><option>Area</option>
                </select>
                <select className="col-span-3 border rounded p-1" value={load.fromNodeId} onChange={(e) => updateLoad(load.id, { fromNodeId: e.target.value })}>
                  {sortedNodes.map((n) => <option key={n.id} value={n.id}>Node x={n.x}</option>)}
                </select>
                <input className="col-span-3 border rounded p-1" type="number" step="0.01" value={load.magnitude} onChange={(e) => updateLoad(load.id, { magnitude: Number(e.target.value) })} />
                <select className="col-span-2 border rounded p-1" value={load.direction} onChange={(e) => updateLoad(load.id, { direction: e.target.value as 'Down' | 'Up' })}><option>Down</option><option>Up</option></select>
                <button onClick={() => removeLoad(load.id)} className="col-span-1 text-red-600 flex justify-center"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <h3 className="font-semibold text-gray-900 mb-3">2D Beam Sketch</h3>
        <svg viewBox="0 0 820 260" className="w-full min-w-[820px] h-auto">
          <line x1="40" y1={yBeam + 70} x2="780" y2={yBeam + 70} stroke="#cbd5e1" strokeWidth="2" />
          <line x1={xToPx(minX)} y1={yBeam} x2={xToPx(maxX)} y2={yBeam} stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />

          {sortedNodes.map((node) => {
            const x = xToPx(node.x);
            return (
              <g key={node.id}>
                <circle cx={x} cy={yBeam} r="6" fill="#2563eb" />
                <text x={x} y={yBeam + 22} textAnchor="middle" fontSize="11" fill="#334155">({node.x}, {node.y})</text>
                {node.support === 'Pinned' && <polygon points={`${x-10},${yBeam+25} ${x+10},${yBeam+25} ${x},${yBeam+8}`} fill="#475569" />}
                {node.support === 'Roller' && <g><polygon points={`${x-10},${yBeam+22} ${x+10},${yBeam+22} ${x},${yBeam+8}`} fill="#475569" /><circle cx={x-6} cy={yBeam+28} r="3" fill="#64748b" /><circle cx={x+6} cy={yBeam+28} r="3" fill="#64748b" /></g>}
                {node.support === 'Fixed' && <rect x={x-5} y={yBeam+8} width="10" height="30" fill="#475569" />}
              </g>
            );
          })}

          {loads.map((load) => {
            const n1 = nodes.find((n) => n.id === load.fromNodeId);
            if (!n1) return null;
            const x1 = xToPx(n1.x);
            const yTop = yBeam - 55;
            return (
              <g key={load.id}>
                <line x1={x1} y1={yTop} x2={x1} y2={yBeam - 8} stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#arr)" />
                <text x={x1 + 6} y={yTop - 4} fontSize="11" fill="#dc2626">{load.type} {load.magnitude}</text>
              </g>
            );
          })}
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#dc2626" />
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
};