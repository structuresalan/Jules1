import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, MessageSquare, Send, XCircle } from 'lucide-react';
import type { ClientComment, ClientReview, CommentStatus } from '../lib/clientReviewService';
import { addComment, getReviewByToken, subscribeComments } from '../lib/clientReviewService';

const statusConfig: Record<CommentStatus, { label: string; color: string }> = {
  pending:   { label: 'Pending Review', color: 'text-amber-400 bg-amber-900/30 border-amber-700/50' },
  addressed: { label: 'Addressed',      color: 'text-blue-400 bg-blue-900/30 border-blue-700/50' },
  approved:  { label: 'Approved',       color: 'text-green-400 bg-green-900/30 border-green-700/50' },
  denied:    { label: 'Denied',         color: 'text-red-400 bg-red-900/30 border-red-700/50' },
};

const StatusBadge = ({ status }: { status: CommentStatus }) => {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${cfg.color}`}>
      {status === 'pending' && <Clock size={9} />}
      {status === 'approved' && <CheckCircle size={9} />}
      {status === 'denied' && <XCircle size={9} />}
      {cfg.label}
    </span>
  );
};

const fmt = (iso: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
  } catch { return iso; }
};

export const ClientReviewPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [review, setReview] = useState<ClientReview | null | 'loading'>('loading');
  const [comments, setComments] = useState<ClientComment[]>([]);

  // Client identity (stored locally per session)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [identitySet, setIdentitySet] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!reviewId || !token) { setReview(null); return; }
    getReviewByToken(reviewId, token).then(r => setReview(r));
  }, [reviewId, token]);

  useEffect(() => {
    if (!reviewId || !review || review === 'loading') return;
    return subscribeComments(reviewId, setComments);
  }, [reviewId, review]);

  // Pre-fill identity from review's clientEmail/clientName if available
  useEffect(() => {
    if (review && review !== 'loading') {
      if (review.clientEmail) setClientEmail(review.clientEmail);
      if (review.clientName) { setClientName(review.clientName); }
    }
  }, [review]);

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientName.trim() && clientEmail.trim()) setIdentitySet(true);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !reviewId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await addComment(reviewId, commentText, clientName, clientEmail);
      setCommentText('');
    } catch {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (review === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading review…</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-slate-100 text-lg font-semibold mb-2">Review not found</div>
          <div className="text-slate-400 text-sm">This link may be expired or invalid.</div>
        </div>
      </div>
    );
  }

  if (!identitySet) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Client Review Portal</div>
            <div className="text-xl font-bold text-slate-100">{review.projectName}</div>
            {review.firmName && <div className="text-sm text-slate-400 mt-1">from {review.firmName}</div>}
          </div>
          <form onSubmit={handleIdentitySubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Your Name</label>
              <input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Your Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="jane@company.com"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-colors"
            >
              View Project & Leave Feedback
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = comments.filter(c => c.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Client Review Portal</div>
            <div className="text-sm font-semibold text-slate-100">{review.projectName}
              {review.projectNumber && <span className="text-slate-400 font-normal ml-2">#{review.projectNumber}</span>}
            </div>
          </div>
          {review.firmName && (
            <div className="text-[11px] text-slate-500">{review.firmName}</div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Project card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-base font-semibold text-slate-100">{review.projectName}</div>
              {review.projectNumber && <div className="text-xs text-slate-400 mt-0.5">Project #{review.projectNumber}</div>}
            </div>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                {pendingCount} pending
              </span>
            )}
          </div>
          {review.projectDescription && (
            <p className="text-sm text-slate-400 leading-relaxed">{review.projectDescription}</p>
          )}
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-[11px] text-slate-500">
            <span>Shared by {review.sharedByEmail}</span>
            <span>·</span>
            <span>{fmt(review.createdAt)}</span>
          </div>
        </div>

        {/* Comment form */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Leave a Comment</span>
          </div>
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Describe your feedback, questions, or change requests…"
              rows={4}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500 resize-none"
            />
            {submitError && <div className="text-xs text-red-400">{submitError}</div>}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Commenting as <strong className="text-slate-300">{clientName}</strong></span>
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition-colors"
              >
                <Send size={12} />
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Comments list */}
        {comments.length > 0 && (
          <div className="space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </div>
            {comments.map(c => (
              <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">{c.authorName}</span>
                    <span className="text-[11px] text-slate-500 ml-2">{fmt(c.createdAt)}</span>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{c.text}</p>
                {c.engineerResponse && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1.5">Engineer Response</div>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.engineerResponse}</p>
                    {c.respondedAt && <div className="text-[11px] text-slate-500 mt-1">{fmt(c.respondedAt)}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
