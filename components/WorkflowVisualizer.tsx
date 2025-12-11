import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { WorkflowDefinition, WorkflowContextData, ExecutionHistoryItem } from '../types';
import { DEFAULT_DATA } from '../constants';
import { 
    GitBranch, Cpu, CheckCircle2, Users, FileText, Play, Flag, 
    Plus, Minus, RotateCcw, X, Check, Move, AlertCircle 
} from 'lucide-react';

interface WorkflowVisualizerProps {
  workflow: WorkflowDefinition;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  level: number;
  indexInLevel: number;
}

// Layout Configuration
const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;
const LEVEL_HEIGHT = 180;
const NODE_GAP = 60;

export default function WorkflowVisualizer({ workflow }: WorkflowVisualizerProps) {
  // --- Layout Calculation (Memoized) ---
  const { nodes, edges, maxWidth, maxHeight } = useMemo(() => {
    const levels: Record<number, string[]> = {};
    const nodePositions: Record<string, NodePosition> = {};
    const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [{ id: workflow.start, level: 0 }];
    const edgesList: { from: string; to: string; label?: string }[] = [];

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(id);

      const state = workflow.states[id];
      if (!state) continue;

      const children: { id: string; label?: string }[] = [];
      if (state.next) children.push({ id: state.next });
      if (state.branches) state.branches.forEach(branchId => children.push({ id: branchId }));
      if (state.conditions) {
        state.conditions.forEach(cond => {
            if (cond.next) children.push({ id: cond.next, label: cond.if ? 'Yes' : 'Else' });
            if (cond.else) children.push({ id: cond.else, label: 'No/Else' });
        });
      }

      children.forEach(child => {
        edgesList.push({ from: id, to: child.id, label: child.label });
        if (!visited.has(child.id)) {
             queue.push({ id: child.id, level: level + 1 });
        }
      });
    }

    let maxLevelWidth = 0;
    Object.entries(levels).forEach(([lvl, ids]) => {
        const levelNum = parseInt(lvl);
        const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * NODE_GAP;
        maxLevelWidth = Math.max(maxLevelWidth, totalWidth);

        ids.forEach((id, index) => {
            const startX = (maxLevelWidth - totalWidth) / 2;
            nodePositions[id] = {
                id,
                level: levelNum,
                indexInLevel: index,
                x: startX + index * (NODE_WIDTH + NODE_GAP),
                y: levelNum * LEVEL_HEIGHT + 100
            };
        });
    });

    return {
        nodes: nodePositions,
        edges: edgesList,
        maxWidth: Math.max(maxLevelWidth + 200, 1000),
        maxHeight: (Object.keys(levels).length * LEVEL_HEIGHT) + 200
    };
  }, [workflow]);


  // --- Viewport State (Zoom/Pan) ---
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      // e.preventDefault(); // React synthetic events can't be prevented easily like this for wheel sometimes, but passive check handles it
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(0.5, transform.k + scaleAmount), 2);
      setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      // Only drag if clicking background
      if ((e.target as HTMLElement).closest('.node-interactive')) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      setTransform(prev => ({
          ...prev,
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y
      }));
  };

  const handleMouseUp = () => setIsDragging(false);


  // --- Execution Engine State ---
  const [isRunning, setIsRunning] = useState(false);
  const [currentStates, setCurrentStates] = useState<string[]>([]);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [data, setData] = useState<WorkflowContextData>(DEFAULT_DATA);
  const [parallelCompletion, setParallelCompletion] = useState<Record<string, string[]>>({});
  
  // --- UI Interactions ---
  const [showStartModal, setShowStartModal] = useState(false);
  const [startDataJson, setStartDataJson] = useState(JSON.stringify(DEFAULT_DATA, null, 2));
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const evaluateCondition = (conditionStr: string, contextData: any): boolean => {
    try {
      const func = new Function('data', `return ${conditionStr}`);
      return !!func(contextData);
    } catch (e) {
      return false;
    }
  };

  const addToHistory = (stateId: string, action: ExecutionHistoryItem['action'], details?: string) => {
    setHistory(prev => [...prev, { timestamp: new Date(), stateId, action, details }]);
  };


  // --- Engine Logic ---
  const processTransition = useCallback((currentStateId: string, action: 'approve' | 'reject' | 'auto') => {
    const currentState = workflow.states[currentStateId];
    if (!currentState) return;

    let nextStateId: string | null | undefined = currentState.next;

    // Logic: Decisions
    if (currentState.type === 'decision' && currentState.conditions) {
        let matched = false;
        for (const cond of currentState.conditions) {
            if (cond.if) {
                if (evaluateCondition(cond.if, data)) {
                    nextStateId = cond.next;
                    matched = true;
                    addToHistory(currentStateId, 'auto', `Condition: ${cond.if}`);
                    break;
                }
            } else if (cond.else) {
                if (!matched) {
                    nextStateId = cond.else;
                    addToHistory(currentStateId, 'auto', `Else path`);
                }
            }
        }
    }

    // Logic: System
    if (currentState.type === 'system') {
        addToHistory(currentStateId, 'auto', `Action: ${currentState.action}`);
    }

    // Logic: Parallel Start
    if (currentState.type === 'parallel' && currentState.branches) {
        const branches = currentState.branches;
        addToHistory(currentStateId, 'auto', `Split: ${branches.join(', ')}`);
        setCurrentStates(prev => {
            const next = prev.filter(s => s !== currentStateId);
            return [...next, ...branches];
        });
        return; 
    }

    // Logic: Parallel Join
    const parentParallelStateId = Object.keys(workflow.states).find(key => {
        const s = workflow.states[key];
        return s.type === 'parallel' && s.branches?.includes(currentStateId);
    });

    if (parentParallelStateId) {
        const parentState = workflow.states[parentParallelStateId];
        const allBranches = parentState.branches || [];
        const completionRule = parentState.completionRule || 'all';

        setParallelCompletion(prev => {
            const finished = prev[parentParallelStateId] || [];
            if (finished.includes(currentStateId)) return prev; // already finished
            
            const updated = [...finished, currentStateId];
            
            let isComplete = false;
            if (completionRule === 'any') isComplete = true;
            else isComplete = allBranches.every(b => updated.includes(b));
            
            if (isComplete) {
                addToHistory(parentParallelStateId, 'auto', `Joined (${completionRule})`);
                
                // Delay merge visually
                setTimeout(() => {
                    setCurrentStates(curr => {
                        const remainingBranches = curr.filter(s => allBranches.includes(s));
                        if (remainingBranches.length === 0 && completionRule === 'all') return curr;
                        
                        const cleaned = curr.filter(s => !allBranches.includes(s));
                        return parentState.next ? [...cleaned, parentState.next] : cleaned;
                    });
                }, 600);
            }
            return { ...prev, [parentParallelStateId]: updated };
        });

        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        return;
    }

    // Logic: Reject
    if (action === 'reject') {
        addToHistory(currentStateId, 'reject');
        setCurrentStates([]);
        showToast('Workflow Rejected', 'error');
        setIsRunning(false);
        return;
    }

    // Logic: Linear Move
    if (nextStateId) {
        setCurrentStates(prev => {
            const filtered = prev.filter(s => s !== currentStateId);
            return [...filtered, nextStateId];
        });
    } else {
        // End
        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        addToHistory(currentStateId, 'auto', 'End');
        showToast('Workflow Completed Successfully', 'success');
        // Keep isRunning true so we can see the history/state, or set false?
        // Let's keep it true but empty states implies done.
    }

  }, [workflow, data]);

  // --- Auto-Run Effect ---
  useEffect(() => {
    if (!isRunning) return;
    const timer = setTimeout(() => {
        currentStates.forEach(stateId => {
            const state = workflow.states[stateId];
            if (!state) return;
            if (['decision', 'system', 'parallel'].includes(state.type)) {
                processTransition(stateId, 'auto');
            }
        });
    }, 1000); // 1s delay for visual pace
    return () => clearTimeout(timer);
  }, [currentStates, isRunning, workflow, processTransition]);


  // --- Handlers ---
  const handleStartRequest = () => {
      setShowStartModal(true);
      setStartDataJson(JSON.stringify(data, null, 2));
  };

  const handleConfirmStart = () => {
      try {
          const parsed = JSON.parse(startDataJson);
          setData(parsed);
          setShowStartModal(false);
          
          // Start logic
          setIsRunning(true);
          setHistory([]);
          setParallelCompletion({});
          setCurrentStates([workflow.start]);
          addToHistory('START', 'start');
          showToast('Workflow Started', 'info');
      } catch (e) {
          alert('Invalid JSON');
      }
  };

  const handleReset = () => {
      setIsRunning(false);
      setCurrentStates([]);
      setHistory([]);
      setParallelCompletion({});
      showToast('Simulation Reset', 'info');
  };

  const handleNodeClick = (nodeId: string) => {
      if (!isRunning) return;
      if (!currentStates.includes(nodeId)) return;
      const state = workflow.states[nodeId];
      if (['task', 'multi-approver'].includes(state.type)) {
          setActionModal({ isOpen: true, nodeId });
      }
  };

  const handleAction = (action: 'approve' | 'reject') => {
      if (actionModal.nodeId) {
          processTransition(actionModal.nodeId, action);
          if (action === 'approve') addToHistory(actionModal.nodeId, 'approve');
          setActionModal({ isOpen: false, nodeId: null });
      }
  };


  // --- Rendering Helpers ---
  const getNodeColor = (type: string, status: 'pending' | 'active' | 'completed' | 'rejected') => {
      if (status === 'active') return 'bg-blue-500 border-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]';
      if (status === 'completed') return 'bg-green-100 border-green-300 text-green-900 opacity-80';
      if (status === 'rejected') return 'bg-red-100 border-red-300 text-red-900';
      
      // Pending/Default
      switch(type) {
          case 'parallel': return 'bg-purple-50 border-purple-200 text-purple-900';
          case 'decision': return 'bg-orange-50 border-orange-200 text-orange-900';
          case 'system': return 'bg-gray-50 border-gray-300 text-gray-900';
          default: return 'bg-white border-gray-200 text-gray-800';
      }
  };

  const getNodeIcon = (type: string) => {
    switch(type) {
        case 'parallel': return <GitBranch size={16} />;
        case 'decision': return <Cpu size={16} />;
        case 'system': return <CheckCircle2 size={16} />;
        case 'multi-approver': return <Users size={16} />;
        default: return <FileText size={16} />;
    }
  };


  return (
    <div className="relative h-[calc(100vh-140px)] bg-[#e5e7eb] overflow-hidden select-none border border-gray-300 rounded-xl shadow-inner group">
       
       {/* --- Dot Pattern Background --- */}
       <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              transformOrigin: '0 0'
          }}
       />

       {/* --- Canvas --- */}
       <div 
         className="w-full h-full cursor-grab active:cursor-grabbing"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onWheel={handleWheel}
       >
          <div 
            style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                width: maxWidth,
                height: maxHeight
            }}
            className="relative"
          >
              {/* Edges */}
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                  </defs>
                  {edges.map((edge, idx) => {
                      const fromNode = nodes[edge.from];
                      const toNode = nodes[edge.to];
                      if(!fromNode || !toNode) return null;

                      // Check connectivity for styling
                      const isExecuted = history.some(h => h.stateId === edge.from) && 
                                         (history.some(h => h.stateId === edge.to) || currentStates.includes(edge.to));

                      const startX = fromNode.x + NODE_WIDTH / 2;
                      const startY = fromNode.y + NODE_HEIGHT;
                      const endX = toNode.x + NODE_WIDTH / 2;
                      const endY = toNode.y;
                      const dy = endY - startY;
                      const controlY = startY + dy * 0.5;

                      let path = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
                      // Simple loop back handling
                      if (toNode.level <= fromNode.level) {
                          path = `M ${startX} ${fromNode.y + NODE_HEIGHT / 2} C ${startX + NODE_WIDTH} ${fromNode.y}, ${endX + NODE_WIDTH} ${endY + NODE_HEIGHT}, ${endX + NODE_WIDTH / 2} ${endY + NODE_HEIGHT / 2}`;
                      }

                      return (
                        <g key={`${edge.from}-${edge.to}-${idx}`}>
                           <path 
                             d={path} 
                             stroke={isExecuted ? '#3b82f6' : '#cbd5e1'} 
                             strokeWidth={isExecuted ? 3 : 2} 
                             fill="none" 
                             markerEnd="url(#arrowhead)"
                             className="transition-colors duration-500"
                           />
                           {edge.label && (
                               <foreignObject x={(fromNode.x + toNode.x)/2 + 80} y={(fromNode.y + toNode.y)/2 + 30} width="60" height="20">
                                   <div className="bg-white/90 text-[10px] text-center rounded border text-gray-500 shadow-sm">{edge.label}</div>
                               </foreignObject>
                           )}
                        </g>
                      )
                  })}
              </svg>

              {/* Nodes */}
              {Object.values(nodes).map((node) => {
                  const state = workflow.states[node.id];
                  const isActive = currentStates.includes(node.id);
                  const isCompleted = history.some(h => h.stateId === node.id && h.action !== 'start');
                  const isRejected = history.some(h => h.stateId === node.id && h.action === 'reject');
                  
                  let status: 'pending' | 'active' | 'completed' | 'rejected' = 'pending';
                  if (isRejected) status = 'rejected';
                  else if (isCompleted) status = 'completed';
                  else if (isActive) status = 'active';

                  const isStart = workflow.start === node.id;
                  const isInteractive = isActive && ['task', 'multi-approver'].includes(state.type);

                  return (
                      <div
                        key={node.id}
                        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                        className={`absolute flex flex-col items-center justify-center p-2 transition-transform duration-300 z-10 ${isInteractive ? 'cursor-pointer hover:scale-105 node-interactive' : ''}`}
                        onClick={() => handleNodeClick(node.id)}
                      >
                         <div className={`
                             w-full h-full border-2 rounded-xl shadow-sm flex flex-col items-center justify-center relative bg-white/90 backdrop-blur
                             ${getNodeColor(state.type, status)}
                             ${status === 'active' ? 'animate-pulse' : ''}
                         `}>
                             {isStart && <div className="absolute -top-2 bg-black text-white text-[10px] px-2 rounded-full">START</div>}
                             {isInteractive && (
                                 <div className="absolute -top-3 -right-3 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-md">
                                     <Move size={12} />
                                 </div>
                             )}
                             
                             <div className="flex items-center gap-2 mb-1 opacity-80">
                                 {getNodeIcon(state.type)}
                                 <span className="text-[10px] font-bold uppercase tracking-wider">{state.type}</span>
                             </div>
                             <div className="font-bold text-sm text-center leading-tight px-1 line-clamp-2">
                                 {node.id}
                             </div>
                             {state.role && <div className="text-[10px] mt-1 opacity-70">👤 {state.role}</div>}
                         </div>
                      </div>
                  )
              })}
          </div>
       </div>


       {/* --- Floating UI Controls --- */}
       
       {/* Top Left: Status */}
       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-gray-200">
           <h3 className="font-bold text-gray-800 flex items-center gap-2">
               {workflow.name} 
               <span className="text-xs font-normal text-gray-500">v{workflow.version}</span>
           </h3>
           <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
               <span className="text-xs text-gray-600">{isRunning ? 'Running Simulation' : 'Ready'}</span>
           </div>
       </div>

       {/* Top Center: Toast */}
       {toast && (
           <div className={`
               absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 z-50
               ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
           `}>
               {toast.type === 'success' ? <CheckCircle2 size={18}/> : toast.type === 'error' ? <AlertCircle size={18}/> : <Check size={18}/>}
               {toast.message}
           </div>
       )}

       {/* Bottom Right: Zoom Tools */}
       <div className="absolute bottom-6 right-6 flex flex-col gap-2">
           <button onClick={() => setTransform(t => ({...t, k: Math.min(t.k + 0.2, 2)}))} className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50"><Plus size={20}/></button>
           <button onClick={() => setTransform(t => ({...t, k: Math.max(t.k - 0.2, 0.5)}))} className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50"><Minus size={20}/></button>
           <button onClick={() => setTransform({x:0, y:0, k:1})} className="p-2 bg-white rounded-lg shadow border hover:bg-gray-50" title="Reset View"><Move size={20}/></button>
       </div>

       {/* Bottom Left: Playback Controls */}
       <div className="absolute bottom-6 left-6 flex gap-3">
           {!isRunning ? (
               <button 
                 onClick={handleStartRequest}
                 className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 hover:scale-105 transition-all"
               >
                   <Play size={20} fill="currentColor" /> Start Simulation
               </button>
           ) : (
               <button 
                 onClick={handleReset}
                 className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-full font-bold shadow-lg hover:bg-gray-900 hover:scale-105 transition-all"
               >
                   <RotateCcw size={20} /> Reset
               </button>
           )}
       </div>


       {/* --- Modals --- */}

       {/* 1. Context Data Modal */}
       {showStartModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                   <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                       <h3 className="font-bold text-gray-800">Initial Context Data</h3>
                       <button onClick={() => setShowStartModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                   </div>
                   <div className="p-4">
                       <textarea 
                           className="w-full h-48 font-mono text-sm p-3 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500"
                           value={startDataJson}
                           onChange={(e) => setStartDataJson(e.target.value)}
                       />
                       <p className="text-xs text-gray-500 mt-2">Enter JSON data to drive decisions in the workflow.</p>
                   </div>
                   <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                       <button onClick={() => setShowStartModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                       <button onClick={handleConfirmStart} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Confirm & Start</button>
                   </div>
               </div>
           </div>
       )}

       {/* 2. Action Modal (Approve/Reject) */}
       {actionModal.isOpen && actionModal.nodeId && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-blue-500">
                   <div className="p-6 text-center">
                       <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                           <FileText size={24} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 mb-1">{actionModal.nodeId}</h3>
                       <p className="text-gray-500 text-sm mb-6">Action required. Please review and decide.</p>
                       
                       <div className="flex gap-3">
                           <button 
                               onClick={() => handleAction('approve')}
                               className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-all"
                           >
                               <Check size={18} /> Approve
                           </button>
                           <button 
                               onClick={() => handleAction('reject')}
                               className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 py-3 rounded-lg font-bold transition-all"
                           >
                               <X size={18} /> Reject
                           </button>
                       </div>
                       <button onClick={() => setActionModal({isOpen: false, nodeId: null})} className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline">Cancel</button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
}