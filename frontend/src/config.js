const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_BASE = rawBase.replace(/\/$/, '');
export const API_URL = `${API_BASE}/index.php`;
export const CLIENTE_ID = Number(import.meta.env.VITE_CLIENTE_ID || 1);
