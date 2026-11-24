import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';

export default function ModalProducto({ producto, onClose }) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/60 p-4 backdrop-blur-md">
            <div className="animate-rise relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cream-200 bg-cream-50 text-plum-800 shadow-2xl shadow-plum-900/30 dark:border-plum-700 dark:bg-plum-800 dark:text-cream-50">
                {/* Botón Cerrar */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-sm font-bold text-plum-600 shadow-sm backdrop-blur transition hover:bg-blush-500 hover:text-white dark:bg-plum-900/70 dark:text-cream-100 dark:hover:bg-blush-500"
                    aria-label="Cerrar"
                >
                    ✕
                </button>

                <div className="grid md:grid-cols-2">
                    {/* Imagen */}
                    <div className="flex items-center justify-center border-b border-cream-200 bg-gradient-to-br from-cream-100 via-cream-50 to-peach-100 p-8 md:border-b-0 md:border-r dark:border-plum-700 dark:from-plum-900/70 dark:via-plum-800/50 dark:to-plum-700/50">
                        <img
                            src={`http://localhost:8000/imagenes/${producto.imagen}`}
                            alt={producto.nombre}
                            className="max-h-64 object-contain drop-shadow-sm"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500';
                            }}
                        />
                    </div>

                    {/* Información */}
                    <div className="flex flex-col justify-between p-6">
                        <div>
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-blush-600 dark:text-blush-300">
                                    {producto.marca || "Mia's Store"}
                                </span>
                                <span className="rounded-full border border-cream-200 bg-white/80 px-2.5 py-1 font-mono text-[10px] text-plum-500 dark:border-plum-700 dark:bg-plum-900/50 dark:text-cream-200/70">
                                    Stock: {producto.stock} {producto.unidad_abreviatura || producto.unidad_medida || ''}
                                </span>
                            </div>

                            <h2 className="mb-2 font-display text-xl font-semibold leading-snug text-plum-800 dark:text-cream-50">
                                {producto.nombre}
                            </h2>

                            <div className="mb-4 space-y-1 text-[11px] text-plum-500 dark:text-cream-200/65">
                                <p>Categoría: <strong className="font-semibold text-plum-700 dark:text-cream-100">{producto.categoria || 'General'}</strong></p>
                                {producto.modelo && producto.modelo !== 'Sin modelo' && (
                                    <p>Modelo: <strong className="font-semibold text-plum-700 dark:text-cream-100">{producto.modelo}</strong></p>
                                )}
                                <div className="flex flex-wrap items-center gap-3">
                                    {producto.color && producto.color !== 'Sin color' && (
                                        <span className="flex items-center gap-1.5">
                                            Color:
                                            <span
                                                className="inline-block h-3 w-3 rounded-full ring-1 ring-plum-300/50"
                                                style={{ background: producto.color_hex || '#cbb4bd' }}
                                            />
                                            <strong className="font-semibold text-plum-700 dark:text-cream-100">{producto.color}</strong>
                                        </span>
                                    )}
                                    {producto.talla && producto.talla !== 'Sin talla' && (
                                        <span>Talla: <strong className="font-semibold text-plum-700 dark:text-cream-100">{producto.talla}</strong></span>
                                    )}
                                </div>
                                {producto.sku_base && (
                                    <p className="font-mono text-[10px]">
                                        SKU: <strong className="font-semibold">{producto.sku_base}</strong>
                                        {producto.sku_almacen && (
                                            <span className="text-plum-400 dark:text-cream-200/40"> · {String(producto.sku_almacen).split(',')[0]}</span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Precios */}
                            <div className="mb-4 rounded-2xl border border-cream-200 bg-white/70 p-4 dark:border-plum-700 dark:bg-plum-900/40">
                                <div className="flex items-baseline gap-3">
                                    <span className="font-display text-3xl font-semibold text-plum-800 dark:text-cream-50">
                                        ${producto.precio}
                                    </span>
                                    {producto.preciofull && (
                                        <span className="text-sm text-plum-400 line-through dark:text-cream-200/40">
                                            ${producto.preciofull}
                                        </span>
                                    )}
                                </div>
                                {ahorro > 0 && (
                                    <span className="mt-1 block text-[11px] font-semibold text-sage-500 dark:text-emerald-300">
                                        🌸 Ahorras ${Number(ahorro).toFixed(2)} con Mia&apos;s Store
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controles de compra */}
                        <div>
                            <div className="mb-4 flex items-center gap-3">
                                <span className="text-xs font-semibold text-plum-600 dark:text-cream-200/80">Cantidad:</span>
                                <div className="flex items-center overflow-hidden rounded-full border border-cream-200 bg-white/80 dark:border-plum-700 dark:bg-plum-900/40">
                                    <button
                                        onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                        className="px-3 py-1.5 font-bold text-plum-600 transition hover:bg-blush-100 dark:text-cream-100 dark:hover:bg-plum-700"
                                    >
                                        -
                                    </button>
                                    <span className="px-3 py-1.5 font-mono text-xs font-bold">{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad(Math.min(Number(producto.stock) || 1, cantidad + 1))}
                                        className="px-3 py-1.5 font-bold text-plum-600 transition hover:bg-blush-100 dark:text-cream-100 dark:hover:bg-plum-700"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAgregar}
                                disabled={agregado || Number(producto.stock) === 0}
                                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                                    agregado
                                        ? 'bg-sage-500'
                                        : 'bg-gradient-to-r from-blush-500 to-blush-400 shadow-lg shadow-blush-500/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blush-500/35'
                                }`}
                            >
                                {Number(producto.stock) === 0
                                    ? 'Sin stock disponible'
                                    : agregado ? '✅ ¡Añadido al carrito!' : '🛒 Agregar al carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
