import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();
    const { totalArticulos, totalPrecio } = useCarrito();

    return (
        <nav className={`sticky top-0 z-40 px-6 py-4 border-b backdrop-blur-md transition-colors duration-300 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-800'
            }`}>
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                {/* Logo Mia's Store */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-600/30">
                        M
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-wider block">MIA'S STORE</span>
                        <span className="text-[10px] text-rose-500 font-mono font-bold">
                            PHP 8 MVC + React SPA
                        </span>
                    </div>
                </div>

                {/* Acciones: Toggle de Tema & Carrito */}
                <div className="flex items-center gap-3">
                    {/* Botón Switch Modo Claro / Oscuro */}
                    <button
                        onClick={toggleTheme}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${isDark
                                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                            }`}
                        title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                    >
                        <span>{isDark ? '☀️ Claro' : '🌙 Oscuro'}</span>
                    </button>

                    {/* Total de Monto */}
                    <div className="hidden sm:block text-right">
                        <span className={`text-[10px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Total
                        </span>
                        <span className="text-sm font-bold text-emerald-500">${totalPrecio.toFixed(2)}</span>
                    </div>

                    {/* Botón Carrito con Badge */}
                    <button
                        className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                            }`}
                    >
                        <span className="text-base">🛒</span>
                        <span className="text-xs font-bold font-mono bg-rose-600 text-white px-2 py-0.5 rounded-full">
                            {totalArticulos}
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
}