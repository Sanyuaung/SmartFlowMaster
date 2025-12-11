import React from 'react';
import { WorkflowDefinition } from '../types';
import { FileJson, Edit, Trash2, ArrowRight, Plus } from 'lucide-react';

interface WorkflowListProps {
  workflows: WorkflowDefinition[];
  onSelect: (id: string) => void;
  onEdit: (workflow: WorkflowDefinition) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ workflows, onSelect, onEdit, onDelete, onCreate }) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Your Workflows</h2>
           <p className="text-gray-500 mt-1">Manage and design your business processes</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Plus size={20} /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((wf) => (
          <div 
            key={wf.workflowId} 
            className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileJson size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(wf); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                      title="Edit Metadata"
                   >
                     <Edit size={16} />
                   </button>
                   <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(wf.workflowId); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete Workflow"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{wf.name}</h3>
              <p className="text-xs text-gray-500 font-mono mb-4 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{wf.workflowId}</p>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">States</span>
                    <span className="font-semibold">{Object.keys(wf.states).length}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Start</span>
                    <span className="font-semibold truncate max-w-[100px]">{wf.start}</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Version</span>
                    <span className="font-semibold">v{wf.version}</span>
                 </div>
              </div>
            </div>

            <div 
                onClick={() => onSelect(wf.workflowId)}
                className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
                <span className="text-sm font-medium">Open Designer</span>
                <ArrowRight size={16} />
            </div>
          </div>
        ))}
        
        {/* Empty State Helper */}
        {workflows.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-300">
                <div className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                    <FileJson size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No workflows found</h3>
                <p className="text-gray-500 mt-1 mb-6">Create your first workflow to get started.</p>
                <button 
                    onClick={onCreate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Create Workflow
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowList;