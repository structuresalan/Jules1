import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  LayoutList,
  Map,
  Maximize2,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

type DocumentsView = 'list' | 'visual';
type VisualBoardKind = 'Plan' | 'Elevation' | 'Site Photo' | 'Other';

interface VisualBoard {
  id: string;
  projectId: string;
  name: string;
  kind: VisualBoardKind;
  imageName: string;
  imageDataUrl: string;
  createdAt: string;
  updatedAt: string;
}

const VISUAL_BOARDS_STORAGE_KEY = 'struccalc.visualBoards.v1';

const makeVisualBoardId = () => `visual_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getAllVisualBoards = (): VisualBoard[] => {
  if (typeof window === 'undefined') return [];
  return safeParse<VisualBoard[]>(window.localStorage.getItem(VISUAL_BOARDS_STORAGE_KEY), []);
};

const writeAllVisualBoards = (boards: VisualBoard[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VISUAL_BOARDS_STORAGE_KEY, JSON.stringify(boards));
};

const getProjectVisualBoards = (projectId: string) => {
  return getAllVisualBoards()
    .filter((board) => board.projectId === projectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const deleteVisualBoard = (boardId: string) => {
  writeAllVisualBoards(getAllVisualBoards().filter((board) => board.id !== boardId));
};

const getDefaultBoardName = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/u, '');
  return withoutExtension.trim() || 'Untitled Visual Board';
};

const getBoardDocumentCount = () => 0;

const getBeamDetails = (document: ProjectDocument) => {
  const inputs = document.inputs as {
    section?: string;
    nodes?: Array<{ x: number; support?: string }>;
    loads?: Array<{ kind?: string; x?: number; x1?: number; x2?: number; p?: number; w?: number }>;
    method?: string;
    fy?: number;
  };

  const nodes = Array.isArray(inputs.nodes) ? [...inputs.nodes].sort((a, b) => Number(a.x) - Number(b.x)) : [];
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  const length = firstNode && lastNode ? Math.max(Number(lastNode.x) - Number(firstNode.x), 0) : 0;
  const supports = nodes.filter((node) => node.support && node.support !== 'None').length;
  const loadCount = Array.isArray(inputs.loads) ? inputs.loads.length : 0;

  return {
    section: inputs.section || 'Steel beam',
    length,
    supports,
    loadCount,
    method: inputs.method || '-',
    fy: typeof inputs.fy === 'number' ? inputs.fy : null,
    nodes,
    loads: Array.isArray(inputs.loads) ? inputs.loads : [],
  };
};

const buildPreviewSummary = (document: ProjectDocument) => {
  if (document.type === 'Steel Beam Design') {
    const beam = getBeamDetails(document);
    return [
      ['Beam', beam.section],
      ['Length', `${beam.length.toFixed(2)} ft`],
      ['Method', beam.method],
      ['Fy', beam.fy === null ? '-' : `${beam.fy.toFixed(0)} ksi`],
      ['Supports', String(beam.supports)],
      ['Loads', String(beam.loadCount)],
    ];
  }

  return [
    ['Type', document.type],
    ['Module', document.module],
    ['Status', document.status],
  ];
};

const renderSupportSymbol = (support: string | undefined, x: number, beamY: number) => {
  if (support === 'Fixed') {
    return <rect x={x - 4} y={beamY - 16} width="8" height="16" fill="#475569" />;
  }

  if (support === 'Pinned') {
    return <polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 16} ${x + 10},${beamY + 16}`} fill="#cbd5e1" stroke="#475569" />;
  }

  if (support === 'Roller') {
    return (
      <g>
        <polygon points={`${x},${beamY + 1} ${x - 10},${beamY + 13} ${x + 10},${beamY + 13}`} fill="#e2e8f0" stroke="#475569" />
        <circle cx={x - 5} cy={beamY + 17} r="2.5" fill="#94a3b8" />
        <circle cx={x + 5} cy={beamY + 17} r="2.5" fill="#94a3b8" />
      </g>
    );
  }

  return <circle cx={x} cy={beamY} r="3" fill="#475569" />;
};

const HoverModelPreview: React.FC<{ document: ProjectDocument }> = ({ document }) => {
  if (document.type === 'Steel Beam Design') {
    const beam = getBeamDetails(document);
    const width = 250;
    const height = 96;
    const beamY = 54;
    const startX = 18;
    const endX = width - 18;
    const firstX = beam.nodes[0]?.x ?? 0;
    const lastX = beam.nodes[beam.nodes.length - 1]?.x ?? 1;
    const length = Math.max(lastX - firstX, 1);
    const mapX = (value: number) => startX + ((value - firstX) / length) * (endX - startX);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full rounded border border-gray-200 bg-slate-50">
        <line x1={startX} y1={beamY} x2={endX} y2={beamY} stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        {beam.nodes.map((node, index) => {
          const x = mapX(Number(node.x));
          return (
            <g key={`${node.x}-${index}`}>
              {renderSupportSymbol(node.support, x, beamY)}
              <line x1={x} y1={beamY - 8} x2={x} y2={beamY + 24} stroke="#cbd5e1" strokeDasharray="3,3" />
            </g>
          );
        })}
        {beam.loads.slice(0, 5).map((load, index) => {
          if (load.kind === 'point') {
            const x = mapX(Number(load.x ?? firstX));
            return (
              <g key={`point-${index}`}>
                <line x1={x} y1="12" x2={x} y2={beamY - 6} stroke="#dc2626" strokeWidth="2" />
                <polygon points={`${x - 4},${beamY - 12} ${x + 4},${beamY - 12} ${x},${beamY - 4}`} fill="#dc2626" />
              </g>
            );
          }

          const lx1 = mapX(Number(load.x1 ?? firstX));
          const lx2 = mapX(Number(load.x2 ?? lastX));
          const count = 4;
          const xs = Array.from({ length: count }, (_, arrowIndex) => lx1 + ((lx2 - lx1) * arrowIndex) / Math.max(count - 1, 1));
          return (
            <g key={`line-${index}`}>
              <line x1={lx1} y1="14" x2={lx2} y2="14" stroke="#2563eb" />
              {xs.map((arrowX, arrowIndex) => (
                <g key={arrowIndex}>
                  <line x1={arrowX} y1="14" x2={arrowX} y2={beamY - 7} stroke="#2563eb" />
                  <polygon points={`${arrowX - 3},${beamY - 13} ${arrowX + 3},${beamY - 13} ${arrowX},${beamY - 6}`} fill="#2563eb" />
                </g>
              ))}
            </g>
          );
        })}
        <text x="10" y="12" fontSize="10" fill="#334155">{beam.section}</text>
        <text x={width - 10} y={height - 10} textAnchor="end" fontSize="10" fill="#64748b">
          L = {beam.length.toFixed(2)} ft
        </text>
      </svg>
    );
  }

  return (
    <div className="flex h-24 items-center justify-center rounded border border-gray-200 bg-slate-50 text-xs text-gray-500">
      Model preview will appear here for this document type.
    </div>
  );
};

const beamPrintStyles = `
  .beam-print-report { display: none; }
  .beam-screen-report .print-sheet { margin: 0 auto; max-width: 8.5in; }
  .print-sheet { background: white; color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.25; padding: 0.25in; }
  .report-header-grid { display: grid; grid-template-columns: 2.1fr 1.7fr 1.2fr; border: 1px solid #111827; }
  .report-brand { grid-row: span 3; display: flex; align-items: center; gap: 10px; padding: 10px; border-right: 1px solid #111827; }
  .report-logo { width: 34px; height: 28px; border: 2px solid #0369a1; color: #0369a1; display: flex; align-items: center; justify-content: center; font-weight: 800; }
  .report-brand-name { font-size: 18px; font-weight: 800; }
  .report-muted { color: #4b5563; font-size: 10px; }
  .report-cell { min-height: 34px; padding: 4px 6px; border-right: 1px solid #111827; border-bottom: 1px solid #111827; display: flex; flex-direction: column; gap: 4px; }
  .report-cell span { font-size: 9px; color: #374151; }
  .report-cell strong { min-height: 12px; font-size: 11px; }
  .report-section { border: 1px solid #111827; border-top: 0; padding: 16px 22px; break-inside: avoid; }
  .report-title-section { border-top: 1px solid #111827; margin-top: 8px; }
  .report-section h1 { margin: 0 0 8px; font-size: 15px; text-decoration: underline; }
  .report-section h2 { margin: 0 0 14px; font-size: 14px; text-decoration: underline; }
  .report-section h3 { margin: 14px 0 8px; font-size: 12px; }
  .report-table { width: 100%; border-collapse: collapse; margin: 8px 0 10px; }
  .report-table th, .report-table td { border: 1px solid #111827; padding: 3px 5px; vertical-align: top; }
  .report-table th { font-weight: 700; background: #f3f4f6; }
  .report-factor-table { max-width: 560px; }
  .report-compact-table { max-width: 360px; }
  .report-diagram-wrap { margin: 8px 0 14px; text-align: center; }
  .report-diagram-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 8px 0 14px; }
  .report-diagram-card { border: 1px solid #111827; padding: 8px; }
  .report-diagram-card h4 { margin: 0 0 6px; font-size: 11px; }
  .report-diagram { width: 100%; max-height: 170px; border: 0; }
  .report-result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
  .report-result-grid div { border: 1px solid #111827; padding: 8px; display: flex; flex-direction: column; gap: 5px; }
  .report-result-grid strong { font-size: 20px; }
  .report-two-col { display: grid; grid-template-columns: 1fr 160px; gap: 18px; align-items: start; }
  .report-section-sketch { width: 150px; height: 130px; }
  .report-pass { font-weight: 700; color: #166534; }
  .report-fail { font-weight: 700; color: #991b1b; }
  .report-page-break { break-before: page; }
  @media print {
    @page { size: letter; margin: 0.35in; }
    body * { visibility: hidden !important; }
    .beam-print-report, .beam-print-report * { visibility: visible !important; }
    .beam-print-report { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
    .print-sheet { padding: 0; font-size: 10.5px; }
    .report-section { break-inside: avoid; }
    .report-page-break { break-before: page; }
  }
`;

export const Documents: React.FC = () => {
  const navigate = useNavigate();
  const activeProject = getActiveProject();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>(() =>
    activeProject ? getProjectDocuments(activeProject.id) : [],
  );
  const [visualBoards, setVisualBoards] = useState<VisualBoard[]>(() =>
    activeProject ? getProjectVisualBoards(activeProject.id) : [],
  );
  const [documentsView, setDocumentsView] = useState<DocumentsView>('list');
  const [searchText, setSearchText] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoverDocument, setHoverDocument] = useState<ProjectDocument | null>(null);
  const [hoverPoint, setHoverPoint] = useState({ x: 0, y: 0 });
  const [printDocument, setPrintDocument] = useState<ProjectDocument | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardKind, setNewBoardKind] = useState<VisualBoardKind>('Plan');
  const [uploadMessage, setUploadMessage] = useState('');

  const selectedBoard = useMemo(
    () => visualBoards.find((board) => board.id === selectedBoardId) ?? null,
    [selectedBoardId, visualBoards],
  );

  const refreshDocuments = () => {
    if (!activeProject) {
      setDocuments([]);
      return;
    }

    setDocuments(getProjectDocuments(activeProject.id));
  };

  const refreshVisualBoards = () => {
    if (!activeProject) {
      setVisualBoards([]);
      return;
    }

    setVisualBoards(getProjectVisualBoards(activeProject.id));
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

  useEffect(() => {
    if (!printDocument) return;

    const timeout = window.setTimeout(() => {
      window.print();
    }, 80);

    const afterPrint = () => {
      setPrintDocument(null);
    };

    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, [printDocument]);

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

  const handlePrint = (document: ProjectDocument) => {
    setPrintDocument(document);
  };

  const handleVisualBoardUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeProject) return;

    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please upload an image file such as PNG, JPG, or WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setUploadMessage('This image is large. For now, use screenshots under about 3 MB so the browser can save the board locally.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageDataUrl = String(reader.result || '');
      if (!imageDataUrl) {
        setUploadMessage('The image could not be read. Try another file.');
        return;
      }

      const now = new Date().toISOString();
      const board: VisualBoard = {
        id: makeVisualBoardId(),
        projectId: activeProject.id,
        name: newBoardName.trim() || getDefaultBoardName(file.name),
        kind: newBoardKind,
        imageName: file.name,
        imageDataUrl,
        createdAt: now,
        updatedAt: now,
      };

      writeAllVisualBoards([board, ...getAllVisualBoards()]);
      setNewBoardName('');
      setUploadMessage('Visual board added.');
      setSelectedBoardId(board.id);
      refreshVisualBoards();
    };

    reader.onerror = () => {
      setUploadMessage('The image could not be uploaded. Try another file.');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleDeleteVisualBoard = (boardId: string) => {
    deleteVisualBoard(boardId);
    if (selectedBoardId === boardId) {
      setSelectedBoardId(null);
    }
    refreshVisualBoards();
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

  const renderListView = () => (
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
                      <button
                        onClick={() => handlePrint(document)}
                        onMouseEnter={(event) => {
                          setHoverDocument(document);
                          setHoverPoint({ x: event.clientX, y: event.clientY });
                        }}
                        onMouseMove={(event) => setHoverPoint({ x: event.clientX, y: event.clientY })}
                        onMouseLeave={() => setHoverDocument(null)}
                        className="rounded border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-50"
                        title="Print document"
                      >
                        <Download size={15} />
                      </button>
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
  );

  const renderVisualMapBoard = () => {
    if (!selectedBoard) return null;

    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedBoardId(null)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Visual Map
        </button>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedBoard.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedBoard.kind} • {selectedBoard.imageName} • {formatDocumentDate(selectedBoard.updatedAt)}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Markers and document links coming next
            </div>
          </div>

          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="max-h-[72vh] overflow-auto bg-slate-100 p-4">
              <div className="mx-auto w-fit rounded-lg border border-gray-300 bg-white p-2 shadow-sm">
                <img
                  src={selectedBoard.imageDataUrl}
                  alt={selectedBoard.name}
                  className="max-h-[68vh] max-w-full object-contain"
                />
              </div>
            </div>

            <aside className="border-t border-gray-200 bg-gray-50 p-4 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-bold text-gray-900">Board Details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project</dt>
                  <dd className="font-medium text-gray-900">{activeProject.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Visual type</dt>
                  <dd className="font-medium text-gray-900">{selectedBoard.kind}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Linked documents</dt>
                  <dd className="font-medium text-gray-900">{getBoardDocumentCount()} linked documents</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                <div className="font-semibold text-gray-900">Next phase</div>
                <p className="mt-2">
                  This is where Add Marker, arrow labels, hover previews, and linked document controls will live.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  };

  const renderVisualMapView = () => {
    if (selectedBoard) return renderVisualMapBoard();

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Map className="text-blue-600" size={22} />
                Visual Map
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Upload a plan, elevation, or site photo for {activeProject.name}. This creates a visual board that will later hold markers linked to saved calculations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1fr)_150px_auto]">
              <input
                value={newBoardName}
                onChange={(event) => setNewBoardName(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Board name, optional"
              />
              <select
                value={newBoardKind}
                onChange={(event) => setNewBoardKind(event.target.value as VisualBoardKind)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option>Plan</option>
                <option>Elevation</option>
                <option>Site Photo</option>
                <option>Other</option>
              </select>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Upload size={16} />
                Upload Plan / Photo
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleVisualBoardUpload}
                className="hidden"
              />
            </div>
          </div>

          {uploadMessage && (
            <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              {uploadMessage}
            </div>
          )}
        </div>

        {visualBoards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <ImageIcon className="mx-auto text-gray-400" size={42} />
            <h3 className="mt-4 text-lg font-bold text-gray-900">No visual boards yet</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              Upload a plan, elevation, or site photo to start the visual document map for this project.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {activeProject.name} Visual Boards
              </h3>
              <span className="text-sm text-gray-500">
                {visualBoards.length} board{visualBoards.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visualBoards.map((board) => (
                <div key={board.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedBoardId(board.id)}
                    className="group block w-full text-left"
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img src={board.imageDataUrl} alt={board.name} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 shadow-sm">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{board.name}</h4>
                          <p className="mt-1 text-xs text-gray-500">{board.kind} • {board.imageName}</p>
                        </div>
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                          {getBoardDocumentCount()} docs
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">Last edited {formatDocumentDate(board.updatedAt)}</p>
                    </div>
                  </button>

                  <div className="flex justify-end border-t border-gray-100 px-4 py-2">
                    <button
                      onClick={() => handleDeleteVisualBoard(board.id)}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <style>{beamPrintStyles}</style>
      {printDocument && (
        <div className="beam-print-report" dangerouslySetInnerHTML={{ __html: printDocument.reportHtml }} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900">
            <FileText className="text-blue-600" />
            Documents
          </h1>
          <p className="mt-2 text-gray-500">
            Saved calculation outputs and visual document maps for <span className="font-semibold text-gray-800">{activeProject.name}</span>.
          </p>
        </div>

        {documentsView === 'list' && (
          <label className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Search documents..."
            />
          </label>
        )}
      </div>

      <div className="flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setDocumentsView('list')}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
            documentsView === 'list'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <LayoutList size={16} />
          List
        </button>
        <button
          onClick={() => setDocumentsView('visual')}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
            documentsView === 'visual'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Map size={16} />
          Visual Map
        </button>
      </div>

      {documentsView === 'list' ? renderListView() : renderVisualMapView()}

      {hoverDocument && (
        <div
          className="pointer-events-none fixed z-[140] w-80 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-xl"
          style={{
            left: Math.min(hoverPoint.x + 14, window.innerWidth - 340),
            top: Math.min(hoverPoint.y + 14, window.innerHeight - 260),
          }}
        >
          <div className="mb-2 border-b border-gray-100 pb-2">
            <div className="font-semibold text-gray-900">{hoverDocument.name}</div>
            <div className="text-gray-500">{hoverDocument.type}</div>
          </div>

          <HoverModelPreview document={hoverDocument} />

          <div className="mt-3 space-y-1">
            {buildPreviewSummary(hoverDocument).map(([label, value]) => (
              <div key={label} className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 rounded bg-gray-50 p-2 text-[11px] text-gray-500">
            Clicking print sends this saved report straight to the browser print dialog.
          </div>
        </div>
      )}
    </div>
  );
};
