import React, { useState } from 'react';
import { Save, SlidersHorizontal } from 'lucide-react';

type ProjectStatus = 'Active' | 'On Hold' | 'Closed' | 'Archived';
type ProjectType = 'New Construction' | 'Renovation' | 'Inspection' | 'Mixed';

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  description: string;
  status: ProjectStatus;
  projectType: ProjectType;
  createdAt: string;
  updatedAt: string;
  predictedEndDate?: string;
  colorIndex?: number;
}

const STORAGE_KEY = 'struccalc.projects.v3';

const readProject = (): ProjectRecord | null => {
  try {
    const activeId = window.localStorage.getItem('struccalc.activeProject.v3');
    if (!activeId) return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    const projects: ProjectRecord[] = Array.isArray(parsed) ? parsed : [];
    return projects.find(p => p.id === activeId) || null;
  } catch { return null; }
};

const saveProject = (updated: ProjectRecord) => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    const projects: ProjectRecord[] = Array.isArray(parsed) ? parsed : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(
      projects.map(p => p.id === updated.id ? updated : p)
    ));
  } catch { /* noop */ }
};

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

export const ProjectSettings: React.FC = () => {
  const [project, setProject] = React.useState<ProjectRecord | null>(readProject);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(project?.name || '');
  const [projectNumber, setProjectNumber] = useState(project?.projectNumber || '');
  const [client, setClient] = useState(project?.client || '');
  const [location, setLocation] = useState(project?.location || '');
  const [description, setDescription] = useState(project?.description || '');
  const [projectType, setProjectType] = useState<ProjectType>(project?.projectType || 'New Construction');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'Active');
  const [predictedEndDate, setPredictedEndDate] = useState(project?.predictedEndDate || '');

  React.useEffect(() => {
    const p = readProject();
    setProject(p);
    if (p) {
      setName(p.name); setProjectNumber(p.projectNumber); setClient(p.client);
      setLocation(p.location); setDescription(p.description);
      setProjectType(p.projectType); setStatus(p.status);
      setPredictedEndDate(p.predictedEndDate || '');
    }
  }, []);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SlidersHorizontal size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to view its settings.</div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated: ProjectRecord = {
      ...project,
      name: name.trim(),
      projectNumber: projectNumber.trim(),
      client: client.trim(),
      location: location.trim(),
      description: description.trim(),
      projectType,
      status,
      predictedEndDate: status === 'Active' ? predictedEndDate : '',
      updatedAt: new Date().toISOString(),
    };
    saveProject(updated);
    setProject(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Project Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Edit details for this project.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Identity */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Identity</div>
          <div>
            <label className={labelCls}>Project name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Project number</label>
              <input value={projectNumber} onChange={e => setProjectNumber(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Client</label>
              <input value={client} onChange={e => setClient(e.target.value)} className={inputCls} placeholder="Client name" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="City, State" />
          </div>
          <div>
            <label className={labelCls}>Description / Notes</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${inputCls} min-h-20 resize-none`} placeholder="Optional project notes..." />
          </div>
        </div>

        {/* Classification */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Classification</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Project type</label>
              <select value={projectType} onChange={e => setProjectType(e.target.value as ProjectType)} className={inputCls}>
                <option>New Construction</option>
                <option>Renovation</option>
                <option>Inspection</option>
                <option>Mixed</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} className={inputCls}>
                <option>Active</option>
                <option>On Hold</option>
                <option>Closed</option>
                <option>Archived</option>
              </select>
            </div>
          </div>
          {status === 'Active' && (
            <div>
              <label className={labelCls}>Predicted end date</label>
              <input type="date" value={predictedEndDate} onChange={e => setPredictedEndDate(e.target.value)} className={inputCls} />
            </div>
          )}
        </div>

        {/* Meta — read-only */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Info</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-500 mb-0.5">Created</div>
              <div className="text-slate-300 font-mono">{new Date(project.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Last modified</div>
              <div className="text-slate-300 font-mono">{new Date(project.updatedAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-slate-500 mb-0.5">Project ID</div>
              <div className="text-slate-600 font-mono truncate">{project.id}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
          >
            <Save size={14} /> Save changes
          </button>
          {saved && <span className="text-sm text-green-400">Saved!</span>}
        </div>
      </form>
    </div>
  );
};
