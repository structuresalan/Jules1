import { createContext } from 'react';

export interface ProjectVariable {
  id: string;
  name: string;
  value: number; // The dynamically calculated or static value
  formula?: string; // e.g. "=12*2" or "=Main_Span / 2"
  unit: string;
  group: string;
  color?: string; // Hex color code
}

export interface VariablesContextType {
  variables: ProjectVariable[];
  addVariable: (variable: Omit<ProjectVariable, 'id'>) => void;
  updateVariable: (id: string, variable: Partial<Omit<ProjectVariable, 'id'>>) => void;
  deleteVariable: (id: string) => void;
}

export const VariablesContext = createContext<VariablesContextType | undefined>(undefined);
