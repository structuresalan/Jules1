import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutList,
  Link as LinkIcon,
  Map,
  MapPin,
  Maximize2,
  MousePointer2,
  Move,
  Pencil,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  deleteProjectDocument,
  duplicateProjectDocument,
  formatDocumentDate,
  getActiveProject,
  getProjectDocuments,
  renameProjectDocument,
  requestOpenProjectDocument,
  type ProjectDocument,
} from '../utils/projectDocuments';

type DocumentsView = 'list' | 'visual';
type VisualBoardTab = 'Markup' | 'Documents' | 'Measure' | 'View' | 'Review' | 'Settings';
type VisualBoardKind = 'Plan' | 'Elevation' | 'Site Photo' | 'Other';
type VisualMarkerStyle = 'Pin' | 'Arrow' | 'Box' | 'Cloud' | 'Text';
type VisualMarkerDirection = 'Up' | 'Down' | 'Left' | 'Right';
type VisualMarkerStatus = 'Pass' | 'Review' | 'Fail' | 'Draft' | 'Unknown';
type VisualMarkerSize = 'Small' | 'Medium' | 'Large';
type VisualMarkerLabelVisibility = 'Always' | 'Hover only';

interface VisualBoard {
  id: string;
  projectId: string;
  name: string;
  kind: VisualBoardKind;
  imageName: string;
  imageDataUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface VisualMarker {
  id: string;
  projectId: string;
  boardId: string;
  documentId: string;
  documentIds?: string[];
  label: string;
  notes: string;
  xPercent: number;
  yPercent: number;
  style?: VisualMarkerStyle;
  direction?: VisualMarkerDirection;
  status?: VisualMarkerStatus;
  size?: VisualMarkerSize;
  labelVisibility?: VisualMarkerLabelVisibility;
<<<<<<< HEAD
  arrowLength?: number;
  markerWidth?: number;
  markerHeight?: number;
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
  createdAt: string;
  updatedAt: string;
}

interface VisualMeasurement {
  id: string;
  projectId: string;
  boardId: string;
  label: string;
  x1Percent: number;
  y1Percent: number;
  x2Percent: number;
  y2Percent: number;
  actualLengthFt?: number;
  createdAt: string;
  updatedAt: string;
}

const VISUAL_BOARDS_STORAGE_KEY = 'struccalc.visualBoards.v1';
const VISUAL_MARKERS_STORAGE_KEY = 'struccalc.visualMarkers.v1';
const VISUAL_MEASUREMENTS_STORAGE_KEY = 'struccalc.visualMeasurements.v1';

const makeVisualBoardId = () => `visual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const makeVisualMarkerId = () => `marker_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const makeVisualMeasurementId = () => `measure_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getAllVisualBoards = (): VisualBoard[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<VisualBoard[]>(window.localStorage.getItem(VISUAL_BOARDS_STORAGE_KEY), []);
};

const writeAllVisualBoards = (boards: VisualBoard[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISUAL_BOARDS_STORAGE_KEY, JSON.stringify(boards));
};

const getProjectVisualBoards = (projectId: string) => {
  return getAllVisualBoards()
    .filter((board) => board.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const getAllVisualMarkers = (): VisualMarker[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<VisualMarker[]>(window.localStorage.getItem(VISUAL_MARKERS_STORAGE_KEY), []);
};

const writeAllVisualMarkers = (markers: VisualMarker[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISUAL_MARKERS_STORAGE_KEY, JSON.stringify(markers));
};

const getProjectVisualMarkers = (projectId: string) => {
  return getAllVisualMarkers()
    .filter((marker) => marker.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const deleteVisualMarker = (markerId: string) => {
  writeAllVisualMarkers(getAllVisualMarkers().filter((marker) => marker.id !== markerId));
};

const getAllVisualMeasurements = (): VisualMeasurement[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<VisualMeasurement[]>(window.localStorage.getItem(VISUAL_MEASUREMENTS_STORAGE_KEY), []);
};

const writeAllVisualMeasurements = (measurements: VisualMeasurement[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISUAL_MEASUREMENTS_STORAGE_KEY, JSON.stringify(measurements));
};

const getProjectVisualMeasurements = (projectId: string) => {
  return getAllVisualMeasurements()
    .filter((measurement) => measurement.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const deleteVisualMeasurement = (measurementId: string) => {
  writeAllVisualMeasurements(getAllVisualMeasurements().filter((measurement) => measurement.id !== measurementId));
};

const deleteVisualBoard = (boardId: string) => {
  writeAllVisualBoards(getAllVisualBoards().filter((board) => board.id !== boardId));
  writeAllVisualMarkers(getAllVisualMarkers().filter((marker) => marker.boardId !== boardId));
  writeAllVisualMeasurements(getAllVisualMeasurements().filter((measurement) => measurement.boardId !== boardId));
};

const getDefaultBoardName = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/u, '');
  return withoutExtension.trim() || 'Untitled Visual Board';
};

const getMarkerDocumentIds = (marker: VisualMarker | null) => {
  if (!marker) return [];

  const ids = Array.isArray(marker.documentIds) && marker.documentIds.length > 0 ? marker.documentIds : [marker.documentId];
  return Array.from(new Set(ids.filter(Boolean)));
};

const getBoardDocumentCount = (boardId: string, markers: VisualMarker[]) => {
  const documentIds = markers
    .filter((marker) => marker.boardId === boardId)
    .flatMap((marker) => getMarkerDocumentIds(marker));

  return new Set(documentIds).size;
};

const getMarkerDocuments = (marker: VisualMarker | null, documents: ProjectDocument[]) => {
  const ids = getMarkerDocumentIds(marker);
  return ids
    .map((documentId) => documents.find((document) => document.id === documentId) ?? null)
    .filter((document): document is ProjectDocument => Boolean(document));
};

const markerArrowSymbol = (direction: VisualMarkerDirection | undefined) => {
  if (direction === 'Down') return '↓';
  if (direction === 'Left') return '←';
  if (direction === 'Right') return '→';
  return '↑';
};

const normalizeMarkerStyle = (style: VisualMarker['style']): VisualMarkerStyle => style || 'Pin';
const normalizeMarkerDirection = (direction: VisualMarker['direction']): VisualMarkerDirection => direction || 'Down';
const normalizeMarkerStatus = (status: VisualMarker['status']): VisualMarkerStatus => status || 'Unknown';
const normalizeMarkerSize = (size: VisualMarker['size']): VisualMarkerSize => size || 'Medium';
const normalizeMarkerLabelVisibility = (labelVisibility: VisualMarker['labelVisibility']): VisualMarkerLabelVisibility =>
  labelVisibility || 'Always';

const getMarkerSizeConfig = (size: VisualMarkerSize) => {
  if (size === 'Small') return { arrowLength: 56, boxWidth: 74, boxHeight: 38, cloudWidth: 88, cloudHeight: 42, pinDiameter: 14, textSize: 11 };
  if (size === 'Large') return { arrowLength: 112, boxWidth: 138, boxHeight: 74, cloudWidth: 152, cloudHeight: 78, pinDiameter: 20, textSize: 14 };
  return { arrowLength: 82, boxWidth: 104, boxHeight: 56, cloudWidth: 118, cloudHeight: 60, pinDiameter: 16, textSize: 12 };
};

<<<<<<< HEAD
const clampVisualDimension = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
};

const getDefaultMarkerWidth = (style: VisualMarkerStyle, sizeConfig: ReturnType<typeof getMarkerSizeConfig>) => {
  if (style === 'Cloud') return sizeConfig.cloudWidth;
  if (style === 'Text') return 96;
  return sizeConfig.boxWidth;
};

const getDefaultMarkerHeight = (style: VisualMarkerStyle, sizeConfig: ReturnType<typeof getMarkerSizeConfig>) => {
  if (style === 'Cloud') return sizeConfig.cloudHeight;
  if (style === 'Text') return 34;
  return sizeConfig.boxHeight;
};

=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
const markerStatusColor = (status: VisualMarkerStatus) => {
  if (status === 'Pass') return '#16a34a';
  if (status === 'Review') return '#d97706';
  if (status === 'Fail') return '#dc2626';
  if (status === 'Draft') return '#6b7280';
  return '#2563eb';
};

const markerStatusFill = (status: VisualMarkerStatus) => {
  if (status === 'Pass') return 'rgba(220, 252, 231, 0.96)';
  if (status === 'Review') return 'rgba(254, 243, 199, 0.96)';
  if (status === 'Fail') return 'rgba(254, 226, 226, 0.96)';
  if (status === 'Draft') return 'rgba(243, 244, 246, 0.96)';
  return 'rgba(239, 246, 255, 0.96)';
};

const markerStatusClasses = (status: VisualMarkerStatus) => {
  if (status === 'Pass') return 'border-green-300 bg-green-100 text-green-800';
  if (status === 'Review') return 'border-amber-300 bg-amber-100 text-amber-800';
  if (status === 'Fail') return 'border-red-300 bg-red-100 text-red-800';
  if (status === 'Draft') return 'border-gray-300 bg-gray-100 text-gray-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};


const markerStatusLabel = (status: VisualMarkerStatus) => status;

const getBoardStatusCounts = (boardId: string, markers: VisualMarker[]) => {
  const counts: Record<VisualMarkerStatus, number> = {
    Pass: 0,
    Review: 0,
    Fail: 0,
    Draft: 0,
    Unknown: 0,
  };

  markers
    .filter((marker) => marker.boardId === boardId)
    .forEach((marker) => {
      counts[normalizeMarkerStatus(marker.status)] += 1;
    });

  return counts;
};

const getBoardPrimaryStatus = (boardId: string, markers: VisualMarker[]): VisualMarkerStatus => {
  const counts = getBoardStatusCounts(boardId, markers);
  if (counts.Fail > 0) return 'Fail';
  if (counts.Review > 0) return 'Review';
  if (counts.Draft > 0) return 'Draft';
  if (counts.Pass > 0) return 'Pass';
  return 'Unknown';
};

const distanceBetweenPercentPoints = (measurement: Pick<VisualMeasurement, 'x1Percent' | 'y1Percent' | 'x2Percent' | 'y2Percent'>) => {
  const dx = measurement.x2Percent - measurement.x1Percent;
  const dy = measurement.y2Percent - measurement.y1Percent;
  return Math.sqrt(dx * dx + dy * dy);
};

const escapeCsvCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const getBeamDetails = (document: ProjectDocument) => {
  const inputs = document.inputs as {
    section?: string;
    nodes?: Array<{ x: number; support?: string }>;
    loads?: Array<{ kind?: string; x?: number; x1?: number; x2?: number; p?: number; w?: number }>;
    method?: string;
    fy?: number;
  };

  const nodes = Array.isArray(inputs.nodes) ? [...inputs.nodes].sort((a, b) => Number(a.x) - Number(b.x)) : [];
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  const length = firstNode && lastNode ? Math.max(Number(lastNode.x) - Number(firstNode.x), 0) : 0;
  const supports = nodes.filter((node) => node.support && node.support !== 'None').length;
  const loadCount = Array.isArray(inputs.loads) ? inputs.loads.length : 0;

  return {
    section: inputs.section || 'Steel beam',
    length,
    supports,
    loadCount,
    method: inputs.method || '-',
    fy: typeof inputs.fy === 'number' ? inputs.fy : null,
    nodes,
    loads: Array.isArray(inputs.loads) ? inputs.loads : [],
  };
};

const buildPreviewSummary = (document: ProjectDocument) => {
  if (document.type === 'Steel Beam Design') {
    const beam = getBeamDetails(document);
    return [
      ['Beam', beam.section],
      ['Length', `${beam.length.toFixed(2)} ft`],
      ['Method', beam.method],
      ['Fy', beam.fy === null ? '-' : `${beam.fy.toFixed(0)} ksi`],
      ['Supports', String(beam.supports)],
      ['Loads', String(beam.loadCount)],
    ];
  }

  return [
    ['Type', document.type],
    ['Module', document.module],
    ['Status', document.status],
  ];
};

const renderSupportSymbol = (support: string | undefined, x: number, beamY: number) => {
  if (support === 'Fixed') {
    return <rect x={x - 4} y={beamY - 16} width="8" height="16" fill="#475569" />;
  }

  if (support === 'Pinned') {
    return <polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 16} ${x + 10},${beamY + 16}`} fill="#cbd5e1" stroke="#475569" />;
  }

  if (support === 'Roller') {
    return (
      <g>
        <polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 13} ${x + 10},${beamY + 13}`} fill="#e2e8f0" stroke="#475569" />
        <circle cx={x - 5} cy={beamY + 17} r="2.5" fill="#94a3b8" />
        <circle cx={x + 5} cy={beamY + 17} r="2.5" fill="#94a3b8" />
      </g>
    );
  }

  return <circle cx={x} cy={beamY} r="3" fill="#475569" />;
};

const HoverModelPreview: React.FC<{ document: ProjectDocument }> = ({ document }) => {
  if (document.type === 'Steel Beam Design') {
    const beam = getBeamDetails(document);
    const width = 250;
    const height = 96;
    const beamY = 54;
    const startX = 18;
    const endX = width - 18;
    const firstX = beam.nodes[0]?.x ?? 0;
    const lastX = beam.nodes[beam.nodes.length - 1]?.x ?? 1;
    const length = Math.max(lastX - firstX, 1);
    const mapX = (value: number) => startX + ((value - firstX) / length) * (endX - startX);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full rounded border border-gray-200 bg-slate-50">
        <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        {beam.nodes.map((node, index) => {
          const x = mapX(Number(node.x));
          return (
            <g key={`${node.x}-${index}`}>
              {renderSupportSymbol(node.support, x, beamY)}
              <line x1={x} y1={beamY - 8} x2={x} y2={beamY + 24} stroke="#cbd5e1" strokeDasharray="3,3" />
            </g>
          );
        })}
        {beam.loads.slice(0, 5).map((load, index) => {
          if (load.kind === 'point') {
            const x = mapX(Number(load.x ?? firstX));
            return (
              <g key={`point-${index}`}>
                <line x1={x} y1="12" x2={x} y2={beamY - 6} stroke="#dc2626" strokeWidth="2" />
                <polygon points={`${x - 4},${beamY - 12} ${x + 4},${beamY - 12} ${x},${beamY - 4}`} fill="#dc2626" />
              </g>
            );
          }

          const lx1 = mapX(Number(load.x1 ?? firstX));
          const lx2 = mapX(Number(load.x2 ?? lastX));
          const count = 4;
          const xs = Array.from({ length: count }, (_, arrowIndex) => lx1 + ((lx2 - lx1) * arrowIndex) / Math.max(count - 1, 1));
          return (
            <g key={`line-${index}`}>
              <line x1={lx1} y1="14" x2={lx2} y2="14" stroke="#2563eb" />
              {xs.map((arrowX, arrowIndex) => (
                <g key={arrowIndex}>
                  <line x1={arrowX} y1="14" x2={arrowX} y2={beamY - 7} stroke="#2563eb" />
                  <polygon points={`${arrowX - 3},${beamY - 13} ${arrowX + 3},${beamY - 13} ${arrowX},${beamY - 6}`} fill="#2563eb" />
                </g>
              ))}
            </g>
          );
        })}
        <text x="10" y="12" fontSize="10" fill="#334155">{beam.section}</text>
        <text x={width - 10} y={height - 10} textAnchor="end" fontSize="10" fill="#64748b">
          L = {beam.length.toFixed(2)} ft
        </text>
      </svg>
    );
  }

  return (
    <div className="flex h-24 items-center justify-center rounded border border-gray-200 bg-slate-50 text-xs text-gray-500">
      Model preview will appear here for this document type.
    </div>
  );
};

const beamPrintStyles = `
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
  .report-diagram-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 8px 0 14px; }
  .report-diagram-card { border: 1px solid #111827; padding: 8px; }
  .report-diagram-card h4 { margin: 0 0 6px; font-size: 11px; }
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
`;

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = getActiveProject();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>(() =>
    activeProject ? getProjectDocuments(activeProject.id) : [],
  );
  const [visualBoards, setVisualBoards] = useState<VisualBoard[]>(() =>
    activeProject ? getProjectVisualBoards(activeProject.id) : [],
  );
  const [documentsView, setDocumentsView] = useState<DocumentsView>('list');
  const [activeVisualBoardTab, setActiveVisualBoardTab] = useState<VisualBoardTab>('Markup');
  const [searchText, setSearchText] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoverDocument, setHoverDocument] = useState<ProjectDocument | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [printDocument, setPrintDocument] = useState<ProjectDocument | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [visualMarkers, setVisualMarkers] = useState<VisualMarker[]>(() =>
    activeProject ? getProjectVisualMarkers(activeProject.id) : [],
  );
  const [visualMeasurements, setVisualMeasurements] = useState<VisualMeasurement[]>(() =>
    activeProject ? getProjectVisualMeasurements(activeProject.id) : [],
  );
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [pendingMarkerPoint, setPendingMarkerPoint] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [markerLabel, setMarkerLabel] = useState('');
  const [markerDocumentIds, setMarkerDocumentIds] = useState<string[]>([]);
  const [markerNotes, setMarkerNotes] = useState('');
  const [markerStyle, setMarkerStyle] = useState<VisualMarkerStyle>('Pin');
  const [markerDirection, setMarkerDirection] = useState<VisualMarkerDirection>('Down');
  const [markerStatus, setMarkerStatus] = useState<VisualMarkerStatus>('Unknown');
  const [markerSize, setMarkerSize] = useState<VisualMarkerSize>('Medium');
  const [markerLabelVisibility, setMarkerLabelVisibility] = useState<VisualMarkerLabelVisibility>('Always');
<<<<<<< HEAD
  const [markerArrowLength, setMarkerArrowLength] = useState(82);
  const [markerWidth, setMarkerWidth] = useState(104);
  const [markerHeight, setMarkerHeight] = useState(56);
  const [selectedStampPreset, setSelectedStampPreset] = useState('');
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [movingMarkerId, setMovingMarkerId] = useState<string | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const [hoverVisualMarker, setHoverVisualMarker] = useState<VisualMarker | null>(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pendingMeasurePoint, setPendingMeasurePoint] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [measurementActualLength, setMeasurementActualLength] = useState('');
  const [visibleStatuses, setVisibleStatuses] = useState<Record<VisualMarkerStatus, boolean>>({
    Pass: true,
    Review: true,
    Fail: true,
    Draft: true,
    Unknown: true,
  });
  const [labelDisplayOverride, setLabelDisplayOverride] = useState<'Normal' | 'Show all' | 'Hide all'>('Normal');
  const [boardZoom, setBoardZoom] = useState(1);
  const [boardNotesDraft, setBoardNotesDraft] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const boardCanvasRef = useRef<HTMLDivElement | null>(null);
  const latestVisualMarkersRef = useRef<VisualMarker[]>([]);
  const [newBoardKind, setNewBoardKind] = useState<VisualBoardKind>('Plan');
  const [uploadMessage, setUploadMessage] = useState('');

  const selectedBoard = useMemo(
    () => visualBoards.find((board) => board.id === selectedBoardId) ?? null,
    [selectedBoardId, visualBoards],
  );
  const selectedBoardMarkers = useMemo(
    () => (selectedBoard ? visualMarkers.filter((marker) => marker.boardId === selectedBoard.id) : []),
    [selectedBoard, visualMarkers],
  );
  const visibleBoardMarkers = useMemo(
    () => selectedBoardMarkers.filter((marker) => visibleStatuses[normalizeMarkerStatus(marker.status)]),
    [selectedBoardMarkers, visibleStatuses],
  );
  const selectedBoardMeasurements = useMemo(
    () => (selectedBoard ? visualMeasurements.filter((measurement) => measurement.boardId === selectedBoard.id) : []),
    [selectedBoard, visualMeasurements],
  );
  const selectedMarker = useMemo(
    () => selectedBoardMarkers.find((marker) => marker.id === selectedMarkerId) ?? null,
    [selectedBoardMarkers, selectedMarkerId],
  );
  const selectedMarkerDocuments = useMemo(
    () => getMarkerDocuments(selectedMarker, documents),
    [documents, selectedMarker],
  );
  const hoverVisualMarkerDocuments = useMemo(
    () => getMarkerDocuments(hoverVisualMarker, documents),
    [documents, hoverVisualMarker],
  );
  const hoverVisualMarkerPrimaryDocument = hoverVisualMarkerDocuments[0] ?? null;

  useEffect(() => {
    latestVisualMarkersRef.current = visualMarkers;
  }, [visualMarkers]);

  const refreshDocuments = () => {
    if (!activeProject) {
      setDocuments([]);
      return;
    }

    setDocuments(getProjectDocuments(activeProject.id));
  };

  const refreshVisualBoards = () => {
    if (!activeProject) {
      setVisualBoards([]);
      return;
    }

    setVisualBoards(getProjectVisualBoards(activeProject.id));
  };

  const refreshVisualMarkers = () => {
    if (!activeProject) {
      setVisualMarkers([]);
      return;
    }

    setVisualMarkers(getProjectVisualMarkers(activeProject.id));
  };

  const refreshVisualMeasurements = () => {
    if (!activeProject) {
      setVisualMeasurements([]);
      return;
    }

    setVisualMeasurements(getProjectVisualMeasurements(activeProject.id));
  };

  useEffect(() => {
    setBoardNotesDraft((selectedBoard as (VisualBoard & { notes?: string }) | null)?.notes ?? '');
  }, [selectedBoard]);

<<<<<<< HEAD
  useEffect(() => {
    const sizeConfig = getMarkerSizeConfig(markerSize);
    if (!editingMarkerId && !pendingMarkerPoint) {
      setMarkerArrowLength(sizeConfig.arrowLength);
      setMarkerWidth(getDefaultMarkerWidth(markerStyle, sizeConfig));
      setMarkerHeight(getDefaultMarkerHeight(markerStyle, sizeConfig));
    }
  }, [editingMarkerId, markerSize, markerStyle, pendingMarkerPoint]);

=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) => {
      const searchableText = [
        document.name,
        document.type,
        document.module,
        document.status,
        document.sourcePath,
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }, [documents, searchText]);

  useEffect(() => {
    if (!printDocument) return;

    const timeout = window.setTimeout(() => {
      window.print();
    }, 80);

    const afterPrint = () => {
      setPrintDocument(null);
    };

    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [printDocument]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelPendingMarker();
        cancelMeasurement();
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedMarkerId && !editingMarkerId) {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

        event.preventDefault();
        handleDeleteVisualMarker(selectedMarkerId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMarkerId, editingMarkerId]);

  const startRename = (document: ProjectDocument) => {
    setRenamingId(document.id);
    setRenameValue(document.name);
  };

  const saveRename = () => {
    if (!renamingId || !renameValue.trim()) return;

    renameProjectDocument(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
    refreshDocuments();
  };

  const handleOpen = (document: ProjectDocument) => {
    requestOpenProjectDocument(document.id);

    if (document.module === 'Steel') {
      navigate('/steel');
      return;
    }

    navigate(document.sourcePath || '/dashboard');
  };

  const handleDelete = (documentId: string) => {
    deleteProjectDocument(documentId);
    refreshDocuments();
  };

  const handleDuplicate = (documentId: string) => {
    duplicateProjectDocument(documentId);
    refreshDocuments();
  };

  const handlePrint = (document: ProjectDocument) => {
    setPrintDocument(document);
  };

  const handleVisualBoardUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please upload an image file such as PNG, JPG, or WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadMessage('This image is large. For now, use screenshots under about 3 MB so the browser can save the board locally.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageDataUrl = String(reader.result || '');
      if (!imageDataUrl) {
        setUploadMessage('The image could not be read. Try another file.');
        return;
      }

      const now = new Date().toISOString();
      const board: VisualBoard = {
        id: makeVisualBoardId(),
        projectId: activeProject.id,
        name: newBoardName.trim() || getDefaultBoardName(file.name),
        kind: newBoardKind,
        imageName: file.name,
        imageDataUrl,
        createdAt: now,
        updatedAt: now,
        notes: '',
      } as VisualBoard & { notes?: string };

      writeAllVisualBoards([board, ...getAllVisualBoards()]);
      setNewBoardName('');
      setUploadMessage('Visual board added.');
      setSelectedBoardId(board.id);
      refreshVisualBoards();
    };

    reader.onerror = () => {
      setUploadMessage('The image could not be uploaded. Try another file.');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const resetMarkerForm = () => {
    setMarkerLabel('');
    setMarkerDocumentIds([]);
    setMarkerNotes('');
    setMarkerStyle('Pin');
    setMarkerDirection('Down');
    setMarkerStatus('Unknown');
    setMarkerSize('Medium');
    setMarkerLabelVisibility('Always');
<<<<<<< HEAD
    setMarkerArrowLength(82);
    setMarkerWidth(104);
    setMarkerHeight(56);
    setSelectedStampPreset('');
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
  };

  const updateVisualMarker = (markerId: string, patch: Partial<VisualMarker>) => {
    const now = new Date().toISOString();
    writeAllVisualMarkers(
      getAllVisualMarkers().map((marker) =>
        marker.id === markerId
          ? {
              ...marker,
              ...patch,
              updatedAt: now,
            }
          : marker,
      ),
    );
    refreshVisualMarkers();
  };

  const getBoardCanvasPercentFromClientPoint = (clientX: number, clientY: number) => {
    const rect = boardCanvasRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;

    return {
      xPercent: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      yPercent: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const updateMarkerPositionLocally = (markerId: string, xPercent: number, yPercent: number) => {
    setVisualMarkers((currentMarkers) =>
      currentMarkers.map((marker) =>
        marker.id === markerId
          ? {
              ...marker,
              xPercent,
              yPercent,
            }
          : marker,
      ),
    );
  };

  useEffect(() => {
    if (!draggingMarkerId) return;

    const handleMouseMove = (event: MouseEvent) => {
      const point = getBoardCanvasPercentFromClientPoint(event.clientX, event.clientY);
      if (!point) return;

      updateMarkerPositionLocally(draggingMarkerId, point.xPercent, point.yPercent);
      setHoverPoint({ x: event.clientX, y: event.clientY });
    };

    const handleMouseUp = () => {
      const marker = latestVisualMarkersRef.current.find((item) => item.id === draggingMarkerId);
      if (marker) {
        updateVisualMarker(draggingMarkerId, {
          xPercent: marker.xPercent,
          yPercent: marker.yPercent,
        });
        setSelectedMarkerId(draggingMarkerId);
      }

      setDraggingMarkerId(null);
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingMarkerId]);

  const handleBoardImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!selectedBoard) return;
    if (!isAddingMarker && !movingMarkerId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

    if (movingMarkerId) {
      updateVisualMarker(movingMarkerId, { xPercent, yPercent });
      setSelectedMarkerId(movingMarkerId);
      setMovingMarkerId(null);
      return;
    }

    setPendingMarkerPoint({ xPercent, yPercent });
    setMarkerLabel((current) => current || `M${selectedBoardMarkers.length + 1}`);
    setMarkerDocumentIds(documents[0]?.id ? [documents[0].id] : []);
    setMarkerNotes('');
    setMarkerStyle('Arrow');
    setMarkerDirection('Right');
    setMarkerStatus('Unknown');
    setMarkerSize('Medium');
    setMarkerLabelVisibility('Always');
<<<<<<< HEAD
    setMarkerArrowLength(82);
    setMarkerWidth(104);
    setMarkerHeight(56);
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
    setSelectedMarkerId(null);
    setEditingMarkerId(null);
    setIsAddingMarker(false);
  };

  const handleBoardMeasureClick = (clientX: number, clientY: number) => {
    if (!activeProject || !selectedBoard || !isMeasuring) return;

    const point = getBoardCanvasPercentFromClientPoint(clientX, clientY);
    if (!point) return;

    if (!pendingMeasurePoint) {
      setPendingMeasurePoint(point);
      return;
    }

    const actualLength = Number(measurementActualLength);
    const now = new Date().toISOString();
    const measurement: VisualMeasurement = {
      id: makeVisualMeasurementId(),
      projectId: activeProject.id,
      boardId: selectedBoard.id,
      label: `M-${selectedBoardMeasurements.length + 1}`,
      x1Percent: pendingMeasurePoint.xPercent,
      y1Percent: pendingMeasurePoint.yPercent,
      x2Percent: point.xPercent,
      y2Percent: point.yPercent,
      actualLengthFt: Number.isFinite(actualLength) && actualLength > 0 ? actualLength : undefined,
      createdAt: now,
      updatedAt: now,
    };

    writeAllVisualMeasurements([measurement, ...getAllVisualMeasurements()]);
    setPendingMeasurePoint(null);
    setIsMeasuring(false);
    setMeasurementActualLength('');
    refreshVisualMeasurements();
  };

  const cancelMeasurement = () => {
    setIsMeasuring(false);
    setPendingMeasurePoint(null);
    setMeasurementActualLength('');
  };

  const handleDeleteMeasurement = (measurementId: string) => {
    deleteVisualMeasurement(measurementId);
    refreshVisualMeasurements();
  };

  const saveBoardNotes = () => {
    if (!selectedBoard) return;

    const now = new Date().toISOString();
    writeAllVisualBoards(
      getAllVisualBoards().map((board) =>
        board.id === selectedBoard.id
          ? {
              ...board,
              notes: boardNotesDraft,
              updatedAt: now,
            }
          : board,
      ),
    );
    refreshVisualBoards();
  };

  const exportMarkerScheduleCsv = () => {
    if (!selectedBoard) return;

    const rows = [
      ['Marker', 'Status', 'Style', 'Size', 'Linked Documents', 'Notes'],
      ...selectedBoardMarkers.map((marker) => [
        marker.label,
        normalizeMarkerStatus(marker.status),
        normalizeMarkerStyle(marker.style),
        normalizeMarkerSize(marker.size),
        getMarkerDocuments(marker, documents).map((document) => document.name).join('; '),
        marker.notes,
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    anchorElement.download = `${selectedBoard.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'visual-map'}-marker-schedule.csv`;
    anchorElement.click();
    URL.revokeObjectURL(url);
  };

  const cancelPendingMarker = () => {
    setPendingMarkerPoint(null);
    resetMarkerForm();
    setIsAddingMarker(false);
    setEditingMarkerId(null);
    setMovingMarkerId(null);
    setDraggingMarkerId(null);
    cancelMeasurement();
  };

  const savePendingMarker = () => {
    if (!activeProject || !selectedBoard || !pendingMarkerPoint || markerDocumentIds.length === 0) return;

    const now = new Date().toISOString();
    const marker: VisualMarker = {
      id: makeVisualMarkerId(),
      projectId: activeProject.id,
      boardId: selectedBoard.id,
      documentId: markerDocumentIds[0] ?? '',
      documentIds: markerDocumentIds,
      label: markerLabel.trim() || `M${selectedBoardMarkers.length + 1}`,
      notes: markerNotes.trim(),
      xPercent: pendingMarkerPoint.xPercent,
      yPercent: pendingMarkerPoint.yPercent,
      style: markerStyle,
      direction: markerDirection,
      status: markerStatus,
      size: markerSize,
      labelVisibility: markerLabelVisibility,
<<<<<<< HEAD
      arrowLength: markerArrowLength,
      markerWidth,
      markerHeight,
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
      createdAt: now,
      updatedAt: now,
    };

    writeAllVisualMarkers([marker, ...getAllVisualMarkers()]);
    setPendingMarkerPoint(null);
    resetMarkerForm();
    setSelectedMarkerId(marker.id);
    refreshVisualMarkers();
  };

  const startEditMarker = (marker: VisualMarker) => {
    setEditingMarkerId(marker.id);
    setMarkerLabel(marker.label);
    setMarkerDocumentIds(getMarkerDocumentIds(marker));
    setMarkerNotes(marker.notes);
    setMarkerStyle(normalizeMarkerStyle(marker.style));
    setMarkerDirection(normalizeMarkerDirection(marker.direction));
    setMarkerStatus(normalizeMarkerStatus(marker.status));
<<<<<<< HEAD
    const sizeConfig = getMarkerSizeConfig(normalizeMarkerSize(marker.size));
    const style = normalizeMarkerStyle(marker.style);
    setMarkerSize(normalizeMarkerSize(marker.size));
    setMarkerLabelVisibility(normalizeMarkerLabelVisibility(marker.labelVisibility));
    setMarkerArrowLength(marker.arrowLength ?? sizeConfig.arrowLength);
    setMarkerWidth(marker.markerWidth ?? getDefaultMarkerWidth(style, sizeConfig));
    setMarkerHeight(marker.markerHeight ?? getDefaultMarkerHeight(style, sizeConfig));
=======
    setMarkerSize(normalizeMarkerSize(marker.size));
    setMarkerLabelVisibility(normalizeMarkerLabelVisibility(marker.labelVisibility));
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
    setPendingMarkerPoint(null);
    setIsAddingMarker(false);
    setMovingMarkerId(null);
  };

  const cancelEditMarker = () => {
    setEditingMarkerId(null);
    resetMarkerForm();
  };

  const saveMarkerEdit = () => {
    if (!editingMarkerId || markerDocumentIds.length === 0) return;

    updateVisualMarker(editingMarkerId, {
      documentId: markerDocumentIds[0] ?? '',
      documentIds: markerDocumentIds,
      label: markerLabel.trim() || 'Marker',
      notes: markerNotes.trim(),
      style: markerStyle,
      direction: markerDirection,
      status: markerStatus,
      size: markerSize,
      labelVisibility: markerLabelVisibility,
<<<<<<< HEAD
      arrowLength: markerArrowLength,
      markerWidth,
      markerHeight,
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
    });
    setEditingMarkerId(null);
    resetMarkerForm();
  };

  const startMoveMarker = (markerId: string) => {
    setMovingMarkerId(markerId);
    setSelectedMarkerId(markerId);
    setEditingMarkerId(null);
    setPendingMarkerPoint(null);
    setIsAddingMarker(false);
  };

  const handleDeleteVisualMarker = (markerId: string) => {
    deleteVisualMarker(markerId);
    if (selectedMarkerId === markerId) {
      setSelectedMarkerId(null);
    }
    if (editingMarkerId === markerId) {
      setEditingMarkerId(null);
      resetMarkerForm();
    }
    if (movingMarkerId === markerId) {
      setMovingMarkerId(null);
    }
    if (draggingMarkerId === markerId) {
      setDraggingMarkerId(null);
    }
    setHoverVisualMarker(null);
    refreshVisualMarkers();
  };

  const handleDeleteVisualBoard = (boardId: string) => {
    deleteVisualBoard(boardId);
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null);
    }
    setSelectedMarkerId(null);
    setEditingMarkerId(null);
    setMovingMarkerId(null);
    setDraggingMarkerId(null);
    setHoverVisualMarker(null);
    refreshVisualBoards();
    refreshVisualMarkers();
    refreshVisualMeasurements();
  };

  if (!activeProject) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-2xl font-bold">No active project selected</h1>
        <p className="mt-2 text-sm">
          Open or create a project from the Projects page before saving project documents.
        </p>
      </div>
    );
  }

  const renderListView = () => (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="border-b border-gray-200 px-4 py-3">Name</th>
              <th className="border-b border-gray-200 px-4 py-3">Type</th>
              <th className="border-b border-gray-200 px-4 py-3">Module</th>
              <th className="border-b border-gray-200 px-4 py-3">Status</th>
              <th className="border-b border-gray-200 px-4 py-3">Created</th>
              <th className="border-b border-gray-200 px-4 py-3">Modified</th>
              <th className="border-b border-gray-200 px-4 py-3">Source</th>
              <th className="border-b border-gray-200 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  No saved documents yet. Go to a calculation page and click Save Output.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((document) => (
                <tr key={document.id} className="hover:bg-blue-50/50">
                  <td className="border-b border-gray-100 px-4 py-3">
                    {renamingId === document.id ? (
                      <div className="flex gap-2">
                        <input
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                        <button onClick={saveRename} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white">Save</button>
                      </div>
                    ) : (
                      <div className="font-semibold text-gray-900">{document.name}</div>
                    )}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{document.type}</td>
                  <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{document.module}</td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{document.status}</span>
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-600">{formatDocumentDate(document.createdAt)}</td>
                  <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-600">{formatDocumentDate(document.updatedAt)}</td>
                  <td className="border-b border-gray-100 px-4 py-3 font-mono text-xs text-gray-500">{document.sourcePath}</td>
                  <td className="border-b border-gray-100 px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpen(document)} className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100" title="Open editable calculation">Open/Edit</button>
                      <button
                        onClick={() => handlePrint(document)}
                        onMouseEnter={(event) => {
                          setHoverDocument(document);
                          setHoverPoint({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
                        onMouseLeave={() => setHoverDocument(null)}
                        className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                        title="Print document"
                      >
                        <Download size={15} />
                      </button>
                      <button onClick={() => startRename(document)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50" title="Rename"><Pencil size={15} /></button>
                      <button onClick={() => handleDuplicate(document.id)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50" title="Duplicate"><Copy size={15} /></button>
                      <button onClick={() => handleDelete(document.id)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
        {filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'} shown
      </div>
    </div>
  );

  const toggleMarkerDocumentId = (documentId: string) => {
    setMarkerDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  };

  const renderMarkerForm = (mode: 'new' | 'edit') => (
    <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        <MapPin size={15} className="text-blue-600" />
        {mode === 'new' ? 'New marker' : 'Edit marker'}
      </h4>

      <label className="mt-3 block text-xs font-semibold text-gray-600">
        Marker label
        <input
          value={markerLabel}
          onChange={(event) => setMarkerLabel(event.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="B12, Grid A-3, etc."
        />
      </label>

      <div className="mt-3 block text-xs font-semibold text-gray-600">
        Linked documents
        <div className="mt-1 max-h-44 space-y-1 overflow-y-auto rounded border border-gray-300 bg-white p-2">
          {documents.length === 0 ? (
            <div className="text-gray-500">No saved documents yet.</div>
          ) : (
            documents.map((document) => (
              <label key={document.id} className="flex items-start gap-2 rounded px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={markerDocumentIds.includes(document.id)}
                  onChange={() => toggleMarkerDocumentId(document.id)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-900">{document.name}</span>
                  <span className="block text-[11px] text-gray-500">{document.type} • {document.module}</span>
                </span>
              </label>
            ))
          )}
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          {markerDocumentIds.length} document{markerDocumentIds.length === 1 ? '' : 's'} selected
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold text-gray-600">
          Marker style
          <select
            value={markerStyle}
            onChange={(event) => setMarkerStyle(event.target.value as VisualMarkerStyle)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option>Arrow</option>
            <option>Pin</option>
            <option>Box</option>
            <option>Cloud</option>
            <option>Text</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          Direction
          <select
            value={markerDirection}
            onChange={(event) => setMarkerDirection(event.target.value as VisualMarkerDirection)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
            disabled={markerStyle !== 'Arrow'}
          >
            <option>Up</option>
            <option>Down</option>
            <option>Left</option>
            <option>Right</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          Marker size
          <select
            value={markerSize}
            onChange={(event) => setMarkerSize(event.target.value as VisualMarkerSize)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          Label display
          <select
            value={markerLabelVisibility}
            onChange={(event) => setMarkerLabelVisibility(event.target.value as VisualMarkerLabelVisibility)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option>Always</option>
            <option>Hover only</option>
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs font-semibold text-gray-600">
        Status
        <select
          value={markerStatus}
          onChange={(event) => setMarkerStatus(event.target.value as VisualMarkerStatus)}
          className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
        >
          <option>Unknown</option>
          <option>Draft</option>
          <option>Pass</option>
          <option>Review</option>
          <option>Fail</option>
        </select>
      </label>

      <div className="mt-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
        <span className="font-semibold text-gray-800">Marker types:</span> Arrow callout, Pin, Box region, Cloud review, and Text-only labels.
      </div>

<<<<<<< HEAD
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Adjust marker shape</div>
        {markerStyle === 'Arrow' ? (
          <label className="mt-2 block text-xs font-semibold text-gray-600">
            Arrow length: {markerArrowLength}px
            <input
              type="range"
              min={40}
              max={180}
              value={markerArrowLength}
              onChange={(event) => setMarkerArrowLength(clampVisualDimension(Number(event.target.value), 40, 180))}
              className="mt-1 w-full"
            />
          </label>
        ) : markerStyle === 'Box' || markerStyle === 'Cloud' || markerStyle === 'Text' ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-gray-600">
              Width: {markerWidth}px
              <input
                type="range"
                min={markerStyle === 'Text' ? 60 : 50}
                max={240}
                value={markerWidth}
                onChange={(event) => setMarkerWidth(clampVisualDimension(Number(event.target.value), markerStyle === 'Text' ? 60 : 50, 240))}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-semibold text-gray-600">
              Height: {markerHeight}px
              <input
                type="range"
                min={markerStyle === 'Text' ? 24 : 30}
                max={160}
                value={markerHeight}
                onChange={(event) => setMarkerHeight(clampVisualDimension(Number(event.target.value), markerStyle === 'Text' ? 24 : 30, 160))}
                className="mt-1 w-full"
              />
            </label>
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">Pin markers use the size dropdown. Use Box, Cloud, Text, or Arrow for stretchable shapes.</p>
        )}
      </div>

=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
      <label className="mt-3 block text-xs font-semibold text-gray-600">
        Notes
        <textarea
          value={markerNotes}
          onChange={(event) => setMarkerNotes(event.target.value)}
          className="mt-1 h-20 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="Optional location note..."
        />
      </label>

      <div className="mt-3 flex gap-2">
        <button
          onClick={mode === 'new' ? savePendingMarker : saveMarkerEdit}
          disabled={markerDocumentIds.length === 0}
          className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={13} />
          {mode === 'new' ? 'Save Marker' : 'Save Changes'}
        </button>
        <button
          onClick={mode === 'new' ? cancelPendingMarker : cancelEditMarker}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {documents.length === 0 && (
        <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
          Save a calculation document first, then link it to this marker.
        </div>
      )}
    </div>
  );

  const renderVisualMarkerButton = (marker: VisualMarker) => {
    const markerDocuments = getMarkerDocuments(marker, documents);
    const markerDocument = markerDocuments[0] ?? null;
    const style = normalizeMarkerStyle(marker.style);
    const direction = normalizeMarkerDirection(marker.direction);
    const status = normalizeMarkerStatus(marker.status);
    const size = normalizeMarkerSize(marker.size);
    const labelVisibility = normalizeMarkerLabelVisibility(marker.labelVisibility);
    const sizeConfig = getMarkerSizeConfig(size);
    const isSelected = selectedMarkerId === marker.id;
    const isMoving = movingMarkerId === marker.id;
    const isHovered = hoverVisualMarker?.id === marker.id;
    const showLabel = labelDisplayOverride === 'Show all' || (labelDisplayOverride !== 'Hide all' && (labelVisibility === 'Always' || isSelected || isMoving || isHovered));
    const accentColor = markerStatusColor(status);
    const labelStyle: React.CSSProperties = {
      borderColor: isSelected || isMoving ? '#1d4ed8' : accentColor,
      backgroundColor: isSelected || isMoving ? '#dbeafe' : markerStatusFill(status),
      color: isSelected || isMoving ? '#1d4ed8' : accentColor,
      fontSize: `${sizeConfig.textSize}px`,
    };

    const commonProps = {
      key: marker.id,
      type: 'button' as const,
      draggable: false,
      onDragStart: (event: React.DragEvent<HTMLButtonElement>) => event.preventDefault(),
      onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        setSelectedMarkerId(marker.id);
        setPendingMarkerPoint(null);
        setIsAddingMarker(false);
        setEditingMarkerId(null);
        setDraggingMarkerId(marker.id);
      },
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        setSelectedMarkerId(marker.id);
        setPendingMarkerPoint(null);
        setIsAddingMarker(false);
      },
      onDoubleClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        startEditMarker(marker);
      },
      onMouseEnter: (event: React.MouseEvent<HTMLButtonElement>) => {
        setHoverVisualMarker(marker);
        setHoverPoint({ x: event.clientX, y: event.clientY });
      },
      onMouseMove: (event: React.MouseEvent<HTMLButtonElement>) => setHoverPoint({ x: event.clientX, y: event.clientY }),
      onMouseLeave: () => setHoverVisualMarker(null),
      title: markerDocument
        ? `${marker.label}: ${markerDocument.name}${markerDocuments.length > 1 ? ` + ${markerDocuments.length - 1} more` : ''}`
        : marker.label,
    };

    const countBadge = markerDocuments.length > 1 ? (
      <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/90 px-1 text-[10px] font-bold text-slate-700 shadow-sm">
        {markerDocuments.length}
      </span>
    ) : null;

    if (style === 'Arrow') {
<<<<<<< HEAD
      const line = clampVisualDimension(marker.arrowLength ?? sizeConfig.arrowLength, 40, 180);
=======
      const line = sizeConfig.arrowLength;
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
      const arrowHead = size === 'Large' ? 12 : size === 'Small' ? 8 : 10;
      const cross = size === 'Large' ? 26 : size === 'Small' ? 18 : 22;
      const tipOffset = 4;

      let wrapperStyle: React.CSSProperties = {};
      let labelPosition: React.CSSProperties = {};
      let lineStyle: React.CSSProperties = { backgroundColor: accentColor };
      let headStyle: React.CSSProperties = {};

      if (direction === 'Right') {
        wrapperStyle = { left: `calc(${marker.xPercent}% - ${line + arrowHead + tipOffset}px)`, top: `calc(${marker.yPercent}% - ${cross / 2}px)`, width: `${line + arrowHead + tipOffset}px`, height: `${cross}px` };
        labelPosition = { left: 0, top: `${-sizeConfig.textSize - 12}px` };
        lineStyle = { ...lineStyle, position: 'absolute', left: 0, top: '50%', width: `${line}px`, height: '2px', transform: 'translateY(-50%)' };
        headStyle = { position: 'absolute', left: `${line}px`, top: '50%', width: 0, height: 0, transform: 'translateY(-50%)', borderTop: `${arrowHead / 1.3}px solid transparent`, borderBottom: `${arrowHead / 1.3}px solid transparent`, borderLeft: `${arrowHead}px solid ${accentColor}` };
      } else if (direction === 'Left') {
        wrapperStyle = { left: `${marker.xPercent}%`, top: `calc(${marker.yPercent}% - ${cross / 2}px)`, width: `${line + arrowHead + tipOffset}px`, height: `${cross}px` };
        labelPosition = { right: 0, top: `${-sizeConfig.textSize - 12}px` };
        lineStyle = { ...lineStyle, position: 'absolute', left: `${arrowHead}px`, top: '50%', width: `${line}px`, height: '2px', transform: 'translateY(-50%)' };
        headStyle = { position: 'absolute', left: 0, top: '50%', width: 0, height: 0, transform: 'translateY(-50%)', borderTop: `${arrowHead / 1.3}px solid transparent`, borderBottom: `${arrowHead / 1.3}px solid transparent`, borderRight: `${arrowHead}px solid ${accentColor}` };
      } else if (direction === 'Up') {
        wrapperStyle = { left: `calc(${marker.xPercent}% - ${cross / 2}px)`, top: `${marker.yPercent}%`, width: `${cross}px`, height: `${line + arrowHead + tipOffset}px` };
        labelPosition = { left: `${cross + 8}px`, top: `${line - 8}px` };
        lineStyle = { ...lineStyle, position: 'absolute', left: '50%', top: `${arrowHead}px`, width: '2px', height: `${line}px`, transform: 'translateX(-50%)' };
        headStyle = { position: 'absolute', left: '50%', top: 0, width: 0, height: 0, transform: 'translateX(-50%)', borderLeft: `${arrowHead / 1.3}px solid transparent`, borderRight: `${arrowHead / 1.3}px solid transparent`, borderBottom: `${arrowHead}px solid ${accentColor}` };
      } else {
        wrapperStyle = { left: `calc(${marker.xPercent}% - ${cross / 2}px)`, top: `calc(${marker.yPercent}% - ${line + arrowHead + tipOffset}px)`, width: `${cross}px`, height: `${line + arrowHead + tipOffset}px` };
        labelPosition = { left: `${cross + 8}px`, top: `${line - 8}px` };
        lineStyle = { ...lineStyle, position: 'absolute', left: '50%', top: 0, width: '2px', height: `${line}px`, transform: 'translateX(-50%)' };
        headStyle = { position: 'absolute', left: '50%', top: `${line}px`, width: 0, height: 0, transform: 'translateX(-50%)', borderLeft: `${arrowHead / 1.3}px solid transparent`, borderRight: `${arrowHead / 1.3}px solid transparent`, borderTop: `${arrowHead}px solid ${accentColor}` };
      }

      return (
        <button
          {...commonProps}
          className="absolute z-10 overflow-visible bg-transparent p-0 cursor-grab active:cursor-grabbing"
          style={wrapperStyle}
        >
          {showLabel && (
            <span className="absolute whitespace-nowrap rounded-md border px-2 py-1 font-bold shadow-sm" style={labelPosition && labelStyle ? { ...labelPosition, ...labelStyle } : labelStyle}>
              {marker.label}
              {countBadge}
            </span>
          )}
          <span style={lineStyle} />
          <span style={headStyle} />
        </button>
      );
    }

    if (style === 'Box' || style === 'Cloud') {
<<<<<<< HEAD
      const width = clampVisualDimension(marker.markerWidth ?? getDefaultMarkerWidth(style, sizeConfig), style === 'Text' ? 60 : 50, 240);
      const height = clampVisualDimension(marker.markerHeight ?? getDefaultMarkerHeight(style, sizeConfig), style === 'Text' ? 24 : 30, 160);
=======
      const width = style === 'Cloud' ? sizeConfig.cloudWidth : sizeConfig.boxWidth;
      const height = style === 'Cloud' ? sizeConfig.cloudHeight : sizeConfig.boxHeight;
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
      const wrapperStyle: React.CSSProperties = {
        left: `calc(${marker.xPercent}% - ${width / 2}px)`,
        top: `calc(${marker.yPercent}% - ${height / 2}px)`,
        width: `${width}px`,
        height: `${height}px`,
      };

      return (
        <button
          {...commonProps}
          className="absolute z-10 overflow-visible bg-transparent p-0 cursor-grab active:cursor-grabbing"
          style={wrapperStyle}
        >
          <span
            className="absolute inset-0"
            style={{
              border: `2px ${style === 'Cloud' ? 'dashed' : 'solid'} ${accentColor}`,
              borderRadius: style === 'Cloud' ? `${height / 1.7}px` : '8px',
              backgroundColor: style === 'Cloud' ? `${markerStatusFill(status)}` : 'rgba(255,255,255,0.08)',
              boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.18)' : 'none',
            }}
          />
          {showLabel && (
            <span className="absolute -top-7 left-0 whitespace-nowrap rounded-md border px-2 py-1 font-bold shadow-sm" style={labelStyle}>
              {marker.label}
              {countBadge}
            </span>
          )}
        </button>
      );
    }

    if (style === 'Text') {
      return (
        <button
          {...commonProps}
          className="absolute z-10 overflow-visible bg-transparent p-0 cursor-grab active:cursor-grabbing"
<<<<<<< HEAD
          style={{
            left: `${marker.xPercent}%`,
            top: `${marker.yPercent}%`,
            width: `${clampVisualDimension(marker.markerWidth ?? getDefaultMarkerWidth(style, sizeConfig), 60, 240)}px`,
            minHeight: `${clampVisualDimension(marker.markerHeight ?? getDefaultMarkerHeight(style, sizeConfig), 24, 160)}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="flex h-full w-full items-center justify-center rounded-md border px-2 py-1 text-center font-bold shadow-sm" style={labelStyle}>
=======
          style={{ left: `${marker.xPercent}%`, top: `${marker.yPercent}%`, transform: 'translate(-50%, -50%)' }}
        >
          <span className="whitespace-nowrap rounded-md border px-2 py-1 font-bold shadow-sm" style={labelStyle}>
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
            {marker.label}
            {countBadge}
          </span>
        </button>
      );
    }

    return (
      <button
        {...commonProps}
        className="absolute z-10 overflow-visible bg-transparent p-0 cursor-grab active:cursor-grabbing"
        style={{ left: `${marker.xPercent}%`, top: `${marker.yPercent}%`, transform: 'translate(-50%, -100%)' }}
      >
        <span
          className="block rounded-full border-2 shadow"
          style={{
            width: `${sizeConfig.pinDiameter}px`,
            height: `${sizeConfig.pinDiameter}px`,
            borderColor: isSelected || isMoving ? '#1d4ed8' : accentColor,
            backgroundColor: isSelected || isMoving ? '#1d4ed8' : markerStatusFill(status),
          }}
        />
        <span
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-md border px-2 py-1 font-bold shadow-sm"
          style={showLabel ? labelStyle : { ...labelStyle, opacity: 0, pointerEvents: 'none' }}
        >
          {marker.label}
          {countBadge}
        </span>
      </button>
    );
  };

  const renderVisualMapBoard = () => {
    if (!selectedBoard) return null;

    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setSelectedBoardId(null);
            setSelectedMarkerId(null);
            setActiveVisualBoardTab('Markup');
            cancelPendingMarker();
          }}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Visual Map
        </button>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedBoard.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedBoard.kind} • {selectedBoard.imageName} • {formatDocumentDate(selectedBoard.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full border px-3 py-1 font-bold ${markerStatusClasses(getBoardPrimaryStatus(selectedBoard.id, visualMarkers))}`}>
                {getBoardPrimaryStatus(selectedBoard.id, visualMarkers)}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-semibold text-gray-600">
                {visibleBoardMarkers.length} visible / {selectedBoardMarkers.length} marker{selectedBoardMarkers.length === 1 ? '' : 's'}
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 font-semibold text-gray-600">
                {getBoardDocumentCount(selectedBoard.id, visualMarkers)} linked doc{getBoardDocumentCount(selectedBoard.id, visualMarkers) === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="border-b border-gray-200 bg-slate-50">
            <div className="flex min-w-max gap-1 overflow-x-auto px-3 pt-3">
              {(['Markup', 'Documents', 'Measure', 'View', 'Review', 'Settings'] as VisualBoardTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveVisualBoardTab(tab)}
                  className={`rounded-t-md border px-4 py-2 text-xs font-bold transition-colors ${
                    activeVisualBoardTab === tab
                      ? 'border-gray-200 border-b-white bg-white text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-white hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-white px-4 py-3">
              {activeVisualBoardTab === 'Markup' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingMarker(true);
                      setPendingMarkerPoint(null);
                      setSelectedMarkerId(null);
                      setEditingMarkerId(null);
                      setMovingMarkerId(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      isAddingMarker
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <MapPin size={16} />
                    {isAddingMarker ? 'Click plan/photo to place marker' : 'Add Marker'}
                  </button>
<<<<<<< HEAD
                  <select
                    value={markerStyle}
                    onChange={(event) => setMarkerStyle(event.target.value as VisualMarkerStyle)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                    title="Marker type"
                  >
                    <option>Arrow</option>
                    <option>Pin</option>
                    <option>Box</option>
                    <option>Cloud</option>
                    <option>Text</option>
                  </select>
                  <button
                    onClick={() => {
                      setIsAddingMarker(true);
                      setPendingMarkerPoint(null);
                      setSelectedMarkerId(null);
                      setEditingMarkerId(null);
                      setMovingMarkerId(null);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Place selected marker
                  </button>
                  <select
                    value={selectedStampPreset}
                    onChange={(event) => {
                      const stamp = event.target.value;
                      setSelectedStampPreset(stamp);
                      if (!stamp) return;
                      setMarkerStyle('Text');
                      setMarkerLabel(stamp);
                      setMarkerStatus(stamp === 'PASS' ? 'Pass' : stamp === 'FAIL' ? 'Fail' : stamp === 'REVIEW' || stamp === 'FIELD VERIFY' ? 'Review' : 'Draft');
                      setIsAddingMarker(true);
                      setPendingMarkerPoint(null);
                      setSelectedMarkerId(null);
                      setEditingMarkerId(null);
                      setMovingMarkerId(null);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                    title="Stamp preset"
                  >
                    <option value="">Stamp preset...</option>
                    <option>PASS</option>
                    <option>REVIEW</option>
                    <option>FAIL</option>
                    <option>FIELD VERIFY</option>
                    <option>TYP.</option>
                    <option>SEE CALC</option>
                    <option>REVISED</option>
                    <option>VOID</option>
                  </select>
                  <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    Drag markers directly. Use Edit to stretch arrows or resize box/cloud/text markers.
=======
                  {(['Arrow', 'Pin', 'Box', 'Cloud', 'Text'] as VisualMarkerStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setMarkerStyle(style);
                        setIsAddingMarker(true);
                        setPendingMarkerPoint(null);
                        setSelectedMarkerId(null);
                        setEditingMarkerId(null);
                        setMovingMarkerId(null);
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {style}
                    </button>
                  ))}
                  {(['PASS', 'REVIEW', 'FAIL', 'FIELD VERIFY', 'TYP.', 'SEE CALC', 'REVISED', 'VOID'] as string[]).map((stamp) => (
                    <button
                      key={stamp}
                      onClick={() => {
                        setMarkerStyle('Text');
                        setMarkerLabel(stamp);
                        setMarkerStatus(stamp === 'PASS' ? 'Pass' : stamp === 'FAIL' ? 'Fail' : stamp === 'REVIEW' || stamp === 'FIELD VERIFY' ? 'Review' : 'Draft');
                        setIsAddingMarker(true);
                        setPendingMarkerPoint(null);
                        setSelectedMarkerId(null);
                        setEditingMarkerId(null);
                        setMovingMarkerId(null);
                      }}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {stamp}
                    </button>
                  ))}
                  <span className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    Drag markers directly with your mouse to reposition them.
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
                  </span>
                  {(isAddingMarker || pendingMarkerPoint || movingMarkerId) && (
                    <button
                      onClick={cancelPendingMarker}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <span className="text-xs text-gray-500">
<<<<<<< HEAD
                    Use Markup tools to place callouts. You can now drag markers directly with your mouse like a PDF annotation tool. Arrow, Pin, Box, Cloud, and Text markers are supported. Arrows stretch by length; boxes/clouds/text stretch by width and height.
=======
                    Use Markup tools to place callouts. You can now drag markers directly with your mouse like a PDF annotation tool. Arrow, Pin, Box, Cloud, and Text markers are supported.
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
                  </span>
                </div>
              )}

              {activeVisualBoardTab === 'Documents' && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <LinkIcon size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">Linked documents:</span>
                  <span>{selectedMarker ? `${selectedMarkerDocuments.length} on selected marker` : `${getBoardDocumentCount(selectedBoard.id, visualMarkers)} on this board`}</span>
                  {selectedMarkerDocuments[0] && (
                    <button
                      onClick={() => handleOpen(selectedMarkerDocuments[0])}
                      className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Open primary
                    </button>
                  )}
                </div>
              )}

              {activeVisualBoardTab === 'Measure' && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <button
                    onClick={() => {
                      setIsMeasuring(true);
                      setPendingMeasurePoint(null);
                      setIsAddingMarker(false);
                      setMovingMarkerId(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      isMeasuring ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <MousePointer2 size={16} />
                    {isMeasuring ? 'Click two points on the board' : 'Measure Length'}
                  </button>
                  <input
                    value={measurementActualLength}
                    onChange={(event) => setMeasurementActualLength(event.target.value)}
                    className="w-36 rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Actual ft optional"
                  />
                  {(isMeasuring || pendingMeasurePoint) && (
                    <button
                      onClick={cancelMeasurement}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel measure
                    </button>
                  )}
                  <span className="text-xs text-gray-500">
                    Click point 1, then point 2. Enter a known actual length if you want the measurement labeled in feet.
                  </span>
                </div>
              )}

              {activeVisualBoardTab === 'View' && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <Maximize2 size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">View tools:</span>
                  <button onClick={() => setBoardZoom((value) => Math.min(2.5, Number((value + 0.1).toFixed(2))))} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Zoom in
                  </button>
                  <button onClick={() => setBoardZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(2))))} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Zoom out
                  </button>
                  <button onClick={() => setBoardZoom(1)} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Reset {Math.round(boardZoom * 100)}%
                  </button>
                  <select value={labelDisplayOverride} onChange={(event) => setLabelDisplayOverride(event.target.value as 'Normal' | 'Show all' | 'Hide all')} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                    <option>Normal</option>
                    <option>Show all</option>
                    <option>Hide all</option>
                  </select>
                  {(['Pass', 'Review', 'Fail', 'Draft', 'Unknown'] as VisualMarkerStatus[]).map((status) => (
                    <label key={status} className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold ${markerStatusClasses(status)}`}>
                      <input
                        type="checkbox"
                        checked={visibleStatuses[status]}
                        onChange={(event) => setVisibleStatuses((prev) => ({ ...prev, [status]: event.target.checked }))}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              )}

              {activeVisualBoardTab === 'Review' && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Review schedule:</span>
                  <span>{selectedBoardMarkers.length} marker{selectedBoardMarkers.length === 1 ? '' : 's'}</span>
                  <button
                    onClick={exportMarkerScheduleCsv}
                    className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Export marker schedule CSV
                  </button>
                  <span className="text-xs text-gray-500">Use this as a calculation index tied to the visual board.</span>
                </div>
              )}

              {activeVisualBoardTab === 'Settings' && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Board settings:</span>
                  <span>{selectedBoard.kind}</span>
                  <span>•</span>
                  <span>{selectedBoard.imageName}</span>
                  <textarea
                    value={boardNotesDraft}
                    onChange={(event) => setBoardNotesDraft(event.target.value)}
                    className="min-h-9 w-64 rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="Board notes..."
                  />
                  <button
                    onClick={saveBoardNotes}
                    className="rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    Save notes
                  </button>
                  <button
                    onClick={() => handleDeleteVisualBoard(selectedBoard.id)}
                    className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={13} />
                    Delete board
                  </button>
                </div>
              )}
            </div>
          </div>

          {isAddingMarker && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <MousePointer2 size={16} />
                Click directly on the plan/photo where this calculation belongs.
              </div>
            </div>
          )}

          {movingMarkerId && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <Move size={16} />
                Click a new location on the plan/photo to move the selected marker, or just drag a marker directly with your mouse.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="max-h-[72vh] overflow-auto bg-slate-100 p-4">
              <div className="mx-auto w-fit rounded-lg border border-gray-300 bg-white p-2 shadow-sm">
                <div ref={boardCanvasRef} className="relative inline-block origin-top-left" style={{ transform: `scale(${boardZoom})`, transformOrigin: "top left" }}>
                  <img
                    src={selectedBoard.imageDataUrl}
                    alt={selectedBoard.name}
                    onClick={(event) => {
                      if (isMeasuring) {
                        handleBoardMeasureClick(event.clientX, event.clientY);
                        return;
                      }
                      handleBoardImageClick(event);
                    }}
                    draggable={false}
                    className={`max-h-[68vh] max-w-full object-contain ${isAddingMarker || movingMarkerId || isMeasuring ? 'cursor-crosshair' : draggingMarkerId ? 'cursor-grabbing' : ''}`}
                  />

                  {visibleBoardMarkers.map((marker) => renderVisualMarkerButton(marker))}

                  {selectedBoardMeasurements.map((measurement) => {
                    const lengthPercent = distanceBetweenPercentPoints(measurement);
                    return (
                      <button
                        key={measurement.id}
                        type="button"
                        onClick={() => handleDeleteMeasurement(measurement.id)}
                        className="absolute z-10 bg-transparent p-0"
                        style={{ left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                        title="Click measurement in list to delete"
                      >
                        <svg className="absolute inset-0 h-full w-full overflow-visible" style={{ pointerEvents: 'none' }}>
                          <line
                            x1={`${measurement.x1Percent}%`}
                            y1={`${measurement.y1Percent}%`}
                            x2={`${measurement.x2Percent}%`}
                            y2={`${measurement.y2Percent}%`}
                            stroke="#7c3aed"
                            strokeWidth="2"
                            strokeDasharray="5 4"
                          />
                          <circle cx={`${measurement.x1Percent}%`} cy={`${measurement.y1Percent}%`} r="4" fill="#7c3aed" />
                          <circle cx={`${measurement.x2Percent}%`} cy={`${measurement.y2Percent}%`} r="4" fill="#7c3aed" />
                          <text
                            x={`${(measurement.x1Percent + measurement.x2Percent) / 2}%`}
                            y={`${(measurement.y1Percent + measurement.y2Percent) / 2}%`}
                            fill="#5b21b6"
                            fontSize="12"
                            fontWeight="700"
                            paintOrder="stroke"
                            stroke="white"
                            strokeWidth="3"
                          >
                            {measurement.actualLengthFt ? `${measurement.actualLengthFt.toFixed(2)} ft` : `${lengthPercent.toFixed(1)}%`}
                          </text>
                        </svg>
                      </button>
                    );
                  })}

                  {pendingMarkerPoint && (
                    <div
                      className="absolute z-20 -translate-x-1/2 -translate-y-full rounded-full border border-amber-300 bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 shadow-lg"
                      style={{
                        left: `${pendingMarkerPoint.xPercent}%`,
                        top: `${pendingMarkerPoint.yPercent}%`,
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} />
                        {markerStyle} marker
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t border-gray-200 bg-gray-50 p-4 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-bold text-gray-900">{activeVisualBoardTab} Inspector</h3>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded border border-gray-200 bg-white p-2">
                  <dt className="font-semibold uppercase tracking-wide text-gray-500">Markers</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900">{selectedBoardMarkers.length}</dd>
                </div>
                <div className="rounded border border-gray-200 bg-white p-2">
                  <dt className="font-semibold uppercase tracking-wide text-gray-500">Linked docs</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900">{getBoardDocumentCount(selectedBoard.id, visualMarkers)}</dd>
                </div>
              </dl>

              <div className="mt-3 rounded border border-gray-200 bg-white p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Status Summary</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {(['Pass', 'Review', 'Fail', 'Draft', 'Unknown'] as VisualMarkerStatus[]).map((status) => {
                    const count = getBoardStatusCounts(selectedBoard.id, visualMarkers)[status];
                    return (
                      <span key={status} className={`rounded-full border px-2 py-1 font-bold ${markerStatusClasses(status)}`}>
                        {status}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>

              {activeVisualBoardTab === 'Measure' && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Measurements</h4>
                  {selectedBoardMeasurements.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">No measurements yet. Use Measure Length, then click two points.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {selectedBoardMeasurements.map((measurement) => (
                        <div key={measurement.id} className="rounded border border-gray-200 bg-gray-50 p-2 text-xs">
                          <div className="font-bold text-gray-900">{measurement.label}</div>
                          <div className="mt-1 text-gray-500">
                            {measurement.actualLengthFt ? `${measurement.actualLengthFt.toFixed(2)} ft` : `${distanceBetweenPercentPoints(measurement).toFixed(1)}% board distance`}
                          </div>
                          <button
                            onClick={() => handleDeleteMeasurement(measurement.id)}
                            className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete measurement
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeVisualBoardTab === 'Review' && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Marker Schedule</h4>
                  <div className="mt-2 max-h-72 overflow-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-gray-500">
                        <tr>
                          <th className="py-1">Marker</th>
                          <th className="py-1">Status</th>
                          <th className="py-1">Docs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBoardMarkers.map((marker) => (
                          <tr key={marker.id} className="border-t border-gray-100">
                            <td className="py-1 font-semibold">{marker.label}</td>
                            <td className="py-1">{normalizeMarkerStatus(marker.status)}</td>
                            <td className="py-1">{getMarkerDocuments(marker, documents).length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pendingMarkerPoint && renderMarkerForm('new')}

              {editingMarkerId && renderMarkerForm('edit')}

              {selectedMarker && !editingMarkerId && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <MapPin size={15} className="text-blue-600" />
                    {selectedMarker.label}
                  </h4>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
                    <div className="rounded bg-gray-50 p-2">
                      <div className="font-semibold text-gray-500">Style</div>
                      <div className="mt-1 font-bold text-gray-900">
                        {normalizeMarkerStyle(selectedMarker.style)}
                      </div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="font-semibold text-gray-500">Direction</div>
                      <div className="mt-1 font-bold text-gray-900">
                        {normalizeMarkerDirection(selectedMarker.direction)}
                      </div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="font-semibold text-gray-500">Size</div>
                      <div className="mt-1 font-bold text-gray-900">
                        {normalizeMarkerSize(selectedMarker.size)}
                      </div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="font-semibold text-gray-500">Label</div>
                      <div className="mt-1 font-bold text-gray-900">
                        {normalizeMarkerLabelVisibility(selectedMarker.labelVisibility)}
                      </div>
                    </div>
<<<<<<< HEAD
                    <div className="rounded bg-gray-50 p-2">
                      <div className="font-semibold text-gray-500">Shape</div>
                      <div className="mt-1 font-bold text-gray-900">
                        {normalizeMarkerStyle(selectedMarker.style) === 'Arrow'
                          ? `${selectedMarker.arrowLength ?? getMarkerSizeConfig(normalizeMarkerSize(selectedMarker.size)).arrowLength}px`
                          : normalizeMarkerStyle(selectedMarker.style) === 'Pin'
                            ? 'Pin size'
                            : `${selectedMarker.markerWidth ?? getDefaultMarkerWidth(normalizeMarkerStyle(selectedMarker.style), getMarkerSizeConfig(normalizeMarkerSize(selectedMarker.size)))} × ${selectedMarker.markerHeight ?? getDefaultMarkerHeight(normalizeMarkerStyle(selectedMarker.style), getMarkerSizeConfig(normalizeMarkerSize(selectedMarker.size)))}px`}
                      </div>
                    </div>
=======
>>>>>>> c174f6990a60bedccf5cdf150c02b2425172e477
                    <div className={`rounded border p-2 ${markerStatusClasses(normalizeMarkerStatus(selectedMarker.status))}`}>
                      <div className="font-semibold opacity-80">Status</div>
                      <div className="mt-1 font-bold">
                        {markerStatusLabel(normalizeMarkerStatus(selectedMarker.status))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <LinkIcon size={13} />
                      Linked documents
                    </div>
                    {selectedMarkerDocuments.length === 0 ? (
                      <div className="mt-1 text-amber-700">Documents not found</div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {selectedMarkerDocuments.map((document) => (
                          <div key={document.id} className="rounded border border-gray-200 bg-white p-2">
                            <div className="font-semibold text-gray-900">{document.name}</div>
                            <div className="mt-1 text-[11px] text-gray-500">{document.type} • {document.module}</div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleOpen(document)}
                                className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Open/Edit
                              </button>
                              <button
                                onClick={() => handlePrint(document)}
                                className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Print
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedMarker.notes && (
                    <div className="mt-3 text-xs text-gray-600">
                      <div className="font-semibold text-gray-900">Notes</div>
                      <p className="mt-1">{selectedMarker.notes}</p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => startEditMarker(selectedMarker)}
                      className="rounded border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => startMoveMarker(selectedMarker.id)}
                      className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      Move
                    </button>
                    <button
                      onClick={() => handleDeleteVisualMarker(selectedMarker.id)}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete Marker
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">Marker List</h4>
                {selectedBoardMarkers.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">No markers yet. Click Add Marker to place the first one.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {selectedBoardMarkers.map((marker) => {
                      const markerDocuments = getMarkerDocuments(marker, documents);
                      const markerDocument = markerDocuments[0] ?? null;
                      return (
                        <button
                          key={marker.id}
                          onClick={() => {
                            setSelectedMarkerId(marker.id);
                            setEditingMarkerId(null);
                            setMovingMarkerId(null);
                          }}
                          className={`w-full rounded border px-3 py-2 text-left text-xs ${
                            selectedMarkerId === marker.id
                              ? 'border-blue-300 bg-blue-50 text-blue-900'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-bold">
                              <span className="inline-flex min-w-6 justify-center text-[11px] text-gray-500">
                                {normalizeMarkerStyle(marker.style) === 'Arrow'
                                  ? markerArrowSymbol(normalizeMarkerDirection(marker.direction))
                                  : normalizeMarkerStyle(marker.style) === 'Box'
                                    ? '▭'
                                    : normalizeMarkerStyle(marker.style) === 'Cloud'
                                      ? '☁'
                                      : normalizeMarkerStyle(marker.style) === 'Text'
                                        ? 'T'
                                        : '●'}
                              </span>
                              {marker.label}
                            </div>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${markerStatusClasses(normalizeMarkerStatus(marker.status))}`}>
                              {markerStatusLabel(normalizeMarkerStatus(marker.status))}
                            </span>
                          </div>
                          <div className="mt-1 truncate text-gray-500">
                            {normalizeMarkerStyle(marker.style)} • {normalizeMarkerSize(marker.size)} • {markerDocument?.name ?? 'Document not found'}{markerDocuments.length > 1 ? ` + ${markerDocuments.length - 1} more` : ''}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  };

  const renderVisualMapView = () => {
    if (selectedBoard) return renderVisualMapBoard();

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Map className="text-blue-600" size={22} />
                Visual Map
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Upload a plan, elevation, or site photo for {activeProject.name}. This creates a visual board that will later hold markers linked to saved calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_auto]">
              <input
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Board name, optional"
              />
              <select
                value={newBoardKind}
                onChange={(event) => setNewBoardKind(event.target.value as VisualBoardKind)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option>Plan</option>
                <option>Elevation</option>
                <option>Site Photo</option>
                <option>Other</option>
              </select>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Upload size={16} />
                Upload Plan / Photo
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleVisualBoardUpload}
                className="hidden"
              />
            </div>
          </div>

          {uploadMessage && (
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {uploadMessage}
            </div>
          )}
        </div>

        {visualBoards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <ImageIcon className="mx-auto text-gray-400" size={42} />
            <h3 className="mt-4 text-lg font-bold text-gray-900">No visual boards yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Upload a plan, elevation, or site photo to start the visual document map for this project.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {activeProject.name} Visual Boards
              </h3>
              <span className="text-sm text-gray-500">
                {visualBoards.length} board{visualBoards.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visualBoards.map((board) => (
                <div key={board.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBoardId(board.id);
                      setSelectedMarkerId(null);
                      setActiveVisualBoardTab('Markup');
                      cancelPendingMarker();
                    }}
                    className="group block w-full text-left"
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img src={board.imageDataUrl} alt={board.name} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{board.name}</h4>
                          <p className="mt-1 text-xs text-gray-500">{board.kind} • {board.imageName}</p>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${markerStatusClasses(getBoardPrimaryStatus(board.id, visualMarkers))}`}>
                          {getBoardPrimaryStatus(board.id, visualMarkers)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{getBoardDocumentCount(board.id, visualMarkers)} linked doc{getBoardDocumentCount(board.id, visualMarkers) === 1 ? '' : 's'}</span>
                        <span>•</span>
                        <span>Last edited {formatDocumentDate(board.updatedAt)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1 text-[10px]">
                        {(['Pass', 'Review', 'Fail', 'Draft', 'Unknown'] as VisualMarkerStatus[]).map((status) => {
                          const count = getBoardStatusCounts(board.id, visualMarkers)[status];
                          if (count === 0) return null;
                          return (
                            <span key={status} className={`rounded-full border px-2 py-0.5 font-bold ${markerStatusClasses(status)}`}>
                              {status} {count}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </button>

                  <div className="flex justify-end border-t border-gray-100 px-4 py-2">
                    <button
                      onClick={() => handleDeleteVisualBoard(board.id)}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{beamPrintStyles}</style>
      {printDocument && (
        <div className="beam-print-report" dangerouslySetInnerHTML={{ __html: printDocument.reportHtml }} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
            <FileText className="text-blue-600" />
            Documents
          </h1>
          <p className="mt-2 text-gray-500">
            Saved calculation outputs and visual document maps for <span className="font-semibold text-gray-800">{activeProject.name}</span>.
          </p>
        </div>

        {documentsView === 'list' && (
          <label className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search documents..."
            />
          </label>
        )}
      </div>

      <div className="flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setDocumentsView('list')}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
            documentsView === 'list'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <LayoutList size={16} />
          List
        </button>
        <button
          onClick={() => setDocumentsView('visual')}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
            documentsView === 'visual'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Map size={16} />
          Visual Map
        </button>
      </div>

      {documentsView === 'list' ? renderListView() : renderVisualMapView()}

      {hoverDocument && (
        <div
          className="pointer-events-none fixed z-[140] w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-xl"
          style={{
            left: Math.min(hoverPoint.x + 14, window.innerWidth - 340),
            top: Math.min(hoverPoint.y + 14, window.innerHeight - 260),
          }}
        >
          <div className="mb-2 border-b border-gray-100 pb-2">
            <div className="font-semibold text-gray-900">{hoverDocument.name}</div>
            <div className="text-gray-500">{hoverDocument.type}</div>
          </div>

          <HoverModelPreview document={hoverDocument} />

          <div className="mt-3 space-y-1">
            {buildPreviewSummary(hoverDocument).map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded bg-gray-50 p-2 text-[11px] text-gray-500">
            Clicking print sends this saved report straight to the browser print dialog.
          </div>
        </div>
      )}
      {hoverVisualMarker && (
        <div
          className="pointer-events-none fixed z-[150] w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-xl"
          style={{
            left: Math.min(hoverPoint.x + 14, window.innerWidth - 340),
            top: Math.min(hoverPoint.y + 14, window.innerHeight - 300),
          }}
        >
          <div className="mb-2 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              {normalizeMarkerStyle(hoverVisualMarker.style) === 'Arrow' ? (
                <span className="text-blue-600">{markerArrowSymbol(normalizeMarkerDirection(hoverVisualMarker.direction))}</span>
              ) : (
                <MapPin size={14} className="text-blue-600" />
              )}
              {hoverVisualMarker.label}
            </div>
            <div className="mt-1 text-gray-500">
              {hoverVisualMarkerPrimaryDocument?.name ?? 'Document not found'}{hoverVisualMarkerDocuments.length > 1 ? ` + ${hoverVisualMarkerDocuments.length - 1} more` : ''}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className={`rounded-full border px-2 py-0.5 font-bold ${markerStatusClasses(normalizeMarkerStatus(hoverVisualMarker.status))}`}>
                {markerStatusLabel(normalizeMarkerStatus(hoverVisualMarker.status))}
              </span>
              <span className="text-gray-400">
                {normalizeMarkerStyle(hoverVisualMarker.style)} • {normalizeMarkerDirection(hoverVisualMarker.direction)} • {normalizeMarkerSize(hoverVisualMarker.size)}
              </span>
            </div>
          </div>

          {hoverVisualMarkerPrimaryDocument ? (
            <>
              <HoverModelPreview document={hoverVisualMarkerPrimaryDocument} />
              <div className="mt-3 space-y-1">
                {buildPreviewSummary(hoverVisualMarkerPrimaryDocument).map(([label, value]) => (
                  <div key={label} className="grid grid-cols-2 gap-2">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">
              This marker is linked to a document that no longer exists.
            </div>
          )}

          {hoverVisualMarker.notes && (
            <div className="mt-2 rounded bg-gray-50 p-2 text-[11px] text-gray-600">
              {hoverVisualMarker.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
