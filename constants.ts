
import { WorkflowDefinition, StateTypeDefinition } from './types';

export const DEFAULT_STATE_TYPES: StateTypeDefinition[] = [
  { type: 'task', name: 'User Task', baseType: 'task', color: 'indigo', description: 'Standard human approval step' },
  { type: 'multi-approver', name: 'Group Approval', baseType: 'multi-approver', color: 'blue', description: 'Requires approval from a group of users' },
  { type: 'parallel', name: 'Parallel Split', baseType: 'parallel', color: 'purple', description: 'Splits workflow into concurrent branches' },
  { type: 'decision', name: 'Logic Gate', baseType: 'decision', color: 'emerald', description: 'Conditional routing based on data' },
  { type: 'system', name: 'System Action', baseType: 'system', color: 'slate', description: 'Automated background process' }
];

export const DEFAULT_WORKFLOW: WorkflowDefinition = {
  "workflowId": "txn_complex_v1",
  "version": 1,
  "name": "Complex Transaction Approval",
  "start": "maker_submit",
  "states": {
    "maker_submit": {
      "type": "task",
      "role": "maker",
      "next": "parallel_reviews"
    },
    "parallel_reviews": {
      "type": "parallel",
      "branches": [
        "finance_review",
        "legal_review"
      ],
      "next": "risk_decision",
      "completionRule": "any"
  },
    "finance_review": {
      "type": "task",
      "role": "finance",
      "slaDuration": 60000
    },
    "legal_review": {
      "type": "task",
      "role": "legal"
    },
    "risk_decision": {
      "type": "decision",
      "conditions": [
        {
          "if": "data.amount > 1000",
          "next": "ceo_approval"
        },
        {
          "else": "finalize"
        }
      ]
    },
    "ceo_approval": {
      "type": "multi-approver",
      "roleGroup": "CEO",
      "approvalRule": "oneOf",
      "next": "finalize"
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
  amount: 1000000,
  type: "Cash"
};
