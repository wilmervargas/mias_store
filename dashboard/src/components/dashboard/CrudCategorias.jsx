<<<<<<< HEAD
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select, TextArea } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';

const formVacio = { nombre: '', descripcion: '' };

const CrudCategorias = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estatus: '' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [catEditar, setCatEditar] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);

    const res = await api.get('categorias', params.toString());
    if (res.success) {
      setCategorias(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar las categorías');
    }
    setCargando(false);
  }, [qDebounced, filtros.estatus, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setCatEditar(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (categoria) => {
    setCatEditar(categoria);
    setForm({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio');
      return;
    }

    setGuardando(true);
    const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() };
    const res = catEditar
      ? await api.put('categorias', catEditar.id, payload)
      : await api.post('categorias', payload);
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || 'No se pudo guardar la categoría');
      return;
    }

    toast.exito(catEditar ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
    setModalAbierto(false);
    setForm(formVacio);
    setCatEditar(null);
    cargar();
  };

  const desactivar = async (categoria) => {
    if (!categoria.puede_desactivar) {
      toast.error('No se puede desactivar: la categoría tiene productos vinculados.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Desactivar categoría',
      mensaje: `¿Deseas desactivar la categoría "${categoria.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: ['Dejará de mostrarse en la tienda.', 'Podrás reactivarla más adelante.'],
    });
    if (!ok) return;

    const res = await api.delete('categorias', categoria.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar la categoría');
      return;
    }
    toast.exito('Categoría desactivada');
    cargar();
  };

  const reactivar = async (categoria) => {
    const ok = await confirmar({
      titulo: 'Reactivar categoría',
      mensaje: `¿Deseas reactivar la categoría "${categoria.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('categorias', categoria.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar la categoría');
      return;
    }
    toast.exito('Categoría reactivada');
    cargar();
  };

  const eliminar = async (categoria) => {
    if (!categoria.puede_eliminar) {
      toast.error('No se puede eliminar: la categoría tiene productos o subcategorías vinculadas.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar categoría definitivamente',
      mensaje: `Esta acción eliminará la categoría "${categoria.nombre}" de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'No se puede deshacer.',
        'Solo se permite porque no tiene productos ni subcategorías vinculadas.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('categorias', categoria.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar la categoría');
      return;
    }
    toast.exito('Categoría eliminada definitivamente');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', estatus: '' });
  const hayFiltros = filtros.q !== '' || filtros.estatus !== '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Categorías</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Clasificación principal de los productos</p>
        </div>
        <Boton variante="primario" icono="mas" onClick={abrirCrear}>
          Nueva Categoría
        </Boton>
      </div>

      <BarraFiltros
        total={categorias.length}
        etiqueta="categorías"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar por nombre o descripción..."
          className="col-span-2 md:w-72"
        />
        <Select
          value={filtros.estatus}
          onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })}
          className="md:w-40"
        >
          <option value="">Todos los estados</option>
          <option value="1">Activas</option>
          <option value="2">Inactivas</option>
        </Select>
      </BarraFiltros>

      <Tabla
        colSpan={7}
        cargando={cargando}
        vacio={categorias.length === 0}
        textoVacio="No hay categorías para los filtros seleccionados."
        cabecera={
          <>
            <Th>ID</Th>
            <Th>Nombre</Th>
            <Th>Descripción</Th>
            <Th align="right">Subcategorías</Th>
            <Th align="right">Productos</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </>
        }
      >
        {categorias.map((categoria) => {
          const activa = Number(categoria.idestatus) === 1;
          return (
            <tr key={categoria.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <Td className="font-mono text-slate-500">#{categoria.id}</Td>
              <Td className="font-bold text-slate-900 dark:text-white">{categoria.nombre}</Td>
              <Td className="text-slate-400 max-w-[240px] truncate">{categoria.descripcion || '—'}</Td>
              <Td align="right" className="text-slate-300">{categoria.total_subcategorias}</Td>
              <Td align="right" className="text-emerald-400 font-bold">{categoria.total_productos}</Td>
              <Td><BadgeEstado activo={activa} activoLabel="Activa" inactivoLabel="Inactiva" /></Td>
              <Td align="right">
                <Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(categoria)}>
                    Editar
                  </Boton>
                  {activa ? (
                    <Boton
                      tamano="sm"
                      variante="advertencia"
                      icono="poder"
                      disabled={!categoria.puede_desactivar}
                      title={!categoria.puede_desactivar ? 'Tiene productos vinculados. Reasígnalos primero.' : undefined}
                      onClick={() => desactivar(categoria)}
                    >
                      Desactivar
                    </Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(categoria)}>
                      Reactivar
                    </Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!categoria.puede_eliminar}
                    title={!categoria.puede_eliminar ? 'Solo se puede eliminar si no tiene productos ni subcategorías.' : undefined}
                    onClick={() => eliminar(categoria)}
                  >
                    Eliminar
                  </Boton>
                </Acciones>
              </Td>
            </tr>
          );
        })}
      </Tabla>

      {modalAbierto && (
        <Modal
          titulo={catEditar ? 'Editar categoría' : 'Nueva categoría'}
          subtitulo={catEditar ? `ID #${catEditar.id}` : 'Registra una categoría en el catálogo'}
          icono="categoria"
          onClose={() => setModalAbierto(false)}
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-categoria" variante="exito" icono="guardar" cargando={guardando}>
                {catEditar ? 'Guardar cambios' : 'Crear categoría'}
              </Boton>
            </>
          }
        >
          <form id="form-categoria" onSubmit={guardar} className="space-y-4">
            <Campo label="Nombre" required>
              <Input
                autoFocus
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Camisas, Calzado, Accesorios..."
              />
            </Campo>
            <Campo label="Descripción" hint="Opcional. Aparece como referencia interna.">
              <TextArea
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe brevemente esta categoría..."
              />
            </Campo>
          </form>
        </Modal>
=======
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CrudCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [catEditar, setCatEditar] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = async () => {
    // todos=1 para mostrar activas e inactivas en el panel
    const res = await api.get('categorias', 'todos=1');
    setCategorias(res.datos || []);
  };

  useEffect(() => { cargar(); }, []);

  const handleEliminar = async (id) => {
    if (confirm(`¿Desactivar la categoría #${id}?`)) {
      await api.delete('categorias', id);
      cargar();
    }
  };

  const handleReactivar = async (id) => {
    const res = await api.put('categorias', id, { idestatus: 1 });
    if (!res.success) alert(res.error || 'No se pudo reactivar la categoría');
    cargar();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = catEditar
      ? await api.put('categorias', catEditar.id, { nombre, descripcion })
      : await api.post('categorias', { nombre, descripcion });
    if (!res.success) {
      alert(res.error || 'No se pudo guardar la categoría');
      return;
    }
    setModalAbierto(false);
    setNombre('');
    setDescripcion('');
    cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setCatEditar(null); setNombre(''); setDescripcion(''); setModalAbierto(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
        >
          ➕ Nueva Categoría
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Nombre</th>
              <th className="p-3.5">Descripción</th>
              <th className="p-3.5">Productos</th>
              <th className="p-3.5">Estatus</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {categorias.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-500">#{c.id}</td>
                <td className="p-3.5 font-bold text-white">{c.nombre}</td>
                <td className="p-3.5 text-slate-400">{c.descripcion}</td>
                <td className="p-3.5 text-emerald-400 font-bold">{c.total_productos || 0} prods</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    Number(c.idestatus) === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {Number(c.idestatus) === 1 ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => { setCatEditar(c); setNombre(c.nombre); setDescripcion(c.descripcion); setModalAbierto(true); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                  >
                    ✏️ Editar
                  </button>
                  {Number(c.idestatus) === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleEliminar(c.id)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🗑️ Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivar(c.id)}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🔄 Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">{catEditar ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
            <input
              type="text"
              required
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-3 py-1.5 bg-slate-800 text-xs rounded-xl text-slate-300">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl">Guardar</button>
            </div>
          </form>
        </div>
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
      )}
    </div>
  );
};

export default CrudCategorias;
