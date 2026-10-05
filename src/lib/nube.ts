// Encuentros compartidos: se guardan en Cloud Firestore para que varias personas
// los editen a la vez. Este módulo se carga solo cuando hace falta (import dinámico).
//
// En la nube cada encuentro es un documento con sus datos generales, y cada persona,
// comida, compra y pago es un documento aparte. Así, si dos personas cargan compras al
// mismo tiempo, no se pisan. Firestore guarda una copia en el teléfono: sin señal se
// sigue leyendo y guardando ahí, y los cambios se envían cuando vuelve la conexión.
import { initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocFromServer,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
  type WriteBatch,
} from 'firebase/firestore';
import { configFirebase, USAR_EMULADOR } from './nubeConfig';
import { fijarEstadoSync } from './sincronia';
import { iguales } from './formato';
import type { Compra, Comida, Encuentro, Pago, Persona } from './types';

const COLECCIONES = ['personas', 'comidas', 'compras', 'pagos'] as const;
type Coleccion = (typeof COLECCIONES)[number];
type Item = { id: string };

let db: Firestore | null = null;

function base(): Firestore {
  if (db) return db;
  if (!configFirebase) throw new Error('Falta configurar Firebase');
  const app = initializeApp(configFirebase);
  db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
    // Solo para pruebas detrás de proxys que cortan las conexiones largas
    ...(import.meta.env.VITE_FIREBASE_LONG_POLLING === '1' ? { experimentalForceLongPolling: true } : {}),
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (USAR_EMULADOR) connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return db;
}

/** Datos generales del encuentro (lo que no es una lista). La foto va aparte porque es pesada. */
function datosGenerales(e: Encuentro) {
  return {
    nombre: e.nombre,
    fechaInicio: e.fechaInicio,
    fechaFin: e.fechaFin,
    redondeo: e.redondeo,
    redondeoGenerales: e.redondeoGenerales ?? 1,
    administradorId: e.administradorId ?? null,
    cerrado: !!e.cerrado,
  };
}

// Orden de cada elemento en su lista (la nube no guarda el orden de los arreglos)
const ordenes = new Map<string, number>();
let ultimoOrden = 0;
function ordenNuevo(): number {
  ultimoOrden = Math.max(Date.now(), ultimoOrden + 1);
  return ultimoOrden;
}

/** Arma lotes de escrituras: Firestore acepta hasta 500 por lote. */
class Lotes {
  private lotes: WriteBatch[] = [];
  private cuenta = 0;
  constructor(private fs: Firestore) {}
  get(): WriteBatch {
    if (this.cuenta % 450 === 0) this.lotes.push(writeBatch(this.fs));
    this.cuenta++;
    return this.lotes[this.lotes.length - 1];
  }
  enviar(): Promise<void> {
    return Promise.all(this.lotes.map((l) => l.commit())).then(() => undefined);
  }
}

function guardarItem(l: Lotes, encId: string, col: Coleccion, item: Item, orden?: number) {
  const clave = `${encId}/${col}/${item.id}`;
  const o = orden ?? ordenes.get(clave) ?? ordenNuevo();
  ordenes.set(clave, o);
  const { id, ...datos } = item;
  l.get().set(doc(base(), 'encuentros', encId, col, id), { ...datos, orden: o });
}

function avisarError(encId: string, e: unknown) {
  console.error(e);
  const codigo = (e as { code?: string })?.code;
  fijarEstadoSync(encId, {
    error:
      codigo === 'permission-denied'
        ? 'La nube rechazó los cambios. Revisá las reglas de Firestore.'
        : 'No se pudieron guardar los cambios en la nube.',
  });
}

/** Sube un encuentro entero (al empezar a compartirlo). Se resuelve cuando llegó a la nube. */
export function subirEncuentro(e: Encuentro): Promise<void> {
  const fs = base();
  const l = new Lotes(fs);
  l.get().set(doc(fs, 'encuentros', e.id), { ...datosGenerales(e), actualizado: serverTimestamp() });
  l.get().set(doc(fs, 'encuentros', e.id, 'extra', 'foto'), { foto: e.foto ?? null });
  for (const col of COLECCIONES) {
    (e[col] as Item[]).forEach((item, i) => guardarItem(l, e.id, col, item, i));
  }
  return l.enviar().catch((err) => {
    avisarError(e.id, err);
    throw err;
  });
}

/** Envía a la nube solo lo que cambió entre dos versiones del encuentro. */
export function guardarCambios(antes: Encuentro, despues: Encuentro) {
  const fs = base();
  const l = new Lotes(fs);
  const id = despues.id;
  if (!iguales(datosGenerales(antes), datosGenerales(despues))) {
    l.get().set(doc(fs, 'encuentros', id), { ...datosGenerales(despues), actualizado: serverTimestamp() });
  }
  if (antes.foto !== despues.foto) {
    l.get().set(doc(fs, 'encuentros', id, 'extra', 'foto'), { foto: despues.foto ?? null });
  }
  for (const col of COLECCIONES) {
    const viejos = new Map((antes[col] as Item[]).map((x) => [x.id, x]));
    const nuevos = new Set<string>();
    for (const item of despues[col] as Item[]) {
      nuevos.add(item.id);
      const viejo = viejos.get(item.id);
      if (!viejo || !iguales(viejo, item)) guardarItem(l, id, col, item);
    }
    for (const viejoId of viejos.keys()) {
      if (!nuevos.has(viejoId)) l.get().delete(doc(fs, 'encuentros', id, col, viejoId));
    }
  }
  l.enviar().catch((err) => avisarError(id, err));
}

/** Busca un encuentro compartido en la nube (para unirse con el link). Necesita conexión. */
export async function buscarEncuentro(id: string): Promise<Encuentro | null> {
  const meta = await getDocFromServer(doc(base(), 'encuentros', id));
  if (!meta.exists()) return null;
  const d = meta.data();
  return {
    id,
    nombre: String(d.nombre ?? 'Encuentro'),
    fechaInicio: String(d.fechaInicio ?? ''),
    fechaFin: String(d.fechaFin ?? ''),
    redondeo: Number(d.redondeo) || 1000,
    redondeoGenerales: Number(d.redondeoGenerales) || 1,
    administradorId: d.administradorId ?? null,
    cerrado: !!d.cerrado,
    compartido: true,
    foto: null,
    personas: [],
    comidas: [],
    compras: [],
    pagos: [],
  };
}

type Listas = { personas: Persona[]; comidas: Comida[]; compras: Compra[]; pagos: Pago[] };
export type CambioRemoto = Partial<Pick<Encuentro, keyof ReturnType<typeof datosGenerales> | 'foto'> & Listas>;

/**
 * Escucha los cambios de un encuentro compartido (de este teléfono y de los demás).
 * Llama a `alCambiar` con la parte del encuentro que cambió. Devuelve la función para dejar de escuchar.
 */
export function escucharEncuentro(id: string, alCambiar: (cambio: CambioRemoto) => void): () => void {
  const fs = base();
  // conexión y cambios pendientes de cada escucha, para resumir el estado del encuentro
  const partes = new Map<string, { cache: boolean; pendientes: boolean }>();
  const actualizarEstado = (parte: string, cache: boolean, pendientes: boolean) => {
    partes.set(parte, { cache, pendientes });
    const todas = [...partes.values()];
    fijarEstadoSync(id, {
      conectado: todas.length > 0 && todas.every((p) => !p.cache),
      pendientes: todas.some((p) => p.pendientes),
      ...(todas.some((p) => p.pendientes) ? {} : { error: null }),
    });
  };
  const alFallar = (err: unknown) => avisarError(id, err);
  const opciones = { includeMetadataChanges: true };

  const bajas = [
    onSnapshot(
      doc(fs, 'encuentros', id),
      opciones,
      (s) => {
        actualizarEstado('meta', s.metadata.fromCache, s.metadata.hasPendingWrites);
        const d = s.data();
        if (!d) return;
        alCambiar({
          nombre: d.nombre,
          fechaInicio: d.fechaInicio,
          fechaFin: d.fechaFin,
          redondeo: d.redondeo,
          redondeoGenerales: d.redondeoGenerales,
          administradorId: d.administradorId ?? null,
          cerrado: !!d.cerrado,
        });
      },
      alFallar,
    ),
    onSnapshot(
      doc(fs, 'encuentros', id, 'extra', 'foto'),
      opciones,
      (s) => {
        actualizarEstado('foto', s.metadata.fromCache, s.metadata.hasPendingWrites);
        if (s.exists()) alCambiar({ foto: s.data().foto ?? null });
      },
      alFallar,
    ),
    ...COLECCIONES.map((col) =>
      onSnapshot(
        collection(fs, 'encuentros', id, col),
        opciones,
        (s) => {
          actualizarEstado(col, s.metadata.fromCache, s.metadata.hasPendingWrites);
          // Una lista vacía que viene solo del teléfono puede ser que todavía no bajó nada: se espera al servidor
          if (s.empty && s.metadata.fromCache) return;
          // solo cambió la conexión o se confirmó un envío: los datos son los mismos
          if (!s.docChanges().length) return;
          const items = s.docs
            .map((d) => {
              const { orden, ...datos } = d.data() as DocumentData & { orden?: number };
              ordenes.set(`${id}/${col}/${d.id}`, orden ?? 0);
              return { orden: orden ?? 0, item: { ...datos, id: d.id } };
            })
            .sort((a, b) => a.orden - b.orden || a.item.id.localeCompare(b.item.id))
            .map((x) => x.item);
          alCambiar({ [col]: items } as CambioRemoto);
        },
        alFallar,
      ),
    ),
  ];
  return () => bajas.forEach((b) => b());
}
