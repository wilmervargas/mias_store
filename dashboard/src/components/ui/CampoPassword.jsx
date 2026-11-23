import { useState } from 'react';
import Icono from './Icono';
import Boton from './Boton';
import { inputClass } from './Campo';

const CampoPassword = ({
  value,
  onChange,
  onGenerar,
  placeholder = '••••••••',
  autoComplete = 'new-password',
  required = false,
  disabled = false,
  name,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-stretch ${className}`}>
      <div className="relative min-w-0 flex-1">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          name={name}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icono nombre={visible ? 'ojoOff' : 'ojo'} className="h-4 w-4" />
        </button>
      </div>

      {onGenerar ? (
        <Boton
          variante="info"
          icono="llave"
          onClick={onGenerar}
          disabled={disabled}
          className="shrink-0"
          title="Generar una clave segura"
        >
          <span className="hidden sm:inline">Generar</span>
        </Boton>
      ) : null}
    </div>
  );
};

export default CampoPassword;
