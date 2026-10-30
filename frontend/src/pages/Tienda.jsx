import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ModalProducto from '../components/ModalProducto';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';
import { useCurrency } from '../context/CurrencyContext';
import { API_URL } from '../config';

export default function Tienda() {
    const { isDark } = useTheme();
    const { agregarAlCarrito, error: carritoError } = useCarrito();
    const { moneda, formatearPrecio } = useCurrency();

    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [productoModal, setProductoModal] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}?url=productos`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}: Fallo de conexión con la API PHP`);
                return res.json();
            })
            .then((data) => {
                if (data.success && Array.isArray(data.datos)) {
                    setProductos(data.datos);
                } else {
                    throw new Error('Formato de datos no reconocido');
                }
                setCargando(false);
            })
            .catch((err) => {
                setError(err.message);
                setCargando(false);
            });
    }, []);

    const categorias = ['Todas', 'Tecnología', 'Hogar & Decoración', 'Maquinaria & Línea Blanca'];

    const productosFiltrados = productos.filter((prod) => {
        const coincideTexto =
            prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (prod.marca && prod.marca.toLowerCase().includes(busqueda.toLowerCase()));
        const coincideCat =
            categoriaActiva === 'Todas' || prod.categoria === categoriaActiva;
        return coincideTexto && coincideCat;
    });

    return (
        <div>
            <Header
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                categoriaActiva={categoriaActiva}
                setCategoriaActiva={setCategoriaActiva}
                categorias={categorias}
            />

            <main className="max-w-6xl mx-auto px-6 py-10">
                {cargando && (
                    <div className="p-16 text-center">
                        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="font-mono text-sm text-slate-400">Consultando API de PHP (http://localhost:8000)...</p>
                    </div>
                )}

                {error && (
                    <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center max-w-xl mx-auto">
                        <h3 className="text-rose-500 font-bold mb-2">⚠️ Error de Conexión</h3>
                        <p className="text-xs text-slate-400 mb-2">{error}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                            Verifica tener "php -S localhost:8000" corriendo en backend/.
                        </span>
                    </div>
                )}

                {carritoError && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center max-w-xl mx-auto">
                        <p className="text-xs text-amber-300">{carritoError}</p>
                    </div>
                )}

                {!cargando && !error && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Mostrando {productosFiltrados.length} productos
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {productosFiltrados.map((prod) => (
                                <div
                                    key={prod.id}
                                    className={`border rounded-3xl p-4 flex flex-col justify-between hover:border-rose-500/50 transition-all duration-300 group shadow-lg ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                                        }`}
                                >
                                    <div className="relative aspect-square bg-slate-500/5 rounded-2xl p-4 flex items-center justify-center overflow-hidden mb-3">
                                        <img
                                            src={`http://localhost:8000/imagenes/${prod.imagen}`}
                                            alt={prod.nombre}
                                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-all duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500';
                                            }}
                                        />
                                        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-rose-400 uppercase">
                                            {prod.marca || 'Damasco'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-xs line-clamp-2 mb-1 group-hover:text-rose-500 transition-colors">
                                            {prod.nombre}
                                        </h3>
                                        <span className="text-[10px] text-slate-400">{prod.categoria || 'General'}</span>
                                        {Number(prod.variantes) > 1 && (
                                            <span className="block mt-1 text-[9px] font-bold text-sky-400">
                                                {prod.variantes} presentaciones disponibles
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-500/20 flex items-center justify-between">
                                        <div>
                                            <span className="text-lg font-black text-emerald-500">
                                                {formatearPrecio(prod.precio)}
                                            </span>
                                            <span className="text-[10px] text-slate-400 block">
                                                {formatearPrecio(prod.precio, moneda === 'USD' ? 'VES' : 'USD')}
                                            </span>
                                            {prod.preciofull && (
                                                <span className="text-[10px] text-slate-400 line-through block">
                                                    {formatearPrecio(prod.preciofull)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => setProductoModal(prod)}
                                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                    }`}
                                                title="Ver detalle"
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (Number(prod.variantes) > 1) {
                                                        // Con varias presentaciones hay que elegir talla/color.
                                                        setProductoModal(prod);
                                                    } else {
                                                        agregarAlCarrito(prod, 1);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                title={Number(prod.variantes) > 1 ? 'Elegir presentación' : 'Añadir al carrito'}
                                            >
                                                {Number(prod.variantes) > 1 ? '🎨' : '+ 🛒'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {productoModal && (
                <ModalProducto
                    producto={productoModal}
                    onClose={() => setProductoModal(null)}
                />
            )}
        </div>
    );
}