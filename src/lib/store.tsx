import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Encuentro, Estado } from './types';
import { nuevoId } from './formato';

const CLAVE = 'juntada:v1';

function estadoVacio(): Estado {
  return { version: 1, encuentroActivoId: null, encuentros: [] };
}

/** Campos de versiones anteriores que ya no se usan */
type EncuentroViejo = Encuentro & {
  tesoreroId?: string | null;
  compradorId?: string | null;
};

/**
 * Adapta datos guardados por versiones anteriores de la app:
 * - el antiguo "tesorero" o "comprador" pasa a ser quien maneja la plata;
 * - las compras sin persona se asignan a quien maneja la plata, y las
 *   observaciones se suman a la descripción;
 * - se descartan los pagos viejos entre personas.
 */
export function migrarEstado(estado: Estado): Estado {
  return {
    ...estado,
    encuentros: estado.encuentros.map((viejo: EncuentroViejo) => {
      const { tesoreroId, compradorId, ...e } = viejo;
      const administradorId = e.administradorId ?? compradorId ?? tesoreroId ?? null;
      const porDefecto = administradorId ?? e.personas[0]?.id ?? '';
      return {
        ...e,
        administradorId,
        compras: e.compras.map((c) => {
          const { observaciones, ...compra } = c as typeof c & { observaciones?: string };
          return {
            ...compra,
            personaId: compra.personaId ?? porDefecto,
            concepto: observaciones ? `${compra.concepto} · ${observaciones}` : compra.concepto,
          };
        }),
        pagos: (e.pagos ?? [])
          .filter((p) => typeof p.personaId === 'string' && !!p.metodo)
          .map((p) => ({ ...p, tipo: p.tipo ?? 'pago' })),
      };
    }),
  };
}

function cargar(): Estado {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return estadoVacio();
    const estado = JSON.parse(crudo) as Estado;
    if (estado?.version !== 1 || !Array.isArray(estado.encuentros)) return estadoVacio();
    return migrarEstado(estado);
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
    administradorId: null,
    foto: null,
    personas: [],
    comidas: [],
    compras: [],
    pagos: [],
  };
}

/** El encuentro abierto: el elegido, o si no hay, el primero sin archivar. */
function idActivo(e: Estado): string | null {
  if (e.encuentroActivoId && e.encuentros.some((x) => x.id === e.encuentroActivoId)) return e.encuentroActivoId;
  return e.encuentros.find((x) => !x.archivado)?.id ?? null;
}

interface Contexto {
  estado: Estado;
  encuentro: Encuentro | null;
  /** Modifica el encuentro activo. La función recibe una copia que puede mutar. */
  actualizar: (cambio: (e: Encuentro) => void) => void;
  agregarEncuentro: (e: Encuentro) => void;
  eliminarEncuentro: (id: string) => void;
  /** Archiva (oculta de la lista) o desarchiva un encuentro. Si se archiva el abierto, se cierra. */
  archivarEncuentro: (id: string, archivar: boolean) => void;
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

  const encuentro = estado.encuentros.find((e) => e.id === idActivo(estado)) ?? null;

  const actualizar = useCallback(
    (cambio: (e: Encuentro) => void) => {
      setEstado((prev) => {
        const activoId = idActivo(prev);
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
    setEstado((prev) => ({
      ...prev,
      encuentros: prev.encuentros.filter((e) => e.id !== id),
      encuentroActivoId: prev.encuentroActivoId === id ? null : prev.encuentroActivoId,
    }));
  }, []);

  const archivarEncuentro = useCallback((id: string, archivar: boolean) => {
    setEstado((prev) => ({
      ...prev,
      encuentros: prev.encuentros.map((e) => (e.id === id ? { ...e, archivado: archivar } : e)),
      encuentroActivoId: archivar && idActivo(prev) === id ? null : prev.encuentroActivoId,
    }));
  }, []);

  const activar = useCallback((id: string) => {
    setEstado((prev) => ({ ...prev, encuentroActivoId: id }));
  }, []);

  const reemplazarTodo = useCallback((e: Estado) => setEstado(e), []);

  return (
    <StoreContext.Provider
      value={{
        estado,
        encuentro,
        actualizar,
        agregarEncuentro,
        eliminarEncuentro,
        archivarEncuentro,
        activar,
        reemplazarTodo,
        errorGuardado,
      }}
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
