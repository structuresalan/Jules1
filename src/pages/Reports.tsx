import React, { useMemo } from 'react';
import { FileText, Printer, Download } from 'lucide-react';

interface ProjectRecord {
  id: string;
  name: string;
  projectNumber: string;
  client: string;
  location: string;
  description: string;
  status: string;
  projectType: string;
  createdAt: string;
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
}

interface SiteVisit {
  id: string;
  projectId: string;
  title: string;
  date: string;
  time?: string;
  status: string;
  notes: string;
  checklist: { id: string; text: string; done: boolean }[];
}

const read = <T,>(key: string): T[] => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const severityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

export const Reports: React.FC = () => {
  const activeId = window.localStorage.getItem('struccalc.activeProject.v3') || '';

  const project = useMemo((): ProjectRecord | null => {
    const projects = read<ProjectRecord>('struccalc.projects.v3');
    return projects.find(p => p.id === activeId) || null;
  }, [activeId]);

  const observations = useMemo(() =>
    read<Observation>('struccalc.observations.v1')
      .filter(o => o.projectId === activeId)
      .sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)),
    [activeId]
  );

  const visits = useMemo(() =>
    read<SiteVisit>('struccalc.sitevisits.v1')
      .filter(v => v.projectId === activeId)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [activeId]
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={28} className="text-slate-700 mb-3" />
        <div className="text-slate-500">Open a project to generate a report.</div>
      </div>
    );
  }

  const openObs = observations.filter(o => o.status !== 'Closed');
  const closedObs = observations.filter(o => o.status === 'Closed');
  const generatedAt = new Date().toLocaleString();

  const printReport = () => {
    const html = buildReportHtml(project, observations, visits, generatedAt);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  const downloadReport = () => {
    const html = buildReportHtml(project, observations, visits, generatedAt);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Generate a printable summary of this project.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadReport} className="flex items-center gap-1.5 px-3 py-2 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors">
            <Download size={14} /> Download
          </button>
          <button onClick={printReport} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Printer size={14} /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Preview card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 bg-slate-900/40 flex items-center gap-2">
          <FileText size={13} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-200">Report preview</span>
          <span className="text-xs text-slate-500 ml-auto">Generated {generatedAt}</span>
        </div>

        <div className="p-5 space-y-6 font-sans text-slate-200">
          {/* Project info */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Project</div>
            <div className="text-xl font-bold">{project.name}</div>
            <div className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-400">
              {project.projectNumber && <div><span className="text-slate-600">No.</span> {project.projectNumber}</div>}
              {project.client && <div><span className="text-slate-600">Client:</span> {project.client}</div>}
              {project.location && <div><span className="text-slate-600">Location:</span> {project.location}</div>}
              <div><span className="text-slate-600">Type:</span> {project.projectType}</div>
              <div><span className="text-slate-600">Status:</span> {project.status}</div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total obs.', value: observations.length },
              { label: 'Open', value: openObs.length },
              { label: 'High severity', value: observations.filter(o => o.severity === 'High' && o.status !== 'Closed').length },
              { label: 'Site visits', value: visits.length },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-100">{s.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Open observations */}
          {openObs.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Open Observations ({openObs.length})</div>
              <div className="space-y-2">
                {openObs.map(obs => (
                  <div key={obs.id} className="flex items-start gap-3 bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${
                      obs.severity === 'High' ? 'bg-red-900/40 text-red-400 border-red-800/50'
                      : obs.severity === 'Medium' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>{obs.severity}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200">{obs.title}</div>
                      {obs.location && <div className="text-xs text-slate-500 font-mono">{obs.location}</div>}
                      {obs.notes && <div className="text-xs text-slate-400 mt-1">{obs.notes}</div>}
                    </div>
                    <span className="text-[10px] font-mono text-slate-600 shrink-0">{obs.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Site visits */}
          {visits.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">Site Visits ({visits.length})</div>
              <div className="space-y-2">
                {visits.map(v => {
                  const done = v.checklist.filter(c => c.done).length;
                  return (
                    <div key={v.id} className="flex items-start gap-3 bg-slate-900/40 border border-slate-700 rounded-lg px-3 py-2.5">
                      <div className="text-xs font-mono text-slate-500 shrink-0 min-w-[80px]">{v.date}{v.time ? ` ${v.time}` : ''}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200">{v.title}</div>
                        {v.notes && <div className="text-xs text-slate-400 mt-0.5">{v.notes}</div>}
                        {v.checklist.length > 0 && (
                          <div className="text-xs text-slate-500 mt-0.5 font-mono">{done}/{v.checklist.length} checklist</div>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                        v.status === 'Completed' ? 'bg-green-900/40 text-green-400 border-green-800/50'
                        : v.status === 'In Progress' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50'
                        : 'bg-blue-900/40 text-blue-400 border-blue-800/50'
                      }`}>{v.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {closedObs.length > 0 && (
            <div className="text-xs text-slate-600 font-mono">{closedObs.length} closed observation{closedObs.length > 1 ? 's' : ''} not shown.</div>
          )}
        </div>
      </div>
    </div>
  );
};

function buildReportHtml(
  project: ProjectRecord,
  observations: Observation[],
  visits: SiteVisit[],
  generatedAt: string,
): string {
  const openObs = observations.filter(o => o.status !== 'Closed');
  const sevColor = (s: string) => s === 'High' ? '#ef4444' : s === 'Medium' ? '#f59e0b' : '#64748b';
  const visitStatusColor = (s: string) => s === 'Completed' ? '#10b981' : s === 'In Progress' ? '#f59e0b' : '#5b8def';

  const obsRows = openObs.map(o => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
        <span style="background:${sevColor(o.severity)}22;color:${sevColor(o.severity)};border:1px solid ${sevColor(o.severity)}44;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;">${o.severity}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${o.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-family:monospace;">${o.location || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${o.status}</td>
    </tr>
  `).join('');

  const visitRows = visits.map(v => {
    const done = v.checklist.filter(c => c.done).length;
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;color:#64748b;">${v.date}${v.time ? ' ' + v.time : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:500;">${v.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;">${v.notes || '—'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
          <span style="background:${visitStatusColor(v.status)}22;color:${visitStatusColor(v.status)};padding:2px 8px;border-radius:4px;font-size:11px;">${v.status}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-family:monospace;">${v.checklist.length > 0 ? `${done}/${v.checklist.length}` : '—'}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${project.name} — Site Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: white; padding: 40px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 32px 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { padding: 8px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
  .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat .num { font-size: 28px; font-weight: 700; }
  .stat .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-top: 2px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; font-size: 13px; color: #475569; margin-top: 8px; }
  .footer { margin-top: 48px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px;">
  <div>
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;font-family:monospace;margin-bottom:4px;">SimplifyStruct — Site Report</div>
    <h1>${project.name}</h1>
  </div>
  <div style="font-size:11px;color:#94a3b8;font-family:monospace;">${generatedAt}</div>
</div>

<div class="meta">
  ${project.projectNumber ? `<div><strong>No.</strong> ${project.projectNumber}</div>` : ''}
  ${project.client ? `<div><strong>Client:</strong> ${project.client}</div>` : ''}
  ${project.location ? `<div><strong>Location:</strong> ${project.location}</div>` : ''}
  <div><strong>Type:</strong> ${project.projectType}</div>
  <div><strong>Status:</strong> ${project.status}</div>
</div>

<div class="stats">
  <div class="stat"><div class="num">${observations.length}</div><div class="lbl">Total obs.</div></div>
  <div class="stat"><div class="num">${openObs.length}</div><div class="lbl">Open</div></div>
  <div class="stat"><div class="num" style="color:#ef4444">${observations.filter(o => o.severity === 'High' && o.status !== 'Closed').length}</div><div class="lbl">High severity</div></div>
  <div class="stat"><div class="num">${visits.length}</div><div class="lbl">Site visits</div></div>
</div>

${openObs.length > 0 ? `
<h2>Open Observations (${openObs.length})</h2>
<table>
  <thead><tr><th>Severity</th><th>Title</th><th>Location</th><th>Status</th></tr></thead>
  <tbody>${obsRows}</tbody>
</table>` : ''}

${visits.length > 0 ? `
<h2>Site Visits (${visits.length})</h2>
<table>
  <thead><tr><th>Date</th><th>Title</th><th>Notes</th><th>Status</th><th>Checklist</th></tr></thead>
  <tbody>${visitRows}</tbody>
</table>` : ''}

<div class="footer">Generated by SimplifyStruct &mdash; ${generatedAt}</div>
</body>
</html>`;
}
