import { useEffect, useState } from 'react';

const MAX = 6;
const PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

const DropzoneImagen = ({ imagenesActuales = [], onNuevosChange, onEliminarExistente, max = MAX }) => {
  const [nuevos, setNuevos] = useState([]); // { file, preview }

  useEffect(() => () => { nuevos.forEach((n) => URL.revokeObjectURL(n.preview)); }, [nuevos]);

  const totalActuales = imagenesActuales.length;
  const cupo = Math.max(0, max - totalActuales - nuevos.length);

  const agregar = (files) => {
    const lista = Array.from(files || []);
    const aceptados = [];
    for (const file of lista) {
      if (aceptados.length >= cupo) break;
      if (!PERMITIDOS.includes(file.type)) { alert('Solo se permiten imágenes JPG, PNG o WEBP'); continue; }
      if (file.size > 2 * 1024 * 1024) { alert(`"${file.name}" supera el límite de 2 MB`); continue; }
      aceptados.push({ file, preview: URL.createObjectURL(file) });
    }
    if (!aceptados.length) return;
    const next = [...nuevos, ...aceptados];
    setNuevos(next);
    onNuevosChange?.(next.map((n) => n.file));
  };

  const quitarNuevo = (idx) => {
    const next = nuevos.filter((_, i) => i !== idx);
    setNuevos(next);
    onNuevosChange?.(next.map((n) => n.file));
  };

  return (
    <div
      className="space-y-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (cupo > 0) agregar(e.dataTransfer.files); }}
    >
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {imagenesActuales.map((img) => (
          <div key={`ex-${img.id}`} className="relative group rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden aspect-square">
            <img src={img.url || `http://localhost:8000/imagenes/${img.imagen}`} alt="producto" className="w-full h-full object-contain" />
            <button type="button" onClick={() => onEliminarExistente?.(img.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] leading-none opacity-90 hover:opacity-100">✕</button>
          </div>
        ))}
        {nuevos.map((n, idx) => (
          <div key={`new-${idx}`} className="relative group rounded-lg border border-emerald-300 dark:border-emerald-700 bg-gray-100 dark:bg-gray-900 overflow-hidden aspect-square">
            <img src={n.preview} alt="nueva" className="w-full h-full object-contain" />
            <button type="button" onClick={() => quitarNuevo(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] leading-none opacity-90 hover:opacity-100">✕</button>
            <span className="absolute bottom-0 inset-x-0 text-[9px] text-center bg-emerald-600/80 text-white">Nueva</span>
          </div>
        ))}
        {cupo > 0 && (
          <label className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 dark:border-gray-700 dark:hover:border-purple-400 bg-gray-50 dark:bg-gray-950 cursor-pointer aspect-square transition-colors text-gray-500 dark:text-gray-400">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => { agregar(e.target.files); e.target.value = ''; }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <span className="text-xl leading-none">+</span>
            <span className="text-[10px] mt-1">Agregar</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-600">{totalActuales + nuevos.length}/{max}</span>
          </label>
        )}
      </div>
      <div className="text-[10px] text-gray-400 dark:text-gray-600">JPG · PNG · WEBP · máx 2 MB · {totalActuales + nuevos.length}/{max}{cupo <= 0 ? ' · Máximo alcanzado' : ''}</div>
    </div>
  );
};

export default DropzoneImagen;
