import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
    const { isDark } = useTheme();

    return (
        <footer className={`border-t py-10 px-6 mt-16 transition-colors duration-300 text-xs ${isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <span className={`font-bold text-sm block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Proyecto Damasco E-Commerce
                    </span>
                    <p className="mt-1 text-[11px] text-slate-400">
                        Curso Full Stack JS + PHP 8 Backend MVC • Cohorte 2026
                    </p>
                </div>

                <div className="flex items-center gap-4 text-[11px]">
                    <span>🐘 PHP 8 Puro</span>
                    <span>•</span>
                    <span>🎨 Tailwind v4</span>
                    <span>•</span>
                    <span>🌗 ThemeContext</span>
                    <span>•</span>
                    <span>🛒 Carrito MySQL</span>
                    <span>•</span>
                    <span>💱 Multimoneda</span>
                </div>

                <div className="text-[10px] font-mono text-slate-500">
                    Proyecto completo • Clases 1 a 4 del Mes 6
                </div>
            </div>
        </footer>
    );
}