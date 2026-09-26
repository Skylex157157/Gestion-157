import { describe, expect, it } from 'vitest';
import {
  administradorEfectivo,
  redondearArriba,
  resumenCobranza,
  resumenComida,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
} from './calculos';
import { GASTOS_GENERALES, type Encuentro } from './types';
import { encuentroEjemplo } from './ejemplo';

/** Ana maneja la plata; Beto compró la carne ($30.000) de un almuerzo de 3 personas. */
function base(): Encuentro {
  return {
    id: 'e',
    nombre: 'Test',
    fechaInicio: '2025-04-18',
    fechaFin: '2025-04-20',
    redondeo: 1000,
    administradorId: 'ana',
    foto: null,
    personas: [
      { id: 'ana', nombre: 'Ana', color: '' },
      { id: 'beto', nombre: 'Beto', color: '' },
      { id: 'caro', nombre: 'Caro', color: '' },
    ],
    comidas: [{ id: 'c1', fecha: '2025-04-18', tipo: 'almuerzo', asistentes: ['ana', 'beto', 'caro'] }],
    compras: [{ id: 'x', personaId: 'beto', comidaId: 'c1', concepto: 'Carne', importe: 30000, creada: '' }],
    pagos: [],
  };
}

const de = (enc: Encuentro, id: string) => resumenPersonas(enc).find((p) => p.persona.id === id)!;

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
    enc.compras[0].importe = 20000;
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
    expect(r.fondo).toBe(-12000);
  });
});

describe('resumenPersonas', () => {
  it('lo que compró se descuenta de su parte: si puso de más, se le devuelve', () => {
    const enc = base();
    // cada uno pone 10.000; Beto gastó 30.000 → se le devuelven 20.000
    expect(de(enc, 'beto').neto).toBe(-20000);
    expect(de(enc, 'beto').saldo).toBe(-20000);
    expect(de(enc, 'caro').saldo).toBe(10000);
  });

  it('si compró menos que su parte, pone solo la diferencia', () => {
    const enc = base();
    enc.compras[0].importe = 60000; // cada uno 20.000
    enc.compras.push({ id: 'y', personaId: 'caro', comidaId: 'c1', concepto: 'Pan', importe: 5000, creada: '' });
    // total 65.000 / 3 = 21.667 → 22.000 cada uno
    expect(de(enc, 'caro').saldo).toBe(22000 - 5000);
  });

  it('quien maneja la plata no le debe a nadie', () => {
    const enc = base();
    expect(de(enc, 'ana').esAdministrador).toBe(true);
    expect(de(enc, 'ana').saldo).toBe(0);
  });

  it('los pagos y las devoluciones ajustan el saldo', () => {
    const enc = base();
    enc.pagos.push(
      { id: 'p1', personaId: 'caro', tipo: 'pago', importe: 10000, fecha: '', metodo: 'efectivo' },
      { id: 'p2', personaId: 'beto', tipo: 'devolucion', importe: 20000, fecha: '', metodo: 'transferencia' },
    );
    expect(de(enc, 'caro').saldo).toBe(0);
    expect(de(enc, 'beto').saldo).toBe(0);
    // si después sube el gasto, la diferencia vuelve a quedar pendiente
    enc.compras.push({ id: 'y', personaId: 'ana', comidaId: 'c1', concepto: 'Pan', importe: 3000, creada: '' });
    expect(de(enc, 'caro').saldo).toBe(1000); // 33.000 / 3 = 11.000
  });

  it('si no se eligió a nadie, maneja la plata la primera persona', () => {
    const enc = base();
    enc.administradorId = null;
    expect(administradorEfectivo(enc)).toBe('ana');
  });
});

describe('gastos generales', () => {
  it('se reparten entre todos sin generar fondo', () => {
    const enc = base();
    enc.compras.push({ id: 'g', personaId: 'caro', comidaId: GASTOS_GENERALES, concepto: 'Nafta', importe: 10000, creada: '' });
    const g = resumenGastosGenerales(enc);
    expect(g.personas).toBe(3);
    expect([...g.reparto.values()].sort()).toEqual([3333, 3333, 3334]);
    const general = resumenGeneral(enc);
    expect(general.gastoReal).toBe(40000);
    expect(general.fondo).toBe(0);
  });
});

describe('resumenCobranza', () => {
  it('separa lo que hay que cobrar de lo que hay que devolver', () => {
    const enc = base();
    enc.pagos.push({ id: 'p1', personaId: 'caro', tipo: 'pago', importe: 4000, fecha: '', metodo: 'transferencia' });
    const c = resumenCobranza(enc);
    expect(c.totalACobrar).toBe(10000);
    expect(c.totalADevolver).toBe(20000);
    expect(c.cobrado).toBe(4000);
    expect(c.transferencia).toBe(4000);
    expect(c.pendienteCobrar).toBe(6000);
    expect(c.pendienteDevolver).toBe(20000);
    expect(c.alDia).toBe(0);
    expect(c.personas).toBe(2);
  });

  it('el ejemplo cierra: lo que queda en la caja es el fondo común', () => {
    const enc = encuentroEjemplo();
    const personas = resumenPersonas(enc);
    const g = resumenGeneral(enc);
    // sumando lo que cada uno pone menos lo que compró, sobra exactamente el fondo
    expect(personas.reduce((s, p) => s + p.neto, 0)).toBe(g.fondo);
    expect(g.fondo).toBeGreaterThan(0);
  });
});
