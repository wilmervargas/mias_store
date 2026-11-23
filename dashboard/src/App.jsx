import Dashboard from './components/dashboard/Dashboard';
<<<<<<< HEAD
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
=======

function App() {
  return <Dashboard />;
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
}

export default App;
