import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import Boton from '../ui/Boton';
import CampoPassword from '../ui/CampoPassword';
import { Campo, Input } from '../ui/Campo';
import Icono from '../ui/Icono';

const iniciales = (nombre = '') => {
  const partes = String(nombre).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return partes.map((parte) => parte[0]?.toUpperCase() || '').join('') || 'MS';
};

const Login = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [empresa, setEmpresa] = useState(null);

  useEffect(() => {
    api.get('empresa').then((res) => {
      if (res?.success) setEmpresa(res.datos || null);
    }).catch(() => {});
  }, []);

  const nombreEmpresa = empresa?.nombre_comercial || empresa?.razon_social || "Mia's Store";
  const logoEmpresa = empresa?.logo_url || empresa?.logo || null;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Ingresa tu correo electrónico y tu contraseña.');
      return;
    }

    setEnviando(true);
    const resultado = await login(email, password);
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.error);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-100 px-4 py-10 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl dark:bg-pink-500/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-purple-300/40 blur-3xl dark:bg-purple-500/10" />

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white/85 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur hover:bg-white dark:border-gray-700 dark:bg-gray-900/85 dark:text-gray-200 dark:hover:bg-gray-800"
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        <Icono nombre={isDark ? 'sol' : 'luna'} className="h-4 w-4" />
        <span className="hidden sm:inline">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-purple-200/70 bg-white/95 p-7 shadow-2xl shadow-purple-500/10 backdrop-blur sm:p-9 dark:border-purple-900/50 dark:bg-gray-900/95">
          <div className="mb-7 flex flex-col items-center text-center">
            {logoEmpresa ? (
              <img
                src={logoEmpresa}
                alt={nombreEmpresa}
                className="h-16 w-16 rounded-2xl object-contain bg-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-200/60 dark:bg-gray-800 dark:ring-purple-500/20"
              />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 text-lg font-black text-white shadow-lg shadow-purple-500/30">
                {iniciales(nombreEmpresa)}
              </div>
            )}
            <h1 className="mt-4 text-2xl font-black text-gray-900 dark:text-white">{nombreEmpresa}</h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Panel administrativo · Acceso seguro
            </p>
          </div>

          <form onSubmit={enviar} className="space-y-4">
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              >
                <Icono nombre="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Campo label="Correo electrónico" required>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <Icono nombre="correo" className="h-4 w-4" />
                </span>
                <Input
                  type="email"
                  autoFocus
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="pl-9"
                />
              </div>
            </Campo>

            <Campo label="Contraseña" required>
              <CampoPassword
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                required
              />
            </Campo>

            <Boton
              type="submit"
              variante="primario"
              tamano="lg"
              icono="poder"
              cargando={enviando}
              className="w-full"
            >
              {enviando ? 'Verificando...' : 'Iniciar sesión'}
            </Boton>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50/70 p-3 text-[10px] leading-relaxed text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
            <Icono nombre="escudo" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Sesión protegida con cookie HttpOnly. Si olvidaste tu clave, pide a un superusuario
              que la restablezca.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[10px] text-gray-500 dark:text-gray-500">
          {nombreEmpresa} · Gestión de inventario y tienda
        </p>
      </div>
    </div>
  );
};

export default Login;
