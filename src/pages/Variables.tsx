import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, Check, X, Calculator } from 'lucide-react';
import { useVariables } from '../hooks/useVariables';
import type { ProjectVariable, ProjectVariableTable } from '../context/variablesContextInstance';

type EditingVariable = {
  tableId: string;
  variableId: string;
};

type NewVariableForm = {
  name: string;
  formula: string;
  unit: string;
  group: string;
  color: string;
};

const emptyForm = (): NewVariableForm => ({
  name: '',
  formula: '',
  unit: '',
  group: 'Default',
  color: '#64748b',
});

export const Variables: React.FC = () => {
  const {
    variableTables,
    addVariableTable,
    updateVariableTable,
    deleteVariableTable,
    addVariable,
    updateVariable,
    deleteVariable,
  } = useVariables();

  const [editing, setEditing] = useState<EditingVariable | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProjectVariable>>({});
  const [newForms, setNewForms] = useState<Record<string, NewVariableForm>>({});

  const getForm = (tableId: string) => newForms[tableId] || emptyForm();

  const updateNewForm = (tableId: string, patch: Partial<NewVariableForm>) => {
    setNewForms((prev) => ({
      ...prev,
      [tableId]: { ...getForm(tableId), ...patch },
    }));
  };

  const resetNewForm = (tableId: string) => {
    setNewForms((prev) => ({ ...prev, [tableId]: emptyForm() }));
  };

  const handleAdd = (tableId: string, e: React.FormEvent) => {
    e.preventDefault();
    const form = getForm(tableId);
    if (!form.name || !form.formula) return;

    addVariable(tableId, {
      name: form.name,
      formula: form.formula,
      value: 0, // Will be calculated by context
      unit: form.unit,
      group: form.group,
      color: form.color,
    });

    resetNewForm(tableId);
  };

  const startEdit = (tableId: string, variable: ProjectVariable) => {
    setEditing({ tableId, variableId: variable.id });
    setEditForm(variable);
  };

  const saveEdit = () => {
    if (editing && editForm.name && editForm.formula !== undefined) {
      updateVariable(editing.tableId, editing.variableId, {
        name: editForm.name,
        formula: editForm.formula,
        unit: editForm.unit,
        group: editForm.group,
        color: editForm.color,
      });
    }
    setEditing(null);
  };

  const groupedVariables = (table: ProjectVariableTable) => table.variables.reduce((acc, v) => {
    const group = v.group || 'Default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(v);
    return acc;
  }, {} as Record<string, ProjectVariable[]>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
            <Database className="text-blue-400" />
            Project Variables
          </h1>
          <p className="mt-2 text-slate-400">Create named variable tables and choose which tables are valid for calculation inputs.</p>
        </div>
        <button
          type="button"
          onClick={() => addVariableTable()}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      <div className="space-y-6">
        {variableTables.map((table) => {
          const form = getForm(table.id);
          const groups = groupedVariables(table);

          return (
            <div key={table.id} className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden ${!table.isEnabled ? 'opacity-80' : ''}`}>
              <div className="flex flex-col gap-3 bg-slate-900/50 border-b border-slate-700 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={table.isEnabled}
                      onChange={(e) => updateVariableTable(table.id, { isEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    Valid
                  </label>
                  <input
                    type="text"
                    value={table.name}
                    onChange={(e) => updateVariableTable(table.id, { name: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 sm:max-w-md"
                    aria-label="Variable table name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deleteVariableTable(table.id)}
                  className="inline-flex items-center justify-center gap-2 border border-red-800 text-red-400 hover:bg-red-900/20 rounded-md px-3 py-2 text-sm font-medium"
                >
                  <Trash2 size={15} /> Delete Table
                </button>
              </div>

              <div className="min-w-[860px]">
                <div className="grid grid-cols-12 gap-4 bg-slate-900 border-b border-slate-700 px-4 py-3 text-sm font-semibold text-slate-400">
                  <div className="col-span-3">Variable Name</div>
                  <div className="col-span-3">Formula / Equation</div>
                  <div className="col-span-2">Value</div>
                  <div className="col-span-1">Unit</div>
                  <div className="col-span-2">Group</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                <div className="divide-y divide-slate-700">
                  {Object.keys(groups).length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">No variables defined in this table.</div>
                  ) : (
                    Object.entries(groups).map(([groupName, groupVars]) => (
                      <div key={groupName} className="border-b border-slate-700 last:border-0">
                        <div className="bg-slate-900/30 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                          {groupName}
                        </div>
                        <div className="divide-y divide-slate-700">
                          {groupVars.map((v) => {
                            const isEditing = editing?.tableId === table.id && editing.variableId === v.id;

                            return (
                              <div key={v.id} className="grid grid-cols-12 items-center gap-4 p-4 text-sm transition-colors hover:bg-slate-700/30">
                                {isEditing ? (
                                  <>
                                    <div className="col-span-3 flex items-center gap-2">
                                      <input type="color" value={editForm.color || '#64748b'} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="h-6 w-6 cursor-pointer rounded border-0 p-0" />
                                      <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-3">
                                      <input type="text" value={editForm.formula || ''} onChange={(e) => setEditForm({ ...editForm, formula: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 font-mono text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-2 text-slate-500 italic">Auto</div>
                                    <div className="col-span-1">
                                      <input type="text" value={editForm.unit || ''} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-2">
                                      <input type="text" value={editForm.group || ''} onChange={(e) => setEditForm({ ...editForm, group: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-1">
                                      <button type="button" onClick={saveEdit} className="rounded p-1 text-green-400 hover:bg-green-900/30"><Check size={16} /></button>
                                      <button type="button" onClick={() => setEditing(null)} className="rounded p-1 text-slate-500 hover:bg-slate-700"><X size={16} /></button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="col-span-3 flex items-center gap-2">
                                      <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: v.color || '#64748b' }} />
                                      <div className="truncate font-mono font-medium text-blue-400" title={v.name}>{v.name}</div>
                                    </div>
                                    <div className="col-span-3 flex truncate font-mono text-slate-400" title={v.formula}>
                                      <span className="flex min-w-0 items-center gap-1 truncate">
                                        {v.formula?.startsWith('=') && <Calculator size={12} className="shrink-0 text-slate-500" />}
                                        {v.formula}
                                      </span>
                                    </div>
                                    <div className="col-span-2 inline-block w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 font-semibold text-slate-200">{v.value}</div>
                                    <div className="col-span-1 text-slate-500">{v.unit}</div>
                                    <div className="col-span-2 truncate text-slate-500">{v.group}</div>
                                    <div className="col-span-1 flex justify-end gap-1">
                                      <button type="button" onClick={() => startEdit(table.id, v)} className="rounded p-1 text-slate-500 hover:bg-blue-900/30 hover:text-blue-400"><Edit2 size={16} /></button>
                                      <button type="button" onClick={() => deleteVariable(table.id, v.id)} className="rounded p-1 text-slate-500 hover:bg-red-900/30 hover:text-red-400"><Trash2 size={16} /></button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => handleAdd(table.id, e)} className="grid grid-cols-12 items-center gap-4 bg-slate-900/50 border-t border-slate-700 p-4">
                  <div className="col-span-3 flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => updateNewForm(table.id, { color: e.target.value })} className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 p-0" title="Variable Color" />
                    <input type="text" placeholder="e.g. Span" value={form.name} onChange={(e) => updateNewForm(table.id, { name: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-3">
                    <input type="text" placeholder="e.g. 24 or =Span/2" value={form.formula} onChange={(e) => updateNewForm(table.id, { formula: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 font-mono text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2 px-2 text-sm italic text-slate-500">Auto-calculated</div>
                  <div className="col-span-1">
                    <input type="text" placeholder="Unit" value={form.unit} onChange={(e) => updateNewForm(table.id, { unit: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <input type="text" placeholder="Group" value={form.group} onChange={(e) => updateNewForm(table.id, { group: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="submit" disabled={!form.name || !form.formula} className="flex items-center gap-1 bg-blue-600 text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50">
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
