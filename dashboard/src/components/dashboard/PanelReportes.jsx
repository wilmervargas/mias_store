import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Boton from '../ui/Boton';
import { Card, CardBody, CardHeader } from '../ui/Card';
import PageHeader from '../ui/PageHeader';
import { Campo, Input } from '../ui/Campo';

const PanelReportes = () => {
  const [resumen, setResumen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [criticos, setCriticos] = useState([]);
  const [valor, setValor] = useState([]);
  const [umbral, setUmbral] = useState(10);
  const [cargando, setCargando] = useState(true);

  const cargar = async (u = umbral) => {
    setCargando(true);
    const r1 = await api.get('reportes/resumen');
    if (r1.success) {
      setResumen(r1.datos?.resumen || null);
      setCategorias(r1.datos?.categorias || []);
      setAlmacenes(r1.datos?.almacenes || []);
    }
    const r2 = await api.get('reportes/stock-critico', `umbral=${u}`);
    if (r2.success) setCriticos(r2.datos || []);
    const r3 = await api.get('reportes/valor-inventario');
    if (r3.success) setValor(r3.datos || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  if (cargando && !resumen) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando reportes...</p>;
  }
  if (!resumen) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No se pudo cargar la información de reportes.</p>;
  }

  const kpis = [
    { label: 'Productos activos', valor: resumen.total_productos, color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Unidades en stock', valor: Number(resumen.total_unidades || 0).toLocaleString('es-VE'), color: 'text-gray-900 dark:text-white' },
    { label: 'Valor a costo', valor: '$ ' + Number(resumen.valor_costo || 0).toLocaleString('es-VE'), color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Valor a venta', valor: '$ ' + Number(resumen.valor_venta || 0).toLocaleString('es-VE'), color: 'text-emerald-600 dark:text-emerald-400' },
    { label: `Stock crítico (< ${umbral})`, valor: resumen.criticos, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Agotados', valor: resumen.agotados, color: 'text-red-600 dark:text-red-400' },
  ];

  const formato = (n) => Number(n || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 });
  const th = "p-3.5 text-left whitespace-nowrap";
  const thR = "p-3.5 text-right whitespace-nowrap";

  return (
    <div className="space-y-6">
      <PageHeader
        icon="reporte"
        title="Reportes"
        description="Visualización de indicadores clave de inventario, stock, valorización y reposición."
        actions={
          <Boton variante="info" icono="refrescar" onClick={() => cargar(umbral)} cargando={cargando}>
            Actualizar
          </Boton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">{k.label}</span>
            <span className={`text-2xl font-black ${k.color}`}>{k.valor}</span>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <Campo label="Umbral de stock crítico" className="w-40">
            <Input
              type="number"
              value={umbral}
              onChange={(e) => setUmbral(Number(e.target.value))}
            />
          </Campo>
          <Boton variante="primario" icono="reporte" onClick={() => cargar(umbral)} cargando={cargando}>
            Regenerar reporte
          </Boton>
          <p className="text-xs text-gray-500 dark:text-gray-400 pb-2">Actualiza los productos en reposición urgente según el umbral.</p>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Stock y valor por almacén" description="Distribución de unidades y valorización por centro de almacenamiento." />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className={th}>Almacén</th>
                <th className={th}>Código</th>
                <th className={thR}>Productos</th>
                <th className={thR}>Unidades</th>
                <th className={thR}>Valor costo</th>
                <th className={thR}>Valor venta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {almacenes.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="p-3.5 font-bold text-gray-900 dark:text-white">{a.nombre}</td>
                  <td className="p-3.5 font-mono text-cyan-600 dark:text-cyan-400">{a.codigo}</td>
                  <td className="p-3.5 text-right text-gray-700 dark:text-gray-300">{a.productos}</td>
                  <td className="p-3.5 text-right font-bold text-gray-900 dark:text-white">{formato(a.unidades)}</td>
                  <td className="p-3.5 text-right text-amber-600 dark:text-amber-400">$ {formato(a.valor_costo)}</td>
                  <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400">$ {formato(a.valor_venta)}</td>
                </tr>
              ))}
              {almacenes.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">Sin almacenes activos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title={`Reposición urgente (stock < ${umbral})`} description="Productos con existencias por debajo del umbral definido." />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className={th}>SKU</th>
                <th className={th}>Producto</th>
                <th className={th}>Color / Talla</th>
                <th className={th}>Categoría</th>
                <th className={th}>Marca</th>
                <th className={thR}>Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {criticos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="p-3.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{p.sku_base}</td>
                  <td className="p-3.5 font-bold text-gray-900 dark:text-white">{p.nombre}</td>
                  <td className="p-3.5 text-gray-600 dark:text-gray-400">{p.color} / {p.talla}</td>
                  <td className="p-3.5 text-gray-600 dark:text-gray-400">{p.categoria}</td>
                  <td className="p-3.5 text-gray-600 dark:text-gray-400">{p.marca}</td>
                  <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-400">{p.stock} u.</td>
                </tr>
              ))}
              {criticos.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-gray-500">No hay productos críticos con este umbral.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader title="Valor del inventario por categoría" description="Valorización acumulada por familia de productos." />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className={th}>Categoría</th>
                  <th className={thR}>Productos</th>
                  <th className={thR}>Costo</th>
                  <th className={thR}>Venta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {categorias.map((c) => (
                  <tr key={c.categoria} className="hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-3.5 font-bold text-gray-900 dark:text-white">{c.categoria}</td>
                    <td className="p-3.5 text-right text-gray-600 dark:text-gray-400">{c.productos}</td>
                    <td className="p-3.5 text-right text-amber-600 dark:text-amber-400">$ {formato(c.valor_costo)}</td>
                    <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400">$ {formato(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader title="Top productos por valor a costo" description="Los 15 productos con mayor valor de inventario al costo." />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400 font-bold uppercase text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className={th}>SKU</th>
                  <th className={th}>Producto</th>
                  <th className={thR}>Stock</th>
                  <th className={thR}>Valor costo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {valor.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="p-3.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{p.sku_base}</td>
                    <td className="p-3.5 font-bold text-gray-900 dark:text-white max-w-[220px] truncate">{p.nombre}</td>
                    <td className="p-3.5 text-right text-gray-700 dark:text-gray-300">{p.stock}</td>
                    <td className="p-3.5 text-right text-amber-600 dark:text-amber-400">$ {formato(p.valor_costo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PanelReportes;
