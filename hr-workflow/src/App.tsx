import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { NodeEditor } from './components/NodeEditor/NodeEditor';
import { Header } from './components/Header/Header';
import { LogTerminal } from './components/Simulation/LogTerminal';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-slate-100 text-slate-900">
      <Sidebar />
      <main className="flex-1 relative">
        <Header />
        <WorkflowCanvas />
        <LogTerminal /> {/* Add this! */}
      </main>
      <NodeEditor />
    </div>
  );
}

export default App;
