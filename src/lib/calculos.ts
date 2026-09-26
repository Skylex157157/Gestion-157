import { GASTOS_GENERALES, type Comida, type Encuentro, type Pago, type Persona } from './types';

export interface ResumenComida {
  comida: Comida;
  gastoReal: number;
  comensales: number;
  /** Lo que se le cobra a cada comensal: precio fijo, o costo real redondeado hacia arriba */
  cobroPorPersona: number;
  /** El cobro sale del precio fijo cargado a mano */
  esPrecioFijo: boolean;
  recaudado: number;
  /** recaudado - gastoReal: lo que sobra por el redondeo (negativo si el precio fijo no alcanza) */
  fondo: number;
  /** Hay gastos pero nadie anotado que los pague */
  sinComensales: boolean;
}

export interface ResumenPersona {
  persona: Persona;
  /** Es quien compra todo: no le debe a nadie */
  esComprador: boolean;
  comidas: number;
  /** Suma del costo real exacto de sus comidas y su parte de gastos generales */
  costoReal: number;
  /** Lo que le corresponde pagar (comidas redondeadas + gastos generales) */
  aPagar: number;
  /** Su parte de los gastos generales */
  generales: number;
  /** Aporte al fondo común por el redondeo */
  fondoGenerado: number;
  pagos: Pago[];
  pagado: number;
  /** Lo que todavía le debe al comprador (0 para el comprador) */
  pendiente: number;
}

export interface ResumenGastosGenerales {
  total: number;
  /** Personas entre las que se reparte */
  personas: number;
  porPersona: number;
  /** Parte de cada persona en pesos enteros (los pesos que sobran de la división van a los primeros) */
  reparto: Map<string, number>;
}

export interface ResumenGeneral {
  /** Comidas + gastos generales */
  gastoReal: number;
  gastoComidas: number;
  gastosGenerales: number;
  recaudado: number;
  fondo: number;
  personas: number;
  comidas: ResumenComida[];
}

export interface ResumenCobranza {
  compradorId: string | null;
  /** Lo que los demás le tienen que pagar al comprador en total */
  totalACobrar: number;
  cobrado: number;
  efectivo: number;
  transferencia: number;
  pendiente: number;
  /** Personas (sin contar al comprador) que ya no deben nada */
  alDia: number;
  deudores: number;
}

/** Redondea hacia arriba al múltiplo indicado (mínimo 1 peso). */
export function redondearArriba(valor: number, multiplo: number): number {
  const m = multiplo > 0 ? multiplo : 1;
  // el epsilon evita que 7000.0000001 por errores de coma flotante suba a 8000
  return Math.ceil(valor / m - 1e-9) * m;
}

export function resumenComida(enc: Encuentro, comida: Comida): ResumenComida {
  const gastoReal = enc.compras
    .filter((c) => c.comidaId === comida.id)
    .reduce((s, c) => s + c.importe, 0);
  const comensales = enc.personas.filter((p) => comida.asistentes.includes(p.id)).length;
  const esPrecioFijo = (comida.precioFijo ?? 0) > 0;
  const cobroPorPersona =
    comensales === 0 ? 0 : esPrecioFijo ? comida.precioFijo! : redondearArriba(gastoReal / comensales, enc.redondeo);
  const recaudado = cobroPorPersona * comensales;
  return {
    comida,
    gastoReal,
    comensales,
    cobroPorPersona,
    esPrecioFijo,
    recaudado,
    fondo: recaudado - gastoReal,
    sinComensales: comensales === 0 && gastoReal > 0,
  };
}

/** Gastos que no son de una comida: se reparten en partes iguales entre todos, sin redondeo. */
export function resumenGastosGenerales(enc: Encuentro): ResumenGastosGenerales {
  const total = enc.compras
    .filter((c) => c.comidaId === GASTOS_GENERALES)
    .reduce((s, c) => s + c.importe, 0);
  const n = enc.personas.length;
  const reparto = new Map<string, number>();
  if (n > 0) {
    const base = Math.floor(total / n);
    let resto = total - base * n;
    for (const p of enc.personas) {
      reparto.set(p.id, base + (resto > 0 ? 1 : 0));
      resto--;
    }
  }
  return { total, personas: n, porPersona: n ? total / n : 0, reparto };
}

export function resumenGeneral(enc: Encuentro): ResumenGeneral {
  const comidas = ordenarComidas(enc.comidas).map((c) => resumenComida(enc, c));
  const generales = resumenGastosGenerales(enc);
  const gastoComidas = comidas.reduce((s, c) => s + c.gastoReal, 0);
  const gastoReal = gastoComidas + generales.total;
  // Si no hay personas, nadie paga los gastos generales y los absorbe el fondo
  const recaudado = comidas.reduce((s, c) => s + c.recaudado, 0) + (generales.personas ? generales.total : 0);
  return {
    gastoReal,
    gastoComidas,
    gastosGenerales: generales.total,
    recaudado,
    fondo: recaudado - gastoReal,
    personas: enc.personas.length,
    comidas,
  };
}

export function resumenPersonas(enc: Encuentro): ResumenPersona[] {
  const general = resumenGeneral(enc);
  const { reparto } = resumenGastosGenerales(enc);
  const compradorId = compradorEfectivo(enc);

  return enc.personas.map((persona) => {
    let comidas = 0;
    let costoReal = 0;
    let aPagar = 0;
    for (const rc of general.comidas) {
      if (!rc.comida.asistentes.includes(persona.id)) continue;
      comidas++;
      if (rc.comensales === 0) continue;
      costoReal += rc.gastoReal / rc.comensales;
      aPagar += rc.cobroPorPersona;
    }
    const generales = reparto.get(persona.id) ?? 0;
    costoReal += generales;
    aPagar += generales;
    const esComprador = persona.id === compradorId;
    const pagos = enc.pagos.filter((p) => p.personaId === persona.id);
    const pagado = pagos.reduce((s, p) => s + p.importe, 0);

    return {
      persona,
      esComprador,
      comidas,
      costoReal,
      aPagar,
      generales,
      fondoGenerado: aPagar - costoReal,
      pagos,
      pagado,
      pendiente: esComprador ? 0 : Math.max(0, aPagar - pagado),
    };
  });
}

export function resumenCobranza(enc: Encuentro, personas = resumenPersonas(enc)): ResumenCobranza {
  const deudores = personas.filter((p) => !p.esComprador);
  const pagos = enc.pagos.filter((p) => deudores.some((d) => d.persona.id === p.personaId));
  const suma = (lista: Pago[]) => lista.reduce((s, p) => s + p.importe, 0);
  return {
    compradorId: compradorEfectivo(enc),
    totalACobrar: deudores.reduce((s, p) => s + p.aPagar, 0),
    cobrado: suma(pagos),
    efectivo: suma(pagos.filter((p) => p.metodo === 'efectivo')),
    transferencia: suma(pagos.filter((p) => p.metodo === 'transferencia')),
    pendiente: deudores.reduce((s, p) => s + p.pendiente, 0),
    alDia: deudores.filter((p) => p.pendiente === 0).length,
    deudores: deudores.length,
  };
}

/** El comprador elegido, o la primera persona si no se eligió ninguno. */
export function compradorEfectivo(enc: Encuentro): string | null {
  if (enc.compradorId && enc.personas.some((p) => p.id === enc.compradorId)) return enc.compradorId;
  return enc.personas[0]?.id ?? null;
}

const ORDEN_TIPO = { desayuno: 0, almuerzo: 1, merienda: 2, cena: 3 } as const;

export function ordenarComidas(comidas: Comida[]): Comida[] {
  return [...comidas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo],
  );
}
