import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../services/api';

let empresaCache = null;
let empresaPromise = null;

const limpiar = (v) => (v === null || v === undefined ? '' : String(v));

async function obtenerEmpresa() {
  if (empresaCache) return empresaCache;
  if (!empresaPromise) {
    empresaPromise = api.get('empresa').then((r) => {
      empresaCache = r?.success ? (r.datos || {}) : {};
      return empresaCache;
    }).catch(() => (empresaCache = {}));
  }
  return empresaPromise;
}

function resolverLogoUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return null;
  if (/^data:image\//i.test(v)) return v;
  if (/^https?:\/\//i.test(v)) return v;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  if (v.startsWith('/')) return `http://${host}:8000${v}`;
  // filename or relative path like imagenes/...
  const clean = v.replace(/^imagenes[\\/]/i, '');
  return `http://${host}:8000/imagenes/${encodeURIComponent(clean)}`;
}

async function fetchComoBlob(url) {
  if (!url) return null;
  if (/^data:image\//i.test(url)) {
    try { const r = await fetch(url); return r.ok ? await r.blob() : null; } catch { return null; }
  }
  for (const credentials of ['omit', 'include']) {
    try {
      const res = await fetch(url, { credentials, cache: 'no-store' });
      if (res.ok) return await res.blob();
    } catch {}
  }
  return null;
}

async function blobAPngDataUrl(blob) {
  if (!blob) return null;
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
  if (!dataUrl) return null;
  // normalizar a PNG para compatibilidad con jsPDF/exceljs
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 200;
    canvas.height = img.naturalHeight || img.height || 200;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return dataUrl;
  }
}

async function cargarLogoDataUrl(raw) {
  const url = resolverLogoUrl(raw);
  const blob = await fetchComoBlob(url);
  return blobAPngDataUrl(blob);
}

async function cargarLogoBuffer(raw) {
  const dataUrl = await cargarLogoDataUrl(raw);
  if (!dataUrl) return null;
  try {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    return { buffer: buf, extension: 'png' };
  } catch { return null; }
}

function nombreEmpresa(e) { return e?.nombre_comercial || e?.razon_social || "Mia's Store"; }
function lineaFiltros(filtros = []) {
  if (!filtros.length) return 'Filtros: Sin filtros adicionales';
  return 'Filtros: ' + filtros.map((f) => `${f.label}: ${limpiar(f.value)}`).join('  ·  ');
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportarExcel({ nombre = 'reporte', hoja = 'Datos', titulo = 'Reporte', filtros = [], columnas = [], filas = [] }) {
  const emp = await obtenerEmpresa();
  const empNombre = nombreEmpresa(emp);
  const empRif = emp?.rif ? `RIF: ${emp.rif}` : 'RIF: —';
  const fecha = new Date().toLocaleString('es-VE');
  const totalCols = Math.max(columnas.length, 1);

  const wb = new ExcelJS.Workbook();
  wb.creator = empNombre;
  wb.created = new Date();
  const ws = wb.addWorksheet((hoja || 'Datos').slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 7 }],
    pageSetup: { fitToPage: true, fitToWidth: 1, orientation: 'landscape' },
  });

  ws.columns = columnas.map((c) => ({ width: Math.max(14, String(c.header || '').length + 4) }));

  // logo (best effort) - esquina superior izquierda como en PDF
  let logoCols = 0;
  try {
    const logo = await cargarLogoBuffer(emp?.logo_data_url || emp?.logo_url || emp?.logo);
    if (logo) {
      ws.getColumn(1).width = Math.max(ws.getColumn(1).width || 12, 14);
      ws.getRow(1).height = 34;
      ws.getRow(2).height = 20;
      const imgId = wb.addImage({ buffer: logo.buffer, extension: logo.extension });
      ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 58 } });
      logoCols = 1;
    }
  } catch {}

  const startCol = logoCols ? 2 : 1;
  const mergeSafe = (r) => { if (startCol <= totalCols) ws.mergeCells(r, startCol, r, totalCols); };

  // Row 1: empresa
  mergeSafe(1);
  const r1 = ws.getCell(1, startCol);
  r1.value = empNombre;
  r1.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1E293B' } };
  r1.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = Math.max(ws.getRow(1).height || 0, 28);

  // Row 2: RIF
  mergeSafe(2);
  const r2 = ws.getCell(2, startCol);
  r2.value = empRif;
  r2.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
  r2.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 3: titulo
  mergeSafe(3);
  const r3 = ws.getCell(3, startCol);
  r3.value = titulo;
  r3.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFBE123C' } };
  r3.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(3).height = 22;

  // Row 4: generado
  mergeSafe(4);
  const r4 = ws.getCell(4, startCol);
  r4.value = `Generado: ${fecha}   ·   Registros: ${filas.length}`;
  r4.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' } };
  r4.alignment = { vertical: 'middle', horizontal: 'left' };

  // Row 5: filtros
  mergeSafe(5);
  const r5 = ws.getCell(5, startCol);
  r5.value = lineaFiltros(filtros);
  r5.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  r5.alignment = { vertical: 'middle', horizontal: 'left' };

  ws.getRow(6).height = 6;

  // Row 7: headers
  const headerRow = ws.getRow(7);
  headerRow.height = 24;
  columnas.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF1E293B' } },
      bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Data
  filas.forEach((fila, idx) => {
    const row = ws.getRow(8 + idx);
    row.height = 20;
    const zebra = idx % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF';
    columnas.forEach((c, i) => {
      const val = typeof c.valor === 'function' ? c.valor(fila) : fila[c.key];
      const cell = row.getCell(i + 1);
      cell.value = val === null || val === undefined ? '' : val;
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // auto width
  columnas.forEach((c, i) => {
    let max = String(c.header || '').length;
    filas.slice(0, 150).forEach((fila) => {
      const val = typeof c.valor === 'function' ? c.valor(fila) : fila[c.key];
      max = Math.max(max, limpiar(val).length);
    });
    ws.getColumn(i + 1).width = Math.min(42, Math.max(12, max + 3));
  });

  // logo ya insertado en cabecera

  const buffer = await wb.xlsx.writeBuffer();
  descargarBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${nombre}.xlsx`);
}

export async function exportarPDF({ nombre = 'reporte', titulo = 'Reporte', filtros = [], columnas = [], filas = [], orientacion = 'landscape' }) {
  const emp = await obtenerEmpresa();
  const logo = await cargarLogoDataUrl(emp?.logo_data_url || emp?.logo_url || emp?.logo);
  const doc = new jsPDF({ orientation: orientacion, unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const fecha = new Date().toLocaleString('es-VE');
  const empNombre = nombreEmpresa(emp);
  const empRif = emp?.rif ? `RIF: ${emp.rif}` : 'RIF: —';

  const drawHeader = () => {
    // subtle top accent
    doc.setFillColor(190, 18, 60);
    doc.rect(0, 0, pageW, 4, 'F');

    let x = margin;
    if (logo) {
      try { doc.addImage(logo, 'PNG', margin, 14, 40, 40, undefined, 'FAST'); }
      catch { try { doc.addImage(logo, 'JPEG', margin, 14, 40, 40, undefined, 'FAST'); } catch {} }
      x = margin + 50;
    }
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(empNombre, x, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(empRif, x, 41);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(titulo, margin, 72);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${fecha}   ·   Registros: ${filas.length}`, margin, 86);
    const lf = lineaFiltros(filtros);
    const split = doc.splitTextToSize(lf, pageW - margin * 2);
    doc.text(split, margin, 98);
    const y = 98 + split.length * 10 + 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageW - margin, y);
    return y + 10;
  };

  const tableStartY = drawHeader();
  const head = [columnas.map((c) => c.header)];
  const body = filas.map((fila) => columnas.map((c) => limpiar(typeof c.valor === 'function' ? c.valor(fila) : fila[c.key])));

  autoTable(doc, {
    startY: tableStartY,
    head,
    body,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 4, overflow: 'linebreak', lineColor: [226, 232, 240], lineWidth: 0.5, textColor: [15, 23, 42], valign: 'middle' },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5, halign: 'left', lineColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    bodyStyles: { fillColor: [255, 255, 255] },
    margin: { left: margin, right: margin, top: 70, bottom: 42 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader();
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageH - 28, pageW - margin, pageH - 28);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`${empNombre}  ·  ${empRif}`, margin, pageH - 16);
    },
  });

  // page numbers total
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - 16, { align: 'right' });
  }

  doc.save(`${nombre}.pdf`);
}
