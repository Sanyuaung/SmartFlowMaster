export type StateType = 'task' | 'parallel' | 'decision' | 'multi-approver' | 'system';

export interface WorkflowCondition {
  if?: string;
  else?: string;
  next?: string;
}

export interface WorkflowState {
  type: StateType;
  role?: string;
  next?: string | null;
  branches?: string[];
  // 'all' = wait for all branches to finish. 'any' = proceed as soon as one finishes.
  completionRule?: 'all' | 'any';
  conditions?: WorkflowCondition[];
  slaHours?: number;
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