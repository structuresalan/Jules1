import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Plus, Printer, Trash2 } from 'lucide-react';
import wShapesData from '../data/aisc/shapes_w.json';
import aiscData from '../data/aisc/code_factors.json';

type SupportType = 'None' | 'Pinned' | 'Roller' | 'Fixed';
type LoadType = 'Point' | 'Line' | 'Area';
type LoadDirection = 'Down' | 'Up';
type DegreeOfFreedom = 'Free' | 'Fixed' | 'Spring';
type LoadCase = 'D' | 'L' | 'S' | 'W';
type DesignMethod = 'LRFD' | 'ASD';
type DisplayKey = 'loading' | 'moment' | 'shear' | 'deflection';
type BeamPanel = 'Design options' | 'Nodes' | 'Loading' | 'Combinations' | 'Deflection criteria' | 'Output options';

interface BeamNode {
  id: string;
  x: number;
  z: number;
  support: SupportType;
  dofX: DegreeOfFreedom;
  dofZ: DegreeOfFreedom;
  dofRotation: DegreeOfFreedom;
  label: string;
  coordinateSystemName: string;
  coordinateSystemAngle: number;
  springX: number;
  springZ: number;
  springRotation: number;
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
const designPanels: BeamPanel[] = ['Design options', 'Nodes', 'Loading', 'Combinations', 'Deflection criteria', 'Output options'];

const makeId = () => Math.random().toString(36).slice(2, 9);

const degreesFromSupport = (support: SupportType): Pick<BeamNode, 'dofX' | 'dofZ' | 'dofRotation'> => {
  if (support === 'Fixed') return { dofX: 'Fixed', dofZ: 'Fixed', dofRotation: 'Fixed' };
  if (support === 'Pinned') return { dofX: 'Fixed', dofZ: 'Fixed', dofRotation: 'Free' };
  if (support === 'Roller') return { dofX: 'Free', dofZ: 'Fixed', dofRotation: 'Free' };
  return { dofX: 'Free', dofZ: 'Free', dofRotation: 'Free' };
};

const supportFromDegrees = (node: Pick<BeamNode, 'dofX' | 'dofZ' | 'dofRotation'>): SupportType => {
  if (node.dofX === 'Fixed' && node.dofZ === 'Fixed' && node.dofRotation === 'Fixed') return 'Fixed';
  if (node.dofX === 'Fixed' && node.dofZ === 'Fixed') return 'Pinned';
  if (node.dofZ === 'Fixed') return 'Roller';
  return 'None';
};

const createNode = (x: number, support: SupportType = 'None'): BeamNode => ({
  id: makeId(),
  x,
  z: 0,
  support,
  ...degreesFromSupport(support),
  label: '',
  coordinateSystemName: '',
  coordinateSystemAngle: 0,
  springX: 0,
  springZ: 0,
  springRotation: 0,
});

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

interface BeamModeler2DProps {
  aiscYear?: string;
}

export const BeamModeler2D: React.FC<BeamModeler2DProps> = ({ aiscYear = 'AISC 360-16' }) => {
  const activeAiscYear = Object.prototype.hasOwnProperty.call(aiscData, aiscYear) ? aiscYear : 'AISC 360-16';
  const [method, setMethod] = useState<DesignMethod>('LRFD');
  const [section, setSection] = useState(shapeNames[1] ?? shapeNames[0] ?? 'W12X26');
  const [fy, setFy] = useState(50);
  const [unbracedLength, setUnbracedLength] = useState(20);
  const [deflectionLimit, setDeflectionLimit] = useState(360);
  const [totalDeflectionLimit, setTotalDeflectionLimit] = useState(240);
  const [includeModel, setIncludeModel] = useState(true);
  const [includeCalculations, setIncludeCalculations] = useState(true);
  const [includeResults, setIncludeResults] = useState(true);
  const [includeSelfWeight, setIncludeSelfWeight] = useState(true);
  const [showOutputPreview, setShowOutputPreview] = useState(false);
  const [reportProject, setReportProject] = useState('');
  const [reportJobRef, setReportJobRef] = useState('');
  const [reportSectionName, setReportSectionName] = useState('Steel Beam');
  const [reportSheetNumber, setReportSheetNumber] = useState('1');
  const [reportCalcBy, setReportCalcBy] = useState('');

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
    createNode(0, 'Pinned'),
    createNode(30, 'Roller'),
  ]);

  const [loads, setLoads] = useState<BeamLoad[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.x - b.x), [nodes]);
  const selectedShape = shapes[section] ?? shapes[shapeNames[0]] ?? { A: 10, Zx: 50 };
  const aiscFactors = (aiscData as Record<string, typeof aiscData['AISC 360-16']>)[activeAiscYear] ?? aiscData['AISC 360-16'];
  const sectionDepth = Math.max(Number(section.match(/W\s*(\d+(?:\.\d+)?)/i)?.[1] ?? 12), 1);
  const estimatedSx = Math.max(selectedShape.Zx * 0.87, 0.1);
  const estimatedIx = Math.max(estimatedSx * (sectionDepth / 2), selectedShape.Zx, 0.1);
  const elasticModulus = 29000;
  const selfWeightKipPerFt = (selectedShape.A * 490) / 144 / 1000;

  const addNode = () => {
    const lastX = sortedNodes.length ? sortedNodes[sortedNodes.length - 1].x : 0;
    const nextNode = createNode(lastX + 10, 'None');
    setNodes((prev) => [...prev, nextNode]);
    setSelectedNodeId(nextNode.id);
  };

  const updateNode = (id: string, patch: Partial<BeamNode>) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== id) return node;
        const next = { ...node, ...patch };
        if (patch.support) {
          return { ...next, ...degreesFromSupport(patch.support) };
        }
        if (patch.dofX || patch.dofZ || patch.dofRotation) {
          return { ...next, support: supportFromDegrees(next) };
        }
        return next;
      }),
    );
  };

  const updateNodeDegreeOfFreedom = (id: string, field: 'dofX' | 'dofZ' | 'dofRotation', value: DegreeOfFreedom) => {
    if (field === 'dofX') updateNode(id, { dofX: value });
    if (field === 'dofZ') updateNode(id, { dofZ: value });
    if (field === 'dofRotation') updateNode(id, { dofRotation: value });
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
    setSelectedNodeId((prev) => (prev === id ? replacementNodeId : prev));
  };

  const removeSelectedNode = () => {
    if (selectedNodeId) removeNode(selectedNodeId);
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

    if (includeSelfWeight) {
      const selfWeightFactor = loadFactors.D;
      distributedLoads.push({
        x1: beamStart,
        x2: beamEnd,
        w: selfWeightKipPerFt * selfWeightFactor,
        label: `Self weight D${selfWeightFactor !== 1 ? `×${selfWeightFactor.toFixed(2)}` : ''}`,
      });
    }

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
  }, [sortedNodes, loads, nodes, loadFactors, includeSelfWeight, selfWeightKipPerFt]);

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
  const reportDate = new Date().toLocaleDateString();
  const maximumDeflection = useMemo(() => {
    if (!analysis || analysis.xs.length < 2) return { value: 0, position: 0 };

    const startIn = analysis.beamStart * 12;
    const endIn = analysis.beamEnd * 12;
    const lengthIn = Math.max(endIn - startIn, 1);
    const curvature = analysis.moment.map((momentValue) => (momentValue * 12) / (elasticModulus * estimatedIx));
    const slope: number[] = new Array(analysis.xs.length).fill(0);
    const rawDeflection: number[] = new Array(analysis.xs.length).fill(0);

    for (let index = 1; index < analysis.xs.length; index += 1) {
      const dx = (analysis.xs[index] - analysis.xs[index - 1]) * 12;
      slope[index] = slope[index - 1] + ((curvature[index - 1] + curvature[index]) / 2) * dx;
      rawDeflection[index] = rawDeflection[index - 1] + ((slope[index - 1] + slope[index]) / 2) * dx;
    }

    let maxValue = 0;
    let maxPosition = analysis.beamStart;
    const endCorrection = rawDeflection[rawDeflection.length - 1];

    analysis.xs.forEach((x, index) => {
      const xIn = x * 12;
      const corrected = rawDeflection[index] - ((xIn - startIn) / lengthIn) * endCorrection;
      if (Math.abs(corrected) > Math.abs(maxValue)) {
        maxValue = corrected;
        maxPosition = x;
      }
    });

    return { value: Math.abs(maxValue), position: maxPosition };
  }, [analysis, elasticModulus, estimatedIx]);

  const deflectionUtilization = maximumDeflection.value / Math.max(totalServiceDeflectionLimit, 0.001);
  const reportElementLoads = [
    ...(includeSelfWeight ? [{ id: 'self-weight', element: 1, loadCase: 'Dead', loadType: 'Self weight', orientation: 'Global Z', description: `${selfWeightKipPerFt.toFixed(3)} kips/ft` }] : []),
    ...loads.map((load, index) => {
      const fromNode = nodes.find((node) => node.id === load.fromNodeId);
      const toNode = nodes.find((node) => node.id === load.toNodeId);
      const caseName = load.loadCase === 'D' ? 'Dead' : load.loadCase === 'L' ? 'Live' : load.loadCase === 'S' ? 'Snow' : 'Wind';
      const loadType = load.type === 'Point' ? 'Point load' : load.type === 'Line' ? 'UDL' : 'Area load';
      const location = load.type === 'Point'
        ? `${load.magnitude.toFixed(2)} ${loadUnit(load)} at ${(fromNode?.x ?? 0).toFixed(2)} ft`
        : `${load.magnitude.toFixed(2)} ${loadUnit(load)} from ${(fromNode?.x ?? 0).toFixed(2)} ft to ${(toNode?.x ?? 0).toFixed(2)} ft`;

      return {
        id: load.id,
        element: index + 1,
        loadCase: caseName,
        loadType,
        orientation: load.direction === 'Down' ? 'Global Z' : 'Global -Z',
        description: location,
      };
    }),
  ];

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
              {(() => {
                const arrowCount = Math.max(2, Math.min(9, Math.round((x2 - x1) / 58)));
                return Array.from({ length: arrowCount }, (_unused, arrowIndex) => {
                  const arrowX = x1 + ((x2 - x1) * arrowIndex) / Math.max(arrowCount - 1, 1);
                  return <line key={arrowIndex} x1={arrowX} y1={topY} x2={arrowX} y2={arrowEndY} stroke="#2563eb" strokeWidth="2" markerEnd="url(#beamLoadArrow)" />;
                });
              })()}
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
          <div className="rounded border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-700">Active steel standard</div>
            <div className="mt-1 font-semibold">{activeAiscYear}</div>
            <div className="mt-1 text-xs text-blue-700">Use the steel page selector in the top-right header to change the governing code edition.</div>
          </div>
          <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={includeSelfWeight} onChange={(event) => setIncludeSelfWeight(event.target.checked)} />
            Include member self weight as a dead load
          </label>
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

    if (activePanel === 'Nodes') {
      const dofOptions: DegreeOfFreedom[] = ['Free', 'Fixed', 'Spring'];

      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
            <button onClick={addNode} className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Plus size={16} /> Add
            </button>
            <button
              onClick={removeSelectedNode}
              disabled={!selectedNodeId || nodes.length <= 2}
              className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} /> Delete
            </button>
            <div className="ml-auto text-xs text-gray-500">Define beam nodes, restraint degrees of freedom, local coordinate settings, and optional spring stiffness.</div>
          </div>

          <div className="overflow-x-auto rounded border border-gray-300 bg-white">
            <table className="min-w-[1180px] w-full border-collapse text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="border border-gray-300 px-2 py-1" rowSpan={2}>Index</th>
                  <th className="border border-gray-300 px-2 py-1 text-center" colSpan={2}>Coordinates</th>
                  <th className="border border-gray-300 px-2 py-1 text-center" colSpan={3}>Degrees of Freedom</th>
                  <th className="border border-gray-300 px-2 py-1" rowSpan={2}>Label</th>
                  <th className="border border-gray-300 px-2 py-1 text-center" colSpan={2}>Coordinate System</th>
                  <th className="border border-gray-300 px-2 py-1 text-center" colSpan={3}>Spring Stiffness</th>
                  <th className="border border-gray-300 px-2 py-1" rowSpan={2}>Restraint Preset</th>
                </tr>
                <tr>
                  <th className="border border-gray-300 px-2 py-1">X (ft)</th>
                  <th className="border border-gray-300 px-2 py-1">Z (ft)</th>
                  <th className="border border-gray-300 px-2 py-1">X</th>
                  <th className="border border-gray-300 px-2 py-1">Z</th>
                  <th className="border border-gray-300 px-2 py-1">Rotational</th>
                  <th className="border border-gray-300 px-2 py-1">Name</th>
                  <th className="border border-gray-300 px-2 py-1">Angle (°)</th>
                  <th className="border border-gray-300 px-2 py-1">X (kips/ft)</th>
                  <th className="border border-gray-300 px-2 py-1">Z (kips/ft)</th>
                  <th className="border border-gray-300 px-2 py-1">Rot. (kip-ft/°)</th>
                </tr>
              </thead>
              <tbody>
                {sortedNodes.map((node, index) => {
                  const isSelected = selectedNodeId === node.id;
                  return (
                    <tr key={node.id} onClick={() => setSelectedNodeId(node.id)} className={`${isSelected ? 'bg-blue-50' : 'bg-white'} cursor-pointer hover:bg-blue-50/60`}>
                      <td className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700">{index + 1}</td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.x} onChange={(event) => updateNode(node.id, { x: Number(event.target.value) })} className="h-8 w-full border-0 px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.z} onChange={(event) => updateNode(node.id, { z: Number(event.target.value) })} className="h-8 w-full border-0 px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      {(['dofX', 'dofZ', 'dofRotation'] as Array<'dofX' | 'dofZ' | 'dofRotation'>).map((field) => (
                        <td key={field} className="border border-gray-300 p-0">
                          <select value={node[field]} onChange={(event) => updateNodeDegreeOfFreedom(node.id, field, event.target.value as DegreeOfFreedom)} className="h-8 w-full border-0 bg-transparent px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                            {dofOptions.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </td>
                      ))}
                      <td className="border border-gray-300 p-0">
                        <input value={node.label} onChange={(event) => updateNode(node.id, { label: event.target.value })} placeholder={`N${index + 1}`} className="h-8 w-full border-0 px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input value={node.coordinateSystemName} onChange={(event) => updateNode(node.id, { coordinateSystemName: event.target.value })} className="h-8 w-full border-0 px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.coordinateSystemAngle} onChange={(event) => updateNode(node.id, { coordinateSystemAngle: Number(event.target.value) })} className="h-8 w-full border-0 px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.springX} onChange={(event) => updateNode(node.id, { springX: Number(event.target.value) })} disabled={node.dofX !== 'Spring'} className="h-8 w-full border-0 px-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.springZ} onChange={(event) => updateNode(node.id, { springZ: Number(event.target.value) })} disabled={node.dofZ !== 'Spring'} className="h-8 w-full border-0 px-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <input type="number" value={node.springRotation} onChange={(event) => updateNode(node.id, { springRotation: Number(event.target.value) })} disabled={node.dofRotation !== 'Spring'} className="h-8 w-full border-0 px-2 text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </td>
                      <td className="border border-gray-300 p-0">
                        <select value={node.support} onChange={(event) => updateNode(node.id, { support: event.target.value as SupportType })} className="h-8 w-full border-0 bg-transparent px-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                          <option>None</option>
                          <option>Pinned</option>
                          <option>Roller</option>
                          <option>Fixed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">*</td>
                  <td className="border border-gray-300 px-2 py-1 text-gray-400" colSpan={12}>Click Add to create another node.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Use the restraint preset to quickly fill the degrees of freedom, or edit each degree of freedom directly for custom support behavior.
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
                      {sortedNodes.map((node) => <option key={node.id} value={node.id}>from {node.label || `N${sortedNodes.indexOf(node) + 1}`} x={node.x}</option>)}
                    </select>
                    <select value={load.toNodeId} onChange={(event) => updateLoad(load.id, { toNodeId: event.target.value })} disabled={load.type === 'Point'} className="rounded border border-gray-300 bg-white p-2 disabled:bg-gray-100 disabled:text-gray-400">
                      {sortedNodes.map((node) => <option key={node.id} value={node.id}>to {node.label || `N${sortedNodes.indexOf(node) + 1}`} x={node.x}</option>)}
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
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="font-medium text-gray-700">Project<input value={reportProject} onChange={(event) => setReportProject(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" placeholder="Project name" /></label>
          <label className="font-medium text-gray-700">Job Ref.<input value={reportJobRef} onChange={(event) => setReportJobRef(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" placeholder="Job reference" /></label>
          <label className="font-medium text-gray-700">Section<input value={reportSectionName} onChange={(event) => setReportSectionName(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" /></label>
          <label className="font-medium text-gray-700">Sheet no./rev.<input value={reportSheetNumber} onChange={(event) => setReportSheetNumber(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" /></label>
          <label className="font-medium text-gray-700">Calc. by<input value={reportCalcBy} onChange={(event) => setReportCalcBy(event.target.value)} className="mt-1 w-full rounded border border-gray-300 p-2 text-sm" placeholder="Initials" /></label>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeModel} onChange={(event) => setIncludeModel(event.target.checked)} />Include beam model graphic</label>
          <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeCalculations} onChange={(event) => setIncludeCalculations(event.target.checked)} />Include calculation steps</label>
          <label className="flex items-center gap-2 rounded border border-gray-200 bg-white p-3"><input type="checkbox" checked={includeResults} onChange={(event) => setIncludeResults(event.target.checked)} />Include utilization summary</label>
        </div>
      </div>
    );
  };


  const renderReportBeamDiagram = (mode: 'geometry' | 'loading' | 'moment' | 'shear' | 'deflection') => {
    const width = 760;
    const height = 150;
    const beamY = 72;
    const start = analysis?.beamStart ?? sortedNodes[0]?.x ?? 0;
    const end = analysis?.beamEnd ?? sortedNodes[sortedNodes.length - 1]?.x ?? 30;
    const length = Math.max(end - start, 1);
    const mapX = (x: number) => 60 + ((x - start) / length) * (width - 120);
    const momentPeak = Math.max(...(analysis?.moment.map((value) => Math.abs(value)) ?? [0]), 1);
    const shearPeak = Math.max(...(analysis?.shear.map((value) => Math.abs(value)) ?? [0]), 1);
    const plotBaseY = 102;

    const plotPoints = mode === 'moment' && analysis
      ? analysis.xs.map((x, index) => `${mapX(x)},${plotBaseY - (analysis.moment[index] / momentPeak) * 42}`).join(' ')
      : mode === 'shear' && analysis
        ? analysis.xs.map((x, index) => `${mapX(x)},${plotBaseY - (analysis.shear[index] / shearPeak) * 42}`).join(' ')
        : mode === 'deflection' && analysis
          ? analysis.xs.map((x, index) => `${mapX(x)},${plotBaseY + analysis.deflectionShape[index] * 30}`).join(' ')
          : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="report-diagram">
        <defs>
          <marker id={`reportArrow-${mode}`} markerWidth="7" markerHeight="7" refX="3.5" refY="6" orient="auto">
            <polygon points="0 0, 7 0, 3.5 7" fill="#111827" />
          </marker>
        </defs>
        <line x1="45" y1={beamY} x2={width - 45} y2={beamY} stroke="#111827" strokeWidth="2" />
        {sortedNodes.map((node, index) => {
          const x = mapX(node.x);
          return (
            <g key={`report-node-${node.id}`}>
              <line x1={x} y1={beamY - 8} x2={x} y2={beamY + 12} stroke="#6b7280" strokeDasharray="3,3" />
              <text x={x} y={beamY - 14} fontSize="9" textAnchor="middle" fill="#4b5563">{index + 1}</text>
              {node.support === 'Fixed' ? (
                <rect x={x - 5} y={beamY - 20} width="10" height="20" fill="none" stroke="#111827" />
              ) : node.support === 'Pinned' ? (
                <polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 18} ${x + 10},${beamY + 18}`} fill="none" stroke="#111827" />
              ) : node.support === 'Roller' ? (
                <g><polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 15} ${x + 10},${beamY + 15}`} fill="none" stroke="#111827" /><circle cx={x - 5} cy={beamY + 20} r="3" fill="none" stroke="#111827" /><circle cx={x + 5} cy={beamY + 20} r="3" fill="none" stroke="#111827" /></g>
              ) : (
                <circle cx={x} cy={beamY} r="3" fill="#111827" />
              )}
            </g>
          );
        })}
        {mode === 'loading' && analysis?.distributedLoads.map((load, index) => {
          const x1 = mapX(load.x1);
          const x2 = mapX(load.x2);
          return (
            <g key={`report-dist-${index}`}>
              <rect x={x1} y="32" width={Math.max(x2 - x1, 1)} height={beamY - 32} fill="#fed7aa" stroke="#fb923c" opacity="0.75" />
              {Array.from({ length: Math.max(2, Math.min(8, Math.round((x2 - x1) / 70))) }, (_unused, arrowIndex) => {
                const count = Math.max(2, Math.min(8, Math.round((x2 - x1) / 70)));
                const arrowX = x1 + ((x2 - x1) * arrowIndex) / Math.max(count - 1, 1);
                return <line key={arrowIndex} x1={arrowX} y1="32" x2={arrowX} y2={beamY - 4} stroke="#111827" markerEnd={`url(#reportArrow-${mode})`} />;
              })}
              <text x={(x1 + x2) / 2} y="25" fontSize="9" textAnchor="middle">{Math.abs(load.w).toFixed(2)} k/ft</text>
            </g>
          );
        })}
        {mode === 'loading' && analysis?.pointLoads.map((load, index) => {
          const x = mapX(load.x);
          return (
            <g key={`report-point-${index}`}>
              <line x1={x} y1="24" x2={x} y2={beamY - 4} stroke="#111827" strokeWidth="1.5" markerEnd={`url(#reportArrow-${mode})`} />
              <text x={x} y="16" fontSize="9" textAnchor="middle">{Math.abs(load.p).toFixed(2)} k</text>
            </g>
          );
        })}
        {plotPoints && <polyline points={plotPoints} fill="none" stroke="#111827" strokeWidth="2" />}
        {plotPoints && <line x1="45" y1={plotBaseY} x2={width - 45} y2={plotBaseY} stroke="#9ca3af" strokeDasharray="4,4" />}
        <text x="60" y="136" fontSize="9" fill="#4b5563">Length = {analysis?.fullLength.toFixed(2) ?? '0.00'} ft</text>
      </svg>
    );
  };

  const renderPrintableReport = () => (
    <div className="print-sheet">
      <div className="report-header-grid">
        <div className="report-brand">
          <div className="report-logo">SC</div>
          <div>
            <div className="report-brand-name">StrucCalc</div>
            <div className="report-muted">Steel calculation output</div>
          </div>
        </div>
        <div className="report-cell"><span>Project</span><strong>{reportProject || ' '}</strong></div>
        <div className="report-cell"><span>Job Ref.</span><strong>{reportJobRef || ' '}</strong></div>
        <div className="report-cell"><span>Section</span><strong>{reportSectionName || ' '}</strong></div>
        <div className="report-cell"><span>Sheet no./rev.</span><strong>{reportSheetNumber || ' '}</strong></div>
        <div className="report-cell"><span>Calc. by</span><strong>{reportCalcBy || ' '}</strong></div>
        <div className="report-cell"><span>Date</span><strong>{reportDate}</strong></div>
        <div className="report-cell"><span>Chk'd by</span><strong> </strong></div>
        <div className="report-cell"><span>App'd by</span><strong> </strong></div>
      </div>

      <section className="report-section report-title-section">
        <h1>STEEL BEAM ANALYSIS &amp; DESIGN (AISC 360)</h1>
        <p>In accordance with {activeAiscYear} using the {method} method</p>
      </section>

      <section className="report-section">
        <h2>ANALYSIS</h2>
        <h3>Geometry</h3>
        {includeModel && <div className="report-diagram-wrap">{renderReportBeamDiagram('geometry')}</div>}
        <table className="report-table">
          <thead><tr><th>Span</th><th>Length (ft)</th><th>Section</th><th>Start Support</th><th>End Support</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>{analysis?.fullLength.toFixed(2) ?? '0.00'}</td><td>{section}</td><td>{analysis ? supportLabel(analysis.leftSupport.support) : '-'}</td><td>{analysis ? supportLabel(analysis.rightSupport.support) : '-'}</td></tr>
            <tr><td colSpan={5}>{section}: Area {selectedShape.A.toFixed(2)} in², Plastic section modulus Zx {selectedShape.Zx.toFixed(2)} in³, estimated Ix {estimatedIx.toFixed(2)} in⁴</td></tr>
            <tr><td colSpan={5}>Steel: Density 490 lb/ft³, Young's modulus {elasticModulus.toLocaleString()} ksi, Fy {fy.toFixed(0)} ksi</td></tr>
          </tbody>
        </table>
      </section>

      <section className="report-section">
        <h3>Loading</h3>
        <p>{includeSelfWeight ? 'Self weight included' : 'Self weight not included'}</p>
        {includeModel && <div className="report-diagram-wrap">{renderReportBeamDiagram('loading')}</div>}
        <h3>Load combination factors</h3>
        <table className="report-table report-factor-table">
          <thead><tr><th>Load combination</th><th>Self Weight</th><th>Dead</th><th>Live</th><th>Snow</th><th>Wind</th></tr></thead>
          <tbody><tr><td>{method} design combination</td><td>{includeSelfWeight ? loadFactors.D.toFixed(2) : '0.00'}</td><td>{loadFactors.D.toFixed(2)}</td><td>{loadFactors.L.toFixed(2)}</td><td>{loadFactors.S.toFixed(2)}</td><td>{loadFactors.W.toFixed(2)}</td></tr></tbody>
        </table>
        <h3>Element Loads</h3>
        <table className="report-table">
          <thead><tr><th>Element</th><th>Load case</th><th>Load Type</th><th>Orientation</th><th>Description</th></tr></thead>
          <tbody>
            {reportElementLoads.length === 0 ? <tr><td colSpan={5}>No element loads entered.</td></tr> : reportElementLoads.map((load) => (
              <tr key={load.id}><td>{load.element}</td><td>{load.loadCase}</td><td>{load.loadType}</td><td>{load.orientation}</td><td>{load.description}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {includeResults && (
        <section className="report-section report-page-break">
          <h2>Results</h2>
          <h3>Forces</h3>
          <div className="report-result-grid">
            <div><strong>{analysis?.maxMoment.toFixed(2) ?? '0.00'}</strong><span>Moment envelope (kip-ft)</span></div>
            <div><strong>{analysis?.maxShear.toFixed(2) ?? '0.00'}</strong><span>Shear envelope (kips)</span></div>
            <div><strong>{maximumDeflection.value.toFixed(3)}</strong><span>Estimated deflection envelope (in)</span></div>
          </div>
          <div className="report-diagram-wrap">{renderReportBeamDiagram('moment')}</div>
          <div className="report-diagram-wrap">{renderReportBeamDiagram('shear')}</div>
          <h3>Member results</h3>
          <table className="report-table">
            <thead><tr><th>Member</th><th>Position (ft)</th><th>Local deflection (in)</th><th>Reaction A (k)</th><th>Reaction B (k)</th></tr></thead>
            <tbody><tr><td>Member 1</td><td>{maximumDeflection.position.toFixed(2)} max</td><td>{maximumDeflection.value.toFixed(3)}</td><td>{analysis?.ra.toFixed(2) ?? '0.00'}</td><td>{analysis?.rb.toFixed(2) ?? '0.00'}</td></tr></tbody>
          </table>
          <h3>Safety factors</h3>
          <table className="report-table report-compact-table">
            <tbody>
              <tr><td>Shear</td><td>{method === 'LRFD' ? `φv = ${aiscFactors.phi_b.toFixed(2)}` : `Ωv = ${aiscFactors.omega_b.toFixed(2)}`}</td></tr>
              <tr><td>Flexure</td><td>{method === 'LRFD' ? `φb = ${aiscFactors.phi_b.toFixed(2)}` : `Ωb = ${aiscFactors.omega_b.toFixed(2)}`}</td></tr>
              <tr><td>Tensile yielding</td><td>{method === 'LRFD' ? `φt = ${aiscFactors.phi_t.toFixed(2)}` : `Ωt = ${aiscFactors.omega_t.toFixed(2)}`}</td></tr>
            </tbody>
          </table>
        </section>
      )}

      {includeCalculations && (
        <section className="report-section report-page-break">
          <h2>Member 1 design</h2>
          <h3>Section details</h3>
          <div className="report-two-col">
            <div>
              <p>Section type; {section}</p>
              <p>Steel yield stress; Fy = {fy.toFixed(0)} ksi</p>
              <p>Modulus of elasticity; E = {elasticModulus.toLocaleString()} ksi</p>
              <p>Estimated section depth, d = {sectionDepth.toFixed(2)} in</p>
              <p>Area of section, A = {selectedShape.A.toFixed(2)} in²</p>
              <p>Plastic section modulus about x-axis, Zx = {selectedShape.Zx.toFixed(2)} in³</p>
              <p>Estimated second moment of area about x-axis, Ix = {estimatedIx.toFixed(2)} in⁴</p>
            </div>
            <svg viewBox="0 0 130 110" className="report-section-sketch">
              <rect x="20" y="12" width="90" height="13" fill="#e5e7eb" stroke="#111827" />
              <rect x="56" y="25" width="18" height="58" fill="#e5e7eb" stroke="#111827" />
              <rect x="20" y="83" width="90" height="13" fill="#e5e7eb" stroke="#111827" />
              <text x="65" y="106" fontSize="8" textAnchor="middle">{section}</text>
            </svg>
          </div>
          <h3>Design of members for shear</h3>
          <p>Required shear strength; Vr,x = {analysis?.maxShear.toFixed(2) ?? '0.00'} kips</p>
          <p>Nominal shear strength; Vn,x = 0.6 × Fy × A = {nominalShear.toFixed(2)} kips</p>
          <p>Design shear strength; Vc,x = {designShear.toFixed(2)} kips</p>
          <p>Vr,x / Vc,x = {formatRatio(shearUtilization)}</p>
          <p className={shearUtilization <= 1 ? 'report-pass' : 'report-fail'}>{shearUtilization <= 1 ? 'PASS - Design shear strength exceeds required shear strength' : 'FAIL - Required shear strength exceeds design shear strength'}</p>
          <h3>Design of members for flexure</h3>
          <p>Required flexural strength; Mr,x = {analysis?.maxMoment.toFixed(2) ?? '0.00'} kip-ft</p>
          <p>Nominal flexural strength; Mn,x = Fy × Zx = {nominalMoment.toFixed(2)} kip-ft</p>
          <p>Unbraced length; Lb = {unbracedLength.toFixed(2)} ft</p>
          <p>Design flexural strength; Mc,x = {designMoment.toFixed(2)} kip-ft</p>
          <p>Mr,x / Mc,x = {formatRatio(momentUtilization)}</p>
          <p className={momentUtilization <= 1 ? 'report-pass' : 'report-fail'}>{momentUtilization <= 1 ? 'PASS - Design flexural strength exceeds required flexural strength' : 'FAIL - Required flexural strength exceeds design flexural strength'}</p>
          <h3>Design of members for x-x axis deflection</h3>
          <p>Maximum deflection; δx = {maximumDeflection.value.toFixed(3)} in at {maximumDeflection.position.toFixed(2)} ft</p>
          <p>Allowable deflection; δx,Allowable = L / {totalDeflectionLimit} = {totalServiceDeflectionLimit.toFixed(3)} in</p>
          <p>δx / δx,Allowable = {formatRatio(deflectionUtilization)}</p>
          <p className={deflectionUtilization <= 1 ? 'report-pass' : 'report-fail'}>{deflectionUtilization <= 1 ? 'PASS - Design deflection is within the selected limit' : 'FAIL - Design deflection exceeds the selected limit'}</p>
          <p className="report-muted">Deflection and section-property values are preliminary estimates based on available section data and should be verified before construction use.</p>
        </section>
      )}
    </div>
  );

  const printStyles = (
    <style>{`
      .beam-print-report { display: none; }
      .beam-screen-report .print-sheet { margin: 0 auto; max-width: 8.5in; }
      .print-sheet { background: white; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.25; padding: 0.25in; }
      .report-header-grid { display: grid; grid-template-columns: 2.1fr 1.7fr 1.2fr; border: 1px solid #111827; }
      .report-brand { grid-row: span 3; display: flex; align-items: center; gap: 10px; padding: 10px; border-right: 1px solid #111827; }
      .report-logo { width: 34px; height: 28px; border: 2px solid #0369a1; color: #0369a1; display: flex; align-items: center; justify-content: center; font-weight: 800; }
      .report-brand-name { font-size: 18px; font-weight: 800; }
      .report-muted { color: #4b5563; font-size: 10px; }
      .report-cell { min-height: 34px; padding: 4px 6px; border-right: 1px solid #111827; border-bottom: 1px solid #111827; display: flex; flex-direction: column; gap: 4px; }
      .report-cell span { font-size: 9px; color: #374151; }
      .report-cell strong { min-height: 12px; font-size: 11px; }
      .report-section { border: 1px solid #111827; border-top: 0; padding: 16px 22px; break-inside: avoid; }
      .report-title-section { border-top: 1px solid #111827; margin-top: 8px; }
      .report-section h1 { margin: 0 0 8px; font-size: 15px; text-decoration: underline; }
      .report-section h2 { margin: 0 0 14px; font-size: 14px; text-decoration: underline; }
      .report-section h3 { margin: 14px 0 8px; font-size: 12px; }
      .report-table { width: 100%; border-collapse: collapse; margin: 8px 0 10px; }
      .report-table th, .report-table td { border: 1px solid #111827; padding: 3px 5px; vertical-align: top; }
      .report-table th { font-weight: 700; background: #f3f4f6; }
      .report-factor-table { max-width: 560px; }
      .report-compact-table { max-width: 360px; }
      .report-diagram-wrap { margin: 8px 0 14px; text-align: center; }
      .report-diagram { width: 100%; max-height: 170px; border: 0; }
      .report-result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
      .report-result-grid div { border: 1px solid #111827; padding: 8px; display: flex; flex-direction: column; gap: 5px; }
      .report-result-grid strong { font-size: 20px; }
      .report-two-col { display: grid; grid-template-columns: 1fr 160px; gap: 18px; align-items: start; }
      .report-section-sketch { width: 150px; height: 130px; }
      .report-pass { font-weight: 700; color: #166534; }
      .report-fail { font-weight: 700; color: #991b1b; }
      .report-page-break { break-before: page; }
      @media print {
        @page { size: letter; margin: 0.35in; }
        body * { visibility: hidden !important; }
        .beam-print-report, .beam-print-report * { visibility: visible !important; }
        .beam-print-report { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
        .print-sheet { padding: 0; font-size: 10.5px; }
        .report-section { break-inside: avoid; }
        .report-page-break { break-before: page; }
      }
    `}</style>
  );

  return (
    <div className="space-y-6">
      {printStyles}
      <div className="beam-print-report">{renderPrintableReport()}</div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-blue-700 italic">Steel Beam Analysis & Design</h2>
            <p className="text-sm text-gray-500">2D beam workspace for supports, loads, envelopes, and section utilization.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowOutputPreview((prev) => !prev)} className="inline-flex w-fit items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              <Download size={16} /> {showOutputPreview ? 'Hide output' : 'Preview output'}
            </button>
            <button onClick={() => window.print()} className="inline-flex w-fit items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Printer size={16} /> Print output
            </button>
          </div>
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

      {showOutputPreview && (
        <div className="beam-screen-report rounded-lg border border-gray-200 bg-gray-100 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Printable output preview</h3>
              <p className="text-sm text-gray-500">This is the report layout that will be sent to print.</p>
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Printer size={16} /> Print output
            </button>
          </div>
          {renderPrintableReport()}
        </div>
      )}
    </div>
  );
};
