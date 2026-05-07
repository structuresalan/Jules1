import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Ruler, Activity } from 'lucide-react';

type SupportType = 'None' | 'Pinned' | 'Roller' | 'Fixed';
type LoadType = 'Point' | 'Line' | 'Area';
type LoadDirection = 'Down' | 'Up';

interface BeamNode {
  id: string;
  label: string;
  x: number;
  y: number;
  support: SupportType;
}

interface BeamLoad {
  id: string;
  type: LoadType;
  fromNodeId: string;
  toNodeId: string;
  magnitude: number;
  tributaryWidth: number;
  direction: LoadDirection;
}

interface ReactionResult {
  nodeId: string;
  label: string;
  verticalReaction: number;
  momentReaction?: number;
}

const SUPPORT_OPTIONS: SupportType[] = ['None', 'Pinned', 'Roller', 'Fixed'];
const LOAD_TYPE_OPTIONS: LoadType[] = ['Point', 'Line', 'Area'];
const DIRECTION_OPTIONS: LoadDirection[] = ['Down', 'Up'];

const makeId = () => Math.random().toString(36).slice(2, 9);
const nextNodeLabel = (count: number) => count < 26 ? String.fromCharCode(65 + count) : `N${count + 1}`;

const getLoadUnit = (load: BeamLoad) => {
  if (load.type === 'Point') return 'k';
  if (load.type === 'Line') return 'k/ft';
  return 'ksf';
};

const getLineLoad = (load: BeamLoad) => load.type === 'Area' ? load.magnitude * load.tributaryWidth : load.magnitude;

export const BeamModeler2D: React.FC = () => {
  const [nodes, setNodes] = useState<BeamNode[]>([
    { id: makeId(), label: 'A', x: 0, y: 0, support: 'Pinned' },
    { id: makeId(), label: 'B', x: 24, y: 0, support: 'Roller' },
  ]);
  const [loads, setLoads] = useState<BeamLoad[]>([]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.x - b.x), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const bounds = useMemo(() => {
    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 10);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 0);

    return {
      minX,
      maxX: maxX === minX ? minX + 10 : maxX,
      minY,
      maxY: maxY === minY ? minY + 1 : maxY,
      hasSlope: ys.some((y) => Math.abs(y - ys[0]) > 0.001),
    };
  }, [nodes]);

  const analysis = useMemo(() => {
    if (sortedNodes.length < 2) {
      return { error: 'Add at least two nodes to define a beam.', reactions: [], warnings: [] as string[] };
    }

    const pointLoads: Array<{ x: number; p: number }> = [];
    const distributedLoads: Array<{ x1: number; x2: number; w: number }> = [];
    const warnings: string[] = [];

    for (const load of loads) {
      const fromNode = nodeById.get(load.fromNodeId);
      const toNode = nodeById.get(load.toNodeId) ?? fromNode;
      if (!fromNode || !toNode || load.magnitude === 0) continue;

      const sign = load.direction === 'Down' ? 1 : -1;

      if (load.type === 'Point') {
        pointLoads.push({ x: fromNode.x, p: sign * load.magnitude });
      } else {
        const x1 = Math.min(fromNode.x, toNode.x);
        const x2 = Math.max(fromNode.x, toNode.x);
        if (x2 > x1) {
          distributedLoads.push({ x1, x2, w: sign * getLineLoad(load) });
        }
      }
    }

    const supports = sortedNodes.filter((node) => node.support !== 'None');
    if (!supports.length) {
      return { error: 'Add at least one pinned, roller, or fixed support before running reactions.', reactions: [], warnings };
    }

    const totalLoad = pointLoads.reduce((sum, load) => sum + load.p, 0)
      + distributedLoads.reduce((sum, load) => sum + load.w * (load.x2 - load.x1), 0);

    if (supports.length === 1) {
      const support = supports[0];
      if (support.support !== 'Fixed') {
        return {
          error: 'A single non-fixed support is unstable. Add another support or make the support fixed.',
          reactions: [],
          warnings,
        };
      }

      const momentReaction = pointLoads.reduce((sum, load) => sum + load.p * (load.x - support.x), 0)
        + distributedLoads.reduce((sum, load) => {
          const resultant = load.w * (load.x2 - load.x1);
          const centroid = (load.x1 + load.x2) / 2;
          return sum + resultant * (centroid - support.x);
        }, 0);

      warnings.push('Single fixed support is treated as a cantilever vertical-equilibrium model. Deflection and fixed-end stiffness are not solved yet.');
      if (bounds.hasSlope) warnings.push('Y coordinates are drawn in the modeler; vertical-load analysis currently uses the x-projection.');

      return {
        reactions: [{ nodeId: support.id, label: support.label, verticalReaction: totalLoad, momentReaction }],
        span: Math.max(bounds.maxX - bounds.minX, 0),
        totalLoad,
        maxV: Math.abs(totalLoad),
        maxM: Math.abs(momentReaction),
        warnings,
      };
    }

    const leftSupport = supports[0];
    const rightSupport = supports[supports.length - 1];
    const supportSpan = rightSupport.x - leftSupport.x;

    if (supportSpan <= 0) {
      return { error: 'The left and right supports need different x coordinates.', reactions: [], warnings };
    }

    if (supports.length > 2) {
      warnings.push('More than two supports makes the beam statically indeterminate. This v2 model uses the first and last support for vertical statics.');
    }

    if (supports.some((support) => support.support === 'Fixed')) {
      warnings.push('Fixed supports are drawn and included as vertical supports, but rotational stiffness/fixed-end moments require the next analysis engine.');
    }

    if (bounds.hasSlope) {
      warnings.push('Y coordinates are drawn in the modeler; vertical-load analysis currently uses the x-projection.');
    }

    const momentAboutLeft = pointLoads.reduce((sum, load) => sum + load.p * (load.x - leftSupport.x), 0)
      + distributedLoads.reduce((sum, load) => {
        const resultant = load.w * (load.x2 - load.x1);
        const centroid = (load.x1 + load.x2) / 2;
        return sum + resultant * (centroid - leftSupport.x);
      }, 0);

    const rb = momentAboutLeft / supportSpan;
    const ra = totalLoad - rb;

    const sampleCount = 160;
    const xs = Array.from({ length: sampleCount + 1 }, (_, index) => bounds.minX + ((bounds.maxX - bounds.minX) * index) / sampleCount);

    const shearValues = xs.map((x) => {
      let shear = 0;
      if (x >= leftSupport.x) shear += ra;
      if (x >= rightSupport.x) shear += rb;

      pointLoads.forEach((load) => {
        if (x >= load.x) shear -= load.p;
      });

      distributedLoads.forEach((load) => {
        const covered = Math.max(0, Math.min(x, load.x2) - load.x1);
        shear -= load.w * covered;
      });

      return shear;
    });

    const momentValues = xs.map((x) => {
      let moment = 0;
      if (x >= leftSupport.x) moment += ra * (x - leftSupport.x);
      if (x >= rightSupport.x) moment += rb * (x - rightSupport.x);

      pointLoads.forEach((load) => {
        if (x >= load.x) moment -= load.p * (x - load.x);
      });

      distributedLoads.forEach((load) => {
        const covered = Math.max(0, Math.min(x, load.x2) - load.x1);
        if (covered > 0) {
          const centroid = load.x1 + covered / 2;
          moment -= load.w * covered * (x - centroid);
        }
      });

      return moment;
    });

    return {
      reactions: [
        { nodeId: leftSupport.id, label: leftSupport.label, verticalReaction: ra },
        { nodeId: rightSupport.id, label: rightSupport.label, verticalReaction: rb },
      ] as ReactionResult[],
      span: supportSpan,
      totalLoad,
      maxV: Math.max(...shearValues.map((value) => Math.abs(value))),
      maxM: Math.max(...momentValues.map((value) => Math.abs(value))),
      warnings,
    };
  }, [bounds, loads, nodeById, sortedNodes]);

  const addNode = () => {
    const nextX = sortedNodes.length ? sortedNodes[sortedNodes.length - 1].x + 10 : 0;
    setNodes((previous) => [
      ...previous,
      { id: makeId(), label: nextNodeLabel(previous.length), x: nextX, y: 0, support: 'None' },
    ]);
  };

  const updateNode = (id: string, patch: Partial<BeamNode>) => {
    setNodes((previous) => previous.map((node) => (node.id === id ? { ...node, ...patch } : node)));
  };

  const removeNode = (id: string) => {
    setNodes((previous) => previous.length <= 1 ? previous : previous.filter((node) => node.id !== id));
    setLoads((previous) => previous.filter((load) => load.fromNodeId !== id && load.toNodeId !== id));
  };

  const addLoad = () => {
    if (!nodes.length) return;
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];

    setLoads((previous) => [
      ...previous,
      {
        id: makeId(),
        type: 'Line',
        fromNodeId: firstNode.id,
        toNodeId: lastNode.id,
        magnitude: 1,
        tributaryWidth: 10,
        direction: 'Down',
      },
    ]);
  };

  const updateLoad = (id: string, patch: Partial<BeamLoad>) => {
    setLoads((previous) => previous.map((load) => (load.id === id ? { ...load, ...patch } : load)));
  };

  const removeLoad = (id: string) => setLoads((previous) => previous.filter((load) => load.id !== id));

  const svgWidth = 920;
  const svgHeight = 380;
  const plotLeft = 70;
  const plotRight = svgWidth - 70;
  const plotTop = 70;
  const plotBottom = svgHeight - 95;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const xRange = Math.max(bounds.maxX - bounds.minX, 1);
  const yRange = Math.max(bounds.maxY - bounds.minY, 1);
  const xToSvg = (x: number) => plotLeft + ((x - bounds.minX) / xRange) * plotWidth;
  const yToSvg = (y: number) => bounds.hasSlope
    ? plotTop + ((bounds.maxY - y) / yRange) * plotHeight
    : plotTop + plotHeight / 2;

  const renderSupport = (node: BeamNode) => {
    const x = xToSvg(node.x);
    const y = yToSvg(node.y);

    if (node.support === 'Pinned') {
      return <polygon points={`${x},${y + 6} ${x - 16},${y + 34} ${x + 16},${y + 34}`} fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />;
    }

    if (node.support === 'Roller') {
      return (
        <g>
          <polygon points={`${x},${y + 6} ${x - 16},${y + 28} ${x + 16},${y + 28}`} fill="#ecfdf5" stroke="#059669" strokeWidth="2" />
          <circle cx={x - 8} cy={y + 36} r="4" fill="#059669" />
          <circle cx={x + 8} cy={y + 36} r="4" fill="#059669" />
        </g>
      );
    }

    if (node.support === 'Fixed') {
      return (
        <g>
          <rect x={x - 9} y={y - 24} width="18" height="52" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
          {[-18, -8, 2, 12, 22].map((offset) => (
            <line key={offset} x1={x - 18} y1={y + offset} x2={x - 9} y2={y + offset - 9} stroke="#dc2626" strokeWidth="1.5" />
          ))}
        </g>
      );
    }

    return <circle cx={x} cy={y} r="6" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />;
  };

  const renderLoad = (load: BeamLoad) => {
    const fromNode = nodeById.get(load.fromNodeId);
    const toNode = nodeById.get(load.toNodeId) ?? fromNode;
    if (!fromNode || !toNode) return null;

    const yOffset = load.direction === 'Down' ? -54 : 54;
    const arrowEndOffset = load.direction === 'Down' ? -10 : 10;
    const labelOffset = load.direction === 'Down' ? -66 : 74;
    const color = load.type === 'Area' ? '#7c3aed' : load.type === 'Line' ? '#4f46e5' : '#ea580c';

    if (load.type === 'Point') {
      const x = xToSvg(fromNode.x);
      const y = yToSvg(fromNode.y);
      return (
        <g key={load.id}>
          <line x1={x} y1={y + yOffset} x2={x} y2={y + arrowEndOffset} stroke={color} strokeWidth="3" markerEnd="url(#beamLoadArrow)" />
          <text x={x} y={y + labelOffset} textAnchor="middle" fontSize="13" fill="#334155" fontWeight="700">
            {load.magnitude} {getLoadUnit(load)}
          </text>
        </g>
      );
    }

    const x1 = xToSvg(Math.min(fromNode.x, toNode.x));
    const x2 = xToSvg(Math.max(fromNode.x, toNode.x));
    const beamY = (yToSvg(fromNode.y) + yToSvg(toNode.y)) / 2;
    const arrowCount = Math.max(3, Math.min(9, Math.floor(Math.abs(x2 - x1) / 70)));
    const arrows = Array.from({ length: arrowCount }, (_, index) => {
      const x = x1 + ((x2 - x1) * index) / Math.max(arrowCount - 1, 1);
      return <line key={index} x1={x} y1={beamY + yOffset} x2={x} y2={beamY + arrowEndOffset} stroke={color} strokeWidth="2.5" markerEnd="url(#beamLoadArrow)" />;
    });

    return (
      <g key={load.id}>
        <rect x={x1} y={load.direction === 'Down' ? beamY + yOffset : beamY + arrowEndOffset} width={Math.max(x2 - x1, 1)} height={Math.abs(yOffset - arrowEndOffset)} fill={color} opacity="0.08" stroke={color} strokeDasharray="4 4" />
        <line x1={x1} y1={beamY + yOffset} x2={x2} y2={beamY + yOffset} stroke={color} strokeWidth="2" />
        {arrows}
        <text x={(x1 + x2) / 2} y={beamY + labelOffset} textAnchor="middle" fontSize="13" fill="#334155" fontWeight="700">
          {load.type === 'Area' ? `${load.magnitude} ksf × ${load.tributaryWidth} ft = ${getLineLoad(load).toFixed(2)} k/ft` : `${load.magnitude} k/ft`}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900">
        <div className="font-semibold">Beam Design Modeler</div>
        <p className="mt-1">
          Define 2D beam nodes with x/y coordinates, assign pinned/roller/fixed supports, and apply point, line, or area loads. The visual model is Tedds-style; the current analysis engine handles vertical load equilibrium on the beam x-projection.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Ruler size={18} className="text-blue-600" />2D Beam Layout</h3>
            <p className="text-xs text-gray-500 mt-1">Coordinates are in feet. Up/down loads are positive by selected direction.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addNode} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"><Plus size={14} />Node</button>
            <button onClick={addLoad} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Plus size={14} />Load</button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-slate-50 overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-w-[820px] w-full h-[380px]">
            <defs>
              <marker id="beamLoadArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#334155" />
              </marker>
            </defs>

            <line x1={plotLeft} y1={plotBottom + 44} x2={plotRight} y2={plotBottom + 44} stroke="#cbd5e1" strokeWidth="2" />
            <text x={plotLeft} y={plotBottom + 66} fontSize="12" fill="#64748b">x = {bounds.minX.toFixed(1)} ft</text>
            <text x={plotRight} y={plotBottom + 66} fontSize="12" fill="#64748b" textAnchor="end">x = {bounds.maxX.toFixed(1)} ft</text>

            {sortedNodes.slice(0, -1).map((node, index) => {
              const nextNode = sortedNodes[index + 1];
              return (
                <line
                  key={`${node.id}-${nextNode.id}`}
                  x1={xToSvg(node.x)}
                  y1={yToSvg(node.y)}
                  x2={xToSvg(nextNode.x)}
                  y2={yToSvg(nextNode.y)}
                  stroke="#1f2937"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              );
            })}

            {loads.map(renderLoad)}

            {sortedNodes.map((node) => (
              <g key={node.id}>
                {renderSupport(node)}
                <circle cx={xToSvg(node.x)} cy={yToSvg(node.y)} r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                <text x={xToSvg(node.x)} y={yToSvg(node.y) - 14} textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="700">
                  {node.label}
                </text>
                <text x={xToSvg(node.x)} y={yToSvg(node.y) + 55} textAnchor="middle" fontSize="11" fill="#64748b">
                  ({node.x}, {node.y})
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Nodes & Supports</h3>
            <button onClick={addNode} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100"><Plus size={14} />Node</button>
          </div>
          <div className="space-y-2">
            {sortedNodes.map((node) => (
              <div key={node.id} className="grid grid-cols-12 gap-2 items-end text-sm border border-gray-100 rounded-md p-3 hover:bg-gray-50">
                <label className="col-span-2 text-xs text-gray-500">
                  Label
                  <input className="mt-1 w-full border rounded p-1.5" value={node.label} onChange={(event) => updateNode(node.id, { label: event.target.value })} />
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  x (ft)
                  <input className="mt-1 w-full border rounded p-1.5" type="number" step="0.01" value={node.x} onChange={(event) => updateNode(node.id, { x: Number(event.target.value) })} />
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  y (ft)
                  <input className="mt-1 w-full border rounded p-1.5" type="number" step="0.01" value={node.y} onChange={(event) => updateNode(node.id, { y: Number(event.target.value) })} />
                </label>
                <label className="col-span-4 text-xs text-gray-500">
                  Support
                  <select className="mt-1 w-full border rounded p-1.5 bg-white" value={node.support} onChange={(event) => updateNode(node.id, { support: event.target.value as SupportType })}>
                    {SUPPORT_OPTIONS.map((support) => <option key={support} value={support}>{support}</option>)}
                  </select>
                </label>
                <button onClick={() => removeNode(node.id)} className="col-span-2 h-9 text-red-600 flex items-center justify-center rounded hover:bg-red-50" title="Remove node">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Loads</h3>
            <button onClick={addLoad} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100"><Plus size={14} />Load</button>
          </div>
          <div className="space-y-2">
            {loads.length === 0 && <div className="text-sm text-gray-500 border border-dashed rounded-md p-4">No loads added. Add a point, line, or area load to start the analysis.</div>}
            {loads.map((load) => (
              <div key={load.id} className="grid grid-cols-12 gap-2 items-end text-sm border border-gray-100 rounded-md p-3 hover:bg-gray-50">
                <label className="col-span-2 text-xs text-gray-500">
                  Type
                  <select className="mt-1 w-full border rounded p-1.5 bg-white" value={load.type} onChange={(event) => updateLoad(load.id, { type: event.target.value as LoadType })}>
                    {LOAD_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  From
                  <select className="mt-1 w-full border rounded p-1.5 bg-white" value={load.fromNodeId} onChange={(event) => updateLoad(load.id, { fromNodeId: event.target.value })}>
                    {sortedNodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  To
                  <select className="mt-1 w-full border rounded p-1.5 bg-white" value={load.toNodeId} disabled={load.type === 'Point'} onChange={(event) => updateLoad(load.id, { toNodeId: event.target.value })}>
                    {sortedNodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
                  </select>
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  Mag. ({getLoadUnit(load)})
                  <input className="mt-1 w-full border rounded p-1.5" type="number" step="0.01" value={load.magnitude} onChange={(event) => updateLoad(load.id, { magnitude: Number(event.target.value) })} />
                </label>
                <label className="col-span-2 text-xs text-gray-500">
                  Trib. width
                  <input className="mt-1 w-full border rounded p-1.5" type="number" step="0.1" disabled={load.type !== 'Area'} value={load.tributaryWidth} onChange={(event) => updateLoad(load.id, { tributaryWidth: Number(event.target.value) })} />
                </label>
                <label className="col-span-1 text-xs text-gray-500">
                  Dir.
                  <select className="mt-1 w-full border rounded p-1.5 bg-white" value={load.direction} onChange={(event) => updateLoad(load.id, { direction: event.target.value as LoadDirection })}>
                    {DIRECTION_OPTIONS.map((direction) => <option key={direction} value={direction}>{direction === 'Down' ? '↓' : '↑'}</option>)}
                  </select>
                </label>
                <button onClick={() => removeLoad(load.id)} className="col-span-1 h-9 text-red-600 flex items-center justify-center rounded hover:bg-red-50" title="Remove load">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-blue-600" />Analysis Summary</h3>
        {'error' in analysis && analysis.error ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{analysis.error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="p-3 rounded bg-gray-50 border">Support span: <b>{analysis.span?.toFixed(2)} ft</b></div>
              <div className="p-3 rounded bg-gray-50 border">Total vertical load: <b>{analysis.totalLoad?.toFixed(2)} k</b></div>
              <div className="p-3 rounded bg-gray-50 border">|V|max: <b>{analysis.maxV?.toFixed(2)} k</b></div>
              <div className="p-3 rounded bg-gray-50 border">|M|max: <b>{analysis.maxM?.toFixed(2)} kip-ft</b></div>
              <div className="p-3 rounded bg-gray-50 border">Nodes: <b>{nodes.length}</b></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {analysis.reactions.map((reaction) => (
                <div key={reaction.nodeId} className="rounded-md border border-blue-100 bg-blue-50 p-3 text-blue-950">
                  <div className="font-semibold">Reaction at Node {reaction.label}</div>
                  <div>R<sub>y</sub> = {reaction.verticalReaction.toFixed(2)} k</div>
                  {reaction.momentReaction !== undefined && <div>M = {reaction.momentReaction.toFixed(2)} kip-ft</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {analysis.warnings.length > 0 && (
          <div className="space-y-2">
            {analysis.warnings.map((warning) => (
              <div key={warning} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{warning}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
