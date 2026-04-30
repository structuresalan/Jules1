import React, { useState, type ReactNode } from 'react';
import { VariablesContext, type ProjectVariable } from './variablesContextInstance';

export const VariablesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [variables, setVariables] = useState<ProjectVariable[]>([
    { id: '1', name: 'Main_Span_L', value: 24, unit: 'ft' },
    { id: '2', name: 'Dead_Load', value: 50, unit: 'psf' }
  ]);

  const addVariable = (variable: Omit<ProjectVariable, 'id'>) => {
    const newVar = { ...variable, id: Math.random().toString(36).substr(2, 9) };
    setVariables([...variables, newVar]);
  };

  const updateVariable = (id: string, updatedFields: Partial<Omit<ProjectVariable, 'id'>>) => {
    setVariables(variables.map(v => v.id === id ? { ...v, ...updatedFields } : v));
  };

  const deleteVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id));
  };

  return (
    <VariablesContext.Provider value={{ variables, addVariable, updateVariable, deleteVariable }}>
      {children}
    </VariablesContext.Provider>
  );
};
