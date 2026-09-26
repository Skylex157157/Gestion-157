import type { Encuentro, Estado } from './types';
import { migrarEstado } from './store';
import { compradorEfectivo, resumenGeneral, resumenPersonas } from './calculos';
import { dinero, fechaCorta, nombreComida } from './formato';

/** Versión publicada dentro de claude.ai: sin descargas ni menú de compartir. */
export const ES_ARTIFACT = import.meta.env.MODE === 'artifact';

/** Resumen en texto plano, pensado para pegar en WhatsApp. */
export function textoResumen(enc: Encuentro): string {
  const general = resumenGeneral(enc);
  const personas = resumenPersonas(enc);
  const compradorId = compradorEfectivo(enc);
  const comprador = enc.personas.find((p) => p.id === compradorId)?.nombre;

  const lineas: string[] = [];
  lineas.push(`*${enc.nombre}*`);
  if (enc.fechaInicio) lineas.push(`${fechaCorta(enc.fechaInicio)} al ${fechaCorta(enc.fechaFin)}`);
  lineas.push('');
  lineas.push(`Gasto real: ${dinero(general.gastoReal)}`);
  if (general.gastosGenerales > 0) lineas.push(`  (incluye ${dinero(general.gastosGenerales)} de gastos generales)`);
  lineas.push(`Total cobrado: ${dinero(general.recaudado)}`);
  lineas.push(`Fondo común: ${dinero(general.fondo)}`);
  lineas.push('');
  lineas.push('*Comidas*');
  for (const c of general.comidas) {
    lineas.push(
      `• ${nombreComida(c.comida)}: ${c.comensales} comensales, ${dinero(c.gastoReal)} → ${dinero(c.cobroPorPersona)} c/u`,
    );
  }
  lineas.push('');
  lineas.push(comprador ? `*Cada uno le paga a ${comprador}*` : '*Cuánto paga cada uno*');
  for (const p of [...personas].sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre))) {
    if (p.esComprador) continue;
    const estado = p.pendiente === 0 ? ' ✅ pagado' : p.pagado > 0 ? ` (falta ${dinero(p.pendiente)})` : '';
    lineas.push(`• ${p.persona.nombre}: ${dinero(p.aPagar)}${estado}`);
  }
  return lineas.join('\n');
}

export async function compartirTexto(titulo: string, texto: string): Promise<'compartido' | 'copiado' | 'error'> {
  try {
    // Dentro de claude.ai el menú de compartir del sistema no está disponible
    if (navigator.share && !ES_ARTIFACT) {
      await navigator.share({ title: titulo, text: texto });
      return 'compartido';
    }
  } catch (e) {
    if ((e as DOMException)?.name === 'AbortError') return 'compartido';
  }
  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'error';
  }
}

export function descargarArchivo(nombre: string, contenido: string, tipo = 'application/json') {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function copiaDeSeguridad(estado: Estado): string {
  return JSON.stringify(estado, null, 2);
}

/** Valida un archivo de copia de seguridad. Devuelve null si no es válido. */
export function leerCopia(texto: string): Estado | null {
  try {
    const datos = JSON.parse(texto);
    if (datos?.version !== 1 || !Array.isArray(datos.encuentros)) return null;
    for (const e of datos.encuentros) {
      if (
        typeof e?.id !== 'string' ||
        !Array.isArray(e.personas) ||
        !Array.isArray(e.comidas) ||
        !Array.isArray(e.compras) ||
        !Array.isArray(e.pagos)
      ) {
        return null;
      }
    }
    return migrarEstado(datos as Estado);
  } catch {
    return null;
  }
}
