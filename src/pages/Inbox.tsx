import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox as InboxIcon, ChevronRight } from 'lucide-react';
import { colorForProject, stableIndexForId } from '../lib/projectColors';

type Severity = 'Low' | 'Medium' | 'High';
type ObsStatus = 'Open' | 'In Review' | 'Field Verify' | 'Closed';

interface Observation {
  id: string;
  projectId: string;
  title: string;
  location: string;
  severity: Severity;
  status: ObsStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface StoredProject {
  id: string;
  name: string;
  projectNumber?: string;
  colorIndex?: number;
}

const readObservations = (): Observation[] => {
  try {
    const raw = window.localStorage.getItem('struccalc.observations.v1');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const readProjects = (): StoredProject[] => {
  try {
    const raw = window.localStorage.getItem('struccalc.projects.v3');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const ageLabel = (isoDate: string) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
};

const severityOrder: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 };

type Filter = 'All' | 'High' | 'Medium' | 'Low';

const filterLabels: Filter[] = ['All', 'High', 'Medium', 'Low'];

export const InboxPage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('All');

  const allObs = readObservations();
  const projects = readProjects();

  const projectMap = useMemo(() => {
    const m: Record<string, StoredProject> = {};
    projects.forEach(p => { m[p.id] = p; });
    return m;
  }, [projects]);

  const openObs = useMemo(() =>
    allObs
      .filter(o => o.status !== 'Closed')
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allObs]
  );

  const filtered = useMemo(() =>
    filter === 'All' ? openObs : openObs.filter(o => o.severity === filter),
    [openObs, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: openObs.length };
    filterLabels.slice(1).forEach(s => { c[s] = openObs.filter(o => o.severity === s).length; });
    return c;
  }, [openObs]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">All open observations across every project, sorted by severity.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-slate-700 pb-0">
        {filterLabels.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              filter === f ? 'border-blue-500 text-blue-300' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            {f}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${filter === f ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
              {counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800 border border-slate-700 rounded-xl text-center">
          <InboxIcon size={24} className="text-slate-700 mb-3" />
          <div className="text-slate-500 text-sm">
            {openObs.length === 0 ? 'No open observations across any project.' : `No ${filter.toLowerCase()} severity observations.`}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(obs => {
            const proj = projectMap[obs.projectId];
            const colorIdx = proj?.colorIndex !== undefined ? proj.colorIndex : stableIndexForId(obs.projectId);
            const chipColor = colorForProject(colorIdx).hex;
            const isHigh = obs.severity === 'High';
            const isMed = obs.severity === 'Medium';
            return (
              <div key={obs.id} className="relative overflow-hidden flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-slate-600 transition-colors">
                {/* project color stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: chipColor }} />
                {/* severity bar */}
                <div className={`w-1.5 h-8 rounded-full shrink-0 ml-1 ${isHigh ? 'bg-red-500' : isMed ? 'bg-amber-500' : 'bg-slate-500'}`} />
                <div className="flex-1 min-w-0">
                  {proj && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: chipColor }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{proj.name}</span>
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-200 truncate">{obs.title}</div>
                  {obs.location && <div className="text-xs text-slate-500 font-mono mt-0.5">{obs.location}</div>}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                  isHigh ? 'bg-red-900/40 text-red-400 border-red-800/50'
                  : isMed ? 'bg-amber-900/40 text-amber-400 border-amber-800/50'
                  : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>{obs.severity}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                  obs.status === 'Open' ? 'bg-blue-900/40 text-blue-400 border-blue-800/50'
                  : obs.status === 'In Review' ? 'bg-purple-900/40 text-purple-400 border-purple-800/50'
                  : 'bg-amber-900/40 text-amber-400 border-amber-800/50'
                }`}>{obs.status}</span>
                <div className="text-[11px] font-mono text-slate-600 shrink-0">{ageLabel(obs.createdAt)}</div>
                <Link
                  to="/observations"
                  onClick={() => {
                    window.localStorage.setItem('struccalc.activeProject.v3', obs.projectId);
                    window.localStorage.setItem('struccalc.sessionMode.v3', 'project');
                  }}
                  className="text-slate-600 hover:text-slate-300 transition-colors shrink-0"
                >
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
