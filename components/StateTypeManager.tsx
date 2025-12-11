import React, { useState } from 'react';
import { StateTypeDefinition, CoreStateType } from '../types';
import { Trash2, Plus, Edit2, Save, X, Palette, Info } from 'lucide-react';

interface StateTypeManagerProps {
  types: StateTypeDefinition[];
  onSave: (type: StateTypeDefinition) => void;
  onDelete: (typeId: string) => void;
  onClose: () => void;
}

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

export default function StateTypeManager({ types, onSave, onDelete, onClose }: StateTypeManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StateTypeDefinition>({
    type: '',
    name: '',
    baseType: 'task',
    color: 'indigo',
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const startEdit = (t: StateTypeDefinition) => {
    setFormData({ ...t });
    setEditingId(t.type);
    setIsCreating(false);
  };

  const startCreate = () => {
    setFormData({
      type: '',
      name: '',
      baseType: 'task',
      color: 'indigo',
      description: ''
    });
    setEditingId(null);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!formData.type || !formData.name) return;
    onSave(formData);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Delete state type "${id}"? States using this type may break.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-xl font-bold text-gray-900">Manage State Types</h2>
           <p className="text-sm text-gray-500">Define custom reusable state configurations.</p>
        </div>
        {!isCreating && !editingId && (
            <button 
                onClick={startCreate}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
            >
                <Plus size={16} /> Create Type
            </button>
        )}
      </div>

      {(isCreating || editingId) ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-4">
            <h3 className="font-semibold text-gray-800 border-b border-gray-200 pb-2">
                {isCreating ? 'Create New Type' : 'Edit Type'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Unique Key (ID)</label>
                    <input 
                        type="text" 
                        value={formData.type}
                        onChange={e => setFormData(p => ({...p, type: e.target.value}))}
                        disabled={!isCreating}
                        className="w-full px-3 py-2 border rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder="e.g. email_notification"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Display Name</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                        className="w-full px-3 py-2 border rounded text-sm"
                        placeholder="e.g. Email Notification"
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Base Behavior</label>
                    <select 
                        value={formData.baseType}
                        onChange={e => setFormData(p => ({...p, baseType: e.target.value as CoreStateType}))}
                        className="w-full text-gray-900 px-3 py-2 border rounded text-sm bg-white"
                    >
                        <option value="task">Task (User Action)</option>
                        <option value="multi-approver">Multi Approver (Group)</option>
                        <option value="parallel">Parallel (Branching)</option>
                        <option value="decision">Decision (Logic)</option>
                        <option value="system">System (Automated)</option>
                    </select>
                    <p className="text-[10px] text-gray-500 mt-1">Determines the execution logic and available fields.</p>
                </div>
                
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Theme Color</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white border rounded">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setFormData(p => ({...p, color: c}))}
                                className={`w-6 h-6 rounded-full bg-${c}-500 hover:scale-110 transition-transform ${formData.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                                title={c}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        value={formData.description || ''}
                        onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                        className="w-full px-3 py-2 border rounded text-sm h-20"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button 
                    onClick={() => { setIsCreating(false); setEditingId(null); }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-2"
                >
                    <Save size={14} /> Save Type
                </button>
            </div>
        </div>
      ) : null}

      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Behavior</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {types.map(t => (
                    <tr key={t.type} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900 text-sm">{t.name}</span>
                                <span className="text-xs text-gray-500 font-mono">{t.type}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                                {t.baseType}
                            </span>
                        </td>
                        <td className="px-4 py-3">
                            <div className={`w-4 h-4 rounded-full bg-${t.color}-500`} title={t.color}></div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                            <button onClick={() => startEdit(t)} className="text-indigo-600 hover:text-indigo-900 mx-2">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(t.type)} className="text-red-600 hover:text-red-900">
                                <Trash2 size={16} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-end">
         <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 underline">Close Manager</button>
      </div>
    </div>
  );
}