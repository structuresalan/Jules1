import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ClipboardList, Network, Plus, ChevronRight, PlayCircle } from 'lucide-react';
import { colorForProject, stableIndexForId } from '../lib/projectColors';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';

interface SiteVisit {
  id: string;
  projectId: string;
  title: string;
  date: string;
  time?: string;
  status: string;
  notes: string;
  checklist: { id: string; text: string; done: boolean }[];
  createdAt: string;
  updatedAt: string;
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
  updatedAt: string;
}

interface StoredProject {
  id: string;
  name: string;
  projectNumber?: string;
  colorIndex?: number;
}

const isoToday = () => new Date().toISOString().split('T')[0];

const formatDayHeader = () => {
  const now = new Date();
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
  return { day, date, weekNum };
};

const getWeekDays = () => {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      iso: d.toISOString().split('T')[0],
      num: d.getDate(),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: d.toISOString().split('T')[0] === isoToday(),
    };
  });
};

const ageLabel = (isoDate: string) => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h open`;
  const d = Math.floor(diff / 86400000);
  if (d < 7) return `${d}d open`;
  return `${Math.floor(d / 7)}w open`;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const today = isoToday();
  const { day, date, weekNum } = formatDayHeader();
  const weekDays = getWeekDays();

  const { items: allVisits, save: saveVisit } = useCollection<SiteVisit>(
    COLLECTIONS.siteVisits.col,
    COLLECTIONS.siteVisits.ls,
  );
  const { items: allObs } = useCollection<Observation>(
    COLLECTIONS.observations.col,
    COLLECTIONS.observations.ls,
  );
  const { items: projects } = useCollection<StoredProject>(
    COLLECTIONS.projects.col,
    COLLECTIONS.projects.ls,
  );

  const projectMap = React.useMemo(() => {
    const m: Record<string, StoredProject> = {};
    projects.forEach(p => { m[p.id] = p; });
    return m;
  }, [projects]);

  const todayVisits = allVisits
    .filter(v => v.date === today && v.status !== 'Completed')
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  const upcomingVisits = allVisits.filter(v => v.date > today && v.status !== 'Completed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const urgentObs = allObs
    .filter(o => (o.severity === 'High' || o.severity === 'Medium') && o.status !== 'Closed')
    .sort((a, b) => {
      const s = (x: Observation) => x.severity === 'High' ? 0 : 1;
      return s(a) - s(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 5);

  const visitsByDay = React.useMemo(() => {
    const m: Record<string, number> = {};
    allVisits.forEach(v => {
      if (v.status !== 'Completed') m[v.date] = (m[v.date] || 0) + 1;
    });
    return m;
  }, [allVisits]);

  const startVisit = (visit: SiteVisit) => {
    saveVisit({ ...visit, status: 'In Progress', updatedAt: new Date().toISOString() });
    window.localStorage.setItem('struccalc.activeProject.v3', visit.projectId);
    window.localStorage.setItem('struccalc.sessionMode.v3', 'project');
    navigate('/site-visits');
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">{day}, {date}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Week {weekNum}
            {todayVisits.length > 0 && ` · ${todayVisits.length} visit${todayVisits.length > 1 ? 's' : ''} today`}
            {urgentObs.length > 0 && ` · ${urgentObs.length} observation${urgentObs.length > 1 ? 's' : ''} need attention`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/site-visits" className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            Plan a visit
          </Link>
          <Link to="/site-visits" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/25 rounded-lg transition-colors">
            <Plus size={12} /> New visit
          </Link>
        </div>
      </div>

      {/* Today's visits */}
      {todayVisits.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Today's visits</div>
          <div className="space-y-3">
            {todayVisits.map(v => {
              const proj = projectMap[v.projectId];
              const colorIdx = proj?.colorIndex !== undefined ? proj.colorIndex : stableIndexForId(v.projectId);
              const chipColor = colorForProject(colorIdx).hex;
              const doneCount = v.checklist.filter(c => c.done).length;
              return (
                <div key={v.id} className="relative overflow-hidden flex items-center gap-4 p-4 bg-slate-800 border border-blue-500/25 rounded-xl">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: chipColor }} />
                  <div className="flex-1 min-w-0 ml-1">
                    {proj && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: chipColor }} />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{proj.name}{proj.projectNumber ? ` · ${proj.projectNumber}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2">
                      {v.time && <span className="text-lg font-bold font-mono text-blue-300 shrink-0">{v.time}</span>}
                      <div className="text-sm font-semibold text-slate-100">{v.title}</div>
                    </div>
                    {v.checklist.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">{doneCount}/{v.checklist.length} checklist items</div>
                    )}
                  </div>
                  <button
                    onClick={() => startVisit(v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium shrink-0 transition-colors"
                  >
                    <PlayCircle size={13} /> Start visit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week strip */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">This week</span>
          <Link to="/site-visits" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Open calendar →</Link>
        </div>
        <div className="grid grid-cols-7 gap-1.5 bg-slate-800 border border-slate-700 rounded-xl p-3">
          {weekDays.map(d => {
            const count = visitsByDay[d.iso] || 0;
            return (
              <div
                key={d.iso}
                className={`flex flex-col items-center py-2 px-1 rounded-lg cursor-pointer transition-colors ${
                  d.isToday
                    ? 'bg-blue-600/15 border border-blue-500/30'
                    : 'hover:bg-slate-700/60'
                }`}
                onClick={() => navigate('/site-visits')}
              >
                <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${d.isToday ? 'text-blue-400' : 'text-slate-500'}`}>{d.label}</div>
                <div className={`text-lg font-semibold font-mono leading-none ${d.isToday ? 'text-blue-300' : 'text-slate-300'}`}>{d.num}</div>
                <div className="flex gap-1 mt-2 min-h-[6px]">
                  {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Quick actions</div>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/observations" className="flex items-center gap-3 p-3.5 bg-slate-800 border border-slate-700 hover:border-blue-500/30 hover:bg-slate-800/80 rounded-xl transition-all group">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
              <ClipboardList size={17} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Log observation</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Add to any project</div>
            </div>
          </Link>
          <Link to="/site-visits" className="flex items-center gap-3 p-3.5 bg-slate-800 border border-slate-700 hover:border-blue-500/30 hover:bg-slate-800/80 rounded-xl transition-all group">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
              <MapPin size={17} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Plan a visit</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Schedule site work</div>
            </div>
          </Link>
          <Link to="/visual-workspace" className="flex items-center gap-3 p-3.5 bg-slate-800 border border-slate-700 hover:border-blue-500/30 hover:bg-slate-800/80 rounded-xl transition-all group">
            <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-600/20 transition-colors">
              <Network size={17} className="text-blue-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Open workspace</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Visual boards</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Needs attention — cross-project urgent observations */}
      {urgentObs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Needs your attention · {urgentObs.length} observation{urgentObs.length > 1 ? 's' : ''}
            </span>
            <Link to="/inbox" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {urgentObs.map(obs => {
              const proj = projectMap[obs.projectId];
              const isHigh = obs.severity === 'High';
              return (
                <div key={obs.id} className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 hover:border-slate-600 transition-colors">
                  <div className={`w-1.5 h-8 rounded-full shrink-0 ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    {proj && <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">{proj.name}</div>}
                    <div className="text-sm font-medium text-slate-200 truncate">{obs.title}</div>
                    {obs.location && <div className="text-xs text-slate-500 font-mono mt-0.5">{obs.location}</div>}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    isHigh ? 'bg-red-900/40 text-red-400 border-red-800/50' : 'bg-amber-900/40 text-amber-400 border-amber-800/50'
                  }`}>{obs.severity}</span>
                  <div className="text-[11px] font-mono text-slate-600 shrink-0">{ageLabel(obs.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming visits */}
      {todayVisits.length === 0 && upcomingVisits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Upcoming visits</span>
            <Link to="/site-visits" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Plan a visit →</Link>
          </div>
          <div className="space-y-2">
            {upcomingVisits.map(v => {
              const proj = projectMap[v.projectId];
              const colorIdx = proj?.colorIndex !== undefined ? proj.colorIndex : stableIndexForId(v.projectId);
              const chipColor = colorForProject(colorIdx).hex;
              return (
                <div key={v.id} className="relative overflow-hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: chipColor }} />
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{v.date}</span>
                      {proj && <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">{proj.name}</span>}
                    </div>
                    <div className="text-sm font-medium text-slate-300 truncate mt-0.5">{v.title}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when nothing is going on */}
      {todayVisits.length === 0 && urgentObs.length === 0 && upcomingVisits.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-10 text-center">
          <div className="text-slate-600 text-sm">No visits or observations yet — start by opening the Workspace or logging an observation.</div>
        </div>
      )}
    </div>
  );
};
