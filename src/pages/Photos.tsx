import React, { useState, useMemo, useRef } from 'react';
import { Camera, Plus, X, Trash2, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  id: string;
  projectId: string;
  dataUrl: string;
  name: string;
  caption: string;
  takenAt: string;
  createdAt: string;
}

const STORAGE_KEY = 'struccalc.photos.v1';
const getActiveProjectId = () => window.localStorage.getItem('struccalc.activeProject.v3') || '';

const readPhotos = (): Photo[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const savePhotos = (photos: Photo[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
};

const makeId = () => `photo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const Photos: React.FC = () => {
  const projectId = getActiveProjectId();
  const [allPhotos, setAllPhotos] = useState<Photo[]>(readPhotos);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectPhotos = useMemo(
    () => allPhotos.filter(p => p.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allPhotos, projectId]
  );

  const store = (next: Photo[]) => { setAllPhotos(next); savePhotos(next); };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toAdd: Photo[] = [];
    let remaining = files.length;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) { remaining--; return; }
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        toAdd.push({
          id: makeId(),
          projectId,
          dataUrl,
          name: file.name,
          caption: '',
          takenAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        });
        remaining--;
        if (remaining === 0) {
          store([...toAdd, ...allPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const deletePhoto = (id: string) => {
    if (lightboxIdx !== null) setLightboxIdx(null);
    store(allPhotos.filter(p => p.id !== id));
  };

  const saveCaption = (id: string) => {
    store(allPhotos.map(p => p.id !== id ? p : { ...p, caption: editCaption.trim() }));
    setEditingId(null);
  };

  const openEdit = (photo: Photo) => {
    setEditingId(photo.id);
    setEditCaption(photo.caption);
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Camera size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to view photos.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Photos</h1>
          <p className="mt-1 text-sm text-slate-500">Capture and organize site photos for this project.</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone when empty */}
      {projectPhotos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl text-center cursor-pointer hover:border-blue-500/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <Camera size={28} className="text-slate-600 mb-3" />
          <div className="text-slate-400 font-medium">Drop photos here or click to upload</div>
          <div className="text-slate-600 text-sm mt-1">Supports JPEG, PNG, HEIC, and other image formats</div>
        </div>
      ) : (
        <>
          {/* Drop zone bar */}
          <div
            className="flex items-center justify-center gap-2 py-3 bg-slate-800/50 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-blue-500/40 transition-colors text-slate-600 hover:text-slate-400 text-sm"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <Plus size={14} /> Drop more photos here or click to add
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {projectPhotos.map((photo, idx) => (
              <div key={photo.id} className="group relative bg-slate-800 border border-slate-700 rounded-xl overflow-hidden aspect-square">
                <img
                  src={photo.dataUrl}
                  alt={photo.caption || photo.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setLightboxIdx(idx)}
                />
                {/* Caption overlay */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5 text-xs text-white truncate">
                    {photo.caption}
                  </div>
                )}
                {/* Action buttons on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(photo)}
                    className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    title="Edit caption"
                  >
                    <Tag size={12} />
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-red-400 hover:bg-red-900/60 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Caption edit modal */}
      {editingId && (() => {
        const photo = allPhotos.find(p => p.id === editingId);
        if (!photo) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-sm font-semibold text-slate-200">Edit caption</span>
                <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-white"><X size={15} /></button>
              </div>
              <div className="p-4">
                <img src={photo.dataUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                <input
                  autoFocus
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveCaption(editingId); if (e.key === 'Escape') setEditingId(null); }}
                  placeholder="Add a caption..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700">
                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={() => saveCaption(editingId)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors">Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox */}
      {lightboxIdx !== null && projectPhotos[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={18} />
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIdx < projectPhotos.length - 1 && (
            <button
              className="absolute right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div className="max-w-4xl max-h-[85vh] px-16" onClick={e => e.stopPropagation()}>
            <img
              src={projectPhotos[lightboxIdx].dataUrl}
              alt={projectPhotos[lightboxIdx].caption || projectPhotos[lightboxIdx].name}
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
            {projectPhotos[lightboxIdx].caption && (
              <div className="text-center text-sm text-slate-300 mt-3">{projectPhotos[lightboxIdx].caption}</div>
            )}
            <div className="text-center text-xs text-slate-600 mt-1">{lightboxIdx + 1} / {projectPhotos.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};
