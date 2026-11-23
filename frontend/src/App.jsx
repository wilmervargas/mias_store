import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CarritoProvider } from './context/CarritoContext';
import AppLayout from './components/layout/AppLayout';
import Tienda from './pages/Tienda';
import Footer from './components/Footer';

function AppContent() {
  const [vista, setVista] = useState('tienda');

  return (
    <AppLayout vistaActiva={vista} onSelectVista={setVista}>
      <div className="space-y-6">
        {vista === 'tienda' ? <Tienda /> : <Tienda />}
      </div>
      <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-8">
        <Footer />
      </div>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CarritoProvider>
        <AppContent />
      </CarritoProvider>
    </ThemeProvider>
  );
}
