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
  /** Es quien maneja la plata: los demás arreglan cuentas con esta persona */
  esAdministrador: boolean;
  comidas: number;
  /** Suma del costo real exacto de sus comidas y su parte de gastos generales */
  costoReal: number;
  /** Lo que le corresponde poner (comidas redondeadas + gastos generales) */
  aPagar: number;
  /** Lo que gastó en compras para el grupo */
  compras: number;
  /** aPagar - compras: positivo = tiene que poner esa diferencia; negativo = se le devuelve */
  neto: number;
  /** Su parte de los gastos generales */
  generales: number;
  /** Aporte al fondo común por el redondeo */
  fondoGenerado: number;
  pagos: Pago[];
  /** Lo que ya le pagó a quien maneja la plata */
  pagado: number;
  /** Lo que ya se le devolvió */
  devuelto: number;
  /**
   * Lo que falta arreglar con quien maneja la plata (0 para esa persona):
   * positivo = todavía debe; negativo = todavía hay que devolverle.
   */
  saldo: number;
}

export interface ResumenGastosGenerales {
  total: number;
  /** Personas entre las que se reparte */
  personas: number;
  /** Costo real por persona (total / personas) */
  porPersona: number;
  /** Redondeo elegido (1 = exacto) */
  redondeo: number;
  /** Lo que pone cada uno: el costo real redondeado hacia arriba, o el costo real si es exacto */
  cobroPorPersona: number;
  /** Parte de cada persona en pesos enteros (sin redondeo, los pesos que sobran de la división van a los primeros) */
  reparto: Map<string, number>;
  recaudado: number;
  /** recaudado - total: lo que sobra por el redondeo y va al fondo común */
  fondo: number;
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
  administradorId: string | null;
  /** Lo que hay que cobrarles a los que deben, en total */
  totalACobrar: number;
  /** Lo que hay que devolverles a los que pusieron de más, en total */
  totalADevolver: number;
  cobrado: number;
  devuelto: number;
  /** Cobrado en efectivo / por transferencia */
  efectivo: number;
  transferencia: number;
  pendienteCobrar: number;
  pendienteDevolver: number;
  /** Personas (sin contar a quien maneja la plata) que ya están al día */
  alDia: number;
  personas: number;
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
  const redondeo = enc.redondeoGenerales && enc.redondeoGenerales > 1 ? enc.redondeoGenerales : 1;
  const porPersona = n ? total / n : 0;
  const reparto = new Map<string, number>();
  if (n > 0 && redondeo > 1) {
    const cobro = redondearArriba(porPersona, redondeo);
    for (const p of enc.personas) reparto.set(p.id, cobro);
  } else if (n > 0) {
    const base = Math.floor(total / n);
    let resto = total - base * n;
    for (const p of enc.personas) {
      reparto.set(p.id, base + (resto > 0 ? 1 : 0));
      resto--;
    }
  }
  const recaudado = [...reparto.values()].reduce((s, v) => s + v, 0);
  return {
    total,
    personas: n,
    porPersona,
    redondeo,
    cobroPorPersona: redondeo > 1 ? redondearArriba(porPersona, redondeo) : porPersona,
    reparto,
    recaudado,
    fondo: n ? recaudado - total : 0,
  };
}

export function resumenGeneral(enc: Encuentro): ResumenGeneral {
  const comidas = ordenarComidas(enc.comidas).map((c) => resumenComida(enc, c));
  const generales = resumenGastosGenerales(enc);
  const gastoComidas = comidas.reduce((s, c) => s + c.gastoReal, 0);
  const gastoReal = gastoComidas + generales.total;
  // Si no hay personas, nadie paga los gastos generales y los absorbe el fondo
  const recaudado = comidas.reduce((s, c) => s + c.recaudado, 0) + generales.recaudado;
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
  const { reparto, porPersona: costoGenerales } = resumenGastosGenerales(enc);
  const administradorId = administradorEfectivo(enc);

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
    costoReal += costoGenerales;
    aPagar += generales;
    const compras = enc.compras.filter((c) => c.personaId === persona.id).reduce((s, c) => s + c.importe, 0);
    const neto = aPagar - compras;
    const esAdministrador = persona.id === administradorId;
    const pagos = enc.pagos.filter((p) => p.personaId === persona.id);
    const pagado = pagos.filter((p) => p.tipo === 'pago').reduce((s, p) => s + p.importe, 0);
    const devuelto = pagos.filter((p) => p.tipo === 'devolucion').reduce((s, p) => s + p.importe, 0);

    return {
      persona,
      esAdministrador,
      comidas,
      costoReal,
      aPagar,
      compras,
      neto,
      generales,
      fondoGenerado: aPagar - costoReal,
      pagos,
      pagado,
      devuelto,
      saldo: neto - pagado + devuelto,
    };
  });
}

export function resumenCobranza(enc: Encuentro, personas = resumenPersonas(enc)): ResumenCobranza {
  const pagos = personas.flatMap((p) => p.pagos);
  const suma = (lista: Pago[]) => lista.reduce((s, p) => s + p.importe, 0);
  const cobros = pagos.filter((p) => p.tipo === 'pago');
  return {
    administradorId: administradorEfectivo(enc),
    totalACobrar: personas.reduce((s, p) => s + Math.max(0, p.neto), 0),
    totalADevolver: personas.reduce((s, p) => s + Math.max(0, -p.neto), 0),
    cobrado: suma(cobros),
    devuelto: suma(pagos.filter((p) => p.tipo === 'devolucion')),
    efectivo: suma(cobros.filter((p) => p.metodo === 'efectivo')),
    transferencia: suma(cobros.filter((p) => p.metodo === 'transferencia')),
    pendienteCobrar: personas.reduce((s, p) => s + Math.max(0, p.saldo), 0),
    pendienteDevolver: personas.reduce((s, p) => s + Math.max(0, -p.saldo), 0),
    alDia: personas.filter((p) => p.saldo === 0).length,
    personas: personas.length,
  };
}

/** Quien maneja la plata, o la primera persona si no se eligió a nadie. */
export function administradorEfectivo(enc: Encuentro): string | null {
  if (enc.administradorId && enc.personas.some((p) => p.id === enc.administradorId)) return enc.administradorId;
  return enc.personas[0]?.id ?? null;
}

const ORDEN_TIPO = { desayuno: 0, almuerzo: 1, merienda: 2, cena: 3 } as const;

export function ordenarComidas(comidas: Comida[]): Comida[] {
  return [...comidas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo],
  );
}
