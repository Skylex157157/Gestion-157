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
  /** Ids de las personas que comieron */
  asistentes: string[];
}

export interface Compra {
  id: string;
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
