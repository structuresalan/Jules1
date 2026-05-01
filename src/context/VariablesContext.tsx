import React, { useState, type ReactNode } from 'react';
import { VariablesContext, type ProjectVariable } from './variablesContextInstance';

// Simple formula evaluator
const evaluateFormula = (formula: string, currentVariables: ProjectVariable[]): number => {
  if (!formula) return 0;
  
  let expression = formula;
  if (expression.startsWith('=')) {
    expression = expression.substring(1);
  }

  // Sort variables by length descending so we replace longest names first (avoids partial replacements)
  const sortedVars = [...currentVariables].sort((a, b) => b.name.length - a.name.length);

  sortedVars.forEach(v => {
    // Only replace whole words to avoid replacing part of a longer variable name
    const regex = new RegExp(`\\b${v.name}\\b`, 'g');
    expression = expression.replace(regex, v.value.toString());
  });

  try {
    // Basic safe eval using Function (since this is a client-side prototype)
    // In production, a math parser like mathjs should be used.
     
    const result = new Function(`return ${expression}`)();
    return Number.isFinite(result) ? Number(result.toFixed(4)) : 0;
  } catch (e) {
    console.warn("Formula evaluation failed", e);
    return 0;
  }
};

// Re-calculate all variable values based on their formulas
const calculateAllVariables = (vars: ProjectVariable[]): ProjectVariable[] => {
  // Deep clone to avoid mutating state directly
  const newVars = JSON.parse(JSON.stringify(vars)) as ProjectVariable[];
  
  // We'll iterate a few times to allow for variable dependencies
  for (let i = 0; i < 3; i++) {
    newVars.forEach(v => {
      if (v.formula) {
        v.value = evaluateFormula(v.formula, newVars);
      }
    });
  }
  return newVars;
};


export const VariablesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [variables, setVariables] = useState<ProjectVariable[]>([
    { id: '1', name: 'Main_Span_L', value: 24, formula: '24', unit: 'ft', group: 'Geometry', color: '#ef4444' },
    { id: '2', name: 'Dead_Load', value: 50, formula: '50', unit: 'psf', group: 'Loads', color: '#3b82f6' },
    { id: '3', name: 'Factored_Dead', value: 60, formula: '=1.2 * Dead_Load', unit: 'psf', group: 'Loads', color: '#8b5cf6' }
  ]);

  const addVariable = (variable: Omit<ProjectVariable, 'id'>) => {
    const newVar = { ...variable, id: Math.random().toString(36).substr(2, 9) };
    if (newVar.formula) {
      newVar.value = evaluateFormula(newVar.formula, variables);
    }
    const updatedVars = [...variables, newVar];
    setVariables(calculateAllVariables(updatedVars));
  };

  const updateVariable = (id: string, updatedFields: Partial<Omit<ProjectVariable, 'id'>>) => {
    const newVars = variables.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    setVariables(calculateAllVariables(newVars));
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
