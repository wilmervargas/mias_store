import { useEffect, useState } from 'react';

let cache = null;
let inflight = null;

const API = `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000/index.php?url=empresa`;

export function useEmpresa() {
  const [empresa, setEmpresa] = useState(cache);

  useEffect(() => {
    if (cache) { setEmpresa(cache); return; }
    if (!inflight) {
      inflight = fetch(API)
        .then((r) => r.json())
        .then((d) => {
          cache = d?.success ? d.datos : null;
          return cache;
        })
        .catch(() => null)
        .finally(() => { inflight = null; });
    }
    inflight.then((d) => { if (d) setEmpresa(d); });
  }, []);

  return empresa;
}

export function nombreEmpresa(empresa) {
  return empresa?.nombre_comercial || empresa?.razon_social || 'Empresa';
}
