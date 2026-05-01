import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, Check, X, Calculator } from 'lucide-react';
import { useVariables } from '../hooks/useVariables';
import type { ProjectVariable } from '../context/variablesContextInstance';

export const Variables: React.FC = () => {
  const { variables, addVariable, updateVariable, deleteVariable } = useVariables();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectVariable>>({});

  const [newName, setNewName] = useState('');
  const [newFormula, setNewFormula] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newGroup, setNewGroup] = useState('Default');
  const [newColor, setNewColor] = useState('#64748b');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newFormula) return;
    
    addVariable({
      name: newName,
      formula: newFormula,
      value: 0, // Will be calculated by context
      unit: newUnit,
      group: newGroup,
      color: newColor
    });
    
    setNewName('');
    setNewFormula('');
    setNewUnit('');
  };

  const startEdit = (variable: ProjectVariable) => {
    setEditingId(variable.id);
    setEditForm(variable);
  };

  const saveEdit = () => {
    if (editingId && editForm.name && editForm.formula !== undefined) {
      updateVariable(editingId, {
        name: editForm.name,
        formula: editForm.formula,
        unit: editForm.unit,
        group: editForm.group,
        color: editForm.color
      });
    }
    setEditingId(null);
  };

  // Group variables for display
  const groupedVariables = variables.reduce((acc, v) => {
    const group = v.group || 'Default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(v);
    return acc;
  }, {} as Record<string, ProjectVariable[]>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Database className="text-blue-600" />
            Project Variables
          </h1>
          <p className="mt-2 text-gray-500">Define global variables and formulas to reuse across calculation modules.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700 items-center">
          <div className="col-span-3">Variable Name</div>
          <div className="col-span-3">Formula / Equation</div>
          <div className="col-span-2">Value</div>
          <div className="col-span-1">Unit</div>
          <div className="col-span-2">Group</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Existing Variables by Group */}
        <div className="divide-y divide-gray-100">
          {Object.keys(groupedVariables).length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No variables defined yet.</div>
          ) : (
            Object.entries(groupedVariables).map(([groupName, groupVars]) => (
              <div key={groupName} className="border-b border-gray-100 last:border-0">
                <div className="px-4 py-2 bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {groupName}
                </div>
                <div className="divide-y divide-gray-100">
                  {groupVars.map((v) => (
                    <div key={v.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-gray-50 transition-colors">
                      {editingId === v.id ? (
                        <>
                          <div className="col-span-3 flex items-center gap-2">
                            <input type="color" value={editForm.color || '#64748b'} onChange={(e) => setEditForm({...editForm, color: e.target.value})} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border-gray-300 rounded p-1 text-sm" />
                          </div>
                          <div className="col-span-3">
                            <input type="text" value={editForm.formula || ''} onChange={(e) => setEditForm({...editForm, formula: e.target.value})} className="w-full border-gray-300 rounded p-1 text-sm font-mono" />
                          </div>
                          <div className="col-span-2 text-gray-400 italic">Auto</div>
                          <div className="col-span-1">
                            <input type="text" value={editForm.unit || ''} onChange={(e) => setEditForm({...editForm, unit: e.target.value})} className="w-full border-gray-300 rounded p-1 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <input type="text" value={editForm.group || ''} onChange={(e) => setEditForm({...editForm, group: e.target.value})} className="w-full border-gray-300 rounded p-1 text-sm" />
                          </div>
                          <div className="col-span-1 flex justify-end gap-1">
                            <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16}/></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded"><X size={16}/></button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-3 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.color || '#64748b' }}></div>
                            <div className="font-mono text-blue-800 font-medium truncate" title={v.name}>{v.name}</div>
                          </div>
                          <div className="col-span-3 font-mono text-gray-600 flex items-center gap-1 truncate" title={v.formula}>
                            {v.formula?.startsWith('=') && <Calculator size={12} className="text-gray-400 shrink-0" />}
                            {v.formula}
                          </div>
                          <div className="col-span-2 font-semibold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded inline-block w-full">{v.value}</div>
                          <div className="col-span-1 text-gray-500">{v.unit}</div>
                          <div className="col-span-2 text-gray-500 truncate">{v.group}</div>
                          <div className="col-span-1 flex justify-end gap-1">
                            <button onClick={() => startEdit(v)} className="p-1 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded"><Edit2 size={16}/></button>
                            <button onClick={() => deleteVariable(v.id)} className="p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded"><Trash2 size={16}/></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Row */}
        <form onSubmit={handleAdd} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-t border-gray-200 items-center">
          <div className="col-span-3 flex items-center gap-2">
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer shrink-0" title="Variable Color" />
            <input type="text" placeholder="e.g. Span" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-sm" />
          </div>
          <div className="col-span-3">
            <input type="text" placeholder="e.g. 24 or =Span/2" value={newFormula} onChange={(e) => setNewFormula(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-sm font-mono" />
          </div>
          <div className="col-span-2 text-gray-400 text-sm italic px-2">Auto-calculated</div>
          <div className="col-span-1">
            <input type="text" placeholder="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-sm" />
          </div>
          <div className="col-span-2">
            <input type="text" placeholder="Group" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} className="w-full border-gray-300 rounded-md p-2 text-sm" />
          </div>
          <div className="col-span-1 flex justify-end">
            <button type="submit" disabled={!newName || !newFormula} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Plus size={16} /> Add
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
