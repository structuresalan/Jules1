import React, { useState, useMemo } from 'react';
import { Plus, X, ClipboardList, ChevronDown, ChevronUp, Pencil, Trash2, Save } from 'lucide-react';

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

const STORAGE_KEY = 'struccalc.observations.v1';

const getActiveProjectId = () => window.localStorage.getItem('struccalc.activeProject.v3') || '';

const readObservations = (): Observation[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Observation[]) : [];
  } catch { return []; }
};

const saveObservations = (obs: Observation[]) =>
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));

const makeId = () => `obs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const severityColor: Record<Severity, string> = {
  Low: 'bg-slate-700 text-slate-300 border-slate-600',
  Medium: 'bg-amber-900/40 text-amber-400 border-amber-800/50',
  High: 'bg-red-900/40 text-red-400 border-red-800/50',
};

const statusColor: Record<ObsStatus, string> = {
  Open: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  'In Review': 'bg-purple-900/40 text-purple-400 border-purple-800/50',
  'Field Verify': 'bg-amber-900/40 text-amber-400 border-amber-800/50',
  Closed: 'bg-slate-700 text-slate-500 border-slate-600',
};

const STATUSES: ObsStatus[] = ['Open', 'In Review', 'Field Verify', 'Closed'];
const SEVERITIES: Severity[] = ['Low', 'Medium', 'High'];

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1';

export const Observations: React.FC = () => {
  const projectId = getActiveProjectId();
  const [allObs, setAllObs] = useState<Observation[]>(readObservations);
  const [filterStatus, setFilterStatus] = useState<ObsStatus | 'All'>('All');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<Severity>('Medium');
  const [status, setStatus] = useState<ObsStatus>('Open');
  const [notes, setNotes] = useState('');

  const projectObs = useMemo(
    () => allObs.filter(o => o.projectId === projectId),
    [allObs, projectId]
  );

  const filtered = useMemo(
    () => filterStatus === 'All' ? projectObs : projectObs.filter(o => o.status === filterStatus),
    [projectObs, filterStatus]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: projectObs.length };
    STATUSES.forEach(s => { c[s] = projectObs.filter(o => o.status === s).length; });
    return c;
  }, [projectObs]);

  const store = (next: Observation[]) => { setAllObs(next); saveObservations(next); };

  const resetForm = () => { setTitle(''); setLocation(''); setSeverity('Medium'); setStatus('Open'); setNotes(''); };

  const openNewForm = () => { resetForm(); setEditingId(null); setShowForm(true); };

  const openEditForm = (obs: Observation) => {
    setTitle(obs.title);
    setLocation(obs.location);
    setSeverity(obs.severity);
    setStatus(obs.status);
    setNotes(obs.notes);
    setEditingId(obs.id);
    setShowForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      store(allObs.map(o => o.id !== editingId ? o : { ...o, title: title.trim(), location: location.trim(), severity, status, notes: notes.trim(), updatedAt: now }));
    } else {
      const obs: Observation = { id: makeId(), projectId, title: title.trim(), location: location.trim(), severity, status, notes: notes.trim(), createdAt: now, updatedAt: now };
      store([obs, ...allObs]);
    }
    setShowForm(false);
    resetForm();
    setEditingId(null);
  };

  const deleteObs = (id: string) => store(allObs.filter(o => o.id !== id));

  const cycleStatus = (obs: Observation) => {
    const idx = STATUSES.indexOf(obs.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    store(allObs.map(o => o.id !== obs.id ? o : { ...o, status: next, updatedAt: new Date().toISOString() }));
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardList size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to view observations.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Observations</h1>
          <p className="mt-1 text-sm text-slate-500">Log and track structural findings from site visits.</p>
        </div>
        <button onClick={openNewForm} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New observation
        </button>
      </div>

      {/* Status pipeline */}
      <div className="flex gap-1 border-b border-slate-700 pb-0">
        {(['All', ...STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              filterStatus === s ? 'border-blue-500 text-blue-300' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            {s}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${filterStatus === s ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
              {counts[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* New / Edit form */}
      {showForm && (
        <form onSubmit={submitForm} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40">
            <span className="text-sm font-semibold text-slate-200">{editingId ? 'Edit observation' : 'New observation'}</span>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelCls}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Corrosion on beam B-12 flange" required />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="e.g. Level 2, Grid B" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelCls}>Severity</label>
                <select value={severity} onChange={e => setSeverity(e.target.value as Severity)} className={inputCls}>
                  {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className={labelCls}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as ObsStatus)} className={inputCls}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputCls} min-h-20 resize-none`} placeholder="Describe the finding in detail..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700 bg-slate-900/40">
            <button type="submit" disabled={!title.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium disabled:opacity-40 transition-colors">
              <Save size={14} /> {editingId ? 'Save changes' : 'Add observation'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800 border border-slate-700 rounded-xl text-center">
          <ClipboardList size={24} className="text-slate-700 mb-3" />
          <div className="text-slate-500 text-sm">
            {projectObs.length === 0 ? 'No observations yet — add your first finding above.' : `No ${filterStatus.toLowerCase()} observations.`}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(obs => (
            <div key={obs.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === obs.id ? null : obs.id)}
              >
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${severityColor[obs.severity]}`}>{obs.severity}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{obs.title}</div>
                  {obs.location && <div className="text-xs text-slate-500 font-mono">{obs.location}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); cycleStatus(obs); }}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-opacity hover:opacity-80 ${statusColor[obs.status]}`}
                  title="Click to advance status"
                >
                  {obs.status}
                </button>
                <div className="text-xs text-slate-600 font-mono hidden sm:block">
                  {new Date(obs.createdAt).toLocaleDateString()}
                </div>
                {expandedId === obs.id ? <ChevronUp size={14} className="text-slate-600 shrink-0" /> : <ChevronDown size={14} className="text-slate-600 shrink-0" />}
              </div>
              {expandedId === obs.id && (
                <div className="px-4 pb-4 border-t border-slate-700/60 pt-3">
                  {obs.notes ? (
                    <p className="text-sm text-slate-400 whitespace-pre-wrap mb-3">{obs.notes}</p>
                  ) : (
                    <p className="text-sm text-slate-600 italic mb-3">No notes added.</p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => openEditForm(obs)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded transition-colors">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => deleteObs(obs.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition-colors">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
