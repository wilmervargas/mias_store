import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout({ moduloActivo, onSelect, moduloActual, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        />
      ) : null}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        moduloActivo={moduloActivo}
        onSelect={onSelect}
      />

      <div className="lg:pl-[14rem]">
        <Header onMenu={() => setSidebarOpen(true)} moduloActual={moduloActual} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
