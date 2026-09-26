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

const COMIDAS: [string, TipoComida, number, string, [string, number, string][]][] = [
  // fecha, tipo, cantidad de comensales, menú, compras [concepto, importe, hora]
  ['2025-04-18', 'almuerzo', 10, 'Asado', [['Carne', 40000, '11:10'], ['Verduras', 22500, '11:40']]],
  ['2025-04-18', 'cena', 15, 'Pastas', [['Pastas', 55000, '18:30'], ['Bebidas', 35000, '19:05'], ['Postres', 15000, '20:10']]],
  ['2025-04-19', 'desayuno', 12, 'Café con medialunas', [['Pan', 18000, '08:15'], ['Almacén', 30000, '08:40']]],
  ['2025-04-19', 'almuerzo', 20, 'Asado', [['Carne', 70000, '11:45'], ['Bebidas', 45000, '13:20'], ['Verduras', 25000, '15:10'], ['Postres', 20000, '17:30']]],
  ['2025-04-19', 'cena', 18, 'Pizzas', [['Pizzas', 96000, '20:00'], ['Bebidas', 50500, '20:15']]],
  ['2025-04-20', 'almuerzo', 16, 'Asado', [['Carne', 80000, '11:30'], ['Carbón / leña', 18000, '11:35'], ['Bebidas', 30000, '12:00']]],
];

/** Encuentro de ejemplo para probar la app sin cargar todo a mano. */
export function encuentroEjemplo(): Encuentro {
  const personas: Persona[] = NOMBRES.map((nombre, i) => ({
    id: nuevoId(),
    nombre,
    color: COLORES_PERSONA[i % COLORES_PERSONA.length],
  }));
  const comprador = personas[0];

  const comidas: Comida[] = [];
  const compras: Compra[] = [];
  COMIDAS.forEach(([fecha, tipo, cantidad, menu, lista], ci) => {
    // Rotamos quién asiste para que cada comida tenga gente distinta; el comprador va a todas.
    const ids = new Set<string>([comprador.id]);
    for (let k = 0; ids.size < cantidad; k++) ids.add(personas[1 + ((ci * 5 + k) % (personas.length - 1))].id);
    const comida: Comida = { id: nuevoId(), fecha, tipo, menu, asistentes: [...ids] };
    comidas.push(comida);
    for (const [concepto, importe, h] of lista) {
      compras.push({ id: nuevoId(), comidaId: comida.id, concepto, importe, observaciones: '', creada: `${fecha}T${h}:00` });
    }
  });

  // Gastos que no son de una comida: se reparten entre todos
  compras.push(
    {
      id: nuevoId(),
      comidaId: GASTOS_GENERALES,
      concepto: 'Alquiler',
      importe: 128000,
      observaciones: 'Quinta, 2 noches',
      creada: '2025-04-18T10:00:00',
    },
    {
      id: nuevoId(),
      comidaId: GASTOS_GENERALES,
      concepto: 'Nafta / viaje',
      importe: 32000,
      observaciones: '',
      creada: '2025-04-18T09:00:00',
    },
  );

  const encuentro: Encuentro = {
    id: nuevoId(),
    nombre: 'Fin de semana en familia',
    fechaInicio: '2025-04-18',
    fechaFin: '2025-04-20',
    redondeo: 1000,
    compradorId: comprador.id,
    foto: null,
    personas,
    comidas,
    compras,
    pagos: [],
  };

  // Algunos ya pagaron, para que se vea cómo queda la cobranza
  const pagos: Pago[] = resumenPersonas(encuentro)
    .filter((r) => !r.esComprador)
    .slice(0, 8)
    .map((r, i) => ({
      id: nuevoId(),
      personaId: r.persona.id,
      importe: r.aPagar,
      fecha: '2025-04-20',
      metodo: i % 3 === 0 ? 'efectivo' : 'transferencia',
    }));
  encuentro.pagos = pagos;
  return encuentro;
}
