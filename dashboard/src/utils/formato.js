export function fmtNumero(valor, decimales = 0) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(n);
}

export function fmtDecimal(valor, decimales = 2) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return fmtNumero(0, decimales);
  return fmtNumero(n, decimales);
}

export function fmtMoneda(valor, simbolo = 'Bs') {
  return `${simbolo} ${fmtDecimal(valor, 2)}`;
}
