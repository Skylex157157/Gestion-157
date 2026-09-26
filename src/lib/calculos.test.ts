import { describe, expect, it } from 'vitest';
import {
  redondearArriba,
  resumenComida,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
  transferenciasSugeridas,
} from './calculos';
import { GASTOS_GENERALES, type Encuentro } from './types';
import { encuentroEjemplo } from './ejemplo';

function base(): Encuentro {
  return {
    id: 'e',
    nombre: 'Test',
    fechaInicio: '2025-04-18',
    fechaFin: '2025-04-20',
    redondeo: 1000,
    tesoreroId: 'ana',
    foto: null,
    personas: [
      { id: 'ana', nombre: 'Ana', esNino: false, color: '' },
      { id: 'beto', nombre: 'Beto', esNino: false, color: '' },
      { id: 'caro', nombre: 'Caro', esNino: false, color: '' },
      { id: 'nene', nombre: 'Nene', esNino: true, color: '' },
    ],
    comidas: [{ id: 'c1', fecha: '2025-04-18', tipo: 'almuerzo', asistentes: ['ana', 'beto', 'caro', 'nene'] }],
    compras: [
      { id: 'x', comidaId: 'c1', personaId: 'beto', concepto: 'Carne', importe: 20000, observaciones: '', creada: '' },
    ],
    pagos: [],
  };
}

describe('redondearArriba', () => {
  it('redondea hacia arriba al múltiplo', () => {
    expect(redondearArriba(7000, 1000)).toBe(7000);
    expect(redondearArriba(7001, 1000)).toBe(8000);
    expect(redondearArriba(7200, 500)).toBe(7500);
    expect(redondearArriba(6666.67, 1)).toBe(6667);
    expect(redondearArriba(105000 / 15, 1000)).toBe(7000);
  });
});

describe('resumenComida', () => {
  it('los chicos no pagan y su parte se reparte entre los adultos', () => {
    const enc = base();
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.pagantes).toBe(3);
    expect(r.ninos).toBe(1);
    expect(r.cobroPorPersona).toBe(7000); // 20000 / 3 = 6666,67 → 7000
    expect(r.recaudado).toBe(21000);
    expect(r.fondo).toBe(1000);
  });

  it('marca las comidas con gastos pero sin adultos', () => {
    const enc = base();
    enc.comidas[0].asistentes = ['nene'];
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.sinPagantes).toBe(true);
    expect(r.cobroPorPersona).toBe(0);
  });
});

describe('resumenPersonas', () => {
  it('los saldos suman cero (el tesorero recibe el fondo)', () => {
    const enc = base();
    const personas = resumenPersonas(enc);
    const suma = personas.reduce((s, p) => s + p.saldo, 0);
    expect(suma).toBe(0);
    const beto = personas.find((p) => p.persona.id === 'beto')!;
    expect(beto.saldo).toBe(13000); // compró 20000, debía 7000
    const ana = personas.find((p) => p.persona.id === 'ana')!;
    expect(ana.saldo).toBe(-7000 + 1000); // debe 7000 pero guarda 1000 de fondo
    const nene = personas.find((p) => p.persona.id === 'nene')!;
    expect(nene.saldo).toBe(0);
    expect(nene.comidas).toBe(1);
  });

  it('los pagos registrados descuentan del saldo', () => {
    const enc = base();
    enc.pagos.push({ id: 'p', deId: 'caro', aId: 'beto', importe: 7000, fecha: '' });
    const personas = resumenPersonas(enc);
    expect(personas.find((p) => p.persona.id === 'caro')!.saldo).toBe(0);
    expect(personas.find((p) => p.persona.id === 'beto')!.saldo).toBe(6000);
  });

  it('el ejemplo cierra: saldos en cero y transferencias saldan todo', () => {
    const enc = encuentroEjemplo();
    const personas = resumenPersonas(enc);
    expect(personas.reduce((s, p) => s + p.saldo, 0)).toBe(0);
    const general = resumenGeneral(enc);
    expect(general.fondo).toBeGreaterThanOrEqual(0);

    const t = transferenciasSugeridas(personas.map((p) => ({ id: p.persona.id, saldo: p.saldo })));
    const saldos = new Map(personas.map((p) => [p.persona.id, p.saldo]));
    for (const x of t) {
      saldos.set(x.deId, saldos.get(x.deId)! + x.importe);
      saldos.set(x.aId, saldos.get(x.aId)! - x.importe);
    }
    for (const s of saldos.values()) expect(s).toBe(0);
  });
});

describe('precio fijo', () => {
  it('usa el precio fijo en lugar del redondeo, y el fondo puede quedar negativo', () => {
    const enc = base();
    enc.comidas[0].precioFijo = 6000;
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.esPrecioFijo).toBe(true);
    expect(r.cobroPorPersona).toBe(6000);
    expect(r.fondo).toBe(-2000);
    expect(resumenPersonas(enc).reduce((s, p) => s + p.saldo, 0)).toBe(0);
  });
});

describe('gastos generales', () => {
  it('se reparten entre los adultos sin generar fondo y los saldos cierran', () => {
    const enc = base();
    enc.compras.push({
      id: 'g',
      comidaId: GASTOS_GENERALES,
      personaId: 'caro',
      concepto: 'Nafta',
      importe: 10000,
      observaciones: '',
      creada: '',
    });
    const g = resumenGastosGenerales(enc);
    expect(g.adultos).toBe(3);
    expect([...g.reparto.values()].sort()).toEqual([3333, 3333, 3334]);
    const general = resumenGeneral(enc);
    expect(general.gastoReal).toBe(30000);
    expect(general.fondo).toBe(1000); // solo el de la comida
    const personas = resumenPersonas(enc);
    expect(personas.reduce((s, p) => s + p.saldo, 0)).toBe(0);
    expect(personas.find((p) => p.persona.id === 'nene')!.generales).toBe(0);
  });
});

describe('transferenciasSugeridas', () => {
  it('minimiza movimientos', () => {
    const t = transferenciasSugeridas([
      { id: 'a', saldo: 30000 },
      { id: 'b', saldo: -10000 },
      { id: 'c', saldo: -20000 },
    ]);
    expect(t).toEqual([
      { deId: 'c', aId: 'a', importe: 20000 },
      { deId: 'b', aId: 'a', importe: 10000 },
    ]);
  });

  it('no sugiere nada si está todo saldado', () => {
    expect(transferenciasSugeridas([{ id: 'a', saldo: 0 }])).toEqual([]);
  });
});
