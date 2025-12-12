import React from 'react';
import { WorkflowState, StateTypeDefinition, CoreStateType, BaseBehaviorDefinition } from '../types';
import { 
  GitBranch, CheckCircle2, Users, Cpu, FileText, ArrowRight, Trash2, Edit, ShieldAlert,
  Box, Zap, Settings, Activity, MessageSquare, Mail, Shield, Clock, Database, Code, Terminal, Layout, List, Flag, User, Timer, Split, Layers, Command
} from 'lucide-react';

interface StateCardProps {
  id: string;
  state: WorkflowState;
  isStart?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isActive?: boolean;
  stateTypes?: StateTypeDefinition[];
  baseBehaviors?: BaseBehaviorDefinition[]; // New prop
}

// Minimal icon render helper (duplicated for isolated component usage)
const renderIcon = (iconName: string, className: string) => {
     const props = { className, size: 20 };
     switch(iconName) {
         case 'FileText': return <FileText {...props}/>;
         case 'Users': return <Users {...props}/>;
         case 'Cpu': return <Cpu {...props}/>;
         case 'GitBranch': return <GitBranch {...props}/>;
         case 'CheckCircle2': return <CheckCircle2 {...props}/>;
         case 'Zap': return <Zap {...props}/>;
         case 'Settings': return <Settings {...props}/>;
         case 'Activity': return <Activity {...props}/>;
         case 'MessageSquare': return <MessageSquare {...props}/>;
         case 'Mail': return <Mail {...props}/>;
         case 'Shield': return <Shield {...props}/>;
         case 'Clock': return <Clock {...props}/>;
         case 'Database': return <Database {...props}/>;
         case 'Code': return <Code {...props}/>;
         case 'Terminal': return <Terminal {...props}/>;
         case 'Layout': return <Layout {...props}/>;
         case 'List': return <List {...props}/>;
         case 'Flag': return <Flag {...props}/>;
         case 'Box': return <Box {...props}/>;
         default: return <Box {...props}/>;
     }
};

const StateCard: React.FC<StateCardProps> = ({ id, state, isStart, onEdit, onDelete, isActive, stateTypes, baseBehaviors }) => {
  
  // Resolve Definition and Base Type
  const typeDef = stateTypes?.find(t => t.type === state.type);
  const baseType: CoreStateType = typeDef?.baseType || 'task';
  const color = typeDef?.color || 'gray';

  const getIcon = () => {
    // Try to find icon from base behaviors first
    if (baseBehaviors) {
        const behavior = baseBehaviors.find(b => b.type === baseType);
        if (behavior && behavior.icon) {
            return renderIcon(behavior.icon, `w-5 h-5 text-${color}-600`);
        }
    }
    // Fallback based on hardcoded base types
    switch (baseType) {
      case 'parallel': return <GitBranch className={`w-5 h-5 text-${color}-600`} />;
      case 'decision': return <Cpu className={`w-5 h-5 text-${color}-600`} />;
      case 'system': return <CheckCircle2 className={`w-5 h-5 text-${color}-600`} />;
      case 'multi-approver': return <Users className={`w-5 h-5 text-${color}-600`} />;
      default: return <FileText className={`w-5 h-5 text-${color}-600`} />;
    }
  };

  const getBorderColor = () => {
    if (isActive) return 'border-indigo-500 ring-2 ring-indigo-200';
    return `border-gray-200 hover:border-${color}-300 hover:shadow-md`;
  };

  return (
    <div className={`bg-white rounded-lg border p-4 transition-all shadow-sm ${getBorderColor()}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 bg-${color}-50 rounded-md border border-${color}-100`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">{id}</h3>
            <div className="flex items-center gap-1.5">
                 <span className={`text-[10px] font-bold uppercase tracking-wider text-${color}-700`}>{typeDef?.name || state.type}</span>
                 {isStart && (
                    <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-white text-[10px] rounded-full font-bold">
                        START
                    </span>
                 )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button 
              onClick={() => onEdit(id)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 pl-1">
        
        {state.role && (
          <div className="text-xs text-gray-600 mt-2">
            <span className="font-medium text-gray-400">Assigned:</span> {state.role}
          </div>
        )}

        {state.next && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-dashed border-gray-100">
            <span>Next:</span>
            <span className="font-mono text-indigo-600 font-medium">{state.next}</span>
            <ArrowRight size={12} className="text-gray-300"/>
          </div>
        )}

        {state.onReject && (
          <div className="flex items-center gap-1 text-xs text-rose-500">
            <ShieldAlert size={12} />
            <span>Reject:</span>
            <span className="font-mono font-medium">{state.onReject}</span>
          </div>
        )}
        
        {state.branches && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-dashed border-gray-100">
             <span className="block mb-1 font-medium text-gray-400">Parallel Branches:</span>
             <div className="flex flex-wrap gap-1">
               {state.branches.map(b => (
                 <span key={b} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 font-mono">
                   {b}
                 </span>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateCard;
