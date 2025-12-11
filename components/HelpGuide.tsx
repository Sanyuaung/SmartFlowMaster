import React from 'react';
import { Edit3, Eye, Play, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HelpGuide() {
  return (
    <div className="space-y-8 p-2">
      
      {/* --- Diagram Section --- */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Workflow Lifecycle Diagram</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center z-10">
                <div className="w-16 h-16 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl shadow-sm flex items-center justify-center mb-3">
                    <Edit3 size={28} />
                </div>
                <span className="font-bold text-slate-800">1. Define</span>
                <span className="text-xs text-slate-500 mt-1">Configure States</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex text-slate-300">
                <ArrowRight size={24} />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center z-10">
                 <div className="w-16 h-16 bg-white border-2 border-violet-100 text-violet-600 rounded-2xl shadow-sm flex items-center justify-center mb-3">
                    <Eye size={28} />
                </div>
                <span className="font-bold text-slate-800">2. Visualize</span>
                <span className="text-xs text-slate-500 mt-1">Verify Structure</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:flex text-slate-300">
                <ArrowRight size={24} />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center z-10">
                 <div className="w-16 h-16 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl shadow-sm flex items-center justify-center mb-3">
                    <Play size={28} />
                </div>
                <span className="font-bold text-slate-800">3. Simulate</span>
                <span className="text-xs text-slate-500 mt-1">Test Execution</span>
            </div>

            {/* Connector Line (Mobile hidden) */}
            <div className="absolute top-8 left-10 right-10 h-0.5 bg-slate-200 -z-0 hidden md:block"></div>
        </div>
      </div>

      {/* --- Notes Section --- */}
      <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
              Testing Instructions
          </h3>
          
          <div className="grid gap-4">
              <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                      <h4 className="font-semibold text-gray-800">Setup State Logic</h4>
                      <p className="text-sm text-gray-600 mt-1">
                          Use the <b>Designer</b> to add states. Ensure you define <b>State Types</b> correctly (e.g., set 'Decision' for conditional paths) and link them via the 'Next' or 'Branches' fields.
                      </p>
                  </div>
              </div>

              <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="shrink-0 w-8 h-8 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                      <h4 className="font-semibold text-gray-800">Check Connections</h4>
                      <p className="text-sm text-gray-600 mt-1">
                          Switch to the <b>Visualizer</b> mode. Confirm that all nodes are connected and there are no "Missing State" errors (red nodes).
                      </p>
                  </div>
              </div>

              <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="shrink-0 w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                      <h4 className="font-semibold text-gray-800">Run Simulation</h4>
                      <p className="text-sm text-gray-600 mt-1">
                          Enter <b>Simulator</b> mode. Provide initial JSON data (e.g., <code>{'{ "amount": 5000 }'}</code>) and click 'Start'. The engine will highlight active steps. You can manually 'Approve' or 'Reject' tasks to test different outcomes.
                      </p>
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex items-start gap-3">
          <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
          <p>
              <b>Pro Tip:</b> Create custom <b>State Types</b> (via the Settings button) to reuse specific behaviors like "Manager Approval" or "System Email" across multiple workflows.
          </p>
      </div>

    </div>
  );
}