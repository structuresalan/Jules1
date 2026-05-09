import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Camera,
  CircleDollarSign,
  Download,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Map as MapIcon,
  Network,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useWebsiteStyleSettings } from '../utils/websiteStyle';

type WorkspaceTab = 'Boards' | 'Items' | 'Photos' | 'Graph' | 'Schedule' | 'Costs';
type WorkspaceStatus = 'Draft' | 'Review' | 'Pass' | 'Fail' | 'Field Verify' | 'Resolved';
type WorkspaceItemType = 'Beam' | 'Column' | 'Header' | 'Footing' | 'Wall' | 'Connection' | 'Opening' | 'Repair Area' | 'General Note';
type BoardKind = 'Plan' | 'Elevation' | 'Site Photo' | 'PDF' | 'Other';
type AnnotationTool =
  | 'Select'
  | 'Arrow'
  | 'Line'
  | 'Box'
  | 'Cloud'
  | 'Highlight'
  | 'Text'
  | 'Stamp'
  | 'Count'
  | 'Reference'
  | 'Length'
  | 'Perimeter'
  | 'Area';
type AnnotationType = 'Arrow' | 'Line' | 'Box' | 'Cloud' | 'Highlight' | 'Text' | 'Stamp' | 'Count' | 'Measurement';
type MeasurementKind = 'Reference' | 'Length' | 'Perimeter' | 'Area';
type GraphNodeType = 'Item' | 'Board' | 'Annotation' | 'Photo' | 'Cost';

interface VisualPoint {
  x: number;
  y: number;
}

interface WorkspaceItem {
  id: string;
  name: string;
  type: WorkspaceItemType;
  material: string;
  status: WorkspaceStatus;
  section: string;
  spanFt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface VisualBoard {
  id: string;
  name: string;
  kind: BoardKind;
  fileName: string;
  fileType: string;
  dataUrl: string;
  notes: string;
  scaleFtPerPercent?: number;
  createdAt: string;
  updatedAt: string;
}

interface VisualAnnotation {
  id: string;
  boardId: string;
  itemId?: string;
  type: AnnotationType;
  status: WorkspaceStatus;
  label: string;
  notes: string;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  width?: number;
  height?: number;
  points?: VisualPoint[];
  measurementKind?: MeasurementKind;
  knownLengthFt?: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkspacePhoto {
  id: string;
  itemId?: string;
  name: string;
  dataUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceEstimate {
  id: string;
  itemId?: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  status: 'Draft' | 'Allowance' | 'Included' | 'Needs Review' | 'Not Included';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  createdAt: string;
}

interface GraphNode {
  id: string;
  type: GraphNodeType;
  title: string;
  subtitle: string;
  status?: WorkspaceStatus;
  sourceId: string;
}

interface GraphPosition {
  x: number;
  y: number;
}

const STORAGE_KEYS = {
  items: 'simplifystruct.visualWorkspace.items.v1',
  boards: 'simplifystruct.visualWorkspace.boards.v1',
  annotations: 'simplifystruct.visualWorkspace.annotations.v1',
  photos: 'simplifystruct.visualWorkspace.photos.v1',
  estimates: 'simplifystruct.visualWorkspace.estimates.v1',
  edges: 'simplifystruct.visualWorkspace.edges.v1',
  graphPositions: 'simplifystruct.visualWorkspace.graphPositions.v1',
};

const statusOptions: WorkspaceStatus[] = ['Draft', 'Review', 'Pass', 'Fail', 'Field Verify', 'Resolved'];
const itemTypeOptions: WorkspaceItemType[] = ['Beam', 'Column', 'Header', 'Footing', 'Wall', 'Connection', 'Opening', 'Repair Area', 'General Note'];
const stampOptions = ['PASS', 'REVIEW', 'FAIL', 'FIELD VERIFY', 'TYP.', 'SEE CALC', 'REVISED', 'VOID', 'SUPERSEDED', 'AS-BUILT', 'BY OTHERS', 'N.I.C.'];

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
};

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const statusClasses = (status: WorkspaceStatus) => {
  if (status === 'Pass' || status === 'Resolved') return 'border-green-300 bg-green-50 text-green-700';
  if (status === 'Review' || status === 'Field Verify') return 'border-amber-300 bg-amber-50 text-amber-700';
  if (status === 'Fail') return 'border-red-300 bg-red-50 text-red-700';
  return 'border-slate-300 bg-slate-50 text-slate-700';
};

const statusStroke = (status: WorkspaceStatus) => {
  if (status === 'Pass' || status === 'Resolved') return '#16a34a';
  if (status === 'Review' || status === 'Field Verify') return '#d97706';
  if (status === 'Fail') return '#dc2626';
  return '#2563eb';
};

const getPoint = (event: React.MouseEvent<HTMLElement>, element: HTMLElement | null): VisualPoint | null => {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  return {
    x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
  };
};

const pointDistance = (a: VisualPoint, b: VisualPoint) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const polylineLength = (points: VisualPoint[], closed = false) => {
  if (points.length < 2) return 0;
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += pointDistance(points[index - 1], points[index]);
  }
  if (closed && points.length > 2) length += pointDistance(points[points.length - 1], points[0]);
  return length;
};

const polygonArea = (points: VisualPoint[]) => {
  if (points.length < 3) return 0;
  let sum = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    sum += point.x * next.y - next.x * point.y;
  });
  return Math.abs(sum) / 2;
};

const centroid = (points: VisualPoint[]) => {
  if (!points.length) return { x: 50, y: 50 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
};

const formatLength = (percentLength: number, scaleFtPerPercent?: number) => {
  if (!scaleFtPerPercent) return `${percentLength.toFixed(1)}% board`;
  return `${(percentLength * scaleFtPerPercent).toFixed(2)} ft`;
};

const formatArea = (percentArea: number, scaleFtPerPercent?: number) => {
  if (!scaleFtPerPercent) return `${percentArea.toFixed(1)}%² board`;
  return `${(percentArea * scaleFtPerPercent * scaleFtPerPercent).toFixed(2)} sf`;
};

const escapeCsvCell = (value: string | number | undefined) => {
  const text = value === undefined ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const downloadCsv = (filename: string, rows: Array<Array<string | number | undefined>>) => {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const VisualWorkspace: React.FC = () => {
  const { isDesktopStyle, isDesktopGlass } = useWebsiteStyleSettings();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('Boards');
  const [items, setItems] = useState<WorkspaceItem[]>(() => readStorage<WorkspaceItem[]>(STORAGE_KEYS.items, []));
  const [boards, setBoards] = useState<VisualBoard[]>(() => readStorage<VisualBoard[]>(STORAGE_KEYS.boards, []));
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>(() => readStorage<VisualAnnotation[]>(STORAGE_KEYS.annotations, []));
  const [photos, setPhotos] = useState<WorkspacePhoto[]>(() => readStorage<WorkspacePhoto[]>(STORAGE_KEYS.photos, []));
  const [estimates, setEstimates] = useState<WorkspaceEstimate[]>(() => readStorage<WorkspaceEstimate[]>(STORAGE_KEYS.estimates, []));
  const [manualEdges, setManualEdges] = useState<WorkspaceEdge[]>(() => readStorage<WorkspaceEdge[]>(STORAGE_KEYS.edges, []));
  const [graphPositions, setGraphPositions] = useState<Record<string, GraphPosition>>(() =>
    readStorage<Record<string, GraphPosition>>(STORAGE_KEYS.graphPositions, {}),
  );

  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState('');
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState('');
  const [draggingAnnotationId, setDraggingAnnotationId] = useState('');
  const annotationDragOffsetRef = useRef<VisualPoint>({ x: 0, y: 0 });

  const [boardName, setBoardName] = useState('');
  const [boardKind, setBoardKind] = useState<BoardKind>('Plan');
  const [boardNotes, setBoardNotes] = useState('');

  const [tool, setTool] = useState<AnnotationTool>('Select');
  const [annotationStatus, setAnnotationStatus] = useState<WorkspaceStatus>('Draft');
  const [annotationLabel, setAnnotationLabel] = useState('');
  const [annotationNotes, setAnnotationNotes] = useState('');
  const [selectedToolItemId, setSelectedToolItemId] = useState('');
  const [stampPreset, setStampPreset] = useState('FIELD VERIFY');
  const [referenceKnownFt, setReferenceKnownFt] = useState('');
  const [pendingMeasurePoints, setPendingMeasurePoints] = useState<VisualPoint[]>([]);
  const [draftAnnotation, setDraftAnnotation] = useState<VisualAnnotation | null>(null);
  const [showBoardLibrary, setShowBoardLibrary] = useState(true);
  const [showBoardInspector, setShowBoardInspector] = useState(true);
  const [boardZoom, setBoardZoom] = useState(1);

  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<WorkspaceItemType>('Beam');
  const [itemMaterial, setItemMaterial] = useState('Steel');
  const [itemStatus, setItemStatus] = useState<WorkspaceStatus>('Draft');
  const [itemSection, setItemSection] = useState('');
  const [itemSpanFt, setItemSpanFt] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [photoItemId, setPhotoItemId] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');

  const [estimateItemId, setEstimateItemId] = useState('');
  const [estimateDescription, setEstimateDescription] = useState('');
  const [estimateCategory, setEstimateCategory] = useState('Steel');
  const [estimateQuantity, setEstimateQuantity] = useState('1');
  const [estimateUnit, setEstimateUnit] = useState('EA');
  const [estimateUnitCost, setEstimateUnitCost] = useState('0');

  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeRelation, setEdgeRelation] = useState('references');
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState('');
  const [draggingNodeId, setDraggingNodeId] = useState('');
  const [draggingNodeOffset, setDraggingNodeOffset] = useState({ x: 0, y: 0 });
  const [showGraphLibrary, setShowGraphLibrary] = useState(false);
  const [showGraphInspector, setShowGraphInspector] = useState(true);
  const [graphZoom, setGraphZoom] = useState(1);

  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<VisualPoint | null>(null);

  const selectedBoard = useMemo(() => boards.find((board) => board.id === selectedBoardId) ?? boards[0] ?? null, [boards, selectedBoardId]);
  const selectedAnnotation = useMemo(
    () => annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null,
    [annotations, selectedAnnotationId],
  );
  const boardAnnotations = useMemo(
    () => (selectedBoard ? annotations.filter((annotation) => annotation.boardId === selectedBoard.id) : []),
    [annotations, selectedBoard],
  );

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => [item.name, item.type, item.material, item.section, item.status, item.notes].join(' ').toLowerCase().includes(query));
  }, [itemSearch, items]);

  const graphNodes = useMemo<GraphNode[]>(() => {
    const itemNodes = items.map((item): GraphNode => ({
      id: `item:${item.id}`,
      type: 'Item',
      title: item.name,
      subtitle: `${item.type}${item.section ? ` • ${item.section}` : ''}`,
      status: item.status,
      sourceId: item.id,
    }));

    const boardNodes = boards.map((board): GraphNode => ({
      id: `board:${board.id}`,
      type: 'Board',
      title: board.name,
      subtitle: `${board.kind} • ${board.fileName}`,
      sourceId: board.id,
    }));

    const annotationNodes = annotations.map((annotation): GraphNode => ({
      id: `annotation:${annotation.id}`,
      type: 'Annotation',
      title: annotation.label || annotation.type,
      subtitle: `${annotation.type} • ${annotation.status}`,
      status: annotation.status,
      sourceId: annotation.id,
    }));

    const photoNodes = photos.map((photo): GraphNode => ({
      id: `photo:${photo.id}`,
      type: 'Photo',
      title: photo.name,
      subtitle: photo.itemId ? 'Linked site/member photo' : 'Unlinked photo',
      sourceId: photo.id,
    }));

    const costNodes = estimates.map((estimate): GraphNode => ({
      id: `cost:${estimate.id}`,
      type: 'Cost',
      title: estimate.description,
      subtitle: `${estimate.quantity} ${estimate.unit} • $${(estimate.quantity * estimate.unitCost).toFixed(2)}`,
      sourceId: estimate.id,
    }));

    return [...itemNodes, ...boardNodes, ...annotationNodes, ...photoNodes, ...costNodes];
  }, [annotations, boards, estimates, items, photos]);

  const selectedGraphNode = useMemo(
    () => graphNodes.find((node) => node.id === selectedGraphNodeId) ?? graphNodes[0] ?? null,
    [graphNodes, selectedGraphNodeId],
  );

  const graphEdges = useMemo<WorkspaceEdge[]>(() => {
    const autoEdges: WorkspaceEdge[] = [];

    annotations.forEach((annotation) => {
      autoEdges.push({
        id: `auto-board-${annotation.id}`,
        sourceId: `annotation:${annotation.id}`,
        targetId: `board:${annotation.boardId}`,
        relation: 'located on',
        createdAt: annotation.createdAt,
      });

      if (annotation.itemId) {
        autoEdges.push({
          id: `auto-item-${annotation.id}`,
          sourceId: `annotation:${annotation.id}`,
          targetId: `item:${annotation.itemId}`,
          relation: 'marks',
          createdAt: annotation.createdAt,
        });
      }
    });

    photos.forEach((photo) => {
      if (photo.itemId) {
        autoEdges.push({
          id: `auto-photo-${photo.id}`,
          sourceId: `photo:${photo.id}`,
          targetId: `item:${photo.itemId}`,
          relation: 'photo of',
          createdAt: photo.createdAt,
        });
      }
    });

    estimates.forEach((estimate) => {
      if (estimate.itemId) {
        autoEdges.push({
          id: `auto-cost-${estimate.id}`,
          sourceId: `cost:${estimate.id}`,
          targetId: `item:${estimate.itemId}`,
          relation: 'costs',
          createdAt: estimate.createdAt,
        });
      }
    });

    return [...autoEdges, ...manualEdges];
  }, [annotations, estimates, manualEdges, photos]);

  useEffect(() => writeStorage(STORAGE_KEYS.items, items), [items]);
  useEffect(() => writeStorage(STORAGE_KEYS.boards, boards), [boards]);
  useEffect(() => writeStorage(STORAGE_KEYS.annotations, annotations), [annotations]);
  useEffect(() => writeStorage(STORAGE_KEYS.photos, photos), [photos]);
  useEffect(() => writeStorage(STORAGE_KEYS.estimates, estimates), [estimates]);
  useEffect(() => writeStorage(STORAGE_KEYS.edges, manualEdges), [manualEdges]);
  useEffect(() => writeStorage(STORAGE_KEYS.graphPositions, graphPositions), [graphPositions]);

  useEffect(() => {
    if (!selectedBoardId && boards[0]) setSelectedBoardId(boards[0].id);
  }, [boards, selectedBoardId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!draggingNodeId || !graphRef.current) return;
      const rect = graphRef.current.getBoundingClientRect();
      setGraphPositions((current) => ({
        ...current,
        [draggingNodeId]: {
          x: event.clientX - rect.left - draggingNodeOffset.x,
          y: event.clientY - rect.top - draggingNodeOffset.y,
        },
      }));
    };

    const handleMouseUp = () => setDraggingNodeId('');

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, draggingNodeOffset]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

      if (event.key === 'Escape') {
        event.preventDefault();
        cancelActiveAction();
      }

      if (event.key === 'Enter' && (tool === 'Perimeter' || tool === 'Area')) {
        event.preventDefault();
        finishMeasurement();
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotationId) {
        event.preventDefault();
        deleteAnnotation(selectedAnnotationId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingMeasurePoints, selectedAnnotationId, tool]);

  const refreshBoardNotes = (board: VisualBoard | null) => {
    setBoardName(board?.name ?? '');
    setBoardKind(board?.kind ?? 'Plan');
    setBoardNotes(board?.notes ?? '');
  };

  useEffect(() => {
    refreshBoardNotes(selectedBoard);
  }, [selectedBoard]);

  const getFirstItemPhoto = (itemId?: string) => {
    if (!itemId) return undefined;
    return photos.find((photo) => photo.itemId === itemId);
  };

  const getItemName = (itemId?: string) => items.find((item) => item.id === itemId)?.name ?? 'Unlinked';

  const graphPositionForNode = (nodeId: string, index: number): GraphPosition => {
    if (graphPositions[nodeId]) return graphPositions[nodeId];

    const column = index % 4;
    const row = Math.floor(index / 4);
    return { x: 60 + column * 270, y: 70 + row * 170 };
  };

  const cancelActiveAction = () => {
    setPendingMeasurePoints([]);
    setDraftAnnotation(null);
    dragStartRef.current = null;
    setDraggingAnnotationId('');
  };

  const selectTool = (nextTool: AnnotationTool) => {
    cancelActiveAction();
    setTool(nextTool);
  };

  const getToolInstruction = (currentTool: AnnotationTool) => {
    if (currentTool === 'Select') return 'Select: click a markup to inspect it, click-hold and drag to move it. Press Delete to remove selected markup.';
    if (currentTool === 'Arrow') return 'Arrow: click and drag from the note toward the target. Release to place.';
    if (currentTool === 'Line') return 'Line: click and drag between two points.';
    if (currentTool === 'Box') return 'Box: click and drag around the region.';
    if (currentTool === 'Cloud') return 'Cloud: click and drag around a review or field-verify area.';
    if (currentTool === 'Highlight') return 'Highlight: click and drag over a region.';
    if (currentTool === 'Text') return 'Text: click once to place a text label.';
    if (currentTool === 'Stamp') return 'Stamp: choose a stamp and click to place it.';
    if (currentTool === 'Count') return 'Count: click each location to place count dots.';
    if (currentTool === 'Reference') return 'Reference: enter known feet, then click two points to set scale.';
    if (currentTool === 'Length') return 'Length: click start point, then end point.';
    if (currentTool === 'Perimeter') return 'Perimeter: click each corner, then press Enter or Finish Perimeter.';
    return 'Area: click each corner, then press Enter or Finish Area.';
  };

  const zoomInBoard = () => setBoardZoom((value) => Math.min(2.25, Number((value + 0.1).toFixed(2))));
  const zoomOutBoard = () => setBoardZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(2))));
  const resetBoardZoom = () => setBoardZoom(1);

  const zoomInGraph = () => setGraphZoom((value) => Math.min(2.0, Number((value + 0.1).toFixed(2))));
  const zoomOutGraph = () => setGraphZoom((value) => Math.max(0.5, Number((value - 0.1).toFixed(2))));
  const resetGraphZoom = () => setGraphZoom(1);

  const getGraphNodePins = (node: GraphNode) => {
    if (node.type === 'Item') {
      const itemAnnotations = annotations.filter((annotation) => annotation.itemId === node.sourceId);
      const itemPhotos = photos.filter((photo) => photo.itemId === node.sourceId);
      const itemCosts = estimates.filter((estimate) => estimate.itemId === node.sourceId);
      const itemIssues = itemAnnotations.filter((annotation) => annotation.status === 'Review' || annotation.status === 'Fail' || annotation.status === 'Field Verify');

      return [
        { label: 'Markers', count: itemAnnotations.length },
        { label: 'Photos', count: itemPhotos.length },
        { label: 'Costs', count: itemCosts.length },
        { label: 'Issues', count: itemIssues.length },
      ];
    }

    if (node.type === 'Board') {
      return [
        { label: 'Annotations', count: annotations.filter((annotation) => annotation.boardId === node.sourceId).length },
        { label: 'Measurements', count: annotations.filter((annotation) => annotation.boardId === node.sourceId && annotation.type === 'Measurement').length },
      ];
    }

    if (node.type === 'Annotation') {
      const annotation = annotations.find((item) => item.id === node.sourceId);
      return [
        { label: 'Item', count: annotation?.itemId ? 1 : 0 },
        { label: 'Board', count: annotation?.boardId ? 1 : 0 },
      ];
    }

    if (node.type === 'Photo') {
      const photo = photos.find((item) => item.id === node.sourceId);
      return [{ label: 'Photo of', count: photo?.itemId ? 1 : 0 }];
    }

    const estimate = estimates.find((item) => item.id === node.sourceId);
    return [
      { label: 'Costs item', count: estimate?.itemId ? 1 : 0 },
      { label: 'Total', count: estimate ? Math.round(estimate.quantity * estimate.unitCost) : 0 },
    ];
  };

  const getNodeInspectorRows = (node: GraphNode | null) => {
    if (!node) return [];

    if (node.type === 'Item') {
      const item = items.find((candidate) => candidate.id === node.sourceId);
      if (!item) return [];
      return [
        ['Type', item.type],
        ['Status', item.status],
        ['Material', item.material || 'TBD'],
        ['Section', item.section || 'TBD'],
        ['Span', item.spanFt || 'TBD'],
      ];
    }

    if (node.type === 'Board') {
      const board = boards.find((candidate) => candidate.id === node.sourceId);
      if (!board) return [];
      return [
        ['Kind', board.kind],
        ['File', board.fileName],
        ['Scale', board.scaleFtPerPercent ? `${board.scaleFtPerPercent.toFixed(3)} ft / board %` : 'Not set'],
      ];
    }

    if (node.type === 'Annotation') {
      const annotation = annotations.find((candidate) => candidate.id === node.sourceId);
      if (!annotation) return [];
      return [
        ['Type', annotation.type],
        ['Status', annotation.status],
        ['Linked item', getItemName(annotation.itemId)],
      ];
    }

    if (node.type === 'Photo') {
      const photo = photos.find((candidate) => candidate.id === node.sourceId);
      if (!photo) return [];
      return [
        ['Linked item', getItemName(photo.itemId)],
        ['Notes', photo.notes || 'None'],
      ];
    }

    const estimate = estimates.find((candidate) => candidate.id === node.sourceId);
    if (!estimate) return [];
    return [
      ['Linked item', getItemName(estimate.itemId)],
      ['Quantity', `${estimate.quantity} ${estimate.unit}`],
      ['Total', `$${(estimate.quantity * estimate.unitCost).toFixed(2)}`],
    ];
  };

  const loadDemoWorkspace = () => {
    const now = new Date().toISOString();

    const demoBoardId = makeId('board');
    const demoBeamId = makeId('item');
    const demoColumnId = makeId('item');
    const demoRepairId = makeId('item');
    const demoAnnotationId = makeId('anno');
    const demoPhotoId = makeId('photo');
    const demoCostId = makeId('cost');

    const demoBoardSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
        <rect width="1200" height="760" fill="#f8fafc"/>
        <rect x="90" y="90" width="1020" height="560" fill="white" stroke="#334155" stroke-width="4"/>
        <g stroke="#94a3b8" stroke-width="2">
          <line x1="90" y1="230" x2="1110" y2="230"/>
          <line x1="90" y1="370" x2="1110" y2="370"/>
          <line x1="90" y1="510" x2="1110" y2="510"/>
          <line x1="270" y1="90" x2="270" y2="650"/>
          <line x1="510" y1="90" x2="510" y2="650"/>
          <line x1="750" y1="90" x2="750" y2="650"/>
          <line x1="990" y1="90" x2="990" y2="650"/>
        </g>
        <g fill="#e2e8f0" stroke="#0f172a" stroke-width="2">
          <circle cx="270" cy="230" r="18"/>
          <circle cx="510" cy="230" r="18"/>
          <circle cx="750" cy="230" r="18"/>
          <circle cx="990" cy="230" r="18"/>
          <circle cx="270" cy="510" r="18"/>
          <circle cx="510" cy="510" r="18"/>
          <circle cx="750" cy="510" r="18"/>
          <circle cx="990" cy="510" r="18"/>
        </g>
        <g stroke="#1d4ed8" stroke-width="12">
          <line x1="270" y1="230" x2="750" y2="230"/>
          <line x1="510" y1="370" x2="990" y2="370"/>
        </g>
        <text x="90" y="55" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">Demo Level 2 Framing Plan</text>
        <text x="290" y="210" font-family="Arial" font-size="18" fill="#1d4ed8">Beam B12</text>
        <text x="530" y="350" font-family="Arial" font-size="18" fill="#1d4ed8">Beam B18</text>
      </svg>
    `);

    const demoPhotoSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop stop-color="#0f172a"/>
            <stop offset="1" stop-color="#475569"/>
          </linearGradient>
        </defs>
        <rect width="640" height="420" fill="url(#g)"/>
        <rect x="70" y="175" width="500" height="52" rx="8" fill="#94a3b8" stroke="#e2e8f0" stroke-width="4"/>
        <rect x="130" y="120" width="36" height="210" fill="#64748b" stroke="#e2e8f0" stroke-width="3"/>
        <rect x="470" y="120" width="36" height="210" fill="#64748b" stroke="#e2e8f0" stroke-width="3"/>
        <text x="58" y="380" font-family="Arial" font-size="26" font-weight="700" fill="#f8fafc">Demo site photo: Beam B12</text>
      </svg>
    `);

    const demoItems: WorkspaceItem[] = [
      {
        id: demoBeamId,
        name: 'Beam B12',
        type: 'Beam',
        material: 'Steel',
        status: 'Pass',
        section: 'W16x26',
        spanFt: '18',
        notes: 'Demo item. Blue beam on Level 2 framing plan.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: demoColumnId,
        name: 'Column C4',
        type: 'Column',
        material: 'Steel',
        status: 'Review',
        section: 'HSS6x6x1/4',
        spanFt: '',
        notes: 'Demo column connected to B12.',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: demoRepairId,
        name: 'Repair Area R1',
        type: 'Repair Area',
        material: 'Existing framing',
        status: 'Field Verify',
        section: '',
        spanFt: '',
        notes: 'Demo cloud/review area.',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const demoBoard: VisualBoard = {
      id: demoBoardId,
      name: 'Demo Level 2 Framing Plan',
      kind: 'Plan',
      fileName: 'demo-level-2-framing-plan.svg',
      fileType: 'image/svg+xml',
      dataUrl: `data:image/svg+xml;charset=utf-8,${demoBoardSvg}`,
      notes: 'Demo board showing how markers, items, photos, and cost lines connect.',
      scaleFtPerPercent: 0.42,
      createdAt: now,
      updatedAt: now,
    };

    const demoAnnotations: VisualAnnotation[] = [
      {
        id: demoAnnotationId,
        boardId: demoBoardId,
        itemId: demoBeamId,
        type: 'Arrow',
        status: 'Pass',
        label: 'Beam B12',
        notes: 'Arrow marks Beam B12 on the demo framing plan.',
        x: 30,
        y: 24,
        x2: 52,
        y2: 30,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: makeId('anno'),
        boardId: demoBoardId,
        itemId: demoRepairId,
        type: 'Cloud',
        status: 'Field Verify',
        label: 'Verify repair area',
        notes: 'Demo review cloud.',
        x: 60,
        y: 52,
        width: 20,
        height: 14,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: makeId('measure'),
        boardId: demoBoardId,
        itemId: demoBeamId,
        type: 'Measurement',
        status: 'Draft',
        label: 'L-1',
        notes: 'Demo measured span.',
        x: 22.5,
        y: 30,
        x2: 62.5,
        y2: 30,
        points: [{ x: 22.5, y: 30 }, { x: 62.5, y: 30 }],
        measurementKind: 'Length',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const demoPhoto: WorkspacePhoto = {
      id: demoPhotoId,
      itemId: demoBeamId,
      name: 'Beam B12 site photo',
      dataUrl: `data:image/svg+xml;charset=utf-8,${demoPhotoSvg}`,
      notes: 'Demo photo that appears when hovering linked Beam B12 markups.',
      createdAt: now,
      updatedAt: now,
    };

    const demoEstimate: WorkspaceEstimate = {
      id: demoCostId,
      itemId: demoBeamId,
      description: 'W16x26 supply/install allowance',
      category: 'Steel',
      quantity: 18,
      unit: 'LF',
      unitCost: 135,
      status: 'Allowance',
      notes: 'Demo lightweight cost line linked to Beam B12.',
      createdAt: now,
      updatedAt: now,
    };

    const demoEdges: WorkspaceEdge[] = [
      {
        id: makeId('edge'),
        sourceId: `item:${demoBeamId}`,
        targetId: `item:${demoColumnId}`,
        relation: 'connects to',
        createdAt: now,
      },
      {
        id: makeId('edge'),
        sourceId: `item:${demoRepairId}`,
        targetId: `item:${demoBeamId}`,
        relation: 'field verifies',
        createdAt: now,
      },
    ];

    setItems((current) => [...demoItems, ...current]);
    setBoards((current) => [demoBoard, ...current]);
    setAnnotations((current) => [...demoAnnotations, ...current]);
    setPhotos((current) => [demoPhoto, ...current]);
    setEstimates((current) => [demoEstimate, ...current]);
    setManualEdges((current) => [...demoEdges, ...current]);
    setSelectedBoardId(demoBoardId);
    setSelectedItemId(demoBeamId);
    setSelectedAnnotationId(demoAnnotationId);
    setSelectedGraphNodeId(`item:${demoBeamId}`);
    setActiveTab('Boards');
  };

  const createItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemName.trim()) return;
    const now = new Date().toISOString();
    const item: WorkspaceItem = {
      id: makeId('item'),
      name: itemName.trim(),
      type: itemType,
      material: itemMaterial.trim(),
      status: itemStatus,
      section: itemSection.trim(),
      spanFt: itemSpanFt.trim(),
      notes: itemNotes.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setItems((current) => [item, ...current]);
    setSelectedItemId(item.id);
    setItemName('');
    setItemSection('');
    setItemSpanFt('');
    setItemNotes('');
  };

  const deleteItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
    setAnnotations((current) => current.map((annotation) => (annotation.itemId === itemId ? { ...annotation, itemId: undefined } : annotation)));
    setPhotos((current) => current.map((photo) => (photo.itemId === itemId ? { ...photo, itemId: undefined } : photo)));
    setEstimates((current) => current.map((estimate) => (estimate.itemId === itemId ? { ...estimate, itemId: undefined } : estimate)));
    if (selectedItemId === itemId) setSelectedItemId('');
  };

  const handleBoardUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const now = new Date().toISOString();
    const isPdf = file.type === 'application/pdf';
    const board: VisualBoard = {
      id: makeId('board'),
      name: file.name.replace(/\.[^.]+$/, ''),
      kind: isPdf ? 'PDF' : boardKind,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      dataUrl,
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    setBoards((current) => [board, ...current]);
    setSelectedBoardId(board.id);
    setActiveTab('Boards');
  };

  const saveBoard = () => {
    if (!selectedBoard) return;
    setBoards((current) =>
      current.map((board) =>
        board.id === selectedBoard.id
          ? {
              ...board,
              name: boardName.trim() || board.name,
              kind: boardKind,
              notes: boardNotes.trim(),
              updatedAt: new Date().toISOString(),
            }
          : board,
      ),
    );
  };

  const deleteBoard = (boardId: string) => {
    setBoards((current) => current.filter((board) => board.id !== boardId));
    setAnnotations((current) => current.filter((annotation) => annotation.boardId !== boardId));
    if (selectedBoardId === boardId) setSelectedBoardId('');
  };

  const buildAnnotation = (start: VisualPoint, end: VisualPoint): VisualAnnotation => {
    const now = new Date().toISOString();
    const baseLabel =
      annotationLabel.trim() ||
      (tool === 'Stamp' ? stampPreset : selectedToolItemId ? getItemName(selectedToolItemId) : `${tool}-${boardAnnotations.length + 1}`);

    const common = {
      id: makeId('anno'),
      boardId: selectedBoard?.id ?? '',
      itemId: selectedToolItemId || undefined,
      status: annotationStatus,
      label: baseLabel,
      notes: annotationNotes.trim(),
      x: start.x,
      y: start.y,
      createdAt: now,
      updatedAt: now,
    };

    if (tool === 'Arrow' || tool === 'Line') {
      return {
        ...common,
        type: tool,
        x2: end.x,
        y2: end.y,
      };
    }

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.max(4, Math.abs(end.x - start.x));
    const height = Math.max(4, Math.abs(end.y - start.y));

    if (tool === 'Box' || tool === 'Cloud' || tool === 'Highlight') {
      return {
        ...common,
        type: tool,
        x: left,
        y: top,
        width,
        height,
      };
    }

    return {
      ...common,
      type: tool === 'Count' ? 'Count' : tool === 'Stamp' ? 'Stamp' : 'Text',
      width: Math.max(10, width),
      height: Math.max(5, height),
    };
  };

  const saveMeasurement = (kind: MeasurementKind, points: VisualPoint[]) => {
    if (!selectedBoard || points.length < 2) return;
    const now = new Date().toISOString();
    const knownLength = Number(referenceKnownFt);
    const annotation: VisualAnnotation = {
      id: makeId('measure'),
      boardId: selectedBoard.id,
      itemId: selectedToolItemId || undefined,
      type: 'Measurement',
      status: annotationStatus,
      label: `${kind}-${boardAnnotations.length + 1}`,
      notes: annotationNotes.trim(),
      x: points[0].x,
      y: points[0].y,
      x2: points[points.length - 1].x,
      y2: points[points.length - 1].y,
      points,
      measurementKind: kind,
      knownLengthFt: kind === 'Reference' && Number.isFinite(knownLength) && knownLength > 0 ? knownLength : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (kind === 'Reference' && annotation.knownLengthFt) {
      const percentLength = polylineLength(points);
      if (percentLength > 0) {
        setBoards((current) =>
          current.map((board) =>
            board.id === selectedBoard.id ? { ...board, scaleFtPerPercent: annotation.knownLengthFt! / percentLength, updatedAt: now } : board,
          ),
        );
      }
    }

    setAnnotations((current) => [annotation, ...current]);
    setPendingMeasurePoints([]);
    setReferenceKnownFt('');
  };

  const finishMeasurement = () => {
    if (tool === 'Perimeter' && pendingMeasurePoints.length >= 2) saveMeasurement('Perimeter', pendingMeasurePoints);
    if (tool === 'Area' && pendingMeasurePoints.length >= 3) saveMeasurement('Area', pendingMeasurePoints);
  };

  const handleBoardMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (!selectedBoard) return;
    if (tool === 'Select') return;

    const point = getPoint(event, boardSurfaceRef.current);
    if (!point) return;

    if (tool === 'Reference' || tool === 'Length') {
      const nextPoints = [...pendingMeasurePoints, point];
      if (nextPoints.length === 2) {
        saveMeasurement(tool, nextPoints);
      } else {
        setPendingMeasurePoints(nextPoints);
      }
      return;
    }

    if (tool === 'Perimeter' || tool === 'Area') {
      setPendingMeasurePoints((current) => [...current, point]);
      return;
    }

    if (tool === 'Text' || tool === 'Stamp' || tool === 'Count') {
      const endPoint = { x: Math.min(100, point.x + 12), y: Math.min(100, point.y + 7) };
      const annotation = buildAnnotation(point, endPoint);
      setAnnotations((current) => [annotation, ...current]);
      setSelectedAnnotationId(annotation.id);
      return;
    }

    dragStartRef.current = point;
    setDraftAnnotation(buildAnnotation(point, point));
  };

  const handleBoardMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !draftAnnotation) return;
    const point = getPoint(event, boardSurfaceRef.current);
    if (!point) return;
    setDraftAnnotation(buildAnnotation(dragStartRef.current, point));
  };

  const handleBoardMouseUp = () => {
    if (!draftAnnotation) return;
    setAnnotations((current) => [draftAnnotation, ...current]);
    setSelectedAnnotationId(draftAnnotation.id);
    setDraftAnnotation(null);
    dragStartRef.current = null;
  };

  const deleteAnnotation = (annotationId: string) => {
    setAnnotations((current) => current.filter((annotation) => annotation.id !== annotationId));
    if (selectedAnnotationId === annotationId) setSelectedAnnotationId('');
  };

  const updateAnnotationPosition = (annotationId: string, nextX: number, nextY: number) => {
    setAnnotations((current) =>
      current.map((annotation) => {
        if (annotation.id !== annotationId) return annotation;

        const dx = nextX - annotation.x;
        const dy = nextY - annotation.y;
        const nextPoints = annotation.points?.map((point) => ({ x: point.x + dx, y: point.y + dy }));

        return {
          ...annotation,
          x: Math.min(100, Math.max(0, nextX)),
          y: Math.min(100, Math.max(0, nextY)),
          x2: annotation.x2 !== undefined ? Math.min(100, Math.max(0, annotation.x2 + dx)) : annotation.x2,
          y2: annotation.y2 !== undefined ? Math.min(100, Math.max(0, annotation.y2 + dy)) : annotation.y2,
          points: nextPoints,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const startAnnotationDrag = (annotation: VisualAnnotation, event: React.MouseEvent) => {
    if (tool !== 'Select') return;

    const point = getPoint(event as React.MouseEvent<HTMLElement>, boardSurfaceRef.current);
    if (!point) return;

    event.preventDefault();
    event.stopPropagation();

    annotationDragOffsetRef.current = {
      x: point.x - annotation.x,
      y: point.y - annotation.y,
    };

    setSelectedAnnotationId(annotation.id);
    setSelectedItemId(annotation.itemId ?? '');
    setDraggingAnnotationId(annotation.id);
  };

  const handleAnnotationDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingAnnotationId) return;

    const point = getPoint(event, boardSurfaceRef.current);
    if (!point) return;

    updateAnnotationPosition(
      draggingAnnotationId,
      point.x - annotationDragOffsetRef.current.x,
      point.y - annotationDragOffsetRef.current.y,
    );
  };

  const stopAnnotationDrag = () => {
    if (!draggingAnnotationId) return;

    setDraggingAnnotationId('');
    annotationDragOffsetRef.current = { x: 0, y: 0 };
  };

  const updateAnnotationItem = (annotationId: string, itemId: string) => {
    setAnnotations((current) =>
      current.map((annotation) =>
        annotation.id === annotationId ? { ...annotation, itemId: itemId || undefined, updatedAt: new Date().toISOString() } : annotation,
      ),
    );
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []) as File[];
    event.currentTarget.value = '';
    if (!files.length) return;

    const loadedPhotos = await Promise.all(
      files.map(
        (file) =>
          new Promise<WorkspacePhoto>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const now = new Date().toISOString();
              resolve({
                id: makeId('photo'),
                itemId: photoItemId || selectedItemId || undefined,
                name: file.name,
                dataUrl: String(reader.result),
                notes: photoNotes.trim(),
                createdAt: now,
                updatedAt: now,
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          }),
      ),
    );

    setPhotos((current) => [...loadedPhotos, ...current]);
    setPhotoNotes('');
  };

  const createEstimate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!estimateDescription.trim()) return;
    const now = new Date().toISOString();
    const quantity = Number(estimateQuantity);
    const unitCost = Number(estimateUnitCost);

    const estimate: WorkspaceEstimate = {
      id: makeId('cost'),
      itemId: estimateItemId || selectedItemId || undefined,
      description: estimateDescription.trim(),
      category: estimateCategory.trim() || 'Miscellaneous',
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unit: estimateUnit.trim() || 'EA',
      unitCost: Number.isFinite(unitCost) ? unitCost : 0,
      status: 'Draft',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    setEstimates((current) => [estimate, ...current]);
    setEstimateDescription('');
    setEstimateQuantity('1');
    setEstimateUnitCost('0');
  };

  const addManualEdge = () => {
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget) return;
    const edge: WorkspaceEdge = {
      id: makeId('edge'),
      sourceId: edgeSource,
      targetId: edgeTarget,
      relation: edgeRelation.trim() || 'references',
      createdAt: new Date().toISOString(),
    };
    setManualEdges((current) => [edge, ...current]);
  };

  const exportSchedule = () => {
    downloadCsv('visual-workspace-schedule.csv', [
      ['Item', 'Type', 'Status', 'Material', 'Section', 'Span', 'Annotations', 'Photos', 'Estimate Total'],
      ...items.map((item) => {
        const itemAnnotations = annotations.filter((annotation) => annotation.itemId === item.id).length;
        const itemPhotos = photos.filter((photo) => photo.itemId === item.id).length;
        const itemEstimateTotal = estimates.filter((estimate) => estimate.itemId === item.id).reduce((sum, estimate) => sum + estimate.quantity * estimate.unitCost, 0);

        return [item.name, item.type, item.status, item.material, item.section, item.spanFt, itemAnnotations, itemPhotos, itemEstimateTotal.toFixed(2)];
      }),
    ]);
  };

  const exportAnnotations = () => {
    downloadCsv('visual-workspace-annotations.csv', [
      ['Board', 'Annotation', 'Type', 'Status', 'Linked Item', 'Notes'],
      ...annotations.map((annotation) => [
        boards.find((board) => board.id === annotation.boardId)?.name ?? 'Unknown Board',
        annotation.label,
        annotation.type,
        annotation.status,
        getItemName(annotation.itemId),
        annotation.notes,
      ]),
    ]);
  };

  const renderAnnotation = (annotation: VisualAnnotation, preview = false) => {
    const color = statusStroke(annotation.status);
    const itemPhoto = getFirstItemPhoto(annotation.itemId);
    const selected = selectedAnnotationId === annotation.id;
    const commonEvents = preview
      ? {}
      : {
          onMouseEnter: () => setHoveredAnnotationId(annotation.id),
          onMouseLeave: () => setHoveredAnnotationId(''),
          onMouseDown: (event: React.MouseEvent) => startAnnotationDrag(annotation, event),
          onClick: (event: React.MouseEvent) => {
            event.stopPropagation();
            setSelectedAnnotationId(annotation.id);
            setSelectedItemId(annotation.itemId ?? '');
          },
        };

    if (annotation.type === 'Arrow' || annotation.type === 'Line') {
      const x2 = annotation.x2 ?? annotation.x;
      const y2 = annotation.y2 ?? annotation.y;

      return (
        <svg key={annotation.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <marker id={`arrowhead-${annotation.id}`} markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={`${annotation.x}%`}
            y1={`${annotation.y}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={color}
            strokeWidth={selected ? 4 : 3}
            markerEnd={annotation.type === 'Arrow' ? `url(#arrowhead-${annotation.id})` : undefined}
          />
          {!preview && (
            <foreignObject x={`${Math.min(annotation.x, x2)}%`} y={`${Math.min(annotation.y, y2)}%`} width="160" height="44">
              <button
                {...commonEvents}
                className="pointer-events-auto cursor-move rounded border border-white/80 bg-white/90 px-2 py-1 text-xs font-bold shadow"
                style={{ color }}
              >
                {annotation.label}
              </button>
            </foreignObject>
          )}
        </svg>
      );
    }

    if (annotation.type === 'Measurement') {
      const points = annotation.points ?? [
        { x: annotation.x, y: annotation.y },
        { x: annotation.x2 ?? annotation.x, y: annotation.y2 ?? annotation.y },
      ];
      const closed = annotation.measurementKind === 'Area' || annotation.measurementKind === 'Perimeter';
      const pointString = `${points.map((point) => `${point.x},${point.y}`).join(' ')}${closed && points.length > 2 ? ` ${points[0].x},${points[0].y}` : ''}`;
      const pointCentroid = centroid(points);
      const board = boards.find((candidate) => candidate.id === annotation.boardId);
      const value =
        annotation.measurementKind === 'Area'
          ? formatArea(polygonArea(points), board?.scaleFtPerPercent)
          : annotation.measurementKind === 'Reference' && annotation.knownLengthFt
            ? `${annotation.knownLengthFt.toFixed(2)} ft reference`
            : formatLength(polylineLength(points, closed), board?.scaleFtPerPercent);

      return (
        <svg key={annotation.id} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {annotation.measurementKind === 'Area' && <polygon points={pointString} fill="rgba(124,58,237,0.12)" stroke="#7c3aed" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />}
          <polyline points={pointString} fill="none" stroke={annotation.measurementKind === 'Reference' ? '#f59e0b' : '#7c3aed'} strokeWidth="0.35" strokeDasharray="1.4 0.8" vectorEffect="non-scaling-stroke" />
          {points.map((point, index) => (
            <circle key={`${annotation.id}-${index}`} cx={`${point.x}%`} cy={`${point.y}%`} r="4" fill={annotation.measurementKind === 'Reference' ? '#f59e0b' : '#7c3aed'} />
          ))}
          <foreignObject x={`${pointCentroid.x}%`} y={`${pointCentroid.y}%`} width="220" height="50">
            <button {...commonEvents} className="pointer-events-auto cursor-move rounded border border-white bg-white/95 px-2 py-1 text-xs font-bold text-purple-800 shadow">
              {annotation.measurementKind}: {value}
            </button>
          </foreignObject>
        </svg>
      );
    }

    const width = annotation.width ?? 14;
    const height = annotation.height ?? 8;
    const style: React.CSSProperties = {
      left: `${annotation.x}%`,
      top: `${annotation.y}%`,
      width: `${width}%`,
      height: `${height}%`,
      borderColor: color,
    };

    if (annotation.type === 'Box' || annotation.type === 'Cloud' || annotation.type === 'Highlight') {
      return (
        <button
          key={annotation.id}
          {...commonEvents}
          className={`absolute z-20 cursor-move rounded text-left text-xs font-bold shadow-sm ${preview ? 'pointer-events-none opacity-80' : ''} ${
            annotation.type === 'Cloud'
              ? 'border-2 border-dashed bg-white/30'
              : annotation.type === 'Highlight'
                ? 'border bg-yellow-300/35'
                : 'border-2 bg-white/10'
          } ${selected ? 'ring-2 ring-blue-500' : ''}`}
          style={{
            ...style,
            borderRadius: annotation.type === 'Cloud' ? '999px' : '8px',
            color,
          }}
        >
          <span className="absolute -top-7 left-0 whitespace-nowrap rounded border border-white bg-white/95 px-2 py-1 shadow">
            {annotation.label}
          </span>
          {hoveredAnnotationId === annotation.id && itemPhoto && (
            <img src={itemPhoto.dataUrl} alt={itemPhoto.name} className="absolute left-0 top-full mt-2 h-24 w-32 rounded border border-white object-cover shadow-xl" />
          )}
        </button>
      );
    }

    return (
      <button
        key={annotation.id}
        {...commonEvents}
        className={`absolute z-20 cursor-move rounded border bg-white/95 px-2 py-1 text-xs font-bold shadow ${preview ? 'pointer-events-none opacity-80' : ''} ${selected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          left: `${annotation.x}%`,
          top: `${annotation.y}%`,
          transform: annotation.type === 'Count' ? 'translate(-50%, -50%)' : undefined,
          color,
          borderColor: color,
        }}
      >
        {annotation.type === 'Count' ? '●' : annotation.type === 'Stamp' ? stampPreset || annotation.label : annotation.label}
      </button>
    );
  };

  const boardHoverAnnotation = annotations.find((annotation) => annotation.id === hoveredAnnotationId);
  const boardHoverItem = boardHoverAnnotation?.itemId ? items.find((item) => item.id === boardHoverAnnotation.itemId) : undefined;
  const boardHoverPhoto = getFirstItemPhoto(boardHoverAnnotation?.itemId);

  const renderBoards = () => (
    <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBoardLibrary((value) => !value)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold ${showBoardLibrary ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
          >
            Boards
          </button>
          <button
            onClick={() => setShowBoardInspector((value) => !value)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold ${showBoardInspector ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
          >
            Inspector
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
            <Upload size={14} />
            Upload Board
            <input type="file" accept="image/*,application/pdf" onChange={handleBoardUpload} className="hidden" />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={zoomOutBoard} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">-</button>
          <button onClick={resetBoardZoom} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">{Math.round(boardZoom * 100)}%</button>
          <button onClick={zoomInBoard} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">+</button>
        </div>
      </div>

      <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Select + Markup</div>
            <div className="flex flex-wrap gap-2">
              {(['Select', 'Arrow', 'Line', 'Box', 'Cloud', 'Highlight', 'Text', 'Stamp', 'Count'] as AnnotationTool[]).map((option) => (
                <button
                  key={option}
                  onClick={() => selectTool(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    tool === option ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Measure</div>
            <div className="flex flex-wrap gap-2">
              {(['Reference', 'Length', 'Perimeter', 'Area'] as AnnotationTool[]).map((option) => (
                <button
                  key={option}
                  onClick={() => selectTool(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    tool === option ? 'bg-purple-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
              {(tool === 'Perimeter' || tool === 'Area') && pendingMeasurePoints.length > 0 && (
                <button onClick={finishMeasurement} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white">
                  Finish
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Link + Status</div>
            <div className="grid grid-cols-1 gap-2">
              <select value={annotationStatus} onChange={(event) => setAnnotationStatus(event.target.value as WorkspaceStatus)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
              <select value={selectedToolItemId} onChange={(event) => setSelectedToolItemId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                <option value="">Link item...</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Options</div>
            <div className="grid grid-cols-1 gap-2">
              {tool === 'Stamp' ? (
                <select value={stampPreset} onChange={(event) => setStampPreset(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-bold text-white">
                  {stampOptions.map((stamp) => <option key={stamp}>{stamp}</option>)}
                </select>
              ) : null}
              {tool === 'Reference' ? (
                <input value={referenceKnownFt} onChange={(event) => setReferenceKnownFt(event.target.value)} placeholder="Known length ft" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
              ) : null}
              <input value={annotationLabel} onChange={(event) => setAnnotationLabel(event.target.value)} placeholder="Label / callout text" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
              <input value={annotationNotes} onChange={(event) => setAnnotationNotes(event.target.value)} placeholder="Annotation note" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[76vh] grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
        {showBoardLibrary && (
          <aside className="w-full border-b border-slate-800 bg-slate-950 p-4 xl:w-72 xl:border-b-0 xl:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-white">Boards</h2>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">{boards.length}</span>
            </div>
            <div className="max-h-[64vh] space-y-2 overflow-auto pr-1">
              {boards.length === 0 && <p className="rounded-xl border border-slate-800 bg-white/5 p-3 text-sm text-slate-300">Upload a plan, elevation, site photo, or PDF to start. Use Select to move existing marks by dragging them.</p>}
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={`w-full rounded-2xl border p-3 text-left text-sm transition ${
                    selectedBoard?.id === board.id
                      ? 'border-blue-400 bg-blue-500/15 text-blue-100'
                      : 'border-slate-800 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold">{board.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{board.kind} • {board.fileName}</div>
                  {board.scaleFtPerPercent && <div className="mt-2 text-[11px] font-semibold text-green-400">Scale set</div>}
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className="relative overflow-auto bg-slate-100 p-4">
          {!selectedBoard && (
            <div className="flex min-h-[62vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
              <div>
                <ImageIcon className="mx-auto mb-3" size={34} />
                <p className="font-bold">Upload a board to start</p>
                <p className="mt-1 text-sm">Plans, PDFs, elevations, and site photos can become annotatable boards.</p>
              </div>
            </div>
          )}

          {selectedBoard && (
            <div
              ref={boardSurfaceRef}
              onContextMenu={(event) => {
                event.preventDefault();
                cancelActiveAction();
              }}
              onDoubleClick={() => {
                if (tool === 'Perimeter' || tool === 'Area') finishMeasurement();
              }}
              onMouseDown={handleBoardMouseDown}
              onMouseMove={(event) => {
                handleAnnotationDragMove(event);
                handleBoardMouseMove(event);
              }}
              onMouseUp={() => {
                stopAnnotationDrag();
                handleBoardMouseUp();
              }}
              className="relative mx-auto min-h-[68vh] w-fit min-w-[900px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow"
              style={{ transform: `scale(${boardZoom})`, transformOrigin: 'top center' }}
            >
              {selectedBoard.fileType === 'application/pdf' ? (
                <iframe title={selectedBoard.name} src={selectedBoard.dataUrl} className="h-[68vh] w-[1100px] border-0" />
              ) : (
                <img src={selectedBoard.dataUrl} alt={selectedBoard.name} draggable={false} className="mx-auto max-h-[68vh] w-auto max-w-[1200px] select-none object-contain" />
              )}

              <div className="absolute inset-0">
                {boardAnnotations.map((annotation) => renderAnnotation(annotation))}
                {draftAnnotation && renderAnnotation(draftAnnotation, true)}
                {pendingMeasurePoints.length > 0 && (
                  <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible">
                    <polyline points={pendingMeasurePoints.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#0ea5e9" strokeWidth="0.35" strokeDasharray="1 0.8" vectorEffect="non-scaling-stroke" />
                    {pendingMeasurePoints.map((point, index) => <circle key={index} cx={`${point.x}%`} cy={`${point.y}%`} r="4" fill="#0ea5e9" />)}
                  </svg>
                )}
              </div>

              {boardHoverAnnotation && (
                <div className="pointer-events-none absolute right-4 top-4 z-50 w-72 rounded-2xl border border-white bg-white/95 p-3 text-xs shadow-2xl">
                  {boardHoverPhoto ? (
                    <img src={boardHoverPhoto.dataUrl} alt={boardHoverPhoto.name} className="mb-2 h-28 w-full rounded-xl object-cover" />
                  ) : (
                    <div className="mb-2 flex h-28 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400">No linked photo</div>
                  )}
                  <div className="font-bold text-slate-950">{boardHoverAnnotation.label}</div>
                  <div className="mt-1 text-slate-500">{boardHoverItem?.name ?? 'No linked item'} • {boardHoverAnnotation.type}</div>
                  <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClasses(boardHoverAnnotation.status)}`}>
                    {boardHoverAnnotation.status}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {showBoardInspector && (
          <aside className="w-full border-t border-slate-800 bg-slate-950 p-4 xl:w-80 xl:border-l xl:border-t-0">
            <h2 className="font-bold text-white">Inspector</h2>
            {selectedBoard && (
              <div className="mt-3 space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Board name
                  <input value={boardName} onChange={(event) => setBoardName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
                </label>
                <label className="block text-xs font-bold text-slate-300">
                  Board kind
                  <select value={boardKind} onChange={(event) => setBoardKind(event.target.value as BoardKind)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                    {['Plan', 'Elevation', 'Site Photo', 'PDF', 'Other'].map((kind) => <option key={kind}>{kind}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-300">
                  Board notes
                  <textarea value={boardNotes} onChange={(event) => setBoardNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 text-sm" />
                </label>
                <div className="flex gap-2">
                  <button onClick={saveBoard} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><Save size={14} />Save</button>
                  <button onClick={() => deleteBoard(selectedBoard.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"><Trash2 size={14} />Delete</button>
                </div>
              </div>
            )}

            {selectedAnnotation && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Selected annotation</div>
                <div className="mt-2 font-bold text-white">{selectedAnnotation.label}</div>
                <select value={selectedAnnotation.itemId ?? ''} onChange={(event) => updateAnnotationItem(selectedAnnotation.id, event.target.value)} className="mt-2 w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">No linked item</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <button onClick={() => deleteAnnotation(selectedAnnotation.id)} className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  <Trash2 size={14} /> Delete annotation
                </button>
              </div>
            )}

            <div className="mt-5 space-y-2">
              <button onClick={exportAnnotations} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <Download size={14} /> Export annotations CSV
              </button>
              <div className="text-xs text-slate-400">
                Status: {getToolInstruction(tool)}
              </div>
            </div>
          </aside>
        )}
      </div>

      <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-400">
        Active tool: <span className="font-bold text-white">{tool}</span>. Esc or right-click cancels. Enter/double-click finishes perimeter or area. Delete removes selected markup.
      </div>
    </div>
  );

  const renderItems = () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={createItem} className={`rounded-3xl border p-5 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
        <h2 className={`mb-4 text-lg font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Create Project Item</h2>
        <div className="space-y-3">
          <input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Beam B12, Column C4, Repair Area R1..." className="w-full rounded-lg border px-3 py-2 text-sm" required />
          <div className="grid grid-cols-2 gap-2">
            <select value={itemType} onChange={(event) => setItemType(event.target.value as WorkspaceItemType)} className="rounded-lg border px-3 py-2 text-sm">{itemTypeOptions.map((option) => <option key={option}>{option}</option>)}</select>
            <select value={itemStatus} onChange={(event) => setItemStatus(event.target.value as WorkspaceStatus)} className="rounded-lg border px-3 py-2 text-sm">{statusOptions.map((option) => <option key={option}>{option}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={itemMaterial} onChange={(event) => setItemMaterial(event.target.value)} placeholder="Material" className="rounded-lg border px-3 py-2 text-sm" />
            <input value={itemSection} onChange={(event) => setItemSection(event.target.value)} placeholder="W16x26, LVL, etc." className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <input value={itemSpanFt} onChange={(event) => setItemSpanFt(event.target.value)} placeholder="Span / length ft" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <textarea value={itemNotes} onChange={(event) => setItemNotes(event.target.value)} placeholder="Notes" className="min-h-24 w-full rounded-lg border px-3 py-2 text-sm" />
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Plus size={16} />Create Item</button>
        </div>
      </form>

      <section className={`rounded-3xl border p-5 ${isDesktopStyle ? 'ss-glass-strong' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className={`text-lg font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Project Items</h2>
          <label className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} placeholder="Search items..." className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const itemPhoto = getFirstItemPhoto(item.id);
            const linkedAnnotations = annotations.filter((annotation) => annotation.itemId === item.id).length;
            const linkedEstimates = estimates.filter((estimate) => estimate.itemId === item.id);
            const estimateTotal = linkedEstimates.reduce((sum, estimate) => sum + estimate.quantity * estimate.unitCost, 0);
            return (
              <button key={item.id} onClick={() => setSelectedItemId(item.id)} className={`rounded-2xl border p-4 text-left transition ${selectedItemId === item.id ? 'border-blue-400 bg-blue-50/80' : isDesktopStyle ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                {itemPhoto && <img src={itemPhoto.dataUrl} alt={itemPhoto.name} className="mb-3 h-28 w-full rounded-xl object-cover" />}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`font-bold ${isDesktopStyle && selectedItemId !== item.id ? 'text-white' : 'text-gray-900'}`}>{item.name}</div>
                    <div className={isDesktopStyle && selectedItemId !== item.id ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-gray-500'}>
                      {item.type} • {item.material || 'Material TBD'} • {item.section || 'Section TBD'}
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${statusClasses(item.status)}`}>{item.status}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{linkedAnnotations} marks</div>
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">{photos.filter((photo) => photo.itemId === item.id).length} photos</div>
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">${estimateTotal.toFixed(0)}</div>
                </div>
                <button onClick={(event) => { event.stopPropagation(); deleteItem(item.id); }} className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Delete</button>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderPhotos = () => (
    <div className="space-y-4">
      <section className={`rounded-3xl border p-5 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm font-bold">
            Link photo to item
            <select value={photoItemId || selectedItemId} onChange={(event) => setPhotoItemId(event.target.value)} className="mt-1 w-72 rounded-lg border px-3 py-2 text-sm">
              <option value="">Unlinked photo</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block flex-1 text-sm font-bold">
            Photo notes
            <input value={photoNotes} onChange={(event) => setPhotoNotes(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Existing beam condition, connection photo, field issue..." />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            <Upload size={16} /> Upload Photos
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className={`overflow-hidden rounded-3xl border ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
            <img src={photo.dataUrl} alt={photo.name} className="h-48 w-full object-cover" />
            <div className="p-4">
              <div className={`font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>{photo.name}</div>
              <div className={`mt-1 text-xs ${isDesktopStyle ? 'text-slate-400' : 'text-gray-500'}`}>{getItemName(photo.itemId)}</div>
              {photo.notes && <p className={`mt-2 text-sm ${isDesktopStyle ? 'text-slate-300' : 'text-gray-600'}`}>{photo.notes}</p>}
              <button onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} className="mt-3 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Delete</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );

  const renderGraph = () => {
    const nodeMap = new globalThis.Map<string, { node: GraphNode; position: GraphPosition }>(
      graphNodes.map((node, index) => [node.id, { node, position: graphPositionForNode(node.id, index) }]),
    );

    const selectedPins = selectedGraphNode ? getGraphNodePins(selectedGraphNode) : [];
    const selectedRows = getNodeInspectorRows(selectedGraphNode);

    return (
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowGraphLibrary((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${showGraphLibrary ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
            >
              Node Library
            </button>
            <button
              onClick={() => setShowGraphInspector((value) => !value)}
              className={`rounded-xl border px-3 py-2 text-xs font-bold ${showGraphInspector ? 'border-blue-400 bg-blue-500/20 text-blue-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
            >
              Inspector
            </button>
            <div className="ml-2 flex items-center gap-2 text-sm font-bold text-white">
              <Network size={17} className="text-blue-300" />
              Blueprint Graph
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={zoomOutGraph} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">-</button>
            <button onClick={resetGraphZoom} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">{Math.round(graphZoom * 100)}%</button>
            <button onClick={zoomInGraph} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200">+</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-3">
          <select value={edgeSource} onChange={(event) => setEdgeSource(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <option value="">Source node...</option>
            {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.type}: {node.title}</option>)}
          </select>
          <input value={edgeRelation} onChange={(event) => setEdgeRelation(event.target.value)} className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white" placeholder="relation" />
          <select value={edgeTarget} onChange={(event) => setEdgeTarget(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <option value="">Target node...</option>
            {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.type}: {node.title}</option>)}
          </select>
          <button onClick={addManualEdge} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">
            <LinkIcon size={14} /> Add Link
          </button>
        </div>

        <div className="grid min-h-[78vh] grid-cols-1 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
          {showGraphLibrary && (
            <aside className="w-full border-b border-slate-800 bg-slate-950 p-4 xl:w-72 xl:border-b-0 xl:border-r">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-bold text-white">Node Library</h2>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">{graphNodes.length}</span>
              </div>

              <div className="max-h-[66vh] space-y-2 overflow-auto pr-1">
                {(['Item', 'Board', 'Annotation', 'Photo', 'Cost'] as GraphNodeType[]).map((type) => {
                  const nodes = graphNodes.filter((node) => node.type === type);
                  if (nodes.length === 0) return null;

                  return (
                    <div key={type}>
                      <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{type}s</div>
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => setSelectedGraphNodeId(node.id)}
                          className={`mb-1 w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                            selectedGraphNodeId === node.id
                              ? 'border-blue-400 bg-blue-500/15 text-blue-100'
                              : 'border-slate-800 bg-white/5 text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <div className="font-bold">{node.title}</div>
                          <div className="mt-0.5 opacity-70">{node.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          <section ref={graphRef} className="relative min-h-[78vh] overflow-auto bg-slate-950">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative h-[1400px] w-[1800px]" style={{ transform: `scale(${graphZoom})`, transformOrigin: 'top left' }}>
              <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                  <marker id="graph-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#38bdf8" />
                  </marker>
                </defs>
                {graphEdges.map((edge) => {
                  const source = nodeMap.get(edge.sourceId);
                  const target = nodeMap.get(edge.targetId);
                  if (!source || !target) return null;
                  const startX = source.position.x + 240;
                  const startY = source.position.y + 98;
                  const endX = target.position.x;
                  const endY = target.position.y + 98;
                  const midX = (startX + endX) / 2;

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeOpacity="0.75"
                        markerEnd="url(#graph-arrow)"
                      />
                      <text x={midX - 28} y={(startY + endY) / 2 - 8} fill="#bae6fd" fontSize="11" fontWeight="700">{edge.relation}</text>
                    </g>
                  );
                })}
              </svg>

              {graphNodes.map((node, index) => {
                const position = graphPositionForNode(node.id, index);
                const pins = getGraphNodePins(node);
                const isSelected = selectedGraphNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    onMouseDown={(event) => {
                      const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                      setSelectedGraphNodeId(node.id);
                      setDraggingNodeId(node.id);
                      setDraggingNodeOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                    }}
                    className={`absolute z-10 w-64 cursor-grab rounded-2xl border bg-slate-900 shadow-2xl active:cursor-grabbing ${
                      isSelected ? 'border-blue-300 ring-2 ring-blue-500/40' : 'border-slate-700'
                    }`}
                    style={{ left: position.x, top: position.y }}
                  >
                    <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">
                      {node.type}
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-white">{node.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{node.subtitle}</div>
                      {node.status && <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClasses(node.status)}`}>{node.status}</span>}

                      <div className="mt-3 space-y-1 border-t border-slate-700 pt-3">
                        {pins.map((pin) => (
                          <div key={pin.label} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                              <span className="h-2.5 w-2.5 rounded-full border border-cyan-300 bg-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                              {pin.label}
                            </div>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-bold text-slate-200">{pin.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {showGraphInspector && (
            <aside className="w-full border-t border-slate-800 bg-slate-950 p-4 xl:w-80 xl:border-l xl:border-t-0">
              <div className="mb-3 flex items-center gap-2">
                <Network size={18} className="text-blue-400" />
                <h2 className="font-bold text-white">Node Inspector</h2>
              </div>

              {!selectedGraphNode ? (
                <p className="text-sm text-slate-400">Select a node to inspect its attachments.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{selectedGraphNode.type}</div>
                    <div className="mt-1 text-lg font-bold text-white">{selectedGraphNode.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{selectedGraphNode.subtitle}</div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Attachment Pins</div>
                    <div className="space-y-2">
                      {selectedPins.map((pin) => (
                        <div key={pin.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          <span>{pin.label}</span>
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">{pin.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Details</div>
                    <div className="space-y-2">
                      {selectedRows.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                          <div className="text-[10px] font-bold uppercase tracking-wide opacity-60">{label}</div>
                          <div className="mt-0.5 font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {selectedGraphNode.type === 'Board' && (
                      <button
                        onClick={() => {
                          setSelectedBoardId(selectedGraphNode.sourceId);
                          setActiveTab('Boards');
                        }}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Open Board
                      </button>
                    )}
                    {selectedGraphNode.type === 'Item' && (
                      <button
                        onClick={() => {
                          setSelectedItemId(selectedGraphNode.sourceId);
                          setActiveTab('Items');
                        }}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Open Item
                      </button>
                    )}
                    {selectedGraphNode.type === 'Photo' && (
                      <button onClick={() => setActiveTab('Photos')} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white">
                        Open Photos
                      </button>
                    )}
                    {selectedGraphNode.type === 'Cost' && (
                      <button onClick={() => setActiveTab('Costs')} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white">
                        Open Costs
                      </button>
                    )}
                    {selectedGraphNode.type === 'Annotation' && (
                      <button
                        onClick={() => {
                          const annotation = annotations.find((candidate) => candidate.id === selectedGraphNode.sourceId);
                          if (annotation) {
                            setSelectedAnnotationId(annotation.id);
                            setSelectedBoardId(annotation.boardId);
                            setActiveTab('Boards');
                          }
                        }}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Open Board Markup
                      </button>
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    );
  };

  const renderCosts = () => {
    const grandTotal = estimates.reduce((sum, estimate) => sum + estimate.quantity * estimate.unitCost, 0);

    return (
      <div className="space-y-4">
        <form onSubmit={createEstimate} className={`rounded-3xl border p-5 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
            <select value={estimateItemId || selectedItemId} onChange={(event) => setEstimateItemId(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Link item...</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <input value={estimateDescription} onChange={(event) => setEstimateDescription(event.target.value)} placeholder="Description" className="rounded-lg border px-3 py-2 text-sm lg:col-span-2" />
            <input value={estimateCategory} onChange={(event) => setEstimateCategory(event.target.value)} placeholder="Category" className="rounded-lg border px-3 py-2 text-sm" />
            <input value={estimateQuantity} onChange={(event) => setEstimateQuantity(event.target.value)} placeholder="Qty" className="rounded-lg border px-3 py-2 text-sm" />
            <input value={estimateUnit} onChange={(event) => setEstimateUnit(event.target.value)} placeholder="Unit" className="rounded-lg border px-3 py-2 text-sm" />
            <input value={estimateUnitCost} onChange={(event) => setEstimateUnitCost(event.target.value)} placeholder="Unit cost" className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">Add Cost Line</button>
        </form>

        <section className={`overflow-hidden rounded-3xl border ${isDesktopStyle ? 'ss-glass-strong' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="border-b border-gray-200 p-4">
            <h2 className={`text-lg font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Connected Cost Helper</h2>
            <p className={isDesktopStyle ? 'mt-1 text-sm text-slate-300' : 'mt-1 text-sm text-gray-500'}>Lightweight structural quantity/cost lines linked to project items.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className={isDesktopStyle ? 'bg-slate-900 text-slate-300' : 'bg-gray-50 text-gray-500'}>
                <tr>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{getItemName(estimate.itemId)}</td>
                    <td className="px-4 py-3">{estimate.description}</td>
                    <td className="px-4 py-3">{estimate.category}</td>
                    <td className="px-4 py-3 text-right">{estimate.quantity}</td>
                    <td className="px-4 py-3">{estimate.unit}</td>
                    <td className="px-4 py-3 text-right">${estimate.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold">${(estimate.quantity * estimate.unitCost).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEstimates((current) => current.filter((item) => item.id !== estimate.id))} className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={isDesktopStyle ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}>
                  <td colSpan={6} className="px-4 py-3 text-right font-bold">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold">${grandTotal.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    );
  };

  const renderSchedule = () => (
    <section className={`overflow-hidden rounded-3xl border ${isDesktopStyle ? 'ss-glass-strong' : 'border-gray-200 bg-white shadow-sm'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <div>
          <h2 className={`text-lg font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Visual Workspace Schedule</h2>
          <p className={isDesktopStyle ? 'mt-1 text-sm text-slate-300' : 'mt-1 text-sm text-gray-500'}>Table view of items, annotations, photos, and connected costs.</p>
        </div>
        <button onClick={exportSchedule} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"><Download size={16} />Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className={isDesktopStyle ? 'bg-slate-900 text-slate-300' : 'bg-gray-50 text-gray-500'}>
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-left">Section</th>
              <th className="px-4 py-3 text-right">Annotations</th>
              <th className="px-4 py-3 text-right">Photos</th>
              <th className="px-4 py-3 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const itemAnnotations = annotations.filter((annotation) => annotation.itemId === item.id).length;
              const itemPhotos = photos.filter((photo) => photo.itemId === item.id).length;
              const itemCost = estimates.filter((estimate) => estimate.itemId === item.id).reduce((sum, estimate) => sum + estimate.quantity * estimate.unitCost, 0);
              return (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-bold">{item.name}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs font-bold ${statusClasses(item.status)}`}>{item.status}</span></td>
                  <td className="px-4 py-3">{item.material}</td>
                  <td className="px-4 py-3">{item.section || '-'}</td>
                  <td className="px-4 py-3 text-right">{itemAnnotations}</td>
                  <td className="px-4 py-3 text-right">{itemPhotos}</td>
                  <td className="px-4 py-3 text-right font-bold">${itemCost.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  const tabIcons: Record<WorkspaceTab, React.ReactNode> = {
    Boards: <MapIcon size={16} />,
    Items: <Box size={16} />,
    Photos: <Camera size={16} />,
    Graph: <Network size={16} />,
    Schedule: <FileText size={16} />,
    Costs: <CircleDollarSign size={16} />,
  };

  if (activeTab === 'Boards') {
    return (
      <div className="h-full min-h-screen bg-slate-950">
        <div className="fixed left-1/2 top-3 z-50 flex -translate-x-1/2 gap-1 rounded-full border border-slate-700 bg-slate-950/90 p-1 shadow-2xl backdrop-blur">
          {(['Boards', 'Items', 'Photos', 'Graph', 'Schedule', 'Costs'] as WorkspaceTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tabIcons[tab]}
              {tab}
            </button>
          ))}
        </div>
        {renderBoards()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      <header className={`relative overflow-hidden rounded-[2rem] border p-6 ${isDesktopStyle ? 'ss-glass-strong' : 'border-gray-200 bg-white shadow-sm'}`}>
        {isDesktopGlass && (
          <>
            <span className="ss-orb -left-10 top-4 h-56 w-56 bg-blue-500/20" />
            <span className="ss-orb right-10 top-6 h-60 w-60 bg-purple-500/20" />
          </>
        )}
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
              AutoCAD + PDF Annotator + Blueprint Graph
            </div>
            <h1 className={`text-4xl font-semibold tracking-tight ${isDesktopStyle ? 'text-white' : 'text-gray-950'}`}>Visual Workspace</h1>
            <p className={`mt-2 max-w-3xl ${isDesktopStyle ? 'text-slate-300' : 'text-gray-500'}`}>
              Connect project items, annotated plans/PDFs, site photos, graph nodes, measurements, and lightweight cost lines in one visual workspace.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={loadDemoWorkspace}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
            >
              <Sparkles size={16} />
              Load Demo Workspace
            </button>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{items.length}</div>Items</div>
              <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{annotations.length}</div>Marks</div>
              <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{graphEdges.length}</div>Links</div>
            </div>
          </div>
        </div>
      </header>

      <details className={`rounded-3xl border p-4 ${isDesktopStyle ? 'ss-glass text-slate-200' : 'border-gray-200 bg-white text-gray-700 shadow-sm'}`}>
        <summary className="cursor-pointer text-sm font-bold">Getting started / how Visual Workspace works</summary>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            ['1', 'Create Items', 'Add Beam B12, Column C4, Repair Area R1, etc. Items are the real project objects.'],
            ['2', 'Upload Boards', 'Add plans, elevations, PDFs, or site photos in Boards. These replace the old Visual Map.'],
            ['3', 'Markup + Measure', 'Use the ribbon for arrows, clouds, stamps, reference scale, length, perimeter, and area.'],
            ['4', 'Link Everything', 'Link annotations, photos, and cost lines to Items. The Graph updates from those links.'],
          ].map(([step, title, body]) => (
            <div key={step} className={`rounded-2xl border p-4 ${isDesktopStyle ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{step}</div>
              <div className={`font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>{title}</div>
              <p className="mt-1 text-xs opacity-80">{body}</p>
            </div>
          ))}
        </div>
      </details>

      <nav className={`flex flex-wrap gap-2 rounded-3xl border p-2 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
        {(['Boards', 'Items', 'Photos', 'Graph', 'Schedule', 'Costs'] as WorkspaceTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow'
                : isDesktopStyle
                  ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'Items' && renderItems()}
      {activeTab === 'Photos' && renderPhotos()}
      {activeTab === 'Graph' && renderGraph()}
      {activeTab === 'Schedule' && renderSchedule()}
      {activeTab === 'Costs' && renderCosts()}
    </div>
  );
};;
