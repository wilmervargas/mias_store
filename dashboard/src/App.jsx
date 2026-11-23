import Dashboard from './components/dashboard/Dashboard';
import Login from './components/auth/Login';
import PantallaCarga from './components/auth/PantallaCarga';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmProvider } from './components/ui/ConfirmProvider';

const Contenido = () => {
  const { usuario, cargando } = useAuth();

  if (cargando) return <PantallaCarga />;
  if (!usuario) return <Login />;

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Contenido />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
