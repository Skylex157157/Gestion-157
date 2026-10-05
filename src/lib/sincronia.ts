// Estado de la sincronización de cada encuentro compartido, sin depender de Firebase
// (así la pantalla lo puede mostrar sin cargar la librería).
import { useSyncExternalStore } from 'react';

export interface EstadoSync {
  /** Hay conexión con la nube (los datos que se ven vienen del servidor) */
  conectado: boolean;
  /** Hay cambios hechos en este teléfono que todavía no llegaron a la nube */
  pendientes: boolean;
  /** Último error al guardar o leer, si hubo */
  error: string | null;
}

const SIN_DATOS: EstadoSync = { conectado: false, pendientes: false, error: null };
const estados = new Map<string, EstadoSync>();
const oyentes = new Set<() => void>();

export function fijarEstadoSync(id: string, cambio: Partial<EstadoSync>) {
  const actual = estados.get(id) ?? SIN_DATOS;
  const nuevo = { ...actual, ...cambio };
  if (nuevo.conectado === actual.conectado && nuevo.pendientes === actual.pendientes && nuevo.error === actual.error) {
    return;
  }
  estados.set(id, nuevo);
  oyentes.forEach((o) => o());
}

export function useEstadoSync(id: string | undefined): EstadoSync {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => (id && estados.get(id)) || SIN_DATOS,
  );
}
