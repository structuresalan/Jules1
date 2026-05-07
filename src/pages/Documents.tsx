import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, FileText, Pencil, Search, Trash2 } from 'lucide-react';
import {
  deleteProjectDocument,
  duplicateProjectDocument,
  printProjectDocumentPdf,
  requestOpenProjectDocument,
  formatDocumentDate,
  getActiveProject,
  getProjectDocuments,
  renameProjectDocument,
  type ProjectDocument,
} from '../utils/projectDocuments';

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = getActiveProject();
  const [documents, setDocuments] = useState<ProjectDocument[]>(() =>
    activeProject ? getProjectDocuments(activeProject.id) : [],
  );
  const [searchText, setSearchText] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const refreshDocuments = () => {
    if (!activeProject) {
      setDocuments([]);
      return;
    }

    setDocuments(getProjectDocuments(activeProject.id));
  };

  const filteredDocuments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((document) => {
      const searchableText = [
        document.name,
        document.type,
        document.module,
        document.status,
        document.sourcePath,
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <h1 className="text-2xl font-bold">No active project selected</h1>
        <p className="mt-2 text-sm">
          Open or create a project from the Projects page before saving project documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
            <FileText className="text-blue-600" />
            Project Documents
          </h1>
          <p className="mt-2 text-gray-500">
            Saved calculation outputs for <span className="font-semibold text-gray-800">{activeProject.name}</span>.
          </p>
        </div>

        <label className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Search documents..."
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b border-gray-200 px-4 py-3">Name</th>
                <th className="border-b border-gray-200 px-4 py-3">Type</th>
                <th className="border-b border-gray-200 px-4 py-3">Module</th>
                <th className="border-b border-gray-200 px-4 py-3">Status</th>
                <th className="border-b border-gray-200 px-4 py-3">Created</th>
                <th className="border-b border-gray-200 px-4 py-3">Modified</th>
                <th className="border-b border-gray-200 px-4 py-3">Source</th>
                <th className="border-b border-gray-200 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No saved documents yet. Go to a calculation page and click Save Output.
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((document) => (
                  <tr key={document.id} className="hover:bg-blue-50/50">
                    <td className="border-b border-gray-100 px-4 py-3">
                      {renamingId === document.id ? (
                        <div className="flex gap-2">
                          <input
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                          <button onClick={saveRename} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white">Save</button>
                        </div>
                      ) : (
                        <div className="font-semibold text-gray-900">{document.name}</div>
                      )}
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{document.type}</td>
                    <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{document.module}</td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">{document.status}</span>
                    </td>
                    <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-600">{formatDocumentDate(document.createdAt)}</td>
                    <td className="border-b border-gray-100 px-4 py-3 text-xs text-gray-600">{formatDocumentDate(document.updatedAt)}</td>
                    <td className="border-b border-gray-100 px-4 py-3 font-mono text-xs text-gray-500">{document.sourcePath}</td>
                    <td className="border-b border-gray-100 px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpen(document)} className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100" title="Open editable calculation">Open/Edit</button>
                        <button onClick={() => printProjectDocumentPdf(document)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50" title="Print / Save PDF"><Download size={15} /></button>
                        <button onClick={() => startRename(document)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50" title="Rename"><Pencil size={15} /></button>
                        <button onClick={() => handleDuplicate(document.id)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50" title="Duplicate"><Copy size={15} /></button>
                        <button onClick={() => handleDelete(document.id)} className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
          {filteredDocuments.length} document{filteredDocuments.length === 1 ? '' : 's'} shown
        </div>
      </div>
    </div>
  );
};
