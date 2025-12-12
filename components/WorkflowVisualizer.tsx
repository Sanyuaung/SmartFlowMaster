import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { WorkflowDefinition, WorkflowContextData, ExecutionHistoryItem, TaskInstance, StateTypeDefinition } from '../types';
import { DEFAULT_DATA } from '../constants';
import { 
    GitBranch, Cpu, CheckCircle2, Users, FileText, Play, 
    Plus, Minus, RotateCcw, X, Check, Move, AlertCircle, Clock, Ban, Database, Activity
} from 'lucide-react';

interface WorkflowVisualizerProps {
  workflow: WorkflowDefinition;
  initialTaskState?: TaskInstance | null;
  onTaskUpdate?: (updates: Partial<TaskInstance>) => void;
  stateTypes: StateTypeDefinition[];
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  level: number;
}

// Layout Configuration
const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;
const LEVEL_HEIGHT = 180;
const NODE_GAP = 60;

// Helper to calculate initial layout
const calculateLayout = (workflow: WorkflowDefinition) => {
    const levels: Record<number, string[]> = {};
    const nodePositions: Record<string, NodePosition> = {};
    const visited = new Set<string>();
    const queue: { id: string; level: number }[] = [{ id: workflow.start, level: 0 }];
    const edgesList: { from: string; to: string; label?: string; type?: 'default' | 'timeout' | 'reject' }[] = [];

    // 1. BFS Traversal to determine levels and edges
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      
      // Allow revisiting only if we found a deeper path (optional, simplified here to set once)
      if (visited.has(id)) continue;
      visited.add(id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(id);

      // Handle Virtual Terminate Node
      if (id === '__TERMINATE__') {
          continue; 
      }

      const state = workflow.states[id];
      // If state is missing (and not terminate), we render as placeholder but stop traversal
      if (!state) continue;

      const children: { id: string; label?: string; type?: 'default' | 'timeout' | 'reject' }[] = [];
      
      if (state.next) children.push({ id: state.next, type: 'default' });
      if (state.onTimeout) children.push({ id: state.onTimeout, label: 'Timeout', type: 'timeout' }); 
      if (state.onReject) children.push({ id: state.onReject, label: 'Reject', type: 'reject' }); 

      if (state.branches) state.branches.forEach(branchId => children.push({ id: branchId }));
      if (state.conditions) {
        state.conditions.forEach(cond => {
            if (cond.next) children.push({ id: cond.next, label: cond.if ? 'Yes' : 'Else' });
            if (cond.else) children.push({ id: cond.else, label: 'No/Else' });
        });
      }

      children.forEach(child => {
        edgesList.push({ from: id, to: child.id, label: child.label, type: child.type });
        // Add to queue if not visited
        if (!visited.has(child.id)) {
             queue.push({ id: child.id, level: level + 1 });
        }
      });
    }

    // 2. Assign Coordinates
    let maxLevelWidth = 0;
    let maxLevelHeight = 0;

    Object.entries(levels).forEach(([lvl, ids]) => {
        const levelNum = parseInt(lvl);
        const totalWidth = ids.length * NODE_WIDTH + (ids.length - 1) * NODE_GAP;
        maxLevelWidth = Math.max(maxLevelWidth, totalWidth);
        maxLevelHeight = Math.max(maxLevelHeight, levelNum * LEVEL_HEIGHT);

        ids.forEach((id, index) => {
            const startX = (maxLevelWidth - totalWidth) / 2; // Center alignment
            // If it's the terminate node, try to push it to the right or center it distinctly
            const xPos = id === '__TERMINATE__' 
                ? startX + index * (NODE_WIDTH + NODE_GAP) 
                : startX + index * (NODE_WIDTH + NODE_GAP);

            nodePositions[id] = {
                id,
                level: levelNum,
                x: xPos,
                y: levelNum * LEVEL_HEIGHT + 100
            };
        });
    });

    return {
        initialNodes: nodePositions,
        initialEdges: edgesList,
        initialWidth: Math.max(maxLevelWidth + 200, 1000),
        initialHeight: maxLevelHeight + 400
    };
};

export default function WorkflowVisualizer({ workflow, initialTaskState, onTaskUpdate, stateTypes }: WorkflowVisualizerProps) {
  
  // --- State for Interactive Layout ---
  const [nodes, setNodes] = useState<Record<string, NodePosition>>({});
  const [edges, setEdges] = useState<{ from: string; to: string; label?: string; type?: 'default' | 'timeout' | 'reject' }[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 1000 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Recalculate layout when workflow definition changes
  useEffect(() => {
      const { initialNodes, initialEdges, initialWidth, initialHeight } = calculateLayout(workflow);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setCanvasSize({ width: initialWidth, height: initialHeight });
  }, [workflow]);

  // Helper to get base type
  const getBaseType = (type: string) => {
    const def = stateTypes.find(t => t.type === type);
    return def?.baseType || 'task';
  };
  
  const getTypeColor = (type: string) => {
     const def = stateTypes.find(t => t.type === type);
     return def?.color || 'indigo';
  };

  // --- Viewport State (Zoom/Pan/Drag) ---
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  
  // Dragging Canvas vs Dragging Node
  const [isPanning, setIsPanning] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  
  const dragStart = useRef({ x: 0, y: 0 }); // Mouse position on start
  const initialNodePos = useRef({ x: 0, y: 0 }); // Node position on start

  const handleWheel = (e: React.WheelEvent) => {
      e.stopPropagation();
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(0.5, transform.k + scaleAmount), 2);
      setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
      if ((e.target as HTMLElement).closest('.node-action-btn')) return;
      e.preventDefault();
      
      if (nodeId) {
          // Start Dragging Node
          e.stopPropagation(); // Prevent canvas pan
          setDraggedNodeId(nodeId);
          dragStart.current = { x: e.clientX, y: e.clientY };
          if (nodes[nodeId]) {
              initialNodePos.current = { x: nodes[nodeId].x, y: nodes[nodeId].y };
          }
      } else {
          // Start Panning Canvas
          setIsPanning(true);
          dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      e.preventDefault();

      if (draggedNodeId && nodes[draggedNodeId]) {
          // Update Node Position
          const deltaX = (e.clientX - dragStart.current.x) / transform.k;
          const deltaY = (e.clientY - dragStart.current.y) / transform.k;
          
          setNodes(prev => ({
              ...prev,
              [draggedNodeId]: {
                  ...prev[draggedNodeId],
                  x: initialNodePos.current.x + deltaX,
                  y: initialNodePos.current.y + deltaY
              }
          }));
      } else if (isPanning) {
          // Update Canvas Position
          setTransform(prev => ({
              ...prev,
              x: e.clientX - dragStart.current.x,
              y: e.clientY - dragStart.current.y
          }));
      }
  };

  const handleMouseUp = () => {
      setIsPanning(false);
      setDraggedNodeId(null);
  };


  // --- Execution Engine State ---
  const [isRunning, setIsRunning] = useState(!!initialTaskState);
  const [currentStates, setCurrentStates] = useState<string[]>(initialTaskState?.currentStates || []);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>(initialTaskState?.history || []);
  const [data, setData] = useState<WorkflowContextData>(initialTaskState?.data || DEFAULT_DATA);
  const [parallelCompletion, setParallelCompletion] = useState<Record<string, string[]>>(initialTaskState?.parallelCompletion || {});
  
  const [entryTimes, setEntryTimes] = useState<Record<string, number>>({});
  
  const [showStartModal, setShowStartModal] = useState(false);
  const [startDataJson, setStartDataJson] = useState(JSON.stringify(DEFAULT_DATA, null, 2));
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --- Sync Effect ---
  useEffect(() => {
    if (initialTaskState && onTaskUpdate) {
        let status: 'running' | 'completed' | 'rejected' = 'running';
        const lastAction = history[history.length - 1]?.action;
        if (lastAction === 'reject') status = 'rejected';
        else if (currentStates.length === 0 && history.length > 0) status = 'completed';

        onTaskUpdate({
            currentStates,
            history,
            data,
            parallelCompletion,
            status,
            updatedAt: new Date()
        });
    }
  }, [currentStates, history, data, parallelCompletion]);


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
  const processTransition = useCallback((currentStateId: string, action: 'approve' | 'reject' | 'auto' | 'timeout') => {
    const currentState = workflow.states[currentStateId];
    if (!currentState) return;

    const baseType = getBaseType(currentState.type);
    let nextStateId: string | null | undefined = currentState.next;

    // Logic: Timeout
    if (action === 'timeout') {
        if (currentState.onTimeout) {
            nextStateId = currentState.onTimeout;
            addToHistory(currentStateId, 'auto', `SLA Timeout: Escalating to ${currentState.onTimeout}`);
        } else {
            console.warn(`State ${currentStateId} timed out but no 'onTimeout' defined.`);
            return;
        }
    }

    // Logic: Reject
    else if (action === 'reject') {
        if (currentState.onReject) {
            nextStateId = currentState.onReject;
            addToHistory(currentStateId, 'reject', `Rejected: Routing to ${currentState.onReject}`);
        } else {
            // Default termination behavior
            addToHistory(currentStateId, 'reject');
            setCurrentStates([]);
            showToast('Workflow Rejected', 'error');
            return;
        }
    }

    // Logic: Decisions
    else if (baseType === 'decision' && currentState.conditions) {
        let matched = false;
        for (const cond of currentState.conditions) {
            if (cond.if) {
                if (evaluateCondition(cond.if, data)) {
                    nextStateId = cond.next;
                    matched = true;
                    addToHistory(currentStateId, 'auto', `Matched: ${cond.if}`);
                    break;
                } else {
                    addToHistory(currentStateId, 'auto', `Failed: ${cond.if}`);
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
    else if (baseType === 'system') {
        addToHistory(currentStateId, 'auto', `Action: ${currentState.action}`);
    }

    // Logic: Parallel Start
    else if (baseType === 'parallel' && currentState.branches) {
        const branches = currentState.branches;
        addToHistory(currentStateId, 'auto', `Split: ${branches.join(', ')}`);
        
        setCurrentStates(prev => {
            const next = prev.filter(s => s !== currentStateId);
            return [...next, ...branches];
        });
        
        const now = Date.now();
        setEntryTimes(prev => {
            const updated = { ...prev };
            branches.forEach(b => updated[b] = now);
            return updated;
        });
        return; 
    }

    // Logic: Parallel Join
    const parentParallelStateId = Object.keys(workflow.states).find(key => {
        const s = workflow.states[key];
        const pBase = getBaseType(s.type);
        return pBase === 'parallel' && s.branches?.includes(currentStateId);
    });

    if (parentParallelStateId) {
        const parentState = workflow.states[parentParallelStateId];
        const allBranches = parentState.branches || [];
        const completionRule = parentState.completionRule || 'all';

        const currentFinished = parallelCompletion[parentParallelStateId] || [];
        const willBeFinished = [...currentFinished, currentStateId];
        const isComplete = (completionRule === 'any') || allBranches.every(b => willBeFinished.includes(b));

        setParallelCompletion(prev => {
            if (currentFinished.includes(currentStateId)) return prev;
            const updated = [...currentFinished, currentStateId];
            
            if (isComplete) {
                addToHistory(parentParallelStateId, 'auto', `Joined (${completionRule})`);
                
                setTimeout(() => {
                    const now = Date.now();
                    setCurrentStates(curr => {
                        const cleaned = curr.filter(s => !allBranches.includes(s));
                        if (parentState.next && cleaned.includes(parentState.next)) {
                            return cleaned;
                        }
                        return parentState.next ? [...cleaned, parentState.next] : cleaned;
                    });
                    
                    if (parentState.next) {
                        setEntryTimes(prev => ({ ...prev, [parentState.next!]: now }));
                    }
                }, 600);
            }
            return { ...prev, [parentParallelStateId]: updated };
        });

        if (isComplete) {
            setCurrentStates(prev => prev.filter(s => s !== currentStateId));
            return; 
        }

        if (nextStateId) {
            // diverge
        } else {
             setCurrentStates(prev => prev.filter(s => s !== currentStateId));
             return;
        }
    }

    // Handle Terminate Explicitly
    if (nextStateId === '__TERMINATE__') {
        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        addToHistory(currentStateId, 'auto', 'Terminated');
        showToast('Workflow Terminated', 'error');
        return;
    }

    if (nextStateId) {
        const now = Date.now();
        setCurrentStates(prev => {
            const filtered = prev.filter(s => s !== currentStateId);
            return [...filtered, nextStateId as string];
        });
        setEntryTimes(prev => ({ ...prev, [nextStateId as string]: now }));
    } else {
        setCurrentStates(prev => prev.filter(s => s !== currentStateId));
        addToHistory(currentStateId, 'auto', 'End');
        showToast('Workflow Completed Successfully', 'success');
    }

  }, [workflow, data, parallelCompletion, stateTypes]);

  // --- Auto-Run Effect & SLA Monitor ---
  useEffect(() => {
    if (!isRunning) return;
    
    const intervalId = setInterval(() => {
        const now = Date.now();
        currentStates.forEach(stateId => {
            const state = workflow.states[stateId];
            if (!state) return;
            const baseType = getBaseType(state.type);

            const slaMs = state.slaDuration !== undefined 
                ? state.slaDuration 
                : (state.slaHours ? state.slaHours * 3600000 : 0);
            
            if (slaMs > 0 && state.onTimeout && entryTimes[stateId]) {
                const elapsed = now - entryTimes[stateId];
                if (elapsed > slaMs) {
                    processTransition(stateId, 'timeout');
                    return; 
                }
            }

            if (['decision', 'system', 'parallel'].includes(baseType)) {
                if (entryTimes[stateId] && (now - entryTimes[stateId] > 600)) {
                    processTransition(stateId, 'auto');
                }
            }
        });
    }, 200); 
    
    return () => clearInterval(intervalId);
  }, [currentStates, isRunning, workflow, processTransition, entryTimes, stateTypes]);


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
          
          setIsRunning(true);
          setHistory([]);
          setParallelCompletion({});
          setCurrentStates([workflow.start]);
          setEntryTimes({ [workflow.start]: Date.now() });

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
      setEntryTimes({});
      showToast('Simulation Reset', 'info');
  };

  const handleNodeClick = (nodeId: string) => {
      if (nodeId === '__TERMINATE__') return;
      if (!isRunning && !initialTaskState) return; 
      if (!currentStates.includes(nodeId)) return;
      
      const state = workflow.states[nodeId];
      if (!state) return;
      const baseType = getBaseType(state.type);

      if (['task', 'multi-approver'].includes(baseType)) {
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
      const color = getTypeColor(type);

      if (status === 'active') return 'bg-indigo-600 border-indigo-700 text-white'; 
      if (status === 'completed') return `bg-emerald-100 border-emerald-300 text-emerald-900 opacity-90`;
      if (status === 'rejected') return `bg-rose-100 border-rose-300 text-rose-900`;
      
      return `bg-${color}-50 border-${color}-200 text-${color}-900`;
  };

  const getNodeIcon = (type: string) => {
    const base = getBaseType(type);
    switch(base) {
        case 'parallel': return <GitBranch size={16} />;
        case 'decision': return <Cpu size={16} />;
        case 'system': return <CheckCircle2 size={16} />;
        case 'multi-approver': return <Users size={16} />;
        default: return <FileText size={16} />;
    }
  };


  return (
    <div className="relative h-[calc(100vh-140px)] bg-slate-100 overflow-hidden select-none border border-slate-300 rounded-xl shadow-inner group">
       
       <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
              backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
              transformOrigin: '0 0'
          }}
       />

       <div 
         className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
         onMouseDown={(e) => handleMouseDown(e)}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
         onWheel={handleWheel}
       >
          <div 
            style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                transformOrigin: '0 0',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                width: canvasSize.width,
                height: canvasSize.height
            }}
            className="relative"
          >
              {/* --- EDGES --- */}
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

                      const isExecuted = history.some(h => h.stateId === edge.from) && 
                                         (history.some(h => h.stateId === edge.to) || currentStates.includes(edge.to) || edge.to === '__TERMINATE__');

                      const startX = fromNode.x + NODE_WIDTH / 2;
                      const startY = fromNode.y + NODE_HEIGHT;
                      const endX = toNode.x + NODE_WIDTH / 2;
                      const endY = toNode.y;
                      const dy = endY - startY;
                      const controlY = startY + dy * 0.5;

                      let path = `M ${startX} ${startY} C ${startX} ${controlY}, ${endX} ${controlY}, ${endX} ${endY}`;
                      // Simple routing check for back-links or same level
                      if (toNode.level <= fromNode.level) {
                          path = `M ${startX} ${fromNode.y + NODE_HEIGHT / 2} C ${startX + NODE_WIDTH} ${fromNode.y}, ${endX + NODE_WIDTH} ${endY + NODE_HEIGHT}, ${endX + NODE_WIDTH / 2} ${endY + NODE_HEIGHT / 2}`;
                      }

                      const isTimeout = edge.type === 'timeout';
                      const isReject = edge.type === 'reject';
                      
                      let strokeColor = '#cbd5e1'; 
                      if (isExecuted) {
                          if (isTimeout) strokeColor = '#f97316'; 
                          else if (isReject) strokeColor = '#ef4444'; 
                          else strokeColor = '#4f46e5'; 
                      } else {
                          if (isTimeout) strokeColor = '#fdba74'; 
                          else if (isReject) strokeColor = '#fca5a5'; 
                      }

                      return (
                        <g key={`${edge.from}-${edge.to}-${idx}`}>
                           <path 
                             d={path} 
                             stroke={strokeColor}
                             strokeWidth={isExecuted ? 3 : 2} 
                             strokeDasharray={isTimeout || isReject ? '5,5' : 'none'}
                             fill="none" 
                             markerEnd="url(#arrowhead)"
                             className="transition-colors duration-500"
                           />
                           {edge.label && (
                               <foreignObject x={(fromNode.x + toNode.x)/2 + (isReject ? 20 : 0)} y={(fromNode.y + toNode.y)/2 - 10} width="80" height="24">
                                   <div className={`text-[10px] text-center rounded border shadow-sm font-medium px-1 py-0.5 ${
                                       isTimeout 
                                         ? 'bg-orange-50 text-orange-600 border-orange-200' 
                                         : isReject
                                            ? 'bg-red-50 text-red-600 border-red-200'
                                            : 'bg-white/95 text-slate-600 border-slate-200'
                                   }`}>
                                       {edge.label}
                                   </div>
                               </foreignObject>
                           )}
                        </g>
                      )
                  })}
              </svg>

              {/* --- NODES --- */}
              {Object.values(nodes).map((nodeValue) => {
                  const node = nodeValue as NodePosition;
                  
                  // Handle Virtual TERMINATE Node
                  if (node.id === '__TERMINATE__') {
                      return (
                          <div
                            key={node.id}
                            style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: 50 }}
                            className={`absolute flex flex-col items-center justify-center p-2 z-10 cursor-move ${draggedNodeId === node.id ? 'z-50' : ''}`}
                            onMouseDown={(e) => handleMouseDown(e, node.id)}
                          >
                              <div className="w-full h-full bg-red-600 text-white rounded-lg shadow-md border-2 border-red-800 flex items-center justify-center gap-2">
                                  <Ban size={16} />
                                  <span className="font-bold text-sm">TERMINATED</span>
                              </div>
                          </div>
                      );
                  }

                  const state = workflow.states[node.id];
                  if (!state) return null;

                  const isActive = currentStates.includes(node.id);
                  const isCompleted = history.some(h => h.stateId === node.id && h.action !== 'start');
                  const isRejected = history.some(h => h.stateId === node.id && h.action === 'reject');
                  
                  let status: 'pending' | 'active' | 'completed' | 'rejected' = 'pending';
                  if (isRejected) status = 'rejected';
                  else if (isCompleted) status = 'completed';
                  else if (isActive) status = 'active';

                  const isStart = workflow.start === node.id;
                  const baseType = getBaseType(state.type);
                  const isInteractive = isActive && ['task', 'multi-approver'].includes(baseType);
                  const hasTimer = isActive && state.onTimeout && (state.slaDuration || state.slaHours);
                  
                  // Only show hover card if running and matches hovered ID
                  const showHoverCard = isRunning && hoveredNodeId === node.id;

                  return (
                      <div
                        key={node.id}
                        style={{ left: node.x, top: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }}
                        className={`absolute flex flex-col items-center justify-center p-2 transition-shadow duration-300 z-10 cursor-move ${draggedNodeId === node.id ? 'z-50 opacity-90 scale-105' : ''}`}
                        onMouseDown={(e) => handleMouseDown(e, node.id)}
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                      >
                         <div className={`
                             w-full h-full border-2 rounded-xl shadow-sm flex flex-col items-center justify-center relative backdrop-blur transition-all
                             ${getNodeColor(state.type, status)}
                             ${status === 'active' ? 'animate-pulse ring-2 ring-offset-2 ring-indigo-200' : ''}
                             ${draggedNodeId === node.id ? 'shadow-2xl ring-2 ring-blue-400' : 'hover:shadow-md'}
                         `}>
                             {isStart && <div className="absolute -top-2 bg-slate-900 text-white text-[10px] px-2 rounded-full font-bold shadow-sm">START</div>}
                             {isInteractive && (
                                 <div className="absolute -top-3 -right-3 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center animate-bounce border-2 border-white shadow-md">
                                     <Move size={12} />
                                 </div>
                             )}
                             
                             {hasTimer && (
                                 <div className="absolute -bottom-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] border border-orange-200 flex items-center gap-1 shadow-sm">
                                     <Clock size={10} className="animate-spin-slow" />
                                     <span>Timer Active</span>
                                 </div>
                             )}
                             
                             <div className="flex items-center gap-2 mb-1 opacity-90">
                                 {getNodeIcon(state.type)}
                                 <span className="text-[10px] font-bold uppercase tracking-wider">{state.type}</span>
                             </div>
                             <div className="font-bold text-sm text-center leading-tight px-1 line-clamp-2 select-none">
                                 {node.id}
                             </div>
                             {state.role && <div className="text-[10px] mt-1 opacity-80 font-medium">👤 {state.role}</div>}

                             {/* --- Hover Card for Context Data --- */}
                             {showHoverCard && (
                                 <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 w-64 bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl p-4 z-[100] border border-slate-700 text-left pointer-events-none">
                                     {/* Triangle Arrow: Points left. Centered vertically on the left edge. */}
                                     <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-slate-900 rotate-45 border-l border-b border-slate-700"></div>
                                     
                                     <div className="relative z-10">
                                         <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                                             <div className="flex items-center gap-2 text-indigo-400">
                                                 <Activity size={14} />
                                                 <span className="text-xs font-bold uppercase tracking-wider">Live Context</span>
                                             </div>
                                             <span className="text-[10px] text-slate-500 font-mono">JSON</span>
                                         </div>
                                         
                                         <div className="space-y-1">
                                             {Object.entries(data).length === 0 ? (
                                                 <span className="text-slate-500 text-xs italic">No data present</span>
                                             ) : (
                                                 Object.entries(data).map(([key, val]) => (
                                                     <div key={key} className="flex items-start gap-2 text-xs font-mono">
                                                         <span className="text-slate-400 shrink-0">{key}:</span>
                                                         <span className="text-emerald-400 break-all">
                                                             {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                         </span>
                                                     </div>
                                                 ))
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                      </div>
                  )
              })}
          </div>
       </div>

       {/* --- Floating UI Controls --- */}
       
       <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200">
           <h3 className="font-bold text-slate-800 flex items-center gap-2">
               {workflow.name} 
               <span className="text-xs font-normal text-slate-500">v{workflow.version}</span>
           </h3>
           <div className="flex items-center gap-2 mt-1">
               <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
               <span className="text-xs text-slate-600">
                   {initialTaskState 
                        ? `Task: ${initialTaskState.id} (${initialTaskState.status})`
                        : (isRunning ? 'Running Simulation' : 'Ready')
                   }
               </span>
           </div>
           <p className="text-[10px] text-slate-400 mt-2 italic">Drag nodes to rearrange. Scroll to zoom.</p>
       </div>

       {toast && (
           <div className={`
               absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 z-50
               ${toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'}
           `}>
               {toast.type === 'success' ? <CheckCircle2 size={18}/> : toast.type === 'error' ? <AlertCircle size={18}/> : <Check size={18}/>}
               {toast.message}
           </div>
       )}

       <div className="absolute bottom-6 right-6 flex flex-col gap-2">
           <button onClick={() => setTransform(t => ({...t, k: Math.min(t.k + 0.2, 2)}))} className="p-2 bg-white rounded-lg shadow border hover:bg-slate-50 text-slate-700"><Plus size={20}/></button>
           <button onClick={() => setTransform(t => ({...t, k: Math.max(t.k - 0.2, 0.5)}))} className="p-2 bg-white rounded-lg shadow border hover:bg-slate-50 text-slate-700"><Minus size={20}/></button>
           <button onClick={() => setTransform({x:0, y:0, k:1})} className="p-2 bg-white rounded-lg shadow border hover:bg-slate-50 text-slate-700" title="Reset View"><Move size={20}/></button>
       </div>

       {/* Hide Start buttons if we are in Task Mode (already started) */}
       {!initialTaskState && (
           <div className="absolute bottom-6 left-6 flex gap-3">
               {!isRunning ? (
                   <button 
                     onClick={handleStartRequest}
                     className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
                   >
                       <Play size={20} fill="currentColor" /> Start Simulation
                   </button>
               ) : (
                   <button 
                     onClick={handleReset}
                     className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full font-bold shadow-lg hover:bg-slate-900 hover:scale-105 transition-all"
                   >
                       <RotateCcw size={20} /> Reset
                   </button>
               )}
           </div>
       )}


       {/* --- Modals --- */}

       {showStartModal && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                   <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                       <h3 className="font-bold text-slate-800">Initial Context Data</h3>
                       <button onClick={() => setShowStartModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                   </div>
                   <div className="p-4">
                       <textarea 
                           className="w-full h-48 font-mono text-sm p-3 bg-slate-50 border text-black rounded-lg focus:ring-2 focus:ring-indigo-500"
                           value={startDataJson}
                           onChange={(e) => setStartDataJson(e.target.value)}
                       />
                   </div>
                   <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                       <button onClick={() => setShowStartModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                       <button onClick={handleConfirmStart} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Confirm & Start</button>
                   </div>
               </div>
           </div>
       )}

       {actionModal.isOpen && actionModal.nodeId && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-indigo-500">
                   <div className="p-6 text-center">
                       <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                           <FileText size={24} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-1">{actionModal.nodeId}</h3>
                       <p className="text-slate-500 text-sm mb-6">Action required. Please review and decide.</p>
                       
                       <div className="flex gap-3">
                           <button 
                               onClick={() => handleAction('approve')}
                               className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-all node-action-btn"
                           >
                               <Check size={18} /> Approve
                           </button>
                           <button 
                               onClick={() => handleAction('reject')}
                               className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 py-3 rounded-lg font-bold transition-all node-action-btn"
                           >
                               <X size={18} /> Reject
                           </button>
                       </div>
                       <button onClick={() => setActionModal({isOpen: false, nodeId: null})} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">Cancel</button>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
}