import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Maximize2, Minimize2, Plus, Trash2, ZoomIn, ZoomOut, X,
  Download, FileText, LayoutTemplate, LayoutGrid, Undo2, Redo2,
  Lock, Unlock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RNodeType =
  | 'markup'
  | 'member'
  | 'document'
  | 'cost'
  | 'action'
  | 'photo'
  | 'inspection'
  | 'code-ref'
  | 'material'
  | 'finding'
  | 'defect'
  | 'measurement'
  | 'risk'
  | 'deadline'
  | 'checklist';

export type RNodeStatus = 'open' | 'in-progress' | 'resolved' | 'deferred';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface RNode {
  id: string;
  type: RNodeType;
  label: string;
  subtitle?: string;
  x: number;
  y: number;
  status?: RNodeStatus;
  riskSeverity?: number;
  riskLikelihood?: number;
  dueDate?: string;
  photoData?: string;
  checklistItems?: ChecklistItem[];
  crossBoardRef?: string;
  // Member-specific
  memberSection?:  string;
  memberMaterial?: string;
  memberSpan?:     string;
  // Defect-specific
  defectClass?:   'hairline' | 'moderate' | 'severe';
  defectArea?:    string;
  // Cost-specific
  costAmount?:    number;
  costLaborPct?:  number;
  // Inspection-specific
  inspectionMethod?: string;
  inspectionResult?: 'pass' | 'fail' | 'monitor';
  // Measurement-specific
  measurementValue?: string;
  measurementUnit?:  string;
  measurementLimit?: string;
  // Feature 10: Custom tags
  tags?: { key: string; value: string }[];
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
  markup:      { label: 'Markup',       color: '#ef4444', headerText: 'MRK' },
  member:      { label: 'Member',       color: '#f97316', headerText: 'STR' },
  document:    { label: 'Document',     color: '#3b82f6', headerText: 'DOC' },
  cost:        { label: 'Cost',         color: '#22c55e', headerText: '$$$' },
  action:      { label: 'Action',       color: '#eab308', headerText: 'ACT' },
  photo:       { label: 'Photo',        color: '#8b5cf6', headerText: 'IMG' },
  inspection:  { label: 'Inspection',   color: '#06b6d4', headerText: 'TST' },
  'code-ref':  { label: 'Code Ref',     color: '#94a3b8', headerText: 'REF' },
  material:    { label: 'Material',     color: '#a78bfa', headerText: 'MAT' },
  finding:     { label: 'Finding',      color: '#f43f5e', headerText: '⚠'  },
  defect:      { label: 'Defect',       color: '#dc2626', headerText: 'DEF' },
  measurement: { label: 'Measurement',  color: '#0891b2', headerText: 'MSR' },
  risk:        { label: 'Risk',         color: '#f97316', headerText: 'RISK' },
  deadline:    { label: 'Deadline',     color: '#8b5cf6', headerText: 'DUE' },
  checklist:   { label: 'Checklist',    color: '#10b981', headerText: 'CHK' },
};

const STATUS_COLOR: Record<RNodeStatus, string> = {
  'open':        '#ef4444',
  'in-progress': '#f97316',
  'resolved':    '#22c55e',
  'deferred':    '#64748b',
};

const EXP_W   = 182;
const EXP_H   = 78;
const EXP_HDR = 22;
const CMP_W   = 96;
const CMP_H   = 36;
const CMP_HDR = 14;

const TODAY = new Date().toISOString().slice(0, 10);

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

function riskColor(score: number): string {
  if (score <= 4)  return '#22c55e';
  if (score <= 9)  return '#f59e0b';
  return '#ef4444';
}

function riskScore(n: RNode): number {
  return (n.riskSeverity ?? 1) * (n.riskLikelihood ?? 1);
}

// ── Templates ─────────────────────────────────────────────────────────────────

function makeBridgeDeckSurvey(): RelationshipGraph {
  const base = { x: 60, y: 60 };
  const dx = 240;
  const nodes: RNode[] = [
    { id: genRid(), type: 'markup',      label: 'Markup #1',          subtitle: 'Deck Area B-4',        x: base.x,          y: base.y },
    { id: genRid(), type: 'member',      label: 'Deck Area B-4',      subtitle: 'Span 3, Bay 4',        x: base.x + dx,     y: base.y },
    { id: genRid(), type: 'defect',      label: 'Delamination',       subtitle: 'Surface spalling',     x: base.x + dx * 2, y: base.y, status: 'open' },
    { id: genRid(), type: 'measurement', label: '2.4 m² Area',        subtitle: 'Affected region',      x: base.x + dx * 2, y: base.y + 110 },
    { id: genRid(), type: 'finding',     label: 'Section Loss 12%',   subtitle: 'Cover concrete',       x: base.x + dx,     y: base.y + 110 },
    { id: genRid(), type: 'risk',        label: 'Risk: High',         subtitle: 'Structural risk',      x: base.x,          y: base.y + 220, riskSeverity: 4, riskLikelihood: 3 },
    { id: genRid(), type: 'cost',        label: 'Cost Est. $18k',     subtitle: 'Deck repair',          x: base.x + dx,     y: base.y + 220 },
    { id: genRid(), type: 'action',      label: 'Repair Order',       subtitle: 'Issue work order',     x: base.x + dx * 2, y: base.y + 220, status: 'in-progress' },
    { id: genRid(), type: 'deadline',    label: 'Q3 2026',            subtitle: 'Completion target',    x: base.x + dx * 3, y: base.y + 220, dueDate: '2026-09-30' },
    { id: genRid(), type: 'checklist',   label: 'Deck Repair Checklist', subtitle: 'Pre-repair items', x: base.x + dx * 3, y: base.y + 110,
      checklistItems: [
        { id: genRid(), text: 'Delineate repair area', done: true },
        { id: genRid(), text: 'Shore falsework', done: false },
        { id: genRid(), text: 'Remove delaminated concrete', done: false },
        { id: genRid(), text: 'Apply bonding agent', done: false },
      ],
    },
    { id: genRid(), type: 'document',    label: 'Inspection Report',  subtitle: 'Rev B - 2026-01-15',   x: base.x + dx * 3, y: base.y },
  ];
  const edges: REdge[] = [
    { id: genRid(), from: nodes[0].id, to: nodes[1].id, label: 'annotates' },
    { id: genRid(), from: nodes[1].id, to: nodes[2].id, label: 'has defect' },
    { id: genRid(), from: nodes[2].id, to: nodes[3].id, label: 'measured by' },
    { id: genRid(), from: nodes[2].id, to: nodes[4].id, label: 'causes' },
    { id: genRid(), from: nodes[4].id, to: nodes[5].id, label: 'informs' },
    { id: genRid(), from: nodes[5].id, to: nodes[6].id, label: 'drives' },
    { id: genRid(), from: nodes[6].id, to: nodes[7].id, label: 'funds' },
    { id: genRid(), from: nodes[7].id, to: nodes[8].id, label: 'due by' },
    { id: genRid(), from: nodes[7].id, to: nodes[9].id, label: 'uses' },
    { id: genRid(), from: nodes[9].id, to: nodes[10].id, label: 'documented in' },
  ];
  return { nodes, edges };
}

function makeBuildingEnvelope(): RelationshipGraph {
  const base = { x: 60, y: 60 };
  const dx = 230;
  const nodes: RNode[] = [
    { id: genRid(), type: 'member',      label: 'Facade Panel E-7',   subtitle: 'Level 3, North',       x: base.x,          y: base.y },
    { id: genRid(), type: 'defect',      label: 'Sealant Failure',    subtitle: 'Joint #14',            x: base.x + dx,     y: base.y, status: 'open' },
    { id: genRid(), type: 'measurement', label: 'Gap 8 mm',           subtitle: 'Design limit: 3 mm',   x: base.x + dx * 2, y: base.y },
    { id: genRid(), type: 'finding',     label: 'Water Infiltration', subtitle: 'Interior staining',    x: base.x + dx,     y: base.y + 110, status: 'in-progress' },
    { id: genRid(), type: 'action',      label: 'Reseal Joint',       subtitle: 'Polyurethane sealant', x: base.x + dx * 2, y: base.y + 110, status: 'open' },
    { id: genRid(), type: 'cost',        label: 'Cost Est. $3,200',   subtitle: 'Labour + materials',   x: base.x + dx * 3, y: base.y + 110 },
    { id: genRid(), type: 'deadline',    label: 'Before Wet Season',  subtitle: 'Completion target',    x: base.x + dx * 3, y: base.y, dueDate: '2026-10-01' },
    { id: genRid(), type: 'document',    label: 'Facade Spec BS-101', subtitle: 'Issue C',              x: base.x,          y: base.y + 220 },
    { id: genRid(), type: 'inspection',  label: 'Water Test WT-04',   subtitle: 'AAMA 501.2',           x: base.x + dx,     y: base.y + 220 },
  ];
  const edges: REdge[] = [
    { id: genRid(), from: nodes[0].id, to: nodes[1].id, label: 'has defect' },
    { id: genRid(), from: nodes[1].id, to: nodes[2].id, label: 'measured' },
    { id: genRid(), from: nodes[1].id, to: nodes[3].id, label: 'causes' },
    { id: genRid(), from: nodes[3].id, to: nodes[4].id, label: 'requires' },
    { id: genRid(), from: nodes[4].id, to: nodes[5].id, label: 'costs' },
    { id: genRid(), from: nodes[4].id, to: nodes[6].id, label: 'due' },
    { id: genRid(), from: nodes[7].id, to: nodes[4].id, label: 'specifies' },
    { id: genRid(), from: nodes[8].id, to: nodes[3].id, label: 'confirms' },
  ];
  return { nodes, edges };
}

function makeSteelFrameInspection(): RelationshipGraph {
  const base = { x: 60, y: 60 };
  const dx = 230;
  const nodes: RNode[] = [
    { id: genRid(), type: 'member',      label: 'W24×76 Beam',        subtitle: 'Grid C3–C5, Level 2',  x: base.x,          y: base.y },
    { id: genRid(), type: 'defect',      label: 'Web Corrosion',      subtitle: 'Section loss',         x: base.x + dx,     y: base.y, status: 'open' },
    { id: genRid(), type: 'measurement', label: 'Thickness 8.2 mm',   subtitle: 'Nominal: 11.9 mm',     x: base.x + dx * 2, y: base.y },
    { id: genRid(), type: 'risk',        label: 'Capacity Risk',      subtitle: 'Flexural capacity',    x: base.x + dx,     y: base.y + 110, riskSeverity: 4, riskLikelihood: 2 },
    { id: genRid(), type: 'code-ref',    label: 'AISC 360-22',        subtitle: 'Ch. F Flexure',        x: base.x,          y: base.y + 220 },
    { id: genRid(), type: 'material',    label: 'ASTM A992',          subtitle: 'Fy=345 MPa',           x: base.x + dx,     y: base.y + 220 },
    { id: genRid(), type: 'action',      label: 'Sister Plate Repair',subtitle: 'Weld PL10×200',        x: base.x + dx * 2, y: base.y + 220, status: 'open' },
    { id: genRid(), type: 'cost',        label: 'Cost Est. $9,400',   subtitle: 'Fab + erection',       x: base.x + dx * 3, y: base.y + 220 },
    { id: genRid(), type: 'inspection',  label: 'UT Scan UT-17',      subtitle: 'ASNT Level II',        x: base.x + dx * 3, y: base.y },
  ];
  const edges: REdge[] = [
    { id: genRid(), from: nodes[0].id, to: nodes[1].id, label: 'has defect' },
    { id: genRid(), from: nodes[1].id, to: nodes[2].id, label: 'measured' },
    { id: genRid(), from: nodes[1].id, to: nodes[3].id, label: 'creates' },
    { id: genRid(), from: nodes[3].id, to: nodes[6].id, label: 'requires' },
    { id: genRid(), from: nodes[4].id, to: nodes[3].id, label: 'governs' },
    { id: genRid(), from: nodes[5].id, to: nodes[0].id, label: 'specifies' },
    { id: genRid(), from: nodes[6].id, to: nodes[7].id, label: 'costs' },
    { id: genRid(), from: nodes[8].id, to: nodes[1].id, label: 'identifies' },
  ];
  return { nodes, edges };
}

function makeConcreteConditionSurvey(): RelationshipGraph {
  const base = { x: 60, y: 60 };
  const dx = 230;
  const nodes: RNode[] = [
    { id: genRid(), type: 'member',      label: 'Column C-12',        subtitle: 'Parking Level B2',     x: base.x,          y: base.y },
    { id: genRid(), type: 'defect',      label: 'Carbonation Crack',  subtitle: 'Vertical, 600 mm',     x: base.x + dx,     y: base.y, status: 'open' },
    { id: genRid(), type: 'measurement', label: 'Width 0.35 mm',      subtitle: 'Limit 0.20 mm ACI',    x: base.x + dx * 2, y: base.y },
    { id: genRid(), type: 'finding',     label: 'Rebar Corrosion',    subtitle: 'Cover 18 mm (low)',    x: base.x + dx,     y: base.y + 110 },
    { id: genRid(), type: 'risk',        label: 'Spall Risk',         subtitle: 'Falling concrete',     x: base.x + dx * 2, y: base.y + 110, riskSeverity: 3, riskLikelihood: 4 },
    { id: genRid(), type: 'action',      label: 'Crack Injection',    subtitle: 'Epoxy LV + wrap',      x: base.x,          y: base.y + 220, status: 'open' },
    { id: genRid(), type: 'checklist',   label: 'Repair Checklist',   subtitle: 'Pre-injection steps',  x: base.x + dx,     y: base.y + 220,
      checklistItems: [
        { id: genRid(), text: 'Clean crack faces', done: false },
        { id: genRid(), text: 'Install injection ports', done: false },
        { id: genRid(), text: 'Seal crack surface', done: false },
        { id: genRid(), text: 'Inject epoxy', done: false },
      ],
    },
    { id: genRid(), type: 'code-ref',    label: 'ACI 224R-01',        subtitle: 'Crack control',        x: base.x + dx * 2, y: base.y + 220 },
    { id: genRid(), type: 'cost',        label: 'Cost Est. $6,800',   subtitle: 'Materials + labour',   x: base.x + dx * 3, y: base.y + 220 },
    { id: genRid(), type: 'document',    label: 'Condition Survey',   subtitle: 'CS-2026-03',           x: base.x + dx * 3, y: base.y },
  ];
  const edges: REdge[] = [
    { id: genRid(), from: nodes[0].id, to: nodes[1].id, label: 'has defect' },
    { id: genRid(), from: nodes[1].id, to: nodes[2].id, label: 'measured' },
    { id: genRid(), from: nodes[1].id, to: nodes[3].id, label: 'causes' },
    { id: genRid(), from: nodes[3].id, to: nodes[4].id, label: 'elevates' },
    { id: genRid(), from: nodes[4].id, to: nodes[5].id, label: 'requires' },
    { id: genRid(), from: nodes[5].id, to: nodes[6].id, label: 'uses' },
    { id: genRid(), from: nodes[7].id, to: nodes[5].id, label: 'governs' },
    { id: genRid(), from: nodes[5].id, to: nodes[8].id, label: 'costs' },
    { id: genRid(), from: nodes[9].id, to: nodes[1].id, label: 'documents' },
  ];
  return { nodes, edges };
}

const TEMPLATES: { label: string; fn: () => RelationshipGraph }[] = [
  { label: 'Bridge Deck Survey',        fn: makeBridgeDeckSurvey },
  { label: 'Building Envelope',         fn: makeBuildingEnvelope },
  { label: 'Steel Frame Inspection',    fn: makeSteelFrameInspection },
  { label: 'Concrete Condition Survey', fn: makeConcreteConditionSurvey },
];

// ── Report Generator ──────────────────────────────────────────────────────────

function generateReport(graph: RelationshipGraph): void {
  const totalNodes = graph.nodes.length;
  const findings   = graph.nodes.filter(n => n.type === 'finding' || n.type === 'defect').length;
  const actions    = graph.nodes.filter(n => n.type === 'action').length;
  const costNodes  = graph.nodes.filter(n => n.type === 'cost');
  const hasCost    = costNodes.length > 0;

  const sectionOrder: RNodeType[] = [
    'finding', 'defect', 'member', 'measurement', 'risk',
    'cost', 'action', 'deadline', 'checklist', 'code-ref', 'document',
    'inspection', 'photo', 'material', 'markup',
  ];
  const sectionTitles: Partial<Record<RNodeType, string>> = {
    finding:     'Finding / Defect',
    defect:      'Defect',
    member:      'Member',
    measurement: 'Measurement',
    risk:        'Risk Assessment',
    cost:        'Cost',
    action:      'Action Items',
    deadline:    'Deadlines / Schedule',
    checklist:   'Checklist Status',
    'code-ref':  'Code References',
    document:    'Documents',
    inspection:  'Inspections',
    photo:       'Photos',
    material:    'Materials',
    markup:      'Markup Annotations',
  };

  function nodeRows(type: RNodeType): string {
    const nodes = graph.nodes.filter(n => n.type === type);
    if (!nodes.length) return '';
    const title = sectionTitles[type] ?? NODE_CFG[type].label;
    const rows = nodes.map(n => {
      let extra = '';
      if (n.type === 'risk') {
        const sc = riskScore(n);
        const col = riskColor(sc);
        extra = `<td style="color:${col};font-weight:600;">S${n.riskSeverity ?? 1} × L${n.riskLikelihood ?? 1} = ${sc}</td>`;
      } else if (n.type === 'deadline') {
        const overdue = n.dueDate && n.dueDate < TODAY && n.status !== 'resolved';
        extra = `<td style="${overdue ? 'color:#dc2626;font-weight:600;' : ''}">${overdue ? '⚠ Overdue — ' : ''}${n.dueDate ?? '—'}</td>`;
      } else if (n.type === 'checklist') {
        const items = n.checklistItems ?? [];
        const done  = items.filter(i => i.done).length;
        extra = `<td>${done}/${items.length} items complete</td>`;
      } else {
        extra = `<td></td>`;
      }
      const statusCell = n.status && n.status !== 'open'
        ? `<td><span style="background:${STATUS_COLOR[n.status]};color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">${n.status}</span></td>`
        : `<td>${n.status === 'open' ? '<span style="background:#ef4444;color:#fff;padding:1px 6px;border-radius:4px;font-size:10px;">open</span>' : '—'}</td>`;
      return `<tr><td>${n.label}</td><td style="color:#555;">${n.subtitle ?? '—'}</td>${statusCell}${extra}</tr>`;
    }).join('');

    const extraHeader = (type === 'risk') ? '<th>Risk Score</th>'
      : (type === 'deadline') ? '<th>Due Date</th>'
      : (type === 'checklist') ? '<th>Progress</th>'
      : '<th></th>';

    return `
      <section style="margin-bottom:28px;">
        <h2 style="font-size:15px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:10px;">${title}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:#f1f5f9;color:#475569;">
            <th style="text-align:left;padding:6px 8px;">Label</th>
            <th style="text-align:left;padding:6px 8px;">Detail</th>
            <th style="text-align:left;padding:6px 8px;">Status</th>
            ${extraHeader}
          </tr></thead>
          <tbody style="color:#1e293b;">${rows.replace(/<tr>/g, '<tr style="border-bottom:1px solid #f1f5f9;">').replace(/<td>/g, '<td style="padding:5px 8px;">').replace(/<\/td>/g, '</td>')}</tbody>
        </table>
      </section>`;
  }

  const sections = sectionOrder
    .filter(t => graph.nodes.some(n => n.type === t))
    .map(t => nodeRows(t))
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Structural Inspection Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #fff; color: #1e293b; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 48px; }
    @media print { .no-print { display: none !important; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="no-print" style="margin-bottom:20px;">
      <button onclick="window.print()" style="background:#1e293b;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;">Print</button>
    </div>
    <div style="border-bottom:3px solid #1e293b;padding-bottom:16px;margin-bottom:24px;">
      <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;">Structural Inspection Report</h1>
      <p style="color:#64748b;font-size:13px;margin:0;">Generated: ${TODAY}</p>
    </div>
    <section style="margin-bottom:28px;">
      <h2 style="font-size:15px;font-weight:700;color:#1e293b;border-bottom:2px solid #e2e8f0;padding-bottom:6px;margin-bottom:10px;">Summary</h2>
      <table style="border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:4px 16px 4px 0;color:#475569;">Total Nodes</td><td style="font-weight:600;">${totalNodes}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#475569;">Findings / Defects</td><td style="font-weight:600;">${findings}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#475569;">Action Items</td><td style="font-weight:600;">${actions}</td></tr>
        ${hasCost ? `<tr><td style="padding:4px 16px 4px 0;color:#475569;">Cost Nodes</td><td style="font-weight:600;">${costNodes.length}</td></tr>` : ''}
      </table>
    </section>
    ${sections}
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportCSV(graph: RelationshipGraph): void {
  const header = ['ID', 'Type', 'Label', 'Detail', 'Status', 'Due Date', 'Risk Score', 'Connections'];
  const rows = graph.nodes.map(n => {
    const conns = graph.edges.filter(e => e.from === n.id || e.to === n.id).length;
    const sc = n.type === 'risk' ? String(riskScore(n)) : '';
    const due = n.dueDate ?? '';
    const status = n.status ?? '';
    const vals = [n.id, n.type, n.label, n.subtitle ?? '', status, due, sc, String(conns)];
    return vals.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  const csv = [header.join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relationship-map.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  graph: RelationshipGraph;
  onChange: (g: RelationshipGraph) => void;
  boardNames?: Record<string, string>;
  activeBoardId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RelationshipMap({ graph, onChange, boardNames, activeBoardId }: Props) {
  const [expanded,        setExpanded]        = useState(false);
  const [pan,             setPan]             = useState<Pt>({ x: 60, y: 60 });
  const [scale,           setScale]           = useState(1);
  const [selectedNode,    setSelectedNode]    = useState<string | null>(null);
  const [selectedEdge,    setSelectedEdge]    = useState<string | null>(null);
  const [showPalette,     setShowPalette]     = useState(false);
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [edgePreview,     setEdgePreview]     = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [photoLightbox,   setPhotoLightbox]   = useState<string | null>(null);
  const [newCheckItem,    setNewCheckItem]    = useState('');
  const [ctxMenu,         setCtxMenu]         = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [collapsed,       setCollapsed]       = useState<Set<string>>(new Set());
  const [locked,          setLocked]          = useState(false);
  const [showMinimap,     setShowMinimap]     = useState(true);
  // Feature 8: Edge inline label editing
  const [editingEdgeId,   setEditingEdgeId]   = useState<string | null>(null);
  const [editingEdgeText, setEditingEdgeText] = useState('');
  // Feature 9: Critical path
  const [criticalPath,    setCriticalPath]    = useState<{ nodeIds: Set<string>; edgeIds: Set<string> } | null>(null);

  const svgRef        = useRef<SVGSVGElement>(null);
  const isPanning     = useRef(false);
  const panStart      = useRef<Pt>({ x: 0, y: 0 });
  const panOrigin     = useRef<Pt>({ x: 0, y: 0 });
  const draggingId    = useRef<string | null>(null);
  const dragOffset    = useRef<Pt>({ x: 0, y: 0 });
  const drawingFrom   = useRef<string | null>(null);
  const didDrag       = useRef(false);

  // ── Feature 1: Undo/Redo ──────────────────────────────────────────────────
  const historyRef = useRef<{ past: RelationshipGraph[]; future: RelationshipGraph[] }>({ past: [], future: [] });

  const commit = useCallback((newGraph: RelationshipGraph) => {
    historyRef.current.past.push(graph);
    historyRef.current.future = [];
    if (historyRef.current.past.length > 50) historyRef.current.past.shift();
    onChange(newGraph);
  }, [graph, onChange]);

  const undo = useCallback(() => {
    const prev = historyRef.current.past.pop();
    if (!prev) return;
    historyRef.current.future.push(graph);
    onChange(prev);
  }, [graph, onChange]);

  const redo = useCallback(() => {
    const next = historyRef.current.future.pop();
    if (!next) return;
    historyRef.current.past.push(graph);
    onChange(next);
  }, [graph, onChange]);

  const toCanvas = useCallback((cx: number, cy: number): Pt => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: (cx - rect.left - pan.x) / scale,
      y: (cy - rect.top  - pan.y) / scale,
    };
  }, [pan, scale]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!expanded) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (photoLightbox) { setPhotoLightbox(null); return; }
        setExpanded(false); setShowPalette(false); setShowTemplates(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) {
        if (selectedNode) {
          commit({ ...graph, nodes: graph.nodes.filter(n => n.id !== selectedNode), edges: graph.edges.filter(ed => ed.from !== selectedNode && ed.to !== selectedNode) });
          setSelectedNode(null);
        }
        if (selectedEdge) {
          commit({ ...graph, edges: graph.edges.filter(ed => ed.id !== selectedEdge) });
          setSelectedEdge(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNode && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        const src = graph.nodes.find(n => n.id === selectedNode);
        if (src) {
          const newNode = { ...src, id: genRid(), x: src.x + 30, y: src.y + 30 };
          commit({ ...graph, nodes: [...graph.nodes, newNode] });
          setSelectedNode(newNode.id);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [expanded, selectedNode, selectedEdge, graph, commit, undo, redo, photoLightbox]);

  // ── Add node ──────────────────────────────────────────────────────────────
  const addNode = useCallback((type: RNodeType) => {
    const cw = svgRef.current?.clientWidth  ?? 800;
    const ch = svgRef.current?.clientHeight ?? 500;
    const x  = (cw / 2 - pan.x) / scale - EXP_W / 2;
    const y  = (ch / 2 - pan.y) / scale - EXP_H / 2;
    const cfg = NODE_CFG[type];
    commit({ ...graph, nodes: [...graph.nodes, { id: genRid(), type, label: cfg.label, subtitle: 'Add detail…', x, y }] });
    setShowPalette(false);
  }, [graph, commit, pan, scale]);

  // ── Update node helper ───────────────────────────────────────────────────
  const updateNode = useCallback((id: string, patch: Partial<RNode>) => {
    commit({ ...graph, nodes: graph.nodes.map(n => n.id === id ? { ...n, ...patch } : n) });
  }, [graph, commit]);

  // ── SVG pointer handlers ──────────────────────────────────────────────────
  const onSvgDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const t = e.target as Element;
    if (e.button === 1 || (e.button === 0 && (t.tagName === 'svg' || t.getAttribute('data-bg') === '1'))) {
      isPanning.current = true;
      panStart.current  = { x: e.clientX, y: e.clientY };
      panOrigin.current = { ...pan };
      (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    }
    if (t.tagName === 'svg' || t.getAttribute('data-bg') === '1') {
      setSelectedNode(null); setSelectedEdge(null); setCtxMenu(null);
    }
  }, [pan]);

  const onSvgMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning.current) {
      setPan({ x: panOrigin.current.x + e.clientX - panStart.current.x, y: panOrigin.current.y + e.clientY - panStart.current.y });
    }
    if (draggingId.current) {
      didDrag.current = true;
      const cv = toCanvas(e.clientX, e.clientY);
      // Live preview: use onChange directly (skip history during drag)
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
    // Commit final drag position into history
    if (draggingId.current && didDrag.current) {
      const draggedNode = graph.nodes.find(n => n.id === draggingId.current);
      if (draggedNode) {
        // graph already has the final position from live onChange calls; commit it
        commit(graph);
      }
    }
    draggingId.current = null;
    drawingFrom.current = null;
    setEdgePreview(null);
  }, [graph, commit]);

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
    if (locked) { setSelectedNode(nodeId); setSelectedEdge(null); return; }
    setSelectedNode(nodeId); setSelectedEdge(null);
    const node = graph.nodes.find(n => n.id === nodeId)!;
    const cv = toCanvas(e.clientX, e.clientY);
    draggingId.current = nodeId;
    dragOffset.current = { x: cv.x - node.x, y: cv.y - node.y };
    didDrag.current = false;
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [graph, toCanvas]);

  const onNodeClick = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (didDrag.current) return;
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node && (node.type === 'photo' || node.type === 'defect') && node.photoData) {
      setPhotoLightbox(node.photoData);
    }
  }, [graph]);

  const onOutPortDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    if (locked) return;
    drawingFrom.current = nodeId;
    svgRef.current?.setPointerCapture(e.pointerId);
  }, [locked]);

  const onInPortUp = useCallback((e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    const from = drawingFrom.current;
    if (from && from !== nodeId && !graph.edges.some(ed => ed.from === from && ed.to === nodeId)) {
      commit({ ...graph, edges: [...graph.edges, { id: genRid(), from, to: nodeId, label: '' }] });
    }
    drawingFrom.current = null;
    setEdgePreview(null);
  }, [graph, commit]);

  // ── Feature 2: Auto-layout ────────────────────────────────────────────────
  const autoLayout = useCallback(() => {
    const nodes = graph.nodes;
    const edges = graph.edges;
    if (nodes.length === 0) return;

    const inDeg: Record<string, number> = {};
    const outEdges: Record<string, string[]> = {};
    nodes.forEach(n => { inDeg[n.id] = 0; outEdges[n.id] = []; });
    edges.forEach(e => {
      inDeg[e.to] = (inDeg[e.to] ?? 0) + 1;
      outEdges[e.from] = [...(outEdges[e.from] ?? []), e.to];
    });

    const depth: Record<string, number> = {};
    nodes.filter(n => (inDeg[n.id] ?? 0) === 0).forEach(n => { depth[n.id] = 0; });

    const bfsQ = nodes.filter(n => depth[n.id] !== undefined).map(n => n.id);
    const visited = new Set<string>();
    while (bfsQ.length > 0) {
      const id = bfsQ.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      (outEdges[id] ?? []).forEach(toId => {
        depth[toId] = Math.max(depth[toId] ?? 0, (depth[id] ?? 0) + 1);
        bfsQ.push(toId);
      });
    }
    nodes.forEach(n => { if (depth[n.id] === undefined) depth[n.id] = 0; });

    const COL_W = 230, ROW_H = 110, PAD_X = 60, PAD_Y = 60;
    const byDepth: Record<number, string[]> = {};
    nodes.forEach(n => { const d = depth[n.id]; (byDepth[d] ??= []).push(n.id); });

    const newNodes = nodes.map(n => {
      const d = depth[n.id];
      const col = byDepth[d] ?? [];
      const row = col.indexOf(n.id);
      const colH = col.length * ROW_H;
      return { ...n, x: PAD_X + d * COL_W, y: PAD_Y + row * ROW_H - colH / 2 + 200 };
    });

    commit({ ...graph, nodes: newNodes });
    setPan({ x: 60, y: 60 });
    setScale(1);
  }, [graph, commit]);

  // ── Feature 4: Path highlighting ──────────────────────────────────────────
  const connectedPath = useMemo(() => {
    if (!selectedNode) return null;
    const nodeIds = new Set<string>([selectedNode]);
    const edgeIds = new Set<string>();
    const queue = [selectedNode];
    while (queue.length > 0) {
      const id = queue.shift()!;
      graph.edges.forEach(e => {
        if (e.from === id && !nodeIds.has(e.to)) {
          nodeIds.add(e.to); edgeIds.add(e.id); queue.push(e.to);
        }
        if (e.to === id && !nodeIds.has(e.from)) {
          nodeIds.add(e.from); edgeIds.add(e.id); queue.push(e.from);
        }
      });
    }
    return { nodeIds, edgeIds };
  }, [selectedNode, graph]);

  // ── Feature 5: Export PNG ─────────────────────────────────────────────────
  const exportPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale2x = 2;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = rect.width  * scale2x;
      canvas.height = rect.height * scale2x;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `relationship-map-${Date.now()}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }, []);

  // ── Feature 6: Zoom to fit selection ─────────────────────────────────────
  const fitSelection = useCallback(() => {
    if (!selectedNode) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    // Collect selected + immediate neighbors
    const ids = new Set<string>([selectedNode]);
    graph.edges.forEach(e => {
      if (e.from === selectedNode) ids.add(e.to);
      if (e.to   === selectedNode) ids.add(e.from);
    });
    const nodes = graph.nodes.filter(n => ids.has(n.id));
    if (nodes.length === 0) return;
    const pad = 80;
    const x0 = Math.min(...nodes.map(n => n.x)) - pad;
    const y0 = Math.min(...nodes.map(n => n.y)) - pad;
    const x1 = Math.max(...nodes.map(n => n.x + EXP_W)) + pad;
    const y1 = Math.max(...nodes.map(n => n.y + EXP_H)) + pad;
    const gw = x1 - x0, gh = y1 - y0;
    const vw = svgEl.clientWidth, vh = svgEl.clientHeight;
    const newScale = Math.min(vw / gw, vh / gh, 2);
    setScale(newScale);
    setPan({ x: vw / 2 - (x0 + gw / 2) * newScale, y: vh / 2 - (y0 + gh / 2) * newScale });
  }, [selectedNode, graph]);

  // ── Feature 9: Critical path ──────────────────────────────────────────────
  const computeCriticalPath = useCallback(() => {
    if (criticalPath) { setCriticalPath(null); return; }
    const nodes = graph.nodes;
    const edges = graph.edges;
    if (nodes.length === 0) return;

    // Build adjacency
    const outEdgesMap: Record<string, { to: string; edgeId: string }[]> = {};
    nodes.forEach(n => { outEdgesMap[n.id] = []; });
    edges.forEach(e => { outEdgesMap[e.from]?.push({ to: e.to, edgeId: e.id }); });

    // DFS longest path from each root
    let bestPath: string[] = [];
    let bestEdgePath: string[] = [];

    const dfs = (nodeId: string, pathNodes: string[], pathEdges: string[], visited: Set<string>) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      pathNodes.push(nodeId);
      if (pathNodes.length > bestPath.length) {
        bestPath = [...pathNodes];
        bestEdgePath = [...pathEdges];
      }
      for (const { to, edgeId } of (outEdgesMap[nodeId] ?? [])) {
        dfs(to, pathNodes, [...pathEdges, edgeId], new Set(visited));
      }
      pathNodes.pop();
    };

    // Find roots (no incoming edges)
    const hasIncoming = new Set(edges.map(e => e.to));
    const roots = nodes.filter(n => !hasIncoming.has(n.id));
    (roots.length > 0 ? roots : nodes.slice(0, 1)).forEach(r => {
      dfs(r.id, [], [], new Set());
    });

    setCriticalPath({
      nodeIds: new Set(bestPath),
      edgeIds: new Set(bestEdgePath),
    });
  }, [graph, criticalPath]);

  // Feature 9: Reset critical path when selectedNode changes
  useEffect(() => { setCriticalPath(null); }, [selectedNode]);

  // ── Node renderer ─────────────────────────────────────────────────────────
  const renderNode = (n: RNode, exp: boolean) => {
    const cfg = NODE_CFG[n.type];
    const isCollapsed = exp && collapsed.has(n.id);
    const w   = exp ? EXP_W : CMP_W;
    const h   = isCollapsed ? EXP_HDR : (exp ? EXP_H : CMP_H);
    const hdr = exp ? EXP_HDR : CMP_HDR;
    const isSel = n.id === selectedNode;

    // Feature 4: dim non-connected nodes when a selection exists
    // Feature 9: if no connectedPath, use criticalPath for dimming
    const dimmed = exp && (
      connectedPath !== null
        ? !connectedPath.nodeIds.has(n.id)
        : criticalPath !== null && !criticalPath.nodeIds.has(n.id)
    );

    // Risk node color override
    let nodeColor = cfg.color;
    if (n.type === 'risk' && exp) {
      nodeColor = riskColor(riskScore(n));
    }

    // Extra body content for expanded view
    const bodyExtras: React.ReactNode[] = [];
    if (exp && !isCollapsed) {
      // Status pill (not 'open', only show non-default)
      if (n.status && n.status !== 'open') {
        bodyExtras.push(
          <rect key="st-bg" x={5} y={57} width={52} height={13} rx={3} fill={STATUS_COLOR[n.status]} opacity={0.9}/>,
          <text key="st-txt" x={9} y={65} fill="white" fontSize={7.5} fontFamily="sans-serif" dominantBaseline="middle">{n.status}</text>
        );
      }

      // Risk score
      if (n.type === 'risk') {
        const sc  = riskScore(n);
        const col = riskColor(sc);
        bodyExtras.push(
          <text key="risk" x={7} y={68} fill={col} fontSize={8.5} fontFamily="sans-serif" fontWeight="bold">
            {`S×L = ${sc}`}
          </text>
        );
      }

      // Deadline date
      if (n.type === 'deadline' && n.dueDate) {
        const overdue = n.dueDate < TODAY && n.status !== 'resolved';
        bodyExtras.push(
          <text key="due" x={7} y={68} fill={overdue ? '#ef4444' : '#94a3b8'} fontSize={8} fontFamily="sans-serif">
            {overdue ? `⚠ Overdue` : n.dueDate}
          </text>
        );
      }

      // Checklist progress
      if (n.type === 'checklist') {
        const items = n.checklistItems ?? [];
        const done  = items.filter(i => i.done).length;
        const pct   = items.length > 0 ? done / items.length : 0;
        bodyExtras.push(
          <text key="ck-txt" x={7} y={66} fill="#94a3b8" fontSize={8} fontFamily="sans-serif">{`${done}/${items.length} done`}</text>,
          <rect key="ck-bg"  x={0} y={h - 3} width={w} height={3} fill="#334155"/>,
          <rect key="ck-bar" x={0} y={h - 3} width={w * pct} height={3} fill="#10b981"/>
        );
      }

      // Photo/defect camera indicator
      if ((n.type === 'photo' || n.type === 'defect') && n.photoData) {
        bodyExtras.push(
          <text key="cam" x={w - 14} y={h - 8} fill="#a78bfa" fontSize={10} fontFamily="sans-serif" style={{ cursor: 'pointer' }}>📷</text>
        );
      }

      // Cross-board link indicator
      if (n.crossBoardRef && boardNames) {
        const bName = boardNames[n.crossBoardRef] ?? n.crossBoardRef;
        const short = bName.length > 12 ? bName.slice(0, 12) + '…' : bName;
        bodyExtras.push(
          <text key="xb" x={w - 5} y={h - 8} fill="#60a5fa" fontSize={7.5} fontFamily="sans-serif" textAnchor="end">{`→ ${short}`}</text>
        );
      }
    }

    return (
      <g key={n.id} transform={`translate(${n.x},${n.y})`}
        opacity={dimmed ? 0.3 : undefined}
        style={{ cursor: exp ? 'grab' : 'pointer' }}
        onPointerDown={exp ? (e) => onNodeDown(e, n.id) : undefined}
        onPointerUp={exp ? (e) => onNodeClick(e, n.id) : undefined}
        onContextMenu={exp ? (e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          if (!locked) setCtxMenu({ nodeId: n.id, x: e.clientX, y: e.clientY });
        } : undefined}>

        {isSel && <rect x={-3} y={-3} width={w + 6} height={h + 6} rx={5}
          fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 2"/>}

        <rect x={0} y={0} width={w} height={h} rx={4}
          fill="#1e293b" stroke={isSel ? '#60a5fa' : nodeColor} strokeWidth={isSel ? 1.5 : 1}/>

        <path d={`M 4 0 L ${w - 4} 0 Q ${w} 0 ${w} 4 L ${w} ${hdr} L 0 ${hdr} L 0 4 Q 0 0 4 0 Z`}
          fill={nodeColor}
          onDoubleClick={exp ? (e: React.MouseEvent) => {
            e.stopPropagation();
            setCollapsed(prev => { const s = new Set(prev); s.has(n.id) ? s.delete(n.id) : s.add(n.id); return s; });
          } : undefined}/>

        <text x={exp ? 7 : 5} y={exp ? 15 : 10}
          fill="white" fontSize={exp ? 9 : 7}
          fontFamily="sans-serif" fontWeight="bold" dominantBaseline="middle">
          {exp ? cfg.label.toUpperCase() : cfg.headerText}
        </text>

        {!isCollapsed && (
          <text x={exp ? 7 : 5} y={hdr + (exp ? 13 : 11)}
            fill="#f1f5f9" fontSize={exp ? 10.5 : 8}
            fontFamily="sans-serif" fontWeight="600">
            {n.label.length > (exp ? 19 : 11) ? n.label.slice(0, exp ? 19 : 11) + '…' : n.label}
          </text>
        )}

        {!isCollapsed && exp && n.subtitle && (
          <text x={7} y={hdr + 29} fill="#94a3b8" fontSize={8.5} fontFamily="sans-serif">
            {n.subtitle.length > 23 ? n.subtitle.slice(0, 23) + '…' : n.subtitle}
          </text>
        )}

        {!isCollapsed && bodyExtras}

        {/* Feature 9: Critical path gold left border */}
        {exp && criticalPath && connectedPath === null && criticalPath.nodeIds.has(n.id) && (
          <rect x={-2} y={0} width={3} height={h} fill="#f59e0b"/>
        )}

        {/* Feature 10: Tags badge */}
        {exp && n.tags && n.tags.length > 0 && (
          <text x={w - 6} y={hdr - 4} fill="white" fontSize={7} fontFamily="sans-serif" textAnchor="end" opacity={0.8}>
            {n.tags.length}⚑
          </text>
        )}

        {exp && (
          <circle cx={0} cy={isCollapsed ? EXP_HDR / 2 : h / 2} r={6}
            fill="#0f172a" stroke={nodeColor} strokeWidth={1.5}
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onPointerUp={e => onInPortUp(e, n.id)}/>
        )}
        {exp && (
          <circle cx={w} cy={isCollapsed ? EXP_HDR / 2 : h / 2} r={6}
            fill={nodeColor} stroke="white" strokeWidth={1}
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
    const fnCollapsed = exp && collapsed.has(fn.id);
    const tnCollapsed = exp && collapsed.has(tn.id);
    const p1 = exp
      ? { x: fn.x + EXP_W, y: fn.y + (fnCollapsed ? EXP_HDR / 2 : EXP_H / 2) }
      : outPort(fn, exp);
    const p2 = exp
      ? { x: tn.x, y: tn.y + (tnCollapsed ? EXP_HDR / 2 : EXP_H / 2) }
      : inPort(tn, exp);
    const isSel = ed.id === selectedEdge;
    const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;

    // Feature 4: dim non-connected edges
    // Feature 9: if no connectedPath, use criticalPath
    const dimmedEdge = exp && (
      connectedPath !== null
        ? !connectedPath.edgeIds.has(ed.id)
        : criticalPath !== null && !criticalPath.edgeIds.has(ed.id)
    );
    // Feature 9: critical path edge color
    const isOnCriticalPath = exp && criticalPath !== null && connectedPath === null && criticalPath.edgeIds.has(ed.id);
    const edgeStroke = isSel ? '#60a5fa' : isOnCriticalPath ? '#f59e0b' : '#475569';

    return (
      <g key={ed.id}>
        <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
          fill="none" stroke="transparent" strokeWidth={12}
          style={{ cursor: 'pointer' }}
          onClick={() => { setSelectedEdge(ed.id); setSelectedNode(null); }}/>
        <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)}
          fill="none"
          stroke={edgeStroke}
          strokeWidth={exp ? (isSel ? 2 : 1.5) : 1}
          strokeDasharray={exp ? undefined : '5 3'}
          opacity={dimmedEdge ? 0.2 : undefined}/>
        {exp && !dimmedEdge && (
          <polygon
            points={`${p2.x - 8},${p2.y - 4} ${p2.x},${p2.y} ${p2.x - 8},${p2.y + 4}`}
            fill={edgeStroke}/>
        )}
        {exp && dimmedEdge && (
          <polygon
            points={`${p2.x - 8},${p2.y - 4} ${p2.x},${p2.y} ${p2.x - 8},${p2.y + 4}`}
            fill={edgeStroke}
            opacity={0.2}/>
        )}
        {/* Feature 8: Edge label with double-click to edit */}
        {exp && (
          <g onDoubleClick={e => {
            e.stopPropagation();
            setEditingEdgeId(ed.id);
            setEditingEdgeText(ed.label ?? '');
          }}>
            <rect x={mx - 30} y={my - 10} width={60} height={20} fill="transparent" style={{ cursor: 'text' }}/>
            {ed.label ? (
              <text x={mx} y={my - 5} fill="#64748b" fontSize={8} fontFamily="sans-serif" textAnchor="middle"
                style={{ cursor: 'text' }}>{ed.label}</text>
            ) : (
              <text x={mx} y={my - 5} fill="#334155" fontSize={8} fontFamily="sans-serif" textAnchor="middle"
                style={{ cursor: 'text' }}>+label</text>
            )}
          </g>
        )}
      </g>
    );
  };

  // ── Compact view ──────────────────────────────────────────────────────────
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
        <div className="border-b border-slate-700 shrink-0">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Relationship Map</span>
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
          {/* Feature 7: Summary strip */}
          {graph.nodes.length > 0 && (() => {
            const TODAY_STR = new Date().toISOString().slice(0, 10);
            const openFindings = graph.nodes.filter(n =>
              (n.type === 'finding' || n.type === 'defect') && n.status !== 'resolved'
            ).length;
            const totalCost = graph.nodes
              .filter(n => n.type === 'cost' && n.costAmount)
              .reduce((s, n) => s + (n.costAmount ?? 0), 0);
            const overdue = graph.nodes.filter(n =>
              n.type === 'deadline' && n.dueDate && n.dueDate < TODAY_STR && n.status !== 'resolved'
            ).length;
            const parts: React.ReactNode[] = [];
            if (openFindings > 0) parts.push(<span key="f" className="text-slate-400">{openFindings} finding{openFindings > 1 ? 's' : ''}</span>);
            if (totalCost > 0) parts.push(<span key="c" className="text-slate-400">${totalCost.toLocaleString()}</span>);
            if (overdue > 0) parts.push(<span key="o" className="text-red-400">{overdue} overdue</span>);
            if (parts.length === 0) return null;
            return (
              <div className="flex items-center gap-2 px-2 pb-1 text-[9px] flex-wrap">
                {parts.map((p, i) => (
                  <React.Fragment key={i}>{i > 0 && <span className="text-slate-700">·</span>}{p}</React.Fragment>
                ))}
              </div>
            );
          })()}
        </div>
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
        <div className="flex-1 overflow-hidden">
          {!hasNodes ? (
            <div className="flex flex-col items-center justify-center h-full gap-1.5">
              <span className="text-[10px] text-slate-600 text-center px-3">
                No nodes yet.<br/>Click + to add or expand to blueprint editor.
              </span>
              <button onClick={() => setExpanded(true)}
                className="text-[10px] text-blue-500 hover:text-blue-400 underline">Open editor</button>
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

  // ── Properties panel ──────────────────────────────────────────────────────
  const selNode = graph.nodes.find(n => n.id === selectedNode) ?? null;
  const selEdge = graph.edges.find(e => e.id === selectedEdge) ?? null;

  const renderPropertiesPanel = () => (
    <div className="w-56 shrink-0 bg-slate-900 border-l border-slate-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Properties</span>
        {(selectedNode || selectedEdge) && (
          <button onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
            className="text-slate-500 hover:text-white"><X size={11}/></button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {locked && (
          <div className="px-4 py-6 text-center text-xs text-amber-400 space-y-2">
            <div>🔒 Graph is locked</div>
            <div className="text-slate-500">Unlock to edit nodes and connections.</div>
          </div>
        )}
        {!locked && selNode && (() => {
          const cfg = NODE_CFG[selNode.type];
          const sc  = riskScore(selNode);
          return (
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-700"
                style={{ borderTopColor: cfg.color, borderTopWidth: 3, paddingTop: 8, marginTop: -4 }}>
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: cfg.color }}/>
                <span className="text-[10px] font-bold uppercase text-slate-300">{cfg.label}</span>
              </div>

              {/* Label */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Label</label>
                <input value={selNode.label}
                  onChange={e => updateNode(selNode.id, { label: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Detail / Subtitle</label>
                <input value={selNode.subtitle ?? ''}
                  onChange={e => updateNode(selNode.id, { subtitle: e.target.value })}
                  placeholder="e.g. $2,400 est. · May 2025"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
              </div>

              {/* Type */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Type</label>
                <select value={selNode.type}
                  onChange={e => updateNode(selNode.id, { type: e.target.value as RNodeType })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                  {(Object.entries(NODE_CFG) as [RNodeType, typeof NODE_CFG[RNodeType]][]).map(([t, c]) => (
                    <option key={t} value={t}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Feature 3: Type-specific fields */}
              {selNode.type === 'member' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Section</label>
                    <input value={selNode.memberSection ?? ''} placeholder="e.g. W18×55"
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, memberSection: e.target.value} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Material</label>
                    <input value={selNode.memberMaterial ?? ''} placeholder="e.g. A36"
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, memberMaterial: e.target.value} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Span</label>
                    <input value={selNode.memberSpan ?? ''} placeholder="e.g. 24 ft"
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, memberSpan: e.target.value} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                  </div>
                </>
              )}

              {selNode.type === 'defect' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Severity</label>
                    <select value={selNode.defectClass ?? ''}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, defectClass: e.target.value as RNode['defectClass']} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      <option value="">— select —</option>
                      <option value="hairline">Hairline</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Affected Area</label>
                    <input value={selNode.defectArea ?? ''} placeholder="e.g. 0.8 m²"
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, defectArea: e.target.value} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                  </div>
                </>
              )}

              {selNode.type === 'cost' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Amount (USD)</label>
                    <input type="number" min={0} value={selNode.costAmount ?? ''}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, costAmount: Number(e.target.value)} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Labor %</label>
                    <input type="range" min={0} max={100} value={selNode.costLaborPct ?? 50}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, costLaborPct: Number(e.target.value)} : n)})}
                      className="w-full accent-blue-500 h-1.5"/>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>Labor: {selNode.costLaborPct ?? 50}%</span>
                      <span>Material: {100 - (selNode.costLaborPct ?? 50)}%</span>
                    </div>
                  </div>
                </>
              )}

              {selNode.type === 'inspection' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Method</label>
                    <select value={selNode.inspectionMethod ?? ''}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, inspectionMethod: e.target.value} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      <option value="">— select —</option>
                      {['Visual','UT','PT','GPR','Core Sample','Load Test'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Result</label>
                    <select value={selNode.inspectionResult ?? ''}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, inspectionResult: e.target.value as RNode['inspectionResult']} : n)})}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                      <option value="">— select —</option>
                      <option value="pass">Pass</option>
                      <option value="monitor">Monitor</option>
                      <option value="fail">Fail</option>
                    </select>
                  </div>
                </>
              )}

              {selNode.type === 'measurement' && (
                <>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Value</label>
                      <input value={selNode.measurementValue ?? ''}
                        onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, measurementValue: e.target.value} : n)})}
                        placeholder="0.35"
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                    </div>
                    <div className="w-16">
                      <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Unit</label>
                      <select value={selNode.measurementUnit ?? 'mm'}
                        onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, measurementUnit: e.target.value} : n)})}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                        {['mm','in','ft','m','m²','%'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Design Limit</label>
                    <input value={selNode.measurementLimit ?? ''}
                      onChange={e => commit({...graph, nodes: graph.nodes.map(n => n.id===selNode.id ? {...n, measurementLimit: e.target.value} : n)})}
                      placeholder="e.g. 0.20 mm ACI"
                      className={`w-full bg-slate-700 border rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                        selNode.measurementValue && selNode.measurementLimit && Number(selNode.measurementValue) > Number(selNode.measurementLimit.split(' ')[0])
                          ? 'border-red-500' : 'border-slate-600'
                      }`}/>
                    {selNode.measurementValue && selNode.measurementLimit && Number(selNode.measurementValue) > Number(selNode.measurementLimit.split(' ')[0]) && (
                      <p className="text-[9px] text-red-400 mt-0.5">⚠ Exceeds design limit</p>
                    )}
                  </div>
                </>
              )}

              {/* Status */}
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                <select value={selNode.status ?? 'open'}
                  onChange={e => updateNode(selNode.id, { status: e.target.value as RNodeStatus })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>

              {/* Risk fields */}
              {selNode.type === 'risk' && (
                <div className="space-y-2 border border-slate-700 rounded p-2">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wide">Risk Matrix</div>
                  <div>
                    <label className="text-[9px] text-slate-400">Severity: {selNode.riskSeverity ?? 1}</label>
                    <input type="range" min={1} max={5} value={selNode.riskSeverity ?? 1}
                      onChange={e => updateNode(selNode.id, { riskSeverity: Number(e.target.value) })}
                      className="w-full accent-orange-500"/>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400">Likelihood: {selNode.riskLikelihood ?? 1}</label>
                    <input type="range" min={1} max={5} value={selNode.riskLikelihood ?? 1}
                      onChange={e => updateNode(selNode.id, { riskLikelihood: Number(e.target.value) })}
                      className="w-full accent-orange-500"/>
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: riskColor(sc) }}>
                    Score: {sc} {sc <= 4 ? '(Low)' : sc <= 9 ? '(Medium)' : '(High)'}
                  </div>
                </div>
              )}

              {/* Deadline date */}
              {selNode.type === 'deadline' && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Due Date</label>
                  <input type="date" value={selNode.dueDate ?? ''}
                    onChange={e => updateNode(selNode.id, { dueDate: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
                </div>
              )}

              {/* Photo attach */}
              {(selNode.type === 'photo' || selNode.type === 'defect') && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Photo</label>
                  {selNode.photoData && (
                    <div className="mb-1">
                      <img src={selNode.photoData} alt="attached"
                        onClick={() => setPhotoLightbox(selNode.photoData!)}
                        style={{ cursor: 'pointer', maxHeight: 80, objectFit: 'cover', width: '100%', borderRadius: 4, border: '1px solid #475569' }}/>
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-blue-400 hover:text-blue-300">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => updateNode(selNode.id, { photoData: ev.target?.result as string });
                        reader.readAsDataURL(file);
                      }}/>
                    Attach Photo
                  </label>
                </div>
              )}

              {/* Checklist items */}
              {selNode.type === 'checklist' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 uppercase tracking-wide">Checklist Items</label>
                  {(selNode.checklistItems ?? []).map(item => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <input type="checkbox" checked={item.done}
                        onChange={e => {
                          const items = (selNode.checklistItems ?? []).map(i => i.id === item.id ? { ...i, done: e.target.checked } : i);
                          updateNode(selNode.id, { checklistItems: items });
                        }}
                        className="accent-emerald-500"/>
                      <span className={`flex-1 text-[10px] ${item.done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item.text}</span>
                      <button onClick={() => {
                        const items = (selNode.checklistItems ?? []).filter(i => i.id !== item.id);
                        updateNode(selNode.id, { checklistItems: items });
                      }} className="text-red-600 hover:text-red-400 text-[10px]">✕</button>
                    </div>
                  ))}
                  <div className="flex gap-1 mt-1">
                    <input value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newCheckItem.trim()) {
                          const items = [...(selNode.checklistItems ?? []), { id: genRid(), text: newCheckItem.trim(), done: false }];
                          updateNode(selNode.id, { checklistItems: items });
                          setNewCheckItem('');
                        }
                      }}
                      placeholder="New item…"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-200 focus:outline-none focus:border-blue-500"/>
                    <button onClick={() => {
                      if (!newCheckItem.trim()) return;
                      const items = [...(selNode.checklistItems ?? []), { id: genRid(), text: newCheckItem.trim(), done: false }];
                      updateNode(selNode.id, { checklistItems: items });
                      setNewCheckItem('');
                    }} className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] text-white">Add</button>
                  </div>
                </div>
              )}

              {/* Cross-board link */}
              {boardNames && Object.keys(boardNames).length > 0 && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">Cross-board Link</label>
                  <select value={selNode.crossBoardRef ?? ''}
                    onChange={e => updateNode(selNode.id, { crossBoardRef: e.target.value || undefined })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none">
                    <option value="">(none)</option>
                    {Object.entries(boardNames)
                      .filter(([id]) => id !== activeBoardId)
                      .map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                  </select>
                </div>
              )}

              {/* Custom tags */}
              <div className="border-t border-slate-700 pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wide">Custom Fields</label>
                  <button onClick={() => commit({
                    ...graph,
                    nodes: graph.nodes.map(n => n.id === selNode.id
                      ? { ...n, tags: [...(n.tags ?? []), { key: '', value: '' }] }
                      : n)
                  })} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                    + Add
                  </button>
                </div>
                {(selNode.tags ?? []).map((tag, i) => (
                  <div key={i} className="flex items-center gap-1 mb-1">
                    <input
                      value={tag.key}
                      onChange={e => commit({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? {
                        ...n, tags: (n.tags ?? []).map((t, j) => j === i ? { ...t, key: e.target.value } : t)
                      } : n)})}
                      placeholder="Field"
                      className="w-16 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"/>
                    <input
                      value={tag.value}
                      onChange={e => commit({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? {
                        ...n, tags: (n.tags ?? []).map((t, j) => j === i ? { ...t, value: e.target.value } : t)
                      } : n)})}
                      placeholder="Value"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"/>
                    <button onClick={() => commit({ ...graph, nodes: graph.nodes.map(n => n.id === selNode.id ? {
                        ...n, tags: (n.tags ?? []).filter((_, j) => j !== i)
                      } : n)})}
                      className="text-slate-600 hover:text-red-400 shrink-0">
                      <X size={9}/>
                    </button>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="border-t border-slate-700 pt-2 space-y-1 text-[9px] text-slate-500">
                <div>Connections: <span className="text-slate-300">{graph.edges.filter(e => e.from === selNode.id || e.to === selNode.id).length}</span></div>
                <div>Position: <span className="font-mono text-slate-400">{Math.round(selNode.x)}, {Math.round(selNode.y)}</span></div>
              </div>

              <button onClick={() => {
                commit({ ...graph, nodes: graph.nodes.filter(n => n.id !== selNode.id), edges: graph.edges.filter(e => e.from !== selNode.id && e.to !== selNode.id) });
                setSelectedNode(null);
              }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                <Trash2 size={11}/> Delete node
              </button>
            </div>
          );
        })()}

        {!locked && selEdge && (() => {
          const fromNode = graph.nodes.find(n => n.id === selEdge.from);
          const toNode   = graph.nodes.find(n => n.id === selEdge.to);
          return (
            <div className="p-3 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-700">Connection</div>
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
                  onChange={e => commit({ ...graph, edges: graph.edges.map(ed => ed.id === selEdge.id ? { ...ed, label: e.target.value } : ed) })}
                  placeholder="e.g. references, drives, requires…"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"/>
              </div>
              <button onClick={() => {
                commit({ ...graph, edges: graph.edges.filter(e => e.id !== selEdge.id) });
                setSelectedEdge(null);
              }} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50 text-xs">
                <Trash2 size={11}/> Delete connection
              </button>
            </div>
          );
        })()}

        {!locked && !selNode && !selEdge && (
          <div className="px-4 py-6 text-[10px] text-slate-600 text-center leading-relaxed">
            Click a node or connection to edit its properties.
          </div>
        )}
      </div>
    </div>
  );

  // ── Expanded / fullscreen Blueprint editor ────────────────────────────────
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
          <div>● Drag output port to connect</div>
          <div>● Scroll to zoom</div>
          <div>● Del to delete selected</div>
          <div>● Ctrl+D to duplicate</div>
        </div>
      </div>

      {/* Main canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
          <span className="text-sm font-semibold text-slate-100">Relationship Map / Blueprint</span>
          <div className="flex items-center gap-2">

            {/* Generate Report */}
            <button onClick={() => generateReport(graph)}
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white border border-slate-700 rounded px-2 py-1 hover:bg-slate-700 transition-colors">
              <FileText size={11}/> Report
            </button>

            {/* Export CSV */}
            <button onClick={() => exportCSV(graph)}
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white border border-slate-700 rounded px-2 py-1 hover:bg-slate-700 transition-colors">
              <Download size={11}/> CSV
            </button>

            {/* Export PNG (Feature 5) */}
            <button onClick={exportPng}
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white border border-slate-700 rounded px-2 py-1 hover:bg-slate-700 transition-colors">
              <Download size={11}/> PNG
            </button>

            {/* Templates */}
            <div className="relative">
              <button onClick={() => setShowTemplates(v => !v)}
                className={`flex items-center gap-1 text-[10px] border rounded px-2 py-1 transition-colors ${showTemplates ? 'text-blue-300 border-blue-600 bg-blue-900/30' : 'text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'}`}>
                <LayoutTemplate size={11}/> Templates
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-10 overflow-hidden">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.label} onClick={() => {
                      setShowTemplates(false);
                      if (graph.nodes.length > 0) {
                        if (!window.confirm('Replace current graph with template?')) return;
                      }
                      onChange(tpl.fn());
                    }} className="flex w-full items-center px-3 py-2.5 text-[11px] text-slate-300 hover:bg-slate-700 text-left transition-colors">
                      {tpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedNode && (
              <button onClick={() => {
                commit({ ...graph, nodes: graph.nodes.filter(n => n.id !== selectedNode), edges: graph.edges.filter(e => e.from !== selectedNode && e.to !== selectedNode) });
                setSelectedNode(null);
              }} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-800/50 rounded px-2 py-1">
                <Trash2 size={10}/> Delete node
              </button>
            )}
            {selectedEdge && (
              <button onClick={() => {
                commit({ ...graph, edges: graph.edges.filter(e => e.id !== selectedEdge) });
                setSelectedEdge(null);
              }} className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 border border-red-800/50 rounded px-2 py-1">
                <Trash2 size={10}/> Delete edge
              </button>
            )}

            {/* Undo/Redo (Feature 1) */}
            <button onClick={undo} title="Undo (Ctrl+Z)"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><Undo2 size={13}/></button>
            <button onClick={redo} title="Redo (Ctrl+Y)"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><Redo2 size={13}/></button>

            <span className="text-[10px] text-slate-500 font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(s * 1.2, 3))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><ZoomIn size={13}/></button>
            <button onClick={() => setScale(s => Math.max(s / 1.2, 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"><ZoomOut size={13}/></button>
            <button onClick={() => { setPan({ x: 60, y: 60 }); setScale(1); }}
              className="text-[10px] text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1">Fit</button>

            {/* Feature 6: Fit Selection */}
            <button onClick={fitSelection} disabled={!selectedNode}
              title="Fit selection (zoom to selected + neighbors)"
              className={`p-1 rounded hover:bg-slate-700 text-[10px] font-mono ${selectedNode ? 'text-slate-300 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}>
              SEL
            </button>

            {/* Feature 9: Critical Path toggle */}
            <button onClick={computeCriticalPath}
              title="Highlight critical path (longest chain)"
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                criticalPath ? 'border-amber-500 text-amber-400 bg-amber-900/20' : 'border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'
              }`}>
              PATH
            </button>

            {/* Auto-layout (Feature 2) */}
            <button onClick={autoLayout} title="Auto-arrange nodes"
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white border border-slate-700 rounded px-2 py-1 hover:bg-slate-700 transition-colors">
              <LayoutGrid size={11}/> Arrange
            </button>

            {/* Lock / Unlock */}
            <button onClick={() => setLocked(v => !v)}
              title={locked ? 'Unlock graph' : 'Lock graph'}
              className={`p-1 rounded hover:bg-slate-700 ${locked ? 'text-amber-400' : 'text-slate-400 hover:text-white'}`}>
              {locked ? <Lock size={13}/> : <Unlock size={13}/>}
            </button>

            {/* Minimap toggle */}
            <button onClick={() => setShowMinimap(v => !v)} title="Toggle minimap"
              className={`p-1 rounded hover:bg-slate-700 text-[10px] font-mono ${showMinimap ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
              MAP
            </button>

            <button onClick={() => { setExpanded(false); setSelectedNode(null); setSelectedEdge(null); }}
              title="Collapse (Esc)"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
              <Minimize2 size={14}/>
            </button>
          </div>
        </div>

        {/* SVG Canvas + overlays */}
        <div className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full"
          onPointerDown={onSvgDown}
          onPointerMove={onSvgMove}
          onPointerUp={onSvgUp}
          onPointerLeave={onSvgUp}
          onWheel={onWheel}
          style={{ cursor: 'default' }}>
          <defs>
            <pattern id="rmap-dots" patternUnits="userSpaceOnUse"
              x={pan.x % (20 * scale)} y={pan.y % (20 * scale)}
              width={20 * scale} height={20 * scale}>
              <circle cx={0} cy={0} r={0.7} fill="#334155"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rmap-dots)" data-bg="1"/>
          <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
            {graph.edges.map(e => renderEdge(e, true))}
            {edgePreview && (
              <path d={bezierPath(edgePreview.x1, edgePreview.y1, edgePreview.x2, edgePreview.y2)}
                fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="6 3"
                style={{ pointerEvents: 'none' }}/>
            )}
            {graph.nodes.map(n => renderNode(n, true))}
            {/* Feature 8: Edge inline label editing */}
            {editingEdgeId && (() => {
              const ed = graph.edges.find(e => e.id === editingEdgeId);
              if (!ed) return null;
              const fn = graph.nodes.find(n => n.id === ed.from);
              const tn = graph.nodes.find(n => n.id === ed.to);
              if (!fn || !tn) return null;
              const p1 = { x: fn.x + EXP_W, y: fn.y + EXP_H / 2 };
              const p2 = { x: tn.x,         y: tn.y + EXP_H / 2 };
              const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
              return (
                <foreignObject x={mx - 50} y={my - 14} width={100} height={26}>
                  <input
                    autoFocus
                    value={editingEdgeText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingEdgeText(e.target.value)}
                    onBlur={() => {
                      commit({ ...graph, edges: graph.edges.map(e => e.id === editingEdgeId ? { ...e, label: editingEdgeText } : e) });
                      setEditingEdgeId(null);
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                      if (e.key === 'Escape') { setEditingEdgeId(null); }
                    }}
                    style={{
                      width: '100%', height: '100%', background: '#1e293b', border: '1px solid #3b82f6',
                      borderRadius: 3, color: '#f1f5f9', fontSize: 10, fontFamily: 'sans-serif',
                      padding: '0 4px', outline: 'none', textAlign: 'center',
                    }}
                  />
                </foreignObject>
              );
            })()}
          </g>
        </svg>

        {/* Minimap overlay */}
        {showMinimap && graph.nodes.length > 0 && (() => {
          const MM_W = 160, MM_H = 100, MM_PAD = 8;
          const xs = graph.nodes.map(n => n.x), ys = graph.nodes.map(n => n.y);
          const gx0 = Math.min(...xs) - 20, gy0 = Math.min(...ys) - 20;
          const gx1 = Math.max(...xs) + EXP_W + 20, gy1 = Math.max(...ys) + EXP_H + 20;
          const gw = gx1 - gx0, gh = gy1 - gy0;
          const scaleX = MM_W / gw, scaleY = MM_H / gh;
          const mmScale = Math.min(scaleX, scaleY, 0.3);

          const svgEl = svgRef.current;
          const vpW = svgEl ? svgEl.clientWidth  / scale : 800;
          const vpH = svgEl ? svgEl.clientHeight / scale : 500;
          const vpX = -pan.x / scale, vpY = -pan.y / scale;

          const toMm = (gx: number, gy: number) => ({
            x: (gx - gx0) * mmScale + MM_PAD,
            y: (gy - gy0) * mmScale + MM_PAD,
          });

          return (
            <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 border border-slate-600 rounded-lg overflow-hidden"
              style={{ width: MM_W + MM_PAD * 2, height: MM_H + MM_PAD * 2 }}>
              <button onClick={() => setShowMinimap(false)}
                className="absolute top-0.5 right-0.5 text-slate-600 hover:text-slate-300 z-10 leading-none text-[10px] px-1">×</button>
              <svg width={MM_W + MM_PAD * 2} height={MM_H + MM_PAD * 2} style={{ display: 'block' }}>
                {graph.nodes.map(n => {
                  const cfg = NODE_CFG[n.type];
                  const pos = toMm(n.x, n.y);
                  const nw = Math.max(EXP_W * mmScale, 6);
                  const nh = Math.max(EXP_H * mmScale, 4);
                  return (
                    <rect key={n.id} x={pos.x} y={pos.y} width={nw} height={nh} rx={1}
                      fill={cfg.color} opacity={n.id === selectedNode ? 1 : 0.6}/>
                  );
                })}
                {(() => {
                  const vp = toMm(vpX, vpY);
                  return <rect x={vp.x} y={vp.y}
                    width={Math.max(vpW * mmScale, 10)} height={Math.max(vpH * mmScale, 8)}
                    fill="none" stroke="#60a5fa" strokeWidth={1} rx={1} opacity={0.7}/>;
                })()}
              </svg>
            </div>
          );
        })()}

        {/* Context menu */}
        {ctxMenu && (() => {
          const ctxNode = graph.nodes.find(n => n.id === ctxMenu.nodeId);
          if (!ctxNode) return null;
          return (
            <div
              className="fixed z-[60] bg-slate-800 border border-slate-600 rounded-lg shadow-2xl py-1 w-44 text-xs"
              style={{ left: ctxMenu.x, top: ctxMenu.y }}
              onPointerDown={e => e.stopPropagation()}>
              <button onClick={() => {
                const newNode = { ...ctxNode, id: genRid(), x: ctxNode.x + 30, y: ctxNode.y + 30 };
                commit({ ...graph, nodes: [...graph.nodes, newNode] });
                setCtxMenu(null);
              }} className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700">
                Duplicate
              </button>
              <button onClick={() => {
                setCollapsed(prev => { const s = new Set(prev); s.has(ctxNode.id) ? s.delete(ctxNode.id) : s.add(ctxNode.id); return s; });
                setCtxMenu(null);
              }} className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:bg-slate-700">
                {collapsed.has(ctxMenu.nodeId) ? 'Expand node' : 'Collapse node'}
              </button>
              <div className="border-t border-slate-700 my-1"/>
              <div className="px-3 py-1 text-[9px] text-slate-500 uppercase tracking-wider">Set status</div>
              {(['open','in-progress','resolved','deferred'] as RNodeStatus[]).map(s => (
                <button key={s} onClick={() => {
                  commit({ ...graph, nodes: graph.nodes.map(n => n.id === ctxNode.id ? { ...n, status: s } : n) });
                  setCtxMenu(null);
                }} className="flex items-center gap-2 w-full px-3 py-1.5 text-slate-300 hover:bg-slate-700 capitalize">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLOR[s] }}/>
                  {s.replace('-', ' ')}
                </button>
              ))}
              <div className="border-t border-slate-700 my-1"/>
              <button onClick={() => {
                commit({ ...graph, nodes: graph.nodes.filter(n => n.id !== ctxNode.id), edges: graph.edges.filter(e => e.from !== ctxNode.id && e.to !== ctxNode.id) });
                setSelectedNode(null);
                setCtxMenu(null);
              }} className="flex items-center gap-2 w-full px-3 py-2 text-red-400 hover:bg-red-900/30">
                Delete node
              </button>
            </div>
          );
        })()}
        </div>{/* end SVG + overlays wrapper */}
      </div>

      {/* Right: properties panel */}
      {renderPropertiesPanel()}

      {/* Photo lightbox */}
      {photoLightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setPhotoLightbox(null)}>
          <div className="relative max-w-3xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <img src={photoLightbox} alt="lightbox" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"/>
            <button onClick={() => setPhotoLightbox(null)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
              <X size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {renderCompact()}
      {expanded && renderExpanded()}
    </>
  );
}
