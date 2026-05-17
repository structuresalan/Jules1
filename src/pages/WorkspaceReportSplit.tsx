import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, FileText, X, BookOpen,
} from 'lucide-react';
import { VisualWorkspace } from './VisualWorkspace';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import { subscribeWorkspace } from '../lib/workspaceSync';
import { getActiveProjectId } from '../utils/projectDocuments';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExhibitBlock {
  id: string;
  markupId: string;
  boardId: string;
  caption: string;
  figureNumber: number;
}

interface ReportRecord {
  id: string;
  projectId: string;
  title: string;
  executiveSummary: string;
  recommendations: string;
  exhibits?: ExhibitBlock[];
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceMarkup {
  id: string;
  text: string;
  color: string;
  number: number;
  type: string;
  priority: string;
}

const genId = () => Math.random().toString(36).slice(2, 10);

// ─── ReportPanel ─────────────────────────────────────────────────────────────

interface ReportPanelProps {
  projectName: string;
  reports: ReportRecord[];
  activeReportId: string | null;
  onSelectReport: (id: string) => void;
  onSaveReport: (report: ReportRecord) => void;
  markupById: Map<string, WorkspaceMarkup>;
}

const ReportPanel: React.FC<ReportPanelProps> = ({
  projectName,
  reports,
  activeReportId,
  onSelectReport,
  onSaveReport,
  markupById,
}) => {
  const navigate = useNavigate();
  const activeReport = reports.find(r => r.id === activeReportId) ?? null;
  const exhibits = activeReport?.exhibits ?? [];

  const [captionDraft, setCaptionDraft] = useState<Record<string, string>>({});

  // Sync caption drafts when active report changes
  useEffect(() => {
    const drafts: Record<string, string> = {};
    (activeReport?.exhibits ?? []).forEach(e => {
      drafts[e.id] = e.caption;
    });
    setCaptionDraft(drafts);
  }, [activeReportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCaption = (exhibitId: string) => {
    if (!activeReport) return;
    const updated: ReportRecord = {
      ...activeReport,
      exhibits: (activeReport.exhibits ?? []).map(e =>
        e.id === exhibitId ? { ...e, caption: captionDraft[exhibitId] ?? e.caption } : e
      ),
      updatedAt: new Date().toISOString(),
    };
    onSaveReport(updated);
  };

  const deleteExhibit = (exhibitId: string) => {
    if (!activeReport) return;
    const remaining = (activeReport.exhibits ?? []).filter(e => e.id !== exhibitId);
    // Renumber
    const renumbered = remaining.map((e, i) => ({ ...e, figureNumber: i + 1 }));
    onSaveReport({
      ...activeReport,
      exhibits: renumbered,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border-b border-slate-800 shrink-0 h-9">
        <button
          onClick={() => navigate('/visual-workspace')}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          title="Back to workspace"
        >
          <ArrowLeft size={13} />
          <span className="text-xs font-medium">Back</span>
        </button>
        <div className="flex-1 min-w-0 mx-2">
          <div className="text-[11px] font-medium text-slate-200 truncate">{projectName || 'Project'}</div>
          <div className="text-[10px] text-slate-500">Split view</div>
        </div>
        {activeReportId && (
          <button
            onClick={() => navigate(`/reports/${activeReportId}`)}
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors shrink-0"
            title="Open full editor"
          >
            Open full editor
            <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* Report selector */}
      <div className="px-3 py-2 border-b border-slate-800 shrink-0 bg-slate-900">
        {reports.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            No reports yet — markups you add will create one
          </p>
        ) : (
          <select
            value={activeReportId ?? ''}
            onChange={e => onSelectReport(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {reports.map(r => (
              <option key={r.id} value={r.id}>{r.title || 'Untitled Report'}</option>
            ))}
          </select>
        )}
      </div>

      {/* Exhibit list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {exhibits.length === 0 && (
          <div className="text-center py-8">
            <BookOpen size={24} className="mx-auto mb-2 text-slate-700" />
            <p className="text-[11px] text-slate-500">No exhibits yet</p>
            {exhibits.length < 3 && (
              <p className="text-[10px] text-slate-600 mt-1 italic">
                Drag a markup from the left pane to add as an exhibit
              </p>
            )}
          </div>
        )}

        {exhibits.map(exhibit => {
          const markup = markupById.get(exhibit.markupId);
          return (
            <div
              key={exhibit.id}
              className="bg-slate-800 rounded border border-slate-700 p-2 group"
            >
              <div className="flex items-start gap-2">
                {/* Color dot / icon */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 mt-0.5 border border-slate-600"
                  style={{ background: markup?.color ?? '#64748b' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-300">
                      Fig. {exhibit.figureNumber}
                    </span>
                    <button
                      onClick={() => deleteExhibit(exhibit.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-0.5"
                      title="Remove exhibit"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mb-1.5 truncate">
                    {markup
                      ? `${markup.type} N${markup.number}`
                      : exhibit.markupId.slice(0, 12) + '…'}
                  </div>
                  <textarea
                    rows={2}
                    value={captionDraft[exhibit.id] ?? exhibit.caption}
                    onChange={e =>
                      setCaptionDraft(prev => ({ ...prev, [exhibit.id]: e.target.value }))
                    }
                    onBlur={() => saveCaption(exhibit.id)}
                    placeholder="Add caption…"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-[10px] text-slate-200 resize-none focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {exhibits.length > 0 && exhibits.length < 3 && (
          <p className="text-[10px] text-slate-600 italic text-center py-2">
            Drag a markup from the left pane to add as an exhibit
          </p>
        )}
      </div>

      {/* Footer */}
      {activeReportId && (
        <div className="px-3 py-2 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            onClick={() => navigate(`/reports/${activeReportId}`)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            <FileText size={12} />
            Open full editor
          </button>
        </div>
      )}
    </div>
  );
};

// ─── WorkspaceReportSplit ─────────────────────────────────────────────────────

export const WorkspaceReportSplit: React.FC = () => {
  const projectId = getActiveProjectId();

  const { items: allReports, save: saveReport } = useCollection<ReportRecord>(
    COLLECTIONS.reports.col,
    COLLECTIONS.reports.ls,
  );

  const { items: allProjects } = useCollection<{ id: string; name: string }>(
    'projects',
    'struccalc.projects.v1',
  );

  const projectReports = useMemo(
    () => allReports.filter(r => r.projectId === projectId),
    [allReports, projectId],
  );

  const projectName = useMemo(
    () => allProjects.find(p => p.id === projectId)?.name ?? '',
    [allProjects, projectId],
  );

  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Auto-select first report
  useEffect(() => {
    if (!activeReportId && projectReports.length > 0) {
      setActiveReportId(projectReports[0].id);
    }
  }, [projectReports, activeReportId]);

  // Workspace markups subscription for color lookup
  const [workspaceMarkups, setWorkspaceMarkups] = useState<Record<string, WorkspaceMarkup[]>>({});

  useEffect(() => {
    if (!projectId) return;
    return subscribeWorkspace<Record<string, WorkspaceMarkup[]>>(
      'workspace_markups',
      projectId,
      data => setWorkspaceMarkups(data ?? {}),
    );
  }, [projectId]);

  const markupById = useMemo(() => {
    const map = new Map<string, WorkspaceMarkup>();
    for (const ms of Object.values(workspaceMarkups)) {
      for (const m of ms) map.set(m.id, m);
    }
    return map;
  }, [workspaceMarkups]);

  // Set of markupIds already in the active report
  const exhibitMarkupIds = useMemo(() => {
    const report = allReports.find(r => r.id === activeReportId);
    return new Set<string>((report?.exhibits ?? []).map(e => e.markupId));
  }, [allReports, activeReportId]);

  const handleAddToReport = useCallback(
    (markupIds: string[], boardId: string) => {
      // Find or use active report
      let reportId = activeReportId;
      let report = allReports.find(r => r.id === reportId) ?? null;

      if (!report) {
        // Create a new report for the project
        const newId = genId();
        const now = new Date().toISOString();
        report = {
          id: newId,
          projectId: projectId ?? '',
          title: 'New Report',
          executiveSummary: '',
          recommendations: '',
          exhibits: [],
          createdAt: now,
          updatedAt: now,
        };
        reportId = newId;
        setActiveReportId(newId);
      }

      const existingIds = new Set((report.exhibits ?? []).map(e => e.markupId));
      const newMarkupIds = markupIds.filter(id => !existingIds.has(id));
      if (newMarkupIds.length === 0) return;

      const startFigureNumber = (report.exhibits ?? []).length + 1;
      const newExhibits: ExhibitBlock[] = newMarkupIds.map((markupId, i) => ({
        id: genId(),
        markupId,
        boardId,
        caption: '',
        figureNumber: startFigureNumber + i,
      }));

      const updated: ReportRecord = {
        ...report,
        exhibits: [...(report.exhibits ?? []), ...newExhibits],
        updatedAt: new Date().toISOString(),
      };

      saveReport(updated);
    },
    [activeReportId, allReports, projectId, saveReport],
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Left: Workspace canvas 55% */}
      <div className="flex-[55] min-w-0 overflow-hidden">
        <VisualWorkspace
          compact
          reportExhibitIds={exhibitMarkupIds}
          onAddToReport={handleAddToReport}
        />
      </div>

      {/* Divider */}
      <div className="w-px bg-slate-700 shrink-0" />

      {/* Right: Report panel 45% */}
      <div className="flex-[45] min-w-0 flex flex-col bg-slate-900 overflow-hidden">
        <ReportPanel
          projectName={projectName}
          reports={projectReports}
          activeReportId={activeReportId}
          onSelectReport={setActiveReportId}
          onSaveReport={saveReport}
          markupById={markupById}
        />
      </div>
    </div>
  );
};
