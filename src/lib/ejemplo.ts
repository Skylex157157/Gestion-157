import {
  GASTOS_GENERALES,
  type Comida,
  type Compra,
  type Encuentro,
  type Pago,
  type Persona,
  type TipoComida,
} from './types';
import { COLORES_PERSONA, nuevoId } from './formato';
import { resumenPersonas } from './calculos';

const NOMBRES = [
  'Juan Pérez',
  'María López',
  'Carlos Gómez',
  'Ana Torres',
  'Luis Fernández',
  'Sofía Rodríguez',
  'Pedro Martínez',
  'Lucía Sánchez',
  'Javier Díaz',
  'Valentina Pérez',
  'Martín Romero',
  'Camila Álvarez',
  'Diego Ruiz',
  'Florencia Castro',
  'Nicolás Herrera',
  'Julieta Morales',
  'Tomás Silva',
  'Agustina Ríos',
  'Federico Molina',
  'Carolina Vega',
  'Gustavo Medina',
  'Paula Suárez',
  'Ricardo Ortiz',
  'Laura Giménez',
  'Marcelo Acosta',
  'Silvia Benítez',
  'Hernán Rojas',
  'Mónica Flores',
  'Esteban Paz',
  'Rocío Luna',
  'Andrés Ponce',
  'Natalia Ibarra',
];

const COMIDAS: [string, TipoComida, number, string, [number, string, number, string][]][] = [
  // fecha, tipo, cantidad de comensales, menú, compras [quién, qué, importe, hora]
  ['2025-04-18', 'almuerzo', 10, 'Asado', [[0, 'Carne y chorizos para el asado', 40000, '11:10'], [2, 'Verduras para ensalada', 22500, '11:40']]],
  ['2025-04-18', 'cena', 15, 'Pastas', [[1, 'Fideos y salsa', 55000, '18:30'], [4, 'Bebidas (vino y gaseosas)', 35000, '19:05'], [7, 'Helado de postre', 15000, '20:10']]],
  ['2025-04-19', 'desayuno', 12, 'Café con medialunas', [[5, 'Medialunas y pan', 18000, '08:15'], [3, 'Café, leche y azúcar', 30000, '08:40']]],
  ['2025-04-19', 'almuerzo', 20, 'Asado', [[0, 'Carne para el asado', 70000, '11:45'], [1, 'Bebidas', 45000, '13:20'], [2, 'Verduras', 25000, '15:10'], [3, 'Flan y dulce de leche', 20000, '17:30']]],
  ['2025-04-19', 'cena', 18, 'Pizzas', [[6, 'Pizzas', 96000, '20:00'], [8, 'Bebidas', 50500, '20:15']]],
  ['2025-04-20', 'almuerzo', 16, 'Asado', [[9, 'Carne para el asado', 80000, '11:30'], [4, 'Carbón y leña', 18000, '11:35'], [10, 'Bebidas', 30000, '12:00']]],
];

/** Encuentro de ejemplo para probar la app sin cargar todo a mano. */
export function encuentroEjemplo(): Encuentro {
  const personas: Persona[] = NOMBRES.map((nombre, i) => ({
    id: nuevoId(),
    nombre,
    color: COLORES_PERSONA[i % COLORES_PERSONA.length],
  }));
  const administrador = personas[0];

  const comidas: Comida[] = [];
  const compras: Compra[] = [];
  COMIDAS.forEach(([fecha, tipo, cantidad, menu, lista], ci) => {
    // Rotamos quién asiste para que cada comida tenga gente distinta; los que compraron siempre van.
    const ids = new Set<string>(lista.map(([p]) => personas[p].id));
    for (let k = 0; ids.size < cantidad; k++) ids.add(personas[(ci * 5 + k) % personas.length].id);
    const comida: Comida = { id: nuevoId(), fecha, tipo, menu, asistentes: [...ids] };
    comidas.push(comida);
    for (const [p, concepto, importe, h] of lista) {
      compras.push({
        id: nuevoId(),
        personaId: personas[p].id,
        comidaId: comida.id,
        concepto,
        importe,
        creada: `${fecha}T${h}:00`,
      });
    }
  });

  // Gastos que no son de una comida: se reparten entre todos
  compras.push(
    {
      id: nuevoId(),
      personaId: administrador.id,
      comidaId: GASTOS_GENERALES,
      concepto: 'Alquiler de la quinta (2 noches)',
      importe: 128000,
      creada: '2025-04-18T10:00:00',
    },
    {
      id: nuevoId(),
      personaId: personas[2].id,
      comidaId: GASTOS_GENERALES,
      concepto: 'Nafta del viaje',
      importe: 34000,
      creada: '2025-04-18T09:00:00',
    },
  );

  const encuentro: Encuentro = {
    id: nuevoId(),
    nombre: 'Fin de semana en familia',
    fechaInicio: '2025-04-18',
    fechaFin: '2025-04-20',
    redondeo: 1000,
    administradorId: administrador.id,
    foto: null,
    personas,
    comidas,
    compras,
    pagos: [],
  };

  // Algunos ya arreglaron cuentas, para que se vea cómo queda la cobranza (quien maneja la plata queda pendiente)
  const resumen = resumenPersonas(encuentro).filter((r) => !r.esAdministrador);
  const deudores = resumen.filter((r) => r.saldo > 0).slice(3, 11);
  const acreedores = resumen.filter((r) => r.saldo < 0).slice(0, 1);
  encuentro.pagos = [
    ...deudores.map(
      (r, i): Pago => ({
        id: nuevoId(),
        personaId: r.persona.id,
        tipo: 'pago',
        importe: r.saldo,
        fecha: '2025-04-20',
        metodo: i % 3 === 0 ? 'efectivo' : 'transferencia',
      }),
    ),
    ...acreedores.map(
      (r): Pago => ({
        id: nuevoId(),
        personaId: r.persona.id,
        tipo: 'devolucion',
        importe: -r.saldo,
        fecha: '2025-04-20',
        metodo: 'transferencia',
      }),
    ),
  ];
  return encuentro;
}
