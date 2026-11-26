// Capa de red: unico punto de contacto con la API PHP de Mia's Store.
// Convencion: index.php?url=recurso
const obtenerHostApi = () => {
  if (typeof window === 'undefined' || !window.location?.hostname) return 'localhost';
  const host = window.location.hostname;
  return host.includes(':') ? `[${host}]` : host;
};

const API_BASE = `http://${obtenerHostApi()}:8000/index.php?url=`;

const leerRespuesta = async (res) => {
  let texto = '';
  try {
    texto = await res.text();
  } catch {
    return { success: false, error: 'No se pudo leer la respuesta del servidor' };
  }

  try {
    return JSON.parse(texto);
  } catch {
    return {
      success: false,
      error: `Respuesta invalida del servidor (HTTP ${res.status})`,
    };
  }
};

const pedir = async (url, opciones = {}) => {
  try {
    const res = await fetch(url, { credentials: 'include', ...opciones });

    // Sesion expirada o cuenta desactivada: el AuthContext vuelve al login.
    if (res.status === 401 && !url.includes('auth/login')) {
      window.dispatchEvent(new CustomEvent('mias:sesion-expirada'));
    }

    return await leerRespuesta(res);
  } catch {
    return {
      success: false,
      error: 'No se pudo conectar con el servidor. Verifica que el backend PHP este activo.',
    };
  }
};

export const api = {
  // GET: colecciones o un registro por ID (acepta query string de filtros)
  get: (recurso, params = '') =>
    pedir(`${API_BASE}${recurso}${params ? '&' + params : ''}`),

  // POST: crear registro con payload JSON
  post: (recurso, datos) =>
    pedir(`${API_BASE}${recurso}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos ?? {}),
    }),

  // PUT: actualizar (parcial) un registro por ID
  put: (recurso, id, datos) =>
    pedir(`${API_BASE}${recurso}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos ?? {}),
    }),

  // DELETE: borrado logico por ID. Con params="fisico=1" hace borrado fisico.
  delete: (recurso, id, params = '') =>
    pedir(`${API_BASE}${recurso}/${id}${params ? '&' + params : ''}`, { method: 'DELETE' }),

  // POST multipart: subir imagen a un producto
  subirImagen: async (recurso, id, archivo) => {
    const form = new FormData();
    form.append('imagen', archivo); // debe coincidir con $_FILES['imagen']
    return pedir(`${API_BASE}${recurso}/${id}/imagen`, {
      method: 'POST',
      // NO poner Content-Type: el navegador agrega el boundary automaticamente
      body: form,
    });
  },

  subirImagenes: async (recurso, id, archivos = []) => {
    const form = new FormData();
    archivos.forEach((a) => form.append('imagenes[]', a));
    return pedir(`${API_BASE}${recurso}/${id}/imagenes`, {
      method: 'POST',
      body: form,
    });
  },
};
