import type { Encuentro, Estado } from './types';
import { resumenGeneral, resumenPersonas, tesoreroEfectivo, transferenciasSugeridas } from './calculos';
import { dinero, fechaCorta, nombreComida } from './formato';

/** Versión publicada dentro de claude.ai: sin descargas ni menú de compartir. */
export const ES_ARTIFACT = import.meta.env.MODE === 'artifact';

/** Resumen en texto plano, pensado para pegar en WhatsApp. */
export function textoResumen(enc: Encuentro): string {
  const general = resumenGeneral(enc);
  const personas = resumenPersonas(enc);
  const nombre = (id: string) => enc.personas.find((p) => p.id === id)?.nombre ?? '?';
  const transferencias = transferenciasSugeridas(personas.map((p) => ({ id: p.persona.id, saldo: p.saldo })));
  const tesorero = tesoreroEfectivo(enc);

  const lineas: string[] = [];
  lineas.push(`*${enc.nombre}*`);
  if (enc.fechaInicio) lineas.push(`${fechaCorta(enc.fechaInicio)} al ${fechaCorta(enc.fechaFin)}`);
  lineas.push('');
  lineas.push(`Gasto real: ${dinero(general.gastoReal)}`);
  lineas.push(`Total cobrado: ${dinero(general.recaudado)}`);
  lineas.push(`Fondo común: ${dinero(general.fondo)}${tesorero ? ` (lo guarda ${nombre(tesorero)})` : ''}`);
  lineas.push('');
  lineas.push('*Comidas*');
  for (const c of general.comidas) {
    lineas.push(
      `• ${nombreComida(c.comida)}: ${c.pagantes} comensales, ${dinero(c.gastoReal)} → ${dinero(c.cobroPorPersona)} c/u`,
    );
  }
  lineas.push('');
  lineas.push('*Quién paga a quién*');
  if (transferencias.length === 0) {
    lineas.push('¡Todo saldado! 🎉');
  } else {
    for (const t of transferencias) {
      lineas.push(`• ${nombre(t.deId)} → ${nombre(t.aId)}: ${dinero(t.importe)}`);
    }
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
    return datos as Estado;
  } catch {
    return null;
  }
}
