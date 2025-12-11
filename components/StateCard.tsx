import React from 'react';
import { WorkflowState } from '../types';
import { 
  GitBranch, 
  CheckCircle2, 
  Users, 
  Cpu, 
  FileText, 
  ArrowRight,
  Trash2,
  Edit,
  ShieldAlert
} from 'lucide-react';

interface StateCardProps {
  id: string;
  state: WorkflowState;
  isStart?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isActive?: boolean;
}

const StateCard: React.FC<StateCardProps> = ({ id, state, isStart, onEdit, onDelete, isActive }) => {
  const getIcon = () => {
    switch (state.type) {
      case 'parallel': return <GitBranch className="w-5 h-5 text-purple-500" />;
      case 'decision': return <Cpu className="w-5 h-5 text-orange-500" />;
      case 'system': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'multi-approver': return <Users className="w-5 h-5 text-blue-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    if (isActive) return 'border-blue-500 ring-2 ring-blue-200';
    return 'border-gray-200 hover:border-blue-300';
  };

  return (
    <div className={`bg-white rounded-lg border p-4 transition-all shadow-sm ${getBorderColor()}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gray-50 rounded-md">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-800">{id}</h3>
            <span className="text-xs text-gray-500 uppercase tracking-wider">{state.type}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button 
              onClick={() => onEdit(id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {isStart && (
          <div className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium mb-1">
            Start Node
          </div>
        )}
        
        {state.role && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">Role:</span> {state.role}
          </div>
        )}

        {state.next && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-dashed">
            <span>Next:</span>
            <span className="font-mono text-blue-600">{state.next}</span>
            <ArrowRight size={12} />
          </div>
        )}

        {state.onReject && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <ShieldAlert size={12} />
            <span>On Reject:</span>
            <span className="font-mono font-medium">{state.onReject}</span>
            <ArrowRight size={12} />
          </div>
        )}
        
        {state.branches && (
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-dashed">
             <span className="block mb-1">Branches:</span>
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