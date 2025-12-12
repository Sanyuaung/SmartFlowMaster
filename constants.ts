import { WorkflowDefinition, StateTypeDefinition, BaseBehaviorDefinition } from './types';

export const DEFAULT_BASE_BEHAVIORS: BaseBehaviorDefinition[] = [
  { 
    type: 'task', 
    name: 'Human Task', 
    executionMode: 'interactive', 
    icon: 'FileText',
    hasRole: true,
    hasSla: true,
    description: 'A standard step requiring human intervention.'
  },
  { 
    type: 'multi-approver', 
    name: 'Multi-Approver', 
    executionMode: 'interactive', 
    icon: 'Users',
    hasRole: true,
    hasSla: true,
    description: 'Requires consensus from a group.'
  },
  { 
    type: 'system', 
    name: 'System Action', 
    executionMode: 'automated', 
    icon: 'CheckCircle2',
    hasActionConfig: true,
    description: 'Automated background process or hook.'
  },
  { 
    type: 'decision', 
    name: 'Decision Logic', 
    executionMode: 'decision', 
    icon: 'Cpu',
    hasConditions: true,
    description: 'Evaluates data to choose a path.'
  },
  { 
    type: 'parallel', 
    name: 'Parallel Split', 
    executionMode: 'parallel', 
    icon: 'GitBranch',
    hasBranches: true,
    description: 'Splits execution into concurrent branches.'
  }
];

export const DEFAULT_STATE_TYPES: StateTypeDefinition[] = [
  { type: 'task', name: 'User Task', baseType: 'task', color: 'indigo', description: 'Standard human approval step' },
  { type: 'multi-approver', name: 'Group Approval', baseType: 'multi-approver', color: 'blue', description: 'Requires approval from a group of users' },
  { type: 'parallel', name: 'Parallel Split', baseType: 'parallel', color: 'purple', description: 'Splits workflow into concurrent branches' },
  { type: 'decision', name: 'Logic Gate', baseType: 'decision', color: 'emerald', description: 'Conditional routing based on data' },
  { type: 'system', name: 'System Action', baseType: 'system', color: 'slate', description: 'Automated background process' }
];

export const DEFAULT_WORKFLOW: WorkflowDefinition = {
  "workflowId": "txn_maker_checker_v1",
  "version": 2,
  "name": "Maker-Checker Workflow",
  "start": "b_maker_submit",
  "states": {
    "b_maker_submit": {
      "type": "task",
      "role": "B_Maker",
      "next": "b_checker_approval"
    },
    "b_checker_approval": {
      "type": "task",
      "role": "B_Checker",
      "next": "c_maker_pre_approval",
      "onReject": "__TERMINATE__"
    },
    "c_maker_pre_approval": {
      "type": "task",
      "role": "C_Maker",
      "next": "c_checker_approval",
      "onReject": "__TERMINATE__"
    },
    "c_checker_approval": {
      "type": "task",
      "role": "C_Checker",
      "next": "parallel_compliance",
      "onReject": "__TERMINATE__"
    },
    "parallel_compliance": {
      "type": "parallel",
      "branches": [
        "finance_review",
        "legal_review"
      ],
      "completionRule": "any",
      "next": "amount_check"
    },
    "finance_review": {
      "type": "task",
      "role": "Finance",
      "onReject": "__TERMINATE__"
    },
    "legal_review": {
      "type": "task",
      "role": "Legal",
      "onReject": "__TERMINATE__"
    },
    "amount_check": {
      "type": "decision",
      "conditions": [
        {
          "if": "data.amount >= 100000",
          "next": "executive_parallel"
        },
        {
          "else": "finalize"
        }
      ]
    },
    "executive_parallel": {
      "type": "parallel",
      "branches": [
        "ceo_approval",
        "cfo_approval"
      ],
      "completionRule": "all",
      "next": "finalize"
    },
    "ceo_approval": {
      "type": "task",
      "role": "CEO",
      "onReject": "__TERMINATE__"
    },
    "cfo_approval": {
      "type": "task",
      "role": "CFO",
      "onReject": "__TERMINATE__"
    },
    "finalize": {
      "type": "system",
      "action": "completeTransaction",
      "next": null
    }
  }
};

export const INITIAL_WORKFLOWS: WorkflowDefinition[] = [
  DEFAULT_WORKFLOW,
  {
    "workflowId": "simple_leave_request",
    "version": 1,
    "name": "Simple Leave Request",
    "start": "request_submission",
    "states": {
      "request_submission": {
        "type": "task",
        "role": "employee",
        "next": "manager_approval"
      },
      "manager_approval": {
        "type": "decision",
        "conditions": [
          { "if": "data.days < 3", "next": "auto_approve" },
          { "else": "hr_approval" }
        ]
      },
      "hr_approval": {
        "type": "task",
        "role": "hr_admin",
        "next": "notify_employee"
      },
      "auto_approve": {
        "type": "system",
        "action": "approveRequest",
        "next": "notify_employee"
      },
      "notify_employee": {
        "type": "system",
        "action": "sendEmail",
        "next": null
      }
    }
  }
];

export const DEFAULT_DATA = {
  "workflow_id": "txn_maker_checker_v1",
  "amount": 150000,
  "type": "Cash"
};
