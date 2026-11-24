import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-cream-200/80 bg-gradient-to-b from-cream-50/60 to-peach-100/60 py-10 transition-colors duration-300 dark:border-plum-700/70 dark:from-plum-900 dark:to-plum-800/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-xs text-plum-500 sm:px-6 md:flex-row md:justify-between lg:px-8 dark:text-cream-200/60">
        <div className="text-center md:text-left">
          <span className="block font-display text-base font-semibold text-plum-800 dark:text-cream-50">
            Mia&apos;s Store
          </span>
          <p className="mt-1 text-[11px]">
            Proyecto E-Commerce · Curso Full Stack JS + PHP 8 MVC · Cohorte 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[11px]">
          <span>🐘 PHP 8</span>
          <span className="text-blush-300 dark:text-blush-500">•</span>
          <span>🎨 Tailwind v4</span>
          <span className="text-blush-300 dark:text-blush-500">•</span>
          <span>🌗 Tema claro/oscuro</span>
          <span className="text-blush-300 dark:text-blush-500">•</span>
          <span>🛒 Carrito</span>
          <span className="text-blush-300 dark:text-blush-500">•</span>
          <span>⚛️ React 19</span>
        </div>

        <div className="text-center font-mono text-[10px] text-plum-400 md:text-right dark:text-cream-200/55">
          Base oficial para la Clase 2 del Mes 6
        </div>
      </div>
    </footer>
  );
}
