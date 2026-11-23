import React, { createContext, useContext, useState } from 'react';

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
    const [carrito, setCarrito] = useState([]);

    // Añadir producto o incrementar cantidad si ya existe
    const agregarAlCarrito = (producto, cantidad = 1) => {
        setCarrito((prev) => {
            const existe = prev.find((item) => item.id === producto.id);
            if (existe) {
                return prev.map((item) =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
                );
            }
            return [...prev, { ...producto, cantidad }];
        });
    };

    // Eliminar producto por ID
    const eliminarDelCarrito = (id) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    // Vaciar carrito
    const vaciarCarrito = () => setCarrito([]);

    // Cálculos reactivos
    const totalArticulos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const totalPrecio = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    return (
        <CarritoContext.Provider
            value={{
                carrito,
                agregarAlCarrito,
                eliminarDelCarrito,
                vaciarCarrito,
                totalArticulos,
                totalPrecio
            }}
        >
            {children}
        </CarritoContext.Provider>
    );
};

export const useCarrito = () => {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
    }
    return context;
};