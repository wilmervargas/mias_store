const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const NUMEROS = '23456789';
const SIMBOLOS = '!@#$%*_-+?';
const TODOS = MAYUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;

const aleatorio = (maximo) => {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const bytes = new Uint32Array(1);
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] % maximo;
  }
  return Math.floor(Math.random() * maximo);
};

/** Genera una clave de 14 caracteres con mayusculas, minusculas, numeros y simbolos. */
export const generarClaveSegura = (longitud = 14) => {
  const clave = [
    MAYUSCULAS[aleatorio(MAYUSCULAS.length)],
    MINUSCULAS[aleatorio(MINUSCULAS.length)],
    NUMEROS[aleatorio(NUMEROS.length)],
    SIMBOLOS[aleatorio(SIMBOLOS.length)],
  ];

  while (clave.length < Math.max(8, longitud)) {
    clave.push(TODOS[aleatorio(TODOS.length)]);
  }

  for (let i = clave.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [clave[i], clave[j]] = [clave[j], clave[i]];
  }

  return clave.join('');
};

/** Copia texto al portapapeles con respaldo para navegadores restrictivos. */
export const copiarTexto = async (texto) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Se intenta el respaldo con execCommand.
  }

  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copiado = document.execCommand('copy');
    document.body.removeChild(area);
    return copiado;
  } catch {
    return false;
  }
};
