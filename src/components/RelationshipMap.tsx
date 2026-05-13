import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Maximize2, Minimize2, Plus, Trash2, ZoomIn, ZoomOut, X,
} from 'lucide-react';

// ── Types (exported so VisualWorkspace can use them) ─────────────────────────

export type RNodeType =
  | 'markup'     // drawing annotation / cloud
  | 'member'     // structural member (beam, column, connection)
  | 'document'   // calc sheet, report, spec, RFI
  | 'cost'       // cost estimate, budget line
  | 'action'     // work order, required repair, hold
  | 'photo'      // site photo
  | 'inspection' // test result, UT, PT, visual inspection record
  | 'code-ref'   // AISC 360, ACI 318, IBC reference
  | 'material'   // material specification
  | 'finding';   // defect / observation (corrosion, crack, deformation)

export interface RNode {
  id: string;
  type: RNodeType;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
}

export interface REdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface RelationshipGraph {
  nodes: RNode[];
  edges: REdge[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

let _rid = 0;
export const genRid = () => `r${++_rid}_${Date.now()}`;

export const NODE_CFG: Record<RNodeType, { label: string; color: string; headerText: string }> = {
  markup:     { label: 'Markup',      color: '#ef4444', headerText: 'MRK' },
  member:     { label: 'Member',      color: '#f97316', headerText: 'STR' },
  document:   { label: 'Document',    color: '#3b82f6', headerText: 'DOC' },
  cost:       { label: 'Cost',        color: '#22c55e', headerText: '$$$' },
  action:     { label: 'Action',      color: '#eab308', headerText: 'ACT' },
  photo:      { label: 'Photo',       color: '#8b5cf6', headerText: 'IMG' },
  inspection: { label: 'Inspection',  color: '#06b6d4', headerText: 'TST' },
  'code-ref': { label: 'Code Ref',    color: '#94a3b8', headerText: 'REF' },
  material:   { label: 'Material',    color: '#a78bfa', headerText: 'MAT' },
  finding:    { label: 'Finding',     color: '#f43f5e', headerText: '⚠' },
};

// Node dimensions
const EXP_W = 182;  // expanded node width
const EXP_H = 62;   // expanded node height
const EXP_HDR = 22; // expanded header height
const CMP_W = 96;   // compact node width
const CMP_H = 36;   // compact node height
const CMP_HDR = 14; // compact header height

interface Pt { x: number; y: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
}

function outPort(n: RNode, exp: boolean): Pt {
  return { x: n.x + (exp ? EXP_W : CMP_W), y: n.y + (exp ? EXP_H : CMP_H) / 2 };
}
function inPort(n: RNode, exp: boolean): Pt {
  return { x: n.x, y: n.y + (exp ? EXP_H : CMP_H) / 2 };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  graph: RelationshipGraph;
  onChange: (g: RelationshipGraph) => void;
}

export function RelationshipMap({ graph, onChange }: Props) {
  const [expanded,     setExpanded]     = useState(false);
  const [pan,          setPan]          = useState<Pt>({ x: 60, y: 60 });
  const [scale,        setScale]        = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [showPalette,  setShowPalette]  = useState(false);
  const [edgePreview,  setEdgePreview]  = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; field: 'label' | 'subtitle'; value: string } | null>(null);

  const svgRef        = useRef<SVGSVGElement>(null);
  const isPanning     = useRef(false);
  const panStart      = useRef<Pt>({ x: 0, y: 0 });
  const panOrigin     = useRef<Pt>({ x: 0, y: 0 });
  const draggingId    = useRef<string | null>(null);
  const dragOffset    = useRef<Pt>({ x: 0, y: 0 });
  const drawingFrom   = useRef<string | null>(null);

  const toCanvas = useCallback((cx: number, cy: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (cx - rect.left - pan.x) / scale,
      y: (cy - rect.top  - pan.y) / scale,
    };
  }, [pan, scale]);

  // ── Keyboard (expanded only) ──────────────────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setExpanded(false); setShowPalette(false); setEditingLabel(null); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement)) {
        if (selectedNode) {
          onChange({ ...graph, nodes: graph.nodes.filter(n => n.id !== selectedNode), edges: graph.edges.filter(ed => ed.from !== selectedNode && ed.to !== selectedNode) });
          setSelectedNode(null);
        }
        if (selectedEdge) {
          onChange({ ...graph, edges: graph.edges.filter(ed => ed.id !== selectedEdge) });
          setSelectedEdge(null);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [expanded, selectedNode, selectedEdge, graph, onChange]);

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNode = useCallback((type: RNodeType) => {
    const cw = svgRef.current?.clientWidth  ?? 800;
    const ch = svgRef.current?.clientHeight ?? 500;
    const x  = (cw / 2 - pan.x) / scale - EXP_W / 2;
    const y  = (ch / 2 - pan.y) / scale - EXP_H / 2;
    const cfg = NODE_CFG[type];
    onChange({ ...graph, nodes: [...graph.nodes, { id: genRid(), type, label: cfg.label, subtitle: 'Add detail…', x, y }] });
    setShowPalette(false);
  }, [graph, onChange, pan, scale]);

  // ── SVG pointer handlers (expanded) ──────────────────────────────────────
  const onSvgDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const t = e.target as Element;
    if (e.button === 1 || (e.button === 0 && (t.tagName === 'svg' || t.getAttribute('data-bg') === '1'))) {
      isPanning.current = true;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    }
    if (t.tagName === 'svg' || t.getAttribute('data-bg') === '1') {
      setSelectedNode(null); setSelectedEdge(null);
    }
  }, [pan]);

  const onSvgMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning.current) {
      setPan({ x: panOrigin.current.x + e.clientX - panStart.current.x, y: panOrigin.current.y + e.clientY - panStart.current.y });
    }
    if (draggingId.current) {
      const cv = toCanvas(e.clientX, e.clientY);
      onChange({ ...graph, nodes: graph.nodes.map(n => n.id === draggingId.current ? { ...n, x: cv.x - dragOffset.current.x, y: cv.y - dragOffset.current.y } : n) });
    }
    if (drawingFrom.current) {
      const fn = graph.nodes.find(n => n.id === drawingFrom.current);
      if (fn) {
        const p = outPort(fn, true);
        const cv = toCanvas(e.clientX, e.clientY);
        setEdgePreview({ x1: p.x, y1: p.y, x2: cv.x, y2: cv.y });
      }
    }
  }, [graph, onChange, toCanvas]);

  const onSvgUp = useCallback(() => {
    isPanning.current = false;
    draggingId.current = null;
    drawingFrom.current = null;
    setEdgePreview(null);
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setScale(s => {
      const ns = Math.min(Math.max(s * factor, 0.15), 3);
      setPan(p => ({ x: mx - (mx - p.x) * (ns / s), y: my - (my - p.y) * (ns / s) }));
      return ns;
    });
  }, []);

  const onNodeDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setSelectedNode(nodeId); setSelectedEdge(null);
    const node = graph.nodes.find(n => n.id === nodeId)!;
    const cv = toCanvas(e.clientX, e.clientY);
    draggingId.current = nodeId;
    dragOffset.current = { x: cv.x - node.x, y: cv.y - node.y };
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [graph, toCanvas]);

  const onOutPortDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    drawingFrom.current = nodeId;
    svgRef.current?.setPointerCapture(e.pointerId);
  }, []);

  const onInPortUp = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    const from = drawingFrom.current;
    if (from && from !== nodeId && !graph.edges.some(ed => ed.from === from && ed.to === nodeId)) {
      onChange({ ...graph, edges: [...graph.edges, { id: genRid(), from, to: nodeId, label: '' }] });
    }
    drawingFrom.current = null;
    setEdgePreview(null);
  }, [graph, onChange]);

  // ── Node renderer ─────────────────────────────────────────────────────────
  const renderNode = (n: RNode, exp: boolean) => {
    const cfg = NODE_CFG[n.type];
    const w = exp ? EXP_W : CMP_W;
    const h = exp ? EXP_H : CMP_H;
    const hdr = exp ? EXP_HDR : CMP_HDR;
    const isSel = n.id === selectedNode;

    return (
      <g key={n.id} transform={`translate(${n.x},${n.y})`}
        style={{ cursor: exp ? 'grab' : 'pointer' }}
        onPointerDown={exp ? (e) => onNodeDown(e, n.id) : undefined}>

        {/* Selection outline */}
        {isSel && <rect x={-3} y={-3} width={w + 6} height={h + 6} rx={5}
          fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 2"/>}

        {/* Body */}
        <rect x={0} y={0} width={w} height={h} rx={4}
          fill="#1e293b" stroke={isSel ? '#60a5fa' : cfg.color} strokeWidth={isSel ? 1.5 : 1}/>

        {/* Header bar */}
        <path d={`M 4 0 L ${w - 4} 0 Q ${w} 0 ${w} 4 L ${w} ${hdr} L 0 ${hdr} L 0 4 Q 0 0 4 0 Z`}
          fill={cfg.color}/>

        {/* Header label */}
        <text x={exp ? 7 : 5} y={exp ? 15 : 10}
          fill="white" fontSize={exp ? 9 : 7}
          fontFamily="sans-serif" fontWeight="bold" dominantBaseline="middle">
          {exp ? cfg.label.toUpperCase() : cfg.headerText}
        </text>

        {/* Main label */}
        <text x={exp ? 7 : 5} y={hdr + (exp ? 13 : 11)}
          fill="#f1f5f9" fontSize={exp ? 10.5 : 8}
          fontFamily="sans-serif" fontWeight="600">
          {n.label.length > (exp ? 19 : 11) ? n.label.slice(0, exp ? 19 : 11) + '…' : n.label}
        </text>

        {/* Subtitle (expanded only) */}
        {exp && n.subtitle && (
          <text x={7} y={hdr + 29} fill="#94a3b8" fontSize={8.5} fontFamily="sans-serif">
            {n.subtitle.length > 23 ? n.subtitle.slice(0, 23) + '…' : n.subtitle}
          </text>
        )}

        {/* Input port (left, expanded) */}
        {exp && (
          <circle cx={0} cy={h / 2} r={6}
            fill="#0f172a" stroke={cfg.color} strokeWidth={1.5}
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onPointerUp={e => onInPortUp(e, n.id)}/>
        )}

        {/* Output port (right, expanded) */}
        {exp && (
          <circle cx={w} cy={h / 2} r={6}
            fill={cfg.color} stroke="white" strokeWidth={1}
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onPointerDown={e => onOutPortDown(e, n.id)}/>
        )}
      </g>
    );
  };

  // ── Edge renderer ─────────────────────────────────────────────────────────
  const renderEdge = (ed: REdge, exp: boolean) => {
    const fn = graph.nodes.find(n => n.id === ed.from);
    const tn = graph.nodes.find(n => n.id === ed.to);
    if (!fn || !tn) return null;
    const p1 = outPort(fn, exp);
    const p2 = inPort(tn, exp);
    const isSel = ed.id === selectedEdge;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    return (
      <g key={ed.id}>
        {/* Hit area */}
        <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
          fill="none" stroke="transparent" strokeWidth={12}
          style={{ cursor: 'pointer' }}
          onClick={() => { setSelectedEdge(ed.id); setSelectedNode(null); }}/>
        {/* Visible line */}
        <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
          fill="none"
          stroke={isSel ? '#60a5fa' : '#475569'}
          strokeWidth={exp ? (isSel ? 2 : 1.5) : 1}
          strokeDasharray={exp ? undefined : '5 3'}/>
        {/* Arrow tip */}
        {exp && (
          <polygon
            points={`${p2.x - 8},${p2.y - 4} ${p2.x},${p2.y} ${p2.x - 8},${p2.y + 4}`}
            fill={isSel ? '#60a5fa' : '#475569'}/>
        )}
        {/* Edge label */}
        {exp && ed.label && (
          <text x={mx} y={my - 5} fill="#64748b" fontSize={8}
            fontFamily="sans-serif" textAnchor="middle">{ed.label}</text>
        )}
      </g>
    );
  };

  // ── Compact view (embedded in bottom strip) ───────────────────────────────
  const renderCompact = () => {
    const hasNodes = graph.nodes.length > 0;
    let vb = '0 0 400 140';
    if (hasNodes) {
      const pad = 12;
      const xs = graph.nodes.map(n => n.x), ys = graph.nodes.map(n => n.y);
      const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
      const x1 = Math.max(...xs) + CMP_W + pad, y1 = Math.max(...ys) + CMP_H + pad;
      vb = `${x0} ${y0} ${x1 - x0} ${y1 - y0}`;
    }

    return (
      <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-700 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Relationship Map
          </span>
          <div className="flex gap-1">
            <button onClick={() => setShowPalette(v => !v)} title="Add node"
              className={`p-0.5 rounded transition-colors ${showPalette ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
              <Plus size={11}/>
            </button>
            <button onClick={() => setExpanded(true)} title="Expand to Blueprint editor"
              className="p-0.5 text-slate-400 hover:text-white rounded">
              <Maximize2 size={11}/>
            </button>
          </div>
        </div>

        {/* Palette dropdown (fixed so it escapes overflow:hidden) */}
        {showPalette && (
          <div className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-2 grid grid-cols-2 gap-1 w-52"
            style={{ bottom: '11.5rem', right: '15.5rem' }}>
            <div className="col-span-2 text-[9px] text-slate-500 uppercase tracking-wider px-1 pb-1 border-b border-slate-700 mb-1">
              Click to place node
            </div>
            {(Object.entries(NODE_CFG) as [RNodeType, typeof NODE_CFG[RNodeType]][]).map(([type, cfg]) => (
              <button key={type} onClick={() => { addNode(type); }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] text-slate-300 hover:bg-slate-700 text-left transition-colors">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: cfg.color }}/>
                {cfg.label}
              </button>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          {!hasNodes ? (
            <div className="flex flex-col items-center justify-center h-full gap-1.5">
              <span className="text-[10px] text-slate-600 text-center px-3">
                No nodes yet.<br/>Click + to add or expand to blueprint editor.
              </span>
              <button onClick={() => setExpanded(true)}
                className="text-[10px] text-blue-500 hover:text-blue-400 underline">
                Open editor
              </button>
            </div>
          ) : (
            <svg width="100%" height="100%">
              <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                {graph.edges.map(e => renderEdge(e, false))}
                {graph.nodes.map(n => renderNode(n, false))}
              </svg>
            </svg>
          )}
        </div>
      </div>
    );
  };

  // ── Expanded / fullscreen Blueprint editor ────────────────────────────────
  const selNode = graph.nodes.find(n => n.id === selectedNode) ?? null;
  const selEdge = graph.edges.find(e => e.id === selectedEdge) ?? null;

  const renderExpanded = () => (
    <div className="fixed inset-0 z-50 flex bg-slate-950 text-slate-200">

      {/* Left node palette */}
      <div className="w-44 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Node Types</p>
          <p className="text-[9px] text-slate-600 mt-0.5">Click to place at center</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {(Object.entries(NODE_CFG) as [RNodeType, typeof NODE_CFG[RNodeType]][]).map(([type, cfg]) => (
            <button key={type} onClick={() => addNode(type)}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-slate-800 transition-colors">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cfg.color }}/>
              <span className="font-medium">{cfg.label}</span>
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-slate-700 space-y-1 text-[9px] text-slate-600">
          <div>● Drag output port to input port to connect</div>
          <div>● Alt+drag or middle-mouse to pan</div>
          <div>● Scroll to zoom</div>
          <div>● Del to delete selected</div>
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
          <span className="text-sm font-semibold text-slate-100">Relationship Map / Blueprint</span>
          <div className="flex items-center gap-2">
            {selectedNode && (
              <button onClick={() => {
                onChange({ ...graph, nodes: graph.nodes.filter(n => n.id !== selectedNode), edges: graph.edges.filter(e => e.from !== selectedNode && e.to !== selectedNode) });
                setSelectedNode(null);
              }} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-800/50 rounded px-2 py-1">
                <Trash2 size={10}/> Delete node
              </button>
            )}
            {selectedEdge && (
              <button onClick={() => {
                onChange({ ...graph, edges: graph.edges.filter(e => e.id !== selectedEdge) });
                setSelectedEdge(null);
              }} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-800/50 rounded px-2 py-1">
                <Trash2 size={10}/> Delete edge
              </button>
            )}
            <span className="text-[10px] text-slate-500 font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s * 1.2, 3))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><ZoomIn size={13}/></button>
            <button onClick={() => setScale(s => Math.max(s / 1.2, 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><ZoomOut size={13}/></button>
            <button onClick={() => { setPan({ x: 60, y: 60 }); setScale(1); }}
              className="text-[10px] text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1">Fit</button>
            <button onClick={() => { setExpanded(false); setSelectedNode(null); setSelectedEdge(null); }}
              title="Collapse (Esc)"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
              <Minimize2 size={14}/>
            </button>
          </div>
        </div>

        {/* SVG Canvas */}
        <svg ref={svgRef} className="flex-1"
          onPointerDown={onSvgDown}
          onPointerMove={onSvgMove}
          onPointerUp={onSvgUp}
          onPointerLeave={onSvgUp}
          onWheel={onWheel}
          style={{ cursor: 'default' }}>

          {/* Dot grid background */}
          <defs>
            <pattern id="rmap-dots" patternUnits="userSpaceOnUse"
              x={pan.x % (20 * scale)} y={pan.y % (20 * scale)}
              width={20 * scale} height={20 * scale}>
              <circle cx={0} cy={0} r={0.7} fill="#334155"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rmap-dots)" data-bg="1"/>

          {/* Graph content */}
          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
            {graph.edges.map(e => renderEdge(e, true))}
            {edgePreview && (
              <path d={bezierPath(edgePreview.x1, edgePreview.y1, edgePreview.x2, edgePreview.y2)}
                fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="6 3"
                style={{ pointerEvents: 'none' }}/>
            )}
            {graph.nodes.map(n => renderNode(n, true))}
          </g>
        </svg>
      </div>

      {/* Right: properties panel */}
      <div className="w-52 shrink-0 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Properties</span>
          {(selectedNode || selectedEdge) && (
            <button onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
              className="text-slate-500 hover:text-white"><X size={11}/></button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Node properties */}
          {selNode && (() => {
            const cfg = NODE_CFG[selNode.type];
            return (
              <div className="p-3 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-700"
                  style={{ borderTopColor: cfg.color, borderTopWidth: 3, paddingTop: 8, marginTop: -4 }}>
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cfg.color }}/>
                  <span className="text-[10px] font-bold uppercase text-slate-300">{cfg.label}</span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Label</label>
                  <input value={selNode.label}
                    onChange={e => onChange({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? { ...n, label: e.target.value } : n) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Detail / Subtitle</label>
                  <input value={selNode.subtitle ?? ''}
                    onChange={e => onChange({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? { ...n, subtitle: e.target.value } : n) })}
                    placeholder="e.g. $2,400 est. · May 2025"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Type</label>
                  <select value={selNode.type}
                    onChange={e => onChange({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? { ...n, type: e.target.value as RNodeType } : n) })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                    {(Object.entries(NODE_CFG) as [RNodeType, typeof NODE_CFG[RNodeType]][]).map(([t, c]) => (
                      <option key={t} value={t}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-slate-700 pt-2 space-y-1 text-[9px] text-slate-500">
                  <div>Connections: <span className="text-slate-300">{graph.edges.filter(e => e.from === selNode.id || e.to === selNode.id).length}</span></div>
                  <div>Position: <span className="font-mono text-slate-400">{Math.round(selNode.x)}, {Math.round(selNode.y)}</span></div>
                </div>
                <button onClick={() => {
                  onChange({ ...graph, nodes: graph.nodes.filter(n => n.id !== selNode.id), edges: graph.edges.filter(e => e.from !== selNode.id && e.to !== selNode.id) });
                  setSelectedNode(null);
                }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                  <Trash2 size={11}/> Delete node
                </button>
              </div>
            );
          })()}

          {/* Edge properties */}
          {selEdge && (() => {
            const fromNode = graph.nodes.find(n => n.id === selEdge.from);
            const toNode   = graph.nodes.find(n => n.id === selEdge.to);
            return (
              <div className="p-3 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700">
                  Connection
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: fromNode ? NODE_CFG[fromNode.type].color : '#475569' }}/>
                    <span>{fromNode?.label ?? '—'}</span>
                  </div>
                  <div className="pl-1 text-slate-600">↓</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm" style={{ background: toNode ? NODE_CFG[toNode.type].color : '#475569' }}/>
                    <span>{toNode?.label ?? '—'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Relationship label</label>
                  <input value={selEdge.label ?? ''}
                    onChange={e => onChange({ ...graph, edges: graph.edges.map(ed => ed.id === selEdge.id ? { ...ed, label: e.target.value } : ed) })}
                    placeholder="e.g. references, drives, requires…"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                </div>
                <button onClick={() => {
                  onChange({ ...graph, edges: graph.edges.filter(e => e.id !== selEdge.id) });
                  setSelectedEdge(null);
                }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                  <Trash2 size={11}/> Delete connection
                </button>
              </div>
            );
          })()}

          {!selNode && !selEdge && (
            <div className="px-4 py-6 text-[10px] text-slate-600 text-center leading-relaxed">
              Click a node or connection to edit its properties.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Suppress unused var warning (editingLabel reserved for future inline editing)
  void editingLabel;

  return (
    <>
      {renderCompact()}
      {expanded && renderExpanded()}
    </>
  );
}
