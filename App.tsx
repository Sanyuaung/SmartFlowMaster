import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowState, TaskInstance, StateTypeDefinition, BaseBehaviorDefinition } from './types';
import { INITIAL_WORKFLOWS, DEFAULT_DATA, DEFAULT_STATE_TYPES, DEFAULT_BASE_BEHAVIORS } from './constants';
import StateCard from './components/StateCard';
import StateEditor from './components/StateEditor';
import WorkflowRunner from './components/WorkflowRunner';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import WorkflowList from './components/WorkflowList';
import Modal from './components/Modal';
import StateTypeManager from './components/StateTypeManager';
import BaseBehaviorManager from './components/BaseBehaviorManager';
import HelpGuide from './components/HelpGuide';
import { Zap, Play, Edit3, Plus, AlertTriangle, ChevronLeft, Eye, Settings, BookOpen, Layers, Blocks } from 'lucide-react';

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
  const [stateTypes, setStateTypes] = useState<StateTypeDefinition[]>(DEFAULT_STATE_TYPES);
  const [baseBehaviors, setBaseBehaviors] = useState<BaseBehaviorDefinition[]>(DEFAULT_BASE_BEHAVIORS);
  
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
  
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [isBehaviorManagerOpen, setIsBehaviorManagerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Task Creation
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState(JSON.stringify(DEFAULT_DATA, null, 2));


  // Derived State
  const activeWorkflow = workflows.find(w => w.workflowId === activeWorkflowId);
  const activeTask = tasks.find(t => t.id === activeTaskId);

  // --- State Type Handlers ---
  const handleSaveStateType = (newType: StateTypeDefinition) => {
      setStateTypes(prev => {
          const exists = prev.some(t => t.type === newType.type);
          if (exists) return prev.map(t => t.type === newType.type ? newType : t);
          return [...prev, newType];
      });
  };

  const handleDeleteStateType = (typeId: string) => {
      setStateTypes(prev => prev.filter(t => t.type !== typeId));
  };

  // --- Base Behavior Handlers ---
  const handleSaveBaseBehavior = (newBehavior: BaseBehaviorDefinition) => {
      setBaseBehaviors(prev => {
          const exists = prev.some(b => b.type === newBehavior.type);
          if (exists) return prev.map(b => b.type === newBehavior.type ? newBehavior : b);
          return [...prev, newBehavior];
      });
  };

  const handleDeleteBaseBehavior = (typeId: string) => {
      setBaseBehaviors(prev => prev.filter(b => b.type !== typeId));
  };


  // --- Task Handlers ---

  const handleOpenCreateTask = () => {
      const template = {
          workflow_id: "txn_maker_checker_v1",
          ...DEFAULT_DATA
      };
      setNewTaskData(JSON.stringify(template, null, 2));
      setIsTaskModalOpen(true);
  };

  const handleConfirmCreateTask = () => {
      try {
          const parsedData = JSON.parse(newTaskData);
          const targetWorkflowId = parsedData.workflow_id || parsedData.workflowId;

          if (!targetWorkflowId) {
              alert('Error: Payload must contain a "workflow_id" field.');
              return;
          }

          const wf = workflows.find(w => w.workflowId === targetWorkflowId);
          if (!wf) {
              alert(`Error: Workflow with ID "${targetWorkflowId}" not found.`);
              return;
          }

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
                  details: `Started via payload`
              }],
              parallelCompletion: {},
              createdAt: new Date(),
              updatedAt: new Date()
          };

          setTasks(prev => [newTask, ...prev]);
          setIsTaskModalOpen(false);
          setActiveWorkflowId(wf.workflowId);
          setActiveTaskId(taskId);
          setMode('visualizer');

      } catch (e) {
          alert('Invalid JSON Data');
      }
  };

  const handleTaskUpdate = (updates: Partial<TaskInstance>) => {
      if (!activeTaskId) return;
      setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, ...updates } : t));
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
    setWorkflows(prev => prev.map(w => w.workflowId === activeWorkflowId ? { ...w, states: newStates } : w));
  };

  const handleUpdateWorkflowRoot = (updates: Partial<WorkflowDefinition>) => {
    if (!activeWorkflowId) return;
    setWorkflows(prev => prev.map(w => w.workflowId === activeWorkflowId ? { ...w, ...updates } : w));
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {activeWorkflowId ? (
                 <button 
                   onClick={() => { setActiveWorkflowId(null); setActiveTaskId(null); }}
                   className="p-1.5 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                 >
                     <ChevronLeft size={24} />
                 </button>
             ) : (
                <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                    <Blocks size={22} strokeWidth={2.5} />
                </div>
             )}
            
            <div className="flex flex-col justify-center">
                <h1 className="text-xl font-extrabold text-slate-900 leading-none tracking-tight">
                    {activeWorkflow ? activeWorkflow.name : 'SmartFlow'}
                    {!activeWorkflow && <span className="text-indigo-600">Master</span>}
                </h1>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-1">
                    {activeTask 
                        ? `Viewing Task: ${activeTask.id}` 
                        : (activeWorkflow ? `ID: ${activeWorkflow.workflowId}` : 'Workflow Engine v2.0')}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!activeWorkflow && (
                <>
                <button
                    onClick={() => setIsBehaviorManagerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                    title="Manage Base Behaviors"
                >
                    <Layers size={18} className="text-indigo-500" /> 
                    <span className="hidden sm:inline">Behaviors</span>
                </button>
                <button
                    onClick={() => setIsTypeManagerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
                    title="Manage State Types"
                >
                    <Settings size={18} className="text-slate-500" />
                    <span className="hidden sm:inline">Types</span>
                </button>
                </>
            )}

            {activeWorkflow && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    {!activeTask && (
                        <button
                            onClick={() => setMode('editor')}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                mode === 'editor' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            <Edit3 size={16} /> <span className="hidden sm:inline">Designer</span>
                        </button>
                    )}
                    <button
                        onClick={() => setMode('visualizer')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            mode === 'visualizer' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        <Eye size={16} /> <span className="hidden sm:inline">{activeTask ? 'Monitor' : 'Visualizer'}</span>
                    </button>
                    {!activeTask && (
                        <button
                            onClick={() => setMode('runner')}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                mode === 'runner' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                        >
                            <Play size={16} /> <span className="hidden sm:inline">Simulator</span>
                        </button>
                    )}
                </div>
            )}
            
            <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center justify-center w-9 h-9 ml-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 transition-all"
                title="Open Guide"
            >
                <BookOpen size={18} />
            </button>
          </div>
        </div>
      </header>
  );

  const renderActiveWorkflowView = () => {
    if (!activeWorkflow) return null;

    if (mode === 'runner') {
        return (
            <WorkflowRunner 
                workflow={activeWorkflow} 
                initialData={DEFAULT_DATA} 
                stateTypes={stateTypes}
                baseBehaviors={baseBehaviors} // Pass behaviors
            />
        );
    }

    if (mode === 'visualizer') {
        return (
            <WorkflowVisualizer 
                workflow={activeWorkflow} 
                initialTaskState={activeTask}
                onTaskUpdate={handleTaskUpdate}
                stateTypes={stateTypes}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto animate-in fade-in duration-300">
            {/* Editor Mode */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Workflow Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow Name</label>
                        <input 
                            type="text" 
                            value={activeWorkflow.name}
                            onChange={(e) => handleUpdateWorkflowRoot({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start State</label>
                        <select 
                            value={activeWorkflow.start}
                            onChange={(e) => handleUpdateWorkflowRoot({ start: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {Object.keys(activeWorkflow.states).map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">States Definition</h2>
                        <p className="text-sm text-slate-500">Total: {Object.keys(activeWorkflow.states).length} states</p>
                    </div>
                    <button 
                        onClick={() => { setIsCreatingState(true); setEditingStateId(null); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-bold text-sm"
                    >
                        <Plus size={18} /> Add State
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
                            stateTypes={stateTypes}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
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

      {/* Base Behavior Manager */}
      <Modal
        isOpen={isBehaviorManagerOpen}
        onClose={() => setIsBehaviorManagerOpen(false)}
        maxWidth="max-w-4xl"
      >
        <BaseBehaviorManager
            behaviors={baseBehaviors}
            onSave={handleSaveBaseBehavior}
            onDelete={handleDeleteBaseBehavior}
            onClose={() => setIsBehaviorManagerOpen(false)}
        />
      </Modal>

      {/* Type Manager Modal */}
      <Modal
        isOpen={isTypeManagerOpen}
        onClose={() => setIsTypeManagerOpen(false)}
        maxWidth="max-w-4xl"
      >
        <StateTypeManager 
            types={stateTypes} 
            baseBehaviors={baseBehaviors}
            onSave={handleSaveStateType} 
            onDelete={handleDeleteStateType}
            onClose={() => setIsTypeManagerOpen(false)}
        />
      </Modal>

      {/* State Editor Modal */}
      <Modal 
        isOpen={isCreatingState || !!editingStateId} 
        onClose={() => { setEditingStateId(null); setIsCreatingState(false); }}
        maxWidth="max-w-3xl"
      >
        <StateEditor 
            id={editingStateId || ''}
            state={editingStateId && activeWorkflow ? activeWorkflow.states[editingStateId] : null}
            existingIds={activeWorkflow ? Object.keys(activeWorkflow.states) : []}
            stateTypes={stateTypes}
            baseBehaviors={baseBehaviors} // Pass definitions
            onSave={handleSaveState}
            onCancel={() => { setEditingStateId(null); setIsCreatingState(false); }}
        />
      </Modal>

      {/* ... (Other Modals: Delete State, Workflow Meta, Delete Workflow, Task, Help) ... */}
      <Modal
        isOpen={!!deletingStateId}
        onClose={() => setDeletingStateId(null)}
        title="Delete State"
        maxWidth="max-w-md"
      >
        <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
                <div className="bg-red-50 p-3 rounded-full text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-lg">Delete State?</h3>
                    <p className="text-slate-500 mt-1">
                        Permanently remove <span className="font-mono font-bold text-slate-800">"{deletingStateId}"</span>?
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setDeletingStateId(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDeleteState} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm">Delete State</button>
            </div>
        </div>
      </Modal>

      <Modal
         isOpen={isWorkflowModalOpen}
         onClose={() => setIsWorkflowModalOpen(false)}
         title={editingWorkflowMeta?.workflowId ? "Edit Workflow" : "Create New Workflow"}
         maxWidth="max-w-lg"
      >
          <div className="p-6 space-y-5">
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow Name</label>
                  <input 
                      type="text"
                      value={editingWorkflowMeta?.name || ''}
                      onChange={e => setEditingWorkflowMeta(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow ID</label>
                  <input 
                      type="text"
                      value={editingWorkflowMeta?.workflowId || ''}
                      onChange={e => setEditingWorkflowMeta(prev => ({ ...prev, workflowId: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-500 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      disabled={workflows.some(w => w.workflowId === editingWorkflowMeta?.workflowId) && !!editingWorkflowMeta?.states} 
                  />
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button onClick={() => setIsWorkflowModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50">Cancel</button>
                  <button onClick={handleSaveWorkflowMeta} disabled={!editingWorkflowMeta?.name || !editingWorkflowMeta?.workflowId} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                      {editingWorkflowMeta?.states ? 'Save Changes' : 'Create Workflow'}
                  </button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={!!deletingWorkflowId} onClose={() => setDeletingWorkflowId(null)} title="Delete Workflow" maxWidth="max-w-md">
        <div className="p-6">
            <p className="text-slate-500 mb-8">Permanently delete workflow <span className="font-bold text-slate-900">"{deletingWorkflowId}"</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
                <button onClick={() => setDeletingWorkflowId(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50">Cancel</button>
                <button onClick={handleDeleteWorkflow} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-sm">Delete</button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Run Instance from Payload" maxWidth="max-w-lg">
          <div className="p-6">
              <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payload (JSON)</label>
                  <textarea className="w-full h-48 p-3 font-mono text-sm border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none" value={newTaskData} onChange={(e) => setNewTaskData(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50">Cancel</button>
                  <button onClick={handleConfirmCreateTask} className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-2">
                    <Play size={18} /> Run Instance
                  </button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Workflow Engine Guide" maxWidth="max-w-4xl">
         <div className="p-6">
             <HelpGuide />
             <div className="flex justify-end mt-6 pt-6 border-t border-slate-100">
                 <button onClick={() => setIsHelpOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Close Guide</button>
             </div>
         </div>
      </Modal>

    </div>
  );
}