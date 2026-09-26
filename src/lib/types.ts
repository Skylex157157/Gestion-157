export type TipoComida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';

export interface Persona {
  id: string;
  nombre: string;
  color: string;
}

export interface Comida {
  id: string;
  /** Fecha en formato YYYY-MM-DD */
  fecha: string;
  tipo: TipoComida;
  /** Qué se come (ej.: "Asado"). Opcional. */
  menu?: string;
  /** Precio fijo por persona. Si no hay, se usa el costo real redondeado. */
  precioFijo?: number | null;
  /** Ids de las personas que comieron */
  asistentes: string[];
}

/** comidaId de las compras que no son de una comida: se reparten entre todos. */
export const GASTOS_GENERALES = 'generales';

export type MetodoPago = 'efectivo' | 'transferencia';

/** Algo que alguien compró con su plata para el grupo. */
export interface Compra {
  id: string;
  /** Quién hizo la compra */
  personaId: string;
  /** Id de la comida, o GASTOS_GENERALES */
  comidaId: string;
  /** Qué compró (ej.: "Carne y chorizos para el asado") */
  concepto: string;
  importe: number;
  /** ISO timestamp de cuándo se registró */
  creada: string;
}

/**
 * Plata que se movió entre una persona y quien maneja la plata:
 * "pago" = la persona le pagó lo que debía; "devolucion" = se le devolvió lo que puso de más.
 */
export interface Pago {
  id: string;
  personaId: string;
  tipo: 'pago' | 'devolucion';
  importe: number;
  fecha: string;
  metodo: MetodoPago;
}

export interface Encuentro {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  /** El cobro por persona se redondea hacia arriba a este múltiplo */
  redondeo: number;
  /** Quien maneja la plata: todos arreglan cuentas con esta persona, y guarda el fondo común */
  administradorId: string | null;
  /** Encuentro cerrado para liquidar. No bloquea los cambios. */
  cerrado?: boolean;
  /** Archivado: ya terminó y no aparece en la lista de encuentros (se puede recuperar) */
  archivado?: boolean;
  /** Foto de portada como data URL (opcional) */
  foto: string | null;
  personas: Persona[];
  comidas: Comida[];
  compras: Compra[];
  pagos: Pago[];
}

export interface Estado {
  version: 1;
  encuentroActivoId: string | null;
  encuentros: Encuentro[];
}
