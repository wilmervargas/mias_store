import { useState } from 'react';

const DropzoneImagen = ({ imagenActual, onArchivo }) => {
  const [preview, setPreview] = useState(
    imagenActual ? `http://localhost:8000/imagenes/${imagenActual}` : null
  );

  const validar = (file) => {
    if (!file) return;
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!permitidos.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen supera el límite de 2 MB');
      return;
    }
<<<<<<< HEAD
    setPreview(URL.createObjectURL(file));
=======
    setPreview(URL.createObjectURL(file)); // previsualización inmediata
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    onArchivo(file);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); validar(e.dataTransfer.files[0]); }}
<<<<<<< HEAD
      className="relative w-full h-40 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 dark:border-slate-700 dark:hover:border-indigo-400 dark:bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer transition-colors"
=======
      className="relative w-full h-40 rounded-2xl border-2 border-dashed border-slate-700 hover:border-rose-500 bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer transition-colors"
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => validar(e.target.files[0])}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      {preview ? (
        <img src={preview} alt="preview" className="h-full w-full object-contain" />
      ) : (
<<<<<<< HEAD
        <div className="text-center text-slate-500 dark:text-slate-400 text-xs px-4">
          <div className="text-2xl mb-1">🖼️</div>
          Arrastra una imagen o haz clic para elegir
          <div className="text-[10px] mt-1 text-slate-400 dark:text-slate-600">JPG · PNG · WEBP · máx 2 MB</div>
=======
        <div className="text-center text-slate-500 text-xs px-4">
          <div className="text-2xl mb-1">🖼️</div>
          Arrastra una imagen o haz clic para elegir
          <div className="text-[10px] mt-1 text-slate-600">JPG · PNG · WEBP · máx 2 MB</div>
>>>>>>> 4ed4c0d49af456511b2496f12b1325281837eab9
        </div>
      )}
    </div>
  );
};

export default DropzoneImagen;
