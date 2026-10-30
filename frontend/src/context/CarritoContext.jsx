import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, CLIENTE_ID } from '../config';

const CarritoContext = createContext();

const STORAGE_KEY = 'damasco_carrito_v1';

const normalizarItems = (items = []) => items.map((item) => ({
    ...item,
    id: item.id,
    itemId: item.id,
    producto_id: item.producto_id,
    variante_id: item.variante_id,
    precio: Number(item.precio),
    stock: Number(item.stock),
    cantidad: Number(item.cantidad),
}));

const leerCache = () => {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        return guardado ? normalizarItems(JSON.parse(guardado)) : [];
    } catch {
        return [];
    }
};

export const CarritoProvider = ({ children }) => {
    const [items, setItems] = useState(leerCache);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const recargar = useCallback(async () => {
        setCargando(true);
        try {
            const res = await fetch(`${API_URL}?url=carrito&cliente_id=${CLIENTE_ID}`);
            const json = await res.json();

            if (json.success || json.exito) {
                setItems(normalizarItems(json.datos?.items || []));
                setError(null);
            }
        } catch (err) {
            console.warn('Carrito sin conexion. Usando cache local.', err);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        recargar();
    }, [recargar]);

    const agregarAlCarrito = async (producto, cantidad = 1, varianteId = null) => {
        try {
            const res = await fetch(`${API_URL}?url=carrito/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id: CLIENTE_ID,
                    producto_id: producto.id,
                    variante_id: varianteId,
                    cantidad,
                }),
            });

            const json = await res.json();

            if (!(json.success || json.exito)) {
                throw new Error(json.error || json.mensaje || 'No se pudo agregar el producto.');
            }

            setItems(normalizarItems(json.datos?.items || []));
            setError(null);
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        }
    };

    const eliminarDelCarrito = async (id) => {
        const item = items.find((i) => i.itemId === id || i.id === id || i.producto_id === id);
        const itemId = item?.itemId ?? item?.id ?? id;

        try {
            await fetch(`${API_URL}?url=carrito/items/${itemId}`, { method: 'DELETE' });
            await recargar();
        } catch (err) {
            setError(err.message);
        }
    };

    const cambiarCantidad = async (itemId, delta) => {
        const item = items.find((i) => i.itemId === itemId || i.id === itemId);

        if (!item) return;

        const nuevaCantidad = Number(item.cantidad) + Number(delta);

        if (nuevaCantidad <= 0) {
            await eliminarDelCarrito(itemId);
            return;
        }

        try {
            const res = await fetch(`${API_URL}?url=carrito/items/${item.itemId ?? item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidad: nuevaCantidad }),
            });

            const json = await res.json();

            if (!(json.success || json.exito)) {
                throw new Error(json.error || json.mensaje || 'No se pudo actualizar la cantidad.');
            }

            await recargar();
        } catch (err) {
            setError(err.message);
        }
    };

    const vaciarCarrito = async () => {
        try {
            await fetch(`${API_URL}?url=carrito&cliente_id=${CLIENTE_ID}`, { method: 'DELETE' });
            setItems([]);
        } catch (err) {
            setError(err.message);
        }
    };

    const totalArticulos = items.reduce((acc, item) => acc + Number(item.cantidad), 0);
    const totalPrecio = items.reduce(
        (acc, item) => acc + Number(item.precio) * Number(item.cantidad),
        0
    );

    return (
        <CarritoContext.Provider
            value={{
                items,
                carrito: items,
                cargando,
                error,
                totalArticulos,
                totalPrecio,
                totalItems: totalArticulos,
                totalUSD: totalPrecio,
                agregarAlCarrito,
                eliminarDelCarrito,
                eliminarItem: eliminarDelCarrito,
                cambiarCantidad,
                vaciarCarrito,
                recargar,
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
