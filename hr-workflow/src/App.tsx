import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { NodeEditor } from './components/NodeEditor/NodeEditor';


function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-slate-100">
      <Sidebar />
      <main className="flex-1 relative">
        <WorkflowCanvas />
      </main>
      <NodeEditor />
    </div>
  );
}

export default App;