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

/** Todas las compras las hace el comprador del encuentro. */
export interface Compra {
  id: string;
  /** Id de la comida, o GASTOS_GENERALES */
  comidaId: string;
  concepto: string;
  importe: number;
  observaciones: string;
  /** ISO timestamp de cuándo se registró */
  creada: string;
}

/** Lo que una persona le pagó al comprador. */
export interface Pago {
  id: string;
  personaId: string;
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
  /** La persona que compra todo: los demás le pagan a ella, y se queda con el fondo común */
  compradorId: string | null;
  /** Encuentro cerrado para liquidar. No bloquea los cambios. */
  cerrado?: boolean;
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
