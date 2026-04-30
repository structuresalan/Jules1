import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useVariables } from '../hooks/useVariables';
import type { ProjectVariable } from '../context/variablesContextInstance';

export const Variables: React.FC = () => {
  const { variables, addVariable, updateVariable, deleteVariable } = useVariables();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectVariable>>({});

  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newValue) return;
    addVariable({
      name: newName,
      value: Number(newValue),
      unit: newUnit
    });
    setNewName('');
    setNewValue('');
    setNewUnit('');
  };

  const startEdit = (variable: ProjectVariable) => {
    setEditingId(variable.id);
    setEditForm(variable);
  };

  const saveEdit = () => {
    if (editingId && editForm.name && editForm.value !== undefined) {
      updateVariable(editingId, {
        name: editForm.name,
        value: Number(editForm.value),
        unit: editForm.unit
      });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Database className="text-blue-600" />
            Project Variables
          </h1>
          <p className="mt-2 text-gray-500">Define global variables to reuse across calculation modules.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          <div className="col-span-5">Variable Name</div>
          <div className="col-span-3">Value</div>
          <div className="col-span-2">Unit</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Existing Variables */}
        <div className="divide-y divide-gray-100">
          {variables.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No variables defined yet.</div>
          ) : (
            variables.map((v) => (
              <div key={v.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-gray-50 transition-colors">
                {editingId === v.id ? (
                  <>
                    <div className="col-span-5">
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full border-gray-300 rounded p-1 text-sm focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div className="col-span-3">
                      <input 
                        type="number" 
                        value={editForm.value} 
                        onChange={(e) => setEditForm({...editForm, value: Number(e.target.value)})}
                        className="w-full border-gray-300 rounded p-1 text-sm focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        type="text" 
                        value={editForm.unit} 
                        onChange={(e) => setEditForm({...editForm, unit: e.target.value})}
                        className="w-full border-gray-300 rounded p-1 text-sm focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16}/></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-200 rounded"><X size={16}/></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-5 font-mono text-blue-800 font-medium">{v.name}</div>
                    <div className="col-span-3 font-semibold text-gray-900">{v.value}</div>
                    <div className="col-span-2 text-gray-500">{v.unit}</div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={() => startEdit(v)} className="p-1 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => deleteVariable(v.id)} className="p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add New Row */}
        <form onSubmit={handleAdd} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-t border-gray-200 items-center">
          <div className="col-span-5">
            <input 
              type="text" 
              placeholder="e.g. Max_Span" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div className="col-span-3">
            <input 
              type="number" 
              placeholder="Value" 
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div className="col-span-2">
            <input 
              type="text" 
              placeholder="Unit" 
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <button 
              type="submit"
              disabled={!newName || !newValue}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
