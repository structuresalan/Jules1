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
type VisualBoardKind = 'Plan' | 'Elevation' | 'Site Photo' | 'Other';
type VisualMarkerStyle = 'Pin' | 'Arrow';
type VisualMarkerDirection = 'Up' | 'Down' | 'Left' | 'Right';

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
  createdAt: string;
  updatedAt: string;
}

const VISUAL_BOARDS_STORAGE_KEY = 'struccalc.visualBoards.v1';
const VISUAL_MARKERS_STORAGE_KEY = 'struccalc.visualMarkers.v1';

const makeVisualBoardId = () => `visual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const makeVisualMarkerId = () => `marker_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

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

const deleteVisualBoard = (boardId: string) => {
  writeAllVisualBoards(getAllVisualBoards().filter((board) => board.id !== boardId));
  writeAllVisualMarkers(getAllVisualMarkers().filter((marker) => marker.boardId !== boardId));
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
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [pendingMarkerPoint, setPendingMarkerPoint] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [markerLabel, setMarkerLabel] = useState('');
  const [markerDocumentIds, setMarkerDocumentIds] = useState<string[]>([]);
  const [markerNotes, setMarkerNotes] = useState('');
  const [markerStyle, setMarkerStyle] = useState<VisualMarkerStyle>('Pin');
  const [markerDirection, setMarkerDirection] = useState<VisualMarkerDirection>('Down');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [movingMarkerId, setMovingMarkerId] = useState<string | null>(null);
  const [hoverVisualMarker, setHoverVisualMarker] = useState<VisualMarker | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
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
      };

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
    setMarkerLabel(`M${selectedBoardMarkers.length + 1}`);
    setMarkerDocumentIds(documents[0]?.id ? [documents[0].id] : []);
    setMarkerNotes('');
    setMarkerStyle('Pin');
    setMarkerDirection('Down');
    setSelectedMarkerId(null);
    setEditingMarkerId(null);
    setIsAddingMarker(false);
  };

  const cancelPendingMarker = () => {
    setPendingMarkerPoint(null);
    resetMarkerForm();
    setIsAddingMarker(false);
    setEditingMarkerId(null);
    setMovingMarkerId(null);
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
    setHoverVisualMarker(null);
    refreshVisualBoards();
    refreshVisualMarkers();
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
            <option>Pin</option>
            <option>Arrow</option>
          </select>
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          Direction
          <select
            value={markerDirection}
            onChange={(event) => setMarkerDirection(event.target.value as VisualMarkerDirection)}
            className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option>Up</option>
            <option>Down</option>
            <option>Left</option>
            <option>Right</option>
          </select>
        </label>
      </div>

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
    const isSelected = selectedMarkerId === marker.id;
    const isMoving = movingMarkerId === marker.id;

    return (
      <button
        key={marker.id}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setSelectedMarkerId(marker.id);
          setPendingMarkerPoint(null);
          setIsAddingMarker(false);
        }}
        onMouseEnter={(event) => {
          setHoverVisualMarker(marker);
          setHoverPoint({ x: event.clientX, y: event.clientY });
        }}
        onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
        onMouseLeave={() => setHoverVisualMarker(null)}
        className={`absolute z-10 -translate-x-1/2 -translate-y-full rounded-full border px-2 py-1 text-xs font-bold shadow-lg ${
          isMoving
            ? 'border-amber-500 bg-amber-400 text-white'
            : isSelected
              ? 'border-blue-700 bg-blue-600 text-white'
              : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
        }`}
        style={{
          left: `${marker.xPercent}%`,
          top: `${marker.yPercent}%`,
        }}
        title={markerDocument ? `${marker.label}: ${markerDocument.name}${markerDocuments.length > 1 ? ` + ${markerDocuments.length - 1} more` : ''}` : marker.label}
      >
        <span className="inline-flex items-center gap-1">
          {style === 'Arrow' ? (
            <span className="text-sm leading-none">{markerArrowSymbol(direction)}</span>
          ) : (
            <MapPin size={13} />
          )}
          {marker.label}
          {markerDocuments.length > 1 ? <span className="rounded-full bg-blue-100 px-1 text-[10px] text-blue-700">{markerDocuments.length}</span> : null}
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
            <div className="flex flex-wrap gap-2">
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
              {(isAddingMarker || pendingMarkerPoint || movingMarkerId) && (
                <button
                  onClick={cancelPendingMarker}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
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
                Click a new location on the plan/photo to move the selected marker.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="max-h-[72vh] overflow-auto bg-slate-100 p-4">
              <div className="mx-auto w-fit rounded-lg border border-gray-300 bg-white p-2 shadow-sm">
                <div className="relative inline-block">
                  <img
                    src={selectedBoard.imageDataUrl}
                    alt={selectedBoard.name}
                    onClick={handleBoardImageClick}
                    className={`max-h-[68vh] max-w-full object-contain ${isAddingMarker || movingMarkerId ? 'cursor-crosshair' : ''}`}
                  />

                  {selectedBoardMarkers.map((marker) => renderVisualMarkerButton(marker))}

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
                        New
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="border-t border-gray-200 bg-gray-50 p-4 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-bold text-gray-900">Visual Map Controls</h3>
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

              {pendingMarkerPoint && renderMarkerForm('new')}

              {editingMarkerId && renderMarkerForm('edit')}

              {selectedMarker && !editingMarkerId && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <MapPin size={15} className="text-blue-600" />
                    {selectedMarker.label}
                  </h4>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
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
                          <div className="flex items-center gap-2 font-bold">
                            {normalizeMarkerStyle(marker.style) === 'Arrow' ? markerArrowSymbol(normalizeMarkerDirection(marker.direction)) : <MapPin size={13} />}
                            {marker.label}
                          </div>
                          <div className="mt-1 truncate text-gray-500">
                            {markerDocument?.name ?? 'Document not found'}{markerDocuments.length > 1 ? ` + ${markerDocuments.length - 1} more` : ''}
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
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {getBoardDocumentCount(board.id, visualMarkers)} docs
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">Last edited {formatDocumentDate(board.updatedAt)}</p>
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
            <div className="mt-1 text-[11px] text-gray-400">
              {normalizeMarkerStyle(hoverVisualMarker.style)} • {normalizeMarkerDirection(hoverVisualMarker.direction)}
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
