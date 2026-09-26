import { describe, expect, it } from 'vitest';
import {
  compradorEfectivo,
  redondearArriba,
  resumenCobranza,
  resumenComida,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
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
    compradorId: 'ana',
    foto: null,
    personas: [
      { id: 'ana', nombre: 'Ana', color: '' },
      { id: 'beto', nombre: 'Beto', color: '' },
      { id: 'caro', nombre: 'Caro', color: '' },
    ],
    comidas: [{ id: 'c1', fecha: '2025-04-18', tipo: 'almuerzo', asistentes: ['ana', 'beto', 'caro'] }],
    compras: [{ id: 'x', comidaId: 'c1', concepto: 'Carne', importe: 20000, observaciones: '', creada: '' }],
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
  it('reparte entre todos los que comieron y redondea', () => {
    const enc = base();
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.comensales).toBe(3);
    expect(r.cobroPorPersona).toBe(7000); // 20000 / 3 = 6666,67 → 7000
    expect(r.recaudado).toBe(21000);
    expect(r.fondo).toBe(1000);
  });

  it('marca las comidas con gastos pero sin nadie anotado', () => {
    const enc = base();
    enc.comidas[0].asistentes = [];
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.sinComensales).toBe(true);
    expect(r.cobroPorPersona).toBe(0);
  });

  it('usa el precio fijo en lugar del redondeo, y el fondo puede quedar negativo', () => {
    const enc = base();
    enc.comidas[0].precioFijo = 6000;
    const r = resumenComida(enc, enc.comidas[0]);
    expect(r.esPrecioFijo).toBe(true);
    expect(r.cobroPorPersona).toBe(6000);
    expect(r.fondo).toBe(-2000);
  });
});

describe('resumenPersonas', () => {
  it('todos le deben al comprador, y el comprador no le debe a nadie', () => {
    const personas = resumenPersonas(base());
    const ana = personas.find((p) => p.persona.id === 'ana')!;
    const beto = personas.find((p) => p.persona.id === 'beto')!;
    expect(ana.esComprador).toBe(true);
    expect(ana.aPagar).toBe(7000);
    expect(ana.pendiente).toBe(0);
    expect(beto.pendiente).toBe(7000);
  });

  it('un pago descuenta lo pendiente, y si después sube el monto vuelve a quedar pendiente la diferencia', () => {
    const enc = base();
    enc.pagos.push({ id: 'p', personaId: 'beto', importe: 7000, fecha: '', metodo: 'efectivo' });
    expect(resumenPersonas(enc).find((p) => p.persona.id === 'beto')!.pendiente).toBe(0);
    enc.compras.push({ id: 'y', comidaId: 'c1', concepto: 'Pan', importe: 4000, observaciones: '', creada: '' });
    expect(resumenPersonas(enc).find((p) => p.persona.id === 'beto')!.pendiente).toBe(1000); // ahora 8000
  });

  it('si no se eligió comprador, es la primera persona', () => {
    const enc = base();
    enc.compradorId = null;
    expect(compradorEfectivo(enc)).toBe('ana');
  });
});

describe('gastos generales', () => {
  it('se reparten entre todos sin generar fondo', () => {
    const enc = base();
    enc.compras.push({ id: 'g', comidaId: GASTOS_GENERALES, concepto: 'Nafta', importe: 10000, observaciones: '', creada: '' });
    const g = resumenGastosGenerales(enc);
    expect(g.personas).toBe(3);
    expect([...g.reparto.values()].sort()).toEqual([3333, 3333, 3334]);
    const general = resumenGeneral(enc);
    expect(general.gastoReal).toBe(30000);
    expect(general.fondo).toBe(1000); // solo el de la comida
    // lo que el comprador recupera (lo que le pagan + su propia parte) cubre el gasto más el fondo
    const personas = resumenPersonas(enc);
    expect(personas.reduce((s, p) => s + p.aPagar, 0)).toBe(general.gastoReal + general.fondo);
  });
});

describe('resumenCobranza', () => {
  it('suma lo cobrado por método y lo pendiente', () => {
    const enc = base();
    enc.pagos.push({ id: 'p1', personaId: 'beto', importe: 7000, fecha: '', metodo: 'transferencia' });
    const c = resumenCobranza(enc);
    expect(c.totalACobrar).toBe(14000);
    expect(c.cobrado).toBe(7000);
    expect(c.transferencia).toBe(7000);
    expect(c.efectivo).toBe(0);
    expect(c.pendiente).toBe(7000);
    expect(c.alDia).toBe(1);
    expect(c.deudores).toBe(2);
  });

  it('el ejemplo cierra: el comprador recupera el gasto más el fondo', () => {
    const enc = encuentroEjemplo();
    const g = resumenGeneral(enc);
    const personas = resumenPersonas(enc);
    const comprador = personas.find((p) => p.esComprador)!;
    const c = resumenCobranza(enc, personas);
    expect(c.totalACobrar + comprador.aPagar).toBe(g.gastoReal + g.fondo);
    expect(g.fondo).toBeGreaterThanOrEqual(0);
  });
});
