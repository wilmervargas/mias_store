import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CarritoProvider } from './context/CarritoContext';
import AppLayout from './components/layout/AppLayout';
import Tienda from './pages/Tienda';

function AppContent() {
  return (
    <AppLayout>
      <Tienda />
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
