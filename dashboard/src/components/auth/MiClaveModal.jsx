import { useState } from 'react';
import { api } from '../../services/api';
import { generarClaveSegura } from '../../utils/claves';
import { useToast } from '../ui/ToastProvider';
import Modal from '../ui/Modal';
import Boton from '../ui/Boton';
import { Campo } from '../ui/Campo';
import CampoPassword from '../ui/CampoPassword';

const textoError = (error, respaldo) => {
  if (Array.isArray(error)) return error.join(' ');
  return error || respaldo;
};

const MiClaveModal = ({ onClose }) => {
  const toast = useToast();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const generar = () => {
    const clave = generarClaveSegura();
    setNueva(clave);
    setConfirmacion(clave);
  };

  const guardar = async (e) => {
    e.preventDefault();

    if (!actual || !nueva) {
      toast.error('Completa todos los campos.');
      return;
    }

    if (nueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nueva !== confirmacion) {
      toast.error('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setGuardando(true);
    const res = await api.post('seguridad/cambiar-password', {
      password_actual: actual,
      password_nueva: nueva,
      password_confirmacion: confirmacion,
    });
    setGuardando(false);

    if (!res.success) {
      toast.error(textoError(res.error, 'No se pudo cambiar la contraseña.'));
      return;
    }

    toast.exito('Tu contraseña fue actualizada correctamente.');
    onClose();
  };

  return (
    <Modal
      titulo="Cambiar mi contraseña"
      subtitulo="Actualiza la clave de tu propia cuenta"
      icono="llave"
      tono="info"
      onClose={onClose}
      maxW="max-w-md"
      footer={
        <>
          <Boton variante="neutral" onClick={onClose}>Cancelar</Boton>
          <Boton
            type="submit"
            form="form-mi-clave"
            variante="exito"
            icono="guardar"
            cargando={guardando}
          >
            Guardar clave
          </Boton>
        </>
      }
    >
      <form id="form-mi-clave" onSubmit={guardar} className="space-y-4">
        <Campo label="Contraseña actual" required>
          <CampoPassword
            value={actual}
            onChange={setActual}
            autoComplete="current-password"
            placeholder="Tu contraseña actual"
          />
        </Campo>

        <Campo label="Nueva contraseña" required hint="Mínimo 8 caracteres.">
          <CampoPassword
            value={nueva}
            onChange={setNueva}
            onGenerar={generar}
            placeholder="Nueva contraseña"
          />
        </Campo>

        <Campo label="Confirmar nueva contraseña" required>
          <CampoPassword
            value={confirmacion}
            onChange={setConfirmacion}
            placeholder="Repite la nueva contraseña"
          />
        </Campo>
      </form>
    </Modal>
  );
};

export default MiClaveModal;
