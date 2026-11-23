<<<<<<< HEAD
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useConfirm } from '../ui/ConfirmProvider';
import { useToast } from '../ui/ToastProvider';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import { BarraFiltros, Buscador } from '../ui/BarraFiltros';
import { Campo, Input, Select } from '../ui/Campo';
import { Acciones, BadgeEstado, Tabla, Td, Th } from '../ui/Tabla';

const formVacio = { nombre: '' };

const CrudMarcas = () => {
  const confirmar = useConfirm();
  const toast = useToast();

  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ q: '', estatus: '' });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [marcaEditar, setMarcaEditar] = useState(null);
  const [form, setForm] = useState(formVacio);
  const [guardando, setGuardando] = useState(false);

  const qDebounced = useDebounce(filtros.q);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ todos: '1' });
    if (qDebounced) params.append('q', qDebounced);
    if (filtros.estatus !== '') params.append('estatus', filtros.estatus);

    const res = await api.get('marcas', params.toString());
    if (res.success) {
      setMarcas(res.datos || []);
    } else {
      toast.error(res.error || 'No se pudieron cargar las marcas');
    }
    setCargando(false);
  }, [qDebounced, filtros.estatus, toast]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirCrear = () => {
    setMarcaEditar(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (marca) => {
    setMarcaEditar(marca);
    setForm({ nombre: marca.nombre || '' });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error('El nombre de la marca es obligatorio');
      return;
    }

    setGuardando(true);
    const res = marcaEditar
      ? await api.put('marcas', marcaEditar.id, { nombre: form.nombre.trim() })
      : await api.post('marcas', { nombre: form.nombre.trim() });
    setGuardando(false);

    if (!res.success) {
      toast.error(res.error || 'No se pudo guardar la marca');
      return;
    }

    toast.exito(marcaEditar ? 'Marca actualizada correctamente' : 'Marca creada correctamente');
    setModalAbierto(false);
    setForm(formVacio);
    setMarcaEditar(null);
    cargar();
  };

  const desactivar = async (marca) => {
    if (!marca.puede_desactivar) {
      toast.error('No se puede desactivar: la marca tiene productos vinculados.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Desactivar marca',
      mensaje: `¿Deseas desactivar la marca "${marca.nombre}"?`,
      variante: 'advertencia',
      textoConfirmar: 'Sí, desactivar',
      detalle: ['Dejará de mostrarse en la tienda.', 'Podrás reactivarla más adelante.'],
    });
    if (!ok) return;

    const res = await api.delete('marcas', marca.id);
    if (!res.success) {
      toast.error(res.error || 'No se pudo desactivar la marca');
      return;
    }
    toast.exito('Marca desactivada');
    cargar();
  };

  const reactivar = async (marca) => {
    const ok = await confirmar({
      titulo: 'Reactivar marca',
      mensaje: `¿Deseas reactivar la marca "${marca.nombre}"?`,
      variante: 'exito',
      textoConfirmar: 'Sí, reactivar',
    });
    if (!ok) return;

    const res = await api.put('marcas', marca.id, { idestatus: 1 });
    if (!res.success) {
      toast.error(res.error || 'No se pudo reactivar la marca');
      return;
    }
    toast.exito('Marca reactivada');
    cargar();
  };

  const eliminar = async (marca) => {
    if (!marca.puede_eliminar) {
      toast.error('No se puede eliminar: la marca tiene productos o modelos vinculados.');
      return;
    }

    const ok = await confirmar({
      titulo: 'Eliminar marca definitivamente',
      mensaje: `Esta acción eliminará la marca "${marca.nombre}" de forma permanente.`,
      variante: 'peligro',
      textoConfirmar: 'Sí, eliminar',
      detalle: [
        'No se puede deshacer.',
        'Solo se permite porque no tiene productos ni modelos vinculados.',
      ],
      checkLabel: 'Entiendo que esta acción es permanente y no se puede deshacer.',
    });
    if (!ok) return;

    const res = await api.delete('marcas', marca.id, 'fisico=1');
    if (!res.success) {
      toast.error(res.error || 'No se pudo eliminar la marca');
      return;
    }
    toast.exito('Marca eliminada definitivamente');
    cargar();
  };

  const limpiar = () => setFiltros({ q: '', estatus: '' });
  const hayFiltros = filtros.q !== '' || filtros.estatus !== '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Marcas</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Catálogo comercial de la tienda</p>
        </div>
        <Boton variante="primario" icono="mas" onClick={abrirCrear}>
          Nueva Marca
        </Boton>
      </div>

      <BarraFiltros
        total={marcas.length}
        etiqueta="marcas"
        onLimpiar={limpiar}
        puedeLimpiar={hayFiltros}
      >
        <Buscador
          valor={filtros.q}
          onChange={(q) => setFiltros({ ...filtros, q })}
          placeholder="Buscar marca por nombre..."
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
        colSpan={6}
        cargando={cargando}
        vacio={marcas.length === 0}
        textoVacio="No hay marcas para los filtros seleccionados."
        cabecera={
          <>
            <Th>ID</Th>
            <Th>Marca</Th>
            <Th align="right">Modelos</Th>
            <Th align="right">Productos</Th>
            <Th>Estado</Th>
            <Th align="right">Acciones</Th>
          </>
        }
      >
        {marcas.map((marca) => {
          const activa = Number(marca.idestatus) === 1;
          return (
            <tr key={marca.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <Td className="font-mono text-slate-500">#{marca.id}</Td>
              <Td className="font-bold text-white text-sm">{marca.nombre}</Td>
              <Td align="right" className="text-slate-300">{marca.total_modelos}</Td>
              <Td align="right" className="text-cyan-400 font-bold">{marca.total_productos}</Td>
              <Td><BadgeEstado activo={activa} activoLabel="Activa" inactivoLabel="Inactiva" /></Td>
              <Td align="right">
                <Acciones>
                  <Boton tamano="sm" variante="neutral" icono="editar" onClick={() => abrirEditar(marca)}>
                    Editar
                  </Boton>
                  {activa ? (
                    <Boton
                      tamano="sm"
                      variante="advertencia"
                      icono="poder"
                      disabled={!marca.puede_desactivar}
                      title={!marca.puede_desactivar ? 'Tiene productos vinculados. Reasígnalos primero.' : undefined}
                      onClick={() => desactivar(marca)}
                    >
                      Desactivar
                    </Boton>
                  ) : (
                    <Boton tamano="sm" variante="exito" icono="refrescar" onClick={() => reactivar(marca)}>
                      Reactivar
                    </Boton>
                  )}
                  <Boton
                    tamano="sm"
                    variante="peligro"
                    icono="papelera"
                    disabled={!marca.puede_eliminar}
                    title={!marca.puede_eliminar ? 'Solo se puede eliminar si no tiene productos ni modelos vinculados.' : undefined}
                    onClick={() => eliminar(marca)}
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
          titulo={marcaEditar ? 'Editar marca' : 'Nueva marca'}
          subtitulo={marcaEditar ? `ID #${marcaEditar.id}` : 'Registra una marca en el catálogo'}
          icono="marca"
          onClose={() => setModalAbierto(false)}
          footer={
            <>
              <Boton variante="neutral" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Boton>
              <Boton type="submit" form="form-marca" variante="exito" icono="guardar" cargando={guardando}>
                {marcaEditar ? 'Guardar cambios' : 'Crear marca'}
              </Boton>
            </>
          }
        >
          <form id="form-marca" onSubmit={guardar} className="space-y-4">
            <Campo label="Nombre comercial" required>
              <Input
                autoFocus
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Nike, Adidas, Zara..."
              />
            </Campo>
          </form>
        </Modal>
=======
import { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CrudMarcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [marcaEditar, setMarcaEditar] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = async () => {
    const res = await api.get('marcas', 'todos=1');
    setMarcas(res.datos || []);
  };

  useEffect(() => { cargar(); }, []);

  const handleEliminar = async (id) => {
    if (confirm(`¿Desactivar la marca #${id}?`)) {
      await api.delete('marcas', id);
      cargar();
    }
  };

  const handleReactivar = async (id) => {
    const res = await api.put('marcas', id, { idestatus: 1 });
    if (!res.success) alert(res.error || 'No se pudo reactivar la marca');
    cargar();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = marcaEditar
      ? await api.put('marcas', marcaEditar.id, { nombre })
      : await api.post('marcas', { nombre });
    if (!res.success) {
      alert(res.error || 'No se pudo guardar la marca');
      return;
    }
    setModalAbierto(false);
    setNombre('');
    cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setMarcaEditar(null); setNombre(''); setModalAbierto(true); }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
        >
          ➕ Nueva Marca
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Nombre Comercial</th>
              <th className="p-3.5">Modelos Asociados</th>
              <th className="p-3.5">Estatus</th>
              <th className="p-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {marcas.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/40">
                <td className="p-3.5 font-mono text-slate-500">#{m.id}</td>
                <td className="p-3.5 font-bold text-white text-sm">{m.nombre}</td>
                <td className="p-3.5 text-blue-400 font-bold">{m.total_productos || 0} modelos</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    Number(m.idestatus) === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {Number(m.idestatus) === 1 ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => { setMarcaEditar(m); setNombre(m.nombre); setModalAbierto(true); }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px]"
                  >
                    ✏️ Editar
                  </button>
                  {Number(m.idestatus) === 1 ? (
                    <button
                      type="button"
                      onClick={() => handleEliminar(m.id)}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-[11px]"
                    >
                      🗑️ Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivar(m.id)}
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
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-white">{marcaEditar ? 'Editar Marca' : 'Nueva Marca'}</h3>
            <input
              type="text"
              required
              placeholder="Nombre de la Marca"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-3 py-1.5 bg-slate-800 text-xs rounded-xl text-slate-300">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl">Guardar</button>
            </div>
          </form>
        </div>
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
      )}
    </div>
  );
};

export default CrudMarcas;
