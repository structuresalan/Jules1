export type ProjectDocumentModule = 'Steel' | 'Concrete' | 'Loads' | 'Variables' | 'General';
export type ProjectDocumentStatus = 'Active' | 'Draft' | 'Archived';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: string;
  module: ProjectDocumentModule;
  status: ProjectDocumentStatus;
  createdAt: string;
  updatedAt: string;
  sourcePath: string;
  inputs: Record<string, unknown>;
  summary: Record<string, string | number | boolean>;
  reportHtml: string;
}

export interface SavedProjectSummary {
  id: string;
  name: string;
  projectNumber?: string;
}

const PROJECTS_STORAGE_KEY = 'struccalc.projects.v3';
const ACTIVE_PROJECT_KEY = 'struccalc.activeProject.v3';
const SESSION_MODE_KEY = 'struccalc.sessionMode.v3';
const DOCUMENTS_STORAGE_KEY = 'struccalc.projectDocuments.v1';
const OPEN_DOCUMENT_STORAGE_KEY = 'struccalc.openDocument.v1';

const makeDocumentId = () => `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getSavedProjects = (): SavedProjectSummary[] => {
  if (typeof window === 'undefined') return [];
  const projects = safeParse<Array<{ id: string; name: string; projectNumber?: string }>>(
    window.localStorage.getItem(PROJECTS_STORAGE_KEY),
    [],
  );

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    projectNumber: project.projectNumber,
  }));
};

export const getActiveProjectId = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY) ?? '';
};

export const getSessionMode = () => {
  if (typeof window === 'undefined') return 'project';
  return window.localStorage.getItem(SESSION_MODE_KEY) ?? 'project';
};

export const getActiveProject = () => {
  const activeProjectId = getActiveProjectId();
  if (!activeProjectId) return null;

  return getSavedProjects().find((project) => project.id === activeProjectId) ?? null;
};

export const getAllProjectDocuments = (): ProjectDocument[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<ProjectDocument[]>(window.localStorage.getItem(DOCUMENTS_STORAGE_KEY), []);
};

export const writeAllProjectDocuments = (documents: ProjectDocument[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documents));
};

export const getProjectDocuments = (projectId: string) => {
  return getAllProjectDocuments()
    .filter((document) => document.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getDocumentById = (documentId: string) => {
  return getAllProjectDocuments().find((document) => document.id === documentId) ?? null;
};

export const saveNewProjectDocument = (
  document: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt'>,
) => {
  const now = new Date().toISOString();
  const newDocument: ProjectDocument = {
    ...document,
    id: makeDocumentId(),
    createdAt: now,
    updatedAt: now,
  };

  writeAllProjectDocuments([newDocument, ...getAllProjectDocuments()]);
  return newDocument;
};

export const overwriteProjectDocument = (
  documentId: string,
  patch: Omit<ProjectDocument, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>,
) => {
  const documents = getAllProjectDocuments();
  const existingDocument = documents.find((document) => document.id === documentId);

  if (!existingDocument) return null;

  const updatedDocument: ProjectDocument = {
    ...existingDocument,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  writeAllProjectDocuments(documents.map((document) => (document.id === documentId ? updatedDocument : document)));
  return updatedDocument;
};

export const renameProjectDocument = (documentId: string, name: string) => {
  const documents = getAllProjectDocuments();
  writeAllProjectDocuments(
    documents.map((document) =>
      document.id === documentId ? { ...document, name, updatedAt: new Date().toISOString() } : document,
    ),
  );
};

export const deleteProjectDocument = (documentId: string) => {
  writeAllProjectDocuments(getAllProjectDocuments().filter((document) => document.id !== documentId));
};

export const duplicateProjectDocument = (documentId: string) => {
  const document = getDocumentById(documentId);
  if (!document) return null;

  return saveNewProjectDocument({
    ...document,
    name: `${document.name} Copy`,
  });
};

export const formatDocumentDate = (isoDate: string) => {
  if (!isoDate) return '-';

  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

export const exportDocumentHtml = (document: ProjectDocument) => {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${document.name}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111827; }
    .document-meta { margin-bottom: 18px; padding: 12px; border: 1px solid #d1d5db; background: #f9fafb; }
    .document-meta h1 { margin: 0 0 8px; font-size: 22px; }
  </style>
</head>
<body>
  <div class="document-meta">
    <h1>${document.name}</h1>
    <div>Type: ${document.type}</div>
    <div>Module: ${document.module}</div>
    <div>Saved: ${formatDocumentDate(document.updatedAt)}</div>
  </div>
  ${document.reportHtml}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = `${document.name.replace(/[^a-z0-9-_]+/gi, '_')}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
};


export const requestOpenProjectDocument = (documentId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(OPEN_DOCUMENT_STORAGE_KEY, documentId);
};

export const consumeOpenProjectDocumentRequest = () => {
  if (typeof window === 'undefined') return null;

  const documentId = window.localStorage.getItem(OPEN_DOCUMENT_STORAGE_KEY);
  if (!documentId) return null;

  window.localStorage.removeItem(OPEN_DOCUMENT_STORAGE_KEY);
  return getDocumentById(documentId);
};
