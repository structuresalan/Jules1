import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Plus } from 'lucide-react';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';
import type { ReportRecord } from './ReportEditor';

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
}

const getActiveProjectId = () => window.localStorage.getItem('struccalc.activeProject.v3') || '';
const makeReportId = () => `report_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const fmtDateTime = (iso: string) => {
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)); }
  catch { return iso; }
};

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const activeId = getActiveProjectId();
  const { items: projects } = useCollection<ProjectRecord>(COLLECTIONS.projects.col, COLLECTIONS.projects.ls);
  const { items: reports, save: saveReport } = useCollection<ReportRecord>(COLLECTIONS.reports.col, COLLECTIONS.reports.ls);

  const project = projects.find(p => p.id === activeId);
  const projectReports = reports
    .filter(r => r.projectId === activeId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const createReport = () => {
    if (!project) return;
    const now = new Date().toISOString();
    const id = makeReportId();
    const draft: ReportRecord = {
      id,
      projectId: project.id,
      title: 'Inspection Report',
      executiveSummary: '',
      recommendations: '',
      createdAt: now,
      updatedAt: now,
    };
    saveReport(draft);
    navigate(`/reports/${id}`);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to view its reports.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projectReports.length === 0
              ? `No reports yet for ${project.name}.`
              : `${projectReports.length} report${projectReports.length === 1 ? '' : 's'} for ${project.name}.`}
          </p>
        </div>
        <button onClick={createReport} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> New Report
        </button>
      </div>

      {projectReports.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <FileText size={28} className="text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-400 mb-1">Create your first report</div>
          <div className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            The editor auto-fills your project info, observations, and sign-off. You write the narrative — executive summary and recommendations.
          </div>
          <button onClick={createReport} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus size={14} /> Start a Report
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {projectReports.map(r => (
            <Link
              key={r.id}
              to={`/reports/${r.id}`}
              className="flex items-center justify-between gap-3 bg-slate-800 hover:bg-slate-700/60 border border-slate-700 hover:border-blue-500 rounded-lg px-4 py-3 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-slate-500 group-hover:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">{r.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Updated {fmtDateTime(r.updatedAt)}</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-blue-400 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
