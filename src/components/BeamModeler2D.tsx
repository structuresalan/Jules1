import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type SupportType = 'None' | 'Pinned' | 'Roller' | 'Fixed';
type LoadType = 'Point' | 'Line' | 'Area';
type LoadDirection = 'Down' | 'Up';

interface BeamNode {
  id: string;
  x: number;
  support: SupportType;
}

interface BeamLoad {
  id: string;
  type: LoadType;
  fromNodeId: string;
  toNodeId?: string;
  magnitude: number;
  tributaryWidth: number;
  direction: LoadDirection;
}

const makeId = () => Math.random().toString(36).slice(2, 9);

const supportLabel: Record<SupportType, string> = {
  None: 'Free',
  Pinned: 'Pinned',
  Roller: 'Roller',
  Fixed: 'Fixed',
};

export const BeamModeler2D: React.FC = () => {
  const [nodes, setNodes] = useState<BeamNode[]>([
    { id: makeId(), x: 0, support: 'Pinned' },
    { id: makeId(), x: 20, support: 'Roller' },
  ]);
  const [loads, setLoads] = useState<BeamLoad[]>([]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.x - b.x), [nodes]);

  const addNode = () => {
    const nextX = sortedNodes.length ? sortedNodes[sortedNodes.length - 1].x + 10 : 0;
    setNodes((prev) => [...prev, { id: makeId(), x: nextX, support: 'None' }]);
  };

  const updateNode = (id: string, patch: Partial<BeamNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const removeNode = (id: string) => {
    if (nodes.length <= 2) return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setLoads((prev) => prev.filter((l) => l.fromNodeId !== id && l.toNodeId !== id));
  };

  const addLoad = () => {
    if (!sortedNodes.length) return;
    setLoads((prev) => [
      ...prev,
      {
        id: makeId(),
        type: 'Point',
        fromNodeId: sortedNodes[0].id,
        toNodeId: sortedNodes.length > 1 ? sortedNodes[sortedNodes.length - 1].id : sortedNodes[0].id,
        magnitude: 1,
        tributaryWidth: 10,
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
    const distLoads: Array<{ x1: number; x2: number; w: number; label: string }> = [];

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
        if (x2 > x1) {
          const lineLoad = load.type === 'Area' ? (load.magnitude * load.tributaryWidth) / 1000 : load.magnitude;
          distLoads.push({
            x1,
            x2,
            w: sign * lineLoad,
            label: load.type === 'Area' ? `${lineLoad.toFixed(3)} k/ft` : `${load.magnitude} k/ft`,
          });
        }
      }
    }

    const totalPoint = pointLoads.reduce((s, p) => s + p.P, 0);
    const totalDist = distLoads.reduce((s, d) => s + d.w * (d.x2 - d.x1), 0);

    const momentAboutLeft =
      pointLoads.reduce((s, p) => s + p.P * (p.x - left), 0) +
      distLoads.reduce((s, d) => s + (d.w * (d.x2 - d.x1)) * ((d.x1 + d.x2) / 2 - left), 0);

    const Rb = momentAboutLeft / L;
    const Ra = totalPoint + totalDist - Rb;

    const nPts = 160;
    const xs = Array.from({ length: nPts + 1 }, (_, i) => left + (L * i) / nPts);

    const V = xs.map((x) => {
      let v = Ra;
      pointLoads.forEach((p) => {
        if (p.x <= x) v -= p.P;
      });
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

    return { L, Ra, Rb, maxV, maxM, pointLoads, distLoads, left, right };
  }, [sortedNodes, loads, nodes]);

  const diagram = useMemo(() => {
    if (sortedNodes.length < 2) return null;

    const left = sortedNodes[0].x;
    const right = sortedNodes[sortedNodes.length - 1].x;
    const span = Math.max(right - left, 1);
    const width = 960;
    const height = 320;
    const padX = 70;
    const beamY = 180;
    const scaleX = (x: number) => padX + ((x - left) / span) * (width - padX * 2);

    const renderSupport = (node: BeamNode) => {
      const x = scaleX(node.x);
      if (node.support === 'None') return null;

      if (node.support === 'Fixed') {
        return (
          <g key={`support-${node.id}`}>
            <rect x={x - 8} y={beamY - 38} width={16} height={76} fill="#475569" />
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1={x - 18} y1={beamY - 32 + i * 13} x2={x - 8} y2={beamY - 42 + i * 13} stroke="#64748b" strokeWidth="2" />
            ))}
          </g>
        );
      }

      const rollerCircles = node.support === 'Roller' ? (
        <>
          <circle cx={x - 12} cy={beamY + 48} r="5" fill="#64748b" />
          <circle cx={x + 12} cy={beamY + 48} r="5" fill="#64748b" />
        </>
      ) : null;

      return (
        <g key={`support-${node.id}`}>
          <path d={`M ${x} ${beamY + 8} L ${x - 24} ${beamY + 44} L ${x + 24} ${beamY + 44} Z`} fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          {rollerCircles}
          <line x1={x - 32} y1={beamY + 56} x2={x + 32} y2={beamY + 56} stroke="#94a3b8" strokeWidth="2" />
        </g>
      );
    };

    const renderPointLoads = analysis?.pointLoads.map((load, index) => {
      const x = scaleX(load.x);
      const isDown = load.P >= 0;
      const y1 = isDown ? 64 : beamY + 84;
      const y2 = isDown ? beamY - 10 : beamY + 12;
      return (
        <g key={`point-${index}`}>
          <line x1={x} y1={y1} x2={x} y2={y2} stroke="#dc2626" strokeWidth="3" markerEnd="url(#beamArrow)" />
          <text x={x} y={isDown ? 48 : beamY + 112} textAnchor="middle" fontSize="13" fontWeight="700" fill="#991b1b">
            {Math.abs(load.P).toFixed(2)} k
          </text>
        </g>
      );
    });

    const renderDistributedLoads = analysis?.distLoads.map((load, index) => {
      const x1 = scaleX(load.x1);
      const x2 = scaleX(load.x2);
      const isDown = load.w >= 0;
      const topY = isDown ? 76 : beamY + 82;
      const arrowEndY = isDown ? beamY - 10 : beamY + 12;
      const count = Math.max(3, Math.min(12, Math.round((x2 - x1) / 55)));

      return (
        <g key={`dist-${index}`}>
          <rect x={x1} y={isDown ? topY : arrowEndY} width={x2 - x1} height={Math.abs(arrowEndY - topY)} fill="#f97316" fillOpacity="0.10" stroke="#f97316" strokeDasharray="4 3" />
          {Array.from({ length: count }, (_, i) => {
            const x = x1 + ((x2 - x1) * i) / Math.max(count - 1, 1);
            return <line key={i} x1={x} y1={topY} x2={x} y2={arrowEndY} stroke="#ea580c" strokeWidth="2" markerEnd="url(#beamArrowOrange)" />;
          })}
          <text x={(x1 + x2) / 2} y={isDown ? 60 : beamY + 112} textAnchor="middle" fontSize="13" fontWeight="700" fill="#9a3412">
            {load.label}
          </text>
        </g>
      );
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[360px] w-full rounded-lg border border-gray-200 bg-white">
        <defs>
          <marker id="beamArrow" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#dc2626" />
          </marker>
          <marker id="beamArrowOrange" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="#ea580c" />
          </marker>
        </defs>

        <line x1={padX} y1={beamY} x2={width - padX} y2={beamY} stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        {renderDistributedLoads}
        {renderPointLoads}
        {sortedNodes.map(renderSupport)}

        {sortedNodes.map((node) => {
          const x = scaleX(node.x);
          return (
            <g key={`node-${node.id}`}>
              <circle cx={x} cy={beamY} r="6" fill="#2563eb" />
              <text x={x} y={beamY + 82} textAnchor="middle" fontSize="12" fill="#475569">
                x={node.x.toFixed(2)} ft
              </text>
              <text x={x} y={beamY + 98} textAnchor="middle" fontSize="11" fill="#64748b">
                {supportLabel[node.support]}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }, [analysis, sortedNodes]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <div className="font-semibold">2D Beam Design Modeler</div>
        <div>Add x-locations, assign supports, and apply point, line, or area loads for a simple vertical-load beam check.</div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        {diagram || <div className="text-sm text-gray-500">Add at least two beam points to draw the model.</div>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Beam Points & Supports</h3>
            <button type="button" onClick={addNode} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white"><Plus size={14} /> Point</button>
          </div>
          <div className="space-y-2">
            {sortedNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-12 items-center gap-2 rounded border border-gray-100 p-2 text-sm">
                <div className="col-span-2 text-xs font-semibold uppercase text-gray-500">x ft</div>
                <input className="col-span-3 rounded border p-1" type="number" step="0.01" value={node.x} onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })} />
                <select className="col-span-5 rounded border p-1" value={node.support} onChange={(e) => updateNode(node.id, { support: e.target.value as SupportType })}>
                  <option>None</option>
                  <option>Pinned</option>
                  <option>Roller</option>
                  <option>Fixed</option>
                </select>
                <button type="button" onClick={() => removeNode(node.id)} disabled={nodes.length <= 2} className="col-span-2 flex justify-center text-red-600 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Loads</h3>
            <button type="button" onClick={addLoad} className="inline-flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white"><Plus size={14} /> Load</button>
          </div>
          <div className="space-y-2">
            {loads.length === 0 && <div className="text-sm text-gray-500">No loads added.</div>}
            {loads.map((load) => (
              <div key={load.id} className="grid grid-cols-12 items-center gap-2 rounded border border-gray-100 p-2 text-sm">
                <select className="col-span-2 rounded border p-1" value={load.type} onChange={(e) => updateLoad(load.id, { type: e.target.value as LoadType })}>
                  <option>Point</option>
                  <option>Line</option>
                  <option>Area</option>
                </select>
                <select className="col-span-2 rounded border p-1" value={load.fromNodeId} onChange={(e) => updateLoad(load.id, { fromNodeId: e.target.value })}>
                  {sortedNodes.map((n) => <option key={n.id} value={n.id}>x={n.x}</option>)}
                </select>
                {load.type === 'Line' || load.type === 'Area' ? (
                  <select className="col-span-2 rounded border p-1" value={load.toNodeId} onChange={(e) => updateLoad(load.id, { toNodeId: e.target.value })}>
                    {sortedNodes.map((n) => <option key={n.id} value={n.id}>to x={n.x}</option>)}
                  </select>
                ) : <div className="col-span-2 text-xs text-gray-400">point</div>}
                <input className="col-span-2 rounded border p-1" type="number" step="0.01" value={load.magnitude} onChange={(e) => updateLoad(load.id, { magnitude: Number(e.target.value) })} title={load.type === 'Area' ? 'Area load in psf' : load.type === 'Line' ? 'Line load in k/ft' : 'Point load in kips'} />
                {load.type === 'Area' ? (
                  <input className="col-span-2 rounded border p-1" type="number" step="0.1" value={load.tributaryWidth} onChange={(e) => updateLoad(load.id, { tributaryWidth: Number(e.target.value) })} title="Tributary width in ft" />
                ) : <div className="col-span-2 text-xs text-gray-400">{load.type === 'Line' ? 'k/ft' : 'kips'}</div>}
                <select className="col-span-1 rounded border p-1" value={load.direction} onChange={(e) => updateLoad(load.id, { direction: e.target.value as LoadDirection })}>
                  <option>Down</option>
                  <option>Up</option>
                </select>
                <button type="button" onClick={() => removeLoad(load.id)} className="col-span-1 flex justify-center text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">Area loads use psf × tributary width ÷ 1000 to create an equivalent k/ft line load.</div>
        </div>
      </div>

      {analysis && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-semibold text-gray-900">Results</h3>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
            <div className="rounded border bg-gray-50 p-3">Span: <b>{analysis.L.toFixed(2)} ft</b></div>
            <div className="rounded border bg-gray-50 p-3">RA: <b>{analysis.Ra.toFixed(2)} k</b></div>
            <div className="rounded border bg-gray-50 p-3">RB: <b>{analysis.Rb.toFixed(2)} k</b></div>
            <div className="rounded border bg-gray-50 p-3">|V|max: <b>{analysis.maxV.toFixed(2)} k</b></div>
            <div className="rounded border bg-gray-50 p-3">|M|max: <b>{analysis.maxM.toFixed(2)} kip-ft</b></div>
          </div>
        </div>
      )}
    </div>
  );
};
