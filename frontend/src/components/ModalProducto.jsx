import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';
import { useCurrency } from '../context/CurrencyContext';
import { API_URL } from '../config';

const etiquetaVariante = (v) => {
    const partes = [v.talla, v.color, v.modelo, v.clave_variante].filter(Boolean);
    return partes.length > 0 ? partes.join(' · ') : v.sku;
};

export default function ModalProducto({ producto, onClose }) {
    const { isDark } = useTheme();
    const { agregarAlCarrito, error: carritoError } = useCarrito();
    const { moneda, formatearPrecio } = useCurrency();
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);
    const [variantes, setVariantes] = useState([]);
    const [varianteSel, setVarianteSel] = useState(null);
    const [cargandoVariantes, setCargandoVariantes] = useState(true);

    // La lista de productos solo trae el conteo de variantes; el detalle
    // trae talla, color, modelo y stock por variante.
    useEffect(() => {
        if (!producto?.id) return undefined;

        let activo = true;
        setCargandoVariantes(true);

        fetch(`${API_URL}?url=productos/${producto.id}`)
            .then((res) => res.json())
            .then((json) => {
                if (!activo) return;

                const lista = (json.datos?.variantes || [])
                    .filter((v) => Number(v.idestatus) === 1);
                setVariantes(lista);

                const base = lista.find((v) => Number(v.es_base) === 1) || lista[0] || null;
                setVarianteSel(base);
            })
            .catch(() => {
                if (activo) setVariantes([]);
            })
            .finally(() => {
                if (activo) setCargandoVariantes(false);
            });

        return () => { activo = false; };
    }, [producto?.id]);

    if (!producto) return null;

    const handleAgregar = async () => {
        const ok = await agregarAlCarrito(producto, cantidad, varianteSel?.id ?? null);
        if (!ok) return;

        setAgregado(true);
        setTimeout(() => {
            setAgregado(false);
            onClose();
        }, 1200);
    };

    const ahorro = producto.preciofull ? (producto.preciofull - producto.precio) : 0;
    const stockDisponible = varianteSel
        ? Number(varianteSel.stock_disponible)
        : Number(producto.stock ?? 0);
    const requiereSelector = variantes.length > 1;
    const sinStock = stockDisponible <= 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`border rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                    ✕
                </button>

                <div className="grid md:grid-cols-2">
                    {/* Imagen */}
                    <div className="bg-slate-500/5 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-500/20">
                        <img
                            src={`http://localhost:8000/imagenes/${producto.imagen}`}
                            alt={producto.nombre}
                            className="max-h-64 object-contain"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500';
                            }}
                        />
                    </div>

                    {/* Información */}
                    <div className="p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase font-black tracking-widest text-rose-500">
                                    {producto.marca || 'Damasco'}
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    Stock: {stockDisponible}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold mb-2 leading-snug">{producto.nombre}</h2>
                            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Categoría: <strong>{producto.categoria || 'General'}</strong>
                            </p>

                            {/* Precios */}
                            <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                                }`}>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-emerald-500">
                                        {formatearPrecio(producto.precio)}
                                    </span>
                                    {producto.preciofull && (
                                        <span className="text-sm text-slate-400 line-through">
                                            {formatearPrecio(producto.preciofull)}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] font-mono text-amber-400 block mt-1">
                                    {formatearPrecio(producto.precio, moneda === 'USD' ? 'VES' : 'USD')}
                                </span>
                                {ahorro > 0 && (
                                    <span className="text-[11px] font-bold text-emerald-500 block mt-1">
                                        🎉 ¡Ahorras {formatearPrecio(ahorro)} con Damasco!
                                    </span>
                                )}
                            </div>

                            {/* Variantes */}
                            {cargandoVariantes && (
                                <p className="text-[11px] text-slate-400 mb-3">Cargando presentaciones...</p>
                            )}

                            {!cargandoVariantes && requiereSelector && (
                                <div className="mb-4">
                                    <label className={`text-[11px] font-bold block mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        Presentación
                                    </label>
                                    <select
                                        value={varianteSel?.id ?? ''}
                                        onChange={(e) => {
                                            const elegida = variantes.find((v) => String(v.id) === e.target.value) || null;
                                            setVarianteSel(elegida);
                                            setCantidad(1);
                                        }}
                                        className={`w-full px-3 py-2.5 rounded-xl text-xs border ${isDark
                                            ? 'bg-slate-950 border-slate-700 text-white'
                                            : 'bg-white border-slate-300 text-slate-800'
                                            }`}
                                    >
                                        {variantes.map((v) => (
                                            <option
                                                key={v.id}
                                                value={v.id}
                                                disabled={Number(v.stock_disponible) <= 0}
                                            >
                                                {etiquetaVariante(v)} — stock {v.stock_disponible}
                                            </option>
                                        ))}
                                    </select>
                                    {varianteSel?.sku && (
                                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                                            SKU: {varianteSel.sku}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Controles de Compra */}
                        <div>
                            {carritoError && (
                                <div className="mb-3 p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-[11px]">
                                    ⚠️ {carritoError}
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-semibold">Cantidad:</span>
                                <div className="flex items-center border border-slate-500/20 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="px-3 py-1.5 hover:bg-slate-500/10 font-bold cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-mono font-bold">{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad(Math.min(Math.max(1, stockDisponible), cantidad + 1))}
                                        className="px-3 py-1.5 hover:bg-slate-500/10 font-bold cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAgregar}
                                disabled={agregado || sinStock || cargandoVariantes}
                                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${agregado
                                        ? 'bg-emerald-600 text-white'
                                        : sinStock
                                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                                    }`}
                            >
                                {agregado
                                    ? '✅ ¡Añadido al Carrito!'
                                    : sinStock
                                        ? 'Producto agotado'
                                        : '🛒 Agregar al Carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
