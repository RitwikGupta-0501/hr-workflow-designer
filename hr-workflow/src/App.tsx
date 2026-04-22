import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';
import { InspectorPanel } from './components/InspectorPanel/InspectorPanel';
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
      <InspectorPanel />
    </div>
  );
}

export default App;
