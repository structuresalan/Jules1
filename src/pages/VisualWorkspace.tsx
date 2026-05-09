import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  Cloud,
  FileText,
  Filter,
  Grid3X3,
  HelpCircle,
  Highlighter,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  Move,
  Palette,
  PenLine,
  Plus,
  Redo2,
  Ruler,
  Search,
  Settings,
  Sparkles,
  Square,
  Type,
  Undo2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';

type MarkupStatus = 'Field Verify' | 'Monitor' | 'Complete';
type Priority = 'High' | 'Medium' | 'Low';
type UserRole = 'Engineer' | 'Client';
type WorkspaceTab = 'Workspace' | 'Review' | 'Report' | 'Export';
type PanelMode = 'none' | 'report' | 'export' | 'settings' | 'color' | 'scale' | 'photoPicker' | 'note' | 'file';

interface MarkupGeometry {
  x: number;
  y: number;
  width?: number;
  height?: number;
  x2?: number;
  y2?: number;
  points?: { x: number; y: number }[];
  fontSize?: number;
  fontFamily?: string;
}

interface MarkupItem {
  id: number;
  color: string;
  type: string;
  itemName: string;
  location: string;
  status: MarkupStatus;
  condition: string;
  priority: Priority;
  discipline: string;
  dueDate: string;
  section: string;
  notes: string;
  photoIds: number[];
  toolType?: string;
  geometry?: MarkupGeometry;
}

interface SitePhoto {
  id: number;
  color: string;
  fileName: string;
  date: string;
  grid: string;
  caption: string;
  photoType: 'seat' | 'flange' | 'section';
  itemId?: number;
}

interface CommentItem {
  id: number;
  itemId: number;
  authorRole: UserRole;
  author: string;
  body: string;
  createdAt: string;
  resolved: boolean;
}

interface DocumentLink {
  id: number;
  itemId: number;
  name: string;
  type: string;
  reference: string;
}

const initialMarkups: MarkupItem[] = [
  {
    id: 1,
    color: '#ef4444',
    type: 'Beam',
    itemName: 'B12',
    location: 'Grid 6 / A-B',
    status: 'Field Verify',
    condition: 'Corrosion at seat connection',
    priority: 'High',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition.',
    photoIds: [1, 4, 5],
    toolType: 'Cloud',
    geometry: { x: 74, y: 9, width: 9, height: 7 },
  },
  {
    id: 2,
    color: '#2563eb',
    type: 'Beam',
    itemName: 'B18',
    location: 'Grid 6 / B-C',
    status: 'Field Verify',
    condition: 'Paint peeling, rust scale',
    priority: 'Medium',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Paint peeling and rust scale visible along bottom flange. Check bottom flange and web thickness.',
    photoIds: [2],
    toolType: 'Cloud',
    geometry: { x: 75, y: 30, width: 8, height: 6 },
  },
  {
    id: 3,
    color: '#16a34a',
    type: 'Beam',
    itemName: 'B31',
    location: 'Grid 5 / C-D',
    status: 'Field Verify',
    condition: 'Section loss at midspan',
    priority: 'High',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Section loss at midspan. Verify remaining thickness and repair requirements.',
    photoIds: [3],
    toolType: 'Cloud',
    geometry: { x: 64, y: 70, width: 10, height: 7 },
  },
  {
    id: 4,
    color: '#eab308',
    type: 'Column',
    itemName: 'C16',
    location: 'Grid 5 / B-C',
    status: 'Monitor',
    condition: 'Surface rust',
    priority: 'Low',
    discipline: 'Structural',
    dueDate: 'Jun 10, 2025',
    section: 'HSS6x6x1/4',
    notes: 'Monitor surface rust at column base.',
    photoIds: [],
  },
  {
    id: 5,
    color: '#8b5cf6',
    type: 'Beam',
    itemName: 'B7',
    location: 'Grid 2 / A-B',
    status: 'Complete',
    condition: 'No visible distress',
    priority: 'Low',
    discipline: 'Structural',
    dueDate: '—',
    section: 'W16x26',
    notes: 'No visible distress observed.',
    photoIds: [],
  },
];

const initialPhotos: SitePhoto[] = [
  { id: 1, color: '#ef4444', fileName: 'P101_0456.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Corroded beam seat connection', photoType: 'seat', itemId: 1 },
  { id: 2, color: '#2563eb', fileName: 'P101_0461.JPG', date: 'May 11, 2025', grid: 'Grid 6 / B-C', caption: 'Peeling paint and rust scale', photoType: 'flange', itemId: 2 },
  { id: 3, color: '#16a34a', fileName: 'P101_0468.JPG', date: 'May 11, 2025', grid: 'Grid 5 / C-D', caption: 'Midspan section loss', photoType: 'section', itemId: 3 },
  { id: 4, color: '#ef4444', fileName: 'P101_0457.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Seat bearing corrosion close-up', photoType: 'seat', itemId: 1 },
  { id: 5, color: '#ef4444', fileName: 'P101_0458.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Bearing stiffener rust', photoType: 'flange', itemId: 1 },
];

const initialComments: CommentItem[] = [
  {
    id: 1,
    itemId: 1,
    authorRole: 'Engineer',
    author: 'A. Morgan',
    body: 'Verify seat angle thickness and bearing stiffener condition during follow-up visit.',
    createdAt: 'May 12, 2025 9:15 AM',
    resolved: false,
  },
  {
    id: 2,
    itemId: 2,
    authorRole: 'Client',
    author: 'Client Reviewer',
    body: 'Please clarify whether this needs immediate repair or can be monitored.',
    createdAt: 'May 12, 2025 10:40 AM',
    resolved: false,
  },
];

const initialDocuments: DocumentLink[] = [
  { id: 1, itemId: 1, name: 'Level 2 Framing Plan', type: 'Drawing', reference: 'S-2.3' },
  { id: 2, itemId: 1, name: 'Beam B12 Repair Sketch', type: 'Sketch', reference: 'SK-S-101' },
  { id: 3, itemId: 2, name: 'Inspection Photo Report', type: 'Report', reference: 'RPT-001' },
];

const toolGroups = [
  { label: 'Navigate', tools: [['Select', MousePointer2], ['Pan', Move], ['Zoom', ZoomIn], ['Fit', Maximize2], ['Zoom Area', Search]] },
  { label: 'Markup', tools: [['Arrow', MousePointer2], ['Cloud', Cloud], ['Text', Type], ['Box', Square], ['Callout', MessageSquare], ['Dimension', Ruler]] },
  { label: 'Measure', tools: [['Distance', Ruler], ['Angle', PenLine], ['Area', Square]] },
  { label: 'Insert', tools: [['Note', FileText], ['Photo', Camera], ['File', Upload], ['Link', LinkIcon]] },
  { label: 'Annotate', tools: [['Highlighter', Highlighter], ['Pen', PenLine], ['Eraser', PenLine], ['Color', Palette]] },
  { label: 'Layers', tools: [['Layers', Layers], ['Scale', Ruler], ['Grid', Grid3X3], ['Snap', Sparkles]] },
  { label: 'Edit', tools: [['Undo', Undo2], ['Redo', Redo2], ['More', MoreHorizontal]] },
] as const;

const readLocal = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const statusClass = (status: MarkupStatus) => {
  if (status === 'Field Verify') return 'bg-red-500/20 text-red-100 border-red-400/40';
  if (status === 'Monitor') return 'bg-amber-500/20 text-amber-100 border-amber-400/40';
  return 'bg-green-500/20 text-green-100 border-green-400/40';
};

const lightStatusClass = (status: MarkupStatus) => {
  if (status === 'Field Verify') return 'bg-red-100 text-red-700';
  if (status === 'Monitor') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

const priorityClass = (priority: Priority) => {
  if (priority === 'High') return 'bg-red-100 text-red-700';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

const PhotoSvg: React.FC<{ photo: SitePhoto }> = ({ photo }) => {
  const tone = photo.photoType === 'seat' ? ['#5b3b22', '#9a6537', '#1f2937'] : photo.photoType === 'flange' ? ['#6b4a2f', '#c58a4b', '#334155'] : ['#78350f', '#b45309', '#475569'];

  return (
    <svg viewBox="0 0 360 190" className="h-full w-full">
      <defs>
        <linearGradient id={`rust-bg-${photo.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={tone[2]} />
          <stop offset="0.45" stopColor="#111827" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`rust-${photo.id}`} x1="0" x2="1">
          <stop stopColor={tone[0]} />
          <stop offset="0.45" stopColor={tone[1]} />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id={`noise-${photo.id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={photo.id * 9} />
          <feColorMatrix type="saturate" values="0.35" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </defs>
      <rect width="360" height="190" fill={`url(#rust-bg-${photo.id})`} />
      <g filter={`url(#noise-${photo.id})`} opacity="0.9">
        <rect x="20" y="46" width="320" height="56" rx="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="20" y="102" width="320" height="22" fill="#334155" />
        <path d="M40 47h250c-23 13-42 23-72 25-49 3-71-12-106 4-31 14-46 16-72 6z" fill={`url(#rust-${photo.id})`} opacity="0.78" />
        <path d="M55 105c42-8 78 11 122 0s73-15 126-4v22H55z" fill="#b45309" opacity="0.85" />
        <circle cx="105" cy="73" r="18" fill="#7f1d1d" opacity="0.75" />
        <circle cx="104" cy="72" r="7" fill="#292524" />
        <rect x="76" y="32" width="28" height="122" fill="#57534e" stroke="#cbd5e1" strokeWidth="2" opacity="0.72" />
        <rect x="251" y="35" width="30" height="116" fill="#57534e" stroke="#cbd5e1" strokeWidth="2" opacity="0.68" />
        {[0, 1, 2, 3, 4].map((index) => (
          <circle key={index} cx={92 + index * 39} cy={74 + (index % 2) * 10} r="6" fill="#1f2937" stroke="#cbd5e1" strokeWidth="1.2" />
        ))}
        <path d="M0 150c52-18 100 14 150-6 52-21 109-13 210 3v43H0z" fill="#a16207" opacity="0.6" />
      </g>
    </svg>
  );
};

const FramingPlan: React.FC<{
  onSelect: (id: number) => void;
  markups: MarkupItem[];
  selectedId: number;
  activeTool: string;
  draftGeometry: MarkupGeometry | null;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (event: React.PointerEvent<SVGSVGElement>) => void;
  onErase: (id: number) => void;
  onResizeStart: (id: number, handle: 'se', point: { x: number; y: number }) => void;
  showGrid: boolean;
}> = ({ onSelect, markups, selectedId, activeTool, draftGeometry, onPointerDown, onPointerMove, onPointerUp, onErase, onResizeStart, showGrid }) => {
  const xs = [92, 214, 336, 458, 580, 702, 824];
  const ys = [76, 210, 344, 478];

  const beamLabel = (x1: number, y1: number, x2: number, label: string) => (
    <text x={(x1 + x2) / 2} y={y1 - 8} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#111827">{label}</text>
  );

  const selectionHandles = (item: MarkupItem, x: number, y: number, width: number, height: number) => {
    if (selectedId !== item.id || item.toolType === 'Distance' || item.toolType === 'Dimension' || item.toolType === 'Pen') return null;
    const safeWidth = Math.max(width, 38);
    const safeHeight = Math.max(height, 26);

    return (
      <g pointerEvents="all">
        <rect x={x - 6} y={y - 6} width={safeWidth + 12} height={safeHeight + 12} fill="none" stroke="#0f172a" strokeWidth="2" strokeDasharray="5 4" />
        {[
          [x - 6, y - 6],
          [x + safeWidth + 6, y - 6],
          [x - 6, y + safeHeight + 6],
          [x + safeWidth + 6, y + safeHeight + 6],
        ].map(([handleX, handleY], handleIndex) => (
          <rect
            key={handleIndex}
            x={handleX - 4}
            y={handleY - 4}
            width="8"
            height="8"
            fill="white"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
        ))}
        <rect
          x={x + safeWidth + 2}
          y={y + safeHeight + 2}
          width="14"
          height="14"
          rx="3"
          fill="#0f172a"
          className="cursor-se-resize"
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelect(item.id);
            onResizeStart(item.id, 'se', { x: event.clientX, y: event.clientY });
          }}
        />
      </g>
    );
  };

  return (
    <svg
      data-testid="plan-canvas"
      viewBox="0 0 980 640"
      className={`h-full w-full select-none bg-white ${activeTool !== 'Select' ? 'cursor-crosshair' : ''}`}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' }}
      onMouseDown={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <defs>
        <pattern id="paper" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#ffffff" />
          <circle cx="1" cy="1" r="0.5" fill="#e5e7eb" />
        </pattern>
        <marker id="planArrowRed" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
        </marker>
        <marker id="planArrowBlue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
        <marker id="planArrowGreen" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#16a34a" />
        </marker>
      </defs>

      <rect width="980" height="640" fill="url(#paper)" />
      {showGrid && (
        <g opacity="0.35">
          {Array.from({ length: 49 }).map((_, index) => <line key={`vg-${index}`} x1={index * 20} y1="0" x2={index * 20} y2="640" stroke="#dbeafe" />)}
          {Array.from({ length: 32 }).map((_, index) => <line key={`hg-${index}`} x1="0" y1={index * 20} x2="980" y2={index * 20} stroke="#dbeafe" />)}
        </g>
      )}

      {xs.map((x, index) => (
        <g key={`gx-${index}`}>
          <line x1={x} y1="72" x2={x} y2="528" stroke="#9ca3af" strokeDasharray="6 6" />
          <circle cx={x} cy="36" r="15" fill="white" stroke="#6b7280" />
          <text x={x} y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{index + 1}</text>
        </g>
      ))}

      {ys.map((y, index) => (
        <g key={`gy-${index}`}>
          <line x1="92" y1={y} x2="824" y2={y} stroke="#9ca3af" strokeDasharray="6 6" />
          <circle cx="38" cy={y} r="15" fill="white" stroke="#6b7280" />
          <text x="38" y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{String.fromCharCode(65 + index)}</text>
        </g>
      ))}

      <g stroke="#111827" strokeWidth="2">
        {ys.map((y) => xs.slice(0, -1).map((x, index) => <line key={`${y}-${x}`} x1={x} y1={y} x2={xs[index + 1]} y2={y} />))}
        {xs.map((x) => ys.slice(0, -1).map((y, index) => <line key={`${x}-${y}`} x1={x} y1={y} x2={x} y2={ys[index + 1]} stroke="#6b7280" strokeWidth="1.2" />))}
      </g>

      <g fill="white" stroke="#111827" strokeWidth="1.3">
        {xs.map((x, xi) => ys.map((y, yi) => <rect key={`${xi}-${yi}`} x={x - 6} y={y - 6} width="12" height="12" />))}
      </g>

      <g fontSize="8" fontWeight="700" fill="#111827">
        {ys.map((y, row) => xs.slice(0, -1).map((x, col) => beamLabel(x, y, xs[col + 1], `B${row * 6 + col + 1} (W16x26)`)))}
      </g>

      <g stroke="#111827" strokeWidth="1.2" fill="none">
        <rect x="456" y="214" width="116" height="130" />
        <line x1="456" y1="214" x2="572" y2="344" />
        <line x1="572" y1="214" x2="456" y2="344" />
        <rect x="630" y="230" width="85" height="77" />
        <path d="M648 292h46M648 282h46M648 272h46M648 262h46M648 252h46" />
        <text x="667" y="317" fontSize="10">P-3-2</text>
      </g>

      <g fontSize="12" fill="#111827">
        <text x="66" y="141">24&apos;-0&quot;</text>
        <text x="66" y="275">24&apos;-0&quot;</text>
        <text x="66" y="409">24&apos;-0&quot;</text>
        <text x="431" y="592" fontWeight="700">180&apos;-0&quot;</text>
      </g>

      {markups.map((item, index) => {
        const color = item.color;
        const geometry = item.geometry ?? { x: [78, 80, 70][index] ?? 55, y: [12, 34, 74][index] ?? 45, width: 9, height: 7 };
        const x = (geometry.x / 100) * 980;
        const y = (geometry.y / 100) * 640;
        const width = ((geometry.width ?? 8) / 100) * 980;
        const height = ((geometry.height ?? 6) / 100) * 640;
        const x2 = geometry.x2 !== undefined ? (geometry.x2 / 100) * 980 : x + width + 70;
        const y2 = geometry.y2 !== undefined ? (geometry.y2 / 100) * 640 : y + height + 40;
        const isSelected = selectedId === item.id;

        if (item.toolType === 'Pen' && geometry.points?.length) {
          return (
            <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
              <polyline points={geometry.points.map((point) => `${(point.x / 100) * 980},${(point.y / 100) * 640}`).join(' ')} fill="none" stroke={color} strokeWidth={isSelected ? 4 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={(geometry.points[0].x / 100) * 980} cy={(geometry.points[0].y / 100) * 640} r="11" fill={color} />
              <text x={(geometry.points[0].x / 100) * 980} y={(geometry.points[0].y / 100) * 640 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{item.id}</text>
            </g>
          );
        }

        if (item.toolType === 'Highlighter') {
          return (
            <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
              <rect x={x} y={y} width={Math.max(width, 25)} height={Math.max(height, 16)} fill={color} opacity="0.23" stroke={color} strokeWidth={isSelected ? 3 : 1.5} />
              <circle cx={x} cy={y} r="11" fill={color} opacity="0.95" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{item.id}</text>
              {selectionHandles(item, x, y, Math.max(width, 25), Math.max(height, 16))}
            </g>
          );
        }

        if (item.toolType === 'Distance' || item.toolType === 'Dimension') {
          return (
            <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
              <line x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth={isSelected ? 3 : 2} />
              <circle cx={x} cy={y} r="5" fill={color} />
              <circle cx={x2} cy={y2} r="5" fill={color} />
              <rect x={(x + x2) / 2 - 42} y={(y + y2) / 2 - 14} width="84" height="24" rx="4" fill="white" stroke={color} />
              <text x={(x + x2) / 2} y={(y + y2) / 2 + 3} textAnchor="middle" fontSize="10" fontWeight="800" fill={color}>{item.notes}</text>
              <circle cx={x} cy={y - 18} r="11" fill={color} />
              <text x={x} y={y - 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{item.id}</text>
            </g>
          );
        }

        if (item.toolType === 'Text') {
          return (
            <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (activeTool === 'Eraser') {
                  onSelect(item.id);
                  onErase(item.id);
                  return;
                }
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
              {isSelected && <rect x={x - 8} y={y - 24} width={Math.max(width, 120)} height={Math.max(height, 44)} rx="4" fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 3" />}
              <circle cx={x - 12} cy={y - 10} r="12" fill={color} />
              <text x={x - 12} y={y - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{item.id}</text>
              <text x={x + 8} y={y} fontSize={geometry.fontSize ?? 18} fontFamily={geometry.fontFamily ?? 'Arial'} fontWeight="800" fill={color}>{item.condition}</text>
              {selectionHandles(item, x - 8, y - 24, Math.max(width, 120), Math.max(height, 44))}
            </g>
          );
        }

        if (item.toolType === 'Box' || item.toolType === 'Callout') {
          return (
            <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
              <rect x={x} y={y} width={Math.max(width, 80)} height={Math.max(height, 36)} rx="4" fill="white" stroke={color} strokeWidth={isSelected ? 3 : 1.8} />
              <circle cx={x} cy={y} r="12" fill={color} />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{item.id}</text>
              <text x={x + 12} y={y + 20} fontSize="10" fontWeight="800" fill={color}>{item.condition.toUpperCase().slice(0, 24)}</text>
              {selectionHandles(item, x, y, Math.max(width, 80), Math.max(height, 36))}
            </g>
          );
        }

        return (
          <g
              key={item.id}
              data-testid={`annotation-${item.id}`}
              data-selected={isSelected ? 'true' : 'false'}
              data-tool-type={item.toolType ?? 'Cloud'}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelect(item.id);
              }}
              onClick={(event) => { event.stopPropagation(); onSelect(item.id); }}
              className={activeTool === 'Select' ? 'cursor-move' : 'cursor-pointer'}
            >
            <path d={`M${x} ${y}c${width * 0.3}-${height * 0.8} ${width * 1.1}-${height * 0.6} ${width * 1.25} ${height * 0.05}c${width * 0.2} ${height * 0.7}-${width * 0.2} ${height * 1.2}-${width * 0.85} ${height * 1.05}c-${width * 0.6} ${height * 0.55}-${width * 1.25}-${height * 0.1}-${width * 1.15}-${height * 0.7}c${width * 0.05}-${height * 0.35} ${width * 0.25}-${height * 0.55} ${width * 0.45}-${height * 0.4}z`} fill="none" stroke={color} strokeWidth={isSelected ? 3.5 : 2.5} strokeDasharray="5 4" />
            <circle cx={x + width * 0.52} cy={y + height + 18} r="12" fill={color} />
            <text x={x + width * 0.52} y={y + height + 23} textAnchor="middle" fontSize="12" fontWeight="700" fill="white">{item.id}</text>
            <line x1={x + width * 0.65} y1={y + height + 18} x2={x2} y2={y2} stroke={color} strokeWidth="2" markerEnd="url(#planArrowRed)" />
            <rect x={x2} y={y2 - 32} width="156" height="58" rx="4" fill="#fff" stroke={color} strokeWidth="1.6" />
            <text x={x2 + 10} y={y2 - 12} fontSize="10" fontWeight="800" fill={color}>{item.condition.toUpperCase().slice(0, 22)}</text>
            <text x={x2 + 10} y={y2 + 4} fontSize="10" fontWeight="800" fill={color}>FIELD VERIFY.</text>
            {selectionHandles(item, x, y, Math.max(width, 70), Math.max(height, 46))}
          </g>
        );
      })}

      {draftGeometry && (
        <g pointerEvents="none" opacity="0.75">
          {activeTool === 'Pen' && draftGeometry.points?.length ? (
            <polyline points={draftGeometry.points.map((point) => `${(point.x / 100) * 980},${(point.y / 100) * 640}`).join(' ')} fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          ) : activeTool === 'Distance' || activeTool === 'Dimension' ? (
            <line x1={(draftGeometry.x / 100) * 980} y1={(draftGeometry.y / 100) * 640} x2={((draftGeometry.x2 ?? draftGeometry.x) / 100) * 980} y2={((draftGeometry.y2 ?? draftGeometry.y) / 100) * 640} stroke="#0ea5e9" strokeWidth="3" />
          ) : (
            <rect x={(Math.min(draftGeometry.x, draftGeometry.x2 ?? draftGeometry.x) / 100) * 980} y={(Math.min(draftGeometry.y, draftGeometry.y2 ?? draftGeometry.y) / 100) * 640} width={(Math.abs((draftGeometry.x2 ?? draftGeometry.x) - draftGeometry.x) / 100) * 980} height={(Math.abs((draftGeometry.y2 ?? draftGeometry.y) - draftGeometry.y) / 100) * 640} fill={activeTool === 'Highlighter' ? '#0ea5e9' : 'none'} opacity={activeTool === 'Highlighter' ? 0.22 : 1} stroke="#0ea5e9" strokeWidth="3" strokeDasharray={activeTool === 'Cloud' ? '6 4' : undefined} />
          )}
        </g>
      )}
    </svg>
  );
};

export const VisualWorkspace: React.FC = () => {
  const [markups, setMarkups] = useState<MarkupItem[]>(() => readLocal('simplifystruct.visual.markups.v3', initialMarkups));
  const [photos, setPhotos] = useState<SitePhoto[]>(() => readLocal('simplifystruct.visual.photos.v3', initialPhotos));
  const [comments, setComments] = useState<CommentItem[]>(() => readLocal('simplifystruct.visual.comments.v3', initialComments));
  const [documents, setDocuments] = useState<DocumentLink[]>(() => readLocal('simplifystruct.visual.documents.v3', initialDocuments));
  const [role, setRole] = useState<UserRole>(() => readLocal<UserRole>('simplifystruct.visual.role.v3', 'Engineer'));
  const [selectedId, setSelectedId] = useState(1);
  const [selectedRelationshipNode, setSelectedRelationshipNode] = useState('item');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('Workspace');
  const [activeTool, setActiveTool] = useState('Select');
  const [activePanel, setActivePanel] = useState<PanelMode>('none');
  const [newComment, setNewComment] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ '03 - Structural': true, 'Photos & Documents': true });
  const [activeBoard, setActiveBoard] = useState('Level 2 Framing Plan');
  const [boardSearch, setBoardSearch] = useState('');
  const [showPhotosPanel, setShowPhotosPanel] = useState(true);
  const [showInspectorPanel, setShowInspectorPanel] = useState(true);
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [enabledLayers, setEnabledLayers] = useState<Record<string, boolean>>({
    'Plan Grid': true,
    'Structural - Beams': true,
    'Structural - Columns': true,
    Dimensions: true,
    Markups: true,
    Notes: true,
    Photos: true,
    Reference: false,
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [planZoom, setPlanZoom] = useState(1);
  const [planPan, setPlanPan] = useState({ x: 0, y: 0 });
  const [panState, setPanState] = useState<{ startClient: { x: number; y: number }; original: { x: number; y: number } } | null>(null);
  const [draftGeometry, setDraftGeometry] = useState<MarkupGeometry | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [moveState, setMoveState] = useState<{ id: number; startClient: { x: number; y: number }; original: MarkupGeometry; didMove?: boolean; started?: boolean; before: MarkupItem[] } | null>(null);
  const [resizeState, setResizeState] = useState<{ id: number; startClient: { x: number; y: number }; original: MarkupGeometry; before: MarkupItem[] } | null>(null);
  const [undoStack, setUndoStack] = useState<MarkupItem[][]>([]);
  const [redoStack, setRedoStack] = useState<MarkupItem[][]>([]);
  const [scaleReference, setScaleReference] = useState<{ points?: MarkupGeometry; feet?: number } | null>(null);
  const [isSettingScale, setIsSettingScale] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [uploadedPhotoName, setUploadedPhotoName] = useState('');

  useEffect(() => writeLocal('simplifystruct.visual.markups.v3', markups), [markups]);
  useEffect(() => writeLocal('simplifystruct.visual.photos.v3', photos), [photos]);
  useEffect(() => writeLocal('simplifystruct.visual.comments.v3', comments), [comments]);
  useEffect(() => writeLocal('simplifystruct.visual.documents.v3', documents), [documents]);
  useEffect(() => writeLocal('simplifystruct.visual.role.v3', role), [role]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDraftGeometry(null);
        setIsDrawing(false);
        setMoveState(null);
        setResizeState(null);
        setPanState(null);
        setIsSettingScale(false);
        setActiveTool('Select');
        showToast('Tool cancelled. Select mode active.');
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && activeTool === 'Select') {
        const currentSelected = markups.find((item) => item.id === selectedId);
        if (!currentSelected) return;
        if (!requireEngineer('delete markups')) return;
        if (markups.length <= 1) {
          showToast('At least one item must remain in this prototype.');
          return;
        }
        const fallback = markups.find((item) => item.id !== currentSelected.id)?.id ?? markups[0].id;
        applyMarkups((current) => current.filter((item) => item.id !== currentSelected.id));
        setSelectedId(fallback);
        showToast('Selected markup deleted.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, markups, selectedId, role]);

  const selected = useMemo(() => markups.find((item) => item.id === selectedId) ?? markups[0] ?? initialMarkups[0], [markups, selectedId]);
  const linkedPhotos = useMemo(() => photos.filter((photo) => selected.photoIds.includes(photo.id)), [photos, selected]);
  const selectedDocuments = useMemo(() => documents.filter((document) => document.itemId === selected.id), [documents, selected]);
  const selectedComments = useMemo(() => comments.filter((comment) => comment.itemId === selected.id), [comments, selected]);
  const relatedMarkupCount = useMemo(() => markups.filter((item) => item.location === selected.location || item.itemName === selected.itemName).length, [markups, selected]);
  const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? linkedPhotos[0] ?? photos[0];
  const linkedDocumentId = selectedDocuments[0]?.reference ?? (selected.type === 'Beam' ? 'S-2.3' : 'S-4.1');
  const linkedCostId = selected.type === 'Beam' ? 'C-102' : 'C-208';
  const linkedCostAmount = selected.priority === 'High' ? 1240 : selected.priority === 'Medium' ? 720 : 180;

  const relationshipNodes = [
    { id: 'marker', label: `Plan Marker #${selected.id}`, subtitle: selected.location, type: 'Location', count: 1, color: 'blue', x: 30, y: 48 },
    { id: 'item', label: `${selected.type} ${selected.itemName}`, subtitle: selected.section, type: 'Project Item', count: 1, color: 'red', x: 262, y: 38 },
    { id: 'photos', label: `Site Photos (${linkedPhotos.length})`, subtitle: linkedPhotos[0]?.fileName ?? 'No photos linked', type: 'Photo Set', count: linkedPhotos.length, color: 'cyan', x: 500, y: 48 },
    { id: 'markups', label: `Board Markups (${relatedMarkupCount})`, subtitle: selected.condition, type: 'Board Annotations', count: relatedMarkupCount, color: 'amber', x: 30, y: 152 },
    { id: 'cost', label: `Cost Item ${linkedCostId}`, subtitle: `$${linkedCostAmount.toLocaleString()} allowance`, type: 'Cost', count: 1, color: 'green', x: 262, y: 154 },
    { id: 'document', label: `Document ${linkedDocumentId}`, subtitle: selectedDocuments[0]?.name ?? 'Reference drawing / report', type: 'Document', count: selectedDocuments.length || 1, color: 'purple', x: 500, y: 152 },
  ];

  const selectedRelationship = relationshipNodes.find((node) => node.id === selectedRelationshipNode) ?? relationshipNodes[1];

  const relationshipEdges = [
    { from: 'marker', to: 'item', label: 'refers to' },
    { from: 'item', to: 'photos', label: 'has' },
    { from: 'item', to: 'cost', label: 'impacts' },
    { from: 'markups', to: 'item', label: 'relates' },
    { from: 'cost', to: 'document', label: 'referenced by' },
  ];

  const nodeTheme = {
    blue: 'border-blue-500 bg-blue-50 text-blue-900',
    red: 'border-red-500 bg-red-500 text-white',
    cyan: 'border-cyan-500 bg-cyan-50 text-cyan-900',
    amber: 'border-amber-500 bg-amber-50 text-amber-900',
    green: 'border-green-600 bg-green-50 text-green-900',
    purple: 'border-purple-500 bg-purple-50 text-purple-900',
  } as const;

  const selectMarkup = (id: number, relationshipNode = 'item') => {
    const target = markups.find((item) => item.id === id);
    setSelectedId(id);
    setSelectedRelationshipNode(relationshipNode);
    const firstPhoto = photos.find((photo) => (target?.photoIds ?? []).includes(photo.id));
    setActivePhotoId(firstPhoto?.id ?? null);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 2600);
  };

  const requireEngineer = (action: string) => {
    if (role === 'Engineer') return true;
    showToast(`Clients can comment only. Switch to Engineer to ${action}.`);
    return false;
  };

  const pushHistory = () => {
    setUndoStack((current) => [...current.slice(-19), markups]);
    setRedoStack([]);
  };

  const applyMarkups = (updater: (current: MarkupItem[]) => MarkupItem[]) => {
    pushHistory();
    setMarkups((current) => updater(current));
  };

  const updateSelectedMarkup = (updates: Partial<MarkupItem>) => {
    if (!requireEngineer('edit this item')) return;
    applyMarkups((current) => current.map((item) => (item.id === selected.id ? { ...item, ...updates } : item)));
    showToast('Item updated.');
  };

  const attachFakePhoto = () => {
    if (!requireEngineer('attach photos')) return;
    const nextPhotoId = Math.max(...photos.map((photo) => photo.id)) + 1;
    const newPhoto: SitePhoto = {
      id: nextPhotoId,
      color: selected.color,
      fileName: `FIELD_${String(nextPhotoId).padStart(4, '0')}.JPG`,
      date: new Date().toLocaleDateString(),
      grid: selected.location,
      caption: `New field photo linked to ${selected.type} ${selected.itemName}`,
      photoType: selected.priority === 'High' ? 'seat' : 'flange',
      itemId: selected.id,
    };
    setPhotos((current) => [newPhoto, ...current]);
    applyMarkups((current) => current.map((item) => (item.id === selected.id ? { ...item, photoIds: [...item.photoIds, nextPhotoId] } : item)));
    setActivePhotoId(nextPhotoId);
    setSelectedRelationshipNode('photos');
    showToast('Photo attached to selected item.');
  };

  const attachFakeDocument = () => {
    if (!requireEngineer('attach documents')) return;
    const nextId = Math.max(0, ...documents.map((document) => document.id)) + 1;
    setDocuments((current) => [
      ...current,
      {
        id: nextId,
        itemId: selected.id,
        name: `${selected.type} ${selected.itemName} Field Reference`,
        type: 'Field Note',
        reference: `REF-${String(nextId).padStart(3, '0')}`,
      },
    ]);
    setSelectedRelationshipNode('document');
    showToast('Document linked to selected item.');
  };

  const addComment = () => {
    const body = newComment.trim();
    if (!body) return;
    const nextId = Math.max(0, ...comments.map((comment) => comment.id)) + 1;
    setComments((current) => [
      {
        id: nextId,
        itemId: selected.id,
        authorRole: role,
        author: role === 'Engineer' ? 'A. Morgan' : 'Client Reviewer',
        body,
        createdAt: new Date().toLocaleString(),
        resolved: false,
      },
      ...current,
    ]);
    setNewComment('');
    showToast('Comment added.');
  };

  const resolveComment = (commentId: number) => {
    if (!requireEngineer('resolve comments')) return;
    setComments((current) => current.map((comment) => (comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment)));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const toggleLayer = (layer: string) => {
    setEnabledLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  const selectLinkedCategory = (label: string) => {
    if (label === 'Linked Photos') {
      setSelectedRelationshipNode('photos');
      setShowPhotosPanel(true);
      setActivePhotoId(linkedPhotos[0]?.id ?? null);
      return;
    }

    if (label === 'Linked Documents') {
      setSelectedRelationshipNode('document');
      return;
    }

    if (label === 'Board Markups') {
      setSelectedRelationshipNode('markups');
      return;
    }

    if (label === 'Linked Costs') {
      setSelectedRelationshipNode('cost');
    }
  };

  const exportData = (kind: 'pdf' | 'word' | 'csv') => {
    const rows = markups.map((item) => `${item.id},${item.type},${item.itemName},${item.location},${item.status},${item.condition},${item.priority}`).join('\n');
    const content = kind === 'csv'
      ? `ID,Type,Item,Location,Status,Condition,Priority\n${rows}`
      : `SimplifyStruct Inspection Report\n\nProject: 1234 - Riverside Office Building\nSelected Item: ${selected.type} ${selected.itemName}\nStatus: ${selected.status}\nCondition: ${selected.condition}\n\nNotes:\n${selected.notes}\n\nComments:\n${selectedComments.map((comment) => `- ${comment.author}: ${comment.body}`).join('\n') || 'No comments.'}`;
    const extension = kind === 'word' ? 'doc' : kind;
    const blob = new Blob([content], { type: kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    anchorElement.download = `simplifystruct-${kind}-export.${extension}`;
    anchorElement.click();
    URL.revokeObjectURL(url);
    showToast(`${kind.toUpperCase()} export created.`);
  };

  const resetDemoData = () => {
    if (!requireEngineer('reset demo data')) return;
    setMarkups(initialMarkups);
    setPhotos(initialPhotos);
    setComments(initialComments);
    setDocuments(initialDocuments);
    setSelectedId(1);
    setSelectedRelationshipNode('item');
    showToast('Demo data reset.');
  };

  const handleToolClick = (label: string) => {
    setActiveTool(label);
    setDraftGeometry(null);
    setIsDrawing(false);

    if (['Arrow', 'Cloud', 'Text', 'Box', 'Callout', 'Dimension', 'Distance', 'Angle', 'Area', 'Highlighter', 'Pen'].includes(label)) {
      showToast(`${label} active. Click and drag on the plan.`);
    }
    if (label === 'Photo') setActivePanel('photoPicker');
    if (label === 'File') setActivePanel('file');
    if (label === 'Note') setActivePanel('note');
    if (label === 'Link') setSelectedRelationshipNode('item');
    if (label === 'Pan') showToast('Pan active. Hold left click and drag the plan. Press Esc to cancel.');
    if (label === 'Fit') {
      setPlanZoom(1);
      setPlanPan({ x: 0, y: 0 });
      showToast('View fit to screen.');
    }
    if (label === 'Zoom' || label === 'Zoom Area') showToast('Zoom active. Use the mouse wheel over the plan. Press Esc to cancel.');
    if (label === 'Undo') {
      const previous = undoStack[undoStack.length - 1];
      if (previous) {
        setRedoStack((current) => [markups, ...current]);
        setMarkups(previous);
        setUndoStack((current) => current.slice(0, -1));
        showToast('Undo.');
      } else {
        showToast('Nothing to undo.');
      }
    }
    if (label === 'Redo') {
      const next = redoStack[0];
      if (next) {
        setUndoStack((current) => [...current, markups]);
        setMarkups(next);
        setRedoStack((current) => current.slice(1));
        showToast('Redo.');
      } else {
        showToast('Nothing to redo.');
      }
    }
    if (label === 'More') setActivePanel('settings');
    if (label === 'Scale') {
      setActiveTool('Scale');
      setIsSettingScale(true);
      showToast('Scale mode: drag a known reference distance, then enter its real feet.');
    }
    if (label === 'Grid') toggleLayer('Plan Grid');
    if (label === 'Snap') {
      setSnapEnabled((value) => !value);
      showToast(`Snap ${snapEnabled ? 'off' : 'on'}.`);
    }
    if (label === 'Layers') showToast('Use the Layers list on the left to toggle layers.');
    if (label === 'Color') setActivePanel('color');
    if (label === 'Eraser') {
      showToast('Eraser active. Click the annotation you want to erase. Press Esc to cancel.');
    }
  };

  const statusMessage = (() => {
    if (activeTool === 'Select') return 'Select active. Click a markup to select it and show properties. Use Eraser to delete, Pan to move the view, Esc cancels active tools.';
    if (activeTool === 'Cloud') return 'Cloud tool active. Drag around a region to create a review cloud linked to the selected item.';
    if (activeTool === 'Pan') return 'Pan active. Hold left click and drag to move the plan view. Press Esc for Select.';
    if (activeTool === 'Zoom' || activeTool === 'Zoom Area') return 'Zoom active. Scroll wheel over the plan to zoom in/out. Press Esc for Select.';
    if (activeTool === 'Eraser') return 'Eraser active. Click the annotation you want erased. Press Esc for Select.';
    if (activeTool === 'Photo') return 'Photo tool active. Choose or add a site photo from the photo picker.';
    if (activeTool === 'Link') return 'Link tool active. Select a plan marker, photo, cost, or document to connect it to the item.';
    if (activeTool === 'Distance' || activeTool === 'Dimension' || activeTool === 'Area') return `${activeTool} tool active. Pick points on the board to record measurement markup.`;
    return `${activeTool} tool active. Use the board canvas to place or edit this markup.`;
  })();

  const pointFromPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const svgPoint = point.matrixTransform(ctm.inverse());
      return {
        x: Math.max(0, Math.min(100, (svgPoint.x / 980) * 100)),
        y: Math.max(0, Math.min(100, (svgPoint.y / 640) * 100)),
      };
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const clientToSvgPercent = (svg: SVGSVGElement, clientPoint: { x: number; y: number }) => {
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const point = svg.createSVGPoint();
      point.x = clientPoint.x;
      point.y = clientPoint.y;
      const svgPoint = point.matrixTransform(ctm.inverse());
      return {
        x: Math.max(0, Math.min(100, (svgPoint.x / 980) * 100)),
        y: Math.max(0, Math.min(100, (svgPoint.y / 640) * 100)),
      };
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((clientPoint.x - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientPoint.y - rect.top) / rect.height) * 100)),
    };
  };

  const createMarkupFromGeometry = (tool: string, geometry: MarkupGeometry) => {
    if (!requireEngineer(`add ${tool.toLowerCase()} markup`)) {
      setDraftGeometry(null);
      setIsDrawing(false);
      return;
    }

    const nextId = Math.max(0, ...markups.map((item) => item.id)) + 1;
    const width = Math.abs((geometry.x2 ?? geometry.x) - geometry.x);
    const height = Math.abs((geometry.y2 ?? geometry.y) - geometry.y);

    if (isSettingScale) {
      const feetRaw = window.prompt('Enter the real-world distance between those two reference points in feet', '10');
      const feet = Number(feetRaw);
      if (Number.isFinite(feet) && feet > 0) {
        setScaleReference({ points: geometry, feet });
        showToast(`Scale set from reference: ${feet} ft.`);
      }
      setIsSettingScale(false);
      setDraftGeometry(null);
      setIsDrawing(false);
      return;
    }

    if (tool === 'Distance' || tool === 'Dimension') {
      if (!scaleReference?.points || !scaleReference.feet) {
        showToast('Set Scale first: click Scale, drag a known reference distance, then enter feet.');
        setDraftGeometry(null);
        setIsDrawing(false);
        return;
      }
      const dx = (geometry.x2 ?? geometry.x) - geometry.x;
      const dy = (geometry.y2 ?? geometry.y) - geometry.y;
      const refDx = (scaleReference.points.x2 ?? scaleReference.points.x) - scaleReference.points.x;
      const refDy = (scaleReference.points.y2 ?? scaleReference.points.y) - scaleReference.points.y;
      const refLength = Math.max(0.0001, Math.sqrt(refDx * refDx + refDy * refDy));
      const drawnLength = Math.sqrt(dx * dx + dy * dy);
      const fakeFeet = Math.max(0.1, Number(((drawnLength / refLength) * scaleReference.feet).toFixed(2)));
      const measurementGeometry: MarkupGeometry = { x: geometry.x, y: geometry.y, x2: geometry.x2, y2: geometry.y2 };
      applyMarkups((current) => [
        ...current,
        {
          id: nextId,
          color: '#0ea5e9',
          type: 'Measurement',
          itemName: `M${nextId}`,
          location: 'Measured on board',
          status: 'Field Verify',
          condition: `${tool} measurement`,
          priority: 'Medium',
          discipline: 'Structural',
          dueDate: 'TBD',
          section: 'Measurement',
          notes: `${fakeFeet}'-0"`,
          photoIds: [],
          toolType: tool,
          geometry: measurementGeometry,
        },
      ]);
      setSelectedId(nextId);
      setSelectedRelationshipNode('markups');
      setDraftGeometry(null);
      setIsDrawing(false);
      showToast(`${tool} added.`);
      return;
    }

    const normalized: MarkupGeometry = tool === 'Pen'
      ? geometry
      : {
          ...geometry,
          x: Math.min(geometry.x, geometry.x2 ?? geometry.x),
          y: Math.min(geometry.y, geometry.y2 ?? geometry.y),
          width: width || geometry.width || 4,
          height: height || geometry.height || 4,
        };

    applyMarkups((current) => [
      ...current,
      {
        id: nextId,
        color: tool === 'Highlighter' ? '#eab308' : '#0ea5e9',
        type: tool === 'Cloud' ? 'Beam' : tool,
        itemName: `N${nextId}`,
        location: 'Marked on board',
        status: 'Field Verify',
        condition: tool === 'Text' ? (window.prompt('Enter text', 'TEXT NOTE') || 'TEXT NOTE') : tool === 'Highlighter' ? 'Highlighted review area' : `${tool} markup`,
        priority: 'Medium',
        discipline: 'Structural',
        dueDate: 'TBD',
        section: 'TBD',
        notes: tool === 'Pen' ? 'Freehand field sketch' : `${tool} note created from board markup.`,
        photoIds: [],
        toolType: tool,
        geometry: normalized,
      },
    ]);
    setSelectedId(nextId);
    setSelectedRelationshipNode('markups');
    setDraftGeometry(null);
    setIsDrawing(false);
    showToast(`${tool} markup added.`);
  };

  const handlePlanPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'Select' || activeTool === 'Eraser') {
      setDraftGeometry(null);
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'Pan') {
      event.preventDefault();
      setPanState({ startClient: { x: event.clientX, y: event.clientY }, original: planPan });
      return;
    }

    if (['Photo', 'File', 'Link', 'Undo', 'Redo', 'More', 'Color', 'Layers', 'Grid', 'Snap', 'Zoom', 'Fit', 'Zoom Area'].includes(activeTool)) return;
    event.preventDefault();
    const point = pointFromPointer(event);
    setIsDrawing(true);
    setDraftGeometry(activeTool === 'Pen' ? { ...point, points: [point] } : { ...point, x2: point.x, y2: point.y });
  };

  const handlePlanPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (panState) {
      setPlanPan({
        x: panState.original.x + event.clientX - panState.startClient.x,
        y: panState.original.y + event.clientY - panState.startClient.y,
      });
      return;
    }

    if (resizeState) {
      const pixelDistance = Math.hypot(event.clientX - resizeState.startClient.x, event.clientY - resizeState.startClient.y);
      if (pixelDistance < 4) return;

      const currentPoint = pointFromPointer(event);
      const startSvg = clientToSvgPercent(event.currentTarget, resizeState.startClient);
      const dx = currentPoint.x - startSvg.x;
      const dy = currentPoint.y - startSvg.y;
      setMarkups((current) => current.map((item) => item.id === resizeState.id ? {
        ...item,
        geometry: {
          ...resizeState.original,
          width: Math.max(1.5, (resizeState.original.width ?? 4) + dx),
          height: Math.max(1.5, (resizeState.original.height ?? 4) + dy),
        },
      } : item));
      return;
    }

    if (moveState) {
      const pixelDistance = Math.hypot(event.clientX - moveState.startClient.x, event.clientY - moveState.startClient.y);
      if (pixelDistance < 6 && !moveState.started) return;

      const currentPoint = pointFromPointer(event);
      const startSvg = clientToSvgPercent(event.currentTarget, moveState.startClient);
      const dx = currentPoint.x - startSvg.x;
      const dy = currentPoint.y - startSvg.y;
      setMoveState((current) => current ? { ...current, didMove: true, started: true } : current);
      setMarkups((current) => current.map((item) => item.id === moveState.id ? { ...item, geometry: { ...moveState.original, x: moveState.original.x + dx, y: moveState.original.y + dy } } : item));
      return;
    }

    if (!isDrawing || !draftGeometry) return;
    const point = pointFromPointer(event);
    setDraftGeometry((current) => {
      if (!current) return current;
      if (snapEnabled) {
        point.x = Math.round(point.x);
        point.y = Math.round(point.y);
      }
      if (activeTool === 'Pen') return { ...current, points: [...(current.points ?? []), point] };
      return { ...current, x2: point.x, y2: point.y };
    });
  };

  const handlePlanPointerUp = () => {
    if (panState) {
      setPanState(null);
      return;
    }

    if (resizeState) {
      setUndoStack((current) => [...current.slice(-19), resizeState.before]);
      setRedoStack([]);
      setResizeState(null);
      showToast('Markup resized.');
      return;
    }

    if (moveState) {
      if (moveState.didMove) {
        setUndoStack((current) => [...current.slice(-19), moveState.before]);
        setRedoStack([]);
        showToast('Markup moved.');
      }
      setMoveState(null);
      return;
    }

    if (!isDrawing || !draftGeometry) return;
    createMarkupFromGeometry(activeTool, draftGeometry);
  };

  const handleEraseMarkup = (id: number) => {
    if (!requireEngineer('delete markups')) return;
    if (markups.length <= 1) {
      showToast('At least one item must remain in this prototype.');
      return;
    }
    const fallback = markups.find((item) => item.id !== id)?.id ?? markups[0].id;
    applyMarkups((current) => current.filter((item) => item.id !== id));
    setSelectedId(fallback);
    showToast('Markup erased.');
  };

  const handleResizeStart = (id: number, _handle: 'se', clientPoint: { x: number; y: number }) => {
    if (activeTool !== 'Select') return;
    const item = markups.find((candidate) => candidate.id === id);
    if (!item?.geometry) return;
    setResizeState({ id, startClient: clientPoint, original: item.geometry, before: markups });
  };


  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#071019] text-slate-100">
      <header className="shrink-0 border-b border-slate-700/80 bg-[#0b1520] shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <Menu size={20} className="text-slate-300" />
            <div className="flex items-center gap-2">
              <div className="relative h-7 w-7 rounded-md bg-blue-600">
                <div className="absolute left-1 top-1 h-2.5 w-5 rounded-sm bg-cyan-300" />
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-sm bg-blue-300" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">SimplifyStruct</span>
            </div>
          </div>

          <nav className="hidden h-full items-stretch md:flex">
            {(['Workspace', 'Review', 'Report', 'Export'] as WorkspaceTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveWorkspaceTab(tab);
                  if (tab === 'Report') setActivePanel('report');
                  if (tab === 'Export') setActivePanel('export');
                }}
                className={`px-8 text-sm font-bold ${activeWorkspaceTab === tab ? 'border-b-2 border-blue-500 bg-slate-800/80 text-white' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden text-sm font-semibold text-slate-200 lg:block">
              Project: 1234 - Riverside Office Building <ChevronDown size={14} className="inline" />
            </div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="hidden rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-slate-100 lg:block"
              title="Engineer can edit. Client can comment only."
            >
              <option>Engineer</option>
              <option>Client</option>
            </select>
            <button onClick={() => setBoardSearch('')} title="Clear board search"><Search size={18} className="text-slate-300" /></button>
            <button onClick={() => setSelectedRelationshipNode('markups')} title="Show board markups">
              <Bell size={18} className="text-slate-300" />
            </button>
            <button onClick={() => setActivePanel('report')}><HelpCircle size={18} className="text-slate-300" /></button>
            <button onClick={() => setActivePanel('settings')}><Settings size={18} className="text-slate-300" /></button>
            {!showPhotosPanel && <button onClick={() => setShowPhotosPanel(true)} className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-200">Photos</button>}
            {!showInspectorPanel && <button onClick={() => setShowInspectorPanel(true)} className="rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-200">Inspector</button>}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">AM</span>
          </div>
        </div>

        <div className="flex min-h-[88px] divide-x divide-slate-800 overflow-x-auto px-3 py-2">
          {toolGroups.map((group) => (
            <div key={group.label} className="flex flex-col justify-between px-2">
              <div className="flex gap-1">
                {group.tools.map(([label, Icon]) => (
                  <button
                    key={label}
                    data-testid={`tool-${label.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleToolClick(label)}
                    className={`flex min-w-[52px] flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                      activeTool === label ? 'bg-blue-600/60 text-white ring-1 ring-blue-400/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-1 text-center text-[10px] text-slate-500">{group.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className={`grid min-h-0 flex-1 ${showPhotosPanel && showInspectorPanel ? 'grid-cols-[252px_minmax(760px,1fr)_260px_315px]' : showPhotosPanel ? 'grid-cols-[252px_minmax(760px,1fr)_260px]' : showInspectorPanel ? 'grid-cols-[252px_minmax(760px,1fr)_315px]' : 'grid-cols-[252px_minmax(760px,1fr)]'}`}>
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-[#0b1620]">
          <div className="border-b border-slate-800 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-300">
              <span>Project</span>
              <button onClick={() => setActivePanel('settings')}><MoreHorizontal size={16} /></button>
            </div>
            <div className="text-sm font-semibold text-white">1234 - Riverside Office Building</div>
          </div>

          <div className="border-b border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide text-white">Boards</h2>
              <button onClick={() => setActivePanel('settings')} title="Add board"><Plus size={17} className="text-slate-300" /></button>
            </div>
            <label className="relative block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={boardSearch}
                onChange={(event) => setBoardSearch(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-[#111d29] py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500"
                placeholder="Search boards..."
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2 text-sm">
            {[
              ['01 - General', []],
              ['02 - Architectural', []],
              ['03 - Structural', ['Level 2 Framing Plan', 'Roof Framing Plan', 'South Elevation', 'East Elevation', 'Typical Sections']],
              ['04 - MEP', []],
              ['05 - Site', []],
              ['06 - Inspections', []],
              ['Photos & Documents', ['Site Photo Set']],
            ].map(([folder, children]) => {
              const visibleChildren = (children as string[]).filter((child) => child.toLowerCase().includes(boardSearch.toLowerCase()));
              const isOpen = expandedSections[folder as string] ?? false;
              const showFolder = !boardSearch || (folder as string).toLowerCase().includes(boardSearch.toLowerCase()) || visibleChildren.length > 0;
              if (!showFolder) return null;

              return (
                <div key={folder as string} className="mb-1">
                  <button onClick={() => toggleSection(folder as string)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-slate-300 hover:bg-slate-900">
                    <ChevronRight size={14} className={isOpen ? 'rotate-90' : ''} />
                    <FileText size={14} />
                    <span className="text-xs font-semibold">{folder as string}</span>
                  </button>
                  {isOpen && visibleChildren.map((child) => (
                    <button
                      key={child}
                      onClick={() => setActiveBoard(child)}
                      className={`ml-6 mb-1 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold ${child === activeBoard ? 'bg-blue-600/45 text-blue-50' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <FileText size={13} />
                      <span className="truncate">{child}</span>
                      {child === activeBoard && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-400" />}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-white">
              <span>Layers</span>
              <Filter size={14} />
            </div>
            {['Plan Grid', 'Structural - Beams', 'Structural - Columns', 'Dimensions', 'Markups', 'Notes', 'Photos', 'Reference'].map((layer) => (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={`mb-1 flex w-full items-center justify-between rounded-md px-2 py-2 text-xs ${enabledLayers[layer] ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-900'}`}
              >
                <span className="flex items-center gap-2">
                  <span className={enabledLayers[layer] ? 'text-blue-300' : 'text-slate-600'}>{enabledLayers[layer] ? '●' : '◌'}</span>
                  {layer}
                </span>
                {layer === 'Markups' && <PenLine size={13} className={enabledLayers[layer] ? 'text-blue-400' : 'text-slate-600'} />}
              </button>
            ))}
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[36px_minmax(0,1fr)_292px] bg-[#111827]">
          <div className="flex items-center gap-1 border-b border-slate-800 bg-[#0f1722] px-3">
            <div className="flex h-full items-center gap-3 rounded-t-lg bg-white px-4 text-xs font-bold text-slate-950">
              {activeBoard}
              <button onClick={() => setActiveBoard('Level 2 Framing Plan')} title="Reset active board">
                <X size={13} className="text-slate-500" />
              </button>
            </div>
            <button onClick={() => setActivePanel('settings')} className="ml-2 text-slate-400 hover:text-white"><Plus size={17} /></button>
          </div>

          <section data-testid="plan-section" className="min-h-0 overflow-hidden bg-slate-200 p-2">
            <div data-testid="plan-viewport" className="relative mx-auto h-full overflow-auto rounded-md border border-slate-500 bg-white shadow-2xl">
              <div
                data-testid="plan-transform"
                data-plan-zoom={planZoom}
                data-plan-pan-x={planPan.x}
                data-plan-pan-y={planPan.y}
                style={{ transform: `translate(${planPan.x}px, ${planPan.y}px) scale(${planZoom})`, transformOrigin: 'top center' }}
                onWheel={(event) => {
                  if (activeTool !== 'Zoom' && activeTool !== 'Zoom Area') return;
                  event.preventDefault();
                  setPlanZoom((value) => {
                    const next = event.deltaY < 0 ? value + 0.1 : value - 0.1;
                    return Math.max(0.5, Math.min(3, Number(next.toFixed(2))));
                  });
                }}
                className={`h-full w-full ${activeTool === 'Pan' ? 'cursor-grab' : ''}`}
              >
                <FramingPlan
                  onSelect={(id) => selectMarkup(id)}
                  markups={markups}
                  selectedId={selectedId}
                  activeTool={activeTool}
                  draftGeometry={draftGeometry}
                  onPointerDown={handlePlanPointerDown}
                  onPointerMove={handlePlanPointerMove}
                  onPointerUp={handlePlanPointerUp}
                  onErase={handleEraseMarkup}
                  onResizeStart={handleResizeStart}
                  showGrid={enabledLayers['Plan Grid']}
                />
              </div>
            </div>
          </section>

          <section className="grid min-h-0 grid-cols-[0.95fr_1.05fr] gap-1 border-t border-slate-800 bg-[#071019] p-1">
            <div className="min-h-0 overflow-hidden rounded-md border border-slate-800 bg-[#0f1722]">
              <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-black uppercase tracking-wide text-slate-200">
                Items / Markup Schedule
                <Filter size={14} className="text-slate-400" />
              </div>
              <div className="max-h-[238px] overflow-auto">
                <table className="w-full min-w-[850px] text-xs">
                  <thead className="sticky top-0 bg-[#111d29] text-slate-400">
                    <tr>
                      {['ID', 'Type', 'Item Name', 'Location', 'Status', 'Condition', 'Priority', 'Discipline', 'Due Date'].map((header) => (
                        <th key={header} className="border-b border-slate-800 px-3 py-2 text-left font-bold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {markups.map((row) => (
                      <tr key={row.id} data-testid={`schedule-row-${row.id}`} onClick={() => selectMarkup(row.id)} className={`cursor-pointer border-b border-slate-800/70 hover:bg-slate-800/80 ${selectedId === row.id ? 'bg-blue-950/50' : ''}`}>
                        <td className="px-3 py-2">
                          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.id}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{row.type}</td>
                        <td className="px-3 py-2 font-bold text-white">{row.itemName}</td>
                        <td className="px-3 py-2 text-slate-300">{row.location}</td>
                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-[11px] font-bold ${lightStatusClass(row.status)}`}>{row.status}</span></td>
                        <td className="px-3 py-2 text-slate-300">{row.condition}</td>
                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-[11px] font-bold ${priorityClass(row.priority)}`}>{row.priority}</span></td>
                        <td className="px-3 py-2 text-slate-300">{row.discipline}</td>
                        <td className="px-3 py-2 text-slate-300">{row.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-800 px-3 py-2 text-xs text-slate-400">1–{markups.length} of {markups.length} items</div>
            </div>

            <div className="relative min-h-0 overflow-hidden rounded-md border border-slate-800 bg-[#0f1722]">
              <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-black uppercase tracking-wide text-slate-200">
                Relationship Map / Blueprint
                <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-400">Click nodes to inspect links</span>
              </div>
              <div className="relative h-[248px] overflow-hidden bg-slate-50">
                <svg className="absolute inset-0 h-full w-full">
                  <defs>
                    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="#e2e8f0" />
                    </pattern>
                    <marker id="relArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                    </marker>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)" />
                  {relationshipEdges.map((edge) => {
                    const from = relationshipNodes.find((node) => node.id === edge.from);
                    const to = relationshipNodes.find((node) => node.id === edge.to);
                    if (!from || !to) return null;
                    const x1 = from.x + 118;
                    const y1 = from.y + 27;
                    const x2 = to.x;
                    const y2 = to.y + 27;
                    const midX = (x1 + x2) / 2;
                    return (
                      <g key={`${edge.from}-${edge.to}`}>
                        <path d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`} fill="none" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                        <rect x={midX - 33} y={(y1 + y2) / 2 - 18} width="66" height="16" rx="8" fill="white" stroke="#cbd5e1" />
                        <text x={midX} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="9" fontWeight="800" fill="#334155">{edge.label}</text>
                      </g>
                    );
                  })}
                </svg>

                {relationshipNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedRelationshipNode(node.id)}
                    className={`absolute w-[138px] rounded-lg border px-3 py-2 text-center text-[11px] font-black shadow-md transition ${
                      nodeTheme[node.color as keyof typeof nodeTheme]
                    } ${selectedRelationshipNode === node.id ? 'ring-2 ring-slate-950 ring-offset-2' : 'hover:scale-[1.03]'}`}
                    style={{ left: node.x, top: node.y }}
                  >
                    {node.id === 'item' && <span className="absolute -top-4 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs text-white">{selected.id}</span>}
                    <span className="block leading-tight">{node.label}</span>
                    <span className={`mt-1 block truncate text-[9px] ${node.color === 'red' ? 'text-red-50' : 'opacity-70'}`}>{node.type}</span>
                  </button>
                ))}

                <div className="absolute right-3 top-3 w-56 rounded-lg border border-slate-300 bg-white/95 p-3 text-xs text-slate-700 shadow-lg backdrop-blur">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Selected Blueprint Node</div>
                  <div className="mt-1 font-black text-slate-950">{selectedRelationship.label}</div>
                  <div className="mt-1 text-slate-500">{selectedRelationship.type}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded bg-slate-100 px-2 py-1">
                      <div className="text-[9px] font-bold uppercase text-slate-400">Links</div>
                      <div className="font-black">{relationshipEdges.filter((edge) => edge.from === selectedRelationship.id || edge.to === selectedRelationship.id).length}</div>
                    </div>
                    <div className="rounded bg-slate-100 px-2 py-1">
                      <div className="text-[9px] font-bold uppercase text-slate-400">Count</div>
                      <div className="font-black">{selectedRelationship.count}</div>
                    </div>
                  </div>
                  <div className="mt-2 rounded bg-slate-100 px-2 py-1">
                    <div className="text-[9px] font-bold uppercase text-slate-400">Details</div>
                    <div className="truncate font-bold">{selectedRelationship.subtitle}</div>
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center overflow-hidden rounded-md border border-slate-300 bg-white text-xs text-slate-800 shadow">
                  <button onClick={() => setZoomLevel((value) => Math.max(50, value - 10))} className="px-3 py-2">−</button>
                  <span className="border-x border-slate-300 px-3 py-2 font-bold">{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel((value) => Math.min(200, value + 10))} className="px-3 py-2">+</button>
                  <button className="border-l border-slate-300 px-3 py-2"><Maximize2 size={13} /></button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className={`${showPhotosPanel ? 'flex' : 'hidden'} min-h-0 flex-col border-l border-slate-800 bg-[#0b1620]`}>
          <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
            <h2 className="text-sm font-black uppercase tracking-wide">Site Photos</h2>
            <div className="flex items-center gap-2 text-slate-400">
              <button onClick={() => setSelectedRelationshipNode('photos')} title="Filter linked photos"><Filter size={14} /></button>
              <button onClick={() => setShowPhotosPanel(false)} title="Collapse photos panel"><X size={14} /></button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {photos.slice(0, 3).map((photo) => (
              <button
                key={photo.id}
                onClick={() => {
                  selectMarkup(photo.itemId ?? (photo.id <= 3 ? photo.id : 1), 'photos');
                  setActivePhotoId(photo.id);
                }}
                className={`mb-3 w-full overflow-hidden rounded-md border text-left shadow ${activePhoto?.id === photo.id ? 'border-blue-500 bg-blue-950/40' : 'border-slate-800 bg-[#111d29]'}`}
              >
                <div className="relative h-[135px] overflow-hidden">
                  <PhotoSvg photo={photo} />
                  <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-black text-white shadow" style={{ backgroundColor: photo.color }}>{photo.id}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2 p-3 text-xs">
                  <div>
                    <div className="font-bold text-white">{photo.fileName}</div>
                    <div className="mt-1 text-slate-400">{photo.date}</div>
                  </div>
                  <div className="self-end text-right text-slate-300">{photo.grid}</div>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedRelationshipNode('photos');
                setShowAllPhotos(true);
              }}
              data-testid="view-all-photos"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800"
            >
              View all photos ({photos.length})
            </button>
          </div>
        </aside>

        <aside className={`${showInspectorPanel ? 'flex' : 'hidden'} min-h-0 flex-col border-l border-slate-800 bg-[#0b1620]`}>
          <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
            <h2 className="text-sm font-black uppercase tracking-wide">Inspector</h2>
            <button onClick={() => setShowInspectorPanel(false)}><X size={14} className="text-slate-400" /></button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <section className="border-b border-slate-800 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-black text-white shadow" style={{ backgroundColor: selected.color }}>{selected.id}</span>
                  <div>
                    <h2 data-testid="inspector-title" className="text-lg font-black text-white">{selected.type} {selected.itemName}</h2>
                  </div>
                </div>
                <button
                  onClick={() => updateSelectedMarkup({ status: selected.status === 'Field Verify' ? 'Monitor' : selected.status === 'Monitor' ? 'Complete' : 'Field Verify' })}
                  className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(selected.status)}`}
                  title="Click to cycle status"
                >
                  {selected.status}<ChevronDown size={12} className="ml-1 inline" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ['Item Name', `${selected.type} ${selected.itemName}`],
                  ['Type', selected.type === 'Beam' ? 'Steel Beam' : selected.type],
                  ['Status', selected.status],
                  ['Section', selected.section],
                  ['Location', selected.location],
                  ['Elevation', '+14&apos;-0&quot; (T.O.S.)'],
                  ['Condition', selected.condition],
                  ['Priority', selected.priority],
                  ['Discipline', selected.discipline],
                  ['Created By', 'A. Morgan'],
                  ['Date', 'May 12, 2025'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[112px_1fr] items-center gap-2">
                    <div className="text-xs font-medium text-slate-400">{label}</div>
                    <div className="font-semibold text-slate-100">
                      {label === 'Status' ? (
                        <button
                          onClick={() => updateSelectedMarkup({ status: selected.status === 'Field Verify' ? 'Monitor' : selected.status === 'Monitor' ? 'Complete' : 'Field Verify' })}
                          className={`rounded px-2 py-1 text-[11px] font-bold ${lightStatusClass(selected.status)}`}
                          title="Click to cycle status"
                        >
                          {value}
                        </button>
                      ) : label === 'Priority' ? (
                        <button
                          onClick={() => updateSelectedMarkup({ priority: selected.priority === 'High' ? 'Medium' : selected.priority === 'Medium' ? 'Low' : 'High' })}
                          className={`rounded px-2 py-1 text-[11px] font-bold ${priorityClass(value as Priority)}`}
                          title="Click to cycle priority"
                        >
                          {value}
                        </button>
                      ) : label === 'Condition' ? (
                        <button
                          onClick={() => {
                            const nextCondition = window.prompt('Update condition', selected.condition);
                            if (nextCondition?.trim()) updateSelectedMarkup({ condition: nextCondition.trim(), notes: nextCondition.trim() });
                          }}
                          className="text-left font-semibold text-slate-100 underline decoration-slate-600 underline-offset-4 hover:text-white"
                          title="Click to edit condition"
                        >
                          {value}
                        </button>
                      ) : (
                        value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-slate-800 p-3">
              {[
                ['Linked Photos', linkedPhotos.length],
                ['Linked Documents', selectedDocuments.length],
                ['Board Markups', relatedMarkupCount],
                ['Linked Costs', linkedCostAmount ? 1 : 0],
              ].map(([label, count]) => (
                <button key={label} onClick={() => selectLinkedCategory(label as string)} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900">
                  <span className="flex items-center gap-2"><FileText size={14} className="text-slate-400" />{label}</span>
                  <span className="flex items-center gap-2 font-bold">{count}<ChevronRight size={14} /></span>
                </button>
              ))}
            </section>

            <section className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Linked Photos ({linkedPhotos.length})</h3>
                <button onClick={() => setActivePanel('photoPicker')}><Plus size={15} /></button>
              </div>
              <div className="space-y-2">
                {linkedPhotos.slice(0, 2).map((photo) => (
                  <div key={photo.id} className="grid grid-cols-[86px_1fr] gap-3 rounded-md border border-slate-800 bg-[#111d29] p-2">
                    <div className="relative h-16 overflow-hidden rounded"><PhotoSvg photo={photo} /></div>
                    <div className="min-w-0 text-xs">
                      <div className="truncate font-bold text-white">{photo.fileName}</div>
                      <div className="mt-1 text-slate-400">{photo.date}</div>
                      <div className="text-slate-400">{photo.grid}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Notes</h3>
                <button
                  onClick={() => {
                    const nextNote = window.prompt('Update note', selected.notes);
                    if (nextNote?.trim()) updateSelectedMarkup({ notes: nextNote.trim() });
                  }}
                  title="Edit note"
                >
                  <PenLine size={14} className="text-slate-400" />
                </button>
              </div>
              <button
                onClick={() => {
                  const nextNote = window.prompt('Update note', selected.notes);
                  if (nextNote?.trim()) updateSelectedMarkup({ notes: nextNote.trim() });
                }}
                className="text-left text-sm leading-relaxed text-slate-200 hover:text-white"
                title="Click to edit note"
              >
                {selected.notes}
              </button>
              <div className="mt-4 text-xs text-slate-500">A. Morgan, May 12, 2025 9:15 AM</div>
            </section>

            <section className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Comments ({selectedComments.length})</h3>
                <MessageSquare size={14} className="text-slate-400" />
              </div>
              <div className="space-y-2">
                {selectedComments.slice(0, 3).map((comment) => (
                  <div key={comment.id} className={`rounded-md border p-2 text-xs ${comment.resolved ? 'border-green-800 bg-green-950/30' : 'border-slate-800 bg-slate-900'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{comment.author}</span>
                      <button onClick={() => resolveComment(comment.id)} className="text-[10px] font-bold text-slate-400 hover:text-white">{comment.resolved ? 'Resolved' : 'Open'}</button>
                    </div>
                    <p className="mt-1 text-slate-300">{comment.body}</p>
                    <div className="mt-1 text-[10px] text-slate-500">{comment.createdAt}</div>
                  </div>
                ))}
              </div>
              <textarea value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder={role === 'Client' ? 'Add client comment...' : 'Add engineering note or reply...'} className="mt-3 min-h-16 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500" />
              <button onClick={addComment} className="mt-2 w-full rounded-md bg-slate-100 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-white">Add Comment</button>
            </section>

            <section className="p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Issue Details</h3><ChevronDown size={14} /></div>
              <div className="space-y-3 text-sm">
                {[
                  ['Issue Type', selected.condition.includes('Corrosion') ? 'Corrosion' : 'Section Loss'],
                  ['Severity', selected.priority === 'High' ? 'Severe' : 'Moderate'],
                  ['Recommendation', selected.priority === 'Low' ? 'Monitor' : 'Repair'],
                  ['Recommended Action', selected.priority === 'Low' ? 'Monitor during next inspection' : 'Grind, repair, prime and repaint'],
                  ['Due Date', selected.dueDate],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[125px_1fr] gap-2">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="font-semibold text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      {showAllPhotos && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="max-h-[86vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1620] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-400">Photo Library</div>
                <h2 data-testid="photo-library-title" className="mt-1 text-xl font-black text-white">All Site Photos</h2>
              </div>
              <button data-testid="close-photo-library" onClick={() => setShowAllPhotos(false)} className="rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    selectMarkup(photo.itemId ?? 1, 'photos');
                    setActivePhotoId(photo.id);
                    setShowAllPhotos(false);
                  }}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-left shadow hover:border-blue-500"
                >
                  <div className="relative h-40">
                    <PhotoSvg photo={photo} />
                    <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-black text-white shadow" style={{ backgroundColor: photo.color }}>{photo.id}</span>
                  </div>
                  <div className="p-3 text-xs">
                    <div className="font-bold text-white">{photo.fileName}</div>
                    <div className="mt-1 text-slate-400">{photo.caption}</div>
                    <div className="mt-1 text-slate-500">{photo.grid} - {photo.date}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activePanel !== 'none' && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1620] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {activePanel === 'report' ? 'Report Builder' : activePanel === 'export' ? 'Export Package' : activePanel === 'color' ? 'Color Palette' : activePanel === 'photoPicker' ? 'Add Photo' : activePanel === 'note' ? 'Add Note' : activePanel === 'file' ? 'Attach File' : 'Workspace Settings'}
                </div>
                <h2 data-testid="active-panel-title" className="mt-1 text-xl font-black text-white">
                  {activePanel === 'report' ? 'Generate structural inspection report' : activePanel === 'export' ? 'Export project deliverables' : activePanel === 'color' ? 'Choose markup color' : activePanel === 'photoPicker' ? 'Add or choose site photo' : activePanel === 'note' ? 'Add note to selected item' : activePanel === 'file' ? 'Attach document to selected item' : 'Workspace settings'}
                </h2>
              </div>
              <button data-testid="close-active-panel" onClick={() => setActivePanel('none')} className="rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white"><X size={18} /></button>
            </div>

            <div className="p-5">
              {activePanel === 'report' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Create a report using selected items, photos, comments, issue details, and the markup schedule.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => exportData('word')} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white">Export Word Draft</button>
                    <button onClick={() => exportData('pdf')} className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950">Export PDF Text Draft</button>
                  </div>
                </div>
              )}

              {activePanel === 'export' && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => exportData('pdf')} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-white">Annotated PDF Package</button>
                  <button onClick={() => exportData('word')} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-white">Editable Word Report</button>
                  <button onClick={() => exportData('csv')} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-white">Issue Schedule CSV</button>
                  <button onClick={() => showToast('ZIP export queued for production backend.')} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-white">Full Package ZIP</button>
                </div>
              )}

              {activePanel === 'color' && (
                <div className="grid grid-cols-5 gap-3">
                  {['#ef4444', '#2563eb', '#16a34a', '#eab308', '#8b5cf6', '#0ea5e9', '#f97316', '#ec4899', '#111827', '#ffffff'].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        updateSelectedMarkup({ color });
                        setActivePanel('none');
                      }}
                      className="h-14 rounded-xl border border-slate-700 shadow"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              {activePanel === 'photoPicker' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
                    <div className="font-bold text-white">Upload placeholder</div>
                    <p className="mt-1">In the Supabase version this becomes a real upload into a site-visit folder. For now, enter a file name or choose an existing photo below.</p>
                    <input
                      value={uploadedPhotoName}
                      onChange={(event) => setUploadedPhotoName(event.target.value)}
                      placeholder="Example: FIELD_B18_CLOSEUP.jpg"
                      className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                    />
                    <button
                      onClick={() => {
                        if (uploadedPhotoName.trim()) {
                          attachFakePhoto();
                          setUploadedPhotoName('');
                          setActivePanel('none');
                        }
                      }}
                      className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Add Photo To Selected Item
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => {
                          if (!requireEngineer('link photos')) return;
                          applyMarkups((current) => current.map((item) => item.id === selected.id ? { ...item, photoIds: Array.from(new Set([...item.photoIds, photo.id])) } : item));
                          setActivePhotoId(photo.id);
                          setActivePanel('none');
                          showToast('Existing photo linked.');
                        }}
                        className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 text-left"
                      >
                        <div className="h-24"><PhotoSvg photo={photo} /></div>
                        <div className="p-2 text-xs text-slate-300">{photo.fileName}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'note' && (
                <div className="space-y-3">
                  <textarea
                    defaultValue={selected.notes}
                    id="note-panel-textarea"
                    className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                  <button
                    onClick={() => {
                      const value = (document.getElementById('note-panel-textarea') as HTMLTextAreaElement | null)?.value;
                      if (value?.trim()) updateSelectedMarkup({ notes: value.trim() });
                      setActivePanel('none');
                    }}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                  >
                    Save Note
                  </button>
                </div>
              )}

              {activePanel === 'file' && (
                <div className="space-y-3 text-sm text-slate-300">
                  <p>Attach a document reference to the selected item. Real file upload will use Supabase Storage.</p>
                  <button onClick={() => { attachFakeDocument(); setActivePanel('none'); }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white">
                    Attach Demo File
                  </button>
                </div>
              )}

              {activePanel === 'settings' && (
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="font-bold text-white">Current role</div>
                    <p className="mt-1">Engineer can edit everything. Client can comment only.</p>
                    <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="mt-3 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                      <option>Engineer</option>
                      <option>Client</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={attachFakePhoto} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white">Attach Demo Photo</button>
                    <button onClick={attachFakeDocument} className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-950">Attach Demo Document</button>
                    <button onClick={resetDemoData} className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm font-bold text-red-100">Reset Demo Data</button>
                    <button onClick={() => setActivePanel('none')} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-white">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="absolute bottom-12 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-slate-700 bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-2xl">
          {toastMessage}
        </div>
      )}

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-[#0b1520] px-4 text-xs text-slate-400">
        <span data-testid="status-message" data-active-tool={activeTool}>{statusMessage}</span>
        <span className="hidden lg:inline">X: 152&apos;-3 1/2&quot; &nbsp;&nbsp; Y: 47&apos;-6 3/4&quot; &nbsp;&nbsp; | &nbsp;&nbsp; Plan: {Math.round(planZoom * 100)}% / Map: {zoomLevel}% &nbsp;&nbsp; | &nbsp;&nbsp; Grid: 1&apos;-0&quot; &nbsp;&nbsp; <span className="text-green-400">● Online</span></span>
      </footer>
    </div>
  );
};
