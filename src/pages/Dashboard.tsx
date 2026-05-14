import React from 'react';
import { Network, ArrowRight, Clock, AlertTriangle, Camera, MapPin, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const getLastSheet = (): { name: string; meta: string } | null => {
  try {
    const raw = window.localStorage.getItem('struccalc.lastSheet.v1');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getProjectName = (): string => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeId = window.localStorage.getItem('struccalc.activeProject.v3');
    if (!rawProjects || !activeId) return 'No project selected';
    const projects = JSON.parse(rawProjects) as Array<{ id: string; name: string }>;
    return projects.find(p => p.id === activeId)?.name || 'No project selected';
  } catch {
    return 'No project selected';
  }
};

const getProjectStats = (projectId: string) => {
  try {
    const obs = JSON.parse(window.localStorage.getItem('struccalc.observations.v1') || '[]') as Array<{ projectId: string; status: string; severity: string }>;
    const visits = JSON.parse(window.localStorage.getItem('struccalc.sitevisits.v1') || '[]') as Array<{ projectId: string }>;
    const projectObs = obs.filter(o => o.projectId === projectId);
    return {
      openObs: projectObs.filter(o => o.status !== 'Closed').length,
      highSeverity: projectObs.filter(o => o.severity === 'High' && o.status !== 'Closed').length,
      visits: visits.filter(v => v.projectId === projectId).length,
    };
  } catch { return { openObs: 0, highSeverity: 0, visits: 0 }; }
};

const getLastVisited = (): string => {
  try {
    const raw = window.localStorage.getItem('struccalc.lastVisited.v1');
    if (!raw) return '';
    const diff = Date.now() - Number(raw);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Last visited today';
    if (days === 1) return 'Last visited yesterday';
    return `Last visited ${days} days ago`;
  } catch {
    return '';
  }
};

export const Dashboard: React.FC = () => {
  const projectId = window.localStorage.getItem('struccalc.activeProject.v3') || '';
  const lastSheet = getLastSheet();
  const projectName = getProjectName();
  const lastVisited = getLastVisited();
  const projectStats = getProjectStats(projectId);

  React.useEffect(() => {
    window.localStorage.setItem('struccalc.lastVisited.v1', String(Date.now()));
  }, []);

  const stats = [
    { label: 'Open obs.', value: String(projectStats.openObs), delta: projectStats.openObs === 0 ? 'None logged yet' : `${projectStats.openObs} active`, icon: <ClipboardList size={15} />, danger: false },
    { label: 'High severity', value: String(projectStats.highSeverity), delta: projectStats.highSeverity === 0 ? 'All clear' : 'Requires attention', icon: <AlertTriangle size={15} />, danger: projectStats.highSeverity > 0 },
    { label: 'Photos', value: '0', delta: 'None uploaded', icon: <Camera size={15} />, danger: false },
    { label: 'Site visits', value: String(projectStats.visits), delta: projectStats.visits === 0 ? 'None scheduled' : `${projectStats.visits} logged`, icon: <MapPin size={15} />, danger: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">{projectName}</h1>
          <p className="mt-1 text-sm text-slate-500">Pick up where you left off.</p>
        </div>
        {lastVisited && <span className="text-xs text-slate-600">{lastVisited}</span>}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
              {s.icon}
              {s.label}
            </div>
            <div className={`text-3xl font-semibold tracking-tight ${s.danger ? 'text-red-400' : 'text-slate-100'}`}>
              {s.value}
            </div>
            <div className="text-xs text-slate-600 mt-1">{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Continue last sheet */}
      {lastSheet ? (
        <Link
          to="/visual-workspace"
          className="relative overflow-hidden flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/40 transition-all group"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: 'var(--chip-color, #5B8DEF)' }} />
          <div className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center shrink-0">
            <Network size={20} className="text-blue-500 opacity-60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Continue last sheet</div>
            <div className="text-sm font-semibold text-slate-200 truncate">{lastSheet.name}</div>
            {lastSheet.meta && <div className="text-xs text-slate-500 mt-0.5 font-mono">{lastSheet.meta}</div>}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/15 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium shrink-0 group-hover:bg-blue-600/25 transition-colors">
            Open <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      ) : (
        <Link
          to="/visual-workspace"
          className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-blue-500/40 transition-all group"
        >
          <div className="w-16 h-12 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center shrink-0">
            <Clock size={20} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Continue last sheet</div>
            <div className="text-sm text-slate-500">No sheets opened yet — open the Workspace to start</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/15 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium shrink-0">
            Open Workspace <ArrowRight size={13} />
          </div>
        </Link>
      )}

      {/* Upcoming visits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Upcoming visits</span>
          <Link to="/site-visits" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Plan a visit →</Link>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-8 text-center">
          <MapPin size={20} className="mx-auto mb-2 text-slate-700" />
          <div className="text-sm text-slate-600">No visits scheduled</div>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Recent activity</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl">
          <div className="px-4 py-8 text-center">
            <div className="text-sm text-slate-600">No activity yet — start by opening the Workspace</div>
          </div>
        </div>
      </div>
    </div>
  );
};
