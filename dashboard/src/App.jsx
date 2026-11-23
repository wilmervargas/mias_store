import Dashboard from './components/dashboard/Dashboard';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmProvider } from './components/ui/ConfirmProvider';

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Dashboard />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;
