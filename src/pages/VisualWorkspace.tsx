import React, { useMemo, useState } from 'react';
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  Cloud,
  FileText,
  Filter,
  Grid3X3,
  HelpCircle,
  Highlighter,
  Layers,
  Link as LinkIcon,
  Maximize2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  MousePointer2,
  Move,
  Palette,
  PenLine,
  Plus,
  Redo2,
  Ruler,
  Search,
  Settings,
  Sparkles,
  Square,
  Type,
  Undo2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';

type MarkupStatus = 'Field Verify' | 'Monitor' | 'Complete';
type Priority = 'High' | 'Medium' | 'Low';

interface MarkupItem {
  id: number;
  color: string;
  type: string;
  itemName: string;
  location: string;
  status: MarkupStatus;
  condition: string;
  priority: Priority;
  discipline: string;
  dueDate: string;
  section: string;
  notes: string;
  photoIds: number[];
}

interface SitePhoto {
  id: number;
  color: string;
  fileName: string;
  date: string;
  grid: string;
  caption: string;
  photoType: 'seat' | 'flange' | 'section';
}

const markups: MarkupItem[] = [
  {
    id: 1,
    color: '#ef4444',
    type: 'Beam',
    itemName: 'B12',
    location: 'Grid 6 / A-B',
    status: 'Field Verify',
    condition: 'Corrosion at seat connection',
    priority: 'High',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Seat angle connection shows heavy rust and section loss. Verify seat and bearing stiffener condition.',
    photoIds: [1, 4, 5],
  },
  {
    id: 2,
    color: '#2563eb',
    type: 'Beam',
    itemName: 'B18',
    location: 'Grid 6 / B-C',
    status: 'Field Verify',
    condition: 'Paint peeling, rust scale',
    priority: 'Medium',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Paint peeling and rust scale visible along bottom flange. Check bottom flange and web thickness.',
    photoIds: [2],
  },
  {
    id: 3,
    color: '#16a34a',
    type: 'Beam',
    itemName: 'B31',
    location: 'Grid 5 / C-D',
    status: 'Field Verify',
    condition: 'Section loss at midspan',
    priority: 'High',
    discipline: 'Structural',
    dueDate: 'May 26, 2025',
    section: 'W16x26',
    notes: 'Section loss at midspan. Verify remaining thickness and repair requirements.',
    photoIds: [3],
  },
  {
    id: 4,
    color: '#eab308',
    type: 'Column',
    itemName: 'C16',
    location: 'Grid 5 / B-C',
    status: 'Monitor',
    condition: 'Surface rust',
    priority: 'Low',
    discipline: 'Structural',
    dueDate: 'Jun 10, 2025',
    section: 'HSS6x6x1/4',
    notes: 'Monitor surface rust at column base.',
    photoIds: [],
  },
  {
    id: 5,
    color: '#8b5cf6',
    type: 'Beam',
    itemName: 'B7',
    location: 'Grid 2 / A-B',
    status: 'Complete',
    condition: 'No visible distress',
    priority: 'Low',
    discipline: 'Structural',
    dueDate: '—',
    section: 'W16x26',
    notes: 'No visible distress observed.',
    photoIds: [],
  },
];

const photos: SitePhoto[] = [
  { id: 1, color: '#ef4444', fileName: 'P101_0456.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Corroded beam seat connection', photoType: 'seat' },
  { id: 2, color: '#2563eb', fileName: 'P101_0461.JPG', date: 'May 11, 2025', grid: 'Grid 6 / B-C', caption: 'Peeling paint and rust scale', photoType: 'flange' },
  { id: 3, color: '#16a34a', fileName: 'P101_0468.JPG', date: 'May 11, 2025', grid: 'Grid 5 / C-D', caption: 'Midspan section loss', photoType: 'section' },
  { id: 4, color: '#ef4444', fileName: 'P101_0457.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Seat bearing corrosion close-up', photoType: 'seat' },
  { id: 5, color: '#ef4444', fileName: 'P101_0458.JPG', date: 'May 11, 2025', grid: 'Grid 6 / A-B', caption: 'Bearing stiffener rust', photoType: 'flange' },
];

const toolGroups = [
  {
    label: 'Navigate',
    tools: [
      ['Select', MousePointer2],
      ['Pan', Move],
      ['Zoom', ZoomIn],
      ['Fit', Maximize2],
      ['Zoom Area', Search],
    ],
  },
  {
    label: 'Markup',
    tools: [
      ['Arrow', MousePointer2],
      ['Cloud', Cloud],
      ['Text', Type],
      ['Box', Square],
      ['Callout', MessageSquare],
      ['Dimension', Ruler],
    ],
  },
  {
    label: 'Measure',
    tools: [
      ['Distance', Ruler],
      ['Angle', PenLine],
      ['Area', Square],
    ],
  },
  {
    label: 'Insert',
    tools: [
      ['Note', FileText],
      ['Photo', Camera],
      ['File', Upload],
      ['Link', LinkIcon],
    ],
  },
  {
    label: 'Annotate',
    tools: [
      ['Highlighter', Highlighter],
      ['Pen', PenLine],
      ['Eraser', PenLine],
      ['Color', Palette],
    ],
  },
  {
    label: 'Layers',
    tools: [
      ['Layers', Layers],
      ['Scale', Ruler],
      ['Grid', Grid3X3],
      ['Snap', Sparkles],
    ],
  },
  {
    label: 'Edit',
    tools: [
      ['Undo', Undo2],
      ['Redo', Redo2],
      ['More', MoreHorizontal],
    ],
  },
] as const;

const statusClass = (status: MarkupStatus) => {
  if (status === 'Field Verify') return 'bg-red-500/20 text-red-100 border-red-400/40';
  if (status === 'Monitor') return 'bg-amber-500/20 text-amber-100 border-amber-400/40';
  return 'bg-green-500/20 text-green-100 border-green-400/40';
};

const lightStatusClass = (status: MarkupStatus) => {
  if (status === 'Field Verify') return 'bg-red-100 text-red-700';
  if (status === 'Monitor') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

const priorityClass = (priority: Priority) => {
  if (priority === 'High') return 'bg-red-100 text-red-700';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
};

const PhotoSvg: React.FC<{ photo: SitePhoto; compact?: boolean }> = ({ photo }) => {
  const tone =
    photo.photoType === 'seat'
      ? ['#5b3b22', '#9a6537', '#1f2937']
      : photo.photoType === 'flange'
        ? ['#6b4a2f', '#c58a4b', '#334155']
        : ['#78350f', '#b45309', '#475569'];

  return (
    <svg viewBox="0 0 360 190" className="h-full w-full">
      <defs>
        <linearGradient id={`rust-bg-${photo.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={tone[2]} />
          <stop offset="0.45" stopColor="#111827" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`rust-${photo.id}`} x1="0" x2="1">
          <stop stopColor={tone[0]} />
          <stop offset="0.45" stopColor={tone[1]} />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id={`noise-${photo.id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={photo.id * 9} />
          <feColorMatrix type="saturate" values="0.35" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </defs>
      <rect width="360" height="190" fill={`url(#rust-bg-${photo.id})`} />
      <g filter={`url(#noise-${photo.id})`} opacity="0.9">
        <rect x="20" y="46" width="320" height="56" rx="7" fill="#64748b" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="20" y="102" width="320" height="22" fill="#334155" />
        <path d="M40 47h250c-23 13-42 23-72 25-49 3-71-12-106 4-31 14-46 16-72 6z" fill={`url(#rust-${photo.id})`} opacity="0.78" />
        <path d="M55 105c42-8 78 11 122 0s73-15 126-4v22H55z" fill="#b45309" opacity="0.85" />
        <circle cx="105" cy="73" r="18" fill="#7f1d1d" opacity="0.75" />
        <circle cx="104" cy="72" r="7" fill="#292524" />
        <rect x="76" y="32" width="28" height="122" fill="#57534e" stroke="#cbd5e1" strokeWidth="2" opacity="0.72" />
        <rect x="251" y="35" width="30" height="116" fill="#57534e" stroke="#cbd5e1" strokeWidth="2" opacity="0.68" />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle key={i} cx={92 + i * 39} cy={74 + (i % 2) * 10} r="6" fill="#1f2937" stroke="#cbd5e1" strokeWidth="1.2" />
        ))}
        <path d="M0 150c52-18 100 14 150-6 52-21 109-13 210 3v43H0z" fill="#a16207" opacity="0.6" />
      </g>
    </svg>
  );
};

const FramingPlan: React.FC<{ onSelect: (id: number) => void }> = ({ onSelect }) => {
  const xs = [92, 214, 336, 458, 580, 702, 824];
  const ys = [76, 210, 344, 478];
  const beamLabel = (x1: number, y1: number, x2: number, y2: number, label: string) => {
    const x = (x1 + x2) / 2;
    const y = (y1 + y2) / 2 - 8;
    return (
      <text x={x} y={y} textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#111827">
        {label}
      </text>
    );
  };

  return (
    <svg viewBox="0 0 980 640" className="h-full w-full bg-white">
      <defs>
        <pattern id="paper" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#ffffff" />
          <circle cx="1" cy="1" r="0.5" fill="#e5e7eb" />
        </pattern>
        <marker id="planArrowRed" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#ef4444" />
        </marker>
        <marker id="planArrowBlue" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#2563eb" />
        </marker>
        <marker id="planArrowGreen" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#16a34a" />
        </marker>
      </defs>
      <rect width="980" height="640" fill="url(#paper)" />

      {xs.map((x, i) => (
        <g key={`gx-${i}`}>
          <line x1={x} y1="72" x2={x} y2="528" stroke="#9ca3af" strokeDasharray="6 6" />
          <circle cx={x} cy="36" r="15" fill="white" stroke="#6b7280" />
          <text x={x} y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{i === 5 ? '' : i + 1}</text>
        </g>
      ))}
      {ys.map((y, i) => (
        <g key={`gy-${i}`}>
          <line x1="92" y1={y} x2="824" y2={y} stroke="#9ca3af" strokeDasharray="6 6" />
          <circle cx="38" cy={y} r="15" fill="white" stroke="#6b7280" />
          <text x="38" y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#374151">{String.fromCharCode(65 + i)}</text>
        </g>
      ))}

      <g stroke="#111827" strokeWidth="2">
        {ys.map((y) => xs.slice(0, -1).map((x, i) => <line key={`${y}-${x}`} x1={x} y1={y} x2={xs[i + 1]} y2={y} />))}
        {xs.map((x) => ys.slice(0, -1).map((y, i) => <line key={`${x}-${y}`} x1={x} y1={y} x2={x} y2={ys[i + 1]} stroke="#6b7280" strokeWidth="1.2" />))}
      </g>

      <g fill="white" stroke="#111827" strokeWidth="1.3">
        {xs.map((x, xi) => ys.map((y, yi) => <rect key={`${xi}-${yi}`} x={x - 6} y={y - 6} width="12" height="12" />))}
      </g>

      <g fontSize="8" fontWeight="700" fill="#111827">
        {ys.map((y, row) => xs.slice(0, -1).map((x, col) => beamLabel(x, y, xs[col + 1], y, `B${row * 6 + col + 1} (W16x26)`)))}
        {xs.map((x, xi) => ys.map((y, yi) => <text key={`c-${xi}-${yi}`} x={x + 9} y={y - 10}>C{yi * 6 + xi + 1}</text>))}
      </g>

      <g stroke="#111827" strokeWidth="1.2" fill="none">
        <rect x="456" y="214" width="116" height="130" />
        <line x1="456" y1="214" x2="572" y2="344" />
        <line x1="572" y1="214" x2="456" y2="344" />
        <rect x="630" y="230" width="85" height="77" />
        <path d="M648 292h46M648 282h46M648 272h46M648 262h46M648 252h46" />
        <text x="667" y="317" fontSize="10">P-3-2</text>
      </g>

      <g fontSize="12" fill="#111827">
        <text x="66" y="141">24&apos;-0&quot;</text>
        <text x="66" y="275">24&apos;-0&quot;</text>
        <text x="66" y="409">24&apos;-0&quot;</text>
        <text x="115" y="560">30&apos;-0&quot;</text>
        <text x="237" y="560">30&apos;-0&quot;</text>
        <text x="359" y="560">30&apos;-0&quot;</text>
        <text x="481" y="560">30&apos;-0&quot;</text>
        <text x="603" y="560">30&apos;-0&quot;</text>
        <text x="725" y="560">30&apos;-0&quot;</text>
        <text x="431" y="592" fontWeight="700">180&apos;-0&quot;</text>
      </g>
      <g transform="translate(42 588)">
        <circle r="24" fill="none" stroke="#111827" />
        <path d="M0-30v60M-30 0h60" stroke="#111827" />
        <path d="M0-20l8 20H-8z" fill="#111827" />
        <text x="-4" y="-36" fontSize="14" fontWeight="700">N</text>
      </g>

      <g onClick={() => onSelect(1)} className="cursor-pointer">
        <path d="M750 57c24-14 66-11 78 6 12 17-1 35-33 31-31 12-63-2-62-19 0-8 7-14 17-18z" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 4" />
        <circle cx="782" cy="102" r="12" fill="#ef4444" />
        <text x="782" y="107" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">1</text>
        <line x1="795" y1="103" x2="865" y2="158" stroke="#ef4444" strokeWidth="2" markerEnd="url(#planArrowRed)" />
        <rect x="856" y="58" width="120" height="58" rx="4" fill="#fff5f5" stroke="#ef4444" strokeWidth="1.6" />
        <text x="865" y="76" fontSize="10" fontWeight="800" fill="#ef4444">CORROSION AT SEAT</text>
        <text x="865" y="91" fontSize="10" fontWeight="800" fill="#ef4444">CONNECTION, TYP.</text>
        <text x="865" y="106" fontSize="10" fontWeight="800" fill="#ef4444">FIELD VERIFY SECTION LOSS.</text>
        <text x="897" y="172" fontSize="15" fontWeight="800" fill="#ef4444">5/8&quot;</text>
      </g>

      <g onClick={() => onSelect(2)} className="cursor-pointer">
        <path d="M745 192c22-13 62-9 77 4 14 12 3 29-21 27-28 11-62-1-65-14-2-8 2-13 9-17z" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="5 4" />
        <circle cx="792" cy="239" r="12" fill="#2563eb" />
        <text x="792" y="244" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">2</text>
        <line x1="804" y1="239" x2="870" y2="285" stroke="#2563eb" strokeWidth="2" markerEnd="url(#planArrowBlue)" />
        <rect x="874" y="278" width="120" height="64" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.6" />
        <text x="884" y="298" fontSize="10" fontWeight="800" fill="#2563eb">PAINT PEELING AND</text>
        <text x="884" y="313" fontSize="10" fontWeight="800" fill="#2563eb">RUST SCALE. CHECK</text>
        <text x="884" y="328" fontSize="10" fontWeight="800" fill="#2563eb">BOTTOM FLANGE.</text>
        <text x="882" y="252" fontSize="14" fontWeight="800" fill="#2563eb">2 1/4&quot;</text>
      </g>

      <g onClick={() => onSelect(3)} className="cursor-pointer">
        <path d="M642 450c25-16 69-9 84 9 12 14 2 35-28 30-27 12-64-2-69-17-3-10 1-17 13-22z" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="5 4" />
        <circle cx="728" cy="520" r="12" fill="#16a34a" />
        <text x="728" y="525" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">3</text>
        <line x1="728" y1="520" x2="745" y2="570" stroke="#16a34a" strokeWidth="2" markerEnd="url(#planArrowGreen)" />
        <rect x="736" y="558" width="190" height="55" rx="4" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.6" />
        <text x="748" y="579" fontSize="11" fontWeight="800" fill="#15803d">SECTION LOSS AT MIDSPAN.</text>
        <text x="748" y="595" fontSize="11" fontWeight="800" fill="#15803d">VERIFY REMAINING THICKNESS.</text>
        <text x="793" y="434" fontSize="14" fontWeight="800" fill="#16a34a">3/4&quot;</text>
      </g>
    </svg>
  );
};

export const VisualWorkspace: React.FC = () => {
  const [selectedId, setSelectedId] = useState(1);
  const selected = useMemo(() => markups.find((item) => item.id === selectedId) ?? markups[0], [selectedId]);
  const linkedPhotos = photos.filter((photo) => selected.photoIds.includes(photo.id));

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#071019] text-slate-100">
      <header className="shrink-0 border-b border-slate-700/80 bg-[#0b1520] shadow-2xl">
        <div className="flex h-12 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-3">
            <Menu size={20} className="text-slate-300" />
            <div className="flex items-center gap-2">
              <div className="relative h-7 w-7 rounded-md bg-blue-600">
                <div className="absolute left-1 top-1 h-2.5 w-5 rounded-sm bg-cyan-300" />
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-sm bg-blue-300" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">SimplifyStruct</span>
            </div>
          </div>

          <nav className="hidden h-full items-stretch md:flex">
            {['Workspace', 'Review', 'Report', 'Export'].map((tab) => (
              <button key={tab} className={`px-8 text-sm font-bold ${tab === 'Workspace' ? 'border-b-2 border-blue-500 bg-slate-800/80 text-white' : 'text-slate-300 hover:bg-slate-900'}`}>
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden text-sm font-semibold text-slate-200 lg:block">
              Project: 1234 - Riverside Office Building <ChevronDown size={14} className="inline" />
            </div>
            <Search size={18} className="text-slate-300" />
            <div className="relative">
              <Bell size={18} className="text-slate-300" />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">3</span>
            </div>
            <HelpCircle size={18} className="text-slate-300" />
            <Settings size={18} className="text-slate-300" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">AM</span>
          </div>
        </div>

        <div className="flex min-h-[88px] divide-x divide-slate-800 overflow-x-auto px-3 py-2">
          {toolGroups.map((group) => (
            <div key={group.label} className="flex flex-col justify-between px-2">
              <div className="flex gap-1">
                {group.tools.map(([label, Icon]) => (
                  <button
                    key={label}
                    className={`flex min-w-[52px] flex-col items-center gap-1 rounded-md px-2 py-2 text-[11px] font-semibold transition ${
                      label === 'Select' ? 'bg-blue-600/60 text-white ring-1 ring-blue-400/50' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-1 text-center text-[10px] text-slate-500">{group.label}{['Insert', 'Layers', 'More'].includes(group.label) ? '⌄' : ''}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[252px_minmax(760px,1fr)_260px_315px]">
        <aside className="flex min-h-0 flex-col border-r border-slate-800 bg-[#0b1620]">
          <div className="border-b border-slate-800 p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-300">
              <span>Project</span>
              <MoreHorizontal size={16} />
            </div>
            <div className="text-sm font-semibold text-white">1234 - Riverside Office Building</div>
          </div>

          <div className="border-b border-slate-800 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide text-white">Boards</h2>
              <Plus size={17} className="text-slate-300" />
            </div>
            <label className="relative block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="w-full rounded-md border border-slate-700 bg-[#111d29] py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500" placeholder="Search boards..." />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2 text-sm">
            {[
              ['01 - General', false, []],
              ['02 - Architectural', false, []],
              ['03 - Structural', true, ['Level 2 Framing Plan', 'Roof Framing Plan', 'South Elevation', 'East Elevation', 'Typical Sections']],
              ['04 - MEP', false, []],
              ['05 - Site', false, []],
              ['06 - Inspections', false, []],
              ['Photos & Documents', true, ['Site Photo Set']],
            ].map(([folder, open, children]) => (
              <div key={folder as string} className="mb-1">
                <div className="flex items-center gap-2 rounded-md px-2 py-2 text-slate-300">
                  <ChevronRight size={14} className={open ? 'rotate-90' : ''} />
                  <FileText size={14} />
                  <span className="text-xs font-semibold">{folder as string}</span>
                </div>
                {(children as string[]).map((child) => (
                  <button key={child} className={`ml-6 mb-1 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold ${child === 'Level 2 Framing Plan' ? 'bg-blue-600/45 text-blue-50' : 'text-slate-300 hover:bg-slate-800'}`}>
                    <FileText size={13} />
                    <span className="truncate">{child}</span>
                    {child === 'Level 2 Framing Plan' && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-blue-400" />}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-wide text-white">
              <span>Layers</span>
              <Filter size={14} />
            </div>
            {['Plan Grid', 'Structural - Beams', 'Structural - Columns', 'Dimensions', 'Markups', 'Notes', 'Photos', 'Reference'].map((layer, index) => (
              <button key={layer} className={`mb-1 flex w-full items-center justify-between rounded-md px-2 py-2 text-xs ${index === 4 ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'}`}>
                <span className="flex items-center gap-2">
                  <span className={index === 7 ? 'text-slate-500' : 'text-blue-300'}>{index === 7 ? '◌' : '●'}</span>
                  {layer}
                </span>
                {index === 4 && <PenLine size={13} className="text-blue-400" />}
              </button>
            ))}
            <div className="mt-4 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
              Scale: 1/8&quot; = 1&apos;-0&quot; <ChevronDown size={13} className="float-right" />
            </div>
          </div>
        </aside>

        <main className="grid min-h-0 grid-rows-[36px_minmax(0,1fr)_292px] bg-[#111827]">
          <div className="flex items-center gap-1 border-b border-slate-800 bg-[#0f1722] px-3">
            <div className="flex h-full items-center gap-3 rounded-t-lg bg-white px-4 text-xs font-bold text-slate-950">
              Level 2 Framing Plan <X size={13} className="text-slate-500" />
            </div>
            <button className="ml-2 text-slate-400 hover:text-white"><Plus size={17} /></button>
          </div>

          <section className="min-h-0 overflow-hidden bg-slate-200 p-2">
            <div className="relative mx-auto h-full overflow-hidden rounded-md border border-slate-500 bg-white shadow-2xl">
              <FramingPlan onSelect={setSelectedId} />
            </div>
          </section>

          <section className="grid min-h-0 grid-cols-[1.15fr_0.85fr] gap-1 border-t border-slate-800 bg-[#071019] p-1">
            <div className="min-h-0 overflow-hidden rounded-md border border-slate-800 bg-[#0f1722]">
              <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-black uppercase tracking-wide text-slate-200">
                Items / Markup Schedule
                <Filter size={14} className="text-slate-400" />
              </div>
              <div className="max-h-[238px] overflow-auto">
                <table className="w-full min-w-[850px] text-xs">
                  <thead className="sticky top-0 bg-[#111d29] text-slate-400">
                    <tr>
                      {['ID', 'Type', 'Item Name', 'Location', 'Status', 'Condition', 'Priority', 'Discipline', 'Due Date'].map((header) => (
                        <th key={header} className="border-b border-slate-800 px-3 py-2 text-left font-bold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {markups.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer border-b border-slate-800/70 hover:bg-slate-800/80 ${selectedId === row.id ? 'bg-blue-950/50' : ''}`}>
                        <td className="px-3 py-2">
                          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.id}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{row.type}</td>
                        <td className="px-3 py-2 font-bold text-white">{row.itemName}</td>
                        <td className="px-3 py-2 text-slate-300">{row.location}</td>
                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-[11px] font-bold ${lightStatusClass(row.status)}`}>{row.status}</span></td>
                        <td className="px-3 py-2 text-slate-300">{row.condition}</td>
                        <td className="px-3 py-2"><span className={`rounded px-2 py-1 text-[11px] font-bold ${priorityClass(row.priority)}`}>{row.priority}</span></td>
                        <td className="px-3 py-2 text-slate-300">{row.discipline}</td>
                        <td className="px-3 py-2 text-slate-300">{row.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-800 px-3 py-2 text-xs text-slate-400">1–5 of 5 items</div>
            </div>

            <div className="relative min-h-0 overflow-hidden rounded-md border border-slate-800 bg-[#0f1722]">
              <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3 text-xs font-black uppercase tracking-wide text-slate-200">
                Relationship Map
                <X size={14} className="text-slate-400" />
              </div>
              <div className="relative h-[248px] bg-slate-50">
                <svg className="absolute inset-0 h-full w-full">
                  <defs>
                    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="1" fill="#e2e8f0" />
                    </pattern>
                    <marker id="relArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                    </marker>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots)" />
                  <line x1="122" y1="90" x2="225" y2="90" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                  <text x="152" y="79" fontSize="10" fontWeight="700" fill="#334155">refers to</text>
                  <line x1="330" y1="90" x2="438" y2="90" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                  <text x="368" y="79" fontSize="10" fontWeight="700" fill="#334155">has</text>
                  <line x1="278" y1="123" x2="278" y2="172" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                  <text x="287" y="151" fontSize="10" fontWeight="700" fill="#334155">impacts</text>
                  <line x1="122" y1="166" x2="225" y2="166" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                  <line x1="330" y1="166" x2="438" y2="166" stroke="#334155" strokeWidth="2" markerEnd="url(#relArrow)" />
                </svg>
                <div className="absolute left-7 top-16 rounded-md border border-blue-500 bg-blue-50 px-5 py-3 text-center text-xs font-bold text-blue-900">Plan Marker<br />#{selected.id}</div>
                <div className="absolute left-[225px] top-12 rounded-md border border-red-500 bg-red-500 px-8 py-4 text-center text-sm font-black text-white shadow-lg">
                  <span className="absolute -top-4 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs">1</span>
                  {selected.type}<br />{selected.itemName}
                </div>
                <div className="absolute left-[438px] top-16 rounded-md border border-cyan-500 bg-cyan-50 px-5 py-3 text-center text-xs font-bold text-cyan-900">Site Photos<br />({linkedPhotos.length})</div>
                <div className="absolute left-7 top-[142px] rounded-md border border-amber-500 bg-amber-50 px-5 py-3 text-center text-xs font-bold text-amber-900">Linked Markups<br />(2)</div>
                <div className="absolute left-[235px] top-[172px] rounded-md border border-green-600 bg-green-50 px-5 py-3 text-center text-xs font-bold text-green-900">Cost Item<br />C-102</div>
                <div className="absolute left-[438px] top-[142px] rounded-md border border-purple-500 bg-purple-50 px-5 py-3 text-center text-xs font-bold text-purple-900">Document<br />S-2.3</div>
                <div className="absolute bottom-3 right-3 flex items-center overflow-hidden rounded-md border border-slate-300 bg-white text-xs text-slate-800 shadow">
                  <button className="px-3 py-2">−</button>
                  <span className="border-x border-slate-300 px-3 py-2 font-bold">100%</span>
                  <button className="px-3 py-2">+</button>
                  <button className="border-l border-slate-300 px-3 py-2"><Maximize2 size={13} /></button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-[#0b1620]">
          <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
            <h2 className="text-sm font-black uppercase tracking-wide">Site Photos</h2>
            <div className="flex items-center gap-2 text-slate-400"><Filter size={14} /><X size={14} /></div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {photos.slice(0, 3).map((photo) => (
              <button key={photo.id} onClick={() => setSelectedId(photo.id <= 3 ? photo.id : 1)} className="mb-3 w-full overflow-hidden rounded-md border border-slate-800 bg-[#111d29] text-left shadow">
                <div className="relative h-[135px] overflow-hidden">
                  <PhotoSvg photo={photo} />
                  <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-black text-white shadow" style={{ backgroundColor: photo.color }}>{photo.id}</span>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2 p-3 text-xs">
                  <div>
                    <div className="font-bold text-white">{photo.fileName}</div>
                    <div className="mt-1 text-slate-400">{photo.date}</div>
                  </div>
                  <div className="self-end text-right text-slate-300">{photo.grid}</div>
                </div>
              </button>
            ))}
            <button className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-800">
              View all photos (32)
            </button>
          </div>
        </aside>

        <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-[#0b1620]">
          <div className="flex h-10 items-center justify-between border-b border-slate-800 px-3">
            <h2 className="text-sm font-black uppercase tracking-wide">Inspector</h2>
            <X size={14} className="text-slate-400" />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <section className="border-b border-slate-800 p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-black text-white shadow" style={{ backgroundColor: selected.color }}>{selected.id}</span>
                  <div>
                    <h2 className="text-lg font-black text-white">{selected.type} {selected.itemName}</h2>
                  </div>
                </div>
                <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(selected.status)}`}>{selected.status}<ChevronDown size={12} className="ml-1 inline" /></span>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ['Item Name', `${selected.type} ${selected.itemName}`],
                  ['Type', selected.type === 'Beam' ? 'Steel Beam' : selected.type],
                  ['Status', selected.status],
                  ['Section', selected.section],
                  ['Location', selected.location],
                  ['Elevation', '+14&apos;-0&quot; (T.O.S.)'],
                  ['Condition', selected.condition],
                  ['Priority', selected.priority],
                  ['Discipline', selected.discipline],
                  ['Created By', 'A. Morgan'],
                  ['Date', 'May 12, 2025'],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[112px_1fr] items-center gap-2">
                    <div className="text-xs font-medium text-slate-400">{label}</div>
                    <div className="font-semibold text-slate-100">
                      {label === 'Priority' ? <span className={`rounded px-2 py-1 text-[11px] font-bold ${priorityClass(value as Priority)}`}>{value}</span> : value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-slate-800 p-3">
              {[
                ['Linked Photos', linkedPhotos.length],
                ['Linked Documents', 1],
                ['Linked Markups', 2],
                ['Linked Costs', 1],
              ].map(([label, count]) => (
                <button key={label} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-slate-200 hover:bg-slate-900">
                  <span className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    {label}
                  </span>
                  <span className="flex items-center gap-2 font-bold">{count}<ChevronRight size={14} /></span>
                </button>
              ))}
            </section>

            <section className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Linked Photos ({linkedPhotos.length})</h3>
                <Plus size={15} />
              </div>
              <div className="space-y-2">
                {linkedPhotos.slice(0, 2).map((photo) => (
                  <div key={photo.id} className="grid grid-cols-[86px_1fr] gap-3 rounded-md border border-slate-800 bg-[#111d29] p-2">
                    <div className="relative h-16 overflow-hidden rounded">
                      <PhotoSvg photo={photo} />
                      <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: photo.color }}>{photo.id}</span>
                    </div>
                    <div className="min-w-0 text-xs">
                      <div className="truncate font-bold text-white">{photo.fileName}</div>
                      <div className="mt-1 text-slate-400">{photo.date}</div>
                      <div className="text-slate-400">{photo.grid}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Notes</h3>
                <PenLine size={14} className="text-slate-400" />
              </div>
              <p className="text-sm leading-relaxed text-slate-200">{selected.notes}</p>
              <div className="mt-4 text-xs text-slate-500">A. Morgan, May 12, 2025 9:15 AM</div>
            </section>

            <section className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-300">Issue Details</h3>
                <ChevronDown size={14} />
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ['Issue Type', selected.condition.includes('Corrosion') ? 'Corrosion' : 'Section Loss'],
                  ['Severity', selected.priority === 'High' ? 'Severe' : 'Moderate'],
                  ['Recommendation', selected.priority === 'Low' ? 'Monitor' : 'Repair'],
                  ['Recommended Action', selected.priority === 'Low' ? 'Monitor during next inspection' : 'Grind, repair, prime and repaint'],
                  ['Due Date', selected.dueDate],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[125px_1fr] gap-2">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="font-semibold text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-800 bg-[#0b1520] px-4 text-xs text-slate-400">
        <span>Click an item on the plan to view details in the Inspector. Drag to pan. Scroll to zoom. Hold Shift to select multiple items.</span>
        <span className="hidden lg:inline">X: 152&apos;-3 1/2&quot; &nbsp;&nbsp; Y: 47&apos;-6 3/4&quot; &nbsp;&nbsp; | &nbsp;&nbsp; Grid: 1&apos;-0&quot; &nbsp;&nbsp; <span className="text-green-400">● Online</span></span>
      </footer>
    </div>
  );
};
