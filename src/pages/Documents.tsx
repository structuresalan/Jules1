import React, { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  ExternalLink,
  FileText,
  Map,
  Pencil,
  Printer,
  Search,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteProjectDocument,
  duplicateProjectDocument,
  formatDocumentDate,
  getActiveProject,
  getProjectDocuments,
  renameProjectDocument,
  requestOpenProjectDocument,
  type ProjectDocument,
} from '../utils/projectDocuments';

const beamPrintStyles = `
@media screen {
  .beam-print-report {
    display: none;
  }
}

@media print {
  body * {
    visibility: hidden !important;
  }

  .beam-print-report,
  .beam-print-report * {
    visibility: visible !important;
  }

  .beam-print-report {
    display: block !important;
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    background: white !important;
    color: black !important;
  }
}
`;

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = getActiveProject();

  const [documents, setDocuments] = useState<ProjectDocument[]>(() =>
    activeProject ? getProjectDocuments(activeProject.id) : [],
  );
  const [searchText, setSearchText] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [printDocument, setPrintDocument] = useState<ProjectDocument | null>(null);

  const refreshDocuments = () => {
    if (!activeProject) {
      setDocuments([]);
      return;
    }

    setDocuments(getProjectDocuments(activeProject.id));
  };

  useEffect(() => {
    refreshDocuments();
  }, [activeProject?.id]);

  useEffect(() => {
    if (!printDocument) return;

    const timeout = window.setTimeout(() => {
      window.print();
    }, 80);

    const afterPrint = () => setPrintDocument(null);
    window.addEventListener('afterprint', afterPrint);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [printDocument]);

  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) =>
      [
        document.name,
        document.type,
        document.module,
        document.status,
        document.sourcePath,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [documents, searchText]);

  const startRename = (document: ProjectDocument) => {
    setRenamingId(document.id);
    setRenameValue(document.name);
  };

  const saveRename = () => {
    if (!renamingId || !renameValue.trim()) return;

    renameProjectDocument(renamingId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
    refreshDocuments();
  };

  const handleOpen = (document: ProjectDocument) => {
    requestOpenProjectDocument(document.id);

    if (document.module === 'Steel') {
      navigate('/steel');
      return;
    }

    navigate(document.sourcePath || '/dashboard');
  };

  const handleDelete = (documentId: string) => {
    deleteProjectDocument(documentId);
    refreshDocuments();
  };

  const handleDuplicate = (documentId: string) => {
    duplicateProjectDocument(documentId);
    refreshDocuments();
  };

  if (!activeProject) {
    return (
      <div className="bg-amber-900/20 border border-amber-700 text-amber-300 rounded-xl p-6">
        <h1 className="text-xl font-bold">No active project</h1>
        <p className="mt-2 text-sm">Go back to Projects and open a project before viewing documents.</p>
        <Link to="/" className="mt-4 inline-flex rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white">
          Open Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{beamPrintStyles}</style>
      {printDocument && (
        <div className="beam-print-report" dangerouslySetInnerHTML={{ __html: printDocument.reportHtml }} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-100">
            <FileText className="text-blue-400" />
            Documents
          </h1>
          <p className="mt-2 text-slate-400">
            Saved calculation reports, print outputs, and exports for <span className="font-semibold text-slate-200">{activeProject.name}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <label className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 pl-9"
              placeholder="Search documents..."
            />
          </label>
          <Link
            to="/visual-workspace"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 py-2 text-sm font-bold"
          >
            <Map size={16} />
            Open Visual Workspace
          </Link>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl text-slate-300 p-4">
        <div className="flex items-start gap-3">
          <Map className="mt-0.5 text-blue-400" size={18} />
          <div>
            <div className="font-bold">Visual Map moved to Visual Workspace</div>
            <p className="mt-1 text-sm opacity-80">
              Plans, site photos, PDF annotation tools, measurements, markers, nodes, schedules, and cost links now live in Visual Workspace. Documents is only for saved reports and calculation outputs.
            </p>
          </div>
        </div>
      </div>

      <section className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Module</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No documents found. Save a calculation output from one of the calculation modules.
                  </td>
                </tr>
              )}

              {filteredDocuments.map((document) => (
                <tr key={document.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    {renamingId === document.id ? (
                      <div className="flex gap-2">
                        <input
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={saveRename} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold text-slate-200">{document.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{document.type}</td>
                  <td className="px-4 py-3 text-slate-300">{document.module}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-900/30 text-green-400 rounded-full px-2 py-0.5 text-xs font-semibold">{document.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDocumentDate(document.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => handleOpen(document)} className="inline-flex items-center gap-1 rounded bg-blue-600/20 text-blue-400 border border-blue-700 px-2 py-1 text-xs font-semibold hover:bg-blue-600/30">
                        <ExternalLink size={13} />
                        Open
                      </button>
                      <button onClick={() => setPrintDocument(document)} className="inline-flex items-center gap-1 rounded bg-slate-700 text-slate-300 border border-slate-600 px-2 py-1 text-xs font-semibold hover:bg-slate-600">
                        <Printer size={13} />
                        Print
                      </button>
                      <button onClick={() => startRename(document)} className="inline-flex items-center gap-1 rounded bg-slate-700 text-slate-300 border border-slate-600 px-2 py-1 text-xs font-semibold hover:bg-slate-600">
                        <Pencil size={13} />
                        Rename
                      </button>
                      <button onClick={() => handleDuplicate(document.id)} className="inline-flex items-center gap-1 rounded bg-slate-700 text-slate-300 border border-slate-600 px-2 py-1 text-xs font-semibold hover:bg-slate-600">
                        <Copy size={13} />
                        Duplicate
                      </button>
                      <button onClick={() => handleDelete(document.id)} className="inline-flex items-center gap-1 rounded bg-red-900/20 text-red-400 border border-red-800 px-2 py-1 text-xs font-semibold hover:bg-red-900/30">
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
