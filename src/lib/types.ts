export type TipoComida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';

export interface Persona {
  id: string;
  nombre: string;
  /** Los chicos comen pero no pagan: su parte se reparte entre los adultos. */
  esNino: boolean;
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

/** comidaId de las compras que no son de una comida: se reparten entre todos los adultos. */
export const GASTOS_GENERALES = 'generales';

export type MetodoPago = 'efectivo' | 'transferencia';

export interface Compra {
  id: string;
  /** Id de la comida, o GASTOS_GENERALES */
  comidaId: string;
  personaId: string;
  concepto: string;
  importe: number;
  observaciones: string;
  /** ISO timestamp de cuándo se registró */
  creada: string;
}

/** Una transferencia ya realizada entre dos personas para saldar cuentas. */
export interface Pago {
  id: string;
  deId: string;
  aId: string;
  importe: number;
  fecha: string;
  metodo?: MetodoPago;
}

export interface Encuentro {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  /** El cobro por persona se redondea hacia arriba a este múltiplo */
  redondeo: number;
  /** Persona que guarda el fondo común */
  tesoreroId: string | null;
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
