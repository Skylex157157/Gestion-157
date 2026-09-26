import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Encuentro, Estado } from './types';
import { nuevoId } from './formato';

const CLAVE = 'juntada:v1';

function estadoVacio(): Estado {
  return { version: 1, encuentroActivoId: null, encuentros: [] };
}

function cargar(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoVacio();
    const estado = JSON.parse(crudo) as Estado;
    if (estado?.version !== 1 || !Array.isArray(estado.encuentros)) return estadoVacio();
    return estado;
  } catch {
    return estadoVacio();
  }
}

export function encuentroNuevo(nombre: string, fechaInicio: string, fechaFin: string): Encuentro {
  return {
    id: nuevoId(),
    nombre,
    fechaInicio,
    fechaFin,
    redondeo: 1000,
    tesoreroId: null,
    foto: null,
    personas: [],
    comidas: [],
    compras: [],
    pagos: [],
  };
}

interface Contexto {
  estado: Estado;
  encuentro: Encuentro | null;
  /** Modifica el encuentro activo. La función recibe una copia que puede mutar. */
  actualizar: (cambio: (e: Encuentro) => void) => void;
  agregarEncuentro: (e: Encuentro) => void;
  eliminarEncuentro: (id: string) => void;
  activar: (id: string) => void;
  reemplazarTodo: (e: Estado) => void;
  errorGuardado: string | null;
}

const StoreContext = createContext<Contexto | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(cargar);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
      setErrorGuardado(null);
    } catch {
      setErrorGuardado(
        'No se pudieron guardar los cambios en este teléfono (¿memoria llena?). Probá quitar la foto de portada o exportar una copia.',
      );
    }
  }, [estado]);

  const encuentro =
    estado.encuentros.find((e) => e.id === estado.encuentroActivoId) ?? estado.encuentros[0] ?? null;

  const actualizar = useCallback(
    (cambio: (e: Encuentro) => void) => {
      setEstado((prev) => {
        const activoId = prev.encuentroActivoId ?? prev.encuentros[0]?.id;
        return {
          ...prev,
          encuentros: prev.encuentros.map((e) => {
            if (e.id !== activoId) return e;
            const copia = structuredClone(e);
            cambio(copia);
            return copia;
          }),
        };
      });
    },
    [],
  );

  const agregarEncuentro = useCallback((e: Encuentro) => {
    setEstado((prev) => ({ ...prev, encuentros: [...prev.encuentros, e], encuentroActivoId: e.id }));
  }, []);

  const eliminarEncuentro = useCallback((id: string) => {
    setEstado((prev) => {
      const encuentros = prev.encuentros.filter((e) => e.id !== id);
      return {
        ...prev,
        encuentros,
        encuentroActivoId: prev.encuentroActivoId === id ? (encuentros[0]?.id ?? null) : prev.encuentroActivoId,
      };
    });
  }, []);

  const activar = useCallback((id: string) => {
    setEstado((prev) => ({ ...prev, encuentroActivoId: id }));
  }, []);

  const reemplazarTodo = useCallback((e: Estado) => setEstado(e), []);

  return (
    <StoreContext.Provider
      value={{ estado, encuentro, actualizar, agregarEncuentro, eliminarEncuentro, activar, reemplazarTodo, errorGuardado }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): Contexto {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  return ctx;
}

/** Para las pantallas que solo tienen sentido con un encuentro activo. */
export function useEncuentro() {
  const ctx = useStore();
  if (!ctx.encuentro) throw new Error('No hay encuentro activo');
  return { ...ctx, encuentro: ctx.encuentro };
}
