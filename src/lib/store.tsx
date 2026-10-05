import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Encuentro, Estado } from './types';
import { iguales, nuevoId } from './formato';
import { NUBE_DISPONIBLE } from './nubeConfig';
import type { CambioRemoto } from './nube';

type ModuloNube = typeof import('./nube');
let nube: Promise<ModuloNube> | null = null;
/** Carga la parte de la nube solo cuando hace falta (es pesada y la mayoría de los encuentros no se comparten). */
export function cargarNube(): Promise<ModuloNube> | null {
  if (!NUBE_DISPONIBLE) return null;
  nube ??= import('./nube');
  return nube;
}

/** Código largo y al azar: es lo que hace falta conocer para entrar a un encuentro compartido. */
function idSeguro(): string {
  const letras = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const azar = crypto.getRandomValues(new Uint8Array(22));
  return Array.from(azar, (n) => letras[n % letras.length]).join('');
}

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
  /** Empieza a compartir un encuentro: lo sube a la nube y devuelve su código (cambia su id). */
  compartirEncuentro: (id: string) => string | null;
  /** Deja de sincronizar un encuentro: queda solo en este teléfono, como estaba. */
  dejarDeCompartir: (id: string) => void;
  errorGuardado: string | null;
}

const StoreContext = createContext<Contexto | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(cargar);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  // Copia siempre al día del estado, para calcular los cambios fuera de React y mandarlos a la nube
  const ref = useRef(estado);
  const cambiarEstado = useCallback((cambio: (prev: Estado) => Estado) => {
    const nuevo = cambio(ref.current);
    if (nuevo === ref.current) return;
    ref.current = nuevo;
    setEstado(nuevo);
  }, []);

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
      const prev = ref.current;
      const viejo = prev.encuentros.find((e) => e.id === idActivo(prev));
      if (!viejo) return;
      const copia = structuredClone(viejo);
      cambio(copia);
      cambiarEstado((p) => ({ ...p, encuentros: p.encuentros.map((e) => (e.id === viejo.id ? copia : e)) }));
      if (viejo.compartido) cargarNube()?.then((n) => n.guardarCambios(viejo, copia));
    },
    [cambiarEstado],
  );

  /** Mezcla en el encuentro lo que llegó de la nube (solo si algo cambió de verdad). */
  const aplicarRemoto = useCallback(
    (id: string, cambio: CambioRemoto) => {
      cambiarEstado((prev) => {
        const e = prev.encuentros.find((x) => x.id === id);
        if (!e) return prev;
        const distinto = (Object.keys(cambio) as (keyof CambioRemoto)[]).some((k) => !iguales(e[k], cambio[k]));
        if (!distinto) return prev;
        return { ...prev, encuentros: prev.encuentros.map((x) => (x.id === id ? { ...x, ...cambio } : x)) };
      });
    },
    [cambiarEstado],
  );

  // Escucha los encuentros compartidos de este teléfono
  const compartidos = estado.encuentros
    .filter((e) => e.compartido)
    .map((e) => e.id)
    .join(',');
  useEffect(() => {
    const cargando = compartidos ? cargarNube() : null;
    if (!cargando) return;
    let activo = true;
    let bajas: (() => void)[] = [];
    cargando.then((n) => {
      if (!activo) return;
      bajas = compartidos.split(',').map((id) => n.escucharEncuentro(id, (c) => aplicarRemoto(id, c)));
    });
    return () => {
      activo = false;
      bajas.forEach((b) => b());
    };
  }, [compartidos, aplicarRemoto]);

  const compartirEncuentro = useCallback(
    (id: string) => {
      const original = ref.current.encuentros.find((e) => e.id === id);
      const cargando = cargarNube();
      if (!original || !cargando) return null;
      const compartido: Encuentro = { ...structuredClone(original), id: idSeguro(), compartido: true };
      cargando.then((n) => n.subirEncuentro(compartido)).catch(() => {});
      cambiarEstado((prev) => ({
        ...prev,
        encuentros: prev.encuentros.map((e) => (e.id === id ? compartido : e)),
        encuentroActivoId: prev.encuentroActivoId === id ? compartido.id : prev.encuentroActivoId,
      }));
      return compartido.id;
    },
    [cambiarEstado],
  );

  const dejarDeCompartir = useCallback(
    (id: string) => {
      cambiarEstado((prev) => ({
        ...prev,
        encuentros: prev.encuentros.map((e) => (e.id === id ? { ...e, compartido: false } : e)),
      }));
    },
    [cambiarEstado],
  );

  const agregarEncuentro = useCallback(
    (e: Encuentro) => {
      cambiarEstado((prev) => ({ ...prev, encuentros: [...prev.encuentros, e], encuentroActivoId: e.id }));
    },
    [cambiarEstado],
  );

  const eliminarEncuentro = useCallback((id: string) => {
    cambiarEstado((prev) => ({
      ...prev,
      encuentros: prev.encuentros.filter((e) => e.id !== id),
      encuentroActivoId: prev.encuentroActivoId === id ? null : prev.encuentroActivoId,
    }));
  }, [cambiarEstado]);

  const archivarEncuentro = useCallback((id: string, archivar: boolean) => {
    cambiarEstado((prev) => ({
      ...prev,
      encuentros: prev.encuentros.map((e) => (e.id === id ? { ...e, archivado: archivar } : e)),
      encuentroActivoId: archivar && idActivo(prev) === id ? null : prev.encuentroActivoId,
    }));
  }, [cambiarEstado]);

  const activar = useCallback((id: string) => {
    cambiarEstado((prev) => ({ ...prev, encuentroActivoId: id }));
  }, [cambiarEstado]);

  const reemplazarTodo = useCallback((e: Estado) => cambiarEstado(() => e), [cambiarEstado]);

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
        compartirEncuentro,
        dejarDeCompartir,
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
