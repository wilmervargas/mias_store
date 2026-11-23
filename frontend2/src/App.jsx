import React from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CarritoProvider } from './context/CarritoContext';
import Navbar from './components/Navbar';
import Tienda from './pages/Tienda';
import Footer from './components/Footer';

// Subcomponente interno para consumir el tema en el contenedor raíz
function AppContent() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
      <div>
        <Navbar />
        <Tienda />
      </div>
      <Footer />
    </div>
  );
}

// Componente Raíz exportado con ambos Proveedores de Contexto
export default function App() {
  return (
    <ThemeProvider>
      <CarritoProvider>
        <AppContent />
      </CarritoProvider>
    </ThemeProvider>
  );
}