import React, { useEffect, useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight, Copy, Link, MessageSquare, Save, SlidersHorizontal, Users, X, XCircle } from 'lucide-react';
import { dbWrite, COLLECTIONS } from '../lib/db';
import { useAuth } from '../hooks/useAuth';
import { subscribeProfile, type UserProfile } from '../lib/userProfile';
import {
  createClientReview, subscribeProjectReviews, subscribeComments,
  respondToComment, closeReview,
  type ClientReview, type ClientComment, type CommentStatus, type ReviewAttachment,
} from '../lib/clientReviewService';
import { useCollection } from '../lib/useCollection';

interface PhotoRecord {
  id: string;
  projectId: string;
  dataUrl: string;
  name: string;
  caption: string;
  takenAt: string;
  createdAt: string;
}

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
  ownerUid?: string;
  ownerEmail?: string;
  companyId?: string;
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
  void dbWrite(COLLECTIONS.projects.col, COLLECTIONS.projects.ls, updated);
};

const inputCls = 'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5';

const statusConfig: Record<CommentStatus, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-400 bg-amber-900/30 border-amber-700/40' },
  addressed: { label: 'Addressed', color: 'text-blue-400 bg-blue-900/30 border-blue-700/40' },
  approved:  { label: 'Approved',  color: 'text-green-400 bg-green-900/30 border-green-700/40' },
  denied:    { label: 'Denied',    color: 'text-red-400 bg-red-900/30 border-red-700/40' },
};

const fmt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  } catch { return iso; }
};

// ── Review comment row ───────────────────────────────────────────────────────

const CommentRow: React.FC<{ comment: ClientComment; reviewId: string }> = ({ comment, reviewId }) => {
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);

  const cfg = statusConfig[comment.status];

  const act = async (status: CommentStatus, response?: string) => {
    setSaving(true);
    try { await respondToComment(reviewId, comment.id, status, response); } catch { /* ok */ }
    setSaving(false);
    setResponding(false);
    setResponseText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-semibold text-slate-200">{comment.authorName}</span>
          <span className="text-[11px] text-slate-500 ml-2">{comment.authorEmail}</span>
          <span className="text-[11px] text-slate-600 ml-2">{fmt(comment.createdAt)}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-3">{comment.text}</p>

      {comment.engineerResponse && (
        <div className="mb-3 pl-3 border-l-2 border-blue-600/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Your Response</div>
          <p className="text-sm text-slate-400">{comment.engineerResponse}</p>
        </div>
      )}

      {comment.status === 'pending' && !responding && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => act('approved')}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-green-900/40 border border-green-700/50 text-green-400 hover:bg-green-800/40 disabled:opacity-50 transition-colors"
          >
            <CheckCircle size={10} /> Approve
          </button>
          <button
            onClick={() => act('denied')}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-red-900/40 border border-red-700/50 text-red-400 hover:bg-red-800/40 disabled:opacity-50 transition-colors"
          >
            <XCircle size={10} /> Deny
          </button>
          <button
            onClick={() => setResponding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-700 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
          >
            <MessageSquare size={10} /> Address
          </button>
        </div>
      )}

      {responding && (
        <div className="mt-2 space-y-2">
          <textarea
            value={responseText}
            onChange={e => setResponseText(e.target.value)}
            placeholder="Write your response to the client…"
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => act('addressed', responseText)}
              disabled={saving || !responseText.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-semibold rounded transition-colors"
            >
              {saving ? 'Saving…' : 'Send Response'}
            </button>
            <button
              onClick={() => { setResponding(false); setResponseText(''); }}
              className="px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Review card (expandable) ─────────────────────────────────────────────────

const ReviewCard: React.FC<{ review: ClientReview; projectId: string }> = ({ review, projectId: _projectId }) => {
  const [open, setOpen] = useState(true);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => subscribeComments(review.id, setComments), [review.id]);

  const reviewUrl = `${window.location.origin}/review/${review.id}?token=${review.token}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(reviewUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ok */ }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this review? The client link will stop working.')) return;
    setClosing(true);
    await closeReview(review.id);
    setClosing(false);
  };

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3 min-w-0">
          {open ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100 truncate">{review.clientName || review.clientEmail}</div>
            {review.clientName && <div className="text-[11px] text-slate-500 truncate">{review.clientEmail}</div>}
          </div>
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-900/30 border border-amber-700/40 px-2 py-0.5 rounded shrink-0">
              {pendingCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
          >
            <Copy size={10} /> {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleClose}
            disabled={closing}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded border border-red-800/50 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <X size={10} /> Close
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-700 p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">
              No comments yet. Share the link with your client.
            </div>
          ) : (
            comments.map(c => <CommentRow key={c.id} comment={c} reviewId={review.id} />)
          )}
        </div>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export const ProjectSettings: React.FC = () => {
  const { user } = useAuth();
  const [project, setProject] = React.useState<ProjectRecord | null>(readProject);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<ClientReview[]>([]);

  const [name, setName] = useState(project?.name || '');
  const [projectNumber, setProjectNumber] = useState(project?.projectNumber || '');
  const [client, setClient] = useState(project?.client || '');
  const [location, setLocation] = useState(project?.location || '');
  const [description, setDescription] = useState(project?.description || '');
  const [projectType, setProjectType] = useState<ProjectType>(project?.projectType || 'New Construction');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'Active');
  const [predictedEndDate, setPredictedEndDate] = useState(project?.predictedEndDate || '');

  // Share form state
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareName, setShareName] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Project photos for the attachment picker
  const { items: allPhotos } = useCollection<PhotoRecord>(COLLECTIONS.photos.col, COLLECTIONS.photos.ls);
  const projectPhotos = project ? allPhotos.filter(p => p.projectId === project.id) : [];

  useEffect(() => {
    const p = readProject();
    setProject(p);
    if (p) {
      setName(p.name); setProjectNumber(p.projectNumber); setClient(p.client);
      setLocation(p.location); setDescription(p.description);
      setProjectType(p.projectType); setStatus(p.status);
      setPredictedEndDate(p.predictedEndDate || '');
    }
  }, []);

  useEffect(() => subscribeProfile(setProfile), []);

  useEffect(() => {
    if (!project?.id) return;
    return subscribeProjectReviews(project.id, setReviews);
  }, [project?.id]);

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
    const isTeamUser = profile?.companyId && (profile?.tier === 'pro' || profile?.tier === 'business');
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
      ownerUid: project.ownerUid || user?.uid || undefined,
      ownerEmail: project.ownerEmail || user?.email || undefined,
      companyId: isTeamUser ? profile!.companyId : project.companyId,
    };
    saveProject(updated);
    setProject(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSharing(true);
    setShareError('');
    try {
      const attachments: ReviewAttachment[] = projectPhotos
        .filter(p => selectedPhotoIds.has(p.id))
        .map(p => ({ id: p.id, url: p.dataUrl, caption: p.caption || undefined }));
      await createClientReview(
        { id: project.id, name: project.name, projectNumber: project.projectNumber, description: project.description },
        shareEmail,
        shareName,
        profile?.company,
        attachments,
      );
      setShowShareForm(false);
      setShareEmail('');
      setShareName('');
      setSelectedPhotoIds(new Set());
    } catch (err) {
      setShareError(err instanceof Error ? err.message : 'Failed to create review link.');
    } finally {
      setSharing(false);
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const canShareWithClients = profile?.tier === 'pro' || profile?.tier === 'business';

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

      {/* ── Client Review ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              <span className="text-sm font-semibold text-slate-100">Client Review</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/40 bg-blue-600/10 px-1.5 py-0.5 rounded">Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Share a link so clients can view the project and leave comments.</p>
          </div>
          {canShareWithClients && !showShareForm && (
            <button
              onClick={() => setShowShareForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors shrink-0"
            >
              <Link size={11} /> New Link
            </button>
          )}
        </div>

        {!canShareWithClients ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <div className="text-slate-400 text-sm mb-3">Upgrade to Pro or Business to share projects with clients and collect feedback.</div>
            <a href="/settings?tab=billing" className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors">
              View Plans
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {showShareForm && (
              <form onSubmit={handleShare} className="bg-slate-800 border border-blue-500/40 rounded-xl p-5 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Client Review Link</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Client Name</label>
                    <input
                      value={shareName}
                      onChange={e => setShareName(e.target.value)}
                      placeholder="Jane Smith"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Client Email</label>
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={e => setShareEmail(e.target.value)}
                      placeholder="jane@client.com"
                      required
                      className={inputCls}
                    />
                  </div>
                </div>
                {projectPhotos.length > 0 && (
                  <div>
                    <div className={labelCls}>
                      Attach Photos
                      {selectedPhotoIds.size > 0 && <span className="ml-2 text-blue-400 normal-case">· {selectedPhotoIds.size} selected</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-900/50 rounded border border-slate-700">
                      {projectPhotos.map(p => {
                        const selected = selectedPhotoIds.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePhotoSelection(p.id)}
                            className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                              selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-700 hover:border-slate-500'
                            }`}
                            title={p.caption || p.name}
                          >
                            <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                            {selected && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                <CheckCircle size={10} className="text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {shareError && <div className="text-xs text-red-400">{shareError}</div>}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sharing || !shareEmail.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {sharing ? 'Creating…' : 'Create Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowShareForm(false); setShareError(''); }}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {reviews.length === 0 && !showShareForm && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                <MessageSquare size={22} className="text-slate-600 mx-auto mb-2" />
                <div className="text-sm text-slate-500">No active client reviews. Click "New Link" to share this project.</div>
              </div>
            )}

            {reviews.map(r => (
              <ReviewCard key={r.id} review={r} projectId={project.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
