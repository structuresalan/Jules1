import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, ClipboardList, Eye, FileText, MapPin, Network, Plus, PlayCircle, Share2 } from 'lucide-react';
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
  client?: string;
  location?: string;
  status?: string;
  colorIndex?: number;
  createdAt?: string;
}

interface PhotoRecord {
  id: string;
  projectId: string;
  dataUrl: string;
  name: string;
  caption: string;
  createdAt: string;
}

const ACTIVE_PROJECT_KEY = 'struccalc.activeProject.v3';

const getActiveProjectId = () => window.localStorage.getItem(ACTIVE_PROJECT_KEY) || '';

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
  const { items: allPhotos } = useCollection<PhotoRecord>(
    COLLECTIONS.photos.col,
    COLLECTIONS.photos.ls,
  );

  const activeProjectId = getActiveProjectId();
  const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;

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

  // ── Project-status surface (when a project is active) ──────────────────────
  if (activeProject) {
    const projectObs    = allObs.filter(o => o.projectId === activeProject.id);
    const projectVisits = allVisits.filter(v => v.projectId === activeProject.id);
    const projectPhotos = allPhotos.filter(p => p.projectId === activeProject.id);
    const openObs       = projectObs.filter(o => o.status !== 'Closed' && o.status !== 'Resolved');
    const criticalObs   = openObs.filter(o => o.severity === 'High');
    const nextVisit     = projectVisits
      .filter(v => v.date >= today && v.status !== 'Completed')
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    const sevenDaysAgo  = new Date(Date.now() - 7 * 86400000).toISOString();
    const photosThisWeek = projectPhotos.filter(p => p.createdAt >= sevenDaysAgo).length;
    const lastVisit = projectVisits
      .filter(v => v.status === 'Completed' || v.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastVisitLabel = lastVisit
      ? `Last visit ${ageLabel(lastVisit.date).replace(' open', '')} ago`
      : 'No visits yet';

    const colorIdx = activeProject.colorIndex !== undefined ? activeProject.colorIndex : stableIndexForId(activeProject.id);
    const chipColor = colorForProject(colorIdx).hex;

    const recentObs = [...projectObs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3);
    const photoForObs = (obs: Observation): PhotoRecord | undefined =>
      projectPhotos.find(p => p.createdAt >= obs.createdAt) || projectPhotos[0];

    const obsBadge = (o: Observation) => {
      if (o.severity === 'High' && o.status !== 'Closed' && o.status !== 'Resolved')
        return { label: 'Critical', cls: 'bg-red-600/90 text-white' };
      if (o.status === 'Closed' || o.status === 'Resolved')
        return { label: 'Resolved', cls: 'bg-emerald-600/80 text-white' };
      return { label: 'Open', cls: 'bg-black/60 text-white' };
    };

    const fmtDate = (iso: string) => {
      try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso)); }
      catch { return iso; }
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Project header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: chipColor }} />
              <h1 className="text-3xl tracking-tight text-slate-100 italic" style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontWeight: 400 }}>
                {activeProject.name}
              </h1>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 pl-5">
              {activeProject.status && <span className="text-emerald-400">● {activeProject.status}</span>}
              {activeProject.status && <span className="mx-1.5">·</span>}
              <span>{lastVisitLabel}</span>
              {activeProject.client && <><span className="mx-1.5">·</span><span>{activeProject.client}</span></>}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/project-settings" className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Share2 size={12} /> Share
            </Link>
            <Link to="/observations" className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              <Plus size={12} /> Observation
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/observations" className="bg-slate-800 hover:bg-slate-700/60 border border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <Eye size={11} /> Observations
            </div>
            <div className="text-2xl font-semibold text-slate-100 leading-none">{projectObs.length}</div>
            <div className="mt-2 text-[11px] text-slate-500">
              {openObs.length > 0 ? (
                <><span className="text-amber-400 font-semibold">{openObs.length} open</span>{criticalObs.length > 0 && <> · {criticalObs.length} critical</>}</>
              ) : (
                <span>All resolved</span>
              )}
            </div>
          </Link>
          <Link to="/site-visits" className="bg-slate-800 hover:bg-slate-700/60 border border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <MapPin size={11} /> Site Visits
            </div>
            <div className="text-2xl font-semibold text-slate-100 leading-none">{projectVisits.length}</div>
            <div className="mt-2 text-[11px] text-slate-500">
              {nextVisit ? <>Next: <span className="text-slate-300">{fmtDate(nextVisit.date)}{nextVisit.time ? ` ${nextVisit.time}` : ''}</span></> : 'No upcoming visits'}
            </div>
          </Link>
          <Link to="/documents" className="bg-slate-800 hover:bg-slate-700/60 border border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <FileText size={11} /> Reports
            </div>
            <div className="text-2xl font-semibold text-slate-100 leading-none">{Math.max(1, Math.ceil(projectVisits.filter(v => v.status === 'Completed').length))}</div>
            <div className="mt-2 text-[11px] text-slate-500">Generate from observations</div>
          </Link>
          <Link to="/photos" className="bg-slate-800 hover:bg-slate-700/60 border border-slate-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              <Camera size={11} /> Photos
            </div>
            <div className="text-2xl font-semibold text-slate-100 leading-none">{projectPhotos.length}</div>
            <div className="mt-2 text-[11px] text-slate-500">
              {photosThisWeek > 0 ? <><span className="text-blue-400 font-semibold">+{photosThisWeek}</span> this week</> : 'No new photos'}
            </div>
          </Link>
        </div>

        {/* Week strip */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">This Week</div>
          <div className="grid grid-cols-7 gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2">
            {weekDays.map(d => {
              const visitCount = projectVisits.filter(v => v.date === d.iso && v.status !== 'Completed').length;
              const isToday = d.isToday;
              return (
                <div key={d.iso}
                  className={`px-2 py-2.5 rounded text-center transition-colors ${
                    isToday ? 'bg-slate-700' : visitCount > 0 ? 'bg-blue-600/20 border border-blue-500/30' : 'hover:bg-slate-700/40'
                  }`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{isToday ? 'Today' : d.label}</div>
                  <div className={`text-base mt-0.5 ${isToday ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>{d.num}</div>
                  {visitCount > 0 && <div className="w-1 h-1 rounded-full bg-blue-400 mx-auto mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent observations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Recent Observations</div>
            {projectObs.length > 3 && (
              <Link to="/observations" className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300">
                See all <ChevronRight size={11} />
              </Link>
            )}
          </div>
          {recentObs.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-10 text-center">
              <Eye size={24} className="text-slate-700 mx-auto mb-2" />
              <div className="text-sm text-slate-500 mb-3">No observations yet on this project.</div>
              <Link to="/observations" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                <Plus size={11} /> Log first observation
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentObs.map(o => {
                const photo = photoForObs(o);
                const badge = obsBadge(o);
                return (
                  <Link key={o.id} to="/observations" className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg overflow-hidden transition-colors">
                    <div className="aspect-[4/3] bg-slate-700 relative">
                      {photo
                        ? <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800" />
                      }
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-slate-200 truncate">{o.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {ageLabel(o.createdAt).replace(' open', '')} ago
                        {o.location && <> · {o.location}</>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Cross-project agenda (when no project is active) ───────────────────────
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
