import { WorkflowDefinition } from './types';

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
      "next": "risk_decision"
    },
    "finance_review": {
      "type": "task",
      "role": "finance",
      "slaHours": 24,
      "onTimeout": "escalate_finance_manager"
    },
    "legal_review": {
      "type": "task",
      "role": "legal"
    },
    "risk_decision": {
      "type": "decision",
      "conditions": [
        {
          "if": "data.amount > 1000000",
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