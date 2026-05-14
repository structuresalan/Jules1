import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, X, Trash2, Pencil, Save, Search, Tag } from 'lucide-react';
import { useCollection } from '../lib/useCollection';
import { COLLECTIONS } from '../lib/db';

interface LibraryEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const makeId = () => `lib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

export const Library: React.FC = () => {
  const { items: entries, save, remove } = useCollection<LibraryEntry>(
    COLLECTIONS.library.col,
    COLLECTIONS.library.ls,
  );
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => e.tags.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) result = result.filter(e => e.tags.includes(activeTag));
    return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [entries, search, activeTag]);

  const resetForm = () => { setTitle(''); setContent(''); setTags([]); setTagInput(''); };

  const openNew = () => { resetForm(); setEditingId(null); setShowForm(true); };

  const openEdit = (e: LibraryEntry) => {
    setTitle(e.title); setContent(e.content); setTags(e.tags);
    setTagInput(''); setEditingId(e.id); setShowForm(true);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      const existing = entries.find(en => en.id === editingId);
      if (existing) save({ ...existing, title: title.trim(), content: content.trim(), tags, updatedAt: now });
    } else {
      save({ id: makeId(), title: title.trim(), content: content.trim(), tags, createdAt: now, updatedAt: now });
    }
    setShowForm(false); resetForm(); setEditingId(null);
  };

  const selected = entries.find(e => e.id === selectedId) || null;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Library</h1>
          <p className="mt-1 text-sm text-slate-500">Store reusable notes, code references, and calculation templates.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> New entry
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40">
            <span className="text-sm font-semibold text-slate-200">{editingId ? 'Edit entry' : 'New library entry'}</span>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingId(null); }} className="text-slate-500 hover:text-white"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className={labelCls}>Title *</label>
              <input autoFocus value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="e.g. AISC beam capacity formula" required />
            </div>
            <div>
              <label className={labelCls}>Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} className={`${inputCls} min-h-32 resize-none font-mono text-xs leading-relaxed`} placeholder="Notes, formulas, code snippets, references..." />
            </div>
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  className={inputCls}
                  placeholder="Add a tag and press Enter"
                />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors shrink-0">Add</button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-800/40 rounded-full text-xs">
                      {t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))} className="text-blue-600 hover:text-blue-300"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700 bg-slate-900/40">
            <button type="submit" disabled={!title.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium disabled:opacity-40 transition-colors">
              <Save size={14} /> {editingId ? 'Save changes' : 'Add to library'}
            </button>
          </div>
        </form>
      )}

      {/* Search + tag filter */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library…"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500" />
          </div>
          {allTags.map(t => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                activeTag === t ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
              }`}>
              <Tag size={10} /> {t}
            </button>
          ))}
        </div>
      )}

      {/* Two-panel layout when something is selected */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-800 border border-slate-700 rounded-xl text-center">
          <BookOpen size={24} className="text-slate-700 mb-3" />
          <div className="text-slate-500 text-sm">No library entries yet — add references, formulas, or templates.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-800 border border-slate-700 rounded-xl text-center">
          <div className="text-slate-500 text-sm">No entries match your search.</div>
        </div>
      ) : (
        <div className={`grid gap-4 ${selected ? 'grid-cols-[280px_1fr]' : 'grid-cols-1'}`}>
          {/* List */}
          <div className="space-y-2">
            {filtered.map(e => (
              <div
                key={e.id}
                onClick={() => setSelectedId(selectedId === e.id ? null : e.id)}
                className={`cursor-pointer bg-slate-800 border rounded-xl px-4 py-3 hover:border-slate-600 transition-colors ${selectedId === e.id ? 'border-blue-500/50' : 'border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-slate-200 leading-snug">{e.title}</div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={ev => { ev.stopPropagation(); openEdit(e); }} className="p-1 text-slate-600 hover:text-slate-300 transition-colors"><Pencil size={12} /></button>
                    <button onClick={ev => { ev.stopPropagation(); if (selectedId === e.id) setSelectedId(null); remove(e.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
                {e.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {e.tags.map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-slate-700 text-slate-500 rounded text-[10px] font-mono">{t}</span>
                    ))}
                  </div>
                )}
                {e.content && (
                  <div className="text-xs text-slate-500 mt-1.5 line-clamp-2 font-mono leading-relaxed">{e.content}</div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden sticky top-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/40">
                <span className="text-sm font-semibold text-slate-200 truncate">{selected.title}</span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(selected)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X size={13} /></button>
                </div>
              </div>
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-slate-700">
                  {selected.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-900/30 text-blue-400 border border-blue-800/40 rounded-full text-xs">{t}</span>
                  ))}
                </div>
              )}
              <div className="p-4 overflow-auto max-h-[70vh]">
                {selected.content ? (
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{selected.content}</pre>
                ) : (
                  <div className="text-sm text-slate-600 italic">No content.</div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-slate-700 text-[10px] text-slate-600 font-mono">
                Updated {new Date(selected.updatedAt).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
