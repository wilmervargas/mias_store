import React, { useEffect, useMemo, useState } from 'react';
import ModalProducto from '../components/ModalProducto';
import { useCarrito } from '../context/CarritoContext';

export default function Tienda() {
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

  const etiquetaArticulos = grupos.length === 1 ? 'artículo' : 'artículos';
  const etiquetaCombinaciones = productosFiltrados.length === 1 ? 'combinación' : 'combinaciones';

  return (
    <div className="space-y-8">
      {/* Hero con bienvenida y buscador */}
      <section className="animate-rise relative overflow-hidden rounded-[2rem] border border-cream-200/80 bg-gradient-to-br from-cream-50 via-peach-100/70 to-lavender-100/80 p-6 shadow-[0_30px_70px_-45px_rgba(74,47,59,0.6)] sm:p-10 dark:border-plum-700/70 dark:from-plum-800 dark:via-plum-800/90 dark:to-plum-700/80">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blush-300/30 blur-2xl dark:bg-blush-500/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-lavender-200/60 blur-3xl dark:bg-plum-600/20" />

        <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blush-300/60 bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-blush-600 dark:border-blush-400/30 dark:bg-plum-900/40 dark:text-blush-300">
              ✨ Catálogo 2026
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-plum-800 sm:text-4xl lg:text-5xl dark:text-cream-50">
              Bienvenida a{' '}
              <span className="text-blush-600 dark:text-blush-300">Mia&apos;s Store</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-plum-500 dark:text-cream-200/70">
              Tecnología, hogar y línea blanca seleccionados para consentirte. Encuentra tu favorito,
              elige color y talla, y añádelo al carrito.
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="buscador" className="block text-[10px] font-bold uppercase tracking-[0.24em] text-plum-400 dark:text-cream-200/60">
              Buscar producto
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base">🔍</span>
              <input
                id="buscador"
                type="text"
                placeholder="Producto, marca, modelo o SKU..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-full border border-cream-200 bg-white/90 py-3 pl-11 pr-4 text-sm text-plum-800 shadow-sm outline-none transition placeholder:text-plum-400/70 focus:border-blush-400 focus:ring-4 focus:ring-blush-300/25 dark:border-plum-700 dark:bg-plum-900/50 dark:text-cream-50 dark:placeholder:text-cream-200/40 dark:focus:border-blush-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-plum-400 dark:text-cream-200/60">
              <span className="rounded-full bg-white/70 px-2.5 py-1 dark:bg-plum-900/40">{grupos.length} {etiquetaArticulos}</span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 dark:bg-plum-900/40">{productosFiltrados.length} {etiquetaCombinaciones}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros por categoría */}
      <section className="card-soft p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.24em] text-plum-400 dark:text-cream-200/60">
              Categorías
            </p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => {
                const activa = categoriaActiva === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaActiva(cat)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                      activa
                        ? 'border-transparent bg-gradient-to-r from-blush-500 to-blush-400 text-white shadow-lg shadow-blush-500/30'
                        : 'border-cream-200 bg-white/80 text-plum-600 hover:border-blush-300 hover:text-blush-600 dark:border-plum-700 dark:bg-plum-800/60 dark:text-cream-200/80 dark:hover:border-blush-400/60 dark:hover:text-blush-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-cream-200 bg-cream-50/80 px-4 py-3 text-xs text-plum-500 dark:border-plum-700 dark:bg-plum-900/40 dark:text-cream-200/70">
            <span className="text-base">🛍️</span>
            <span>
              <strong className="font-semibold text-plum-700 dark:text-cream-100">{grupos.length}</strong> {etiquetaArticulos} disponibles
            </span>
          </div>
        </div>
      </section>

      {/* Cargando */}
      {cargando && (
        <div className="space-y-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-blush-500 dark:text-blush-300">
            Cargando catálogo...
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-soft overflow-hidden p-3">
                <div className="aspect-square animate-pulse rounded-[1.35rem] bg-cream-100 dark:bg-plum-700/50" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-cream-100 dark:bg-plum-700/50" />
                  <div className="h-3 w-2/5 animate-pulse rounded-full bg-cream-100/80 dark:bg-plum-700/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card-soft border-blush-200 p-6 dark:border-blush-500/30">
          <h3 className="mb-2 font-display text-lg font-semibold text-blush-600 dark:text-blush-300">
            No pudimos conectar con la tienda
          </h3>
          <p className="mb-2 text-xs text-plum-500 dark:text-cream-200/70">{error}</p>
          <span className="text-[10px] font-mono text-plum-400 dark:text-cream-200/40">
            Verifica tener &quot;php -S localhost:8000&quot; corriendo en backend/.
          </span>
        </div>
      )}

      {!cargando && !error && (
        <>
          {grupos.length === 0 ? (
            <div className="card-soft p-12 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-blush-100 text-2xl dark:bg-plum-700/60">
                🌸
              </div>
              <p className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
                No hay productos para mostrar
              </p>
              <p className="mt-1 text-sm text-plum-500 dark:text-cream-200/60">
                Ajusta la búsqueda o la categoría seleccionada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {grupos.map((grupo) => {
                const prod = varianteDe(grupo);
                const stockGrupo = stockTotalGrupo(grupo);
                const colores = [...new Map(grupo.variantes.map((v) => [v.idcolor, v])).values()];
                const tallas = [...new Map(grupo.variantes.map((v) => [v.idtalla, v])).values()];
                const tieneVariantes = grupo.variantes.length > 1;

                return (
                  <article
                    key={grupo.clave}
                    className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-cream-200/90 bg-white/85 shadow-[0_22px_55px_-40px_rgba(74,47,59,0.55)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blush-300/80 hover:shadow-[0_30px_65px_-32px_rgba(214,92,132,0.45)] dark:border-plum-700/80 dark:bg-plum-800/70 dark:hover:border-blush-400/40"
                  >
                    <div className="relative m-3 mb-0 aspect-square overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-cream-100 via-cream-50 to-peach-100 dark:from-plum-900/70 dark:via-plum-800/50 dark:to-plum-700/40">
                      <img
                        src={`http://localhost:8000/imagenes/${prod.imagen}`}
                        alt={prod.nombre}
                        className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500';
                        }}
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-blush-600 shadow-sm backdrop-blur dark:bg-plum-900/75 dark:text-blush-300">
                        {prod.marca || "Mia's Store"}
                      </span>
                      {stockGrupo === 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-blush-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
                          Agotado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-2.5 p-4">
                      <div>
                        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-plum-800 dark:text-cream-50">
                          {prod.nombre}
                        </h3>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-plum-400 dark:text-cream-200/55">
                          {prod.categoria || 'General'}
                          {prod.modelo && prod.modelo !== 'Sin modelo' ? ` · ${prod.modelo}` : ''}
                        </p>
                      </div>

                      {tieneVariantes && (
                        <div className="space-y-1.5">
                          {colores.length > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                              {colores.map((v) => {
                                const activo = Number(prod.idcolor) === Number(v.idcolor);
                                return (
                                  <button
                                    key={`c-${v.idcolor}`}
                                    type="button"
                                    title={v.color}
                                    onClick={() => elegirColor(grupo, v.idcolor)}
                                    className={`h-5 w-5 rounded-full border-2 border-white shadow-sm transition-transform ${
                                      activo
                                        ? 'scale-110 ring-2 ring-blush-500 ring-offset-2 ring-offset-white dark:ring-offset-plum-800'
                                        : 'ring-1 ring-cream-200 hover:scale-110 dark:ring-plum-600'
                                    }`}
                                    style={{ background: v.color_hex || '#cbb4bd' }}
                                  />
                                );
                              })}
                            </div>
                          )}
                          {tallas.length > 1 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tallas.map((v) => {
                                const activo = Number(prod.idtalla) === Number(v.idtalla);
                                return (
                                  <button
                                    key={`t-${v.idtalla}`}
                                    type="button"
                                    onClick={() => elegirTalla(grupo, v.idtalla)}
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition-all ${
                                      activo
                                        ? 'border-blush-500 bg-blush-500 text-white shadow-sm'
                                        : 'border-cream-200 bg-white/80 text-plum-500 hover:border-blush-300 dark:border-plum-700 dark:bg-plum-900/40 dark:text-cream-200/70'
                                    }`}
                                  >
                                    {v.talla}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-plum-400 dark:text-cream-200/55">
                        {prod.color && prod.color !== 'Sin color' && (
                          <span className="flex items-center gap-1">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-plum-300/50"
                              style={{ background: prod.color_hex || '#cbb4bd' }}
                            />
                            {prod.color}
                          </span>
                        )}
                        {prod.talla && prod.talla !== 'Sin talla' && (
                          <span>Talla {prod.talla}</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                          stockGrupo === 0
                            ? 'bg-blush-100 text-blush-600 dark:bg-blush-600/20 dark:text-blush-300'
                            : 'bg-sage-500/10 text-sage-500 dark:bg-sage-500/15 dark:text-emerald-300'
                        }`}>
                          Stock: {prod.stock} {prod.unidad_abreviatura || prod.unidad_medida || ''}
                        </span>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-2 border-t border-cream-200/80 pt-3 dark:border-plum-700/70">
                        <div>
                          <span className="font-display text-xl font-semibold text-plum-800 dark:text-cream-50">
                            ${prod.precio}
                          </span>
                          {prod.preciofull && Number(prod.preciofull) > 0 && (
                            <span className="block text-[10px] line-through text-plum-400 dark:text-cream-200/40">
                              ${prod.preciofull}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setProductoModal(prod)}
                            className="rounded-full border border-cream-200 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-plum-600 transition hover:border-blush-300 hover:text-blush-600 dark:border-plum-700 dark:bg-plum-900/50 dark:text-cream-100 dark:hover:border-blush-400/60 dark:hover:text-blush-300"
                            title="Ver detalle"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => agregarAlCarrito(prod, 1)}
                            disabled={Number(prod.stock) === 0}
                            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blush-500 to-blush-400 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white shadow-md shadow-blush-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blush-500/35 disabled:pointer-events-none disabled:opacity-40"
                            title="Añadir al carrito"
                          >
                            🛒 Añadir
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
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
