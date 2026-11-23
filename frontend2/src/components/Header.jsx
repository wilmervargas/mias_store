import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Header({ busqueda, setBusqueda, categoriaActiva, setCategoriaActiva, categorias }) {
    const { isDark } = useTheme();

    return (
        <header className={`py-12 px-6 border-b transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-white'
                : 'bg-gradient-to-b from-slate-50 to-slate-100 border-slate-200 text-slate-900'
            }`}>
            <div className="max-w-4xl mx-auto text-center">
                <span className="px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest inline-block mb-3">
                    Catálogo Oficial 2026
                </span>
                <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                    Electrodomésticos &amp; Hogar
                </h1>
                <p className={`text-sm md:text-base mb-8 max-w-xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    React moderno consumiendo la API de PHP 8 con Prepared Statements y MySQL.
                </p>

                {/* Input Buscador */}
                <div className="relative max-w-xl mx-auto mb-6">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
                    <input
                        type="text"
                        placeholder="Buscar por producto o marca (ej. Nevera, Samsung)..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all border shadow-inner ${isDark
                                ? 'bg-black/40 border-slate-800 text-white focus:border-rose-500 placeholder:text-slate-600'
                                : 'bg-white border-slate-300 text-slate-800 focus:border-rose-500 placeholder:text-slate-400'
                            }`}
                    />
                </div>

                {/* Botones de Categorías */}
                <div className="flex flex-wrap justify-center gap-2">
                    {categorias.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaActiva(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${categoriaActiva === cat
                                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                                    : isDark
                                        ? 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}