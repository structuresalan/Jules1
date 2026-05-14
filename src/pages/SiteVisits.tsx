import React, { useState, useMemo } from 'react';
import { Plus, X, MapPin, Save, Trash2, ChevronDown, ChevronUp, CheckSquare, Square, PlayCircle } from 'lucide-react';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';

type VisitStatus = 'Planned' | 'In Progress' | 'Completed';

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface SiteVisit {
  id: string;
  projectId: string;
  title: string;
  date: string;
  time?: string;
  status: VisitStatus;
  notes: string;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

const getActiveProjectId = () => window.localStorage.getItem('struccalc.activeProject.v3') || '';
const makeId = () => `sv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
const makeItemId = () => `ci_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const statusColor: Record<VisitStatus, string> = {
  Planned: 'bg-blue-900/40 text-blue-400 border-blue-800/50',
  'In Progress': 'bg-amber-900/40 text-amber-400 border-amber-800/50',
  Completed: 'bg-green-900/40 text-green-400 border-green-800/50',
};

const todayIso = () => new Date().toISOString().split('T')[0];

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded px-2.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1';

export const SiteVisits: React.FC = () => {
  const projectId = getActiveProjectId();
  const { items: allVisits, save, remove } = useCollection<SiteVisit>(
    COLLECTIONS.siteVisits.col,
    COLLECTIONS.siteVisits.ls,
  );
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('Planned');
  const [notes, setNotes] = useState('');
  const [checklistInput, setChecklistInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const projectVisits = useMemo(
    () => allVisits.filter(v => v.projectId === projectId).sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.time || '99:99').localeCompare(b.time || '99:99');
    }),
    [allVisits, projectId]
  );

  const resetForm = () => {
    setTitle(''); setDate(todayIso()); setTime(''); setVisitStatus('Planned');
    setNotes(''); setChecklistItems([]); setChecklistInput('');
  };

  const openNewForm = () => { resetForm(); setEditingId(null); setShowForm(true); };

  const openEditForm = (v: SiteVisit) => {
    setTitle(v.title); setDate(v.date); setTime(v.time || ''); setVisitStatus(v.status);
    setNotes(v.notes); setChecklistItems(v.checklist);
    setEditingId(v.id); setShowForm(true);
  };

  const addChecklistItem = () => {
    const text = checklistInput.trim();
    if (!text) return;
    setChecklistItems(prev => [...prev, { id: makeItemId(), text, done: false }]);
    setChecklistInput('');
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      const existing = allVisits.find(v => v.id === editingId);
      if (existing) save({
        ...existing, title: title.trim(), date, time: time || undefined, status: visitStatus,
        notes: notes.trim(), checklist: checklistItems, updatedAt: now,
      });
    } else {
      save({ id: makeId(), projectId, title: title.trim(), date, time: time || undefined, status: visitStatus,
        notes: notes.trim(), checklist: checklistItems, createdAt: now, updatedAt: now,
      });
    }
    setShowForm(false); resetForm(); setEditingId(null);
  };

  const deleteVisit = (id: string) => remove(id);

  const toggleItem = (visitId: string, itemId: string) => {
    const v = allVisits.find(x => x.id === visitId);
    if (!v) return;
    save({
      ...v,
      checklist: v.checklist.map(c => c.id !== itemId ? c : { ...c, done: !c.done }),
      updatedAt: new Date().toISOString(),
    });
  };

  const startVisit = (v: SiteVisit) => {
    save({ ...v, status: 'In Progress', updatedAt: new Date().toISOString() });
  };

  const completeVisit = (v: SiteVisit) => {
    save({ ...v, status: 'Completed', updatedAt: new Date().toISOString() });
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    } catch { return iso; }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <MapPin size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to view site visits.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Site Visits</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule and document visits to the site.</p>
        </div>
        <button onClick={openNewForm} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Plan a visit
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submitForm} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40">
            <span className="text-sm font-semibold text-slate-200">{editingId ? 'Edit visit' : 'Plan a visit'}</span>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelCls}>Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Follow-up — verify B12, B18 corrosion" required />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time (optional)</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={visitStatus} onChange={e => setVisitStatus(e.target.value as VisitStatus)} className={inputCls}>
                <option>Planned</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className={`${inputCls} min-h-16 resize-none`} placeholder="Purpose of visit, items to check..." />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Checklist</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={checklistInput}
                  onChange={e => setChecklistInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
                  className={inputCls}
                  placeholder="Add checklist item and press Enter"
                />
                <button type="button" onClick={addChecklistItem} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors shrink-0">
                  Add
                </button>
              </div>
              {checklistItems.length > 0 && (
                <div className="space-y-1">
                  {checklistItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm text-slate-300">
                      <Square size={14} className="text-slate-600 shrink-0" />
                      <span className="flex-1">{item.text}</span>
                      <button type="button" onClick={() => setChecklistItems(prev => prev.filter(c => c.id !== item.id))} className="text-slate-600 hover:text-red-400 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700 bg-slate-900/40">
            <button type="submit" disabled={!title.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium disabled:opacity-40 transition-colors">
              <Save size={14} /> {editingId ? 'Save changes' : 'Save visit'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {projectVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800 border border-slate-700 rounded-xl text-center">
          <MapPin size={24} className="text-slate-700 mb-3" />
          <div className="text-slate-500 text-sm">No visits yet — plan your first site visit above.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {projectVisits.map(v => (
            <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg px-2.5 py-1.5 text-center shrink-0 min-w-[72px]">
                  <div className="text-[10px] font-bold text-blue-400 font-mono">{formatDate(v.date)}</div>
                  {v.time && <div className="text-[10px] text-blue-300 font-mono mt-0.5">{v.time}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{v.title}</div>
                  {v.checklist.length > 0 && (
                    <div className="text-xs text-slate-500 font-mono">
                      {v.checklist.filter(c => c.done).length}/{v.checklist.length} checklist items
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor[v.status]}`}>{v.status}</span>
                {expandedId === v.id ? <ChevronUp size={14} className="text-slate-600 shrink-0" /> : <ChevronDown size={14} className="text-slate-600 shrink-0" />}
              </div>

              {expandedId === v.id && (
                <div className="px-4 pb-4 border-t border-slate-700/60 pt-3 space-y-3">
                  {v.notes && <p className="text-sm text-slate-400 whitespace-pre-wrap">{v.notes}</p>}

                  {v.checklist.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Checklist</div>
                      {v.checklist.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(v.id, item.id)}
                          className="flex items-center gap-2 w-full text-left text-sm hover:text-white transition-colors"
                        >
                          {item.done
                            ? <CheckSquare size={15} className="text-green-400 shrink-0" />
                            : <Square size={15} className="text-slate-600 shrink-0" />}
                          <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-300'}>{item.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {v.status === 'Planned' && (
                      <button onClick={() => startVisit(v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600/20 text-amber-400 border border-amber-800/40 rounded hover:bg-amber-600/30 transition-colors">
                        <PlayCircle size={13} /> Start visit
                      </button>
                    )}
                    {v.status === 'In Progress' && (
                      <button onClick={() => completeVisit(v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600/20 text-green-400 border border-green-800/40 rounded hover:bg-green-600/30 transition-colors">
                        <CheckSquare size={13} /> Mark complete
                      </button>
                    )}
                    <button onClick={() => openEditForm(v)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors">
                      Edit
                    </button>
                    <button onClick={() => deleteVisit(v.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition-colors">
                      <Trash2 size={12} />
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
