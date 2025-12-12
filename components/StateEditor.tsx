import React, { useState, useEffect, useMemo } from 'react';
import { WorkflowState, StateType, WorkflowCondition, StateTypeDefinition, BaseBehaviorDefinition } from '../types';
import { X, Plus, Trash2, ArrowRight, Clock, ShieldAlert, GitBranch, Cpu, CheckCircle2, User, Users } from 'lucide-react';

interface StateEditorProps {
  id: string;
  state: WorkflowState | null;
  existingIds: string[];
  stateTypes: StateTypeDefinition[];
  baseBehaviors: BaseBehaviorDefinition[]; // New Prop
  onSave: (id: string, state: WorkflowState) => void;
  onCancel: () => void;
}

const StateEditor: React.FC<StateEditorProps> = ({ id, state, existingIds, stateTypes, baseBehaviors, onSave, onCancel }) => {
  const [formData, setFormData] = useState<WorkflowState>({
    type: 'task',
    next: '',
  });
  const [editId, setEditId] = useState(id);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (state) {
      setFormData(JSON.parse(JSON.stringify(state)));
    } else {
       setFormData({ type: 'task', next: '' });
       setEditId('');
    }
    setEditId(id);
  }, [id, state]);

  // Derived: Find the Base Behavior Definition for the currently selected Type
  const activeTypeDef = stateTypes.find(t => t.type === formData.type) || stateTypes[0];
  const activeBaseBehavior = baseBehaviors.find(b => b.type === activeTypeDef?.baseType) || baseBehaviors[0];

  // --- SLA Duration Helpers ---
  const durationValues = useMemo(() => {
      const ms = formData.slaDuration !== undefined 
          ? formData.slaDuration 
          : (formData.slaHours ? formData.slaHours * 3600000 : 0);
      return {
          d: Math.floor(ms / 86400000),
          h: Math.floor((ms % 86400000) / 3600000),
          m: Math.floor((ms % 3600000) / 60000),
          s: Math.floor((ms % 60000) / 1000)
      };
  }, [formData.slaDuration, formData.slaHours]);

  const updateDuration = (field: 'd' | 'h' | 'm' | 's', value: number) => {
      const val = Math.max(0, value);
      const current = durationValues;
      const newVals = { ...current, [field]: val };
      const totalMs = (newVals.d * 86400000) + (newVals.h * 3600000) + (newVals.m * 60000) + (newVals.s * 1000);
      setFormData(prev => ({ ...prev, slaDuration: totalMs, slaHours: undefined }));
  };

  const handleChange = (field: keyof WorkflowState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // When Type changes, we might need to clean up fields, but now we do it based on Capabilities
  const handleTypeChange = (newType: StateType) => {
    setFormData(prev => ({ ...prev, type: newType }));
    // Note: We are less aggressive about deleting data to allow switching between similar types
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setFormData(parsed);
      setJsonError('');
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleSave = () => {
    if (!editId.trim()) return;
    onSave(editId, formData);
  };

  // --- Condition Helpers ---
  const addCondition = () => {
      const newCond: WorkflowCondition = { if: 'data.value > 0', next: '' };
      setFormData(prev => ({ ...prev, conditions: [...(prev.conditions || []), newCond] }));
  };

  const removeCondition = (index: number) => {
      setFormData(prev => ({ ...prev, conditions: prev.conditions?.filter((_, i) => i !== index) }));
  };

  const updateCondition = (index: number, field: keyof WorkflowCondition, value: string) => {
      setFormData(prev => {
          const newConds = [...(prev.conditions || [])];
          newConds[index] = { ...newConds[index], [field]: value };
          return { ...prev, conditions: newConds };
      });
  };

  // --- Dynamic Sections based on Capabilities ---

  const renderRoleConfig = () => (
      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-blue-600"/>
              <h4 className="text-sm font-semibold text-blue-900">Assignment & Roles</h4>
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-800 mb-1">Assigned Role / User / Group</label>
            <input
                type="text"
                value={formData.role || formData.roleGroup || ''}
                onChange={(e) => {
                    // Hybrid support for legacy 'role' and 'roleGroup'
                    handleChange('role', e.target.value);
                    if (activeBaseBehavior.type === 'multi-approver') handleChange('roleGroup', e.target.value);
                }}
                className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-blue-500"
                placeholder="e.g., finance_team"
            />
          </div>
          
          {/* Specific Logic for Multi-Approver if detected via ID or capability */}
          {activeBaseBehavior.type === 'multi-approver' && (
            <div>
                <label className="block text-xs font-medium text-blue-800 mb-1">Approval Rule</label>
                <select
                value={formData.approvalRule || 'oneOf'}
                onChange={(e) => handleChange('approvalRule', e.target.value)}
                className="w-full text-gray-900 px-3 py-2 border border-blue-200 rounded-md bg-white text-sm"
                >
                    <option value="oneOf">One Of (First approval wins)</option>
                    <option value="all">All (Everyone must approve)</option>
                    <option value="majority">Majority (51% required)</option>
                </select>
            </div>
          )}
      </div>
  );

  const renderTransitionConfig = () => (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
           <div className="flex items-center gap-2 mb-1">
              <ArrowRight size={16} className="text-gray-600"/>
              <h4 className="text-sm font-semibold text-gray-900">Transitions</h4>
          </div>
          
          <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Next State (On Success)
              </label>
              <select
                  value={formData.next || ''}
                  onChange={(e) => handleChange('next', e.target.value || null)}
                  className="w-full text-gray-900 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-indigo-500"
              >
                  <option value="">(End Workflow / Stop)</option>
                  {existingIds.filter(eid => eid !== editId).map(eid => (
                      <option key={eid} value={eid}>{eid}</option>
                  ))}
              </select>
          </div>

          {activeBaseBehavior.executionMode === 'interactive' && (
              <div>
                  <label className="block text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                     <ShieldAlert size={12}/> On Reject Next State
                  </label>
                  <select
                      value={formData.onReject || ''}
                      onChange={(e) => handleChange('onReject', e.target.value || null)}
                      className="w-full px-3 py-2 border border-red-200 bg-red-50/30 rounded-md text-sm text-gray-900 focus:ring-red-500"
                  >
                      <option value="">(Default: Terminate Workflow)</option>
                      <option value="__TERMINATE__">Terminate Workflow</option>
                      {existingIds.filter(eid => eid !== editId).map(eid => (
                          <option key={eid} value={eid}>{eid}</option>
                      ))}
                  </select>
              </div>
          )}
      </div>
  );

  const renderSLAConfig = () => (
      <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-200 space-y-3">
          <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-orange-600"/>
              <h4 className="text-sm font-semibold text-orange-900">SLA & Timeout</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-orange-800 mb-1">Duration</label>
                <div className="grid grid-cols-4 gap-1">
                    {['d', 'h', 'm', 's'].map((unit) => (
                        <div key={unit} className="flex flex-col">
                            <input
                                type="number"
                                min="0"
                                value={durationValues[unit as keyof typeof durationValues]}
                                onChange={(e) => updateDuration(unit as any, parseInt(e.target.value) || 0)}
                                className="px-1 py-1.5 border border-orange-200 rounded-md text-center text-sm focus:ring-orange-500"
                            />
                            <span className="text-[10px] text-orange-600 text-center uppercase">{unit}</span>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="col-span-2">
                <label className="block text-xs font-medium text-orange-800 mb-1">On Timeout Next State</label>
                <select
                    value={formData.onTimeout || ''}
                    onChange={(e) => handleChange('onTimeout', e.target.value)}
                    className="w-full text-gray-900 px-3 py-2 border border-orange-200 rounded-md bg-white text-sm"
                >
                    <option value="">(No Action - Wait)</option>
                    <option value="__TERMINATE__">Terminate Workflow</option>
                    {existingIds.filter(eid => eid !== editId).map(eid => (
                        <option key={eid} value={eid}>{eid}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>
  );

  const renderParallelConfig = () => (
      <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-200 space-y-3">
          <div className="flex items-center gap-2 mb-1">
              <GitBranch size={16} className="text-purple-600"/>
              <h4 className="text-sm font-semibold text-purple-900">Parallel Branching</h4>
          </div>
          <div>
            <label className="block text-xs font-medium text-purple-800 mb-1">Branches (Comma separated IDs)</label>
            <input
            type="text"
            value={formData.branches?.join(', ') || ''}
            onChange={(e) => handleChange('branches', e.target.value.split(',').map(s => s.trim()))}
            className="w-full px-3 py-2 border border-purple-200 rounded-md text-sm focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-purple-800 mb-1">Completion Rule</label>
            <select
                value={formData.completionRule || 'all'}
                onChange={(e) => handleChange('completionRule', e.target.value)}
                className="w-full text-gray-900 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm"
            >
                <option value="all">Wait for ALL branches</option>
                <option value="any">Proceed if ANY branch completes</option>
            </select>
          </div>
      </div>
  );

  const renderDecisionConfig = () => (
      <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-emerald-600"/>
                <h4 className="text-sm font-semibold text-emerald-900">Logic Conditions</h4>
              </div>
              <button onClick={addCondition} className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-bold bg-white px-2 py-1 rounded border border-emerald-200 shadow-sm">
                  <Plus size={12} /> Add
              </button>
          </div>
          
          <div className="space-y-3">
              {formData.conditions?.map((cond, idx) => (
                  <div key={idx} className="flex gap-2 items-start bg-white p-2 rounded-md border border-emerald-100 shadow-sm">
                      <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                              <select 
                                  className="text-[10px] font-bold uppercase bg-transparent border-none text-emerald-600 focus:ring-0 w-16"
                                  value={cond.else ? 'else' : 'if'}
                                  onChange={(e) => {
                                      if (e.target.value === 'else') {
                                          updateCondition(idx, 'if', '');
                                          updateCondition(idx, 'else', 'true');
                                      } else {
                                          updateCondition(idx, 'else', '');
                                          updateCondition(idx, 'if', 'data.val > 0');
                                      }
                                  }}
                              >
                                  <option value="if">IF</option>
                                  <option value="else">ELSE</option>
                              </select>
                              
                              {!cond.else && (
                                  <input 
                                      type="text" 
                                      className="flex-1 px-2 text-gray-900 py-1 text-sm border border-gray-200 rounded bg-gray-50 focus:ring-emerald-500 font-mono"
                                      value={cond.if || ''}
                                      onChange={(e) => updateCondition(idx, 'if', e.target.value)}
                                  />
                              )}
                              {cond.else && <div className="flex-1 text-xs text-gray-400 italic pt-1 pl-2">Fallback path</div>}
                          </div>

                          <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-16 text-right">THEN &rarr;</span>
                              <select
                                  className="flex-1 px-2 py-1 text-gray-900 text-sm border border-gray-200 rounded bg-white"
                                  value={cond.next || ''}
                                  onChange={(e) => updateCondition(idx, 'next', e.target.value)}
                              >
                                  <option value="">Select Next State...</option>
                                  {existingIds.filter(eid => eid !== editId).map(eid => (
                                      <option key={eid} value={eid}>{eid}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <button onClick={() => removeCondition(idx)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 size={14} />
                      </button>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="bg-white flex flex-col h-full max-h-[90vh]">
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <h2 className="text-xl font-bold text-gray-800">
          {state ? 'Edit State' : 'New State'}
        </h2>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setJsonMode(!jsonMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${jsonMode ? 'bg-indigo-100 text-indigo-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
                {jsonMode ? 'Switch to Form' : 'Edit as JSON'}
             </button>
             <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State ID</label>
            <input
            type="text"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            disabled={!!state}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 text-gray-900"
            />
        </div>

        {jsonMode ? (
             <textarea
                className="w-full h-96 p-3 font-mono text-sm border rounded-md bg-slate-50"
                value={JSON.stringify(formData, null, 2)}
                onChange={handleJsonChange}
            />
        ) : (
            <>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">State Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleTypeChange(e.target.value as StateType)}
                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                    >
                        {stateTypes.map(t => (
                            <option key={t.type} value={t.type}>{t.name} ({t.type})</option>
                        ))}
                    </select>
                </div>

                {/* DYNAMIC FORM RENDERING */}
                {activeBaseBehavior.hasRole && renderRoleConfig()}
                {activeBaseBehavior.hasBranches && renderParallelConfig()}
                {activeBaseBehavior.hasConditions && renderDecisionConfig()}
                
                {activeBaseBehavior.hasActionConfig && (
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                         <div className="flex items-center gap-2 mb-2">
                             <CheckCircle2 size={16} className="text-slate-600"/>
                             <h4 className="text-sm font-semibold text-slate-900">System Action</h4>
                         </div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Function Name</label>
                        <input
                        type="text"
                        value={formData.action || ''}
                        onChange={(e) => handleChange('action', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-indigo-500"
                        />
                    </div>
                )}

                {activeBaseBehavior.hasSla && renderSLAConfig()}

                {/* Transitions - show if it's not a Decision (Decisions handle next via conditions) */}
                {activeBaseBehavior.executionMode !== 'decision' && renderTransitionConfig()}
            </>
        )}
      </div>

      <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white shrink-0">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm">Save State</button>
      </div>
    </div>
  );
};

export default StateEditor;
