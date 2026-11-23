import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Crear el Contexto
const ThemeContext = createContext();

// 2. Proveedor de Tema
export const ThemeProvider = ({ children }) => {
    // Inicializar leyendo localStorage o por defecto 'light'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('mias_store_theme') || 'light';
    });

    // Guardar en localStorage y aplicar clase dark
    useEffect(() => {
        localStorage.setItem('mias_store_theme', theme);
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.classList.toggle('light', theme === 'light');
    }, [theme]);

    // Alternar entre claro y oscuro
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// 3. Custom Hook para usar el tema en cualquier componente
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
    }
    return context;
};