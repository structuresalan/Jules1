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
const annotationTools: AnnotationTool[] = ['Select', 'Arrow', 'Line', 'Box', 'Cloud', 'Highlight', 'Text', 'Stamp', 'Count', 'Reference', 'Length', 'Perimeter', 'Area'];
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
  const [draggingNodeId, setDraggingNodeId] = useState('');
  const [draggingNodeOffset, setDraggingNodeOffset] = useState({ x: 0, y: 0 });

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
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
      <aside className={`rounded-3xl border p-4 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Boards</h2>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
            <Upload size={14} />
            Upload
            <input type="file" accept="image/*,application/pdf" onChange={handleBoardUpload} className="hidden" />
          </label>
        </div>

        <div className="space-y-2">
          {boards.length === 0 && <p className={`rounded-xl border p-3 text-sm ${isDesktopStyle ? 'border-white/10 text-slate-300' : 'border-gray-200 text-gray-500'}`}>Upload a plan, elevation, site photo, or PDF to start annotating. Use Select to move existing marks by dragging them.</p>}
          {boards.map((board) => (
            <button
              key={board.id}
              onClick={() => setSelectedBoardId(board.id)}
              className={`w-full rounded-2xl border p-3 text-left text-sm transition ${
                selectedBoard?.id === board.id
                  ? 'border-blue-400 bg-blue-500/15 text-blue-700'
                  : isDesktopStyle
                    ? 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold">{board.name}</div>
              <div className={isDesktopStyle ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-gray-500'}>{board.kind} • {board.fileName}</div>
              {board.scaleFtPerPercent && <div className="mt-2 text-[11px] font-semibold text-green-600">Scale set</div>}
            </button>
          ))}
        </div>
      </aside>

      <section className={`overflow-hidden rounded-3xl border ${isDesktopStyle ? 'ss-glass-strong' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div className={`border-b px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-slate-950/80 text-white' : 'border-gray-200 bg-slate-950 text-white'}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select value={tool} onChange={(event) => setTool(event.target.value as AnnotationTool)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white">
              {annotationTools.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={annotationStatus} onChange={(event) => setAnnotationStatus(event.target.value as WorkspaceStatus)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white">
              {statusOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={selectedToolItemId} onChange={(event) => setSelectedToolItemId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white">
              <option value="">Link item...</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            {tool === 'Stamp' && (
              <select value={stampPreset} onChange={(event) => setStampPreset(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white">
                {stampOptions.map((stamp) => <option key={stamp}>{stamp}</option>)}
              </select>
            )}
            {tool === 'Reference' && (
              <input value={referenceKnownFt} onChange={(event) => setReferenceKnownFt(event.target.value)} placeholder="Known length ft" className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            )}
            {(tool === 'Perimeter' || tool === 'Area') && pendingMeasurePoints.length > 0 && (
              <button onClick={finishMeasurement} className="rounded-lg border border-green-400/40 bg-green-500/20 px-3 py-2 text-sm font-bold text-green-100">
                Finish {tool} ({pendingMeasurePoints.length} pts)
              </button>
            )}
            <button onClick={() => { setPendingMeasurePoints([]); setDraftAnnotation(null); dragStartRef.current = null; }} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-slate-200">
              Clear action
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={annotationLabel} onChange={(event) => setAnnotationLabel(event.target.value)} placeholder="Label / callout text" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
            <input value={annotationNotes} onChange={(event) => setAnnotationNotes(event.target.value)} placeholder="Annotation note" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
          </div>
        </div>

        <div className="relative min-h-[720px] overflow-auto bg-slate-100 p-4">
          {!selectedBoard && (
            <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
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
              onMouseDown={handleBoardMouseDown}
              onMouseMove={(event) => {
                handleAnnotationDragMove(event);
                handleBoardMouseMove(event);
              }}
              onMouseUp={() => {
                stopAnnotationDrag();
                handleBoardMouseUp();
              }}
              className="relative mx-auto min-h-[680px] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow"
            >
              {selectedBoard.fileType === 'application/pdf' ? (
                <iframe title={selectedBoard.name} src={selectedBoard.dataUrl} className="h-[680px] w-full border-0" />
              ) : (
                <img src={selectedBoard.dataUrl} alt={selectedBoard.name} draggable={false} className="mx-auto max-h-[680px] w-auto max-w-full select-none object-contain" />
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
        </div>
      </section>

      <aside className={`rounded-3xl border p-4 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
        <h2 className={`font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>Inspector</h2>
        {selectedBoard && (
          <div className="mt-3 space-y-3">
            <label className={`block text-xs font-bold ${isDesktopStyle ? 'text-slate-300' : 'text-gray-600'}`}>
              Board name
              <input value={boardName} onChange={(event) => setBoardName(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <label className={`block text-xs font-bold ${isDesktopStyle ? 'text-slate-300' : 'text-gray-600'}`}>
              Board kind
              <select value={boardKind} onChange={(event) => setBoardKind(event.target.value as BoardKind)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                {['Plan', 'Elevation', 'Site Photo', 'PDF', 'Other'].map((kind) => <option key={kind}>{kind}</option>)}
              </select>
            </label>
            <label className={`block text-xs font-bold ${isDesktopStyle ? 'text-slate-300' : 'text-gray-600'}`}>
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
          <div className={`mt-5 rounded-2xl border p-3 ${isDesktopStyle ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
            <div className={`text-xs font-bold uppercase tracking-wide ${isDesktopStyle ? 'text-slate-400' : 'text-gray-500'}`}>Selected annotation</div>
            <div className={`mt-2 font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>{selectedAnnotation.label}</div>
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
          <div className={isDesktopStyle ? 'text-xs text-slate-400' : 'text-xs text-gray-500'}>
            PDF replacement tools: arrows, clouds, boxes, text, stamps, count, reference scale, length, perimeter, area, linked photos, annotation schedules, and drag-to-move annotations with Select.
          </div>
        </div>
      </aside>
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
    const nodeMap = new globalThis.Map<string, { node: GraphNode; position: GraphPosition }>(graphNodes.map((node, index) => [node.id, { node, position: graphPositionForNode(node.id, index) }]));

    return (
      <div className="space-y-4">
        <section className={`rounded-3xl border p-4 ${isDesktopStyle ? 'ss-glass' : 'border-gray-200 bg-white shadow-sm'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <select value={edgeSource} onChange={(event) => setEdgeSource(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Source node...</option>
              {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.type}: {node.title}</option>)}
            </select>
            <input value={edgeRelation} onChange={(event) => setEdgeRelation(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" placeholder="relation" />
            <select value={edgeTarget} onChange={(event) => setEdgeTarget(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
              <option value="">Target node...</option>
              {graphNodes.map((node) => <option key={node.id} value={node.id}>{node.type}: {node.title}</option>)}
            </select>
            <button onClick={addManualEdge} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">
              <LinkIcon size={15} /> Add Link
            </button>
          </div>
        </section>

        <section ref={graphRef} className="relative min-h-[760px] overflow-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <svg className="pointer-events-none absolute inset-0 h-[1200px] w-[1400px]">
            {graphEdges.map((edge) => {
              const source = nodeMap.get(edge.sourceId);
              const target = nodeMap.get(edge.targetId);
              if (!source || !target) return null;
              return (
                <g key={edge.id}>
                  <line x1={source.position.x + 105} y1={source.position.y + 45} x2={target.position.x + 105} y2={target.position.y + 45} stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.65" />
                  <text x={(source.position.x + target.position.x) / 2 + 105} y={(source.position.y + target.position.y) / 2 + 40} fill="#bae6fd" fontSize="11" fontWeight="700">{edge.relation}</text>
                </g>
              );
            })}
          </svg>

          {graphNodes.map((node, index) => {
            const position = graphPositionForNode(node.id, index);
            return (
              <div
                key={node.id}
                onMouseDown={(event) => {
                  const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                  setDraggingNodeId(node.id);
                  setDraggingNodeOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top });
                }}
                className="absolute z-10 w-56 cursor-grab rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl active:cursor-grabbing"
                style={{ left: position.x, top: position.y }}
              >
                <div className="rounded-t-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white">{node.type}</div>
                <div className="p-3">
                  <div className="font-bold text-white">{node.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{node.subtitle}</div>
                  {node.status && <span className={`mt-3 inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${statusClasses(node.status)}`}>{node.status}</span>}
                </div>
              </div>
            );
          })}
        </section>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{items.length}</div>Items</div>
            <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{annotations.length}</div>Marks</div>
            <div className={`rounded-2xl border px-4 py-3 ${isDesktopStyle ? 'border-white/10 bg-white/10 text-slate-200' : 'border-gray-200 bg-gray-50 text-gray-700'}`}><div className="text-xl font-bold">{graphEdges.length}</div>Links</div>
          </div>
        </div>
      </header>


      <section className={`grid grid-cols-1 gap-3 md:grid-cols-4 ${isDesktopStyle ? 'text-slate-200' : 'text-gray-700'}`}>
        {[
          ['1', 'Create Items', 'Add Beam B12, Column C4, Repair Area R1, etc. Items are the real project objects.'],
          ['2', 'Upload Boards', 'Add plans, elevations, PDFs, or site photos in Boards. These replace the old Visual Map.'],
          ['3', 'Markup + Measure', 'Use the tool dropdown for arrows, clouds, stamps, reference scale, length, perimeter, and area.'],
          ['4', 'Link Everything', 'Link annotations, photos, and cost lines to Items. The Graph updates from those links.'],
        ].map(([step, title, body]) => (
          <div key={step} className={`rounded-2xl border p-4 ${isDesktopStyle ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{step}</div>
            <div className={`font-bold ${isDesktopStyle ? 'text-white' : 'text-gray-900'}`}>{title}</div>
            <p className="mt-1 text-xs opacity-80">{body}</p>
          </div>
        ))}
      </section>

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

      {activeTab === 'Boards' && renderBoards()}
      {activeTab === 'Items' && renderItems()}
      {activeTab === 'Photos' && renderPhotos()}
      {activeTab === 'Graph' && renderGraph()}
      {activeTab === 'Schedule' && renderSchedule()}
      {activeTab === 'Costs' && renderCosts()}
    </div>
  );
};
