import type { Comida, MetodoPago, TipoComida } from './types';

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export function dinero(valor: number): string {
  const redondeado = Math.round(valor);
  const signo = redondeado < 0 ? '-' : '';
  return `${signo}$ ${numero.format(Math.abs(redondeado))}`;
}

export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_LARGOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function aFecha(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** "Vie 18/04" */
export function fechaCorta(iso: string): string {
  if (!iso) return '';
  const f = aFecha(iso);
  return `${DIAS_CORTOS[f.getDay()]} ${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
}

/** "Sábado 19/04" */
export function fechaLarga(iso: string): string {
  if (!iso) return '';
  const f = aFecha(iso);
  return `${DIAS_LARGOS[f.getDay()]} ${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`;
}

export function hoyISO(): string {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

export function hora(isoTimestamp: string): string {
  const f = new Date(isoTimestamp);
  return `${String(f.getHours()).padStart(2, '0')}:${String(f.getMinutes()).padStart(2, '0')}`;
}

export const NOMBRE_TIPO: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};

export const TIPOS_COMIDA: TipoComida[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

/** "Vie. 18/04 - Almuerzo" */
export function nombreComida(c: Comida): string {
  const [dia, resto] = fechaCorta(c.fecha).split(' ');
  return `${dia}. ${resto} - ${NOMBRE_TIPO[c.tipo]}`;
}

/** "Vie. Almuerzo" */
export function nombreComidaCorto(c: Comida): string {
  return `${fechaCorta(c.fecha).split(' ')[0]}. ${NOMBRE_TIPO[c.tipo]}`;
}

export const CONCEPTOS = [
  'Carne',
  'Bebidas',
  'Verduras',
  'Postres',
  'Pan',
  'Almacén',
  'Fiambre',
  'Hielo',
  'Carbón / leña',
  'Descartables',
  'Nafta / viaje',
  'Alquiler',
  'Limpieza',
  'Otros',
];

export const COLORES_PERSONA = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** Convierte "70.000" / "70000" / "$ 70.000" en 70000. */
export function parsearImporte(texto: string): number {
  const limpio = texto.replace(/[^\d]/g, '');
  return limpio ? Number(limpio) : 0;
}

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};
