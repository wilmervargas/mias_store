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
      )}
    </div>
  );
};

export default CrudCategorias;
