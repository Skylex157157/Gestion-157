import type { Comida, Encuentro, Persona } from './types';

export interface ResumenComida {
  comida: Comida;
  gastoReal: number;
  /** Asistentes que pagan (adultos) */
  pagantes: number;
  /** Chicos que comieron (no pagan) */
  ninos: number;
  /** Lo que se le cobra a cada adulto, redondeado hacia arriba */
  cobroPorPersona: number;
  recaudado: number;
  /** recaudado - gastoReal: lo que sobra por el redondeo */
  fondo: number;
  /** Hay gastos pero nadie que los pague */
  sinPagantes: boolean;
}

export interface ResumenPersona {
  persona: Persona;
  comidas: number;
  /** Suma del costo real exacto de sus comidas */
  costoReal: number;
  /** Suma de lo que se le cobró (redondeado) */
  debioAportar: number;
  compras: number;
  /** Aporte al fondo común por el redondeo */
  fondoGenerado: number;
  pagosEnviados: number;
  pagosRecibidos: number;
  /** Fondo común que esta persona debe guardar (solo el tesorero) */
  fondoAGuardar: number;
  /** Positivo: le tienen que pagar. Negativo: tiene que pagar. */
  saldo: number;
}

export interface Transferencia {
  deId: string;
  aId: string;
  importe: number;
}

export interface ResumenGeneral {
  gastoReal: number;
  recaudado: number;
  fondo: number;
  personas: number;
  comidas: ResumenComida[];
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
  const asistentes = enc.personas.filter((p) => comida.asistentes.includes(p.id));
  const pagantes = asistentes.filter((p) => !p.esNino).length;
  const ninos = asistentes.length - pagantes;
  const cobroPorPersona = pagantes > 0 ? redondearArriba(gastoReal / pagantes, enc.redondeo) : 0;
  const recaudado = cobroPorPersona * pagantes;
  return {
    comida,
    gastoReal,
    pagantes,
    ninos,
    cobroPorPersona,
    recaudado,
    fondo: recaudado - gastoReal,
    sinPagantes: pagantes === 0 && gastoReal > 0,
  };
}

export function resumenGeneral(enc: Encuentro): ResumenGeneral {
  const comidas = ordenarComidas(enc.comidas).map((c) => resumenComida(enc, c));
  const gastoReal = comidas.reduce((s, c) => s + c.gastoReal, 0);
  const recaudado = comidas.reduce((s, c) => s + c.recaudado, 0);
  return {
    gastoReal,
    recaudado,
    fondo: recaudado - gastoReal,
    personas: enc.personas.length,
    comidas,
  };
}

export function resumenPersonas(enc: Encuentro): ResumenPersona[] {
  const general = resumenGeneral(enc);
  const tesoreroId = tesoreroEfectivo(enc);

  return enc.personas.map((persona) => {
    let comidas = 0;
    let costoReal = 0;
    let debioAportar = 0;
    for (const rc of general.comidas) {
      if (!rc.comida.asistentes.includes(persona.id)) continue;
      comidas++;
      if (persona.esNino || rc.pagantes === 0) continue;
      costoReal += rc.gastoReal / rc.pagantes;
      debioAportar += rc.cobroPorPersona;
    }
    const compras = enc.compras
      .filter((c) => c.personaId === persona.id)
      .reduce((s, c) => s + c.importe, 0);
    const pagosEnviados = enc.pagos
      .filter((p) => p.deId === persona.id)
      .reduce((s, p) => s + p.importe, 0);
    const pagosRecibidos = enc.pagos
      .filter((p) => p.aId === persona.id)
      .reduce((s, p) => s + p.importe, 0);
    // El tesorero "recibe" el fondo común para guardarlo: así la suma de saldos da cero.
    const fondoAGuardar = persona.id === tesoreroId ? general.fondo : 0;
    const saldo = compras - debioAportar + fondoAGuardar + pagosEnviados - pagosRecibidos;

    return {
      persona,
      comidas,
      costoReal,
      debioAportar,
      compras,
      fondoGenerado: debioAportar - costoReal,
      pagosEnviados,
      pagosRecibidos,
      fondoAGuardar,
      saldo,
    };
  });
}

/** El tesorero elegido, o el primer adulto si no se eligió ninguno. */
export function tesoreroEfectivo(enc: Encuentro): string | null {
  if (enc.tesoreroId && enc.personas.some((p) => p.id === enc.tesoreroId)) return enc.tesoreroId;
  return (enc.personas.find((p) => !p.esNino) ?? enc.personas[0])?.id ?? null;
}

/**
 * Calcula las transferencias para saldar todas las cuentas con la menor
 * cantidad de movimientos posible (el mayor deudor le paga al mayor acreedor).
 */
export function transferenciasSugeridas(saldos: { id: string; saldo: number }[]): Transferencia[] {
  const acreedores = saldos
    .filter((s) => Math.round(s.saldo) >= 1)
    .map((s) => ({ id: s.id, monto: Math.round(s.saldo) }));
  const deudores = saldos
    .filter((s) => Math.round(s.saldo) <= -1)
    .map((s) => ({ id: s.id, monto: -Math.round(s.saldo) }));

  const resultado: Transferencia[] = [];
  while (acreedores.length && deudores.length) {
    acreedores.sort((a, b) => b.monto - a.monto);
    deudores.sort((a, b) => b.monto - a.monto);
    const a = acreedores[0];
    const d = deudores[0];
    const importe = Math.min(a.monto, d.monto);
    resultado.push({ deId: d.id, aId: a.id, importe });
    a.monto -= importe;
    d.monto -= importe;
    if (a.monto < 1) acreedores.shift();
    if (d.monto < 1) deudores.shift();
  }
  return resultado;
}

const ORDEN_TIPO = { desayuno: 0, almuerzo: 1, merienda: 2, cena: 3 } as const;

export function ordenarComidas(comidas: Comida[]): Comida[] {
  return [...comidas].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo],
  );
}
