import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Crear el Contexto
const ThemeContext = createContext();

// 2. Proveedor de Tema
export const ThemeProvider = ({ children }) => {
    // Inicializar leyendo localStorage o por defecto 'dark'
    const [theme, setTheme] = useState(() => {
<<<<<<< HEAD
        return localStorage.getItem('mias_store_theme') || 'dark';
=======
        return localStorage.getItem('damasco_theme') || 'dark';
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    });

    // Guardar en localStorage cuando cambie el tema
    useEffect(() => {
<<<<<<< HEAD
        localStorage.setItem('mias_store_theme', theme);
=======
        localStorage.setItem('damasco_theme', theme);
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
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