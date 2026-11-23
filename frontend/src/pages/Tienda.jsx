import React, { useEffect, useMemo, useState } from 'react';
import ModalProducto from '../components/ModalProducto';
import { useTheme } from '../context/ThemeContext';
import { useCarrito } from '../context/CarritoContext';

function PageHeader({ title, description }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      </div>
    </div>
  );
}

function Card({ children, className = '', isDark }) {
  return (
    <div className={`rounded-2xl border shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} ${className}`}>
      {children}
    </div>
  );
}

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

  const stockTotalGrupo = (grupo) => grupo.variantes.reduce((acc, v) => acc + Number(v.stock || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tienda"
        description="Catálogo de productos con búsqueda, filtros por categoría, selección de variantes y carrito."
      />

      <Card isDark={isDark} className="p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
            <div className="lg:col-span-2">
              <label className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Buscar producto</label>
              <input
                type="text"
                placeholder="Buscar por producto, marca, modelo o SKU..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-indigo-500/20'
                    : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
            </div>
            <div>
              <label className={`mb-1.5 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Resumen</label>
              <div className={`rounded-lg border px-3 py-2.5 text-sm ${isDark ? 'border-slate-700 bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                {grupos.length} artículos · {productosFiltrados.length} combinaciones
              </div>
            </div>
          </div>

          <div>
            <p className={`mb-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Categorías</p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => {
                const activa = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                      activa
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : isDark
                          ? 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {cargando && (
        <Card isDark={isDark} className="p-16 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`font-mono text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Consultando API de PHP (http://localhost:8000)...</p>
        </Card>
      )}

      {error && (
        <Card isDark={isDark} className="p-6 border-rose-300 dark:border-rose-500/30">
          <h3 className="text-rose-600 dark:text-rose-400 font-bold mb-2">Error de conexión</h3>
          <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{error}</p>
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Verifica tener "php -S localhost:8000" corriendo en backend/.
          </span>
        </Card>
      )}

      {!cargando && !error && (
        <>
          {grupos.length === 0 ? (
            <Card isDark={isDark} className="p-10 text-center">
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>No hay productos para mostrar</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ajusta la búsqueda o la categoría seleccionada.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {grupos.map((grupo) => {
                const prod = varianteDe(grupo);
                const stockGrupo = stockTotalGrupo(grupo);
                const colores = [...new Map(grupo.variantes.map((v) => [v.idcolor, v])).values()];
                const tallas = [...new Map(grupo.variantes.map((v) => [v.idtalla, v])).values()];
                const tieneVariantes = grupo.variantes.length > 1;

                return (
                  <Card
                    key={grupo.clave}
                    isDark={isDark}
                    className={`p-4 flex flex-col justify-between transition-all duration-300 hover:border-indigo-400/50 ${isDark ? 'hover:border-indigo-500/40' : ''}`}
                  >
                    <div className={`relative aspect-square rounded-2xl p-4 flex items-center justify-center overflow-hidden mb-3 ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                      <img
                        src={`http://localhost:8000/imagenes/${prod.imagen}`}
                        alt={prod.nombre}
                        className="max-h-full max-w-full object-contain hover:scale-105 transition-all duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500';
                        }}
                      />
                      <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-indigo-200 uppercase">
                        {prod.marca || "Mia's Store"}
                      </span>
                      {stockGrupo === 0 && (
                        <span className="absolute top-2.5 right-2.5 bg-rose-600 px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className={`font-bold text-xs line-clamp-2 mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {prod.nombre}
                      </h3>
                      <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                                    Number(prod.idcolor) === Number(v.idcolor) ? 'border-indigo-500 scale-110' : isDark ? 'border-slate-600' : 'border-slate-300'
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
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'
                                  }`}
                                >
                                  {v.talla}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {prod.color && prod.color !== 'Sin color' && (
                          <span className={`text-[9px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <span className="inline-block w-2 h-2 rounded-full border border-slate-500/40" style={{ background: prod.color_hex || '#64748b' }} />
                            {prod.color}
                          </span>
                        )}
                        {prod.talla && prod.talla !== 'Sin talla' && (
                          <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Talla {prod.talla}</span>
                        )}
                        <span className={`text-[9px] font-mono ${stockGrupo === 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-500'}`}>
                          Stock: {prod.stock}
                        </span>
                      </div>
                    </div>

                    <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-500">${prod.precio}</span>
                        {prod.preciofull && Number(prod.preciofull) > 0 && (
                          <span className={`text-[10px] line-through block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            ${prod.preciofull}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setProductoModal(prod)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                          title="Ver detalle"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => agregarAlCarrito(prod, 1)}
                          disabled={Number(prod.stock) === 0}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all"
                          title="Añadir al carrito"
                        >
                          + Carrito
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {productoModal && (
        <ModalProducto
          producto={productoModal}
          onClose={() => setProductoModal(null)}
        />
      )}
    </div>
  );
}
