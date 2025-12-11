import React, { useState, useEffect } from 'react';
import { WorkflowState, StateType } from '../types';
import { X } from 'lucide-react';

interface StateEditorProps {
  id: string;
  state: WorkflowState | null; // null means new state
  existingIds: string[];
  onSave: (id: string, state: WorkflowState) => void;
  onCancel: () => void;
}

const StateEditor: React.FC<StateEditorProps> = ({ id, state, existingIds, onSave, onCancel }) => {
  const [formData, setFormData] = useState<WorkflowState>({
    type: 'task',
    next: '',
  });
  const [editId, setEditId] = useState(id);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (state) {
      setFormData(state);
    }
    setEditId(id);
  }, [id, state]);

  const handleChange = (field: keyof WorkflowState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  return (
    <div className="bg-white">
      {/* Header inside Editor */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800">
          {state ? 'Edit State' : 'New State'}
        </h2>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setJsonMode(!jsonMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${jsonMode ? 'bg-blue-100 text-blue-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
             >
                {jsonMode ? 'Switch to Form' : 'Edit as JSON'}
             </button>
             <button 
               onClick={onCancel}
               className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
             >
               <X size={20} />
             </button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State ID (Key)</label>
            <input
            type="text"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
            disabled={!!state}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-gray-900"
            placeholder="e.g., finance_review"
            />
        </div>

        {jsonMode ? (
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State Definition (JSON)</label>
                <textarea
                    className="w-full h-64 p-3 font-mono text-sm border rounded-md bg-slate-50 focus:ring-2 focus:ring-blue-500 text-gray-900"
                    defaultValue={JSON.stringify(formData, null, 2)}
                    onChange={handleJsonChange}
                />
                {jsonError && <p className="text-red-500 text-sm mt-1">{jsonError}</p>}
            </div>
        ) : (
            <>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value as StateType)}
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                >
                    <option value="task">Task</option>
                    <option value="parallel">Parallel</option>
                    <option value="decision">Decision</option>
                    <option value="multi-approver">Multi Approver</option>
                    <option value="system">System</option>
                </select>
                </div>

                {/* Common fields based on type */}
                {(formData.type === 'task' || formData.type === 'multi-approver') && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Role Group</label>
                    <input
                    type="text"
                    value={formData.role || formData.roleGroup || ''}
                    onChange={(e) => {
                        if (formData.type === 'multi-approver') handleChange('roleGroup', e.target.value);
                        else handleChange('role', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md text-gray-900"
                    placeholder="e.g., finance"
                    />
                </div>
                )}

                {formData.type === 'parallel' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branches (Comma separated IDs)</label>
                            <input
                            type="text"
                            value={formData.branches?.join(', ') || ''}
                            onChange={(e) => handleChange('branches', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full px-3 py-2 border rounded-md text-gray-900"
                            placeholder="e.g., finance_review, legal_review"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Completion Rule</label>
                            <select
                                value={formData.completionRule || 'all'}
                                onChange={(e) => handleChange('completionRule', e.target.value)}
                                className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                            >
                                <option value="all">Wait for ALL branches to complete</option>
                                <option value="any">Proceed if ANY branch completes</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                'Any' will cancel other running branches once the first one finishes.
                            </p>
                        </div>
                    </>
                )}

                {formData.type === 'system' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Name</label>
                        <input
                        type="text"
                        value={formData.action || ''}
                        onChange={(e) => handleChange('action', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-gray-900"
                        placeholder="e.g., completeTransaction"
                        />
                    </div>
                )}

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next State ID (Optional)</label>
                <select
                    value={formData.next || ''}
                    onChange={(e) => handleChange('next', e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                >
                    <option value="">(End of Flow / Defined in Logic)</option>
                    {existingIds.map(eid => (
                        <option key={eid} value={eid}>{eid}</option>
                    ))}
                </select>
                </div>
            </>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!!jsonError}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default StateEditor;