import React, { useState } from 'react';
import { WorkflowDefinition, TaskInstance } from '../types';
import { FileJson, Edit, Trash2, ArrowRight, Plus, Activity, Clock, CheckCircle, XCircle, Play } from 'lucide-react';

interface WorkflowListProps {
  workflows: WorkflowDefinition[];
  tasks: TaskInstance[];
  onSelectWorkflow: (id: string) => void;
  onSelectTask: (task: TaskInstance) => void;
  onEdit: (workflow: WorkflowDefinition) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onCreateTask: (workflowId: string) => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ 
    workflows, tasks, onSelectWorkflow, onSelectTask, onEdit, onDelete, onCreate, onCreateTask 
}) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'tasks'>('workflows');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
           <p className="text-gray-500 mt-1">Manage definitions and track active tasks</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button 
                onClick={() => setActiveTab('workflows')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'workflows' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                Definitions
            </button>
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
                Running Tasks ({tasks.length})
            </button>
        </div>
      </div>

      {activeTab === 'workflows' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {/* Create New Card */}
            <div 
                onClick={onCreate}
                className="group border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all min-h-[200px]"
            >
                <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Plus size={24} className="text-indigo-600"/>
                </div>
                <span className="font-semibold text-gray-700">Create Workflow</span>
            </div>

            {workflows.map((wf) => (
            <div 
                key={wf.workflowId} 
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileJson size={24} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(wf); }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
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
                    
                    <button 
                        onClick={() => onCreateTask(wf.workflowId)}
                        className="w-full mt-2 py-2 border border-indigo-200 text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Play size={14} /> Run Instance
                    </button>
                </div>

                <div 
                    onClick={() => onSelectWorkflow(wf.workflowId)}
                    className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between cursor-pointer text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                    <span className="text-sm font-medium">Open Designer</span>
                    <ArrowRight size={16} />
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
            {tasks.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No active tasks</h3>
                    <p className="text-gray-500 mt-1">Start a workflow definition to see it here.</p>
                </div>
            )}
            
            {tasks.map(task => (
                <div 
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                            task.status === 'completed' ? 'bg-green-100 text-green-600' :
                            task.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-indigo-100 text-indigo-600 animate-pulse'
                        }`}>
                            {task.status === 'completed' ? <CheckCircle size={20}/> :
                             task.status === 'rejected' ? <XCircle size={20}/> :
                             <Activity size={20}/>}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-800">{task.id}</h3>
                                <span className="text-xs text-gray-500 font-normal">({task.workflowName})</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
                                <span>Status: <span className="capitalize font-medium text-gray-700">{task.status}</span></span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1"><Clock size={12}/> Updated: {task.updatedAt.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
                        Visualize <ArrowRight size={16} />
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;