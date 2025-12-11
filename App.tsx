import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowState, TaskInstance } from './types';
import { INITIAL_WORKFLOWS, DEFAULT_DATA } from './constants';
import StateCard from './components/StateCard';
import StateEditor from './components/StateEditor';
import WorkflowRunner from './components/WorkflowRunner';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import WorkflowList from './components/WorkflowList';
import Modal from './components/Modal';
import { Zap, Play, Edit3, Plus, AlertTriangle, ChevronLeft, Eye } from 'lucide-react';

const NEW_WORKFLOW_TEMPLATE: WorkflowDefinition = {
    workflowId: '',
    name: '',
    version: 1,
    start: 'start_node',
    states: {
        'start_node': {
            type: 'task',
            role: 'admin',
            next: null
        }
    }
};

export default function App() {
  // --- Global App State ---
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(INITIAL_WORKFLOWS);
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // --- View Mode State ---
  const [mode, setMode] = useState<'editor' | 'runner' | 'visualizer'>('editor');
  
  // --- Editor State ---
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [isCreatingState, setIsCreatingState] = useState(false);
  const [deletingStateId, setDeletingStateId] = useState<string | null>(null);

  // --- CRUD/Modal State ---
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [editingWorkflowMeta, setEditingWorkflowMeta] = useState<Partial<WorkflowDefinition> | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);
  
  // Task Creation
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskWorkflowId, setNewTaskWorkflowId] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState(JSON.stringify(DEFAULT_DATA, null, 2));


  // Derived State
  const activeWorkflow = workflows.find(w => w.workflowId === activeWorkflowId);
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // --- Task Handlers ---

  const handleOpenCreateTask = (workflowId: string) => {
      setNewTaskWorkflowId(workflowId);
      setNewTaskData(JSON.stringify(DEFAULT_DATA, null, 2));
      setIsTaskModalOpen(true);
  };

  const handleConfirmCreateTask = () => {
      if (!newTaskWorkflowId) return;
      const wf = workflows.find(w => w.workflowId === newTaskWorkflowId);
      if (!wf) return;

      try {
          const parsedData = JSON.parse(newTaskData);
          const taskId = `TASK-${Math.floor(Math.random() * 10000)}`;
          
          const newTask: TaskInstance = {
              id: taskId,
              workflowId: wf.workflowId,
              workflowName: wf.name,
              status: 'running',
              data: parsedData,
              currentStates: [wf.start],
              history: [{
                  timestamp: new Date(),
                  stateId: 'START',
                  action: 'start',
                  details: `Started by user`
              }],
              parallelCompletion: {},
              createdAt: new Date(),
              updatedAt: new Date()
          };

          setTasks(prev => [newTask, ...prev]);
          setIsTaskModalOpen(false);
          
          // Auto open
          setActiveWorkflowId(wf.workflowId);
          setActiveTaskId(taskId);
          setMode('visualizer');

      } catch (e) {
          alert('Invalid JSON Data');
      }
  };

  const handleTaskUpdate = (updates: Partial<TaskInstance>) => {
      if (!activeTaskId) return;
      setTasks(prev => prev.map(t => {
          if (t.id === activeTaskId) {
              return { ...t, ...updates };
          }
          return t;
      }));
  };

  const handleSelectTask = (task: TaskInstance) => {
      setActiveWorkflowId(task.workflowId);
      setActiveTaskId(task.id);
      setMode('visualizer');
  };

  // --- Workflow CRUD Handlers ---

  const handleCreateWorkflow = () => {
    setEditingWorkflowMeta({ ...NEW_WORKFLOW_TEMPLATE, workflowId: '', name: '' });
    setIsWorkflowModalOpen(true);
  };

  const handleEditWorkflowMeta = (wf: WorkflowDefinition) => {
    setEditingWorkflowMeta({ ...wf });
    setIsWorkflowModalOpen(true);
  };

  const handleSaveWorkflowMeta = () => {
    if (!editingWorkflowMeta || !editingWorkflowMeta.workflowId || !editingWorkflowMeta.name) return;
    
    setWorkflows(prev => {
        const index = prev.findIndex(w => w.workflowId === editingWorkflowMeta.workflowId);
        const newWorkflows = [...prev];
        if (index >= 0) {
            newWorkflows[index] = { ...newWorkflows[index], ...editingWorkflowMeta } as WorkflowDefinition;
        } else {
            newWorkflows.push(editingWorkflowMeta as WorkflowDefinition);
        }
        return newWorkflows;
    });

    setIsWorkflowModalOpen(false);
    setEditingWorkflowMeta(null);
  };

  const handleDeleteWorkflow = () => {
     if (deletingWorkflowId) {
         setWorkflows(prev => prev.filter(w => w.workflowId !== deletingWorkflowId));
         setDeletingWorkflowId(null);
     }
  };


  // --- State CRUD Handlers ---

  const handleUpdateWorkflowStates = (newStates: Record<string, WorkflowState>) => {
    if (!activeWorkflowId) return;
    setWorkflows(prev => prev.map(w => {
        if (w.workflowId === activeWorkflowId) {
            return { ...w, states: newStates };
        }
        return w;
    }));
  };

  const handleUpdateWorkflowRoot = (updates: Partial<WorkflowDefinition>) => {
    if (!activeWorkflowId) return;
    setWorkflows(prev => prev.map(w => {
        if (w.workflowId === activeWorkflowId) {
            return { ...w, ...updates };
        }
        return w;
    }));
  }

  const confirmDeleteState = () => {
    if (deletingStateId && activeWorkflow) {
        const newStates = { ...activeWorkflow.states };
        delete newStates[deletingStateId];
        handleUpdateWorkflowStates(newStates);
        setDeletingStateId(null);
    }
  };

  const handleSaveState = (id: string, newState: WorkflowState) => {
    if (!activeWorkflow) return;
    const newStates = { ...activeWorkflow.states };
    if (editingStateId && editingStateId !== id) delete newStates[editingStateId];
    newStates[id] = newState;
    handleUpdateWorkflowStates(newStates);
    setEditingStateId(null);
    setIsCreatingState(false);
  };

  // --- Render Helpers ---

  const renderHeader = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {activeWorkflowId ? (
                 <button 
                   onClick={() => { setActiveWorkflowId(null); setActiveTaskId(null); }}
                   className="p-1.5 mr-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                 >
                     <ChevronLeft size={24} />
                 </button>
             ) : (
                <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
                    <Zap size={24} fill="currentColor" />
                </div>
             )}
            
            <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    {activeWorkflow ? activeWorkflow.name : 'SmartFlowMaster'}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                    {activeTask 
                        ? `Viewing Task: ${activeTask.id}` 
                        : (activeWorkflow ? `Editing: ${activeWorkflow.workflowId}` : 'Intelligent Process Automation')}
                </p>
            </div>
          </div>

          {activeWorkflow && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
                {!activeTask && (
                    <button
                        onClick={() => setMode('editor')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            mode === 'editor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <Edit3 size={16} /> Designer
                    </button>
                )}
                <button
                    onClick={() => setMode('visualizer')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'visualizer' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                    <Eye size={16} /> {activeTask ? 'Monitor Task' : 'Visualizer'}
                </button>
                {!activeTask && (
                    <button
                        onClick={() => setMode('runner')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            mode === 'runner' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <Play size={16} /> Simulator
                    </button>
                )}
            </div>
          )}
        </div>
      </header>
  );

  const renderActiveWorkflowView = () => {
    if (!activeWorkflow) return null;

    if (mode === 'runner') {
        return <WorkflowRunner workflow={activeWorkflow} initialData={DEFAULT_DATA} />;
    }

    if (mode === 'visualizer') {
        return (
            <WorkflowVisualizer 
                workflow={activeWorkflow} 
                initialTaskState={activeTask}
                onTaskUpdate={handleTaskUpdate}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
            {/* Editor Mode */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Workflow Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Workflow Name</label>
                        <input 
                            type="text" 
                            value={activeWorkflow.name}
                            onChange={(e) => handleUpdateWorkflowRoot({ name: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start State ID</label>
                        <select 
                            value={activeWorkflow.start}
                            onChange={(e) => handleUpdateWorkflowRoot({ start: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {Object.keys(activeWorkflow.states).map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">States ({Object.keys(activeWorkflow.states).length})</h2>
                    <button 
                        onClick={() => { setIsCreatingState(true); setEditingStateId(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm font-medium text-sm"
                    >
                        <Plus size={18} /> Add New State
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(activeWorkflow.states).map(([id, state]) => (
                        <StateCard 
                            key={id}
                            id={id}
                            state={state}
                            isStart={activeWorkflow.start === id}
                            onEdit={() => { setEditingStateId(id); setIsCreatingState(false); }}
                            onDelete={() => setDeletingStateId(id)}
                            isActive={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {renderHeader()}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {!activeWorkflow ? (
            <WorkflowList 
                workflows={workflows}
                tasks={tasks}
                onSelectWorkflow={(id) => { setActiveWorkflowId(id); setMode('editor'); }}
                onSelectTask={handleSelectTask}
                onCreate={handleCreateWorkflow}
                onEdit={handleEditWorkflowMeta}
                onDelete={setDeletingWorkflowId}
                onCreateTask={handleOpenCreateTask}
            />
        ) : (
            renderActiveWorkflowView()
        )}
      </main>

      {/* --- MODALS --- */}

      {/* 1. State Editor Modal */}
      <Modal 
        isOpen={isCreatingState || !!editingStateId} 
        onClose={() => { setEditingStateId(null); setIsCreatingState(false); }}
        maxWidth="max-w-3xl"
      >
        <StateEditor 
            id={editingStateId || ''}
            state={editingStateId && activeWorkflow ? activeWorkflow.states[editingStateId] : null}
            existingIds={activeWorkflow ? Object.keys(activeWorkflow.states) : []}
            onSave={handleSaveState}
            onCancel={() => { setEditingStateId(null); setIsCreatingState(false); }}
        />
      </Modal>

      {/* 2. Delete State Confirmation */}
      <Modal
        isOpen={!!deletingStateId}
        onClose={() => setDeletingStateId(null)}
        title="Delete State"
        maxWidth="max-w-md"
      >
        <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Delete State?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Permanently remove <span className="font-mono font-bold text-gray-800">"{deletingStateId}"</span>?
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => setDeletingStateId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={confirmDeleteState}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm"
                >
                    Delete State
                </button>
            </div>
        </div>
      </Modal>

      {/* 3. Workflow Metadata Modal */}
      <Modal
         isOpen={isWorkflowModalOpen}
         onClose={() => setIsWorkflowModalOpen(false)}
         title={editingWorkflowMeta?.workflowId ? "Edit Workflow" : "Create New Workflow"}
         maxWidth="max-w-lg"
      >
          <div className="p-6 space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                  <input 
                      type="text"
                      value={editingWorkflowMeta?.name || ''}
                      onChange={e => setEditingWorkflowMeta(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md text-white focus:ring-2 focus:ring-indigo-500"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workflow ID (Unique Key)</label>
                  <input 
                      type="text"
                      value={editingWorkflowMeta?.workflowId || ''}
                      onChange={e => setEditingWorkflowMeta(prev => ({ ...prev, workflowId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md text-white focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                      disabled={workflows.some(w => w.workflowId === editingWorkflowMeta?.workflowId) && !!editingWorkflowMeta?.states} 
                  />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsWorkflowModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSaveWorkflowMeta} disabled={!editingWorkflowMeta?.name || !editingWorkflowMeta?.workflowId} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                      {editingWorkflowMeta?.states ? 'Save Changes' : 'Create Workflow'}
                  </button>
              </div>
          </div>
      </Modal>

      {/* 4. Delete Workflow Confirmation */}
      <Modal
        isOpen={!!deletingWorkflowId}
        onClose={() => setDeletingWorkflowId(null)}
        title="Delete Workflow"
        maxWidth="max-w-md"
      >
        <div className="p-6">
            <p className="text-sm text-gray-500 mb-6">Permanently delete workflow "{deletingWorkflowId}"?</p>
            <div className="flex justify-end gap-3">
                <button onClick={() => setDeletingWorkflowId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
                <button onClick={handleDeleteWorkflow} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
            </div>
        </div>
      </Modal>

      {/* 5. Create Task Instance Modal */}
      <Modal
         isOpen={isTaskModalOpen}
         onClose={() => setIsTaskModalOpen(false)}
         title="Initialize New Task"
         maxWidth="max-w-lg"
      >
          <div className="p-6">
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Data (JSON)</label>
                  <textarea 
                    className="w-full h-40 p-3 text-black font-mono text-sm border rounded-md bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    value={newTaskData}
                    onChange={(e) => setNewTaskData(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">This data will start the workflow execution.</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
                  <button 
                    onClick={handleConfirmCreateTask}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm flex items-center gap-2"
                  >
                      <Play size={16} /> Start Task
                  </button>
              </div>
          </div>
      </Modal>

    </div>
  );
}