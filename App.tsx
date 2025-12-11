import React, { useState } from 'react';
import { WorkflowDefinition, WorkflowState } from './types';
import { INITIAL_WORKFLOWS, DEFAULT_DATA } from './constants';
import StateCard from './components/StateCard';
import StateEditor from './components/StateEditor';
import WorkflowRunner from './components/WorkflowRunner';
import WorkflowVisualizer from './components/WorkflowVisualizer';
import WorkflowList from './components/WorkflowList';
import Modal from './components/Modal';
import { Layout, Play, Edit3, Plus, AlertTriangle, ChevronLeft, Save, Eye } from 'lucide-react';

// Initial template for a new workflow
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
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  
  // --- View Mode State (inside a workflow) ---
  const [mode, setMode] = useState<'editor' | 'runner' | 'visualizer'>('editor');
  
  // --- Editor State (State CRUD) ---
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [isCreatingState, setIsCreatingState] = useState(false);
  const [deletingStateId, setDeletingStateId] = useState<string | null>(null);

  // --- Workflow CRUD State ---
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [editingWorkflowMeta, setEditingWorkflowMeta] = useState<Partial<WorkflowDefinition> | null>(null);
  const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | null>(null);


  // Derived State
  const activeWorkflow = workflows.find(w => w.workflowId === activeWorkflowId);

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
        const exists = prev.find(w => w.workflowId === editingWorkflowMeta.workflowId);
        const newWorkflows = [...prev];
        const index = newWorkflows.findIndex(w => w.workflowId === editingWorkflowMeta.workflowId);
        
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


  // --- State CRUD Handlers (Inside Active Workflow) ---

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
    
    // Rename check
    if (editingStateId && editingStateId !== id) {
        delete newStates[editingStateId];
    }
    
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
                   onClick={() => setActiveWorkflowId(null)}
                   className="p-1.5 mr-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                 >
                     <ChevronLeft size={24} />
                 </button>
             ) : (
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <Layout size={24} />
                </div>
             )}
            
            <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    {activeWorkflow ? activeWorkflow.name : 'FlowMaster'}
                </h1>
                <p className="text-xs text-gray-500">
                    {activeWorkflow ? `Editing: ${activeWorkflow.workflowId}` : 'Dynamic Workflow Engine'}
                </p>
            </div>
          </div>

          {activeWorkflow && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setMode('editor')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Edit3 size={16} /> Designer
                </button>
                <button
                    onClick={() => setMode('visualizer')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'visualizer' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Eye size={16} /> Visualizer
                </button>
                <button
                    onClick={() => setMode('runner')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        mode === 'runner' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Play size={16} /> Simulator
                </button>
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
        return <WorkflowVisualizer workflow={activeWorkflow} />;
    }

    return (
        <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
            {/* Workflow Settings (Inside Editor) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Workflow Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Workflow Name</label>
                        <input 
                            type="text" 
                            value={activeWorkflow.name}
                            onChange={(e) => handleUpdateWorkflowRoot({ name: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-md text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start State ID</label>
                        <select 
                            value={activeWorkflow.start}
                            onChange={(e) => handleUpdateWorkflowRoot({ start: e.target.value })}
                            className="mt-1 w-full px-3 py-2 border rounded-md bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {Object.keys(activeWorkflow.states).map(id => (
                                <option key={id} value={id}>{id}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* States List */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">States ({Object.keys(activeWorkflow.states).length})</h2>
                    <button 
                        onClick={() => { setIsCreatingState(true); setEditingStateId(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow-sm font-medium text-sm"
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
    <div className="min-h-screen flex flex-col bg-[#f3f4f6]">
      {renderHeader()}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {!activeWorkflow ? (
            <WorkflowList 
                workflows={workflows}
                onSelect={setActiveWorkflowId}
                onCreate={handleCreateWorkflow}
                onEdit={handleEditWorkflowMeta}
                onDelete={setDeletingWorkflowId}
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

      {/* 3. Workflow Metadata Modal (Create/Edit) */}
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
                      className="w-full px-3 py-2 border rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Expense Approval"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workflow ID (Unique Key)</label>
                  <input 
                      type="text"
                      value={editingWorkflowMeta?.workflowId || ''}
                      onChange={e => setEditingWorkflowMeta(prev => ({ ...prev, workflowId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="e.g., expense_v1"
                      // Disable ID editing if we are editing an existing workflow (simplification)
                      // We can check if it exists in workflows list
                      disabled={workflows.some(w => w.workflowId === editingWorkflowMeta?.workflowId) && !!editingWorkflowMeta?.states} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be unique. Cannot change after creation.</p>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button
                      onClick={() => setIsWorkflowModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={handleSaveWorkflowMeta}
                      disabled={!editingWorkflowMeta?.name || !editingWorkflowMeta?.workflowId}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
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
            <div className="flex items-start gap-4 mb-4">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Delete Workflow?</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Permanently delete <span className="font-mono font-bold text-gray-800">"{deletingWorkflowId}"</span> and all its states?
                    </p>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => setDeletingWorkflowId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteWorkflow}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm"
                >
                    Delete Workflow
                </button>
            </div>
        </div>
      </Modal>

    </div>
  );
}