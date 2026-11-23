import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import ModalProducto from '../components/ModalProducto';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';

export default function Tienda() {
    const { isDark } = useTheme();
    const { agregarAlCarrito } = useCarrito();

    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const [busqueda, setBusqueda] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState('Todas');
    const [productoModal, setProductoModal] = useState(null);
    const [seleccion, setSeleccion] = useState({});

    useEffect(() => {
        fetch('http://localhost:8000/index.php?url=productos')
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

    const productosFiltrados = useMemo(() => productos.filter((prod) => {
        const texto = busqueda.toLowerCase();
        const coincideTexto =
            prod.nombre.toLowerCase().includes(texto) ||
            (prod.marca && prod.marca.toLowerCase().includes(texto)) ||
            (prod.modelo && prod.modelo.toLowerCase().includes(texto)) ||
            (prod.sku_base && prod.sku_base.toLowerCase().includes(texto));
        const coincideCat =
            categoriaActiva === 'Todas' || prod.categoria === categoriaActiva;
        return coincideTexto && coincideCat;
    }), [productos, busqueda, categoriaActiva]);

    // Agrupa las combinaciones (color/talla) del mismo artículo base.
    const grupos = useMemo(() => {
        const mapa = new Map();
        productosFiltrados.forEach((p) => {
            const clave = `base-${p.producto_base_id || p.id}`;
            if (!mapa.has(clave)) mapa.set(clave, []);
            mapa.get(clave).push(p);
        });
        return Array.from(mapa.entries()).map(([clave, variantes]) => ({ clave, variantes }));
    }, [productosFiltrados]);

    const varianteDe = (grupo) => {
        const id = seleccion[grupo.clave];
        return grupo.variantes.find((v) => Number(v.id) === Number(id)) || grupo.variantes[0];
    };

    // Al elegir color se conserva la talla actual si existe esa combinacion.
    const elegirColor = (grupo, colorId) => {
        const actual = varianteDe(grupo);
        const mismaTalla = grupo.variantes.find(
            (v) => Number(v.idcolor) === Number(colorId) && Number(v.idtalla) === Number(actual.idtalla)
        );
        const objetivo = mismaTalla
            || grupo.variantes.find((v) => Number(v.idcolor) === Number(colorId))
            || actual;
        setSeleccion((prev) => ({ ...prev, [grupo.clave]: objetivo.id }));
    };

    // Al elegir talla se conserva el color actual si existe esa combinacion.
    const elegirTalla = (grupo, tallaId) => {
        const actual = varianteDe(grupo);
        const mismoColor = grupo.variantes.find(
            (v) => Number(v.idtalla) === Number(tallaId) && Number(v.idcolor) === Number(actual.idcolor)
        );
        const objetivo = mismoColor
            || grupo.variantes.find((v) => Number(v.idtalla) === Number(tallaId))
            || actual;
        setSeleccion((prev) => ({ ...prev, [grupo.clave]: objetivo.id }));
    };

    const stockTotalGrupo = (grupo) =>
        grupo.variantes.reduce((acc, v) => acc + Number(v.stock || 0), 0);

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

                {!cargando && !error && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <span className={`text-xs font-bold font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Mostrando {grupos.length} artículos · {productosFiltrados.length} combinaciones
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {grupos.map((grupo) => {
                                const prod = varianteDe(grupo);
                                const stockGrupo = stockTotalGrupo(grupo);
                                const colores = [...new Map(grupo.variantes.map((v) => [v.idcolor, v])).values()];
                                const tallas = [...new Map(grupo.variantes.map((v) => [v.idtalla, v])).values()];
                                const tieneVariantes = grupo.variantes.length > 1;

                                return (
                                    <div
                                        key={grupo.clave}
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
                                                {prod.marca || "Mia's Store"}
                                            </span>
                                            {stockGrupo === 0 && (
                                                <span className="absolute top-2.5 right-2.5 bg-rose-600 px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase">
                                                    Agotado
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-xs line-clamp-2 mb-1 group-hover:text-rose-500 transition-colors">
                                                {prod.nombre}
                                            </h3>
                                            <span className="text-[10px] text-slate-400">
                                                {prod.categoria || 'General'}
                                                {prod.modelo && prod.modelo !== 'Sin modelo' ? ` · ${prod.modelo}` : ''}
                                            </span>

                                            {tieneVariantes && (
                                                <div className="mt-2 space-y-1.5">
                                                    {colores.length > 1 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {colores.map((v) => (
                                                                <button
                                                                    key={`c-${v.idcolor}`}
                                                                    type="button"
                                                                    title={v.color}
                                                                    onClick={() => elegirColor(grupo, v.idcolor)}
                                                                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                                                                        Number(prod.idcolor) === Number(v.idcolor) ? 'border-rose-500 scale-110' : 'border-slate-400/40'
                                                                    }`}
                                                                    style={{ background: v.color_hex || '#64748b' }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    {tallas.length > 1 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {tallas.map((v) => (
                                                                <button
                                                                    key={`t-${v.idtalla}`}
                                                                    type="button"
                                                                    onClick={() => elegirTalla(grupo, v.idtalla)}
                                                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                                                                        Number(prod.idtalla) === Number(v.idtalla)
                                                                            ? 'bg-rose-600 text-white border-rose-600'
                                                                            : isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-500'
                                                                    }`}
                                                                >
                                                                    {v.talla}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 mt-1.5">
                                                {prod.color && prod.color !== 'Sin color' && (
                                                    <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                                        <span className="inline-block w-2 h-2 rounded-full border border-slate-500/40" style={{ background: prod.color_hex || '#64748b' }} />
                                                        {prod.color}
                                                    </span>
                                                )}
                                                {prod.talla && prod.talla !== 'Sin talla' && (
                                                    <span className="text-[9px] text-slate-400">Talla {prod.talla}</span>
                                                )}
                                                <span className={`text-[9px] font-mono ${stockGrupo === 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                                                    Stock: {prod.stock}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-500/20 flex items-center justify-between">
                                            <div>
                                                <span className="text-lg font-black text-emerald-500">${prod.precio}</span>
                                                {prod.preciofull && Number(prod.preciofull) > 0 && (
                                                    <span className="text-[10px] text-slate-400 line-through block">
                                                        ${prod.preciofull}
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
                                                    onClick={() => agregarAlCarrito(prod, 1)}
                                                    disabled={Number(prod.stock) === 0}
                                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                                    title="Añadir al carrito"
                                                >
                                                    + 🛒
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
