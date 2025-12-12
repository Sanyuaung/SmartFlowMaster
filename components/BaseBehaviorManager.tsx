import React, { useState } from 'react';
import { BaseBehaviorDefinition, ExecutionMode } from '../types';
import { 
    Trash2, Plus, Edit2, Save, ArrowLeft, AlertTriangle, 
    FileText, Users, Cpu, GitBranch, CheckCircle2, Box, Zap, Settings, Activity,
    MessageSquare, Mail, Shield, Clock, Database, Code, Terminal, Layout, List, Flag,
    User, Timer, Split, Layers, Command
} from 'lucide-react';

interface BaseBehaviorManagerProps {
  behaviors: BaseBehaviorDefinition[];
  onSave: (behavior: BaseBehaviorDefinition) => void;
  onDelete: (typeId: string) => void;
  onClose: () => void;
}

// Extended Icon Options
const ICON_OPTIONS = [
  { name: 'FileText', icon: <FileText size={20}/> },
  { name: 'Users', icon: <Users size={20}/> },
  { name: 'Cpu', icon: <Cpu size={20}/> },
  { name: 'GitBranch', icon: <GitBranch size={20}/> },
  { name: 'CheckCircle2', icon: <CheckCircle2 size={20}/> },
  { name: 'Box', icon: <Box size={20}/> },
  { name: 'Zap', icon: <Zap size={20}/> },
  { name: 'Settings', icon: <Settings size={20}/> },
  { name: 'Activity', icon: <Activity size={20}/> },
  { name: 'MessageSquare', icon: <MessageSquare size={20}/> },
  { name: 'Mail', icon: <Mail size={20}/> },
  { name: 'Shield', icon: <Shield size={20}/> },
  { name: 'Clock', icon: <Clock size={20}/> },
  { name: 'Database', icon: <Database size={20}/> },
  { name: 'Code', icon: <Code size={20}/> },
  { name: 'Terminal', icon: <Terminal size={20}/> },
  { name: 'Layout', icon: <Layout size={20}/> },
  { name: 'List', icon: <List size={20}/> },
  { name: 'Flag', icon: <Flag size={20}/> },
];

type ViewState = 'list' | 'form' | 'delete_confirm';

export default function BaseBehaviorManager({ behaviors, onSave, onDelete, onClose }: BaseBehaviorManagerProps) {
  const [view, setView] = useState<ViewState>('list');
  const [activeItem, setActiveItem] = useState<BaseBehaviorDefinition | null>(null);
  
  const [formData, setFormData] = useState<BaseBehaviorDefinition>({
    type: '',
    name: '',
    executionMode: 'interactive',
    icon: 'Box',
    description: '',
    hasRole: false,
    hasSla: false,
    hasActionConfig: false,
    hasConditions: false,
    hasBranches: false
  });

  // --- Handlers ---
  const handleStartCreate = () => {
    setFormData({
        type: '',
        name: '',
        executionMode: 'interactive',
        icon: 'Box',
        description: '',
        hasRole: false,
        hasSla: false,
        hasActionConfig: false,
        hasConditions: false,
        hasBranches: false
    });
    setActiveItem(null);
    setView('form');
  };

  const handleStartEdit = (item: BaseBehaviorDefinition) => {
    setFormData({ ...item });
    setActiveItem(item);
    setView('form');
  };

  const handleStartDelete = (item: BaseBehaviorDefinition) => {
    setActiveItem(item);
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

  const renderIcon = (iconName: string) => {
      const found = ICON_OPTIONS.find(i => i.name === iconName);
      return found ? found.icon : <Box size={20}/>;
  };

  // --- Views ---

  const renderList = () => (
      <div className="flex flex-col h-full max-h-[75vh]">
        <div className="flex justify-between items-end mb-6 shrink-0 px-2">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Base Behaviors</h2>
                <p className="text-sm text-slate-500 mt-1">Foundational logic blocks for your workflow engine.</p>
            </div>
            <button 
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
                <Plus size={18} /> New Behavior
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-3">
                {behaviors.map(b => (
                    <div 
                        key={b.type} 
                        className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-12 h-12 rounded-lg flex items-center justify-center text-slate-700
                                ${b.executionMode === 'interactive' ? 'bg-blue-50 text-blue-600' : 
                                  b.executionMode === 'automated' ? 'bg-slate-100 text-slate-600' :
                                  b.executionMode === 'decision' ? 'bg-emerald-50 text-emerald-600' : 
                                  'bg-purple-50 text-purple-600'}
                            `}>
                                {renderIcon(b.icon)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{b.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{b.type}</span>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded
                                         ${b.executionMode === 'interactive' ? 'text-blue-600 bg-blue-50' : 
                                          b.executionMode === 'automated' ? 'text-slate-600 bg-slate-100' :
                                          b.executionMode === 'decision' ? 'text-emerald-600 bg-emerald-50' : 
                                          'text-purple-600 bg-purple-50'}
                                    `}>
                                        {b.executionMode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="hidden md:flex gap-1">
                                {b.hasRole && <div title="Role Assignment" className="p-1.5 bg-slate-50 text-slate-400 rounded-md"><User size={14}/></div>}
                                {b.hasSla && <div title="SLA Support" className="p-1.5 bg-slate-50 text-slate-400 rounded-md"><Timer size={14}/></div>}
                                {b.hasConditions && <div title="Conditions" className="p-1.5 bg-slate-50 text-slate-400 rounded-md"><Split size={14}/></div>}
                                {b.hasBranches && <div title="Branching" className="p-1.5 bg-slate-50 text-slate-400 rounded-md"><Layers size={14}/></div>}
                                {b.hasActionConfig && <div title="System Action" className="p-1.5 bg-slate-50 text-slate-400 rounded-md"><Terminal size={14}/></div>}
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleStartEdit(b)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleStartDelete(b)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
  );

  const CapabilityCard = ({ 
      label, 
      description, 
      checked, 
      onChange, 
      icon: Icon 
  }: { label: string, description: string, checked: boolean, onChange: (val: boolean) => void, icon: any }) => (
      <div 
          onClick={() => onChange(!checked)}
          className={`
            cursor-pointer relative flex items-start gap-3 p-3 rounded-xl border-2 transition-all
            ${checked 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
            }
          `}
      >
          <div className={`
              mt-0.5 p-1.5 rounded-lg transition-colors
              ${checked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}
          `}>
              <Icon size={16} />
          </div>
          <div className="flex-1">
              <div className="flex justify-between items-center mb-0.5">
                  <span className={`text-sm font-bold ${checked ? 'text-indigo-900' : 'text-slate-700'}`}>{label}</span>
                  {checked && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">{description}</p>
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
                 <h2 className="text-xl font-bold text-slate-900">{activeItem ? 'Edit Behavior' : 'Create Behavior'}</h2>
                 <p className="text-sm text-slate-500">Configure fundamental execution logic.</p>
             </div>
         </div>

         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-8">
             
             {/* General Info */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Behavior Name</label>
                        <input 
                            required
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Sequential Task"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Unique Type ID</label>
                        <input 
                            required
                            type="text" 
                            value={formData.type}
                            onChange={e => setFormData(p => ({...p, type: e.target.value}))}
                            disabled={!!activeItem}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-slate-100 disabled:text-slate-400 transition-all"
                            placeholder="e.g. seq_task"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Execution Mode</label>
                        <select 
                            value={formData.executionMode}
                            onChange={e => setFormData(p => ({...p, executionMode: e.target.value as ExecutionMode}))}
                            className="w-full text-gray-900 px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="interactive">Interactive (User Input Required)</option>
                            <option value="automated">Automated (System Process)</option>
                            <option value="decision">Decision (Conditional Logic)</option>
                            <option value="parallel">Parallel (Split Execution)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                            Defines the runtime lifecycle. <b>Interactive</b> waits for humans. <b>Automated</b> runs instantly. <b>Decision</b> evaluates rules.
                        </p>
                    </div>
                </div>
             </div>

             {/* Capabilities */}
             <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Editor Capabilities</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     <CapabilityCard 
                        label="User Assignment" 
                        description="Enable Role/User fields" 
                        icon={User}
                        checked={!!formData.hasRole} 
                        onChange={(v) => setFormData(p => ({...p, hasRole: v}))}
                     />
                     <CapabilityCard 
                        label="SLA & Timers" 
                        description="Enable Timeout/Duration fields" 
                        icon={Timer}
                        checked={!!formData.hasSla} 
                        onChange={(v) => setFormData(p => ({...p, hasSla: v}))}
                     />
                     <CapabilityCard 
                        label="Conditional Logic" 
                        description="Enable If/Else rule builder" 
                        icon={Split}
                        checked={!!formData.hasConditions} 
                        onChange={(v) => setFormData(p => ({...p, hasConditions: v}))}
                     />
                     <CapabilityCard 
                        label="Parallel Branches" 
                        description="Enable multi-path config" 
                        icon={Layers}
                        checked={!!formData.hasBranches} 
                        onChange={(v) => setFormData(p => ({...p, hasBranches: v}))}
                     />
                     <CapabilityCard 
                        label="System Action" 
                        description="Enable Function/Method input" 
                        icon={Command}
                        checked={!!formData.hasActionConfig} 
                        onChange={(v) => setFormData(p => ({...p, hasActionConfig: v}))}
                     />
                 </div>
             </div>

             {/* Icon Selection */}
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visual Icon</label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    {ICON_OPTIONS.map(opt => (
                        <button
                            key={opt.name}
                            type="button"
                            onClick={() => setFormData(p => ({...p, icon: opt.name}))}
                            className={`
                                p-2.5 rounded-lg transition-all transform hover:scale-105
                                ${formData.icon === opt.name 
                                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 ring-offset-2' 
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                }
                            `}
                            title={opt.name}
                        >
                            {opt.icon}
                        </button>
                    ))}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur pb-2">
                 <button onClick={() => setView('list')} type="button" className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                 <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                     <Save size={18} /> Save Behavior
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
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Delete Behavior?</h3>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">"{activeItem?.name}"</span>?
              <br/><br/>
              <span className="text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg text-sm">
                  ⚠️ This will break any States using "{activeItem?.type}"
              </span>
          </p>
          <div className="flex gap-4">
              <button onClick={() => setView('list')} className="px-6 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-6 py-3 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-lg hover:shadow-red-200 transition-all">Yes, Delete It</button>
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