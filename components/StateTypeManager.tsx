import React, { useState } from 'react';
import { StateTypeDefinition, BaseBehaviorDefinition } from '../types';
import { Trash2, Plus, Edit2, Save, ArrowLeft, Check, Palette, AlertTriangle, Box, FileText, Users, Cpu, GitBranch, CheckCircle2, Zap, Settings, Activity } from 'lucide-react';

interface StateTypeManagerProps {
  types: StateTypeDefinition[];
  baseBehaviors: BaseBehaviorDefinition[];
  onSave: (type: StateTypeDefinition) => void;
  onDelete: (typeId: string) => void;
  onClose: () => void;
}

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

type ViewState = 'list' | 'form' | 'delete_confirm';

export default function StateTypeManager({ types, baseBehaviors, onSave, onDelete, onClose }: StateTypeManagerProps) {
  const [view, setView] = useState<ViewState>('list');
  const [activeItem, setActiveItem] = useState<StateTypeDefinition | null>(null);
  const [formData, setFormData] = useState<StateTypeDefinition>({
    type: '',
    name: '',
    baseType: 'task',
    color: 'indigo',
    description: ''
  });

  // --- Handlers ---
  const handleStartCreate = () => {
    setFormData({
      type: '',
      name: '',
      baseType: baseBehaviors[0]?.type || 'task',
      color: 'indigo',
      description: ''
    });
    setActiveItem(null);
    setView('form');
  };

  const handleStartEdit = (t: StateTypeDefinition) => {
    setFormData({ ...t });
    setActiveItem(t);
    setView('form');
  };

  const handleStartDelete = (t: StateTypeDefinition) => {
    setActiveItem(t);
    setView('delete_confirm');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.name) return;
    onSave(formData);
    setView('list');
  };

  const handleConfirmDelete = () => {
    if (activeItem) {
      onDelete(activeItem.type);
      setActiveItem(null);
      setView('list');
    }
  };

  const getBehaviorIcon = (baseType: string) => {
     const b = baseBehaviors.find(beh => beh.type === baseType);
     const iconName = b?.icon || 'Box';
     
     switch(iconName) {
         case 'FileText': return <FileText size={16}/>;
         case 'Users': return <Users size={16}/>;
         case 'Cpu': return <Cpu size={16}/>;
         case 'GitBranch': return <GitBranch size={16}/>;
         case 'CheckCircle2': return <CheckCircle2 size={16}/>;
         case 'Zap': return <Zap size={16}/>;
         case 'Settings': return <Settings size={16}/>;
         case 'Activity': return <Activity size={16}/>;
         default: return <Box size={16}/>;
     }
  };

  const getBehaviorName = (baseType: string) => {
      const b = baseBehaviors.find(beh => beh.type === baseType);
      return b ? b.name : baseType;
  };

  // --- Views ---

  const renderList = () => (
      <div className="flex flex-col h-full max-h-[70vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h2 className="text-xl font-bold text-gray-900">State Types</h2>
                <p className="text-sm text-gray-500">Manage custom workflow building blocks.</p>
            </div>
            <button 
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm transition-all"
            >
                <Plus size={16} /> Create Type
            </button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Definition</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inherited Behavior</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {types.map(t => (
                        <tr key={t.type} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-${t.color}-50 border-${t.color}-200 text-${t.color}-700 shadow-sm w-fit`}>
                                    {getBehaviorIcon(t.baseType)}
                                    <span className="text-xs font-bold uppercase">{t.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">{t.type}</span>
                                    {t.description && <span className="text-xs text-gray-400 mt-1 line-clamp-1">{t.description}</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {getBehaviorIcon(t.baseType)}
                                    <span className="capitalize">{getBehaviorName(t.baseType)}</span>
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-medium">
                                <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleStartEdit(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleStartDelete(t)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
  );

  const renderForm = () => (
      <div className="flex flex-col h-full">
         <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
             <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                 <ArrowLeft size={20} />
             </button>
             <div>
                 <h2 className="text-xl font-bold text-gray-900">{activeItem ? 'Edit Type' : 'Create New Type'}</h2>
                 <p className="text-sm text-gray-500">Define visual style and functional behavior.</p>
             </div>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID & Name */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input 
                            required
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g. Email Notification"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unique Identifier (Type ID)</label>
                        <input 
                            required
                            type="text" 
                            value={formData.type}
                            onChange={e => setFormData(p => ({...p, type: e.target.value}))}
                            disabled={!!activeItem}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 font-mono"
                            placeholder="e.g. email_notification"
                        />
                        <p className="text-xs text-gray-500 mt-1">Used in JSON definition. Cannot be changed after creation.</p>
                    </div>
                </div>

                {/* Base Type Selection (Dynamic) */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 overflow-y-auto max-h-[300px]">
                    <label className="block text-sm font-medium text-slate-900 mb-2">Base Behavior</label>
                    <div className="space-y-2">
                        {baseBehaviors.map(b => (
                            <label key={b.type} className="flex items-center gap-3 p-2 bg-white border rounded-md cursor-pointer hover:border-indigo-300 transition-colors">
                                <input 
                                    type="radio" 
                                    name="baseType" 
                                    value={b.type}
                                    checked={formData.baseType === b.type} 
                                    onChange={() => setFormData(p => ({...p, baseType: b.type}))}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex items-center gap-2">
                                    <div className="p-1 bg-gray-100 rounded text-gray-600">
                                        {getBehaviorIcon(b.type)}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900">{b.name}</span>
                                        <span className="block text-xs text-gray-500">{b.description || b.executionMode}</span>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
             </div>

             {/* Color Picker */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Palette size={16}/> Visual Theme
                </label>
                <div className="flex flex-wrap gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setFormData(p => ({...p, color: c}))}
                            className={`
                                w-8 h-8 rounded-full shadow-sm transition-all flex items-center justify-center
                                bg-${c}-500 hover:scale-110 hover:shadow-md
                                ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}
                            `}
                            title={c}
                        >
                            {formData.color === c && <Check size={14} className="text-white"/>}
                        </button>
                    ))}
                </div>
                {/* Preview */}
                <div className="mt-4 flex items-center gap-4">
                    <span className="text-xs text-gray-500 uppercase font-medium">Preview:</span>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 shadow-sm bg-${formData.color}-50 border-${formData.color}-200 text-${formData.color}-900`}>
                        {getBehaviorIcon(formData.baseType)}
                        <span className="text-sm font-bold uppercase tracking-wide">{formData.name || 'Type Name'}</span>
                    </div>
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea 
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-20"
                    placeholder="Briefly describe what this state is used for..."
                />
             </div>

             <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                 <button 
                    type="button"
                    onClick={() => setView('list')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                     Cancel
                 </button>
                 <button 
                    type="submit"
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm flex items-center gap-2"
                 >
                     <Save size={16} /> Save State Type
                 </button>
             </div>
         </form>
      </div>
  );

  const renderDeleteConfirm = () => (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Delete State Type?</h3>
          <p className="text-gray-500 max-w-sm mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-800">"{activeItem?.name}"</span>?
              <br/>
              <span className="text-red-600 text-sm mt-2 block bg-red-50 p-2 rounded">
                  Warning: Any existing workflow states using this type ("{activeItem?.type}") may break or display incorrectly.
              </span>
          </p>
          
          <div className="flex gap-4">
              <button 
                  onClick={() => setView('list')}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md transition-colors flex items-center gap-2"
              >
                  <Trash2 size={16} /> Yes, Delete It
              </button>
          </div>
      </div>
  );

  return (
    <div className="p-6 h-full min-h-[500px]">
        {view === 'list' && renderList()}
        {view === 'form' && renderForm()}
        {view === 'delete_confirm' && renderDeleteConfirm()}
        
        {view === 'list' && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900 font-medium">Close Manager</button>
            </div>
        )}
    </div>
  );
}
