export type ProjectColor = {
  id: string;
  name: string;
  hex: string;
  hexLight: string;
};

export const PROJECT_COLORS: ProjectColor[] = [
  { id: 'coral',  name: 'Coral',  hex: '#F97316', hexLight: '#EA580C' },
  { id: 'teal',   name: 'Teal',   hex: '#14B8A6', hexLight: '#0D9488' },
  { id: 'green',  name: 'Green',  hex: '#10B981', hexLight: '#059669' },
  { id: 'purple', name: 'Purple', hex: '#A78BFA', hexLight: '#8B5CF6' },
  { id: 'pink',   name: 'Pink',   hex: '#EC4899', hexLight: '#DB2777' },
  { id: 'amber',  name: 'Amber',  hex: '#F59E0B', hexLight: '#D97706' },
  { id: 'cyan',   name: 'Cyan',   hex: '#06B6D4', hexLight: '#0891B2' },
  { id: 'indigo', name: 'Indigo', hex: '#818CF8', hexLight: '#6366F1' },
];

export function colorForProject(stableIndex: number): ProjectColor {
  return PROJECT_COLORS[stableIndex % PROJECT_COLORS.length];
}

export function initialFor(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? '';
  return first.charAt(0).toUpperCase() || '?';
}

export function projectColorVars(color: ProjectColor): Record<string, string> {
  const { hex } = color;
  return {
    '--chip-color': hex,
    '--chip-bg': withAlpha(hex, 0.12),
    '--chip-bg-hover': withAlpha(hex, 0.18),
    '--chip-border': withAlpha(hex, 0.30),
    '--chip-border-active': withAlpha(hex, 0.50),
    '--chip-glow': withAlpha(hex, 0.12),
  };
}

export function stableIndexForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
