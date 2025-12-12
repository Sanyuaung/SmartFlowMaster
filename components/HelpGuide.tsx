import React from 'react';
import { Edit3, Eye, Play, ArrowRight, CheckCircle2, Layers, Settings, Box } from 'lucide-react';

export default function HelpGuide() {
  return (
    <div className="space-y-10 p-4 h-full overflow-y-auto">
      
      {/* --- Intro Section --- */}
      <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900">Workflow Engine Guide</h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">
              Master the creation, visualization, and simulation of complex business processes using the SmartFlowMaster engine.
          </p>
      </div>

      {/* --- Lifecycle Diagram --- */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Process Lifecycle</h3>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center group">
                <div className="w-16 h-16 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-indigo-300 transition-all duration-300">
                    <Edit3 size={28} />
                </div>
                <span className="font-bold text-slate-800">1. Define</span>
                <span className="text-xs text-slate-500 mt-1">Configure States</span>
            </div>

            <ArrowRight size={24} className="hidden md:block text-slate-300" />

            {/* Step 2 */}
            <div className="flex flex-col items-center group">
                 <div className="w-16 h-16 bg-white border-2 border-violet-100 text-violet-600 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-violet-300 transition-all duration-300">
                    <Eye size={28} />
                </div>
                <span className="font-bold text-slate-800">2. Visualize</span>
                <span className="text-xs text-slate-500 mt-1">Verify Structure</span>
            </div>

            <ArrowRight size={24} className="hidden md:block text-slate-300" />

            {/* Step 3 */}
            <div className="flex flex-col items-center group">
                 <div className="w-16 h-16 bg-white border-2 border-emerald-100 text-emerald-600 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-emerald-300 transition-all duration-300">
                    <Play size={28} />
                </div>
                <span className="font-bold text-slate-800">3. Simulate</span>
                <span className="text-xs text-slate-500 mt-1">Test Execution</span>
            </div>
        </div>
      </div>

      {/* --- Configuration Guide --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Layers size={20} className="text-indigo-600"/> Base Behaviors
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  <b>Base Behaviors</b> are the fundamental building blocks (e.g., Task, Decision, Parallel). 
                  You can define <i>how</i> the engine executes a node.
              </p>
              <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <Box size={16} className="text-blue-500 mt-0.5" />
                      <div>
                          <span className="font-semibold block text-slate-800">Interactive</span>
                          <span className="text-slate-500 text-xs">Stops and waits for user input (e.g., Approval).</span>
                      </div>
                  </li>
                  <li className="flex items-start gap-3 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <Box size={16} className="text-emerald-500 mt-0.5" />
                      <div>
                          <span className="font-semibold block text-slate-800">Decision</span>
                          <span className="text-slate-500 text-xs">Evaluates conditions to route flow automatically.</span>
                      </div>
                  </li>
              </ul>
          </div>

          <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings size={20} className="text-indigo-600"/> State Types
              </h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  <b>State Types</b> are custom templates based on behaviors. They define the <i>visual style</i> and <i>business meaning</i>.
              </p>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-800 mb-2 uppercase tracking-wide">Example Usage</p>
                  <p className="text-sm text-slate-700 mb-2">
                      You create a Base Behavior called <b>"Interactive Task"</b>.
                  </p>
                  <p className="text-sm text-slate-700">
                      Then create two State Types:
                      <br/>
                      1. <b>"Manager Approval"</b> (Red color, User Role)<br/>
                      2. <b>"Data Entry"</b> (Blue color, User Role)
                  </p>
              </div>
          </div>
      </div>

      {/* --- Step-by-Step Testing --- */}
      <div>
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              How to Test a Workflow
          </h3>
          
          <div className="space-y-4">
              <div className="flex group">
                  <div className="flex flex-col items-center mr-4">
                      <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">1</div>
                      <div className="w-0.5 h-full bg-slate-100 mt-1"></div>
                  </div>
                  <div className="pb-6">
                      <h4 className="font-bold text-slate-800 text-sm">Design the Flow</h4>
                      <p className="text-sm text-slate-600 mt-1">
                          Go to the <b>Designer</b>. Click "Add New State". Select a Type (e.g., Decision). 
                          Define the logic: <code>If data.amount &gt; 1000 then Manager_Approval</code>.
                      </p>
                  </div>
              </div>

              <div className="flex group">
                  <div className="flex flex-col items-center mr-4">
                      <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">2</div>
                      <div className="w-0.5 h-full bg-slate-100 mt-1"></div>
                  </div>
                  <div className="pb-6">
                      <h4 className="font-bold text-slate-800 text-sm">Verify Links</h4>
                      <p className="text-sm text-slate-600 mt-1">
                          Open the <b>Visualizer</b>. Drag nodes to organize them. 
                          Check for any red "Disconnected" nodes. Ensure the Start node connects to the rest.
                      </p>
                  </div>
              </div>

              <div className="flex group">
                  <div className="flex flex-col items-center mr-4">
                      <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">3</div>
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 text-sm">Run Simulation</h4>
                      <p className="text-sm text-slate-600 mt-1">
                          Open <b>Simulator</b>. You can modify the JSON context data before starting. 
                          Click "Start". Watch the highlighting move.
                          <br/>
                          <span className="inline-block mt-2 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600 font-mono">
                             Pro Tip: Change JSON "amount": 2000 to test the decision logic path.
                          </span>
                      </p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
}