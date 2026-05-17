import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bolt, CloudCheck, ExternalLink, FileDown,
  Link2, Lock, Pencil, Printer, Stamp, Trash2, X, Plus,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';
import { subscribeWorkspace } from '../lib/workspaceSync';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  projectType: string;
  status: string;
  description: string;
}

interface Observation {
  id: string;
  projectId: string;
  title: string;
  location: string;
  severity: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface PhotoRecord {
  id: string;
  projectId: string;
  dataUrl: string;
  createdAt: string;
}

// Minimal Markup shape — mirrors VisualWorkspace.tsx
type MarkupType =
  | 'arrow' | 'cloud' | 'text' | 'box' | 'ellipse' | 'callout'
  | 'pen' | 'highlighter' | 'polyline' | 'dimension' | 'distance'
  | 'angle' | 'area' | 'image' | 'count';

interface Markup {
  id: string;
  type: MarkupType;
  number: number;
  text: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
}

interface ExhibitBlock {
  id: string;
  markupId: string;
  boardId: string;
  caption: string;
  figureNumber: number;
}

export interface ReportRecord {
  id: string;
  projectId: string;
  title: string;
  executiveSummary: string;
  recommendations: string;
  exhibits?: ExhibitBlock[];
  createdAt: string;
  updatedAt: string;
}

// Board name lookup matching VisualWorkspace INITIAL_BOARD_ITEMS
const BOARD_NAMES: Record<string, string> = {
  b1: 'Level 2 Framing Plan',
  b2: 'Roof Framing Plan',
  b3: 'South Elevation',
  b4: 'East Elevation',
  b5: 'Typical Sections',
  b6: 'Site Photo Set',
};

const boardName = (id: string) => BOARD_NAMES[id] || id;

const MARKUP_TYPE_LABELS: Record<MarkupType, string> = {
  cloud: 'Revision Cloud', arrow: 'Arrow', text: 'Text Note', box: 'Rectangle',
  ellipse: 'Ellipse', callout: 'Callout', pen: 'Freehand', highlighter: 'Highlight',
  polyline: 'Polyline', dimension: 'Dimension', distance: 'Distance',
  angle: 'Angle', area: 'Area', image: 'Image', count: 'Count',
};

const genId = () => Math.random().toString(36).slice(2, 10);

const fmtDateLong = (iso: string) => {
  try { return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
};
const fmtDateShort = (iso: string) => {
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
};
const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Block shells ─────────────────────────────────────────────────────────────

const LockedBlock: React.FC<{ label: string; sublabel?: string; children: React.ReactNode }> = ({ label, sublabel, children }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2 px-0.5">
      <span className="w-[18px] h-[18px] rounded bg-slate-700/40 text-slate-400 flex items-center justify-center">
        <Bolt size={11} />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <span className="ml-auto text-[10px] font-medium tracking-wide bg-slate-700/40 text-slate-400 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
        <Lock size={9} /> {sublabel || 'Auto-generated'}
      </span>
    </div>
    <div className="bg-white/[0.015] border border-slate-800 rounded-lg px-5 py-4">{children}</div>
  </div>
);

const EditableBlock: React.FC<{ label: string; active?: boolean; children: React.ReactNode }> = ({ label, active, children }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2 px-0.5">
      <span className="w-[18px] h-[18px] rounded bg-blue-500/15 text-blue-400 flex items-center justify-center">
        <Pencil size={11} />
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <span className="ml-auto text-[10px] font-medium tracking-wide bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded">
        You write this
      </span>
    </div>
    <div className={`rounded-lg px-5 py-4 transition-all ${
      active
        ? 'border border-blue-500 bg-transparent shadow-[0_0_0_3px_rgba(59,130,246,0.08)]'
        : 'border border-dashed border-slate-700 bg-transparent'
    }`}>{children}</div>
  </div>
);

// ── Markup exhibit block ──────────────────────────────────────────────────────

interface ExhibitBlockProps {
  exhibit: ExhibitBlock;
  markup: Markup | undefined;
  projectId: string;
  onCaptionChange: (caption: string) => void;
  onDelete: () => void;
}

const MarkupExhibitBlock: React.FC<ExhibitBlockProps> = ({
  exhibit, markup, projectId, onCaptionChange, onDelete,
}) => {
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(exhibit.caption);

  const priorityColor = markup
    ? markup.priority === 'high' ? '#ef4444' : markup.priority === 'medium' ? '#f59e0b' : '#64748b'
    : '#64748b';

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-0.5">
        <span className="w-[18px] h-[18px] rounded flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
          <Stamp size={11} />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Figure {exhibit.figureNumber}
        </span>
        <span className="ml-auto text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded inline-flex items-center gap-1"
          style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5' }}>
          <Link2 size={9} /> Markup exhibit
        </span>
        <button
          onClick={onDelete}
          className="w-[18px] h-[18px] rounded flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div className="bg-slate-850 border border-slate-800 rounded-lg overflow-hidden">
        {/* Markup preview */}
        <div className="px-5 py-4 bg-slate-800/40">
          {markup ? (
            <div className="flex items-start gap-4">
              {/* Color stripe + type badge */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className="w-1 rounded-full self-stretch min-h-[40px]"
                  style={{ background: markup.color || priorityColor }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 font-mono">#{markup.number}</span>
                  <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                    {MARKUP_TYPE_LABELS[markup.type] || markup.type}
                  </span>
                  <span
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded capitalize"
                    style={{
                      background: `${priorityColor}20`,
                      color: priorityColor,
                      border: `1px solid ${priorityColor}40`,
                    }}
                  >
                    {markup.priority}
                  </span>
                  <span className="text-[10px] text-slate-500 ml-auto">{boardName(exhibit.boardId)}</span>
                </div>
                <div className="text-[13px] text-slate-200 leading-snug line-clamp-2">
                  {markup.text || <span className="text-slate-500 italic">No description</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-slate-500 text-[13px] italic">
              <Stamp size={16} className="text-slate-600" />
              Markup not found — it may have been deleted from the Workspace.
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="border-t border-slate-800 px-5 py-3">
          {editingCaption ? (
            <textarea
              autoFocus
              className="w-full bg-transparent text-[13px] text-slate-300 leading-relaxed resize-none focus:outline-none min-h-[48px]"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              onBlur={() => { setEditingCaption(false); onCaptionChange(caption); }}
              placeholder="Write a caption for this figure…"
            />
          ) : (
            <button
              className="text-left w-full"
              onClick={() => setEditingCaption(true)}
            >
              {caption ? (
                <span className="text-[13px] text-slate-300 leading-relaxed">
                  <span className="font-serif italic text-slate-100 mr-1.5"
                    style={{ fontFamily: '"Instrument Serif", Georgia, serif' }}>
                    Figure {exhibit.figureNumber}.
                  </span>
                  {caption}
                </span>
              ) : (
                <span className="text-[13px] text-slate-500 italic">
                  Click to add a caption for Figure {exhibit.figureNumber}…
                </span>
              )}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-5 py-2 flex items-center gap-3 text-[11px] text-slate-500 bg-slate-900/40">
          <Link2 size={11} />
          <span>Linked to Workspace markup <code className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">{exhibit.markupId}</code></span>
          <div className="flex-1" />
          <Link
            to="/visual-workspace"
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={10} />
            Open in Workspace
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Markup picker modal ───────────────────────────────────────────────────────

interface PickerProps {
  projectId: string;
  existingMarkupIds: Set<string>;
  onSelect: (markupId: string, boardId: string, markup: Markup) => void;
  onClose: () => void;
}

const MarkupPickerModal: React.FC<PickerProps> = ({ projectId, existingMarkupIds, onSelect, onClose }) => {
  const [allMarkups, setAllMarkups] = useState<Record<string, Markup[]>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = subscribeWorkspace<Record<string, Markup[]>>(
      'workspace_markups', projectId, data => setAllMarkups(data ?? {}),
    );
    return unsub;
  }, [projectId]);

  const flat = useMemo(() => {
    const rows: { boardId: string; markup: Markup }[] = [];
    for (const [boardId, markups] of Object.entries(allMarkups)) {
      for (const m of markups) rows.push({ boardId, markup: m });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return rows.filter(r =>
        r.markup.text.toLowerCase().includes(q) ||
        (MARKUP_TYPE_LABELS[r.markup.type] || '').toLowerCase().includes(q) ||
        boardName(r.boardId).toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => a.markup.number - b.markup.number);
  }, [allMarkups, search]);

  const totalMarkups = Object.values(allMarkups).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <div className="text-sm font-medium text-slate-100">Add markup exhibit</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{totalMarkups} markups in Workspace</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-800">
          <input
            type="text"
            placeholder="Search markups…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {flat.length === 0 ? (
            <div className="py-12 text-center">
              <Stamp size={28} className="text-slate-700 mx-auto mb-3" />
              <div className="text-sm text-slate-500">
                {totalMarkups === 0
                  ? 'No markups in the Workspace yet.\nOpen the Visual Workspace to add markups.'
                  : 'No markups match your search.'}
              </div>
            </div>
          ) : (
            flat.map(({ boardId, markup }) => {
              const alreadyUsed = existingMarkupIds.has(markup.id);
              const priorityColor = markup.priority === 'high' ? '#ef4444' : markup.priority === 'medium' ? '#f59e0b' : '#64748b';
              return (
                <button
                  key={markup.id}
                  disabled={alreadyUsed}
                  onClick={() => onSelect(markup.id, boardId, markup)}
                  className={`w-full text-left px-5 py-3.5 border-b border-slate-800/60 flex items-start gap-3 transition-colors ${
                    alreadyUsed
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-0.5 rounded-full self-stretch min-h-[36px] shrink-0"
                    style={{ background: markup.color || priorityColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500">#{markup.number}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                        {MARKUP_TYPE_LABELS[markup.type] || markup.type}
                      </span>
                      {alreadyUsed && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                          In report
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 ml-auto">{boardName(boardId)}</span>
                    </div>
                    <div className="text-[12.5px] text-slate-300 leading-snug line-clamp-2">
                      {markup.text || <span className="text-slate-500 italic">No description</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-800 text-[11px] text-slate-500">
          Select a markup to insert it as a figure with a caption.
        </div>
      </div>
    </div>
  );
};

// ── Main editor ──────────────────────────────────────────────────────────────

export const ReportEditor: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { items: reports, save: saveReport } = useCollection<ReportRecord>(COLLECTIONS.reports.col, COLLECTIONS.reports.ls);
  const { items: projects } = useCollection<ProjectRecord>(COLLECTIONS.projects.col, COLLECTIONS.projects.ls);
  const { items: observations } = useCollection<Observation>(COLLECTIONS.observations.col, COLLECTIONS.observations.ls);
  const { items: photos } = useCollection<PhotoRecord>(COLLECTIONS.photos.col, COLLECTIONS.photos.ls);

  useEffect(() => subscribeProfile(setProfile), []);

  const report = reports.find(r => r.id === reportId);
  const project = report ? projects.find(p => p.id === report.projectId) : null;

  // Load workspace markups for the exhibit picker + block rendering
  const [workspaceMarkups, setWorkspaceMarkups] = useState<Record<string, Markup[]>>({});
  useEffect(() => {
    if (!project) return;
    return subscribeWorkspace<Record<string, Markup[]>>(
      'workspace_markups', project.id, data => setWorkspaceMarkups(data ?? {}),
    );
  }, [project?.id]);

  // Flat lookup: markupId -> Markup
  const markupById = useMemo(() => {
    const map = new Map<string, Markup>();
    for (const markups of Object.values(workspaceMarkups)) {
      for (const m of markups) map.set(m.id, m);
    }
    return map;
  }, [workspaceMarkups]);

  const projectObservations = useMemo(() => {
    if (!project) return [];
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return observations
      .filter(o => o.projectId === project.id)
      .sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  }, [observations, project]);

  const photoForObs = (obs: Observation): PhotoRecord | undefined => {
    if (!project) return undefined;
    return photos.find(p => p.projectId === project.id && p.createdAt >= obs.createdAt) || photos.find(p => p.projectId === project.id);
  };

  const [activeBlock, setActiveBlock] = useState<'summary' | 'recommendations' | null>('summary');
  const [savedLabel, setSavedLabel] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const summaryEditor = useEditor({
    extensions: [StarterKit],
    content: report?.executiveSummary || '',
    onUpdate: ({ editor }) => persist({ executiveSummary: editor.getHTML() }),
    onFocus: () => setActiveBlock('summary'),
    editorProps: { attributes: { class: 'prose-report focus:outline-none min-h-[100px] text-[13.5px] leading-[1.75] text-slate-300' } },
  }, [report?.id]);

  const recsEditor = useEditor({
    extensions: [StarterKit],
    content: report?.recommendations || '',
    onUpdate: ({ editor }) => persist({ recommendations: editor.getHTML() }),
    onFocus: () => setActiveBlock('recommendations'),
    editorProps: { attributes: { class: 'prose-report focus:outline-none min-h-[100px] text-[13.5px] leading-[1.75] text-slate-300' } },
  }, [report?.id]);

  const persist = (patch: Partial<ReportRecord>) => {
    if (!report) return;
    const updated: ReportRecord = { ...report, ...patch, updatedAt: new Date().toISOString() };
    saveReport(updated);
    setSavedLabel('Saved just now');
    setTimeout(() => report && setSavedLabel(`Saved ${fmtRelative(updated.updatedAt)}`), 30_000);
  };

  const exhibits = report?.exhibits ?? [];
  const existingMarkupIds = useMemo(() => new Set(exhibits.map(e => e.markupId)), [exhibits]);

  const addExhibit = (markupId: string, boardId: string) => {
    const nextFigure = exhibits.length + 1;
    const newExhibit: ExhibitBlock = {
      id: genId(),
      markupId,
      boardId,
      caption: '',
      figureNumber: nextFigure,
    };
    persist({ exhibits: [...exhibits, newExhibit] });
    setShowPicker(false);
  };

  const updateExhibitCaption = (exhibitId: string, caption: string) => {
    persist({ exhibits: exhibits.map(e => e.id === exhibitId ? { ...e, caption } : e) });
  };

  const deleteExhibit = (exhibitId: string) => {
    const filtered = exhibits.filter(e => e.id !== exhibitId);
    // Renumber
    const renumbered = filtered.map((e, i) => ({ ...e, figureNumber: i + 1 }));
    persist({ exhibits: renumbered });
  };

  const exportPdf = () => {
    document.body.classList.add('report-printing');
    window.print();
    setTimeout(() => document.body.classList.remove('report-printing'), 500);
  };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Printer size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Report not found.</div>
        <button onClick={() => navigate('/documents')} className="mt-4 text-xs text-blue-400 hover:underline">← Back to Reports</button>
      </div>
    );
  }
  if (!project) {
    return <div className="text-slate-500 text-sm p-8">Project linked to this report is missing.</div>;
  }

  const engineerName = profile?.displayName || user?.email || 'Engineer';
  const firmName = profile?.company || '';
  const today = new Date().toISOString();

  const sevPill = (s: string, status: string) => {
    if (s === 'High' && status !== 'Closed' && status !== 'Resolved') return { cls: 'bg-red-600/15 text-red-300 border border-red-700/30', label: 'Critical' };
    if (status === 'Closed' || status === 'Resolved') return { cls: 'bg-emerald-600/15 text-emerald-300 border border-emerald-700/30', label: 'Resolved' };
    return { cls: 'bg-amber-500/15 text-amber-300 border border-amber-700/30', label: 'Open' };
  };

  return (
    <div className="report-editor-root max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Top toolbar */}
      <div className="bg-slate-900 border border-slate-700 rounded-t-xl flex items-center justify-between gap-3 px-4 py-3 print:hidden">
        <Link to="/documents" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-100 min-w-0">
          <ArrowLeft size={14} />
          <span className="truncate">{project.name} › Reports › <span className="text-slate-100 font-medium">{report.title}</span></span>
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
          <CloudCheck size={13} className="text-emerald-400" /> {savedLabel || `Saved ${fmtRelative(report.updatedAt)}`}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportPdf} className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-slate-200 border border-slate-700 rounded hover:bg-slate-800 transition-colors">
            <FileDown size={12} /> Export PDF
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="report-printable bg-slate-900 border-x border-b border-slate-700 rounded-b-xl px-7 py-7">

        {/* Cover (locked) */}
        <LockedBlock label="Cover page">
          <div className="text-center py-5">
            <div className="text-[11px] tracking-[0.18em] uppercase text-slate-500 mb-3">Structural inspection report</div>
            <div className="font-serif italic text-slate-100" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 32, lineHeight: 1.1 }}>
              {project.name}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {project.projectNumber ? `Project ${project.projectNumber}` : 'Project'}
              {project.client && <> · {project.client}</>}
            </div>
            <div className="w-10 h-px bg-slate-700 mx-auto my-5" />
            <div className="text-[11px] tracking-[0.08em] uppercase text-slate-500 mb-1.5">Prepared by</div>
            <div className="text-sm font-medium text-slate-200">{engineerName}</div>
            <div className="text-[11px] text-slate-500">
              {firmName && <>{firmName} · </>}{fmtDateLong(today)}
            </div>
          </div>
        </LockedBlock>

        {/* Executive Summary (editable) */}
        <EditableBlock label="Executive summary" active={activeBlock === 'summary'}>
          {summaryEditor ? (
            <EditorContent editor={summaryEditor} />
          ) : (
            <div className="text-slate-500 italic text-[13px]">Loading editor…</div>
          )}
        </EditableBlock>

        {/* Observations (locked, auto from project data) */}
        <LockedBlock label={`Observations · ${projectObservations.length} total`} sublabel="Auto from project data">
          {projectObservations.length === 0 ? (
            <div className="text-slate-500 italic text-[13px]">No observations logged for this project yet. They will appear here as they are added.</div>
          ) : (
            <>
              <div className="grid gap-x-3.5" style={{ gridTemplateColumns: '48px 1fr auto auto' }}>
                <div className="contents">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-800" />
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-800">Finding</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-800">Severity</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 pb-2.5 border-b border-slate-800">Status</div>
                </div>
                {projectObservations.slice(0, 5).map(obs => {
                  const photo = photoForObs(obs);
                  const pill = sevPill(obs.severity, obs.status);
                  return (
                    <div key={obs.id} className="contents">
                      <div className="py-2.5 border-b border-slate-800 flex items-center">
                        <div className="w-10 h-[30px] rounded shrink-0 overflow-hidden bg-slate-700">
                          {photo
                            ? <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
                          }
                        </div>
                      </div>
                      <div className="py-2.5 border-b border-slate-800 flex flex-col justify-center">
                        <div className="text-[12px] text-slate-200 leading-tight">{obs.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{fmtDateShort(obs.createdAt)}{obs.location && ` · ${obs.location}`}</div>
                      </div>
                      <div className="py-2.5 border-b border-slate-800 flex items-center">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${pill.cls}`}>{pill.label}</span>
                      </div>
                      <div className="py-2.5 border-b border-slate-800 flex items-center text-[11px] text-slate-400">
                        {obs.status}
                      </div>
                    </div>
                  );
                })}
              </div>
              {projectObservations.length > 5 && (
                <div className="mt-3.5 pt-3.5 border-t border-dashed border-slate-800 text-[11px] text-slate-500 text-center">
                  <span className="text-blue-400">↻</span> +{projectObservations.length - 5} more · updates automatically as observations are logged
                </div>
              )}
            </>
          )}
        </LockedBlock>

        {/* Markup exhibits */}
        {exhibits.map(exhibit => (
          <MarkupExhibitBlock
            key={exhibit.id}
            exhibit={exhibit}
            markup={markupById.get(exhibit.markupId)}
            projectId={project.id}
            onCaptionChange={caption => updateExhibitCaption(exhibit.id, caption)}
            onDelete={() => deleteExhibit(exhibit.id)}
          />
        ))}

        {/* Add exhibit button */}
        <div className="mb-4">
          <button
            onClick={() => setShowPicker(true)}
            className="w-full py-3 rounded-lg border border-dashed border-slate-700 text-[12px] text-slate-500 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/30 transition-all flex items-center justify-center gap-2 print:hidden"
          >
            <Plus size={13} />
            Add markup exhibit from Workspace
          </button>
        </div>

        {/* Recommendations (editable) */}
        <EditableBlock label="Recommendations" active={activeBlock === 'recommendations'}>
          {recsEditor
            ? <EditorContent editor={recsEditor} />
            : <div className="text-slate-500 italic text-[13px]">Loading editor…</div>
          }
        </EditableBlock>

        {/* Sign-off (locked) */}
        <LockedBlock label="Sign-off" sublabel="Auto from your profile">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="flex-1 border-b border-slate-700 pb-1 min-w-[180px]">
              <div className="italic text-slate-100" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 22 }}>
                {engineerName}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 text-right leading-relaxed">
              <div className="text-slate-200 font-medium">{engineerName}</div>
              {profile?.discipline && <div>{profile.discipline}</div>}
              <div>{fmtDateLong(today)}</div>
            </div>
          </div>
        </LockedBlock>

      </div>

      {/* Inline styles for TipTap content + print rules */}
      <style>{`
        .prose-report h1, .prose-report h2, .prose-report h3 { color: rgb(241, 245, 249); font-weight: 600; margin: 0.6em 0 0.3em; }
        .prose-report h1 { font-size: 1.4em; }
        .prose-report h2 { font-size: 1.2em; }
        .prose-report p { margin: 0.5em 0; }
        .prose-report strong { color: rgb(241, 245, 249); }
        .prose-report ul, .prose-report ol { padding-left: 1.4em; margin: 0.4em 0; }
        .prose-report blockquote { border-left: 2px solid rgb(51, 65, 85); padding-left: 0.8em; color: rgb(148, 163, 184); margin: 0.6em 0; }
        @media print {
          body { background: white !important; }
          .report-printing nav, .report-printing header, .report-printing aside, .report-printing .print\\:hidden { display: none !important; }
          .report-printing .report-editor-root { max-width: 100%; padding: 0; }
          .report-printing .report-printable { background: white !important; color: black !important; border: none !important; padding: 30px !important; }
          .report-printing .report-printable * { color: black !important; background: white !important; border-color: #ddd !important; }
          .report-printing .report-printable img { max-width: 100% !important; }
          .report-printing .report-printable .text-slate-500, .report-printing .report-printable .text-slate-400 { color: #555 !important; }
        }
      `}</style>

      {/* Markup picker modal */}
      {showPicker && (
        <MarkupPickerModal
          projectId={project.id}
          existingMarkupIds={existingMarkupIds}
          onSelect={addExhibit}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
