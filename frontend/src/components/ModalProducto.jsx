import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';

export default function ModalProducto({ producto, onClose }) {
    const { isDark } = useTheme();
    const { agregarAlCarrito } = useCarrito();
    const [cantidad, setCantidad] = useState(1);
    const [agregado, setAgregado] = useState(false);

    if (!producto) return null;

    const handleAgregar = () => {
        agregarAlCarrito(producto, cantidad);
        setAgregado(true);
        setTimeout(() => {
            setAgregado(false);
            onClose();
        }, 1200);
    };

    const ahorro = producto.preciofull ? (producto.preciofull - producto.precio) : 0;

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
                                    {producto.marca || "Mia's Store"}
                                </span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    Stock: {producto.stock}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold mb-2 leading-snug">{producto.nombre}</h2>

                            <div className={`text-[11px] mb-4 space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <p>Categoría: <strong>{producto.categoria || 'General'}</strong></p>
                                {producto.modelo && producto.modelo !== 'Sin modelo' && (
                                    <p>Modelo: <strong>{producto.modelo}</strong></p>
                                )}
                                <div className="flex flex-wrap items-center gap-3">
                                    {producto.color && producto.color !== 'Sin color' && (
                                        <span className="flex items-center gap-1.5">
                                            Color:
                                            <span className="inline-block w-3 h-3 rounded-full border border-slate-500/40" style={{ background: producto.color_hex || '#64748b' }} />
                                            <strong>{producto.color}</strong>
                                        </span>
                                    )}
                                    {producto.talla && producto.talla !== 'Sin talla' && (
                                        <span>Talla: <strong>{producto.talla}</strong></span>
                                    )}
                                </div>
                                {producto.sku_base && (
                                    <p className="font-mono text-[10px]">
                                        SKU: <strong>{producto.sku_base}</strong>
                                        {producto.sku_almacen && (
                                            <span className="text-slate-500"> · {String(producto.sku_almacen).split(',')[0]}</span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Precios */}
                            <div className={`p-4 rounded-2xl border mb-4 ${isDark ? 'bg-black/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                                }`}>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-emerald-500">${producto.precio}</span>
                                    {producto.preciofull && (
                                        <span className="text-sm text-slate-400 line-through">${producto.preciofull}</span>
                                    )}
                                </div>
                                {ahorro > 0 && (
                                    <span className="text-[11px] font-bold text-emerald-500 block mt-1">
                                        🎉 ¡Ahorras ${ahorro.toFixed(2)} con Mia's Store!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controles de Compra */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-semibold">Cantidad:</span>
                                <div className="flex items-center border border-slate-500/20 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="px-3 py-1.5 hover:bg-slate-500/10 font-bold"
                                    >
                                        -
                                    </button>
                                    <span className="px-3 py-1.5 text-xs font-mono font-bold">{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad(Math.min(Number(producto.stock) || 1, cantidad + 1))}
                                        className="px-3 py-1.5 hover:bg-slate-500/10 font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAgregar}
                                disabled={agregado || Number(producto.stock) === 0}
                                className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${agregado
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                                    }`}
                            >
                                {Number(producto.stock) === 0
                                    ? 'Sin stock disponible'
                                    : agregado ? '✅ ¡Añadido al Carrito!' : '🛒 Agregar al Carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}