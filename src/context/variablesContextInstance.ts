import { createContext } from 'react';

export interface ProjectVariable {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface VariablesContextType {
  variables: ProjectVariable[];
  addVariable: (variable: Omit<ProjectVariable, 'id'>) => void;
  updateVariable: (id: string, variable: Partial<Omit<ProjectVariable, 'id'>>) => void;
  deleteVariable: (id: string) => void;
}

export const VariablesContext = createContext<VariablesContextType | undefined>(undefined);
