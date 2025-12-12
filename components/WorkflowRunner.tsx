import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowDefinition, WorkflowContextData, ExecutionHistoryItem, WorkflowState, StateTypeDefinition, BaseBehaviorDefinition } from '../types';
import { Play, RotateCcw, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';

interface WorkflowRunnerProps {
  workflow: WorkflowDefinition;
  initialData: WorkflowContextData;
  stateTypes: StateTypeDefinition[];
  baseBehaviors?: BaseBehaviorDefinition[]; // New Prop
}

const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({ workflow, initialData, stateTypes, baseBehaviors = [] }) => {
  const [currentStates, setCurrentStates] = useState<string[]>([]);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [data, setData] = useState<WorkflowContextData>(initialData);
  const [isRunning, setIsRunning] = useState(false);
  
  // Track parallel execution status: { parentId: [completed_branch_1, completed_branch_2] }
  const [parallelCompletion, setParallelCompletion] = useState<Record<string, string[]>>({});

  const getExecutionMode = (typeId: string) => {
      const typeDef = stateTypes.find(t => t.type === typeId);
      if (!typeDef) return 'interactive'; // Default fallback
      const behavior = baseBehaviors.find(b => b.type === typeDef.baseType);
      return behavior ? behavior.executionMode : 'interactive';
  };

  const startWorkflow = () => {
    setHistory([{
        timestamp: new Date(),
        stateId: 'START',
        action: 'start',
        details: `Workflow started at ${workflow.start}`
    }]);
    setCurrentStates([workflow.start]);
    setIsRunning(true);
    setParallelCompletion({});
  };

  const resetWorkflow = () => {
    setIsRunning(false);
    setCurrentStates([]);
    setHistory([]);
    setParallelCompletion({});
  };

  const evaluateCondition = (conditionStr: string, contextData: any): boolean => {
    try {
      const func = new Function('data', `return ${conditionStr}`);
      return !!func(contextData);
    } catch (e) {
      console.error("Condition evaluation error", e);
      return false;
    }
  };

  const addToHistory = (stateId: string, action: ExecutionHistoryItem['action'], details?: string) => {
    setHistory(prev => [...prev, {
        timestamp: new Date(),
        stateId,
        action,
        details
    }]);
  };

  const processTransition = useCallback((currentStateId: string, action: 'approve' | 'reject' | 'auto' | 'timeout') => {
    const currentState = workflow.states[currentStateId];
    if (!currentState) return;

    const execMode = getExecutionMode(currentState.type);
    let nextStateId: string | null | undefined = currentState.next;

    // 1. Handle Timeout
    if (action === 'timeout') {
        if (currentState.onTimeout) {
            nextStateId = currentState.onTimeout;
            addToHistory(currentStateId, 'auto', `SLA Timeout Triggered`);
        } else {
            return;
        }
    }
    // 2. Handle Decisions (Auto calculated)
    else if (execMode === 'decision' && currentState.conditions) {
        let matched = false;
        for (const cond of currentState.conditions) {
            if (cond.if) {
                if (evaluateCondition(cond.if, data)) {
                    nextStateId = cond.next;
                    matched = true;
                    addToHistory(currentStateId, 'auto', `Condition matched: ${cond.if} -> ${cond.next}`);
                    break;
                }
            } else if (cond.else) {
                if (!matched) {
                    nextStateId = cond.else;
                    addToHistory(currentStateId, 'auto', `Else condition -> ${cond.else}`);
                }
            }
        }
    }
    // 3. Handle Automated/System Actions
    else if (execMode === 'automated') {
        addToHistory(currentStateId, 'auto', `System action executed: ${currentState.action}`);
    }
    // 4. Handle Parallel Start
    else if (execMode === 'parallel' && currentState.branches) {
        const branches = currentState.branches;
        addToHistory(currentStateId, 'auto', `Spawning branches: ${branches.join(', ')}`);
        setCurrentStates(prev => {
            const next = prev.filter(s => s !== currentStateId);
            return [...next, ...branches];
        });
        return; 
    }

    // 5. Handle Branch Joining (check if parent was parallel)
    // We search across all states to see if any parallel state lists this current state as a branch
    const parentParallelStateId = Object.keys(workflow.states).find(key => {
        const s = workflow.states[key];
        const pMode = getExecutionMode(s.type);
        return pMode === 'parallel' && s.branches?.includes(currentStateId);
    });

    if (parentParallelStateId) {
        const parentState = workflow.states[parentParallelStateId];
        const allBranches = parentState.branches || [];
        const completionRule = parentState.completionRule || 'all';

        setParallelCompletion(prev => {
            const finished = prev[parentParallelStateId] || [];
            if (finished.includes(currentStateId)) return prev; 
            
            const updated = [...finished, currentStateId];
            let isComplete = false;
            
            if (completionRule === 'any') isComplete = true; 
            else isComplete = allBranches.every(b => updated.includes(b));
            
            if (isComplete) {
                addToHistory(parentParallelStateId, 'auto', `Parallel completion rule '${completionRule}' met. Merging.`);
                setTimeout(() => {
                    setCurrentStates(curr => {
                        const cleaned = curr.filter(s => !allBranches.includes(s));
                        if (parentState.next && cleaned.includes(parentState.next)) return cleaned;
                        if (parentState.next) return [...cleaned, parentState.next];
                        return cleaned;
                    });
                }, 500);
            }
            return { ...prev, [parentParallelStateId]: updated };
        });

        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        return;
    }

    // 6. Interactive Transition (Approve/Reject)
    if (action === 'reject') {
        if (currentState.onReject) {
             addToHistory(currentStateId, 'reject', `Rejected. Moving to ${currentState.onReject}`);
             nextStateId = currentState.onReject;
        } else {
             addToHistory(currentStateId, 'reject', 'User rejected. Workflow stopped.');
             setCurrentStates([]); // Stop workflow
             return;
        }
    }

    // 7. Explicit Termination
    if (nextStateId === '__TERMINATE__') {
        addToHistory(currentStateId, 'auto', 'Terminated via explicit transition');
        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        return;
    }

    // Move to next
    if (nextStateId) {
        setCurrentStates(prev => {
            const filtered = prev.filter(s => s !== currentStateId);
            return [...filtered, nextStateId as string];
        });
    } else {
        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        addToHistory(currentStateId, 'auto', 'Workflow End');
    }

  }, [workflow, data, stateTypes, baseBehaviors]); // Added deps


  // Auto-Run Effect for Automated/Decision/Parallel
  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setTimeout(() => {
        currentStates.forEach(stateId => {
            const state = workflow.states[stateId];
            if (!state) return;
            const execMode = getExecutionMode(state.type);

            if (['decision', 'automated', 'parallel'].includes(execMode)) {
                processTransition(stateId, 'auto');
            }
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStates, isRunning, workflow, processTransition, stateTypes, baseBehaviors]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left: Controls & Data */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Play size={18} /> Simulation Controls
                </h3>
                <div className="flex gap-3 mb-6">
                    {!isRunning ? (
                        <button 
                            onClick={startWorkflow}
                            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition font-medium"
                        >
                            Start Simulation
                        </button>
                    ) : (
                        <button 
                            onClick={resetWorkflow}
                            className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-md hover:bg-slate-700 transition font-medium flex justify-center items-center gap-2"
                        >
                            <RotateCcw size={16}/> Reset
                        </button>
                    )}
                </div>

                <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Context Data (JSON)</label>
                    <textarea 
                        className="w-full h-40 font-mono text-sm p-3 bg-slate-50 border rounded-md focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        value={JSON.stringify(data, null, 2)}
                        onChange={(e) => {
                            try { setData(JSON.parse(e.target.value)); } catch (e) {}
                        }}
                        disabled={isRunning}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[400px] overflow-y-auto">
                <h3 className="font-semibold text-gray-800 mb-4">Execution Log</h3>
                <div className="space-y-3">
                    {history.length === 0 && <p className="text-sm text-gray-400 italic">No history yet.</p>}
                    {history.map((item, idx) => (
                        <div key={idx} className="flex gap-3 text-sm border-b border-gray-100 pb-2 last:border-0">
                            <div className="text-xs text-gray-400 whitespace-nowrap pt-1">
                                {item.timestamp.toLocaleTimeString()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-800">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                        item.action === 'approve' ? 'bg-emerald-500' :
                                        item.action === 'reject' ? 'bg-rose-500' :
                                        'bg-indigo-500'
                                    }`}></span>
                                    {item.stateId}
                                </div>
                                <div className="text-gray-600 text-xs mt-0.5 capitalize">{item.action} {item.details ? `- ${item.details}` : ''}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right: Active States */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
                 <h3 className="font-semibold text-gray-800 mb-6 flex items-center justify-between">
                    <span>Live Workflow Status</span>
                    {isRunning && <span className="text-xs font-normal bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full animate-pulse">Running</span>}
                 </h3>

                 <div className="space-y-6">
                    {currentStates.length === 0 && isRunning && history.length > 0 && (
                         <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <div className="bg-gray-100 p-4 rounded-full mb-3">
                                <Check size={32} className="text-emerald-500" />
                            </div>
                            <p>Workflow Completed</p>
                         </div>
                    )}

                    {currentStates.map(stateId => {
                        const state = workflow.states[stateId];
                        if (!state) return <div key={stateId} className="p-4 bg-red-50 text-red-700">Unknown: {stateId}</div>;

                        const execMode = getExecutionMode(state.type);
                        const isAuto = ['decision', 'automated', 'parallel'].includes(execMode);
                        const canTimeout = execMode === 'interactive' && state.slaDuration && state.slaDuration > 0;

                        return (
                            <div key={stateId} className="relative pl-8 animate-in slide-in-from-left-4 fade-in duration-300">
                                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 -z-10"></div>
                                <div className="absolute left-1 top-6 w-5 h-5 bg-indigo-500 rounded-full border-4 border-white z-10"></div>

                                <div className="bg-white rounded-lg border-2 border-indigo-500 shadow-lg p-5 mb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                {stateId}
                                                <span className="text-xs font-normal bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">{state.type}</span>
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">{state.role ? `Assigned: ${state.role}` : 'System processing...'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        {isAuto ? (
                                            <div className="flex items-center gap-2 text-sm text-indigo-600 italic">
                                                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                Processing logic...
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
                                                <button onClick={() => { addToHistory(stateId, 'approve'); processTransition(stateId, 'approve'); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2">
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button onClick={() => processTransition(stateId, 'reject')} className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 py-2 px-4 rounded-md font-medium flex items-center justify-center gap-2">
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        )}
                                        {canTimeout && (
                                            <div className="mt-3 pt-2 border-t border-gray-100 text-center">
                                                <button onClick={() => processTransition(stateId, 'timeout')} className="text-xs text-orange-600 hover:text-orange-800 underline">Simulate SLA Timeout</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default WorkflowRunner;
