import React, { useState } from 'react';
import { StateTypeDefinition, BaseBehaviorDefinition } from '../types';
import { 
    Trash2, Plus, Edit2, Save, ArrowLeft, Check, Palette, AlertTriangle, 
    Box, FileText, Users, Cpu, GitBranch, CheckCircle2, Zap, Settings, Activity,
    MessageSquare, Mail, Shield, Clock, Database, Code, Terminal, Layout, List, Flag,
    User, Timer, Split, Layers, Command
} from 'lucide-react';

interface StateTypeManagerProps {
  types: StateTypeDefinition[];
  baseBehaviors: BaseBehaviorDefinition[];
  onSave: (type: StateTypeDefinition) => void;
  onDelete: (typeId: string) => void;
  onClose: () => void;
}

const COLORS = ['slate', 'red', 'orange', 'amber', 'emerald', 'teal', 'cyan', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

// Icon mapping (matching BaseBehaviorManager)
const RENDER_ICON = (iconName: string, size: number = 20) => {
     switch(iconName) {
         case 'FileText': return <FileText size={size}/>;
         case 'Users': return <Users size={size}/>;
         case 'Cpu': return <Cpu size={size}/>;
         case 'GitBranch': return <GitBranch size={size}/>;
         case 'CheckCircle2': return <CheckCircle2 size={size}/>;
         case 'Zap': return <Zap size={size}/>;
         case 'Settings': return <Settings size={size}/>;
         case 'Activity': return <Activity size={size}/>;
         case 'MessageSquare': return <MessageSquare size={size}/>;
         case 'Mail': return <Mail size={size}/>;
         case 'Shield': return <Shield size={size}/>;
         case 'Clock': return <Clock size={size}/>;
         case 'Database': return <Database size={size}/>;
         case 'Code': return <Code size={size}/>;
         case 'Terminal': return <Terminal size={size}/>;
         case 'Layout': return <Layout size={size}/>;
         case 'List': return <List size={size}/>;
         case 'Flag': return <Flag size={size}/>;
         case 'Box': return <Box size={size}/>;
         default: return <Box size={size}/>;
     }
};

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

  const getBehaviorIcon = (baseType: string, size: number = 20) => {
     const b = baseBehaviors.find(beh => beh.type === baseType);
     return RENDER_ICON(b?.icon || 'Box', size);
  };

  const getBehaviorName = (baseType: string) => {
      const b = baseBehaviors.find(beh => beh.type === baseType);
      return b ? b.name : baseType;
  };

  // --- Views ---

  const renderList = () => (
      <div className="flex flex-col h-full max-h-[75vh]">
        <div className="flex justify-between items-end mb-6 shrink-0 px-2">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">State Types</h2>
                <p className="text-sm text-slate-500 mt-1">Custom templates for your workflow nodes.</p>
            </div>
            <button 
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
                <Plus size={18} /> New Type
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-3">
                {types.map(t => (
                    <div 
                        key={t.type} 
                        className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            {/* Visual Preview */}
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center border-2 shadow-sm
                                bg-${t.color}-50 border-${t.color}-100 text-${t.color}-600
                            `}>
                                {getBehaviorIcon(t.baseType)}
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-800">{t.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{t.type}</span>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                        Inherits: <span className="font-semibold text-slate-700">{getBehaviorName(t.baseType)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEdit(t)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => handleStartDelete(t)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
  );

  const renderForm = () => (
      <div className="flex flex-col h-full">
         <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
             <button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                 <ArrowLeft size={20} />
             </button>
             <div>
                 <h2 className="text-xl font-bold text-slate-900">{activeItem ? 'Edit Type' : 'Create New Type'}</h2>
                 <p className="text-sm text-slate-500">Define visual style and functional behavior.</p>
             </div>
         </div>

         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-8">
             {/* General Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                    <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Email Notification"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unique Type ID</label>
                    <input 
                        required
                        type="text" 
                        value={formData.type}
                        onChange={e => setFormData(p => ({...p, type: e.target.value}))}
                        disabled={!!activeItem}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        placeholder="e.g. email_notification"
                    />
                </div>
             </div>

             {/* Base Behavior Selection */}
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Inherit Logic From</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto p-1">
                    {baseBehaviors.map(b => (
                        <div 
                            key={b.type}
                            onClick={() => setFormData(p => ({...p, baseType: b.type}))}
                            className={`
                                cursor-pointer flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                                ${formData.baseType === b.type 
                                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-200' 
                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className={`
                                p-2 rounded-lg 
                                ${formData.baseType === b.type ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                            `}>
                                {RENDER_ICON(b.icon, 18)}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-slate-800">{b.name}</div>
                                <div className="text-[10px] text-slate-500">{b.description || b.executionMode}</div>
                            </div>
                            {formData.baseType === b.type && <div className="ml-auto text-indigo-600"><CheckCircle2 size={16}/></div>}
                        </div>
                    ))}
                </div>
             </div>

             {/* Visual Styling */}
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Palette size={14}/> Visual Theme
                </label>
                <div className="flex flex-wrap gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setFormData(p => ({...p, color: c}))}
                            className={`
                                w-8 h-8 rounded-full shadow-sm transition-all flex items-center justify-center
                                bg-${c}-500 hover:scale-110 hover:shadow-md
                                ${formData.color === c ? 'ring-2 ring-offset-2 ring-indigo-400 scale-110' : ''}
                            `}
                            title={c}
                        >
                            {formData.color === c && <Check size={14} className="text-white font-bold"/>}
                        </button>
                    ))}
                </div>
             </div>

             {/* Preview Card */}
             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Preview</span>
                 
                 <div className={`
                     w-full max-w-xs bg-white rounded-xl border-2 p-4 shadow-sm
                     border-${formData.color}-200
                 `}>
                    <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-${formData.color}-50 text-${formData.color}-600 border border-${formData.color}-100`}>
                             {getBehaviorIcon(formData.baseType)}
                         </div>
                         <div className="text-left">
                             <div className="font-bold text-slate-800 text-sm">{formData.name || 'Type Name'}</div>
                             <div className={`text-[10px] font-bold uppercase tracking-wider text-${formData.color}-700`}>{formData.type || 'ID'}</div>
                         </div>
                    </div>
                 </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                <textarea 
                    value={formData.description || ''}
                    onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                    placeholder="Briefly describe what this state is used for..."
                />
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur pb-2">
                 <button 
                    type="button"
                    onClick={() => setView('list')}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                 >
                     Cancel
                 </button>
                 <button 
                    type="submit"
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                 >
                     <Save size={18} /> Save Type
                 </button>
             </div>
         </form>
      </div>
  );

  const renderDeleteConfirm = () => (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <AlertTriangle size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Delete State Type?</h3>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{activeItem?.name}"</span>?
              <br/><br/>
              <span className="text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg text-sm">
                  ⚠️ This might break existing workflows using "{activeItem?.type}"
              </span>
          </p>
          
          <div className="flex gap-4">
              <button 
                  onClick={() => setView('list')}
                  className="px-6 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                  Cancel
              </button>
              <button 
                  onClick={handleConfirmDelete}
                  className="px-6 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg hover:shadow-red-200 transition-all flex items-center gap-2"
              >
                  <Trash2 size={18} /> Yes, Delete It
              </button>
          </div>
      </div>
  );

  return (
    <div className="p-6 h-full min-h-[600px]">
        {view === 'list' && renderList()}
        {view === 'form' && renderForm()}
        {view === 'delete_confirm' && renderDeleteConfirm()}
        
        {view === 'list' && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
                <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600 font-medium transition-colors">Close Manager</button>
            </div>
        )}
    </div>
  );
}
