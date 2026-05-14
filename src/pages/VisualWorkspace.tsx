import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  MousePointer2, Hand, ZoomIn, Maximize2, Crosshair,
  ArrowUpRight, Cloud, Type, Square, Circle, MessageSquare, StickyNote,
  PenLine, Highlighter, Eraser, Ruler, Minus, TrendingUp, Hexagon,
  Link, Camera, FileText, Spline,
  Layers, LayoutGrid, Magnet,
  Undo2, Redo2, MoreHorizontal,
  ChevronRight, ChevronDown, Plus, X,
  Eye, EyeOff, Trash2, Upload,
  Filter, RefreshCw, ChevronLeft,
  Tag, Stamp, Hash, Minimize2, Search, Download,
  Home, Frame, Wind, Database, Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { getActiveProjectId } from '../utils/projectDocuments';
import type { RelationshipGraph } from '../components/RelationshipMap';
import { RelationshipMap } from '../components/RelationshipMap';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tool =
  | 'select' | 'pan' | 'zoom' | 'fit' | 'zoom-area'
  | 'arrow' | 'cloud' | 'text' | 'box' | 'ellipse' | 'callout'
  | 'dimension' | 'distance' | 'angle' | 'area' | 'count'
  | 'note' | 'photo' | 'file' | 'link' | 'stamps'
  | 'highlighter' | 'pen' | 'polyline' | 'eraser' | 'color'
  | 'layers' | 'scale' | 'grid' | 'snap'
  | 'undo' | 'redo' | 'more';

type MarkupType =
  | 'arrow' | 'cloud' | 'text' | 'box' | 'ellipse' | 'callout'
  | 'pen' | 'highlighter' | 'polyline' | 'dimension' | 'distance'
  | 'angle' | 'area' | 'image' | 'count';

type Priority = 'high' | 'medium' | 'low';
type MarkupStatus = 'field-verify' | 'monitor' | 'complete' | 'open';
type HandlePos = 'tl' | 'tr' | 'bl' | 'br';

interface Pt { x: number; y: number }

interface Markup {
  id: string;
  type: MarkupType;
  number: number;
  points: Pt[];
  text: string;
  color: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily?: string;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
  rotation?: number;
  fillColor?: string;
  opacity: number;
  priority: Priority;
  status: MarkupStatus;
  layerId: string;
  createdAt: string;
  imageData?: string;
  comments?: { id: string; text: string; author: string; createdAt: string }[];
  linkedPhotoIds?: string[];
  linkedDocIds?:   string[];
}

interface Layer { id: string; name: string; visible: boolean }
interface BoardItem { id: string; name: string; parentId: string | null }
interface SitePhoto { id: string; name: string; data: string; createdAt: string }
interface AttachedDoc { id: string; name: string; type: string; createdAt: string }

type ActivePanel =
  | 'color' | 'photo' | 'file' | 'note' | 'scale'
  | 'report' | 'export' | 'photo-library' | 'link' | 'stamps' | 'compare' | 'review' | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _ctr = 100;
const genId = () => `m_${++_ctr}`;

// Ensure any markup loaded from localStorage (possibly from an older schema) has all fields
function normalizeMarkup(raw: Record<string, unknown>): Markup {
  return {
    id:          String(raw.id ?? genId()),
    type:        (raw.type as MarkupType) ?? 'box',
    number:      Number(raw.number ?? 0),
    points:      (raw.points as Pt[]) ?? [],
    text:        String(raw.text ?? ''),
    color:       String(raw.color ?? '#ef4444'),
    strokeWidth: Number(raw.strokeWidth ?? 2),
    fontSize:    Number(raw.fontSize ?? 14),
    fontFamily:  String(raw.fontFamily ?? 'sans-serif'),
    dashStyle:   (raw.dashStyle as 'solid'|'dashed'|'dotted') ?? 'solid',
    rotation:    Number(raw.rotation ?? 0),
    fillColor:   raw.fillColor as string | undefined,
    opacity:     Number(raw.opacity ?? 1),
    priority:    (raw.priority as Priority) ?? 'medium',
    status:      (raw.status as MarkupStatus) ?? 'open',
    layerId:     String(raw.layerId ?? 'l1'),
    createdAt:   String(raw.createdAt ?? new Date().toISOString()),
    imageData:   raw.imageData as string | undefined,
    comments:    (raw.comments as Markup['comments']) ?? [],
    linkedPhotoIds: (raw.linkedPhotoIds as string[] | undefined) ?? [],
    linkedDocIds:   (raw.linkedDocIds   as string[] | undefined) ?? [],
  };
}

function s2c(sx: number, sy: number, pan: Pt, zoom: number): Pt {
  return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
}

function mkBounds(m: Markup) {
  if (!m.points.length) return { x: 0, y: 0, w: 0, h: 0 };
  if (m.type === 'count') {
    const r = 12;
    return { x: m.points[0].x - r, y: m.points[0].y - r, w: r * 2, h: r * 2 };
  }
  const xs = m.points.map(p => p.x), ys = m.points.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x || 1, h: Math.max(...ys) - y || 1 };
}

function cloudPath(x: number, y: number, w: number, h: number): string {
  const bW = Math.max(w, 20), bH = Math.max(h, 20);
  const nX = Math.max(3, Math.round(bW / 28)), nY = Math.max(2, Math.round(bH / 28));
  const rx = bW / nX / 2, ry = bH / nY / 2;
  let d = `M ${x} ${y}`;
  for (let i = 0; i < nX; i++) d += ` a ${rx} ${rx} 0 0 1 ${bW / nX} 0`;
  for (let i = 0; i < nY; i++) d += ` a ${ry} ${ry} 0 0 1 0 ${bH / nY}`;
  for (let i = 0; i < nX; i++) d += ` a ${rx} ${rx} 0 0 1 ${-bW / nX} 0`;
  for (let i = 0; i < nY; i++) d += ` a ${ry} ${ry} 0 0 1 0 ${-bH / nY}`;
  return d + ' Z';
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#000000','#ffffff'];

const STATUS_CFG: Record<MarkupStatus, { label: string; cls: string }> = {
  'field-verify': { label: 'Field Verify', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  'monitor':      { label: 'Monitor',      cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  'complete':     { label: 'Complete',     cls: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  'open':         { label: 'Open',         cls: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' },
};

const PRI_CFG: Record<Priority, { label: string; dot: string }> = {
  high:   { label: 'High',   dot: 'bg-red-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  low:    { label: 'Low',    dot: 'bg-slate-400' },
};

const HANDLE_CURSORS: Record<HandlePos, string> = {
  tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize',
};

const TEXT_EDITABLE: MarkupType[] = ['text', 'callout', 'box', 'cloud'];
const RESIZABLE_TYPES: MarkupType[] = ['arrow','cloud','text','box','ellipse','callout','dimension','distance','image'];

const DEFAULT_LAYERS: Layer[] = [
  { id: 'l1', name: 'Markups',    visible: true },
  { id: 'l2', name: 'Dimensions', visible: true },
  { id: 'l3', name: 'Notes',      visible: true },
  { id: 'l4', name: 'Photos',     visible: true },
  { id: 'l5', name: 'Reference',  visible: true },
];

const BOARD_TREE: BoardItem[] = [
  { id: 'cat1', name: '01 - General',         parentId: null },
  { id: 'cat2', name: '02 - Architectural',   parentId: null },
  { id: 'cat3', name: '03 - Structural',      parentId: null },
  { id: 'b1',   name: 'Level 2 Framing Plan', parentId: 'cat3' },
  { id: 'b2',   name: 'Roof Framing Plan',    parentId: 'cat3' },
  { id: 'b3',   name: 'South Elevation',      parentId: 'cat3' },
  { id: 'b4',   name: 'East Elevation',       parentId: 'cat3' },
  { id: 'b5',   name: 'Typical Sections',     parentId: 'cat3' },
  { id: 'cat4', name: '04 - MEP',             parentId: null },
  { id: 'cat5', name: '05 - Site',            parentId: null },
  { id: 'cat6', name: '06 - Inspections',     parentId: null },
  { id: 'cat7', name: 'Photos & Documents',   parentId: null },
  { id: 'b6',   name: 'Site Photo Set',       parentId: 'cat7' },
];

const SEED: Markup[] = [
  { id: 's1', type: 'cloud', number: 1, points: [{ x: 560, y: 100 }, { x: 760, y: 180 }], text: 'B12 - Corrosion at seat connection, field verify section loss.', color: '#ef4444', strokeWidth: 2, fontSize: 14, opacity: 1, priority: 'high',   status: 'field-verify', layerId: 'l1', createdAt: '2025-05-12T00:00:00Z' },
  { id: 's2', type: 'cloud', number: 2, points: [{ x: 600, y: 210 }, { x: 800, y: 290 }], text: 'B18 - Paint peeling and rust scale, check bottom flange.',      color: '#3b82f6', strokeWidth: 2, fontSize: 14, opacity: 1, priority: 'medium', status: 'field-verify', layerId: 'l1', createdAt: '2025-05-12T00:00:00Z' },
  { id: 's3', type: 'cloud', number: 3, points: [{ x: 560, y: 360 }, { x: 760, y: 440 }], text: 'B31 - Section loss at midspan, verify remaining thickness.',     color: '#22c55e', strokeWidth: 2, fontSize: 14, opacity: 1, priority: 'high',   status: 'field-verify', layerId: 'l1', createdAt: '2025-05-12T00:00:00Z' },
];

const TOOL_NAMES: Partial<Record<Tool, string>> = {
  select: 'Select', pan: 'Pan', zoom: 'Zoom', fit: 'Fit', 'zoom-area': 'Zoom Area',
  arrow: 'Arrow', cloud: 'Cloud', text: 'Text', box: 'Box', ellipse: 'Ellipse', callout: 'Callout',
  dimension: 'Dimension', distance: 'Distance', angle: 'Angle', area: 'Area', count: 'Count',
  note: 'Note', photo: 'Photo', file: 'File', link: 'Link', stamps: 'Stamps',
  highlighter: 'Highlighter', pen: 'Pen', polyline: 'Polyline', eraser: 'Eraser', color: 'Color',
  layers: 'Layers', scale: 'Scale', grid: 'Grid', snap: 'Snap',
  undo: 'Undo', redo: 'Redo', more: 'More',
};

interface StampDef { label: string; type: MarkupType; w: number; h: number; color: string; text: string; status: MarkupStatus; priority: Priority }
const STAMPS: StampDef[] = [
  { label: 'Field Verify',    type: 'cloud',   w: 180, h: 60,  color: '#ef4444', text: 'FIELD VERIFY',    status: 'field-verify', priority: 'high'   },
  { label: 'Monitor',         type: 'cloud',   w: 160, h: 60,  color: '#f97316', text: 'MONITOR',         status: 'monitor',      priority: 'medium' },
  { label: 'Revision Cloud',  type: 'cloud',   w: 200, h: 80,  color: '#3b82f6', text: '',                status: 'open',         priority: 'low'    },
  { label: 'NTS Box',         type: 'box',     w: 120, h: 40,  color: '#eab308', text: 'NTS',             status: 'open',         priority: 'low'    },
  { label: 'Hold',            type: 'box',     w: 100, h: 40,  color: '#8b5cf6', text: 'HOLD',            status: 'open',         priority: 'high'   },
  { label: 'Section Loss',    type: 'callout', w: 160, h: 50,  color: '#ef4444', text: 'Section Loss',    status: 'field-verify', priority: 'high'   },
  { label: 'Corrosion',       type: 'callout', w: 160, h: 50,  color: '#f97316', text: 'Corrosion',       status: 'field-verify', priority: 'medium' },
  { label: 'Crack',           type: 'callout', w: 140, h: 50,  color: '#ef4444', text: 'Crack',           status: 'field-verify', priority: 'high'   },
  { label: 'Repair Required', type: 'box',     w: 160, h: 40,  color: '#22c55e', text: 'REPAIR REQUIRED', status: 'complete',     priority: 'medium' },
  { label: 'Approved',        type: 'box',     w: 120, h: 40,  color: '#22c55e', text: 'APPROVED',        status: 'complete',     priority: 'low'    },
  { label: 'Leader Note',     type: 'callout', w: 160, h: 50,  color: '#3b82f6', text: 'Note',            status: 'open',         priority: 'low'    },
  { label: 'Highlight Area',  type: 'box',     w: 180, h: 80,  color: '#eab308', text: '',                status: 'open',         priority: 'low'    },
];

// ─── Toolbar button ───────────────────────────────────────────────────────────

function TB({ tid, active, onClick, icon, label, toggle }: {
  tid: string; active?: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; toggle?: boolean;
}) {
  return (
    <button data-testid={tid} onClick={onClick} title={label}
      className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded text-[10px] transition-colors min-w-[40px] ${
        active || toggle ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}>
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}
function Sep() { return <div className="w-px h-9 bg-slate-700 mx-0.5 self-center shrink-0" />; }

// ─── Report / export helpers ─────────────────────────────────────────────────

function generateMarkupReport(markups: Markup[], projectId: string | null): void {
  const today = new Date().toLocaleDateString();
  const counts = { high: 0, medium: 0, low: 0 };
  markups.forEach(m => counts[m.priority]++);
  const statusGroups: Record<string, Markup[]> = {};
  markups.forEach(m => { (statusGroups[m.status] ??= []).push(m); });
  const rows = markups.map(m => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:6px 10px;font-weight:600;color:${m.color}">${m.number}</td>
      <td style="padding:6px 10px;text-transform:capitalize">${m.type}</td>
      <td style="padding:6px 10px">${m.text || '—'}</td>
      <td style="padding:6px 10px;text-transform:capitalize">${m.status.replace('-',' ')}</td>
      <td style="padding:6px 10px;text-transform:capitalize">${m.priority}</td>
      <td style="padding:6px 10px;color:#64748b">${new Date(m.createdAt).toLocaleDateString()}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Inspection Report — ${today}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#1e293b;background:#fff}
      h1{font-size:22px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px;color:#1e293b;border-bottom:2px solid #3b82f6;padding-bottom:4px}
      .meta{color:#64748b;font-size:13px;margin-bottom:24px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
      .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
      .stat .n{font-size:28px;font-weight:700;color:#3b82f6}.stat .l{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
      table{width:100%;border-collapse:collapse;font-size:13px}
      thead tr{background:#f1f5f9}th{padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
      @media print{button{display:none}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div><h1>Structural Inspection Report</h1><div class="meta">Project: ${projectId ?? 'Default'} &nbsp;·&nbsp; Date: ${today} &nbsp;·&nbsp; Markups: ${markups.length}</div></div>
      <button onclick="window.print()" style="padding:8px 18px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">Print / Save PDF</button>
    </div>
    <div class="stats">
      <div class="stat"><div class="n">${markups.length}</div><div class="l">Total Markups</div></div>
      <div class="stat"><div class="n" style="color:#ef4444">${counts.high}</div><div class="l">High Priority</div></div>
      <div class="stat"><div class="n" style="color:#f97316">${counts.medium}</div><div class="l">Medium Priority</div></div>
      <div class="stat"><div class="n" style="color:#22c55e">${(statusGroups['complete'] ?? []).length}</div><div class="l">Complete</div></div>
    </div>
    <h2>Markup Schedule</h2>
    <table><thead><tr><th>#</th><th>Type</th><th>Label</th><th>Status</th><th>Priority</th><th>Created</th></tr></thead>
    <tbody>${rows}</tbody></table>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

function exportMarkupsCsv(markups: Markup[]): void {
  const header = ['#', 'Type', 'Label', 'Status', 'Priority', 'Layer', 'Created'];
  const rows = markups.map(m => [
    m.number, m.type, `"${m.text.replace(/"/g, '""')}"`, m.status, m.priority, m.layerId,
    new Date(m.createdAt).toLocaleDateString(),
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `markups-${Date.now()}.csv`;
  a.click();
}

// ─── Relationship graph seed data ────────────────────────────────────────────

const SEED_GRAPH: RelationshipGraph = {
  nodes: [
    { id: 'rn1', type: 'markup',     label: 'Markup #1',         subtitle: 'Spalled concrete',  x: 60,  y: 80  },
    { id: 'rn2', type: 'member',     label: 'Beam B-12',         subtitle: 'W18×55 steel',      x: 280, y: 40  },
    { id: 'rn3', type: 'finding',    label: 'Section Loss',      subtitle: '~15% web loss',     x: 280, y: 130 },
    { id: 'rn4', type: 'inspection', label: 'Site Inspection',   subtitle: '2024-11-08',        x: 500, y: 20  },
    { id: 'rn5', type: 'cost',       label: 'Cost Estimate',     subtitle: '$12,400',           x: 500, y: 100 },
    { id: 'rn6', type: 'action',     label: 'Repair Order',      subtitle: 'Priority: High',    x: 500, y: 180 },
    { id: 'rn7', type: 'document',   label: 'Inspection Report', subtitle: 'PDF • 8 pages',     x: 720, y: 60  },
  ],
  edges: [
    { id: 're1', from: 'rn1', to: 'rn2' },
    { id: 're2', from: 'rn1', to: 'rn3' },
    { id: 're3', from: 'rn2', to: 'rn4' },
    { id: 're4', from: 'rn3', to: 'rn5' },
    { id: 're5', from: 'rn3', to: 'rn6' },
    { id: 're6', from: 'rn4', to: 'rn7' },
    { id: 're7', from: 'rn5', to: 'rn7' },
  ],
};

// ─── Main component ───────────────────────────────────────────────────────────

export function VisualWorkspace() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Viewport (ref + state pair so event handlers always see latest value)
  const [pan,  setPanState]  = useState<Pt>({ x: 0, y: 0 });
  const [zoom, setZoomState] = useState(1);
  const panRef  = useRef<Pt>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const setPan  = useCallback((p: Pt)  => { panRef.current  = p; setPanState(p);  }, []);
  const setZoom = useCallback((z: number) => { zoomRef.current = z; setZoomState(z); }, []);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });

  // Background image
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgSize,  setBgSize]  = useState({ w: 1200, h: 900 });

  // Active tool (ref + state)
  const [tool, setToolState] = useState<Tool>('select');
  const toolRef = useRef<Tool>('select');
  const setTool = useCallback((t: Tool) => { toolRef.current = t; setToolState(t); }, []);

  // Colour (ref + state so drawing handlers see latest)
  const [color, setColor] = useState('#ef4444');
  const colorRef = useRef('#ef4444');
  useEffect(() => { colorRef.current = color; }, [color]);

  // Feature 17: Track fullscreen state
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // View toggles
  const [showGrid,     setShowGrid]     = useState(false);
  const [snapEnabled,  setSnapEnabled]  = useState(false);
  const [showLayers,   setShowLayers]   = useState(true);
  const [showInspector,setShowInspector]= useState(true);
  const [activePanel,  setActivePanel]  = useState<ActivePanel>(null);
  const [scaleSet,     setScaleSet]     = useState(false);
  const [polylineMenu, setPolylineMenu] = useState<{x: number; y: number} | null>(null);

  // Feature 1: Zoom editable input
  const [zoomInputStr,    setZoomInputStr]    = useState('');
  const [zoomInputActive, setZoomInputActive] = useState(false);

  // Feature 2: Context toolbar
  const [ctxFontFamily, setCtxFontFamily] = useState('sans-serif');
  const [ctxFontSize,   setCtxFontSize]   = useState(14);
  const [ctxStrokeWidth,setCtxStrokeWidth]= useState(2);
  const [ctxDashStyle,  setCtxDashStyle]  = useState<'solid'|'dashed'|'dotted'>('solid');
  const ctxStrokeWidthRef = useRef(2);
  const ctxFontFamilyRef  = useRef('sans-serif');
  const ctxFontSizeRef    = useRef(14);

  // Feature 3: Cursor coordinates
  const [cursorPt, setCursorPt] = useState<Pt | null>(null);

  // Feature 4: Calibration
  const [calibMode,      setCalibModeState] = useState<'idle'|'pick1'|'pick2'|'dialog'>('idle');
  const calibModeRef = useRef<'idle'|'pick1'|'pick2'|'dialog'>('idle');
  const setCalibMode = useCallback((m: 'idle'|'pick1'|'pick2'|'dialog') => { calibModeRef.current = m; setCalibModeState(m); }, []);
  const [calibPts,       setCalibPts]       = useState<Pt[]>([]);
  const [calibRatio,     setCalibRatio]     = useState<number | null>(null);
  const [calibUnit,      setCalibUnit]      = useState<'ft'|'in'|'m'>('ft');
  const [calibDistInput, setCalibDistInput] = useState('');
  const calibRatioRef = useRef<number | null>(null);
  const calibUnitRef  = useRef<string>('ft');

  // Feature 5: Command bar
  const [showCmdBar, setShowCmdBar] = useState(false);
  const [cmdInput,   setCmdInput]   = useState('');
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);

  // Feature 7: Fill color (ellipse / area)
  const [fillColor, setFillColor]   = useState<string>('transparent');
  const fillColorRef = useRef<string>('transparent');

  // ctxDashStyle ref (needed in onPointerUp callback)
  const ctxDashStyleRef = useRef<'solid'|'dashed'|'dotted'>('solid');

  // Feature 6: Rotation
  const isRotating        = useRef(false);
  const rotateCenter      = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotateStartAngle  = useRef(0);
  const rotateOriginRot   = useRef(0);

  // Feature 8: Polyline point accumulator
  const polylinePtsRef = useRef<{ x: number; y: number }[]>([]);

  // Feature 9: Angle point accumulator
  const anglePtsRef = useRef<{ x: number; y: number }[]>([]);

  // Feature 10: Area polygon accumulator
  const areaPtsRef = useRef<{ x: number; y: number }[]>([]);

  // Feature 12: Clipboard
  const [clipboard, setClipboard] = useState<Markup[]>([]);
  const clipboardRef = useRef<Markup[]>([]);

  // Sync refs to state so drawing callbacks always see latest values
  useEffect(() => { ctxStrokeWidthRef.current = ctxStrokeWidth; }, [ctxStrokeWidth]);
  useEffect(() => { ctxFontFamilyRef.current  = ctxFontFamily;  }, [ctxFontFamily]);
  useEffect(() => { ctxFontSizeRef.current    = ctxFontSize;    }, [ctxFontSize]);
  useEffect(() => { ctxDashStyleRef.current   = ctxDashStyle;   }, [ctxDashStyle]);
  useEffect(() => { calibRatioRef.current     = calibRatio;     }, [calibRatio]);
  useEffect(() => { calibUnitRef.current      = calibUnit;      }, [calibUnit]);
  useEffect(() => { fillColorRef.current      = fillColor;      }, [fillColor]);
  useEffect(() => { clipboardRef.current      = clipboard;      }, [clipboard]);

  // Feature 14: Comment input
  const [commentInput, setCommentInput] = useState('');

  // Feature 15: PDF page navigation
  const pdfDocRef     = useRef<unknown>(null);
  const [pdfPageNum,    setPdfPageNum]    = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(1);

  // Feature 16: PDF thumbnail strip
  const [pdfThumbnails, setPdfThumbnails] = useState<string[]>([]);
  const [showPdfPages,  setShowPdfPages]  = useState(true);

  // Feature 17: Fullscreen
  const workspaceRef  = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Feature 18: Compare / overlay
  const compareInputRef = useRef<HTMLInputElement>(null);
  const [compareImage,   setCompareImage]   = useState<string | null>(null);
  const [compareOpacity, setCompareOpacity] = useState(0.5);
  const [showCompare,    setShowCompare]    = useState(true);

  // Feature 19: Schedule search
  const [scheduleSearch,     setScheduleSearch]     = useState('');
  const [showScheduleSearch, setShowScheduleSearch] = useState(false);

  // Relationship graphs (one per board)
  const [boardGraphs, setBoardGraphs] = useState<Record<string, RelationshipGraph>>({ b1: SEED_GRAPH });

  // Board management (mutable board tree)
  const [boardTree,      setBoardTree]      = useState<BoardItem[]>(BOARD_TREE);
  const [showAddBoard,   setShowAddBoard]   = useState(false);
  const [newBoardName,   setNewBoardName]   = useState('');
  const [newBoardParent, setNewBoardParent] = useState('cat3');

  // Layer management
  const [renamingLayerId,  setRenamingLayerId]  = useState<string | null>(null);
  const [renameLayerText,  setRenameLayerText]  = useState('');

  // More menu
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Site photos library
  const [sitePhotos,         setSitePhotos]         = useState<SitePhoto[]>([]);
  const photoLibInputRef   = useRef<HTMLInputElement>(null);
  // Attached documents library
  const [attachedDocs,       setAttachedDocs]       = useState<AttachedDoc[]>([
    { id: 'd1', name: 'Steel Design Report', type: 'calculation', createdAt: new Date().toISOString() },
    { id: 'd2', name: 'Wind Load Summary',   type: 'report',      createdAt: new Date().toISOString() },
    { id: 'd3', name: 'Foundation Report',   type: 'report',      createdAt: new Date().toISOString() },
  ]);
  const [newDocName,         setNewDocName]         = useState('');
  // Grid spacing
  const [gridSpacing,        setGridSpacing]        = useState(50);
  // Photo filter (filter site photos panel to linked-only)
  const [photoFilterLinked,  setPhotoFilterLinked]  = useState(false);

  // Boards
  const [activeBoardId, setActiveBoardId] = useState('b1');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['cat3', 'cat7']));

  // Layers
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);

  // Markups
  const [boardMarkups, setBoardMarkups] = useState<Record<string, Markup[]>>({ b1: SEED });
  // Multi-select: selectedIds is the full set; selectedId is the primary (last clicked) for inspector
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [counter,      setCounter]      = useState(SEED.length + 1);

  // In-place text editing
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // History
  const hist = useRef<{ snaps: Record<string, Markup[]>[]; idx: number }>({
    snaps: [{ b1: SEED }], idx: 0,
  });
  const [, setHistIdx] = useState(0);

  // Drawing refs
  const isDrawing       = useRef(false);
  const drawStart       = useRef<Pt | null>(null);
  const drawCurrent     = useRef<Pt | null>(null);
  const penPts          = useRef<Pt[]>([]);
  const isPanning       = useRef(false);
  const panStart        = useRef<Pt | null>(null);
  const panOrigin       = useRef<Pt | null>(null);
  const moveOrigin      = useRef<Pt | null>(null);
  const moveMarkupPts   = useRef<Pt[] | null>(null);
  // For multi-select move: map of id → original points
  const moveAllPtsMap   = useRef<Record<string, Pt[]> | null>(null);

  // Resize refs
  const resizingHandle  = useRef<HandlePos | null>(null);
  const resizeStartPt   = useRef<Pt | null>(null);
  const resizeOriginPts = useRef<Pt[] | null>(null);

  const [preview, setPreview] = useState<{ type: string; start: Pt; cur: Pt; pts?: Pt[] } | null>(null);

  const markups        = boardMarkups[activeBoardId] ?? [];
  const selectedMarkup = markups.find(m => m.id === selectedId) ?? null;

  // ── Persistence: save/load markups per project in localStorage ────────────
  const projectId   = getActiveProjectId();
  const MARKUP_KEY  = `vw.markups.${projectId || 'default'}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MARKUP_KEY);
      if (saved) {
        const raw = JSON.parse(saved) as Record<string, Record<string, unknown>[]>;
        const normalized: Record<string, Markup[]> = {};
        for (const [boardId, list] of Object.entries(raw)) {
          normalized[boardId] = list.map(normalizeMarkup);
        }
        setBoardMarkups(normalized);
        hist.current = { snaps: [normalized], idx: 0 };
        const maxNum = Object.values(normalized).flat().reduce((max, m) => Math.max(max, m.number), 0);
        if (maxNum >= SEED.length) setCounter(maxNum + 1);
      }
    } catch { /* ignore corrupt data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MARKUP_KEY]);

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(MARKUP_KEY, JSON.stringify(boardMarkups)); } catch { /* storage full */ }
    }, 400);
    return () => clearTimeout(t);
  }, [boardMarkups, MARKUP_KEY]);

  // ── Persistence: relationship graphs ─────────────────────────────────────
  const GRAPH_KEY = `vw.graphs.${projectId || 'default'}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GRAPH_KEY);
      if (saved) setBoardGraphs(JSON.parse(saved));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GRAPH_KEY]);
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(GRAPH_KEY, JSON.stringify(boardGraphs)); } catch { /* storage full */ }
    }, 400);
    return () => clearTimeout(t);
  }, [boardGraphs, GRAPH_KEY]);

  const PHOTOS_KEY = `vw.photos.${projectId || 'default'}`;
  const DOCS_KEY   = `vw.docs.${projectId || 'default'}`;
  useEffect(() => {
    try { const s = localStorage.getItem(PHOTOS_KEY); if (s) setSitePhotos(JSON.parse(s)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PHOTOS_KEY]);
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(PHOTOS_KEY, JSON.stringify(sitePhotos)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [sitePhotos, PHOTOS_KEY]);
  useEffect(() => {
    try { const s = localStorage.getItem(DOCS_KEY); if (s) setAttachedDocs(JSON.parse(s)); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DOCS_KEY]);
  useEffect(() => {
    const t = setTimeout(() => { try { localStorage.setItem(DOCS_KEY, JSON.stringify(attachedDocs)); } catch {} }, 400);
    return () => clearTimeout(t);
  }, [attachedDocs, DOCS_KEY]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setCanvasSize({ w: width, h: height });
    });
    ro.observe(el);
    setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // ── History ───────────────────────────────────────────────────────────────
  const pushHistory = useCallback((snap: Record<string, Markup[]>) => {
    hist.current.snaps = [...hist.current.snaps.slice(0, hist.current.idx + 1), snap];
    hist.current.idx   = hist.current.snaps.length - 1;
    setHistIdx(hist.current.idx);
  }, []);

  const updateMarkups = useCallback((boardId: string, fn: (prev: Markup[]) => Markup[]) => {
    setBoardMarkups(prev => {
      const next = { ...prev, [boardId]: fn(prev[boardId] ?? []) };
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const clearSelection = useCallback(() => { setSelectedId(null); setSelectedIds([]); }, []);

  const undo = useCallback(() => {
    if (hist.current.idx <= 0) return;
    hist.current.idx--;
    setBoardMarkups(hist.current.snaps[hist.current.idx]);
    setHistIdx(hist.current.idx);
    clearSelection();
  }, [clearSelection]);

  const redo = useCallback(() => {
    if (hist.current.idx >= hist.current.snaps.length - 1) return;
    hist.current.idx++;
    setBoardMarkups(hist.current.snaps[hist.current.idx]);
    setHistIdx(hist.current.idx);
  }, []);

  // ── Snapping ──────────────────────────────────────────────────────────────
  const snap = useCallback((pt: Pt): Pt => {
    if (!snapEnabled) return pt;
    const g = 20;
    return { x: Math.round(pt.x / g) * g, y: Math.round(pt.y / g) * g };
  }, [snapEnabled]);

  // ── Canvas point helpers ──────────────────────────────────────────────────
  const toPt = useCallback((e: React.PointerEvent | React.MouseEvent): Pt => {
    const rect = containerRef.current!.getBoundingClientRect();
    return snap(s2c(e.clientX - rect.left, e.clientY - rect.top, panRef.current, zoomRef.current));
  }, [snap]);

  const fitView = useCallback(() => { setPan({ x: 0, y: 0 }); setZoom(1); }, [setPan, setZoom]);

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const nz = Math.min(Math.max(zoomRef.current * factor, 0.05), 10);
    setPan({
      x: sx - (sx - panRef.current.x) * (nz / zoomRef.current),
      y: sy - (sy - panRef.current.y) * (nz / zoomRef.current),
    });
    setZoom(nz);
  }, [setPan, setZoom]);

  // ── Feature 15: Render a specific PDF page to the background ─────────────
  const renderPdfPage = useCallback(async (doc: unknown, pageNum: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await (doc as any).getPage(pageNum);
      const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = vp.width; canvas.height = vp.height;
      const ctx = canvas.getContext('2d')!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx as any, viewport: vp } as any).promise;
      setBgImage(canvas.toDataURL('image/png'));
      setBgSize({ w: vp.width, h: vp.height });
    } catch (err) {
      console.error('PDF render error', err);
    }
  }, []);

  // Re-render when page number changes (user clicks Prev/Next)
  useEffect(() => {
    if (pdfDocRef.current && pdfTotalPages > 1) {
      renderPdfPage(pdfDocRef.current, pdfPageNum);
    }
  }, [pdfPageNum, renderPdfPage, pdfTotalPages]);

  // ── File upload (background — image or PDF) ───────────────────────────────
  const handleBgFile = useCallback((file: File) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async ev => {
        try {
          const pdfjs = await import('pdfjs-dist');
          // Use CDN worker to avoid bundling the huge worker file
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
          const pdf = await pdfjs.getDocument({ data: ev.target!.result as ArrayBuffer }).promise;
          pdfDocRef.current = pdf;
          setPdfTotalPages(pdf.numPages);
          setPdfPageNum(1);
          await renderPdfPage(pdf, 1);
          // Feature 16: Generate thumbnails for all pages (capped at 40)
          const thumbs: string[] = [];
          const maxThumb = Math.min(pdf.numPages, 40);
          for (let i = 1; i <= maxThumb; i++) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pg = await (pdf as any).getPage(i);
            const vp = pg.getViewport({ scale: 0.15 });
            const tc = document.createElement('canvas');
            tc.width = vp.width; tc.height = vp.height;
            const tctx = tc.getContext('2d')!;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await pg.render({ canvasContext: tctx as any, viewport: vp } as any).promise;
            thumbs.push(tc.toDataURL('image/jpeg', 0.6));
          }
          setPdfThumbnails(thumbs);
        } catch (err) {
          console.error('PDF load error', err);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => { setBgImage(src); setBgSize({ w: img.naturalWidth, h: img.naturalHeight }); };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, [renderPdfPage]);

  // ── Photo → place on canvas ───────────────────────────────────────────────
  const placeImageOnCanvas = useCallback((src: string) => {
    const img = new window.Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      const w = 300, h = w / aspect;
      const cx = (canvasSize.w / 2  - panRef.current.x) / zoomRef.current;
      const cy = (canvasSize.h / 2  - panRef.current.y) / zoomRef.current;
      const m: Markup = {
        id: genId(), type: 'image', number: counter,
        points: [{ x: cx - w / 2, y: cy - h / 2 }, { x: cx + w / 2, y: cy + h / 2 }],
        text: '', color: '#ffffff', strokeWidth: 1, fontSize: 14, opacity: 1,
        priority: 'low', status: 'open', layerId: 'l4',
        createdAt: new Date().toISOString(),
        imageData: src,
      };
      updateMarkups(activeBoardId, prev => [...prev, m]);
      setCounter(c => c + 1);
      setSelectedId(m.id);
      setSelectedIds([m.id]);
    };
    img.src = src;
    setActivePanel(null);
  }, [activeBoardId, canvasSize, counter, updateMarkups]);

  // ── Place a stamp at center of viewport ───────────────────────────────────
  const placeStamp = useCallback((s: StampDef) => {
    const cx = (canvasSize.w / 2 - panRef.current.x) / zoomRef.current;
    const cy = (canvasSize.h / 2 - panRef.current.y) / zoomRef.current;
    const m: Markup = {
      id: genId(), type: s.type, number: counter,
      points: [{ x: cx - s.w / 2, y: cy - s.h / 2 }, { x: cx + s.w / 2, y: cy + s.h / 2 }],
      text: s.text, color: s.color, strokeWidth: 2, fontSize: 14, opacity: 1,
      priority: s.priority, status: s.status, layerId: 'l1',
      createdAt: new Date().toISOString(),
    };
    updateMarkups(activeBoardId, prev => [...prev, m]);
    setCounter(c => c + 1);
    setSelectedId(m.id);
    setSelectedIds([m.id]);
    setActivePanel(null);
    setTool('select');  // return to select so the stamp can be immediately dragged
  }, [activeBoardId, canvasSize, counter, updateMarkups, setTool]);

  // ── Feature 13: Align & distribute selected markups ──────────────────────
  const alignMarkups = useCallback((mode: string) => {
    const sel = (boardMarkups[activeBoardId] ?? []).filter(m => selectedIds.includes(m.id));
    if (sel.length < 2) return;
    const bounds = sel.map(m => ({ id: m.id, m, b: mkBounds(m) }));
    const patched: Record<string, Pt[]> = {};

    if (mode === 'left') {
      const minX = Math.min(...bounds.map(({ b }) => b.x));
      bounds.forEach(({ id, m, b }) => { const dx = minX - b.x; patched[id] = m.points.map(p => ({ x: p.x + dx, y: p.y })); });
    } else if (mode === 'center-h') {
      const minX = Math.min(...bounds.map(({ b }) => b.x));
      const maxX = Math.max(...bounds.map(({ b }) => b.x + b.w));
      const cx   = (minX + maxX) / 2;
      bounds.forEach(({ id, m, b }) => { const dx = cx - (b.x + b.w / 2); patched[id] = m.points.map(p => ({ x: p.x + dx, y: p.y })); });
    } else if (mode === 'right') {
      const maxX = Math.max(...bounds.map(({ b }) => b.x + b.w));
      bounds.forEach(({ id, m, b }) => { const dx = maxX - (b.x + b.w); patched[id] = m.points.map(p => ({ x: p.x + dx, y: p.y })); });
    } else if (mode === 'top') {
      const minY = Math.min(...bounds.map(({ b }) => b.y));
      bounds.forEach(({ id, m, b }) => { const dy = minY - b.y; patched[id] = m.points.map(p => ({ x: p.x, y: p.y + dy })); });
    } else if (mode === 'center-v') {
      const minY = Math.min(...bounds.map(({ b }) => b.y));
      const maxY = Math.max(...bounds.map(({ b }) => b.y + b.h));
      const cy   = (minY + maxY) / 2;
      bounds.forEach(({ id, m, b }) => { const dy = cy - (b.y + b.h / 2); patched[id] = m.points.map(p => ({ x: p.x, y: p.y + dy })); });
    } else if (mode === 'bottom') {
      const maxY = Math.max(...bounds.map(({ b }) => b.y + b.h));
      bounds.forEach(({ id, m, b }) => { const dy = maxY - (b.y + b.h); patched[id] = m.points.map(p => ({ x: p.x, y: p.y + dy })); });
    } else if (mode === 'dist-h') {
      const sorted = [...bounds].sort((a, b) => a.b.x - b.b.x);
      const totalW = sorted.reduce((s, { b }) => s + b.w, 0);
      const span   = sorted[sorted.length - 1].b.x + sorted[sorted.length - 1].b.w - sorted[0].b.x;
      const gap    = (span - totalW) / Math.max(sorted.length - 1, 1);
      let curX = sorted[0].b.x + sorted[0].b.w + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        const { id, m, b } = sorted[i];
        const dx = curX - b.x;
        patched[id] = m.points.map(p => ({ x: p.x + dx, y: p.y }));
        curX += b.w + gap;
      }
    } else if (mode === 'dist-v') {
      const sorted = [...bounds].sort((a, b) => a.b.y - b.b.y);
      const totalH = sorted.reduce((s, { b }) => s + b.h, 0);
      const span   = sorted[sorted.length - 1].b.y + sorted[sorted.length - 1].b.h - sorted[0].b.y;
      const gap    = (span - totalH) / Math.max(sorted.length - 1, 1);
      let curY = sorted[0].b.y + sorted[0].b.h + gap;
      for (let i = 1; i < sorted.length - 1; i++) {
        const { id, m, b } = sorted[i];
        const dy = curY - b.y;
        patched[id] = m.points.map(p => ({ x: p.x, y: p.y + dy }));
        curY += b.h + gap;
      }
    }

    updateMarkups(activeBoardId, prev =>
      prev.map(m => patched[m.id] ? { ...m, points: patched[m.id] } : m)
    );
  }, [activeBoardId, boardMarkups, selectedIds, updateMarkups]);

  // ── Hit test ─────────────────────────────────────────────────────────────
  const hitTest = useCallback((pt: Pt, list: Markup[]): Markup | null => {
    const pad = 10 / zoomRef.current;
    return [...list].reverse().find(m => {
      const b = mkBounds(m);
      return pt.x >= b.x - pad && pt.x <= b.x + b.w + pad &&
             pt.y >= b.y - pad && pt.y <= b.y + b.h + pad;
    }) ?? null;
  }, []);

  // ── In-place text editing ─────────────────────────────────────────────────
  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const bid = activeBoardId;
    setBoardMarkups(prev => {
      const next = {
        ...prev,
        [bid]: (prev[bid] ?? []).map(m => m.id === editingId ? { ...m, text: editingText } : m),
      };
      pushHistory(next);
      return next;
    });
    setEditingId(null);
  }, [editingId, editingText, activeBoardId, pushHistory]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const t = toolRef.current;
    if (t !== 'select') return;
    const pt = toPt(e);
    const hit = hitTest(pt, markups);
    if (hit && TEXT_EDITABLE.includes(hit.type)) {
      moveOrigin.current      = null;
      moveMarkupPts.current   = null;
      setEditingId(hit.id);
      setEditingText(hit.text);
      setSelectedId(hit.id);
    }
  }, [toPt, hitTest, markups, counter, activeBoardId, updateMarkups]);

  // ── Polyline / area right-click complete & cancel ─────────────────────────
  const finishPolylineOrArea = useCallback(() => {
    setPolylineMenu(null);
    const t = toolRef.current;
    if (t === 'polyline') {
      const pts = polylinePtsRef.current;
      polylinePtsRef.current = []; isDrawing.current = false; setPreview(null);
      if (pts.length >= 2) {
        const m: Markup = { id: genId(), type: 'polyline', number: counter,
          points: pts, text: '', color: colorRef.current,
          strokeWidth: ctxStrokeWidthRef.current, fontSize: ctxFontSizeRef.current,
          fontFamily: ctxFontFamilyRef.current, dashStyle: ctxDashStyleRef.current,
          opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
          createdAt: new Date().toISOString() };
        updateMarkups(activeBoardId, prev => [...prev, m]);
        setCounter(c => c + 1); setSelectedId(m.id);
      }
    } else if (t === 'area') {
      const pts = areaPtsRef.current;
      areaPtsRef.current = []; isDrawing.current = false; setPreview(null);
      if (pts.length >= 3) {
        let areaVal = 0;
        for (let i = 0; i < pts.length; i++) {
          const j = (i + 1) % pts.length;
          areaVal += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
        }
        areaVal = Math.abs(areaVal) / 2;
        const ratio = calibRatioRef.current; const unit = calibUnitRef.current;
        const areaLabel = ratio !== null
          ? `${(Math.round(areaVal / (ratio * ratio) * 100) / 100)} ${unit}²`
          : `${Math.round(areaVal)} px²`;
        const m: Markup = { id: genId(), type: 'area', number: counter,
          points: pts, text: areaLabel, color: colorRef.current,
          strokeWidth: ctxStrokeWidthRef.current, fontSize: ctxFontSizeRef.current,
          fontFamily: ctxFontFamilyRef.current, dashStyle: ctxDashStyleRef.current,
          fillColor: fillColorRef.current !== 'transparent' ? fillColorRef.current : 'rgba(59,130,246,0.15)',
          opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
          createdAt: new Date().toISOString() };
        updateMarkups(activeBoardId, prev => [...prev, m]);
        setCounter(c => c + 1); setSelectedId(m.id);
      }
    }
  }, [counter, activeBoardId, updateMarkups]);

  const cancelPolylineOrArea = useCallback(() => {
    polylinePtsRef.current = []; areaPtsRef.current = [];
    isDrawing.current = false; setPreview(null); setPolylineMenu(null);
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    const t = toolRef.current;
    if ((t === 'polyline' || t === 'area') && isDrawing.current) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPolylineMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  // ── Pointer down ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Commit any open text edit on new pointer down
    if (editingId) { commitEdit(); return; }

    // Feature 4: Calibration point picking
    if (calibModeRef.current === 'pick1' || calibModeRef.current === 'pick2') {
      if (e.button !== 0) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const pt = toPt(e);
      if (calibModeRef.current === 'pick1') {
        setCalibPts([pt]);
        setCalibMode('pick2');
      } else {
        setCalibPts(prev => [...prev, pt]);
        setCalibMode('dialog');
        setActivePanel('scale');
      }
      return;
    }

    const t = toolRef.current;

    // Middle mouse = pan
    if (e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...panRef.current };
      return;
    }
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Check if clicking a handle (resize or rotation)
    const handleAttr = (e.target as SVGElement).getAttribute?.('data-handle') as string | null;
    if (handleAttr && t === 'select' && selectedId) {
      if (handleAttr === 'rotate') {
        // Feature 6: start rotation drag
        const sel = markups.find(m => m.id === selectedId);
        if (!sel) return;
        const b = mkBounds(sel);
        rotateCenter.current     = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
        const pt = toPt(e);
        rotateStartAngle.current = Math.atan2(pt.y - rotateCenter.current.y, pt.x - rotateCenter.current.x) * 180 / Math.PI;
        rotateOriginRot.current  = sel.rotation ?? 0;
        isRotating.current       = true;
        return;
      }
      resizingHandle.current  = handleAttr as HandlePos;
      resizeStartPt.current   = toPt(e);
      const sel = markups.find(m => m.id === selectedId);
      resizeOriginPts.current = sel ? sel.points.map(p => ({ ...p })) : null;
      return;
    }

    if (t === 'pan') {
      isPanning.current = true;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...panRef.current };
      return;
    }

    const rect = containerRef.current!.getBoundingClientRect();
    const sx   = e.clientX - rect.left, sy = e.clientY - rect.top;

    if (t === 'zoom')      { zoomAt(sx, sy, 1.4); return; }
    if (t === 'fit')       { fitView(); return; }

    const pt = toPt(e);

    if (t === 'select') {
      const hit = hitTest(pt, markups);
      if (hit) {
        if (e.shiftKey) {
          // Shift+click: toggle in multi-selection
          setSelectedIds(prev => prev.includes(hit.id) ? prev.filter(id => id !== hit.id) : [...prev, hit.id]);
          setSelectedId(hit.id);
        } else {
          setSelectedId(hit.id);
          setSelectedIds([hit.id]);
        }
        moveOrigin.current    = pt;
        moveMarkupPts.current = hit.points.map(p => ({ ...p }));
        // Capture all selected pts for multi-move
        const allIds = e.shiftKey ? [...selectedIds, hit.id] : [hit.id];
        moveAllPtsMap.current = Object.fromEntries(
          markups.filter(m => allIds.includes(m.id)).map(m => [m.id, m.points.map(p => ({ ...p }))])
        );
      } else {
        clearSelection();
      }
      return;
    }

    if (t === 'eraser') {
      const hit = hitTest(pt, markups);
      if (hit) { updateMarkups(activeBoardId, prev => prev.filter(m => m.id !== hit.id)); clearSelection(); }
      return;
    }

    // Panel-open tools
    if (t === 'note')   { setActivePanel('note');   setTool('select'); return; }
    // 'stamps' panel only opens from the toolbar button, not from canvas clicks

    // Drawing tools
    if (t === 'distance' && !scaleSet) return;

    if (t === 'pen' || t === 'highlighter') {
      isDrawing.current = true;
      penPts.current    = [pt];
      setPreview({ type: t, start: pt, cur: pt, pts: [pt] });
      return;
    }

    // Feature 8: Polyline — accumulate clicks; double-click finishes (handled in onDoubleClick)
    if (t === 'polyline') {
      if (!isDrawing.current) {
        isDrawing.current = true;
        polylinePtsRef.current = [pt];
        setPreview({ type: 'polyline', start: pt, cur: pt, pts: [pt] });
      } else {
        polylinePtsRef.current = [...polylinePtsRef.current, pt];
        setPreview(prev => prev ? { ...prev, pts: [...polylinePtsRef.current] } : null);
      }
      return;
    }

    // Feature 9: Angle — 3-click workflow
    if (t === 'angle') {
      if (anglePtsRef.current.length === 0) {
        isDrawing.current = true;
        anglePtsRef.current = [pt];
        setPreview({ type: 'angle', start: pt, cur: pt, pts: [pt] });
      } else if (anglePtsRef.current.length === 1) {
        anglePtsRef.current = [...anglePtsRef.current, pt];
        setPreview(prev => prev ? { ...prev, pts: [...anglePtsRef.current] } : null);
      } else {
        // 3rd click — commit
        const allPts = [...anglePtsRef.current, pt];
        anglePtsRef.current = [];
        isDrawing.current = false;
        setPreview(null);
        const [orig, arm1, arm2] = allPts;
        const a1 = Math.atan2(arm1.y - orig.y, arm1.x - orig.x);
        const a2 = Math.atan2(arm2.y - orig.y, arm2.x - orig.x);
        let deg = Math.abs(a2 - a1) * 180 / Math.PI;
        if (deg > 180) deg = 360 - deg;
        const m: Markup = {
          id: genId(), type: 'angle', number: counter,
          points: allPts, text: `${Math.round(deg * 10) / 10}°`,
          color: colorRef.current, strokeWidth: ctxStrokeWidthRef.current,
          fontSize: ctxFontSizeRef.current, fontFamily: ctxFontFamilyRef.current,
          dashStyle: ctxDashStyleRef.current,
          opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
          createdAt: new Date().toISOString(),
        };
        updateMarkups(activeBoardId, prev => [...prev, m]);
        setCounter(c => c + 1); setSelectedId(m.id);
      }
      return;
    }

    // Feature 10: Area polygon — accumulate clicks; double-click finishes
    if (t === 'area') {
      if (!isDrawing.current) {
        isDrawing.current = true;
        areaPtsRef.current = [pt];
        setPreview({ type: 'area', start: pt, cur: pt, pts: [pt] });
      } else {
        areaPtsRef.current = [...areaPtsRef.current, pt];
        setPreview(prev => prev ? { ...prev, pts: [...areaPtsRef.current] } : null);
      }
      return;
    }

    // Feature 11: Count — each click places a numbered tally circle
    if (t === 'count') {
      const countNum = (boardMarkups[activeBoardId] ?? []).filter(m => m.type === 'count').length + 1;
      const m: Markup = {
        id: genId(), type: 'count', number: counter,
        points: [pt], text: String(countNum),
        color: colorRef.current, strokeWidth: 2, fontSize: 14,
        opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
        createdAt: new Date().toISOString(),
      };
      updateMarkups(activeBoardId, prev => [...prev, m]);
      setCounter(c => c + 1);
      setSelectedId(m.id);
      setSelectedIds([m.id]);
      return;
    }

    if (['arrow','cloud','text','box','ellipse','callout','dimension','distance','zoom-area'].includes(t)) {
      isDrawing.current  = true;
      drawStart.current  = pt;
      drawCurrent.current = pt;
      setPreview({ type: t, start: pt, cur: pt });
    }
  }, [editingId, commitEdit, tool, selectedId, markups, activeBoardId, boardMarkups, toPt, hitTest,
      updateMarkups, zoomAt, fitView, scaleSet, setTool, counter]);

  // ── Pointer move ──────────────────────────────────────────────────────────
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    // Feature 3: Track cursor in canvas coordinates always
    {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
        setCursorPt({
          x: Math.round((sx - panRef.current.x) / zoomRef.current),
          y: Math.round((sy - panRef.current.y) / zoomRef.current),
        });
      }
    }

    // Pan
    if (isPanning.current && panStart.current && panOrigin.current) {
      setPan({ x: panOrigin.current.x + e.clientX - panStart.current.x, y: panOrigin.current.y + e.clientY - panStart.current.y });
      return;
    }

    const pt = toPt(e);

    // Feature 6: Rotation drag
    if (isRotating.current && selectedId) {
      const angle = Math.atan2(pt.y - rotateCenter.current.y, pt.x - rotateCenter.current.x) * 180 / Math.PI;
      const newRot = rotateOriginRot.current + (angle - rotateStartAngle.current);
      setBoardMarkups(prev => ({
        ...prev,
        [activeBoardId]: (prev[activeBoardId] ?? []).map(m =>
          m.id === selectedId ? { ...m, rotation: newRot } : m
        ),
      }));
      return;
    }

    // Resize
    if (resizingHandle.current && resizeOriginPts.current && selectedId) {
      const pts = resizeOriginPts.current;
      const xs  = pts.map(p => p.x), ys = pts.map(p => p.y);
      let minX = Math.min(...xs), minY = Math.min(...ys);
      let maxX = Math.max(...xs), maxY = Math.max(...ys);
      const h  = resizingHandle.current;
      if (h === 'tl') { minX = Math.min(pt.x, maxX - 5); minY = Math.min(pt.y, maxY - 5); }
      if (h === 'tr') { maxX = Math.max(pt.x, minX + 5); minY = Math.min(pt.y, maxY - 5); }
      if (h === 'bl') { minX = Math.min(pt.x, maxX - 5); maxY = Math.max(pt.y, minY + 5); }
      if (h === 'br') { maxX = Math.max(pt.x, minX + 5); maxY = Math.max(pt.y, minY + 5); }
      setBoardMarkups(prev => ({
        ...prev,
        [activeBoardId]: (prev[activeBoardId] ?? []).map(m => {
          if (m.id !== selectedId) return m;
          if (m.type === 'pen' || m.type === 'highlighter') {
            const sw = maxX > minX ? (maxX - minX) / Math.max(maxX - minX, 1) : 1;
            const sh = maxY > minY ? (maxY - minY) / Math.max(maxY - minY, 1) : 1;
            return { ...m, points: pts.map(p => ({ x: minX + (p.x - minX) * sw, y: minY + (p.y - minY) * sh })) };
          }
          return { ...m, points: [{ x: minX, y: minY }, { x: maxX, y: maxY }] };
        }),
      }));
      return;
    }

    // Move selected (single or multi)
    const t = toolRef.current;
    if (t === 'select' && moveOrigin.current && selectedId) {
      const dx = pt.x - moveOrigin.current.x, dy = pt.y - moveOrigin.current.y;
      if (moveAllPtsMap.current && Object.keys(moveAllPtsMap.current).length > 1) {
        // Multi-move
        setBoardMarkups(prev => ({
          ...prev,
          [activeBoardId]: (prev[activeBoardId] ?? []).map(m => {
            const origPts = moveAllPtsMap.current![m.id];
            return origPts ? { ...m, points: origPts.map(p => ({ x: p.x + dx, y: p.y + dy })) } : m;
          }),
        }));
      } else if (moveMarkupPts.current) {
        // Single move
        setBoardMarkups(prev => ({
          ...prev,
          [activeBoardId]: (prev[activeBoardId] ?? []).map(m =>
            m.id === selectedId
              ? { ...m, points: moveMarkupPts.current!.map(p => ({ x: p.x + dx, y: p.y + dy })) }
              : m
          ),
        }));
      }
      return;
    }

    if (!isDrawing.current) return;

    if (t === 'pen' || t === 'highlighter') {
      penPts.current = [...penPts.current, pt];
      setPreview(prev => prev ? { ...prev, cur: pt, pts: penPts.current } : null);
    } else if (t === 'polyline' || t === 'angle' || t === 'area') {
      // Multi-click tools: just update current cursor for live last-segment preview
      setPreview(prev => prev ? { ...prev, cur: pt } : null);
    } else {
      drawCurrent.current = pt;
      setPreview(prev => prev ? { ...prev, cur: pt } : null);
    }
  }, [toPt, selectedId, activeBoardId, setPan]);

  // ── Pointer up ────────────────────────────────────────────────────────────
  const onPointerUp = useCallback((_e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false; panStart.current = null; panOrigin.current = null;
      return;
    }

    // Feature 6: Commit rotation
    if (isRotating.current) {
      pushHistory({ ...boardMarkups });
      isRotating.current = false;
      return;
    }

    // Commit resize
    if (resizingHandle.current) {
      pushHistory({ ...boardMarkups });
      resizingHandle.current = null; resizeStartPt.current = null; resizeOriginPts.current = null;
      return;
    }

    const t = toolRef.current;

    // Click-accumulating tools — pointer up does nothing, right-click finishes them
    if (t === 'polyline' || t === 'area') return;

    // Commit move
    if (t === 'select' && moveOrigin.current) {
      pushHistory({ ...boardMarkups });
      moveOrigin.current = null; moveMarkupPts.current = null; moveAllPtsMap.current = null;
      return;
    }

    if (!isDrawing.current) return;
    isDrawing.current = false;
    setPreview(null);

    const col = colorRef.current;

    if (t === 'pen' || t === 'highlighter') {
      const pts = penPts.current;
      penPts.current = [];
      if (pts.length < 2) return;
      const sw = t === 'highlighter' ? Math.max(ctxStrokeWidthRef.current, 8) : ctxStrokeWidthRef.current;
      const m: Markup = {
        id: genId(), type: t, number: counter, points: pts,
        text: '', color: col, strokeWidth: sw, fontSize: ctxFontSizeRef.current,
        fontFamily: ctxFontFamilyRef.current, dashStyle: 'solid',
        opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
        createdAt: new Date().toISOString(),
      };
      updateMarkups(activeBoardId, prev => [...prev, m]);
      setCounter(c => c + 1); setSelectedId(m.id);
      return;
    }

    const start = drawStart.current, cur = drawCurrent.current;
    drawStart.current = null; drawCurrent.current = null;
    if (!start || !cur) return;
    if (Math.abs(cur.x - start.x) < 4 && Math.abs(cur.y - start.y) < 4) return;

    if (t === 'zoom-area') {
      const rect   = containerRef.current!.getBoundingClientRect();
      const dx = Math.abs(cur.x - start.x), dy = Math.abs(cur.y - start.y);
      const cX = ((start.x + cur.x) / 2) * zoomRef.current + panRef.current.x;
      const cY = ((start.y + cur.y) / 2) * zoomRef.current + panRef.current.y;
      const nz = Math.min(zoomRef.current * Math.min(rect.width / (dx * zoomRef.current + 1), rect.height / (dy * zoomRef.current + 1)) * 0.85, 10);
      setPan({ x: rect.width / 2 - cX * (nz / zoomRef.current), y: rect.height / 2 - cY * (nz / zoomRef.current) });
      setZoom(nz);
      return;
    }

    const typeMap: Partial<Record<Tool, MarkupType>> = {
      arrow: 'arrow', cloud: 'cloud', text: 'text', box: 'box', ellipse: 'ellipse',
      callout: 'callout', dimension: 'dimension', distance: 'distance',
    };
    const mtype = typeMap[t];
    if (!mtype) return;

    const defaultText = t === 'text' ? 'TEXT NOTE' : t === 'callout' ? 'Label' : '';
    const m: Markup = {
      id: genId(), type: mtype, number: counter,
      points: [start, cur], text: defaultText, color: col,
      strokeWidth: ctxStrokeWidthRef.current,
      fontSize: ctxFontSizeRef.current,
      fontFamily: ctxFontFamilyRef.current,
      dashStyle: ctxDashStyleRef.current,
      fillColor: (mtype === 'ellipse' || mtype === 'box') ? fillColorRef.current : undefined,
      opacity: 1, priority: 'medium', status: 'open', layerId: 'l1',
      createdAt: new Date().toISOString(),
    };
    updateMarkups(activeBoardId, prev => [...prev, m]);
    setCounter(c => c + 1); setSelectedId(m.id);

    // Auto-open text editor for text/callout/note markups
    if (mtype === 'text' || mtype === 'callout') {
      setEditingId(m.id);
      setEditingText(defaultText);
    }
  }, [counter, activeBoardId, updateMarkups, pushHistory, boardMarkups, setPan, setZoom]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  }, [zoomAt]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        setTool('select'); clearSelection(); setActivePanel(null);
        isDrawing.current = false; setPreview(null);
        if (editingId) commitEdit();
        setCalibMode('idle');
        setShowCmdBar(false);
      }
      // Feature 5: '/' opens command bar
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowCmdBar(true);
        setCmdInput('');
        return;
      }
      if (e.key === '?' && !editingId) { setShowShortcutOverlay(v => !v); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && !editingId) {
        const toDelete = new Set(selectedIds);
        updateMarkups(activeBoardId, prev => prev.filter(m => !toDelete.has(m.id)));
        clearSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }

      // Feature 12: Clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && selectedIds.length > 0 && !editingId) {
        e.preventDefault();
        setClipboard(markups.filter(m => selectedIds.includes(m.id)));
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'x' && selectedIds.length > 0 && !editingId) {
        e.preventDefault();
        setClipboard(markups.filter(m => selectedIds.includes(m.id)));
        const toDelete = new Set(selectedIds);
        updateMarkups(activeBoardId, prev => prev.filter(m => !toDelete.has(m.id)));
        clearSelection();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && clipboardRef.current.length > 0 && !editingId) {
        e.preventDefault();
        const off = 20;
        let ctr = counter;
        const pasted = clipboardRef.current.map(m => ({
          ...m, id: genId(), number: ctr++,
          points: m.points.map(p => ({ x: p.x + off, y: p.y + off })),
          createdAt: new Date().toISOString(),
        }));
        updateMarkups(activeBoardId, prev => [...prev, ...pasted]);
        setCounter(ctr);
        setSelectedIds(pasted.map(m => m.id));
        setSelectedId(pasted[pasted.length - 1].id);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedIds.length > 0 && !editingId) {
        e.preventDefault();
        let ctr = counter;
        const duped = markups.filter(m => selectedIds.includes(m.id)).map(m => ({
          ...m, id: genId(), number: ctr++,
          points: m.points.map(p => ({ x: p.x + 20, y: p.y + 20 })),
          createdAt: new Date().toISOString(),
        }));
        updateMarkups(activeBoardId, prev => [...prev, ...duped]);
        setCounter(ctr);
        setSelectedIds(duped.map(m => m.id));
        setSelectedId(duped[duped.length - 1].id);
        return;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedIds, selectedId, editingId, activeBoardId, markups, counter, updateMarkups, undo, redo, setTool, commitEdit, clearSelection]);

  // ── Tool activation ───────────────────────────────────────────────────────
  const activateTool = useCallback((t: Tool) => {
    // Panel-only tools: open the panel without changing the active drawing tool
    if (t === 'color')  { setActivePanel('color');  return; }
    if (t === 'photo')  { setActivePanel('photo');  return; }
    if (t === 'file')   { setActivePanel('file');   return; }
    if (t === 'link')   { setActivePanel('link');   return; }
    if (t === 'scale')  { setActivePanel('scale');  return; }
    if (t === 'stamps') { setActivePanel(prev => prev === 'stamps' ? null : 'stamps'); return; }
    setTool(t);
    setActivePanel(null);
    if (t === 'note')   setActivePanel('note');
    if (t === 'undo')   { undo(); setTool('select'); }
    if (t === 'redo')   { redo(); setTool('select'); }
    if (t === 'fit')    { fitView(); setTool('select'); }
    if (t === 'layers') setShowLayers(v => !v);
    if (t === 'grid')   setShowGrid(v => !v);
    if (t === 'snap')   setSnapEnabled(v => !v);
    if (t === 'more')   { setShowMoreMenu(v => !v); return; }
  }, [setTool, undo, redo, fitView]);

  const addLayer = useCallback(() => {
    const id = `l${Date.now()}`;
    setLayers(prev => [...prev, { id, name: `Layer ${prev.length + 1}`, visible: true }]);
  }, []);

  const commitRenameLayer = useCallback((id: string) => {
    if (renameLayerText.trim()) {
      setLayers(prev => prev.map(l => l.id === id ? { ...l, name: renameLayerText.trim() } : l));
    }
    setRenamingLayerId(null);
  }, [renameLayerText]);

  const addBoard = useCallback(() => {
    if (!newBoardName.trim()) return;
    const id = `b${Date.now()}`;
    setBoardTree(prev => [...prev, { id, name: newBoardName.trim(), parentId: newBoardParent }]);
    setNewBoardName('');
    setShowAddBoard(false);
    setActiveBoardId(id);
  }, [newBoardName, newBoardParent]);

  // ── Feature 5: Command bar execution ─────────────────────────────────────
  const executeCommand = useCallback((cmd: string) => {
    const c = cmd.trim().toLowerCase();
    const toolMap: Partial<Record<string, Tool>> = {
      arrow: 'arrow', cloud: 'cloud', box: 'box', ellipse: 'ellipse', text: 'text', pen: 'pen',
      polyline: 'polyline', select: 'select', pan: 'pan', callout: 'callout',
      highlighter: 'highlighter', eraser: 'eraser', distance: 'distance',
      dimension: 'dimension', angle: 'angle', area: 'area', count: 'count',
    };
    if (toolMap[c]) { activateTool(toolMap[c]!); }
    else if (c === 'fit')       { fitView(); }
    else if (c === 'grid')      { setShowGrid(v => !v); }
    else if (c === 'snap')      { setSnapEnabled(v => !v); }
    else if (c === 'undo')      { undo(); }
    else if (c === 'redo')      { redo(); }
    else if (c === 'calibrate') { setCalibMode('pick1'); setCalibPts([]); setActivePanel(null); }
    setShowCmdBar(false);
    setCmdInput('');
  }, [activateTool, fitView, undo, redo]);

  // ── Render markup ─────────────────────────────────────────────────────────
  const renderMarkup = (m: Markup) => {
    const layer = layers.find(l => l.id === m.layerId);
    if (layer && !layer.visible) return null;
    const isSel  = m.id === selectedId;
    const stroke = isSel ? '#3b82f6' : m.color;
    const sw     = m.strokeWidth / zoom;
    const b      = mkBounds(m);
    const bx = b.x, by = b.y, bw = Math.max(b.w, 1), bh = Math.max(b.h, 1);
    const hitPad = 10 / zoom;

    const hitRect = (
      <rect key={`hit-${m.id}`} data-testid={`annotation-hit-${m.number}`}
        x={bx - hitPad} y={by - hitPad} width={bw + hitPad * 2} height={bh + hitPad * 2}
        fill="transparent" stroke="none" style={{ cursor: 'pointer' }}
        onClick={() => { if (toolRef.current === 'select') setSelectedId(m.id); }}
      />
    );

    const tp = { 'data-testid': `annotation-${m.number}`, 'data-tool-type': m.type };
    let shape: React.ReactNode = null;

    const dashArray = m.dashStyle === 'dashed' ? `${6/zoom}` : m.dashStyle === 'dotted' ? `${2/zoom} ${3/zoom}` : undefined;

    if (m.type === 'box') {
      shape = <rect {...tp} key={m.id} x={bx} y={by} width={bw} height={bh}
        fill={m.fillColor && m.fillColor !== 'transparent' ? m.fillColor + '40' : 'none'}
        stroke={stroke} strokeWidth={sw} strokeDasharray={dashArray}/>;

    } else if (m.type === 'arrow') {
      const mid = `ah-${m.id}`, ms = 8 / zoom;
      shape = (
        <g key={m.id} {...tp}>
          <defs>
            <marker id={mid} markerWidth={ms * 3} markerHeight={ms * 3} refX={ms * 2.5} refY={ms * 1.5} orient="auto" markerUnits="userSpaceOnUse">
              <polygon points={`0 0,${ms * 3} ${ms * 1.5},0 ${ms * 3}`} fill={stroke} />
            </marker>
          </defs>
          <line x1={m.points[0].x} y1={m.points[0].y} x2={m.points[1].x} y2={m.points[1].y} stroke={stroke} strokeWidth={sw} strokeDasharray={dashArray} markerEnd={`url(#${mid})`} />
        </g>
      );

    } else if (m.type === 'cloud') {
      shape = <path {...tp} key={m.id} d={cloudPath(bx, by, bw, bh)} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dashArray}/>;

    } else if (m.type === 'text') {
      shape = (
        <text {...tp} key={m.id} x={m.points[0].x} y={m.points[0].y}
          fill={stroke} fontSize={m.fontSize / zoom} fontFamily={m.fontFamily ?? 'sans-serif'} fontWeight="600"
          dominantBaseline="hanging">
          {m.text}
        </text>
      );

    } else if (m.type === 'callout') {
      const tip = m.points[0];
      // Find nearest point on box edge for the leader line endpoint
      const ex = Math.max(bx, Math.min(bx + bw, tip.x));
      const ey = Math.max(by, Math.min(by + bh, tip.y));
      const dx = ex - tip.x, dy = ey - tip.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / len, uy = dy / len;
      const arrowSize = 10 / zoom;
      const perpX = -uy, perpY = ux;
      const baseX = tip.x + ux * arrowSize, baseY = tip.y + uy * arrowSize;
      const arrowPts = `${tip.x},${tip.y} ${baseX + perpX * arrowSize * 0.45},${baseY + perpY * arrowSize * 0.45} ${baseX - perpX * arrowSize * 0.45},${baseY - perpY * arrowSize * 0.45}`;
      shape = (
        <g key={m.id} {...tp}>
          <line x1={baseX} y1={baseY} x2={ex} y2={ey} stroke={stroke} strokeWidth={sw} />
          <polygon points={arrowPts} fill={stroke} stroke="none" />
          <rect x={bx} y={by} width={bw} height={bh} rx={2 / zoom} fill="white" fillOpacity={0.92} stroke={stroke} strokeWidth={sw} />
          <text x={bx + 5 / zoom} y={by + bh / 2} fill="#1e293b" fontSize={m.fontSize / zoom} fontFamily="sans-serif" dominantBaseline="middle">{m.text}</text>
        </g>
      );

    } else if (m.type === 'pen' || m.type === 'highlighter') {
      const pts = m.points.map(p => `${p.x},${p.y}`).join(' ');
      shape = <polyline {...tp} key={m.id} points={pts} fill="none" stroke={stroke} strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="round" opacity={m.type === 'highlighter' ? 0.35 : 1} />;

    } else if (m.type === 'dimension' || m.type === 'distance') {
      const p1 = m.points[0], p2 = m.points[1];
      const ddx = p2.x - p1.x, ddy = p2.y - p1.y;
      const len = Math.sqrt(ddx * ddx + ddy * ddy);
      const off = 8 / zoom;
      const nx = len > 0 ? -ddy / len * off : 0, ny = len > 0 ? ddx / len * off : 0;
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const ang = Math.atan2(ddy, ddx) * 180 / Math.PI;
      const dimLabel = calibRatio !== null
        ? `${(Math.round(len / calibRatio * 100) / 100)} ${calibUnit}`
        : `${Math.round(len * 10) / 10}"`;
      const dimDash = m.dashStyle === 'dashed' ? `${6/zoom}` : m.dashStyle === 'dotted' ? `${2/zoom} ${3/zoom}` : undefined;
      shape = (
        <g key={m.id} {...tp}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={stroke} strokeWidth={sw} strokeDasharray={dimDash}/>
          <line x1={p1.x - nx} y1={p1.y - ny} x2={p1.x + nx} y2={p1.y + ny} stroke={stroke} strokeWidth={sw} />
          <line x1={p2.x - nx} y1={p2.y - ny} x2={p2.x + nx} y2={p2.y + ny} stroke={stroke} strokeWidth={sw} />
          <text x={mx} y={my - off} fill={stroke} fontSize={9 / zoom} fontFamily="sans-serif" textAnchor="middle"
            transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang},${mx},${my - off})`}>
            {dimLabel}
          </text>
        </g>
      );

    } else if (m.type === 'ellipse') {
      const rx = bw / 2, ry = bh / 2, ecx = bx + rx, ecy = by + ry;
      shape = <ellipse {...tp} key={m.id} cx={ecx} cy={ecy} rx={rx} ry={ry}
        fill={m.fillColor && m.fillColor !== 'transparent' ? m.fillColor + '40' : 'none'}
        stroke={stroke} strokeWidth={sw} strokeDasharray={dashArray}/>;

    } else if (m.type === 'polyline') {
      const polyPts = m.points.map(p => `${p.x},${p.y}`).join(' ');
      shape = <polyline {...tp} key={m.id} points={polyPts} fill="none" stroke={stroke} strokeWidth={sw}
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashArray}/>;

    } else if (m.type === 'angle') {
      if (m.points.length < 3) return null;
      const [orig, arm1, arm2] = m.points;
      shape = (
        <g key={m.id} {...tp}>
          <line x1={orig.x} y1={orig.y} x2={arm1.x} y2={arm1.y} stroke={stroke} strokeWidth={sw}/>
          <line x1={orig.x} y1={orig.y} x2={arm2.x} y2={arm2.y} stroke={stroke} strokeWidth={sw}/>
          <circle cx={orig.x} cy={orig.y} r={4/zoom} fill={stroke}/>
          <text x={orig.x + 12/zoom} y={orig.y - 5/zoom} fill={stroke}
            fontSize={(m.fontSize ?? 10)/zoom} fontFamily={m.fontFamily ?? 'sans-serif'}>
            {m.text}
          </text>
        </g>
      );

    } else if (m.type === 'area') {
      const polyPts = m.points.map(p => `${p.x},${p.y}`).join(' ');
      const cx = m.points.reduce((s, p) => s + p.x, 0) / m.points.length;
      const cy = m.points.reduce((s, p) => s + p.y, 0) / m.points.length;
      shape = (
        <g key={m.id} {...tp}>
          <polygon points={polyPts}
            fill={m.fillColor ?? 'rgba(59,130,246,0.15)'}
            stroke={stroke} strokeWidth={sw} strokeDasharray={dashArray}/>
          <text x={cx} y={cy} fill={stroke}
            fontSize={(m.fontSize ?? 10)/zoom} fontFamily={m.fontFamily ?? 'sans-serif'}
            textAnchor="middle" dominantBaseline="middle">
            {m.text}
          </text>
        </g>
      );

    } else if (m.type === 'count') {
      const cx = m.points[0].x, cy = m.points[0].y;
      const r = 12 / zoom;
      shape = (
        <g key={m.id} {...tp}>
          <circle cx={cx} cy={cy} r={r} fill={stroke}/>
          <text x={cx} y={cy} fill="white" fontSize={9/zoom} fontFamily="sans-serif"
            textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
            {m.text}
          </text>
        </g>
      );

    } else if (m.type === 'image' && m.imageData) {
      shape = (
        <g key={m.id} {...tp}>
          <image href={m.imageData} x={bx} y={by} width={bw} height={bh} preserveAspectRatio="xMidYMid meet" />
          {isSel && <rect x={bx} y={by} width={bw} height={bh} fill="none" stroke="#3b82f6" strokeWidth={1.5 / zoom} />}
        </g>
      );
    }

    // Feature 6: Apply rotation transform around the markup center
    const rotation = m.rotation ?? 0;
    const cx = bx + bw / 2, cy = by + bh / 2;
    const rotTransform = rotation ? `rotate(${rotation},${cx},${cy})` : undefined;
    return shape ? <g key={m.id} opacity={m.opacity ?? 1} transform={rotTransform}>{shape}{hitRect}</g> : null;
  };

  // ── Render preview ────────────────────────────────────────────────────────
  const renderPreview = () => {
    if (!preview) return null;
    const { type, start, cur, pts } = preview;
    const sw   = 2 / zoom;
    const dash = `${5 / zoom}`;
    const x = Math.min(start.x, cur.x), y = Math.min(start.y, cur.y);
    const w = Math.abs(cur.x - start.x), h = Math.abs(cur.y - start.y);

    if (type === 'pen' || type === 'highlighter') {
      if (!pts || pts.length < 2) return null;
      return <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={color}
        strokeWidth={(type === 'highlighter' ? 14 : 2) / zoom} strokeLinecap="round" strokeLinejoin="round"
        opacity={type === 'highlighter' ? 0.35 : 0.7} />;
    }
    if (type === 'box' || type === 'zoom-area')
      return <rect x={x} y={y} width={w} height={h} fill={type === 'zoom-area' ? 'rgba(59,130,246,0.08)' : 'none'} stroke={color} strokeWidth={sw} strokeDasharray={dash} />;

    // Feature 7: Ellipse preview
    if (type === 'ellipse') {
      const rx = w / 2, ry = h / 2;
      return <ellipse cx={x + rx} cy={y + ry} rx={Math.max(rx,1)} ry={Math.max(ry,1)}
        fill={fillColor !== 'transparent' ? fillColor + '28' : 'none'}
        stroke={color} strokeWidth={sw} strokeDasharray={dash}/>;
    }

    // Feature 8: Polyline preview
    if (type === 'polyline') {
      if (!pts || pts.length < 1) return null;
      const last = pts[pts.length - 1];
      return (
        <g>
          {pts.length >= 2 && <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none"
            stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>}
          <line x1={last.x} y1={last.y} x2={cur.x} y2={cur.y} stroke={color} strokeWidth={sw} strokeDasharray={dash} opacity={0.7}/>
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3/zoom} fill={color} opacity={0.8}/>)}
        </g>
      );
    }

    // Feature 9: Angle preview (live 2nd arm tracking cursor)
    if (type === 'angle') {
      if (!pts || pts.length < 1) return null;
      const origin = pts[0];
      const arm1   = pts.length >= 2 ? pts[1] : null;
      return (
        <g>
          {arm1 && <line x1={origin.x} y1={origin.y} x2={arm1.x} y2={arm1.y} stroke={color} strokeWidth={sw}/>}
          <line x1={origin.x} y1={origin.y} x2={cur.x} y2={cur.y} stroke={color} strokeWidth={sw} strokeDasharray={dash} opacity={0.7}/>
          <circle cx={origin.x} cy={origin.y} r={4/zoom} fill={color}/>
          {arm1 && (() => {
            const a1 = Math.atan2(arm1.y - origin.y, arm1.x - origin.x);
            const a2 = Math.atan2(cur.y  - origin.y, cur.x  - origin.x);
            let deg = Math.abs(a2 - a1) * 180 / Math.PI;
            if (deg > 180) deg = 360 - deg;
            return <text x={origin.x + 10/zoom} y={origin.y - 6/zoom} fill={color}
              fontSize={10/zoom} fontFamily="sans-serif">{Math.round(deg * 10)/10}°</text>;
          })()}
        </g>
      );
    }

    // Feature 10: Area polygon preview
    if (type === 'area') {
      if (!pts || pts.length < 1) return null;
      const allPts = [...pts, cur];
      const polyPoints = allPts.map(p => `${p.x},${p.y}`).join(' ');
      const last = pts[pts.length - 1];
      return (
        <g>
          <polygon points={polyPoints} fill="rgba(59,130,246,0.1)" stroke={color} strokeWidth={sw} strokeDasharray={dash}/>
          <line x1={last.x} y1={last.y} x2={cur.x} y2={cur.y} stroke={color} strokeWidth={sw} strokeDasharray={dash} opacity={0.6}/>
          {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3/zoom} fill={color}/>)}
        </g>
      );
    }

    if (type === 'cloud')
      return <path d={cloudPath(x, y, w, h)} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={dash} />;
    if (type === 'arrow') {
      const ms = 10 / zoom;
      return (
        <g>
          <defs>
            <marker id="pah" markerWidth={ms * 3} markerHeight={ms * 3} refX={ms * 2.5} refY={ms * 1.5} orient="auto" markerUnits="userSpaceOnUse">
              <polygon points={`0 0,${ms * 3} ${ms * 1.5},0 ${ms * 3}`} fill={color} />
            </marker>
          </defs>
          <line x1={start.x} y1={start.y} x2={cur.x} y2={cur.y} stroke={color} strokeWidth={sw} markerEnd="url(#pah)" />
        </g>
      );
    }
    if (type === 'text')
      return <rect x={x} y={y} width={w} height={h} fill="rgba(59,130,246,0.08)" stroke={color} strokeWidth={sw} strokeDasharray={dash} />;
    if (type === 'callout')
      return (
        <g>
          <line x1={start.x} y1={start.y} x2={x + w / 2} y2={y + h / 2} stroke={color} strokeWidth={sw} strokeDasharray={dash} />
          <rect x={x} y={y} width={w} height={h} fill="white" fillOpacity={0.7} stroke={color} strokeWidth={sw} strokeDasharray={dash} />
        </g>
      );
    if (type === 'dimension' || type === 'distance') {
      const ddx = cur.x - start.x, ddy = cur.y - start.y;
      const len = Math.sqrt(ddx * ddx + ddy * ddy), off = 8 / zoom;
      const nx = len > 0 ? -ddy / len * off : 0, ny = len > 0 ? ddx / len * off : 0;
      return (
        <g>
          <line x1={start.x} y1={start.y} x2={cur.x} y2={cur.y} stroke={color} strokeWidth={sw} />
          <line x1={start.x - nx} y1={start.y - ny} x2={start.x + nx} y2={start.y + ny} stroke={color} strokeWidth={sw} />
          <line x1={cur.x - nx} y1={cur.y - ny} x2={cur.x + nx} y2={cur.y + ny} stroke={color} strokeWidth={sw} />
        </g>
      );
    }
    return null;
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const renderGrid = () => {
    if (!showGrid) return null;
    const g = gridSpacing, cw = canvasSize.w, ch = canvasSize.h;
    const x0 = Math.floor(-pan.x / zoom / g) * g, y0 = Math.floor(-pan.y / zoom / g) * g;
    const lines: React.ReactNode[] = [];
    for (let x = x0; x < x0 + cw / zoom + g; x += g)
      lines.push(<line key={`gx${x}`} x1={x} y1={y0} x2={x} y2={y0 + ch / zoom + g} stroke="rgba(148,163,184,0.12)" strokeWidth={1 / zoom} />);
    for (let y = y0; y < y0 + ch / zoom + g; y += g)
      lines.push(<line key={`gy${y}`} x1={x0} y1={y} x2={x0 + cw / zoom + g} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth={1 / zoom} />);
    return <g>{lines}</g>;
  };

  // ── Selection + resize handles ────────────────────────────────────────────
  const renderHandles = () => {
    if (selectedIds.length === 0) return null;
    const pad = 8 / zoom, hw = 5 / zoom;

    // Multi-select: draw individual outlines + union box, no resize handles
    if (selectedIds.length > 1) {
      const selMarkups = markups.filter(m => selectedIds.includes(m.id));
      const allBounds = selMarkups.map(m => mkBounds(m));
      const ux = Math.min(...allBounds.map(b => b.x));
      const uy = Math.min(...allBounds.map(b => b.y));
      const ux2 = Math.max(...allBounds.map(b => b.x + b.w));
      const uy2 = Math.max(...allBounds.map(b => b.y + b.h));
      return (
        <g>
          {allBounds.map((b, i) => (
            <rect key={i} x={b.x - pad/2} y={b.y - pad/2} width={b.w + pad} height={b.h + pad}
              fill="none" stroke="#60a5fa" strokeWidth={1 / zoom} strokeDasharray={`${3/zoom}`} />
          ))}
          <rect x={ux - pad} y={uy - pad} width={ux2 - ux + pad * 2} height={uy2 - uy + pad * 2}
            fill="none" stroke="#3b82f6" strokeWidth={2 / zoom} strokeDasharray={`${4 / zoom}`} />
        </g>
      );
    }

    if (!selectedMarkup) return null;
    const b   = mkBounds(selectedMarkup);
    const corners: { pos: HandlePos; x: number; y: number }[] = [
      { pos: 'tl', x: b.x - pad,       y: b.y - pad },
      { pos: 'tr', x: b.x + b.w + pad, y: b.y - pad },
      { pos: 'bl', x: b.x - pad,       y: b.y + b.h + pad },
      { pos: 'br', x: b.x + b.w + pad, y: b.y + b.h + pad },
    ];
    const canResize = RESIZABLE_TYPES.includes(selectedMarkup.type);

    // Feature 6: Rotation handle — above top-center
    const rotHx = b.x + b.w / 2;
    const rotHLineY = b.y - pad;
    const rotHY = b.y - pad - 22 / zoom;
    const rotHR = 6 / zoom;
    const rot = selectedMarkup.rotation ?? 0;

    return (
      <g transform={rot ? `rotate(${rot},${b.x + b.w/2},${b.y + b.h/2})` : undefined}>
        <rect x={b.x - pad} y={b.y - pad} width={b.w + pad * 2} height={b.h + pad * 2}
          fill="none" stroke="#3b82f6" strokeWidth={1.5 / zoom} strokeDasharray={`${4 / zoom}`} />
        {canResize && corners.map(({ pos, x, y }) => (
          <rect key={pos} data-handle={pos}
            x={x - hw} y={y - hw} width={hw * 2} height={hw * 2}
            fill="#3b82f6" stroke="white" strokeWidth={1 / zoom}
            style={{ cursor: HANDLE_CURSORS[pos], pointerEvents: 'all' }}
          />
        ))}
        {/* Rotation handle */}
        <line x1={rotHx} y1={rotHLineY} x2={rotHx} y2={rotHY}
          stroke="#8b5cf6" strokeWidth={1/zoom} strokeDasharray={`${3/zoom}`}/>
        <circle data-handle="rotate" cx={rotHx} cy={rotHY} r={rotHR}
          fill="#8b5cf6" stroke="white" strokeWidth={1/zoom}
          style={{ cursor: 'crosshair', pointerEvents: 'all' }}/>
        <text x={rotHx} y={rotHY + rotHR * 2.5} fill="#8b5cf6"
          fontSize={8/zoom} fontFamily="sans-serif" textAnchor="middle">
          {rot !== 0 ? `${Math.round(rot)}°` : '↻'}
        </text>
      </g>
    );
  };

  // ── Floating in-place text editor ─────────────────────────────────────────
  const renderTextEditor = () => {
    if (!editingId) return null;
    const m = markups.find(x => x.id === editingId);
    if (!m) return null;
    const b  = mkBounds(m);
    const sl = b.x * zoom + pan.x;
    const st = b.y * zoom + pan.y;
    const sw = Math.max(b.w * zoom, 140);
    const sh = Math.max(b.h * zoom, 32);
    return (
      <div className="absolute z-20" style={{ left: sl, top: st, width: sw, minHeight: sh }}>
        <textarea
          autoFocus
          value={editingText}
          onChange={e => setEditingText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') { setEditingId(null); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
          }}
          className="w-full bg-white border-2 border-blue-500 rounded px-2 py-1 text-slate-900 focus:outline-none resize-none"
          style={{ fontSize: Math.max((m.fontSize || 14) * zoom, 12), minHeight: sh, height: sh }}
        />
      </div>
    );
  };

  // ── Cursor ────────────────────────────────────────────────────────────────
  const cursor = isPanning.current ? 'grabbing'
    : (calibMode === 'pick1' || calibMode === 'pick2') ? 'crosshair'
    : ({
      select: 'default', pan: 'grab', zoom: 'zoom-in', 'zoom-area': 'crosshair',
      eraser: 'cell', text: 'crosshair',
    } as Record<string, string>)[tool] ?? 'crosshair';

  const inspectorTitle = selectedMarkup
    ? `${selectedMarkup.type.charAt(0).toUpperCase() + selectedMarkup.type.slice(1)} N${selectedMarkup.number}`
    : null;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div ref={workspaceRef} className="flex flex-col h-full bg-slate-900 text-slate-200 overflow-hidden select-none">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center bg-slate-950 border-b border-slate-800 shrink-0 h-9 px-2 gap-3">
        {/* Logo + breadcrumb */}
        <div className="flex items-center gap-2 shrink-0">
          <NavLink to="/" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <rect width="120" height="120" rx="16" fill="#0e1117"/>
              <g stroke="#6b7c9c" strokeWidth="4.5" strokeLinecap="round" fill="none">
                <line x1="40" y1="32" x2="110" y2="32"/><line x1="40" y1="32" x2="40" y2="80"/>
                <line x1="110" y1="32" x2="110" y2="80"/><line x1="25" y1="44" x2="40" y2="32"/>
                <line x1="95" y1="44" x2="110" y2="32"/>
              </g>
              <g stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" fill="none">
                <line x1="25" y1="44" x2="95" y2="44"/><line x1="25" y1="44" x2="25" y2="92"/>
                <line x1="95" y1="44" x2="95" y2="92"/>
              </g>
            </svg>
          </NavLink>
          <span className="text-slate-700 text-xs">/</span>
          <NavLink to="/" className="text-[11px] text-slate-400 hover:text-white transition-colors font-mono tracking-wide">Projects</NavLink>
          <span className="text-slate-700 text-xs">/</span>
          <span className="text-[11px] text-slate-300 font-mono tracking-wide truncate max-w-[160px]">Riverside Office</span>
          <span className="text-slate-700 text-xs">/</span>
          <span className="text-[11px] text-slate-500 font-mono tracking-wide">Workspace</span>
        </div>

        {/* Tabs — centered */}
        <div className="flex flex-1 justify-center">
          {(['Workspace','Review','Report','Export'] as const).map(tab => (
            <button key={tab} aria-label={tab}
              onClick={() => {
                if (tab === 'Report')    setActivePanel('report');
                else if (tab === 'Export')  setActivePanel('export');
                else if (tab === 'Review')  setActivePanel('review');
                else setActivePanel(null);
              }}
              className={`px-4 h-9 text-xs font-medium border-b-2 transition-colors ${
                (tab === 'Workspace' && !activePanel) ||
                (tab === 'Review'    && activePanel === 'review') ||
                (tab === 'Report'    && activePanel === 'report') ||
                (tab === 'Export'    && activePanel === 'export')
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}>{tab}</button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Save status */}
          <span className="text-[10px] font-mono text-green-500/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>
            Saved
          </span>
          {/* Compare */}
          <button onClick={() => setActivePanel(prev => prev === 'compare' ? null : 'compare')}
            title="Compare overlay"
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${activePanel === 'compare' ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:text-white'}`}>
            {compareImage && showCompare ? '◧ On' : '◧ Off'}
          </button>
          {/* Shortcut hint */}
          <button onClick={() => setShowShortcutOverlay(v => !v)}
            title="Keyboard shortcuts (?)"
            className="text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
            ?
          </button>
          {/* Fullscreen */}
          <button onClick={() => {
            if (isFullscreen) document.exitFullscreen();
            else workspaceRef.current?.requestFullscreen();
          }} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700">
            {isFullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>}
          </button>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 px-1 py-1 bg-slate-800 border-b border-slate-700 overflow-x-auto shrink-0">
        <TB tid="tool-select"    active={tool==='select'}    onClick={()=>activateTool('select')}    icon={<MousePointer2 size={15}/>} label="Select"/>
        <TB tid="tool-pan"       active={tool==='pan'}       onClick={()=>activateTool('pan')}       icon={<Hand size={15}/>}          label="Pan"/>
        <TB tid="tool-zoom"      active={tool==='zoom'}      onClick={()=>activateTool('zoom')}      icon={<ZoomIn size={15}/>}        label="Zoom"/>
        <TB tid="tool-fit"                                   onClick={()=>activateTool('fit')}       icon={<Maximize2 size={15}/>}     label="Fit"/>
        <TB tid="tool-zoom-area" active={tool==='zoom-area'} onClick={()=>activateTool('zoom-area')} icon={<Crosshair size={15}/>}     label="Zoom Area"/>
        <Sep/>
        <TB tid="tool-arrow"     active={tool==='arrow'}     onClick={()=>activateTool('arrow')}     icon={<ArrowUpRight size={15}/>}  label="Arrow"/>
        <TB tid="tool-cloud"     active={tool==='cloud'}     onClick={()=>activateTool('cloud')}     icon={<Cloud size={15}/>}         label="Cloud"/>
        <TB tid="tool-text"      active={tool==='text'}      onClick={()=>activateTool('text')}      icon={<Type size={15}/>}          label="Text"/>
        <TB tid="tool-box"       active={tool==='box'}       onClick={()=>activateTool('box')}       icon={<Square size={15}/>}        label="Box"/>
        <TB tid="tool-ellipse"   active={tool==='ellipse'}   onClick={()=>activateTool('ellipse')}   icon={<Circle size={15}/>}        label="Ellipse"/>
        <TB tid="tool-callout"   active={tool==='callout'}   onClick={()=>activateTool('callout')}   icon={<MessageSquare size={15}/>} label="Callout"/>
        <Sep/>
        <TB tid="tool-distance"  active={tool==='distance'}  onClick={()=>activateTool('distance')}  icon={<Minus size={15}/>}         label="Distance"/>
        <TB tid="tool-angle"     active={tool==='angle'}     onClick={()=>activateTool('angle')}     icon={<TrendingUp size={15}/>}    label="Angle"/>
        <TB tid="tool-area"      active={tool==='area'}      onClick={()=>activateTool('area')}      icon={<Hexagon size={15}/>}       label="Area"/>
        <TB tid="tool-count"     active={tool==='count'}     onClick={()=>activateTool('count')}     icon={<Hash size={15}/>}          label="Count"/>
        <Sep/>
        <TB tid="tool-note"        active={activePanel==='note'}   onClick={()=>activateTool('note')}        icon={<StickyNote size={15}/>}    label="Note"/>
        <TB tid="tool-photo"       active={activePanel==='photo'}  onClick={()=>activateTool('photo')}       icon={<Camera size={15}/>}        label="Photo"/>
        <TB tid="tool-file"        active={activePanel==='file'}   onClick={()=>activateTool('file')}        icon={<FileText size={15}/>}      label="File"/>
        <TB tid="tool-link"        active={activePanel==='link'}   onClick={()=>activateTool('link')}        icon={<Link size={15}/>}           label="Link"/>
        <TB tid="tool-stamps"      active={activePanel==='stamps'} onClick={()=>activateTool('stamps')}      icon={<Stamp size={15}/>}         label="Stamps"/>
        <Sep/>
        <TB tid="tool-highlighter" active={tool==='highlighter'}  onClick={()=>activateTool('highlighter')} icon={<Highlighter size={15}/>}   label="Highlighter"/>
        <TB tid="tool-pen"         active={tool==='pen'}          onClick={()=>activateTool('pen')}         icon={<PenLine size={15}/>}       label="Pen"/>
        <TB tid="tool-polyline"    active={tool==='polyline'}     onClick={()=>activateTool('polyline')}    icon={<Spline size={15}/>}        label="Polyline"/>
        <TB tid="tool-eraser"      active={tool==='eraser'}       onClick={()=>activateTool('eraser')}      icon={<Eraser size={15}/>}        label="Eraser"/>
        <Sep/>
        <TB tid="tool-color" active={activePanel==='color'} onClick={()=>activateTool('color')}
          icon={<div className="w-4 h-4 rounded-full border-2 border-slate-400 shrink-0" style={{background:color}}/>} label="Color"/>
        <Sep/>
        <TB tid="tool-layers" toggle={showLayers}            onClick={()=>activateTool('layers')} icon={<Layers size={15}/>}     label="Layers"/>
        <TB tid="tool-scale"  active={activePanel==='scale'} onClick={()=>activateTool('scale')}  icon={<Ruler size={15}/>}      label="Scale"/>
        <TB tid="tool-grid"   toggle={showGrid}              onClick={()=>activateTool('grid')}   icon={<LayoutGrid size={15}/>} label="Grid"/>
        <TB tid="tool-snap"   toggle={snapEnabled}           onClick={()=>activateTool('snap')}   icon={<Magnet size={15}/>}     label="Snap"/>
        <Sep/>
        <TB tid="tool-undo" onClick={()=>activateTool('undo')} icon={<Undo2 size={15}/>}          label="Undo"/>
        <TB tid="tool-redo" onClick={()=>activateTool('redo')} icon={<Redo2 size={15}/>}          label="Redo"/>
        <Sep/>
        <div className="relative">
          <TB tid="tool-more" toggle={showMoreMenu} onClick={()=>setShowMoreMenu(v=>!v)} icon={<MoreHorizontal size={15}/>} label="More"/>
          {showMoreMenu && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl py-1 w-52"
              onPointerDown={e => e.stopPropagation()}>
              <button onClick={() => { generateMarkupReport(markups, projectId); setShowMoreMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-700">
                <FileText size={11}/> Generate Report
              </button>
              <button onClick={() => { exportMarkupsCsv(markups); setShowMoreMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-700">
                <Download size={11}/> Export Markup CSV
              </button>
              <button onClick={() => { fitView(); setShowMoreMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-700">
                <Maximize2 size={11}/> Fit to View
              </button>
              <div className="border-t border-slate-700 my-1"/>
              <button onClick={() => {
                if (window.confirm('Clear all markups on this board?')) {
                  updateMarkups(activeBoardId, () => []);
                  setSelectedId(null);
                }
                setShowMoreMenu(false);
              }} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-900/30">
                <Trash2 size={11}/> Clear Markups
              </button>
            </div>
          )}
        </div>

        <div className="ml-auto shrink-0 pr-2 flex items-center gap-2 text-[10px] text-slate-400">
          <span data-testid="status-message" data-active-tool={TOOL_NAMES[tool] ?? tool}>
            {TOOL_NAMES[tool] ?? tool}
            {editingId && ' · Editing'}
            {(calibMode === 'pick1' || calibMode === 'pick2') && ' · Click 2 calibration points'}
          </span>
          <span className="text-slate-600">·</span>
          {zoomInputActive ? (
            <input
              autoFocus
              type="number"
              value={zoomInputStr}
              onChange={e => setZoomInputStr(e.target.value)}
              onBlur={() => {
                const v = parseFloat(zoomInputStr);
                if (!isNaN(v) && v > 0) setZoom(Math.min(Math.max(v / 100, 0.05), 10));
                setZoomInputActive(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const v = parseFloat(zoomInputStr);
                  if (!isNaN(v) && v > 0) setZoom(Math.min(Math.max(v / 100, 0.05), 10));
                  setZoomInputActive(false);
                }
                if (e.key === 'Escape') setZoomInputActive(false);
              }}
              className="w-14 bg-slate-700 border border-blue-500 rounded px-1 text-white text-[10px] text-center focus:outline-none"
            />
          ) : (
            <button
              title="Click to set zoom %"
              onClick={() => { setZoomInputStr(String(Math.round(zoom * 100))); setZoomInputActive(true); }}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded px-1.5 py-0.5 text-white text-[10px] font-mono min-w-[42px]">
              {Math.round(zoom * 100)}%
            </button>
          )}
        </div>
      </div>

      {/* ── Context / properties toolbar ─────────────────────────────── */}
      <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-850 border-b border-slate-700/80 text-[10px] text-slate-400 shrink-0 min-h-[26px] overflow-x-auto" style={{background:'#0f172a'}}>
        {/* Text / callout: font family + size */}
        {(tool === 'text' || tool === 'callout') && (<>
          <span className="text-slate-500 shrink-0">Font:</span>
          <select value={ctxFontFamily} onChange={e => setCtxFontFamily(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded px-1 py-0 text-slate-200 focus:outline-none text-[10px] h-5">
            {['sans-serif','serif','monospace','Georgia','Arial','Courier New','Impact'].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <span className="text-slate-500 shrink-0">Size:</span>
          <select value={ctxFontSize} onChange={e => setCtxFontSize(Number(e.target.value))}
            className="bg-slate-700 border border-slate-600 rounded px-1 py-0 text-slate-200 focus:outline-none text-[10px] h-5 w-16">
            {[8,10,12,14,16,18,20,24,28,32,36,48].map(s => <option key={s} value={s}>{s}pt</option>)}
          </select>
        </>)}

        {/* Fill color — for ellipse / box / area tools */}
        {['ellipse','box','area'].includes(tool) && (<>
          <span className="text-slate-500 shrink-0">Fill:</span>
          <button onClick={() => setFillColor('transparent')}
            className={`w-4 h-4 rounded border text-[8px] flex items-center justify-center shrink-0 ${fillColor==='transparent' ? 'border-white' : 'border-slate-600'}`}
            style={{background:'transparent'}} title="No fill">
            <span className="text-slate-400">∅</span>
          </button>
          {COLORS.slice(0,7).map(c => (
            <button key={c} onClick={() => setFillColor(c)}
              className={`w-4 h-4 rounded-full border shrink-0 ${fillColor===c ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'}`}
              style={{background:c}}/>
          ))}
          <input type="color" value={fillColor === 'transparent' ? '#3b82f6' : fillColor}
            onChange={e => setFillColor(e.target.value)}
            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0" title="Custom fill"/>
          <span className="text-slate-600 shrink-0">|</span>
        </>)}

        {/* Drawing tools: stroke width + dash style */}
        {['arrow','cloud','box','ellipse','pen','highlighter','dimension','distance','polyline'].includes(tool) && (<>
          <span className="text-slate-500 shrink-0">Stroke:</span>
          <input type="range" min={1} max={16} step={0.5} value={ctxStrokeWidth}
            onChange={e => setCtxStrokeWidth(Number(e.target.value))}
            className="w-20 accent-blue-500 h-1.5 shrink-0"/>
          <span className="font-mono text-slate-300 shrink-0">{ctxStrokeWidth}px</span>
          <span className="text-slate-600 shrink-0">|</span>
          {(['solid','dashed','dotted'] as const).map(ds => (
            <button key={ds} onClick={() => setCtxDashStyle(ds)}
              className={`px-1.5 py-0 rounded border text-[10px] capitalize shrink-0 ${ctxDashStyle===ds ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}>
              {ds}
            </button>
          ))}
        </>)}

        {/* Selected markup: quick color swatches */}
        {selectedMarkup && tool === 'select' && (<>
          <span className="text-slate-500 shrink-0">Color:</span>
          {COLORS.slice(0,7).map(c => (
            <button key={c} onClick={() => setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => m.id===selectedId ? {...m, color: c} : m) }))}
              className={`w-4 h-4 rounded-full border shrink-0 ${selectedMarkup.color===c ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'}`}
              style={{background:c}}/>
          ))}
          <input type="color" value={selectedMarkup.color}
            onChange={e => setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => m.id===selectedId ? {...m, color: e.target.value} : m) }))}
            className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0" title="Custom color"/>
          <span className="text-slate-600 shrink-0">|</span>
          <span className="text-slate-500 shrink-0">Stroke:</span>
          <input type="range" min={1} max={16} step={0.5} value={selectedMarkup.strokeWidth}
            onChange={e => setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => m.id===selectedId ? {...m, strokeWidth: Number(e.target.value)} : m) }))}
            className="w-16 accent-blue-500 h-1.5 shrink-0"/>
          <span className="font-mono text-slate-300 shrink-0">{selectedMarkup.strokeWidth}px</span>
        </>)}

        {/* Feature 15: PDF page navigation */}
        {pdfTotalPages > 1 && (<>
          <span className="text-slate-500 shrink-0">Page:</span>
          <button onClick={() => setPdfPageNum(p => Math.max(1, p - 1))} disabled={pdfPageNum <= 1}
            className="px-1.5 py-0 rounded border border-slate-600 text-slate-400 hover:text-white disabled:opacity-30 text-[10px]">◀</button>
          <span className="font-mono text-slate-300 shrink-0">{pdfPageNum} / {pdfTotalPages}</span>
          <button onClick={() => setPdfPageNum(p => Math.min(pdfTotalPages, p + 1))} disabled={pdfPageNum >= pdfTotalPages}
            className="px-1.5 py-0 rounded border border-slate-600 text-slate-400 hover:text-white disabled:opacity-30 text-[10px]">▶</button>
          <span className="text-slate-600 shrink-0">|</span>
        </>)}

        {/* Empty fallback */}
        {!['text','callout','arrow','cloud','box','pen','highlighter','dimension','distance'].includes(tool) && !selectedMarkup && pdfTotalPages <= 1 && (
          <span className="text-slate-700 italic">Select a tool or markup to see properties</span>
        )}
      </div>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Module rail ── app-level navigation ───────────────────────── */}
        <div className="w-10 shrink-0 flex flex-col bg-slate-950 border-r border-slate-800">
          <div className="flex-1 flex flex-col items-center py-2 gap-1">
            {[
              { to: '/dashboard', icon: <Home size={15}/>,    label: 'Dashboard',       shortcut: 'D' },
              { to: '/steel',     icon: <Frame size={15}/>,   label: 'Steel Design',    shortcut: 'S' },
              { to: '/concrete',  icon: <Layers size={15}/>,  label: 'Concrete Design', shortcut: 'C' },
              { to: '/loads',     icon: <Wind size={15}/>,    label: 'Loads',           shortcut: 'L' },
              { to: '/documents', icon: <FileText size={15}/>,label: 'Documents',       shortcut: null },
              { to: '/variables', icon: <Database size={15}/>,label: 'Variables',       shortcut: null },
            ].map(item => (
              <NavLink key={item.to} to={item.to}
                title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                className={({ isActive }) =>
                  `w-8 h-8 flex items-center justify-center rounded transition-colors ${isActive ? 'bg-blue-600/30 text-blue-300' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`
                }>
                {item.icon}
              </NavLink>
            ))}
          </div>
          <div className="shrink-0 flex flex-col items-center pb-2 gap-1 border-t border-slate-800 pt-2">
            <NavLink to="/settings"
              title="Settings"
              className={({ isActive }) =>
                `w-8 h-8 flex items-center justify-center rounded transition-colors ${isActive ? 'bg-blue-600/30 text-blue-300' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}`
              }>
              <Settings size={15}/>
            </NavLink>
          </div>
        </div>

        {/* ── Left panel ─────────────────────────────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col bg-slate-800 border-r border-slate-700 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Boards</span>
              <button aria-label="Add board" onClick={() => setShowAddBoard(v => !v)} className={`text-slate-400 hover:text-white transition-colors ${showAddBoard ? 'text-blue-400' : ''}`}><Plus size={13}/></button>
            </div>
            {showAddBoard && (
              <div className="px-3 py-2 bg-slate-750 border-b border-slate-700 space-y-1.5">
                <input autoFocus value={newBoardName} onChange={e => setNewBoardName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addBoard(); if (e.key === 'Escape') setShowAddBoard(false); }}
                  placeholder="Board name…"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                <select value={newBoardParent} onChange={e => setNewBoardParent(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                  {boardTree.filter(b => b.parentId === null).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <div className="flex gap-1.5">
                  <button onClick={addBoard}
                    className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs">Add</button>
                  <button onClick={() => setShowAddBoard(false)}
                    className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs">Cancel</button>
                </div>
              </div>
            )}
            <div className="py-1 text-xs">
              {boardTree.filter(b => b.parentId === null).map(cat => {
                const children = boardTree.filter(b => b.parentId === cat.id);
                const isOpen = expanded.has(cat.id);
                return (
                  <div key={cat.id}>
                    <button aria-label={cat.name}
                      onClick={() => setExpanded(prev => { const s = new Set(prev); s.has(cat.id) ? s.delete(cat.id) : s.add(cat.id); return s; })}
                      className="flex items-center gap-1.5 w-full px-3 py-1.5 text-slate-300 hover:bg-slate-700 hover:text-white">
                      {isOpen ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
                      <span className="font-medium truncate">{cat.name}</span>
                    </button>
                    {isOpen && children.map(child => (
                      <button key={child.id} aria-label={child.name} onClick={() => setActiveBoardId(child.id)}
                        className={`flex items-center w-full pl-7 pr-3 py-1 transition-colors ${
                          activeBoardId === child.id ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}>
                        <span className="truncate">{child.name}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {showLayers && (
            <div className="border-t border-slate-700 shrink-0">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Layers</span>
                <button onClick={addLayer} title="Add layer" className="text-slate-400 hover:text-white"><Plus size={11}/></button>
              </div>
              {layers.map(l => (
                <div key={l.id} className="group flex items-center gap-2 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">
                  <button onClick={() => setLayers(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x))} className="text-slate-400 hover:text-white shrink-0">
                    {l.visible ? <Eye size={11}/> : <EyeOff size={11}/>}
                  </button>
                  {renamingLayerId === l.id ? (
                    <input autoFocus value={renameLayerText}
                      onChange={e => setRenameLayerText(e.target.value)}
                      onBlur={() => commitRenameLayer(l.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRenameLayer(l.id); if (e.key === 'Escape') setRenamingLayerId(null); }}
                      className="flex-1 bg-slate-600 border border-slate-500 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-blue-500"/>
                  ) : (
                    <span className="flex-1 truncate cursor-pointer"
                      onDoubleClick={() => { setRenamingLayerId(l.id); setRenameLayerText(l.name); }}>
                      {l.name}
                    </span>
                  )}
                  {layers.length > 1 && (
                    <button onClick={() => setLayers(prev => prev.filter(x => x.id !== l.id))}
                      title="Delete layer"
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <X size={10}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Feature 16: PDF page thumbnail strip */}
          {pdfTotalPages > 1 && (
            <div className="border-t border-slate-700 shrink-0">
              <button
                onClick={() => setShowPdfPages(v => !v)}
                className="flex items-center justify-between w-full px-3 py-2 text-slate-400 hover:text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pages ({pdfTotalPages})</span>
                {showPdfPages ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
              </button>
              {showPdfPages && (
                <div className="max-h-52 overflow-y-auto px-2 pb-2 grid grid-cols-2 gap-1.5">
                  {pdfThumbnails.map((thumb, i) => (
                    <button key={i} onClick={() => setPdfPageNum(i + 1)}
                      className={`relative rounded overflow-hidden border-2 transition-colors bg-slate-700 ${pdfPageNum === i + 1 ? 'border-blue-500' : 'border-transparent hover:border-slate-500'}`}>
                      <img src={thumb} alt={`Page ${i + 1}`} className="w-full h-auto block"/>
                      <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded">{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Canvas + schedule ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={containerRef} data-testid="plan-canvas"
            className="flex-1 overflow-hidden relative"
            style={{ cursor, background: '#1e293b', transform: 'translateZ(0)', isolation: 'isolate' }}
            onPointerDown={e => { if (polylineMenu) { setPolylineMenu(null); return; } onPointerDown(e); }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={() => { isDrawing.current = false; isPanning.current = false; setPreview(null); }}
            onDoubleClick={onDoubleClick}
            onContextMenu={onContextMenu}
            onWheel={onWheel}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleBgFile(f); }}
            onDragEnter={e => e.preventDefault()}
          >
            <svg width={canvasSize.w} height={canvasSize.h} className="absolute inset-0" overflow="visible">
              <g data-testid="plan-transform"
                data-plan-pan-x={String(pan.x)} data-plan-pan-y={String(pan.y)} data-plan-zoom={String(zoom)}
                transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                {renderGrid()}
                {bgImage
                  ? <image href={bgImage} x={0} y={0} width={bgSize.w} height={bgSize.h}/>
                  : <rect x={0} y={0} width={1200} height={900} fill="#334155" rx={4}/>
                }
                {/* Feature 18: Compare overlay */}
                {showCompare && compareImage && (
                  <image href={compareImage} x={0} y={0} width={bgSize.w} height={bgSize.h}
                    opacity={compareOpacity} style={{ pointerEvents: 'none' as const }}/>
                )}
                {markups.map(m => renderMarkup(m))}
                {renderPreview()}
                {renderHandles()}

                {/* Feature 4: Calibration point visuals */}
                {calibPts.length >= 1 && (
                  <g>
                    <circle cx={calibPts[0].x} cy={calibPts[0].y} r={7/zoom} fill="none" stroke="#f59e0b" strokeWidth={2/zoom}/>
                    <circle cx={calibPts[0].x} cy={calibPts[0].y} r={2/zoom} fill="#f59e0b"/>
                    {calibPts.length >= 2 && (<>
                      <line x1={calibPts[0].x} y1={calibPts[0].y} x2={calibPts[1].x} y2={calibPts[1].y}
                        stroke="#f59e0b" strokeWidth={1.5/zoom} strokeDasharray={`${5/zoom}`}/>
                      <circle cx={calibPts[1].x} cy={calibPts[1].y} r={7/zoom} fill="none" stroke="#f59e0b" strokeWidth={2/zoom}/>
                      <circle cx={calibPts[1].x} cy={calibPts[1].y} r={2/zoom} fill="#f59e0b"/>
                    </>)}
                  </g>
                )}
              </g>
            </svg>

            {/* Feature 4: Calibration mode banner */}
            {(calibMode === 'pick1' || calibMode === 'pick2') && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-amber-600 text-white text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/70 animate-pulse inline-block"/>
                  {calibMode === 'pick1' ? 'Click first calibration point' : 'Click second calibration point'}
                </div>
              </div>
            )}

            {/* Drawing tool hint banner */}
            {(tool === 'polyline' || tool === 'area') && !preview && calibMode === 'idle' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2">
                  Click to place first point
                </div>
              </div>
            )}
            {(tool === 'polyline' || tool === 'area') && preview && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block"/>
                  Click to add points · Right-click to complete or cancel · Esc to cancel
                </div>
              </div>
            )}
            {tool === 'angle' && !preview && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2">
                  Click to set vertex point
                </div>
              </div>
            )}
            {tool === 'angle' && preview?.type === 'angle' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <div className="bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-full shadow-lg font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block"/>
                  {(preview.pts?.length ?? 0) <= 1 ? 'Click first arm point' : 'Click second arm point · Esc to cancel'}
                </div>
              </div>
            )}

            {/* Feature 3: Cursor coordinates status bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-3 py-0.5 bg-slate-900/80 text-[10px] text-slate-400 pointer-events-none z-10 border-t border-slate-700/40 backdrop-blur-sm">
              {cursorPt ? (<>
                <span>X: <span className="font-mono text-slate-300">{cursorPt.x}</span></span>
                <span>Y: <span className="font-mono text-slate-300">{cursorPt.y}</span></span>
              </>) : <span className="text-slate-600">Move cursor over canvas</span>}
              <span className="text-slate-700">·</span>
              <span>{markups.length} markup{markups.length !== 1 ? 's' : ''}</span>
              {markups.filter(m => m.type === 'count').length > 0 && (
                <span className="text-purple-400 text-[9px]">
                  ● Count: {markups.filter(m => m.type === 'count').length}
                </span>
              )}
              <span className="ml-auto font-mono">{Math.round(zoom * 100)}%</span>
              {calibRatio !== null && (
                <span className="text-green-400 text-[9px]">● Calibrated ({calibUnit})</span>
              )}
            </div>

            {!bgImage && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-slate-500">
                  <Upload size={28} className="mx-auto mb-2 opacity-30"/>
                  <p className="text-sm">Drop an image or PDF here</p>
                  <p className="text-xs mt-1 opacity-50">JPG · PNG · PDF (page 1)</p>
                </div>
              </div>
            )}

            {/* In-place text editor overlay */}
            {renderTextEditor()}

            {/* Polyline / area right-click menu */}
            {polylineMenu && (
              <div className="absolute z-50" style={{ left: polylineMenu.x, top: polylineMenu.y }}
                onPointerDown={e => e.stopPropagation()}
                onContextMenu={e => e.preventDefault()}>
                <div className="bg-slate-800 border border-slate-600 rounded shadow-xl overflow-hidden min-w-[130px]">
                  <button onClick={finishPolylineOrArea}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 text-left">
                    <span className="text-green-400 font-bold">✓</span> Complete
                  </button>
                  <div className="border-t border-slate-700"/>
                  <button onClick={cancelPolylineOrArea}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-slate-400 hover:bg-slate-700 text-left">
                    <span className="text-slate-500">✕</span> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ⌘K command palette */}
            {showCmdBar && (
              <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
                <div className="pointer-events-auto w-[480px] bg-slate-900 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
                    <Search size={15} className="text-slate-400 shrink-0"/>
                    <input
                      autoFocus
                      value={cmdInput}
                      onChange={e => setCmdInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); executeCommand(cmdInput); }
                        if (e.key === 'Escape') { setShowCmdBar(false); setCmdInput(''); }
                      }}
                      placeholder="Search tools, commands… (Esc to close)"
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-600"
                    />
                    <kbd className="text-[10px] font-mono bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400">Esc</kbd>
                  </div>
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tools</div>
                    <div className="flex gap-1 flex-wrap">
                      {['select','arrow','cloud','box','text','pen','highlighter','polyline','ellipse','callout','dimension','distance','area','count','note','photo','file'].map(cmd => (
                        <button key={cmd} onClick={() => executeCommand(cmd)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-slate-700 transition-colors">
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Actions</div>
                    <div className="flex gap-1 flex-wrap">
                      {['fit','grid','snap','undo','redo','calibrate','pan','zoom'].map(cmd => (
                        <button key={cmd} onClick={() => executeCommand(cmd)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 border border-slate-700 transition-colors">
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ? shortcut overlay */}
            {showShortcutOverlay && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => setShowShortcutOverlay(false)}>
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-[560px] max-h-[80vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-200">Keyboard Shortcuts</span>
                    <button onClick={() => setShowShortcutOverlay(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {[
                      ['V', 'Select tool'],
                      ['H', 'Pan tool'],
                      ['Z', 'Zoom tool'],
                      ['A', 'Arrow markup'],
                      ['C', 'Cloud markup'],
                      ['T', 'Text markup'],
                      ['B', 'Box markup'],
                      ['E', 'Ellipse markup'],
                      ['P', 'Pen / freehand'],
                      ['D', 'Dimension'],
                      ['N', 'Note'],
                      ['⌘Z / Ctrl+Z', 'Undo'],
                      ['⌘⇧Z / Ctrl+Y', 'Redo'],
                      ['Delete / Backspace', 'Delete selected'],
                      ['Escape', 'Deselect / cancel'],
                      ['⌘K', 'Command palette'],
                      ['?', 'This shortcut list'],
                      ['Space + drag', 'Pan canvas'],
                      ['Scroll wheel', 'Zoom in/out'],
                      ['F', 'Fit to view'],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-800">
                        <span className="text-xs text-slate-400">{desc}</span>
                        <kbd className="text-[10px] font-mono bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 ml-2 shrink-0">{key}</kbd>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-600 font-mono text-center">Press ? or click outside to close</p>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleBgFile(e.target.files[0])}/>
            {/* Feature 18: Compare image upload */}
            <input ref={compareInputRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const img = new window.Image();
                  img.onload = () => setCompareImage(ev.target!.result as string);
                  img.src = ev.target!.result as string;
                };
                reader.readAsDataURL(f);
                setShowCompare(true);
              }}/>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => { if (ev.target?.result) placeImageOnCanvas(ev.target.result as string); };
                reader.readAsDataURL(f);
              }}/>
            <input ref={photoLibInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  if (ev.target?.result) {
                    setSitePhotos(prev => [...prev, {
                      id: `ph${Date.now()}`, name: f.name,
                      data: ev.target!.result as string,
                      createdAt: new Date().toISOString(),
                    }]);
                  }
                };
                reader.readAsDataURL(f);
                e.target.value = '';
              }}/>
          </div>

          {/* Bottom strip: markup schedule + relationship map */}
          <div className="h-44 shrink-0 border-t border-slate-700 flex overflow-hidden">
          <div className="flex-1 bg-slate-800 overflow-auto">
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Markup Schedule
                <span className="normal-case font-normal text-slate-500 ml-1">
                  ({scheduleSearch ? `${markups.filter(m => { const q = scheduleSearch.toLowerCase(); return m.text.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || m.status.toLowerCase().includes(q); }).length} of ${markups.length}` : markups.length})
                </span>
              </span>
              <div className="flex gap-2 items-center">
                {/* Feature 19: Search toggle */}
                <button onClick={() => { setShowScheduleSearch(v => !v); if (showScheduleSearch) setScheduleSearch(''); }}
                  title="Search markups"
                  className={`transition-colors ${showScheduleSearch ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                  <Search size={11}/>
                </button>
                <button aria-label="Reset active board"
                  onClick={() => { updateMarkups(activeBoardId, () => activeBoardId === 'b1' ? SEED : []); setSelectedId(null); }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"><RefreshCw size={11}/> Reset</button>
                {selectedId && (
                  <button onClick={() => { updateMarkups(activeBoardId, p => p.filter(m => m.id !== selectedId)); setSelectedId(null); }}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={11}/> Delete</button>
                )}
              </div>
            </div>
            {/* Feature 19: Search input */}
            {showScheduleSearch && (
              <div className="px-3 py-1.5 border-b border-slate-700 sticky top-[31px] bg-slate-800 z-10">
                <input
                  autoFocus
                  value={scheduleSearch}
                  onChange={e => setScheduleSearch(e.target.value)}
                  placeholder="Filter by label, type, status…"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
            {(() => {
              const q = scheduleSearch.toLowerCase().trim();
              const filtered = q
                ? markups.filter(m =>
                    m.text.toLowerCase().includes(q) ||
                    m.type.toLowerCase().includes(q) ||
                    m.status.toLowerCase().includes(q) ||
                    STATUS_CFG[m.status].label.toLowerCase().includes(q)
                  )
                : markups;
              return filtered.length === 0
                ? <div className="px-4 py-6 text-xs text-slate-500 text-center">
                    {markups.length === 0 ? 'No markups yet. Draw on the canvas to start.' : 'No markups match the filter.'}
                  </div>
                : (
                  <table className="w-full text-xs">
                    <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-1 text-left w-8">#</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Label</th>
                        <th className="px-2 py-1 text-left">Status</th>
                        <th className="px-2 py-1 text-left">Priority</th>
                        <th className="px-2 py-1 text-left">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(m => (
                        <tr key={m.id} onClick={() => setSelectedId(m.id)}
                          className={`border-b border-slate-700/40 cursor-pointer transition-colors ${m.id === selectedId ? 'bg-blue-600/20' : 'hover:bg-slate-700/40'}`}>
                          <td className="px-4 py-1">
                            <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold text-white" style={{background:m.color}}>{m.number}</span>
                          </td>
                          <td className="px-2 py-1 capitalize text-slate-300">{m.type}</td>
                          <td className="px-2 py-1 text-slate-300 max-w-[180px] truncate">{m.text || '—'}</td>
                          <td className="px-2 py-1"><span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CFG[m.status].cls}`}>{STATUS_CFG[m.status].label}</span></td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${PRI_CFG[m.priority].dot}`}/>
                              <span className="text-slate-400">{PRI_CFG[m.priority].label}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
            })()}
          </div>{/* end schedule flex-1 */}
          <div className="w-72 shrink-0 border-l border-slate-700">
            <RelationshipMap
              graph={boardGraphs[activeBoardId] ?? { nodes: [], edges: [] }}
              onChange={g => setBoardGraphs(prev => ({ ...prev, [activeBoardId]: g }))}
              boardNames={Object.fromEntries(boardTree.filter(b => b.parentId !== null).map(b => [b.id, b.name]))}
              activeBoardId={activeBoardId}
            />
          </div>
          </div>{/* end bottom strip flex */}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        {showInspector && (
          <div className="w-60 shrink-0 flex flex-col bg-slate-800 border-l border-slate-700 overflow-hidden">
            <div className="border-b border-slate-700 shrink-0">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Site Photos</span>
                <div className="flex gap-1">
                  <button
                    aria-label="Filter linked photos"
                    title={photoFilterLinked ? 'Show all photos' : 'Show only linked photos'}
                    onClick={() => setPhotoFilterLinked(v => !v)}
                    className={`p-0.5 transition-colors ${photoFilterLinked ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                    <Filter size={11}/>
                  </button>
                  <button onClick={() => photoLibInputRef.current?.click()} title="Add photo to library"
                    className="p-0.5 text-slate-400 hover:text-white"><Plus size={11}/></button>
                  <button aria-label="Collapse photos panel" onClick={() => setShowInspector(false)} className="text-slate-400 hover:text-white p-0.5"><ChevronLeft size={11}/></button>
                </div>
              </div>
              {(() => {
                const photos = photoFilterLinked && selectedMarkup
                  ? sitePhotos.filter(p => selectedMarkup.linkedPhotoIds?.includes(p.id))
                  : sitePhotos;
                return photos.length === 0 ? (
                  <div className="px-3 pb-2 text-[10px] text-slate-600 text-center py-2">
                    {photoFilterLinked ? 'No linked photos.' : 'No photos yet. Click + to add.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 px-2 pb-1">
                    {photos.slice(0, 6).map(p => (
                      <div key={p.id}
                        onClick={() => setActivePanel('photo-library')}
                        className="aspect-square rounded bg-slate-700 overflow-hidden cursor-pointer hover:ring-2 ring-blue-500">
                        <img src={p.data} alt={p.name} className="w-full h-full object-cover"/>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {sitePhotos.length > 0 && (
                <div className="px-3 pb-2">
                  <button aria-label={`View all photos (${sitePhotos.length})`} data-testid="view-all-photos"
                    onClick={() => setActivePanel('photo-library')}
                    className="text-[10px] text-blue-400 hover:text-blue-300 w-full text-left">
                    View all photos ({sitePhotos.length})
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inspector</span>
                {selectedMarkup && <button onClick={() => setSelectedId(null)} className="text-slate-500 hover:text-white"><X size={11}/></button>}
              </div>

              {selectedIds.length > 1 ? (
                <div className="p-3 space-y-3">
                  <p className="text-sm font-semibold text-slate-100">{selectedIds.length} markups selected</p>
                  <p className="text-xs text-slate-400">Drag to move all together. Use Delete to remove all.</p>
                  <div className="flex gap-1 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} title={c}
                        onClick={() => setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => selectedIds.includes(m.id) ? {...m, color: c} : m) }))}
                        className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white transition-transform hover:scale-110" style={{background:c}}/>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Status — apply to all</label>
                    <select onChange={e => setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => selectedIds.includes(m.id) ? {...m, status: e.target.value as MarkupStatus} : m) }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      <option value="">— choose —</option>
                      {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  {/* Feature 13: Align & distribute */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Align</label>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        ['left',     '⬛▫▫', 'Align Left'],
                        ['center-h', '▫⬛▫', 'Center H'],
                        ['right',    '▫▫⬛', 'Align Right'],
                        ['top',      '⬛▫▫', 'Align Top'],
                        ['center-v', '▫⬛▫', 'Center V'],
                        ['bottom',   '▫▫⬛', 'Align Bottom'],
                      ] as [string, string, string][]).map(([mode, , label]) => (
                        <button key={mode} onClick={() => alignMarkups(mode)}
                          className="py-1 rounded text-[10px] border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white transition-colors truncate"
                          title={label}>{label}</button>
                      ))}
                    </div>
                    <label className="block text-[10px] text-slate-500 mb-1 mt-2 uppercase tracking-wide">Distribute</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button onClick={() => alignMarkups('dist-h')}
                        className="py-1 rounded text-[10px] border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white">
                        ↔ H-Space
                      </button>
                      <button onClick={() => alignMarkups('dist-v')}
                        className="py-1 rounded text-[10px] border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white">
                        ↕ V-Space
                      </button>
                    </div>
                  </div>

                  <button onClick={() => { const toDelete = new Set(selectedIds); updateMarkups(activeBoardId, p => p.filter(m => !toDelete.has(m.id))); clearSelection(); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                    <Trash2 size={11}/> Delete all {selectedIds.length}
                  </button>
                </div>
              ) : !selectedMarkup ? (
                <div className="px-4 py-6 text-xs text-slate-500 text-center">
                  Select a markup to inspect.<br/>
                  <span className="opacity-60">Shift+click to multi-select. Double-click text to edit.</span>
                </div>
              ) : (() => {
                const b = mkBounds(selectedMarkup);
                const upd = (patch: Partial<Markup>) =>
                  setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => m.id===selectedId ? {...m,...patch} : m) }));
                return (
                <div className="p-3 space-y-3">
                  <p data-testid="inspector-title" className="text-sm font-semibold text-slate-100">{inspectorTitle}</p>

                  {/* Position & size readout */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-slate-700/60 rounded px-2 py-1">
                      <span className="text-slate-500 block uppercase tracking-wide">X</span>
                      <span className="text-slate-200 font-mono">{Math.round(b.x)}</span>
                    </div>
                    <div className="bg-slate-700/60 rounded px-2 py-1">
                      <span className="text-slate-500 block uppercase tracking-wide">Y</span>
                      <span className="text-slate-200 font-mono">{Math.round(b.y)}</span>
                    </div>
                    <div className="bg-slate-700/60 rounded px-2 py-1">
                      <span className="text-slate-500 block uppercase tracking-wide">W</span>
                      <span className="text-slate-200 font-mono">{Math.round(b.w)}</span>
                    </div>
                    <div className="bg-slate-700/60 rounded px-2 py-1">
                      <span className="text-slate-500 block uppercase tracking-wide">H</span>
                      <span className="text-slate-200 font-mono">{Math.round(b.h)}</span>
                    </div>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Label</label>
                    <input value={selectedMarkup.text} onChange={e => upd({ text: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="Add label…"/>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Color</label>
                    <div className="flex gap-1.5 flex-wrap items-center">
                      {COLORS.map(c => (
                        <button key={c} onClick={() => upd({ color: c })}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedMarkup.color===c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{background:c}}/>
                      ))}
                      <input type="color" value={selectedMarkup.color} onChange={e => upd({ color: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0" title="Custom color"/>
                    </div>
                  </div>

                  {/* Feature 20: Fill color — for box / ellipse / area */}
                  {['box','ellipse','area'].includes(selectedMarkup.type) && (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Fill Color</label>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <button onClick={() => upd({ fillColor: 'transparent' })}
                          title="No fill"
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[8px] ${!selectedMarkup.fillColor || selectedMarkup.fillColor === 'transparent' ? 'border-white text-slate-300' : 'border-transparent text-slate-500'}`}
                          style={{background:'transparent'}}>∅</button>
                        {COLORS.slice(0,7).map(c => (
                          <button key={c} onClick={() => upd({ fillColor: c })}
                            className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${selectedMarkup.fillColor===c ? 'border-white scale-110' : 'border-transparent'}`}
                            style={{background:c}}/>
                        ))}
                        <input type="color"
                          value={selectedMarkup.fillColor && selectedMarkup.fillColor !== 'transparent' ? selectedMarkup.fillColor : '#3b82f6'}
                          onChange={e => upd({ fillColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0" title="Custom fill"/>
                      </div>
                    </div>
                  )}

                  {/* Stroke width */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="uppercase tracking-wide">Stroke Width</span>
                      <span className="text-slate-300 font-mono">{selectedMarkup.strokeWidth}px</span>
                    </div>
                    <input type="range" min={1} max={12} step={0.5} value={selectedMarkup.strokeWidth}
                      onChange={e => upd({ strokeWidth: Number(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5"/>
                  </div>

                  {/* Opacity */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span className="uppercase tracking-wide">Opacity</span>
                      <span className="text-slate-300 font-mono">{Math.round((selectedMarkup.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input type="range" min={0.1} max={1} step={0.05} value={selectedMarkup.opacity ?? 1}
                      onChange={e => upd({ opacity: Number(e.target.value) })}
                      className="w-full accent-blue-500 h-1.5"/>
                  </div>

                  {/* Font size — text types only */}
                  {['text','callout','box','cloud'].includes(selectedMarkup.type) && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span className="uppercase tracking-wide">Font Size</span>
                        <span className="text-slate-300 font-mono">{selectedMarkup.fontSize}pt</span>
                      </div>
                      <input type="range" min={8} max={48} step={1} value={selectedMarkup.fontSize}
                        onChange={e => upd({ fontSize: Number(e.target.value) })}
                        className="w-full accent-blue-500 h-1.5"/>
                    </div>
                  )}

                  {/* Layer assignment */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Layer</label>
                    <select value={selectedMarkup.layerId} onChange={e => upd({ layerId: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      {layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                    <select value={selectedMarkup.status} onChange={e => upd({ status: e.target.value as MarkupStatus })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      {Object.entries(STATUS_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Priority</label>
                    <div className="flex gap-1">
                      {(['high','medium','low'] as Priority[]).map(p => (
                        <button key={p} onClick={() => upd({ priority: p })}
                          className={`flex-1 py-1 rounded text-[10px] capitalize border transition-colors ${selectedMarkup.priority===p ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                        >{p}</button>
                      ))}
                    </div>
                  </div>

                  {/* Inline text edit */}
                  {TEXT_EDITABLE.includes(selectedMarkup.type) && (
                    <button onClick={() => { setEditingId(selectedMarkup.id); setEditingText(selectedMarkup.text); }}
                      className="w-full py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 border border-slate-600">
                      ✏️ Edit text inline
                    </button>
                  )}

                  {/* Z-order */}
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Order</label>
                    <div className="flex gap-1">
                      <button title="Bring to Front"
                        onClick={() => updateMarkups(activeBoardId, prev => { const rest = prev.filter(m => m.id !== selectedId); const sel = prev.find(m => m.id === selectedId)!; return [...rest, sel]; })}
                        className="flex-1 py-1 rounded text-[10px] border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white">▲ Front</button>
                      <button title="Send to Back"
                        onClick={() => updateMarkups(activeBoardId, prev => { const rest = prev.filter(m => m.id !== selectedId); const sel = prev.find(m => m.id === selectedId)!; return [sel, ...rest]; })}
                        className="flex-1 py-1 rounded text-[10px] border border-slate-600 text-slate-400 hover:border-slate-500 hover:text-white">▼ Back</button>
                    </div>
                  </div>

                  {/* Linked items */}
                  <div className="border-t border-slate-700 pt-2 space-y-1">
                    <button
                      onClick={() => setActivePanel('photo-library')}
                      className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-0.5">
                      <span>Linked Photos</span>
                      <span className="bg-slate-700 rounded px-1.5 py-0.5 text-[10px]">{selectedMarkup.linkedPhotoIds?.length ?? 0}</span>
                    </button>
                    <button
                      onClick={() => setActivePanel('link')}
                      className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-0.5">
                      <span>Linked Documents</span>
                      <span className="bg-slate-700 rounded px-1.5 py-0.5 text-[10px]">{selectedMarkup.linkedDocIds?.length ?? 0}</span>
                    </button>
                  </div>

                  {/* Feature 14: Comment thread */}
                  <div className="border-t border-slate-700 pt-2 space-y-2">
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wide">
                      Comments ({(selectedMarkup.comments ?? []).length})
                    </label>
                    {(selectedMarkup.comments ?? []).map(c => (
                      <div key={c.id} className="group bg-slate-700/60 rounded px-2 py-1.5 space-y-0.5">
                        <div className="flex items-center justify-between text-[9px]">
                          <span className="text-blue-400 font-medium">{c.author}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                            <button
                              onClick={() => upd({ comments: (selectedMarkup.comments ?? []).filter(x => x.id !== c.id) })}
                              className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={9}/>
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-snug">{c.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <input
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey && commentInput.trim()) {
                            e.preventDefault();
                            upd({ comments: [...(selectedMarkup.comments ?? []), { id: genId(), text: commentInput.trim(), author: 'You', createdAt: new Date().toISOString() }] });
                            setCommentInput('');
                          }
                        }}
                        placeholder="Add comment…"
                        className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 min-w-0"
                      />
                      <button
                        onClick={() => {
                          if (!commentInput.trim()) return;
                          upd({ comments: [...(selectedMarkup.comments ?? []), { id: genId(), text: commentInput.trim(), author: 'You', createdAt: new Date().toISOString() }] });
                          setCommentInput('');
                        }}
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] shrink-0">
                        Add
                      </button>
                    </div>
                  </div>

                  <button onClick={() => { updateMarkups(activeBoardId, p => p.filter(m => m.id !== selectedId)); setSelectedId(null); }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                    <Trash2 size={11}/> Delete
                  </button>
                </div>
                );
              })()}
            </div>
          </div>
        )}

        {!showInspector && (
          <button onClick={() => setShowInspector(true)}
            className="w-7 shrink-0 bg-slate-800 border-l border-slate-700 flex items-center justify-center text-slate-400 hover:text-white" title="Show Inspector">
            <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }}/>
          </button>
        )}
      </div>

      {/* ── Active panel overlay — always in DOM so no compositing layer is created/destroyed ── */}
      <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-150"
        style={{ opacity: activePanel ? 1 : 0, pointerEvents: activePanel ? 'auto' : 'none' }}
        onClick={e => { if (e.target === e.currentTarget) setActivePanel(null); }}>
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 data-testid="active-panel-title" className="font-semibold text-slate-100">
                {activePanel === 'color'         && 'Choose markup color'}
                {activePanel === 'photo'         && 'Add or choose site photo'}
                {activePanel === 'file'          && 'Attach document'}
                {activePanel === 'note'          && 'Add note'}
                {activePanel === 'link'          && 'Link markup to document'}
                {activePanel === 'scale'         && 'Workspace settings'}
                {activePanel === 'report'        && 'Generate structural inspection report'}
                {activePanel === 'export'        && 'Export project deliverables'}
                {activePanel === 'stamps'        && 'Stamp library'}
                {activePanel === 'photo-library' && <span data-testid="photo-library-title">Photo Library</span>}
                {activePanel === 'compare'       && 'Compare overlay'}
                {activePanel === 'review'        && 'Markup Review'}
              </h2>
              <button data-testid="close-active-panel" onClick={() => setActivePanel(null)} className="text-slate-400 hover:text-white"><X size={16}/></button>
            </div>

            <div className="p-5">
              {activePanel === 'color' && (
                <div>
                  <p className="text-xs text-slate-400 mb-3">Select the color for new markups.</p>
                  <div className="flex gap-3 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => { setColor(c); setActivePanel(null); }}
                        className={`w-9 h-9 rounded-full border-4 transition-transform hover:scale-110 ${color===c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{background:c}}/>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs text-slate-400 mb-1">Custom</label>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-full rounded cursor-pointer bg-slate-700 border border-slate-600"/>
                  </div>
                </div>
              )}

              {activePanel === 'photo' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Upload a photo to place on the canvas or add to the site photos panel.</p>
                  <button onClick={() => photoInputRef.current?.click()}
                    className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2">
                    <Upload size={14}/> Upload &amp; Place on Canvas
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"/></div>
                    <div className="relative flex justify-center text-[10px] uppercase text-slate-500"><span className="bg-slate-800 px-2">or choose existing</span></div>
                  </div>
                  {sitePhotos.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-2">No photos in library yet.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {sitePhotos.map(p => (
                        <div key={p.id}
                          onClick={() => { placeImageOnCanvas(p.data); setActivePanel(null); }}
                          className="aspect-square rounded bg-slate-700 overflow-hidden cursor-pointer hover:ring-2 ring-blue-500">
                          <img src={p.data} alt={p.name} className="w-full h-full object-cover"/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activePanel === 'file' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Attach a calculation or document to this project.</p>
                  <div className="flex gap-1.5">
                    <input value={newDocName} onChange={e => setNewDocName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newDocName.trim()) {
                          setAttachedDocs(prev => [...prev, { id: `d${Date.now()}`, name: newDocName.trim(), type: 'document', createdAt: new Date().toISOString() }]);
                          setNewDocName('');
                        }
                      }}
                      placeholder="Document name…"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                    <button onClick={() => {
                      if (!newDocName.trim()) return;
                      setAttachedDocs(prev => [...prev, { id: `d${Date.now()}`, name: newDocName.trim(), type: 'document', createdAt: new Date().toISOString() }]);
                      setNewDocName('');
                    }} className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs">Add</button>
                  </div>
                  <div className="space-y-1.5">
                    {attachedDocs.map(d => (
                      <div key={d.id} className="group flex items-center gap-2 px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 cursor-pointer text-xs text-slate-300">
                        <FileText size={13} className="shrink-0"/>
                        <span className="flex-1 truncate">{d.name}</span>
                        <button onClick={e => { e.stopPropagation(); setAttachedDocs(prev => prev.filter(x => x.id !== d.id)); }}
                          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <X size={10}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePanel === 'note' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Add a note to the active board or selected markup.</p>
                  <textarea rows={4} placeholder="Enter note…" className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none"/>
                  <button onClick={() => setActivePanel(null)} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs">Save note</button>
                </div>
              )}

              {activePanel === 'link' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    {selectedMarkup ? `Link a document to markup #${selectedMarkup.number}.` : 'Select a markup first to link documents.'}
                  </p>
                  <div className="space-y-1.5">
                    {attachedDocs.map(d => {
                      const linked = selectedMarkup?.linkedDocIds?.includes(d.id) ?? false;
                      return (
                        <button key={d.id}
                          onClick={() => {
                            if (!selectedMarkup) return;
                            const updLink = (patch: Partial<Markup>) =>
                              setBoardMarkups(prev => ({ ...prev, [activeBoardId]: (prev[activeBoardId]??[]).map(m => m.id===selectedId ? {...m,...patch} : m) }));
                            updLink({ linkedDocIds: linked
                              ? (selectedMarkup.linkedDocIds ?? []).filter(id => id !== d.id)
                              : [...(selectedMarkup.linkedDocIds ?? []), d.id]
                            });
                          }}
                          className={`flex items-center gap-2 w-full px-3 py-2 rounded text-xs text-left transition-colors ${linked ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                          <Tag size={13} className="shrink-0"/>
                          <span className="flex-1 truncate">{d.name}</span>
                          {linked && <span className="text-[9px] text-blue-400 shrink-0">✓ linked</span>}
                        </button>
                      );
                    })}
                    {attachedDocs.length === 0 && (
                      <p className="text-[10px] text-slate-500 text-center py-2">No documents yet. Add via the File panel.</p>
                    )}
                  </div>
                </div>
              )}

              {activePanel === 'scale' && (
                <div className="space-y-4">
                  {/* Calibration dialog — enter real-world distance after picking 2 points */}
                  {calibMode === 'dialog' && calibPts.length === 2 && (() => {
                    const px = Math.sqrt(
                      Math.pow(calibPts[1].x - calibPts[0].x, 2) +
                      Math.pow(calibPts[1].y - calibPts[0].y, 2)
                    );
                    return (
                      <div className="p-3 bg-amber-900/25 border border-amber-700/50 rounded-lg space-y-3">
                        <p className="text-sm font-semibold text-amber-200">Enter real-world distance</p>
                        <p className="text-[11px] text-slate-400">Measured distance on screen: <span className="font-mono text-slate-300">{Math.round(px)}px</span></p>
                        <div className="flex gap-2">
                          <input type="number" min="0.001" step="any"
                            value={calibDistInput} onChange={e => setCalibDistInput(e.target.value)}
                            placeholder="e.g. 20"
                            className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"/>
                          <select value={calibUnit} onChange={e => setCalibUnit(e.target.value as 'ft'|'in'|'m')}
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none">
                            <option value="ft">ft</option>
                            <option value="in">in</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                        <button onClick={() => {
                          const d = parseFloat(calibDistInput);
                          if (!isNaN(d) && d > 0) {
                            setCalibRatio(px / d);
                            setCalibMode('idle');
                            setScaleSet(true);
                            setActivePanel(null);
                          }
                        }} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium">
                          Apply Calibration
                        </button>
                        <button onClick={() => { setCalibMode('idle'); setCalibPts([]); }}
                          className="w-full py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs">Cancel</button>
                      </div>
                    );
                  })()}

                  {calibMode !== 'dialog' && (<>
                    <p className="text-xs text-slate-400">Set drawing scale or calibrate using two known points.</p>

                    {/* Preset scales */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Quick Preset Scales</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { label: "1/8\" = 1'",  ratio: 96 * 8,  unit: 'ft' as const },
                          { label: "1/4\" = 1'",  ratio: 96 * 4,  unit: 'ft' as const },
                          { label: "1/2\" = 1'",  ratio: 96 * 2,  unit: 'ft' as const },
                          { label: "3/4\" = 1'",  ratio: 96 / 0.75, unit: 'ft' as const },
                          { label: "1\" = 1'",    ratio: 96,      unit: 'ft' as const },
                          { label: "1\" = 10'",   ratio: 96 / 10, unit: 'ft' as const },
                        ]).map(preset => (
                          <button key={preset.label}
                            onClick={() => { setCalibRatio(preset.ratio); setCalibUnit(preset.unit); setScaleSet(true); setActivePanel(null); }}
                            className={`py-1.5 px-2 rounded border text-xs transition-colors text-left ${calibRatio === preset.ratio && calibUnit === preset.unit ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-600 text-slate-300 hover:border-slate-500'}`}>
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual calibration */}
                    <div className="border-t border-slate-700 pt-3">
                      <label className="block text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Manual Calibration</label>
                      <p className="text-[11px] text-slate-500 mb-2">Click two known points on the drawing, then enter the real distance.</p>
                      <button onClick={() => { setCalibMode('pick1'); setCalibPts([]); setActivePanel(null); }}
                        className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium">
                        ✦ Start — Click 2 Points on Drawing
                      </button>
                    </div>

                    {calibRatio !== null && (
                      <div className="border-t border-slate-700 pt-3 space-y-2">
                        <p className="text-xs text-green-400">● Calibrated: 1 {calibUnit} = {Math.round(calibRatio)} px</p>
                        <button onClick={() => { setCalibRatio(null); setCalibPts([]); setScaleSet(false); }}
                          className="w-full py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs">
                          Clear calibration
                        </button>
                      </div>
                    )}

                    {/* Grid spacing */}
                    <div className="border-t border-slate-700 pt-3">
                      <label className="block text-xs text-slate-400 mb-1">Grid spacing (px)</label>
                      <input type="number" min={10} max={200} value={gridSpacing}
                        onChange={e => setGridSpacing(Math.max(10, Math.min(200, Number(e.target.value))))}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"/>
                    </div>
                    <button onClick={() => { setScaleSet(true); setActivePanel(null); }}
                      className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs">Apply Settings</button>
                  </>)}
                </div>
              )}

              {activePanel === 'report' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Generate a structured inspection report from all markups on the active board.</p>
                  <div className="space-y-2">
                    {['Cover page','Markup schedule','Photo log','Engineer summary'].map(s => (
                      <label key={s} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded accent-blue-500"/> {s}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => { generateMarkupReport(markups, projectId); setActivePanel(null); }}
                    className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center gap-2">
                    <FileText size={13}/> Generate PDF Report
                  </button>
                  <p className="text-[10px] text-slate-500">Opens in a new tab — use your browser's Print dialog to save as PDF.</p>
                </div>
              )}

              {activePanel === 'export' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Export project deliverables in your preferred format.</p>
                  <div className="space-y-2">
                    <button onClick={() => { generateMarkupReport(markups, projectId); setActivePanel(null); }}
                      className="w-full py-2 px-3 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 text-left flex items-center gap-2">
                      <FileText size={11}/> PDF (annotated drawings)
                    </button>
                    <button onClick={() => { exportMarkupsCsv(markups); setActivePanel(null); }}
                      className="w-full py-2 px-3 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 text-left flex items-center gap-2">
                      <Download size={11}/> CSV (markup schedule)
                    </button>
                    <button onClick={() => alert('ZIP export requires server-side processing.\nUse CSV + PDF exports in the meantime.')}
                      className="w-full py-2 px-3 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-400 text-left flex items-center gap-2">
                      <Download size={11}/> ZIP (photos + PDF) <span className="ml-auto text-[9px] text-slate-600">coming soon</span>
                    </button>
                  </div>
                </div>
              )}

              {activePanel === 'review' && (() => {
                const total   = markups.length;
                const byStatus = { 'field-verify': 0, monitor: 0, complete: 0, open: 0 } as Record<MarkupStatus, number>;
                const byPri    = { high: 0, medium: 0, low: 0 } as Record<Priority, number>;
                markups.forEach(m => { byStatus[m.status]++; byPri[m.priority]++; });
                const pct = total > 0 ? Math.round((byStatus.complete / total) * 100) : 0;
                const unresolved = markups.filter(m => m.priority === 'high' && m.status !== 'complete');
                return (
                  <div className="space-y-5">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Completion</span><span className="font-mono font-semibold text-slate-200">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700">
                        <div className="h-2 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                    {/* Status breakdown */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">By Status</p>
                      <div className="space-y-1.5">
                        {(Object.entries(byStatus) as [MarkupStatus, number][]).map(([s, n]) => (
                          <div key={s} className="flex items-center justify-between text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CFG[s].cls}`}>{STATUS_CFG[s].label}</span>
                            <span className="font-mono text-slate-300">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Priority breakdown */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">By Priority</p>
                      <div className="space-y-1.5">
                        {(Object.entries(byPri) as [Priority, number][]).map(([p, n]) => (
                          <div key={p} className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${PRI_CFG[p].dot}`}/>
                            <span className="flex-1 text-slate-300">{PRI_CFG[p].label}</span>
                            <span className="font-mono text-slate-300">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Unresolved high-priority */}
                    {unresolved.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">
                          Unresolved High Priority ({unresolved.length})
                        </p>
                        <div className="space-y-1">
                          {unresolved.map(m => (
                            <button key={m.id} onClick={() => { setSelectedId(m.id); setActivePanel(null); }}
                              className="w-full text-left px-2 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-xs transition-colors">
                              <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white mr-1.5" style={{ background: m.color }}>{m.number}</span>
                              <span className="text-slate-200 truncate">{m.text || m.type}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => { generateMarkupReport(markups, projectId); setActivePanel(null); }}
                      className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center gap-2">
                      <FileText size={13}/> Generate Full Report
                    </button>
                  </div>
                );
              })()}

              {activePanel === 'photo-library' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p data-testid="photo-library-title" className="text-xs text-slate-400 font-semibold">
                      All site photos ({sitePhotos.length})
                    </p>
                    <button onClick={() => photoLibInputRef.current?.click()}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <Plus size={10}/> Add
                    </button>
                  </div>
                  {sitePhotos.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500 mb-3">No photos yet.</p>
                      <button onClick={() => photoLibInputRef.current?.click()}
                        className="text-xs text-blue-400 hover:text-blue-300 underline">Upload first photo</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {sitePhotos.map(p => (
                        <div key={p.id} className="group relative rounded bg-slate-700 aspect-video overflow-hidden cursor-pointer hover:ring-2 ring-blue-500">
                          <img src={p.data} alt={p.name} className="w-full h-full object-cover"/>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                            <span className="opacity-0 group-hover:opacity-100 text-[9px] text-white px-1.5 py-1 bg-black/50 w-full truncate transition-opacity">{p.name}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setSitePhotos(prev => prev.filter(x => x.id !== p.id)); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <X size={10}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feature 18: Compare panel */}
              {activePanel === 'compare' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Upload a second drawing or image to overlay on the canvas.</p>
                  <button onClick={() => compareInputRef.current?.click()}
                    className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2">
                    <Upload size={14}/> Upload Overlay Image
                  </button>
                  {compareImage && (<>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowCompare(v => !v)}
                        className={`flex-1 py-1.5 rounded border text-xs transition-colors ${showCompare ? 'border-blue-500 bg-blue-600/20 text-blue-300' : 'border-slate-600 text-slate-400'}`}>
                        {showCompare ? '◧ Visible' : '◫ Hidden'}
                      </button>
                      <button onClick={() => { setCompareImage(null); setShowCompare(false); setActivePanel(null); }}
                        className="py-1.5 px-3 rounded border border-red-800/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 text-xs">
                        Clear
                      </button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Opacity</span>
                        <span className="font-mono">{Math.round(compareOpacity * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.05} value={compareOpacity}
                        onChange={e => setCompareOpacity(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1.5"/>
                    </div>
                    <div className="rounded overflow-hidden bg-slate-700 border border-slate-600">
                      <img src={compareImage} alt="Overlay preview" className="w-full h-auto opacity-80"/>
                    </div>
                  </>)}
                </div>
              )}

              {activePanel === 'stamps' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Click a stamp to place it at the center of the canvas. Drag to reposition after placing.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STAMPS.map(s => (
                      <button key={s.label} onClick={() => placeStamp(s)}
                        className="flex flex-col items-start gap-1 px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-500 text-left transition-colors group">
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }}/>
                          <span className="text-xs font-medium text-slate-200 truncate">{s.label}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600 text-slate-400 capitalize">{s.type}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600 text-slate-400 capitalize">{s.priority}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
