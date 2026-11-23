import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [puedeSeguridad, setPuedeSeguridad] = useState(false);
  const [cargando, setCargando] = useState(true);

  const aplicarSesion = useCallback((datos) => {
    const perfil = datos?.usuario || null;

    setUsuario(perfil);
    setPermisos(Array.isArray(datos?.permisos) ? datos.permisos : []);
    setPuedeSeguridad(Boolean(datos?.puede_seguridad));
    setCargando(false);
  }, []);

  const limpiarSesion = useCallback(() => aplicarSesion(null), [aplicarSesion]);

  const recargar = useCallback(async () => {
    const res = await api.get('auth/me');
    aplicarSesion(res.success ? res.datos : null);
  }, [aplicarSesion]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    const alExpirar = () => limpiarSesion();
    window.addEventListener('mias:sesion-expirada', alExpirar);
    return () => window.removeEventListener('mias:sesion-expirada', alExpirar);
  }, [limpiarSesion]);

  const login = useCallback(async (email, password) => {
    const res = await api.post('auth/login', { email, password });

    if (!res.success) {
      return {
        ok: false,
        error: res.error || 'Correo electrónico o contraseña incorrectos.',
      };
    }

    aplicarSesion(res.datos);
    return { ok: true };
  }, [aplicarSesion]);

  const logout = useCallback(async () => {
    await api.post('auth/logout', {});
    limpiarSesion();
  }, [limpiarSesion]);

  const puede = useCallback((codigo) => {
    if (!usuario) return false;
    if (Number(usuario.is_superuser) === 1) return true;
    return permisos.includes(codigo);
  }, [usuario, permisos]);

  const valor = useMemo(() => ({
    usuario,
    permisos,
    cargando,
    puede,
    puedeSeguridad,
    esSuperusuario: Number(usuario?.is_superuser) === 1,
    login,
    logout,
    recargar,
  }), [usuario, permisos, cargando, puede, puedeSeguridad, login, logout, recargar]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }
  return contexto;
};
