import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Plus, Trash2 } from 'lucide-react';
import wShapesData from '../data/aisc/shapes_w.json';
import aiscData from '../data/aisc/code_factors.json';
import { IBC_TO_AISC_MAP } from '../data/ibc_mapping';

type SupportType = 'None' | 'Pinned' | 'Roller' | 'Fixed';
type LoadType = 'Point' | 'Line' | 'Area';
type LoadDirection = 'Down' | 'Up';
type LoadCase = 'D' | 'L' | 'S' | 'W';
type DesignMethod = 'LRFD' | 'ASD';
type DisplayKey = 'loading' | 'moment' | 'shear' | 'deflection';
type BeamPanel = 'Design options' | 'Geometry' | 'Loading' | 'Combinations' | 'Deflection criteria' | 'Output options';

interface BeamNode {
  id: string;
  x: number;
  support: SupportType;
}

interface BeamLoad {
  id: string;
  type: LoadType;
  loadCase: LoadCase;
  fromNodeId: string;
  toNodeId: string;
  magnitude: number;
  tributaryWidth: number;
  direction: LoadDirection;
}

interface PointLoadAnalysis {
  x: number;
  p: number;
  label: string;
}

interface DistributedLoadAnalysis {
  x1: number;
  x2: number;
  w: number;
  label: string;
}

const shapes = wShapesData as Record<string, { A: number; Zx: number }>;
const shapeNames = Object.keys(shapes);
const designPanels: BeamPanel[] = ['Design options', 'Geometry', 'Loading', 'Combinations', 'Deflection criteria', 'Output options'];

const makeId = () => Math.random().toString(36).slice(2, 9);

const supportLabel = (support: SupportType) => {
  if (support === 'Pinned') return 'Pin';
  if (support === 'Roller') return 'Roller';
  if (support === 'Fixed') return 'Fixed';
  return 'Free';
};

const loadUnit = (load: BeamLoad) => {
  if (load.type === 'Point') return 'k';
  if (load.type === 'Line') return 'k/ft';
  return 'psf';
};

const loadToLineMagnitude = (load: BeamLoad) => {
  if (load.type === 'Area') return (load.magnitude * load.tributaryWidth) / 1000;
  return load.magnitude;
};

const formatRatio = (value: number) => (Number.isFinite(value) ? value.toFixed(3) : '0.000');

export const BeamModeler2D: React.FC = () => {
  const [ibcYear, setIbcYear] = useState('IBC 2018');
  const [aiscYear, setAiscYear] = useState(IBC_TO_AISC_MAP['IBC 2018']);
  const [isOverridden, setIsOverridden] = useState(false);
  const [method, setMethod] = useState<DesignMethod>('LRFD');
  const [section, setSection] = useState(shapeNames[1] ?? shapeNames[0] ?? 'W12X26');
  const [fy, setFy] = useState(50);
  const [unbracedLength, setUnbracedLength] = useState(20);
  const [deflectionLimit, setDeflectionLimit] = useState(360);
  const [totalDeflectionLimit, setTotalDeflectionLimit] = useState(240);
  const [includeModel, setIncludeModel] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);

  const [activePanel, setActivePanel] = useState<BeamPanel>('Design options');
  const [displayOptions, setDisplayOptions] = useState<Record<DisplayKey, boolean>>({
    loading: true,
    moment: true,
    shear: false,
    deflection: false,
  });

  const [loadFactors, setLoadFactors] = useState<Record<LoadCase, number>>({
    D: 1.2,
    L: 1.6,
    S: 1.0,
    W: 1.0,
  });

  const [nodes, setNodes] = useState<BeamNode[]>([
    { id: makeId(), x: 0, support: 'Pinned' },
    { id: makeId(), x: 30, support: 'Roller' },
  ]);

  const [loads, setLoads] = useState<BeamLoad[]>([]);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.x - b.x), [nodes]);
  const selectedShape = shapes[section] ?? shapes[shapeNames[0]] ?? { A: 10, Zx: 50 };
  const aiscFactors = (aiscData as Record<string, typeof aiscData['AISC 360-16']>)[aiscYear] ?? aiscData['AISC 360-16'];

  const addNode = () => {
    const lastX = sortedNodes.length ? sortedNodes[sortedNodes.length - 1].x : 0;
    setNodes((prev) => [...prev, { id: makeId(), x: lastX + 10, support: 'None' }]);
  };

  const updateNode = (id: string, patch: Partial<BeamNode>) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...patch } : node)));
  };

  const removeNode = (id: string) => {
    if (nodes.length <= 2) return;
    const replacementNodeId = nodes.find((node) => node.id !== id)?.id ?? id;
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setLoads((prev) =>
      prev.map((load) => ({
        ...load,
        fromNodeId: load.fromNodeId === id ? replacementNodeId : load.fromNodeId,
        toNodeId: load.toNodeId === id ? replacementNodeId : load.toNodeId,
      })),
    );
  };

  const addLoad = () => {
    if (!sortedNodes.length) return;
    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];
    setLoads((prev) => [
      ...prev,
      {
        id: makeId(),
        type: 'Point',
        loadCase: 'D',
        fromNodeId: firstNode.id,
        toNodeId: lastNode.id,
        magnitude: 5,
        tributaryWidth: 10,
        direction: 'Down',
      },
    ]);
  };

  const updateLoad = (id: string, patch: Partial<BeamLoad>) => {
    setLoads((prev) => prev.map((load) => (load.id === id ? { ...load, ...patch } : load)));
  };

  const removeLoad = (id: string) => setLoads((prev) => prev.filter((load) => load.id !== id));

  const updateLoadFactor = (loadCase: LoadCase, value: number) => {
    setLoadFactors((prev) => ({ ...prev, [loadCase]: value }));
  };

  const analysis = useMemo(() => {
    if (sortedNodes.length < 2) return null;

    const beamStart = sortedNodes[0].x;
    const beamEnd = sortedNodes[sortedNodes.length - 1].x;
    const fullLength = beamEnd - beamStart;
    if (fullLength <= 0) return null;

    const restrainedNodes = sortedNodes.filter((node) => node.support !== 'None');
    const leftSupport = restrainedNodes[0] ?? sortedNodes[0];
    const rightSupport = restrainedNodes[restrainedNodes.length - 1] ?? sortedNodes[sortedNodes.length - 1];
    const reactionLength = rightSupport.x - leftSupport.x;
    if (reactionLength <= 0) return null;

    const pointLoads: PointLoadAnalysis[] = [];
    const distributedLoads: DistributedLoadAnalysis[] = [];

    loads.forEach((load) => {
      const fromNode = nodes.find((node) => node.id === load.fromNodeId);
      const toNode = nodes.find((node) => node.id === load.toNodeId) ?? fromNode;
      if (!fromNode || !toNode) return;

      const sign = load.direction === 'Down' ? 1 : -1;
      const factor = loadFactors[load.loadCase];
      const caseLabel = `${load.loadCase}${factor !== 1 ? `×${factor.toFixed(2)}` : ''}`;

      if (load.type === 'Point') {
        pointLoads.push({ x: fromNode.x, p: sign * load.magnitude * factor, label: caseLabel });
      } else {
        const x1 = Math.max(beamStart, Math.min(fromNode.x, toNode.x));
        const x2 = Math.min(beamEnd, Math.max(fromNode.x, toNode.x));
        const lineMagnitude = loadToLineMagnitude(load);
        if (x2 > x1) {
          distributedLoads.push({ x1, x2, w: sign * lineMagnitude * factor, label: caseLabel });
        }
      }
    });

    const totalPointLoad = pointLoads.reduce((sum, load) => sum + load.p, 0);
    const totalDistributedLoad = distributedLoads.reduce((sum, load) => sum + load.w * (load.x2 - load.x1), 0);
    const totalVerticalLoad = totalPointLoad + totalDistributedLoad;

    const momentAboutLeftSupport =
      pointLoads.reduce((sum, load) => sum + load.p * (load.x - leftSupport.x), 0) +
      distributedLoads.reduce((sum, load) => sum + load.w * (load.x2 - load.x1) * ((load.x1 + load.x2) / 2 - leftSupport.x), 0);

    const rb = momentAboutLeftSupport / reactionLength;
    const ra = totalVerticalLoad - rb;

    const sampleCount = 160;
    const xs = Array.from({ length: sampleCount + 1 }, (_, index) => beamStart + (fullLength * index) / sampleCount);

    const shear = xs.map((x) => {
      let value = 0;
      if (leftSupport.x <= x) value += ra;
      if (rightSupport.x <= x) value += rb;

      pointLoads.forEach((load) => {
        if (load.x <= x) value -= load.p;
      });

      distributedLoads.forEach((load) => {
        const coveredLength = Math.max(0, Math.min(x, load.x2) - load.x1);
        value -= load.w * coveredLength;
      });

      return value;
    });

    const moment: number[] = new Array(xs.length).fill(0);
    for (let index = 1; index < xs.length; index += 1) {
      const dx = xs[index] - xs[index - 1];
      moment[index] = moment[index - 1] + ((shear[index - 1] + shear[index]) / 2) * dx;
    }

    const maxShear = Math.max(...shear.map((value) => Math.abs(value)), 0);
    const maxMoment = Math.max(...moment.map((value) => Math.abs(value)), 0);
    const deflectionShape = moment.map((value) => (maxMoment > 0 ? value / maxMoment : 0));

    return {
      beamStart,
      beamEnd,
      fullLength,
      leftSupport,
      rightSupport,
      pointLoads,
      distributedLoads,
      xs,
      shear,
      moment,
      deflectionShape,
      ra,
      rb,
      maxShear,
      maxMoment,
      totalVerticalLoad,
    };
  }, [sortedNodes, loads, nodes, loadFactors]);

  const nominalMoment = (fy * selectedShape.Zx) / 12;
  const designMoment = method === 'LRFD' ? aiscFactors.phi_b * nominalMoment : nominalMoment / aiscFactors.omega_b;
  const nominalShear = 0.6 * fy * selectedShape.A;
  const designShear = method === 'LRFD' ? aiscFactors.phi_b * nominalShear : nominalShear / aiscFactors.omega_b;
  const momentUtilization = analysis ? analysis.maxMoment / Math.max(designMoment, 0.001) : 0;
  const shearUtilization = analysis ? analysis.maxShear / Math.max(designShear, 0.001) : 0;
  const controllingUtilization = Math.max(momentUtilization, shearUtilization);
  const isPassing = controllingUtilization <= 1;
  const liveDeflectionLimit = analysis ? (analysis.fullLength * 12) / Math.max(deflectionLimit, 1) : 0;
  const totalServiceDeflectionLimit = analysis ? (analysis.fullLength * 12) / Math.max(totalDeflectionLimit, 1) : 0;

  const xToSvg = (x: number, width: number, start: number, length: number) => 80 + ((x - start) / Math.max(length, 1)) * (width - 160);

  const renderSupport = (node: BeamNode, x: number, y: number) => {
    if (node.support === 'None') {
      return <circle cx={x} cy={y} r="4" fill="#94a3b8" />;
    }

    if (node.support === 'Fixed') {
      return (
        <g>
          <rect x={x - 7} y={y - 32} width="14" height="32" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          {[0, 1, 2, 3].map((index) => (
            <line key={index} x1={x - 11} y1={y - 28 + index * 8} x2={x - 1} y2={y - 36 + index * 8} stroke="#2563eb" strokeWidth="1.5" />
          ))}
        </g>
      );
    }

    if (node.support === 'Pinned') {
      return (
        <g>
          <polygon points={`${x},${y - 2} ${x - 14},${y + 22} ${x + 14},${y + 22}`} fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          <line x1={x - 18} y1={y + 24} x2={x + 18} y2={y + 24} stroke="#2563eb" strokeWidth="2" />
        </g>
      );
    }

    return (
      <g>
        <polygon points={`${x},${y - 2} ${x - 14},${y + 18} ${x + 14},${y + 18}`} fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
        <circle cx={x - 8} cy={y + 24} r="4" fill="#16a34a" />
        <circle cx={x + 8} cy={y + 24} r="4" fill="#16a34a" />
      </g>
    );
  };

  const renderDiagram = () => {
    const width = 940;
    const height = 320;
    const beamY = 132;
    const resultBaseY = 244;
    const start = analysis?.beamStart ?? sortedNodes[0]?.x ?? 0;
    const end = analysis?.beamEnd ?? sortedNodes[sortedNodes.length - 1]?.x ?? 30;
    const length = Math.max(end - start, 1);
    const momentPeak = Math.max(...(analysis?.moment.map((value) => Math.abs(value)) ?? [0]), 1);
    const shearPeak = Math.max(...(analysis?.shear.map((value) => Math.abs(value)) ?? [0]), 1);

    const momentPoints = analysis
      ? analysis.xs.map((x, index) => `${xToSvg(x, width, start, length)},${resultBaseY - (analysis.moment[index] / momentPeak) * 58}`).join(' ')
      : '';

    const shearPoints = analysis
      ? analysis.xs.map((x, index) => `${xToSvg(x, width, start, length)},${resultBaseY - (analysis.shear[index] / shearPeak) * 58}`).join(' ')
      : '';

    const deflectionPoints = analysis
      ? analysis.xs.map((x, index) => `${xToSvg(x, width, start, length)},${resultBaseY + 24 + analysis.deflectionShape[index] * 42}`).join(' ')
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[380px] w-full min-w-[760px]">
        <defs>
          <marker id="beamLoadArrow" markerWidth="8" markerHeight="8" refX="4" refY="7" orient="auto">
            <polygon points="0 0, 8 0, 4 8" fill="#2563eb" />
          </marker>
          <linearGradient id="beamGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>

        <rect x="24" y="24" width={width - 48} height={height - 48} rx="14" fill="#f8fafc" stroke="#e2e8f0" />
        <line x1="60" y1={beamY} x2={width - 60} y2={beamY} stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        <line x1="60" y1={beamY + 1} x2={width - 60} y2={beamY + 1} stroke="url(#beamGradient)" strokeWidth="2" strokeLinecap="round" />

        {sortedNodes.map((node) => {
          const x = xToSvg(node.x, width, start, length);
          return (
            <g key={node.id}>
              {renderSupport(node, x, beamY)}
              <line x1={x} y1={beamY - 12} x2={x} y2={beamY + 38} stroke="#cbd5e1" strokeDasharray="4,4" />
              <text x={x} y={beamY + 52} fontSize="12" textAnchor="middle" fill="#475569" fontFamily="monospace">
                x={node.x.toFixed(1)} ft
              </text>
              <text x={x} y={beamY + 68} fontSize="11" textAnchor="middle" fill="#64748b">
                {supportLabel(node.support)}
              </text>
            </g>
          );
        })}

        {displayOptions.loading && analysis?.distributedLoads.map((load, index) => {
          const x1 = xToSvg(load.x1, width, start, length);
          const x2 = xToSvg(load.x2, width, start, length);
          const topY = load.w >= 0 ? 54 : 164;
          const arrowEndY = load.w >= 0 ? beamY - 8 : beamY + 8;
          return (
            <g key={`dist-${index}`}>
              <rect x={x1} y={Math.min(topY, arrowEndY)} width={Math.max(x2 - x1, 1)} height={Math.abs(arrowEndY - topY)} fill="#2563eb" fillOpacity="0.08" stroke="#2563eb" strokeDasharray="3,3" />
              {Array.from({ length: Math.max(2, Math.min(9, Math.round((x2 - x1) / 58))) }, (_, arrowIndex, arrows) => {
                const arrowX = x1 + ((x2 - x1) * arrowIndex) / Math.max(arrows.length - 1, 1);
                return <line key={arrowIndex} x1={arrowX} y1={topY} x2={arrowX} y2={arrowEndY} stroke="#2563eb" strokeWidth="2" markerEnd="url(#beamLoadArrow)" />;
              })}
              <text x={(x1 + x2) / 2} y={load.w >= 0 ? 44 : 186} fontSize="12" textAnchor="middle" fill="#1d4ed8" fontWeight="700">
                {Math.abs(load.w).toFixed(2)} k/ft {load.label}
              </text>
            </g>
          );
        })}

        {displayOptions.loading && analysis?.pointLoads.map((load, index) => {
          const x = xToSvg(load.x, width, start, length);
          const y1 = load.p >= 0 ? 56 : 164;
          const y2 = load.p >= 0 ? beamY - 8 : beamY + 8;
          return (
            <g key={`point-${index}`}>
              <line x1={x} y1={y1} x2={x} y2={y2} stroke="#dc2626" strokeWidth="3" markerEnd="url(#beamLoadArrow)" />
              <text x={x} y={load.p >= 0 ? 44 : 188} fontSize="12" textAnchor="middle" fill="#b91c1c" fontWeight="700">
                {Math.abs(load.p).toFixed(2)} k {load.label}
              </text>
            </g>
          );
        })}

        {(displayOptions.moment || displayOptions.shear || displayOptions.deflection) && (
          <line x1="60" y1={resultBaseY} x2={width - 60} y2={resultBaseY} stroke="#cbd5e1" strokeDasharray="5,5" />
        )}
        {displayOptions.moment && momentPoints && (
          <>
            <polyline points={momentPoints} fill="none" stroke="#16a34a" strokeWidth="3" />
            <text x="72" y={resultBaseY - 70} fontSize="12" fill="#166534" fontWeight="700">Moment envelope</text>
          </>
        )}
        {displayOptions.shear && shearPoints && (
          <>
            <polyline points={shearPoints} fill="none" stroke="#f97316" strokeWidth="3" />
            <text x="72" y={resultBaseY - 52} fontSize="12" fill="#c2410c" fontWeight="700">Shear envelope</text>
          </>
        )}
        {displayOptions.deflection && deflectionPoints && (
          <>
            <polyline points={deflectionPoints} fill="none" stroke="#7c3aed" strokeWidth="3" />
            <text x="72" y={resultBaseY + 76} fontSize="12" fill="#6d28d9" fontWeight="700">Deflection shape</text>
          </>
        )}
      </svg>
    );
  };

  const renderPanel = () => {
    if (activePanel === 'Design options') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">
              IBC edition
              <select
                value={ibcYear}
                onChange={(event) => {
                  const year = event.target.value;
                  setIbcYear(year);
                  setAiscYear(IBC_TO_AISC_MAP[year] ?? 'AISC 360-16');
                  setIsOverridden(false);
                }}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm"
              >
                {Object.keys(IBC_TO_AISC_MAP).map((year) => <option key={year}>{year}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Steel standard
              <select
                value={aiscYear}
                onChange={(event) => {
                  setAiscYear(event.target.value);
                  setIsOverridden(event.target.value !== IBC_TO_AISC_MAP[ibcYear]);
                }}
                className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm"
              >
                <option>AISC 360-22</option>
                <option>AISC 360-16</option>
                <option>AISC 360-10</option>
                <option>AISC 360-05</option>
              </select>
            </label>
          </div>
          {isOverridden && <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Code mapping override is active.</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm font-medium text-gray-700">
              Method
              <select value={method} onChange={(event) => setMethod(event.target.value as DesignMethod)} className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm">
                <option>LRFD</option>
                <option>ASD</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">
              Selected section
              <select value={section} onChange={(event) => setSection(event.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm">
                {shapeNames.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Fy, ksi
              <input type="number" value={fy} onChange={(event) => setFy(Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Unbraced length, ft
              <input type="number" value={unbracedLength} onChange={(event) => setUnbracedLength(Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
            </label>
          </div>
        </div>
      );
    }

    if (activePanel === 'Geometry') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Define beam points by x-coordinate and support type.</div>
            <button onClick={addNode} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"><Plus size={14} /> Point</button>
          </div>
          <div className="space-y-2">
            {sortedNodes.map((node, index) => (
              <div key={node.id} className="grid grid-cols-12 items-center gap-2 rounded border border-gray-200 bg-white p-2 text-sm">
                <div className="col-span-2 font-semibold text-gray-500">P{index + 1}</div>
                <label className="col-span-4">
                  <span className="sr-only">x coordinate</span>
                  <input type="number" value={node.x} onChange={(event) => updateNode(node.id, { x: Number(event.target.value) })} className="w-full rounded border border-gray-300 p-2" />
                </label>
                <select value={node.support} onChange={(event) => updateNode(node.id, { support: event.target.value as SupportType })} className="col-span-4 rounded border border-gray-300 bg-white p-2">
                  <option>None</option>
                  <option>Pinned</option>
                  <option>Roller</option>
                  <option>Fixed</option>
                </select>
                <button onClick={() => removeNode(node.id)} disabled={nodes.length <= 2} className="col-span-2 flex justify-center rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activePanel === 'Loading') {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Add point, line, or area loads to the selected beam points.</div>
            <button onClick={addLoad} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"><Plus size={14} /> Load</button>
          </div>
          {loads.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">No loads added yet.</div>
          ) : (
            <div className="space-y-2">
              {loads.map((load, index) => (
                <div key={load.id} className="rounded border border-gray-200 bg-white p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold text-gray-700">Load {index + 1}</div>
                    <button onClick={() => removeLoad(load.id)} className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-6">
                    <select value={load.type} onChange={(event) => updateLoad(load.id, { type: event.target.value as LoadType })} className="rounded border border-gray-300 bg-white p-2">
                      <option>Point</option>
                      <option>Line</option>
                      <option>Area</option>
                    </select>
                    <select value={load.loadCase} onChange={(event) => updateLoad(load.id, { loadCase: event.target.value as LoadCase })} className="rounded border border-gray-300 bg-white p-2">
                      <option value="D">Dead</option>
                      <option value="L">Live</option>
                      <option value="S">Snow</option>
                      <option value="W">Wind</option>
                    </select>
                    <select value={load.fromNodeId} onChange={(event) => updateLoad(load.id, { fromNodeId: event.target.value })} className="rounded border border-gray-300 bg-white p-2">
                      {sortedNodes.map((node) => <option key={node.id} value={node.id}>from x={node.x}</option>)}
                    </select>
                    <select value={load.toNodeId} onChange={(event) => updateLoad(load.id, { toNodeId: event.target.value })} disabled={load.type === 'Point'} className="rounded border border-gray-300 bg-white p-2 disabled:bg-gray-100 disabled:text-gray-400">
                      {sortedNodes.map((node) => <option key={node.id} value={node.id}>to x={node.x}</option>)}
                    </select>
                    <label className="relative">
                      <span className="pointer-events-none absolute right-2 top-2 text-xs text-gray-400">{loadUnit(load)}</span>
                      <input type="number" step="0.01" value={load.magnitude} onChange={(event) => updateLoad(load.id, { magnitude: Number(event.target.value) })} className="w-full rounded border border-gray-300 p-2 pr-12" />
                    </label>
                    <select value={load.direction} onChange={(event) => updateLoad(load.id, { direction: event.target.value as LoadDirection })} className="rounded border border-gray-300 bg-white p-2">
                      <option>Down</option>
                      <option>Up</option>
                    </select>
                  </div>
                  {load.type === 'Area' && (
                    <label className="mt-2 block text-xs font-medium text-gray-600">
                      Tributary width, ft
                      <input type="number" step="0.5" value={load.tributaryWidth} onChange={(event) => updateLoad(load.id, { tributaryWidth: Number(event.target.value) })} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activePanel === 'Combinations') {
      return (
        <div className="space-y-4">
          <div className="rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">Load factors below are applied to the diagram and summary results.</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['D', 'L', 'S', 'W'] as LoadCase[]).map((loadCase) => (
              <label key={loadCase} className="text-sm font-medium text-gray-700">
                {loadCase} factor
                <input type="number" step="0.05" value={loadFactors[loadCase]} onChange={(event) => updateLoadFactor(loadCase, Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (activePanel === 'Deflection criteria') {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700">
            Live load limit, L/
            <input type="number" value={deflectionLimit} onChange={(event) => setDeflectionLimit(Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
          </label>
          <label className="text-sm font-medium text-gray-700">
            Total load limit, L/
            <input type="number" value={totalDeflectionLimit} onChange={(event) => setTotalDeflectionLimit(Number(event.target.value))} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" />
          </label>
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 sm:col-span-2">
            Current span limit previews: live {liveDeflectionLimit.toFixed(3)} in, total {totalServiceDeflectionLimit.toFixed(3)} in.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeModel} onChange={(event) => setIncludeModel(event.target.checked)} />Include beam model graphic</label>
        <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeCalculations} onChange={(event) => setIncludeCalculations(event.target.checked)} />Include calculation steps</label>
        <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeResults} onChange={(event) => setIncludeResults(event.target.checked)} />Include utilization summary</label>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-700 italic">Steel Beam Analysis & Design</h2>
            <p className="text-sm text-gray-500">2D beam workspace for supports, loads, envelopes, and section utilization.</p>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            <Download size={16} /> Preview output
          </button>
        </div>

        <div className="grid grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="overflow-x-auto p-4">{renderDiagram()}</div>
          <div className="border-t border-gray-200 bg-gray-50 p-4 xl:border-l xl:border-t-0">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Display options</div>
            <div className="space-y-2">
              {([
                ['loading', 'Loading'],
                ['moment', 'Moment'],
                ['shear', 'Shear'],
                ['deflection', 'Deflection'],
              ] as Array<[DisplayKey, string]>).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-sm">
                  <span>{label}</span>
                  <input type="checkbox" checked={displayOptions[key]} onChange={(event) => setDisplayOptions((prev) => ({ ...prev, [key]: event.target.checked }))} />
                </label>
              ))}
            </div>
            <div className="mt-4 rounded border border-gray-200 bg-white p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-900">Design span</div>
              <div>{analysis ? `${analysis.fullLength.toFixed(2)} ft` : 'Check geometry'}</div>
              <div className="mt-2 font-semibold text-gray-900">Primary supports</div>
              <div>{analysis ? `${supportLabel(analysis.leftSupport.support)} / ${supportLabel(analysis.rightSupport.support)}` : 'Check supports'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto border-b border-gray-200 bg-gray-50">
          <div className="flex min-w-max gap-1 px-3 pt-3">
            {designPanels.map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`rounded-t border px-3 py-2 text-xs font-semibold transition-colors ${activePanel === panel ? 'border-gray-200 border-b-white bg-white text-blue-700' : 'border-transparent text-gray-500 hover:bg-white hover:text-gray-800'}`}
              >
                {panel}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>{renderPanel()}</div>

          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${isPassing ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Utilization summary</div>
                {isPassing ? <CheckCircle2 className="text-green-600" size={20} /> : <AlertCircle className="text-red-600" size={20} />}
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatRatio(controllingUtilization)}</div>
              <div className={`mt-1 text-sm font-semibold ${isPassing ? 'text-green-700' : 'text-red-700'}`}>{isPassing ? 'PASS' : 'REVIEW REQUIRED'}</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-3 text-sm font-semibold text-gray-900">Selected section</div>
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 120 120" className="h-24 w-24 rounded border border-gray-200 bg-gray-50">
                  <rect x="24" y="16" width="72" height="14" rx="2" fill="#cbd5e1" stroke="#64748b" />
                  <rect x="52" y="30" width="16" height="60" fill="#cbd5e1" stroke="#64748b" />
                  <rect x="24" y="90" width="72" height="14" rx="2" fill="#cbd5e1" stroke="#64748b" />
                  <line x1="104" y1="16" x2="104" y2="104" stroke="#94a3b8" strokeDasharray="3,3" />
                  <line x1="24" y1="112" x2="96" y2="112" stroke="#94a3b8" strokeDasharray="3,3" />
                </svg>
                <div className="text-sm text-gray-700">
                  <div className="font-bold text-gray-900">{section}</div>
                  <div>Area = {selectedShape.A.toFixed(2)} in²</div>
                  <div>Zx = {selectedShape.Zx.toFixed(1)} in³</div>
                  <div>Fy = {fy.toFixed(0)} ksi</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
              <div className="mb-3 font-semibold text-gray-900">Design checks</div>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 rounded bg-gray-50 p-2"><span>Moment</span><span className="text-right">{analysis?.maxMoment.toFixed(1) ?? '0.0'} / {designMoment.toFixed(1)}</span><span className="text-right font-semibold">{formatRatio(momentUtilization)}</span></div>
                <div className="grid grid-cols-3 gap-2 rounded bg-gray-50 p-2"><span>Shear</span><span className="text-right">{analysis?.maxShear.toFixed(1) ?? '0.0'} / {designShear.toFixed(1)}</span><span className="text-right font-semibold">{formatRatio(shearUtilization)}</span></div>
                <div className="grid grid-cols-3 gap-2 rounded bg-gray-50 p-2"><span>RA</span><span className="col-span-2 text-right">{analysis?.ra.toFixed(2) ?? '0.00'} k</span></div>
                <div className="grid grid-cols-3 gap-2 rounded bg-gray-50 p-2"><span>RB</span><span className="col-span-2 text-right">{analysis?.rb.toFixed(2) ?? '0.00'} k</span></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
              Results are for preliminary review and should be checked by the engineer of record before use.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
