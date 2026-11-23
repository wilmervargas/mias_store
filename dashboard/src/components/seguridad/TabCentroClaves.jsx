import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/ToastProvider';
import { generarClaveSegura, copiarTexto } from '../../utils/claves';
import Boton from '../ui/Boton';
import Modal from '../ui/Modal';
import Icono from '../ui/Icono';
import CampoPassword from '../ui/CampoPassword';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Campo } from '../ui/Campo';
import { Buscador } from '../ui/BarraFiltros';

const textoError = (error, respaldo) => {
  if (Array.isArray(error)) return error.join(' ');
  return error || respaldo;
};

const iniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() || '').join('') || 'US';
};

const formatearFecha = (valor) => {
  if (!valor) return 'Nunca';
  const fecha = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
};

const ModalResetClave = ({ usuario, onClose }) => {
  const toast = useToast();
  const [clave, setClave] = useState(() => generarClaveSegura());
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const restablecer = async (e) => {
    e.preventDefault();

    if (clave.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setEnviando(true);
    const res = await api.post('seguridad/restablecer-password', {
      user_id: usuario.id,
      password: clave,
    });
    setEnviando(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo restablecer la contraseña.'));
      return;
    }

    setResultado({
      usuario: res.datos?.usuario || usuario,
      clave: res.datos?.password_temporal || clave,
    });
    toast.exito('Clave restablecida correctamente.');
  };

  const copiar = async () => {
    if (!resultado) return;
    const texto = [
      "Mia's Store · Credenciales de acceso",
      `Usuario: ${resultado.usuario.full_name}`,
      `Correo: ${resultado.usuario.email}`,
      `Contraseña: ${resultado.clave}`,
      'Recomendación: cambia esta clave al iniciar sesión.',
    ].join('\n');

    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(true);
      toast.exito('Credenciales copiadas al portapapeles.');
      window.setTimeout(() => setCopiado(false), 2500);
    } else {
      toast.error('No se pudo copiar. Selecciona el texto manualmente.');
    }
  };

  return (
    <Modal
      titulo={resultado ? 'Credenciales restablecidas' : 'Restablecer contraseña'}
      subtitulo={usuario.full_name}
      icono="llave"
      tono={resultado ? 'exito' : 'advertencia'}
      onClose={onClose}
      maxW="max-w-md"
      footer={
        resultado ? (
          <>
            <Boton variante="neutral" icono="copiar" onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar credenciales'}
            </Boton>
            <Boton variante="exito" icono="check" onClick={onClose}>
              Listo
            </Boton>
          </>
        ) : (
          <>
            <Boton variante="neutral" onClick={onClose}>
              Cancelar
            </Boton>
            <Boton
              type="submit"
              form="form-reset-clave"
              variante="peligro"
              icono="llave"
              cargando={enviando}
            >
              Restablecer clave
            </Boton>
          </>
        )
      }
    >
      {resultado ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <Icono nombre="escudo" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Comparte estas credenciales por un medio seguro y pide a la persona que cambie la
              clave al iniciar sesión.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-2.5 dark:border-gray-800 dark:bg-gray-950/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Datos de acceso
              </p>
            </div>
            <div className="space-y-2.5 p-4">
              <div>
                <p className="text-[10px] font-bold text-gray-500">Usuario</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  {resultado.usuario.full_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500">Correo</p>
                <p className="break-all text-xs font-semibold text-gray-900 dark:text-white">
                  {resultado.usuario.email}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500">Contraseña temporal</p>
                <code className="mt-1 block break-all rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 font-mono text-sm font-bold tracking-wide text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200">
                  {resultado.clave}
                </code>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form id="form-reset-clave" onSubmit={restablecer} className="space-y-4">
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              La clave actual de <span className="font-bold">{usuario.full_name}</span> dejará de
              funcionar de inmediato.
            </p>
          </div>

          <Campo
            label="Nueva contraseña"
            required
            hint="Mínimo 8 caracteres. Puedes generarla o escribir una propia."
          >
            <CampoPassword
              value={clave}
              onChange={setClave}
              onGenerar={() => setClave(generarClaveSegura())}
              autoComplete="new-password"
              placeholder="Contraseña temporal"
            />
          </Campo>

          <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
            Al finalizar podrás copiar el correo y la clave para entregarlos de forma segura.
          </p>
        </form>
      )}
    </Modal>
  );
};

const TabCentroClaves = () => {
  const { usuario, esSuperusuario, puede } = useAuth();
  const toast = useToast();

  const puedeRestablecer = esSuperusuario || puede('seguridad.claves');

  const [propia, setPropia] = useState({ actual: '', nueva: '', confirmacion: '' });
  const [guardandoPropia, setGuardandoPropia] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [objetivo, setObjetivo] = useState(null);

  useEffect(() => {
    if (!puedeRestablecer) return undefined;

    let activo = true;
    setCargandoUsuarios(true);

    api.get('usuarios').then((res) => {
      if (!activo) return;
      if (res.success) {
        setUsuarios(res.datos || []);
      } else {
        toast.error(textoError(res.error, 'No se pudo cargar la lista de usuarios.'));
      }
      setCargandoUsuarios(false);
    });

    return () => {
      activo = false;
    };
  }, [puedeRestablecer, toast]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuarios;
    return usuarios.filter((item) => (
      item.full_name.toLowerCase().includes(termino)
      || item.email.toLowerCase().includes(termino)
    ));
  }, [usuarios, busqueda]);

  const generarPropia = () => {
    const clave = generarClaveSegura();
    setPropia({ actual: propia.actual, nueva: clave, confirmacion: clave });
  };

  const cambiarPropia = async (e) => {
    e.preventDefault();

    if (!propia.actual || !propia.nueva) {
      toast.error('Completa tu contraseña actual y la nueva.');
      return;
    }

    if (propia.nueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (propia.nueva !== propia.confirmacion) {
      toast.error('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setGuardandoPropia(true);
    const res = await api.post('seguridad/cambiar-password', {
      password_actual: propia.actual,
      password_nueva: propia.nueva,
      password_confirmacion: propia.confirmacion,
    });
    setGuardandoPropia(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo cambiar la contraseña.'));
      return;
    }

    toast.exito('Tu contraseña fue actualizada correctamente.');
    setPropia({ actual: '', nueva: '', confirmacion: '' });
  };

  const motivoBloqueo = (item) => {
    if (item.id === usuario?.id) return 'Usa el formulario "Mi contraseña" para tu propia cuenta.';
    if (Number(item.is_superuser) === 1 && !esSuperusuario) {
      return 'Solo un superusuario puede restablecer la clave de otro superusuario.';
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-black text-gray-900 dark:text-white">Centro de claves y seguridad</h2>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Protege tu cuenta y administra el restablecimiento de claves
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 px-5 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/15 text-sm font-black backdrop-blur">
                {iniciales(usuario?.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black">{usuario?.full_name}</p>
                <p className="truncate text-[10px] text-white/80">{usuario?.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                <Icono nombre={esSuperusuario ? 'escudo' : 'usuario'} className="h-3 w-3" />
                {usuario?.role_label || 'Sin rol'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Sesión activa
              </span>
            </div>
          </div>

          <div className="space-y-2.5 p-4">
            <div className="flex items-start gap-2 text-[10px] text-gray-600 dark:text-gray-400">
              <Icono nombre="correo" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="break-all">{usuario?.email}</span>
            </div>
            <div className="flex items-start gap-2 text-[10px] text-gray-600 dark:text-gray-400">
              <Icono nombre="refrescar" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>Último acceso: {formatearFecha(usuario?.last_login)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 p-4 dark:border-gray-800">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Recomendaciones
            </p>
            <ul className="mt-2 space-y-1.5">
              {[
                'No compartas tu contraseña con nadie.',
                'Usa una clave distinta para cada servicio.',
                'Cámbiala si sospechas que fue expuesta.',
              ].map((texto) => (
                <li key={texto} className="flex items-start gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                  <Icono nombre="check" className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Mi contraseña"
            description="Cambia la clave con la que inicias sesión en Mia's Store."
          />
          <CardBody>
            <form onSubmit={cambiarPropia} className="space-y-3.5">
              <Campo label="Contraseña actual" required>
                <CampoPassword
                  value={propia.actual}
                  onChange={(actual) => setPropia((prev) => ({ ...prev, actual }))}
                  autoComplete="current-password"
                  placeholder="Tu contraseña actual"
                />
              </Campo>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Campo label="Nueva contraseña" required hint="Mínimo 8 caracteres.">
                  <CampoPassword
                    value={propia.nueva}
                    onChange={(nueva) => setPropia((prev) => ({ ...prev, nueva }))}
                    onGenerar={generarPropia}
                    autoComplete="new-password"
                    placeholder="Nueva contraseña"
                  />
                </Campo>

                <Campo label="Confirmar nueva contraseña" required>
                  <CampoPassword
                    value={propia.confirmacion}
                    onChange={(confirmacion) => setPropia((prev) => ({ ...prev, confirmacion }))}
                    autoComplete="new-password"
                    placeholder="Repite la nueva contraseña"
                  />
                </Campo>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3.5 dark:border-gray-800">
                <Boton
                  variante="neutral"
                  icono="deshacer"
                  onClick={() => setPropia({ actual: '', nueva: '', confirmacion: '' })}
                  disabled={guardandoPropia}
                >
                  Limpiar
                </Boton>
                <Boton
                  type="submit"
                  variante="exito"
                  icono="guardar"
                  cargando={guardandoPropia}
                >
                  Actualizar mi clave
                </Boton>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {puedeRestablecer ? (
        <Card>
          <CardHeader
            title="Restablecer clave de otro usuario"
            description="Genera una clave temporal y entrégala por un medio seguro."
            action={
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Icono nombre="llave" className="h-3 w-3" />
                Acceso sensible
              </span>
            }
          />

          <CardBody className="space-y-3">
            <Buscador
              valor={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar usuario por nombre o correo..."
              className="max-w-md"
            />

            <div className="max-h-80 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-800">
              {cargandoUsuarios ? (
                <div className="flex items-center justify-center gap-2 p-8 text-[11px] text-gray-500">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500 dark:border-gray-600 dark:border-t-purple-400" />
                  Cargando usuarios...
                </div>
              ) : filtrados.length === 0 ? (
                <p className="p-8 text-center text-[11px] text-gray-500">
                  No hay usuarios que coincidan con la búsqueda.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {filtrados.map((item) => {
                    const esSuper = Number(item.is_superuser) === 1;
                    const bloqueo = motivoBloqueo(item);
                    const inactivo = Number(item.is_active) !== 1;

                    return (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-[11px] font-black text-white">
                            {iniciales(item.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                                {item.full_name}
                              </p>
                              {esSuper ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                                  <Icono nombre="escudo" className="h-2.5 w-2.5" />
                                  Superusuario
                                </span>
                              ) : null}
                              {inactivo ? (
                                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                                  Inactivo
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                              {item.email} · {item.role_label}
                            </p>
                          </div>
                        </div>

                        <Boton
                          tamano="sm"
                          variante="advertencia"
                          icono="llave"
                          disabled={Boolean(bloqueo)}
                          title={bloqueo || `Restablecer clave de ${item.full_name}`}
                          onClick={() => setObjetivo(item)}
                        >
                          Restablecer
                        </Boton>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="flex items-start gap-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
              <Icono nombre="candado" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              El restablecimiento invalida la clave anterior de inmediato. Solo un superusuario
              puede cambiar la clave de otro superusuario.
            </p>
          </CardBody>
        </Card>
      ) : null}

      {objetivo ? (
        <ModalResetClave usuario={objetivo} onClose={() => setObjetivo(null)} />
      ) : null}
    </div>
  );
};

export default TabCentroClaves;
