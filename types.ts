
export type CoreStateType = 'task' | 'parallel' | 'decision' | 'multi-approver' | 'system';
export type StateType = string; // Allows custom types

export interface StateTypeDefinition {
  type: string;
  name: string;
  baseType: CoreStateType;
  color?: string; // Tailwind class suffix e.g. 'indigo', 'red'
  description?: string;
}

export interface WorkflowCondition {
  if?: string;
  else?: string;
  next?: string;
}

export interface WorkflowState {
  type: StateType;
  role?: string;
  next?: string | null;
  onReject?: string | null; // Target state if rejected. If null/undefined, workflow ends (default).
  branches?: string[];
  // 'all' = wait for all branches to finish. 'any' = proceed as soon as one finishes.
  completionRule?: 'all' | 'any';
  conditions?: WorkflowCondition[];
  slaHours?: number; // Deprecated in favor of slaDuration, kept for backward compatibility
  slaDuration?: number; // Duration in milliseconds
  onTimeout?: string;
  action?: string;
  roleGroup?: string;
  approvalRule?: string;
}

export interface WorkflowDefinition {
  workflowId: string;
  version: number;
  name: string;
  start: string;
  states: Record<string, WorkflowState>;
}

export interface WorkflowContextData {
  [key: string]: any;
}

export interface ExecutionHistoryItem {
  timestamp: Date;
  stateId: string;
  action: 'approve' | 'reject' | 'auto' | 'start';
  details?: string;
}

// Runtime status of a state
export type StepStatus = 'pending' | 'active' | 'completed' | 'rejected' | 'skipped';

export interface TaskInstance {
  id: string;
  workflowId: string;
  workflowName: string; // Cached for display
  status: 'running' | 'completed' | 'rejected';
  data: WorkflowContextData;
  currentStates: string[];
  history: ExecutionHistoryItem[];
  parallelCompletion: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}
