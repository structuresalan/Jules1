import React from 'react';
import { Network, FileText, ArrowRight, Clock, Frame } from 'lucide-react';
import { Link } from 'react-router-dom';

const getLastSheet = (): string | null => {
  try {
    const raw = window.localStorage.getItem('struccalc.lastSheet.v1');
    return raw || null;
  } catch {
    return null;
  }
};

const getProjectName = (): string => {
  try {
    const rawProjects = window.localStorage.getItem('struccalc.projects.v3');
    const activeId = window.localStorage.getItem('struccalc.activeProject.v3');
    if (!rawProjects || !activeId) return 'this project';
    const projects = JSON.parse(rawProjects) as Array<{ id: string; name: string }>;
    return projects.find(p => p.id === activeId)?.name || 'this project';
  } catch {
    return 'this project';
  }
};

export const Dashboard: React.FC = () => {
  const lastSheet = getLastSheet();
  const projectName = getProjectName();

  const quickLinks = [
    { to: '/visual-workspace', icon: <Network size={18} />, label: 'Open Workspace', description: 'Annotate drawings, measure, and place callouts.' },
    { to: '/documents', icon: <FileText size={18} />, label: 'Reports', description: 'View and export calculation reports.' },
    { to: '/steel', icon: <Frame size={18} />, label: 'Run a Calculation', description: 'Steel, concrete, loads, and more.' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">{projectName}</h1>
        <p className="mt-1.5 text-slate-400 text-sm">
          Manage drawings, run calculations, and document site observations — all in one place.
        </p>
      </div>

      {/* Continue last sheet CTA */}
      {lastSheet ? (
        <Link
          to="/visual-workspace"
          className="flex items-center justify-between gap-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl hover:bg-blue-600/20 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-0.5">Continue where you left off</div>
              <div className="text-sm text-slate-200 font-medium truncate max-w-xs">{lastSheet}</div>
            </div>
          </div>
          <ArrowRight size={18} className="text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <Link
          to="/visual-workspace"
          className="flex items-center justify-between gap-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl hover:bg-blue-600/20 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 shrink-0">
              <Network size={18} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-0.5">Get started</div>
              <div className="text-sm text-slate-200 font-medium">Open the Workspace to begin</div>
            </div>
          </div>
          <ArrowRight size={18} className="text-blue-400 shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Quick links */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Quick access</div>
        {quickLinks.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-slate-600 transition-colors group"
          >
            <span className="text-slate-400 group-hover:text-white transition-colors">{item.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{item.label}</div>
              <div className="text-xs text-slate-500 truncate">{item.description}</div>
            </div>
            <ArrowRight size={14} className="ml-auto text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
};
