// Capa de red: unico punto de contacto con la API PHP de Damasco.
// Convencion: index.php?url=recurso
const API_BASE = 'http://localhost:8000/index.php?url=';

export const api = {
  // GET: colecciones o un registro por ID (acepta query string de filtros)
  get: async (recurso, params = '') => {
    const url = `${API_BASE}${recurso}${params ? '&' + params : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  // POST: crear registro con payload JSON
  post: async (recurso, datos) => {
    const res = await fetch(`${API_BASE}${recurso}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  // PUT: actualizar (parcial) un registro por ID
  put: async (recurso, id, datos) => {
    const res = await fetch(`${API_BASE}${recurso}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    return res.json();
  },

  // DELETE: borrado logico por ID
  delete: async (recurso, id) => {
    const res = await fetch(`${API_BASE}${recurso}/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // POST multipart: subir imagen a un producto
  subirImagen: async (recurso, id, archivo) => {
    const form = new FormData();
    form.append('imagen', archivo); // debe coincidir con $_FILES['imagen']
    const res = await fetch(`${API_BASE}${recurso}/${id}/imagen`, {
      method: 'POST',
      // NO poner Content-Type: el navegador agrega el boundary automaticamente
      body: form,
    });
    return res.json();
  },
};
