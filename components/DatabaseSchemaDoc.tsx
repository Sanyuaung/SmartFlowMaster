import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, Key, Table, Link as LinkIcon, Shield, Search, Zap, Server, Code, 
  Move, Plus, Minus, Info, AlertTriangle, Lightbulb, Lock, ChevronRight, ChevronLeft,
  CheckCircle2, Cpu
} from 'lucide-react';

// --- Types & Data ---

interface Column {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  desc?: string;
}

interface DBTable {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'system';
  x: number;
  y: number;
  columns: Column[];
}

interface Relation {
  from: string; // Table ID
  to: string;   // Table ID
  label?: string;
}

const TABLE_WIDTH = 280;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 28;

const DB_TABLES: DBTable[] = [
  // Domain: Definition
  {
    id: 'workflow_definitions',
    name: 'workflow_definitions',
    type: 'primary',
    x: 50,
    y: 50,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "tenant_id", type: "UUID", fk: true },
      { name: "name", type: "VARCHAR(255)" },
      { name: "key", type: "VARCHAR(100)" },
      { name: "is_active", type: "BOOLEAN" },
    ]
  },
  {
    id: 'workflow_versions',
    name: 'workflow_versions',
    type: 'primary',
    x: 450,
    y: 50,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "workflow_id", type: "UUID", fk: true },
      { name: "version", type: "INT" },
      { name: "definition_json", type: "JSONB" },
      { name: "published_at", type: "TIMESTAMP" }
    ]
  },
  // Domain: Runtime
  {
    id: 'workflow_instances',
    name: 'workflow_instances',
    type: 'secondary',
    x: 450,
    y: 350,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "version_id", type: "UUID", fk: true },
      { name: "status", type: "ENUM" },
      { name: "current_states", type: "JSONB" },
      { name: "context_data", type: "JSONB" }
    ]
  },
  {
    id: 'task_assignments',
    name: 'task_assignments',
    type: 'secondary',
    x: 850,
    y: 350,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "instance_id", type: "UUID", fk: true },
      { name: "state_id", type: "VARCHAR" },
      { name: "user_id", type: "UUID", fk: true },
      { name: "status", type: "ENUM" }
    ]
  },
  {
    id: 'audit_logs',
    name: 'audit_logs',
    type: 'system',
    x: 450,
    y: 650,
    columns: [
      { name: "id", type: "BIGINT", pk: true },
      { name: "instance_id", type: "UUID", fk: true },
      { name: "action", type: "VARCHAR" },
      { name: "payload", type: "JSONB" },
      { name: "created_at", type: "TIMESTAMP" }
    ]
  },
  // Domain: Identity
  {
    id: 'users',
    name: 'users',
    type: 'system',
    x: 850,
    y: 50,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "email", type: "VARCHAR" },
      { name: "full_name", type: "VARCHAR" },
      { name: "is_active", type: "BOOLEAN" }
    ]
  },
  {
    id: 'roles',
    name: 'roles',
    type: 'system',
    x: 1250,
    y: 50,
    columns: [
      { name: "id", type: "UUID", pk: true },
      { name: "name", type: "VARCHAR" },
      { name: "permissions", type: "JSONB" }
    ]
  },
  {
    id: 'user_roles',
    name: 'user_roles',
    type: 'system',
    x: 1050,
    y: 200,
    columns: [
      { name: "user_id", type: "UUID", fk: true },
      { name: "role_id", type: "UUID", fk: true }
    ]
  }
];

const DB_RELATIONS: Relation[] = [
  { from: 'workflow_versions', to: 'workflow_definitions', label: 'belongs to' },
  { from: 'workflow_instances', to: 'workflow_versions', label: 'instantiates' },
  { from: 'task_assignments', to: 'workflow_instances', label: 'tasks for' },
  { from: 'task_assignments', to: 'users', label: 'assigned to' },
  { from: 'audit_logs', to: 'workflow_instances', label: 'tracks' },
  { from: 'user_roles', to: 'users', label: 'links' },
  { from: 'user_roles', to: 'roles', label: 'links' },
];

// --- Components ---

const SchemaTableNode: React.FC<{ table: DBTable }> = ({ table }) => {
  const headerColor = table.type === 'primary' ? 'bg-indigo-600 border-indigo-700' : 
                      table.type === 'system' ? 'bg-slate-700 border-slate-800' : 
                      'bg-emerald-600 border-emerald-700';
  
  return (
    <div 
      className="absolute bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
      style={{ 
        left: table.x, 
        top: table.y, 
        width: TABLE_WIDTH,
      }}
    >
      <div className={`${headerColor} px-3 py-2 flex items-center justify-between text-white border-b`}>
        <div className="flex items-center gap-2">
           <Table size={14} className="opacity-80" />
           <span className="font-bold text-sm font-mono">{table.name}</span>
        </div>
        {table.type === 'primary' && <Code size={12} className="opacity-60"/>}
        {table.type === 'system' && <Server size={12} className="opacity-60"/>}
        {table.type === 'secondary' && <Zap size={12} className="opacity-60"/>}
      </div>
      <div className="bg-white">
        {table.columns.map((col, idx) => (
          <div key={idx} className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 last:border-0 text-xs hover:bg-slate-50">
            <div className="flex items-center gap-2 font-mono text-slate-700">
               {col.pk && <Key size={10} className="text-amber-500" />}
               {col.fk && <LinkIcon size={10} className="text-blue-400" />}
               <span className={col.pk ? 'font-bold text-slate-900' : ''}>{col.name}</span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">{col.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DatabaseSchemaDoc() {
  // --- Viewport State ---
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 0.9 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [showSidebar, setShowSidebar] = useState(true);

  // --- Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    // e.stopPropagation();
    if(e.ctrlKey) {
        const scaleAmount = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.3, transform.k + scaleAmount), 2);
        setTransform(prev => ({ ...prev, k: newScale }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    e.preventDefault();
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    }));
  };

  const handleMouseUp = () => setIsPanning(false);

  // --- Rendering ---

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden relative">
      
      {/* --- Canvas Area --- */}
      <div 
        className={`flex-1 relative overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background Grid */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
                backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                transformOrigin: '0 0'
            }}
        />

        <div 
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
            transformOrigin: '0 0',
            width: 2000, 
            height: 2000
          }}
          className="relative transition-transform duration-75 ease-out"
        >
             {/* Edges Layer */}
             <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <marker id="arrowhead-gray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                </defs>
                {DB_RELATIONS.map((rel, idx) => {
                    const fromTable = DB_TABLES.find(t => t.id === rel.from);
                    const toTable = DB_TABLES.find(t => t.id === rel.to);
                    if (!fromTable || !toTable) return null;

                    // Simple logic to connect centers roughly
                    // Adjust anchor points based on relative position
                    let startX = fromTable.x + TABLE_WIDTH/2;
                    let startY = fromTable.y + HEADER_HEIGHT + (fromTable.columns.length * ROW_HEIGHT)/2;
                    let endX = toTable.x + TABLE_WIDTH/2;
                    let endY = toTable.y + HEADER_HEIGHT + (toTable.columns.length * ROW_HEIGHT)/2;

                    // Calculate nicer path
                    const dx = endX - startX;
                    const dy = endY - startY;

                    // Orthogonal routing fallback or straight line with bezier
                    const path = `M ${startX} ${startY} C ${startX + dx/2} ${startY}, ${endX - dx/2} ${endY}, ${endX} ${endY}`;
                    
                    return (
                        <g key={idx}>
                             <path 
                                d={path} 
                                stroke="#cbd5e1" 
                                strokeWidth="2" 
                                fill="none"
                                markerEnd="url(#arrowhead-gray)"
                             />
                             {rel.label && (
                                 <foreignObject x={(startX + endX)/2 - 40} y={(startY + endY)/2 - 12} width="80" height="20">
                                     <div className="bg-slate-100 text-slate-500 text-[10px] text-center rounded border border-slate-200 px-1 truncate">
                                         {rel.label}
                                     </div>
                                 </foreignObject>
                             )}
                        </g>
                    )
                })}
             </svg>

             {/* Nodes Layer */}
             {DB_TABLES.map(table => (
                 <SchemaTableNode key={table.id} table={table} />
             ))}
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
           <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200 flex flex-col gap-1">
                <button onClick={() => setTransform(t => ({...t, k: Math.min(t.k + 0.1, 2)}))} className="p-2 hover:bg-slate-50 text-slate-600 rounded"><Plus size={20}/></button>
                <button onClick={() => setTransform(t => ({...t, k: Math.max(t.k - 0.1, 0.3)}))} className="p-2 hover:bg-slate-50 text-slate-600 rounded"><Minus size={20}/></button>
                <button onClick={() => setTransform({x: 0, y: 0, k: 0.9})} className="p-2 hover:bg-slate-50 text-slate-600 rounded" title="Reset"><Move size={20}/></button>
           </div>
        </div>
      </div>

      {/* --- Sidebar (Documentation) --- */}
      <div className={`bg-white border-l border-slate-200 shadow-xl transition-all duration-300 flex flex-col z-20 ${showSidebar ? 'w-96' : 'w-0'}`}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600"/> Schema Docs
              </h2>
              <button onClick={() => setShowSidebar(false)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                  <ChevronRight size={20} />
              </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-8">
              
              {/* Legend */}
              <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entity Types</h3>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                          <span className="text-slate-600">Primary Domain</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                          <span className="text-slate-600">Runtime Data</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 bg-slate-700 rounded-full"></div>
                          <span className="text-slate-600">System / Identity</span>
                      </div>
                  </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <Lightbulb size={14}/> Optimization Suggestions
                 </h3>
                 <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-900 space-y-3">
                     <div className="flex gap-2">
                         <div className="mt-0.5"><CheckCircle2 size={14} className="text-amber-600"/></div>
                         <div>
                             <span className="font-bold block text-xs mb-0.5">Partitioning Strategy</span>
                             <span className="text-amber-800/80 text-xs">Partition `workflow_instances` and `audit_logs` by `created_at` (Monthly range) to maintain query performance as data grows.</span>
                         </div>
                     </div>
                     <div className="flex gap-2">
                         <div className="mt-0.5"><CheckCircle2 size={14} className="text-amber-600"/></div>
                         <div>
                             <span className="font-bold block text-xs mb-0.5">GIN Indexing</span>
                             <span className="text-amber-800/80 text-xs">Add GIN indexes on `context_data` JSONB columns to support efficient ad-hoc queries on business payloads.</span>
                         </div>
                     </div>
                 </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <Cpu size={14}/> System Requirements
                 </h3>
                 <ul className="space-y-2">
                     <li className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group">
                         <span className="text-sm font-medium text-slate-700">Database Engine</span>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-slate-600">PostgreSQL 15+</span>
                     </li>
                     <li className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group">
                         <span className="text-sm font-medium text-slate-700">Min Storage</span>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-slate-600">50 GB SSD</span>
                     </li>
                     <li className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group">
                         <span className="text-sm font-medium text-slate-700">Min RAM</span>
                         <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono text-slate-600">8 GB</span>
                     </li>
                 </ul>
              </div>

              {/* Security */}
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <Lock size={14}/> Security Best Practices
                 </h3>
                 <div className="space-y-2">
                     <div className="flex items-start gap-2 text-xs text-slate-600">
                         <Shield size={12} className="text-emerald-500 mt-0.5"/>
                         <span>Enable <b>Row Level Security (RLS)</b> on `workflow_definitions` for multi-tenant isolation.</span>
                     </div>
                     <div className="flex items-start gap-2 text-xs text-slate-600">
                         <Shield size={12} className="text-emerald-500 mt-0.5"/>
                         <span>Encrypt sensitive fields in `context_data` at the application level before insertion.</span>
                     </div>
                     <div className="flex items-start gap-2 text-xs text-slate-600">
                         <Shield size={12} className="text-emerald-500 mt-0.5"/>
                         <span>Use dedicated service accounts with least-privilege for the Workflow Engine connection.</span>
                     </div>
                 </div>
              </div>

              {/* Missing Features */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                     <AlertTriangle size={14}/> Critical Todos
                 </h3>
                 <div className="text-xs text-slate-600 space-y-2">
                     <p>• Implement <b>Distributed Locking</b> (Redlock) for task assignment to prevent race conditions.</p>
                     <p>• Add `webhooks` table for external event subscriptions.</p>
                 </div>
              </div>

          </div>
      </div>

      {/* Toggle Sidebar Button (Visible when closed) */}
      {!showSidebar && (
          <button 
            onClick={() => setShowSidebar(true)}
            className="absolute top-4 right-4 z-30 p-2 bg-white shadow-md border border-slate-200 rounded-lg hover:bg-slate-50 text-indigo-600"
          >
              <ChevronLeft size={20} />
          </button>
      )}

    </div>
  );
}
