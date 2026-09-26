import { GASTOS_GENERALES, type Comida, type Compra, type Encuentro, type Persona, type TipoComida } from './types';
import { COLORES_PERSONA, nuevoId } from './formato';

const NOMBRES: [string, boolean][] = [
  ['Juan Pérez', false],
  ['María López', false],
  ['Carlos Gómez', false],
  ['Ana Torres', false],
  ['Luis Fernández', false],
  ['Sofía Rodríguez', false],
  ['Pedro Martínez', false],
  ['Lucía Sánchez', false],
  ['Javier Díaz', false],
  ['Valentina Pérez', false],
  ['Martín Romero', false],
  ['Camila Álvarez', false],
  ['Diego Ruiz', false],
  ['Florencia Castro', false],
  ['Nicolás Herrera', false],
  ['Julieta Morales', false],
  ['Tomás Silva', false],
  ['Agustina Ríos', false],
  ['Federico Molina', false],
  ['Carolina Vega', false],
  ['Gustavo Medina', false],
  ['Paula Suárez', false],
  ['Ricardo Ortiz', false],
  ['Laura Giménez', false],
  ['Marcelo Acosta', false],
  ['Silvia Benítez', false],
  ['Hernán Rojas', false],
  ['Mónica Flores', false],
  ['Benjamín Pérez', true],
  ['Emma López', true],
  ['Mateo Gómez', true],
  ['Olivia Torres', true],
];

const COMIDAS: [string, TipoComida, number, [number, string, number, string][]][] = [
  // fecha, tipo, cantidad de asistentes, compras [persona, concepto, importe, hora]
  ['2025-04-18', 'almuerzo', 10, [[0, 'Carne', 40000, '11:10'], [2, 'Verduras', 20000, '11:40']]],
  ['2025-04-18', 'cena', 15, [[1, 'Pastas', 55000, '18:30'], [4, 'Bebidas', 35000, '19:05'], [7, 'Postres', 15000, '20:10']]],
  ['2025-04-19', 'desayuno', 12, [[5, 'Pan', 18000, '08:15'], [3, 'Almacén', 30000, '08:40']]],
  ['2025-04-19', 'almuerzo', 20, [[0, 'Carne', 70000, '11:45'], [1, 'Bebidas', 45000, '13:20'], [2, 'Verduras', 25000, '15:10'], [3, 'Postres', 20000, '17:30']]],
  ['2025-04-19', 'cena', 18, [[6, 'Pizzas', 96000, '20:00'], [8, 'Bebidas', 48000, '20:15']]],
  ['2025-04-20', 'almuerzo', 16, [[9, 'Carne', 80000, '11:30'], [4, 'Carbón / leña', 18000, '11:35'], [10, 'Bebidas', 30000, '12:00']]],
];

/** Encuentro de ejemplo para probar la app sin cargar todo a mano. */
export function encuentroEjemplo(): Encuentro {
  const personas: Persona[] = NOMBRES.map(([nombre, esNino], i) => ({
    id: nuevoId(),
    nombre,
    esNino,
    color: COLORES_PERSONA[i % COLORES_PERSONA.length],
  }));

  const comidas: Comida[] = [];
  const compras: Compra[] = [];
  COMIDAS.forEach(([fecha, tipo, cantidad, lista], ci) => {
    // Rotamos quién asiste para que cada comida tenga gente distinta,
    // siempre incluyendo a los que compraron y a algunos chicos.
    const ids = new Set<string>(lista.map(([p]) => personas[p].id));
    ids.add(personas[28 + (ci % 4)].id);
    for (let k = 0; ids.size < cantidad; k++) ids.add(personas[(ci * 5 + k) % 28].id);
    const comida: Comida = { id: nuevoId(), fecha, tipo, asistentes: [...ids] };
    comidas.push(comida);
    for (const [p, concepto, importe, h] of lista) {
      compras.push({
        id: nuevoId(),
        comidaId: comida.id,
        personaId: personas[p].id,
        concepto,
        importe,
        observaciones: '',
        creada: `${fecha}T${h}:00`,
      });
    }
  });

  const menus = ['Asado', 'Pastas', 'Café con medialunas', 'Asado', 'Pizzas', 'Asado'];
  comidas.forEach((c, i) => (c.menu = menus[i]));

  // Gastos que no son de una comida: se reparten entre todos los adultos
  for (const [p, concepto, importe, fecha] of [
    [0, 'Alquiler', 120000, '2025-04-18T10:00:00'],
    [2, 'Nafta / viaje', 30000, '2025-04-18T09:00:00'],
  ] as const) {
    compras.push({
      id: nuevoId(),
      comidaId: GASTOS_GENERALES,
      personaId: personas[p].id,
      concepto,
      importe,
      observaciones: concepto === 'Alquiler' ? 'Quinta, 2 noches' : '',
      creada: fecha,
    });
  }

  return {
    id: nuevoId(),
    nombre: 'Fin de semana en familia',
    fechaInicio: '2025-04-18',
    fechaFin: '2025-04-20',
    redondeo: 1000,
    tesoreroId: personas[0].id,
    foto: null,
    personas,
    comidas,
    compras,
    pagos: [],
  };
}
