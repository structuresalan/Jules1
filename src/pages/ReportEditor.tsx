import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bolt, CloudCheck, FileDown, Lock, Pencil, Printer } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';

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

export interface ReportRecord {
  id: string;
  projectId: string;
  title: string;
  executiveSummary: string;     // HTML from TipTap
  recommendations: string;       // HTML from TipTap
  createdAt: string;
  updatedAt: string;
}

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

  // Print → users can save as PDF from the OS dialog
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

      {/* Inline styles for the TipTap content + print rules */}
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
    </div>
  );
};
