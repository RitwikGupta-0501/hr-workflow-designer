import { WorkflowCanvas } from './components/Canvas/WorkflowCanvas';
import { Sidebar } from './components/Sidebar/Sidebar';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-slate-100">
      <Sidebar />
      <main className="flex-1 relative">
        <WorkflowCanvas />
      </main>
    </div>
  );
}

export default App;