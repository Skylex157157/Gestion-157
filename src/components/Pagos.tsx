import { Banknote, Landmark } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { dinero, hoyISO, NOMBRE_METODO, nuevoId } from '../lib/formato';
import type { MetodoPago, Persona } from '../lib/types';
import { Avatar, Hoja, avisar, confirmar } from './ui';

/** Pregunta cómo pagó (efectivo o transferencia) y registra el pago de lo que debe. */
export function HojaPago({
  persona,
  importe,
  comprador,
  onCerrar,
}: {
  persona: Persona;
  importe: number;
  comprador: Persona | undefined;
  onCerrar: () => void;
}) {
  const { actualizar } = useEncuentro();

  const registrar = (metodo: MetodoPago) => {
    actualizar((e) => {
      e.pagos.push({ id: nuevoId(), personaId: persona.id, importe, fecha: hoyISO(), metodo });
    });
    onCerrar();
    avisar(`${persona.nombre} pagó ${dinero(importe)} (${NOMBRE_METODO[metodo].toLowerCase()})`);
  };

  return (
    <Hoja titulo="Registrar pago" onCerrar={onCerrar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Avatar persona={persona} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{persona.nombre}</div>
          <div className="ayuda" style={{ marginTop: 1 }}>
            Le paga a {comprador?.nombre ?? 'quien compra'}
          </div>
        </div>
        <strong style={{ fontSize: 18, color: 'var(--verde-700)' }}>{dinero(importe)}</strong>
      </div>
      <span className="etiqueta" style={{ display: 'block', marginBottom: 10, fontSize: 13.5, fontWeight: 500 }}>
        ¿Cómo pagó?
      </span>
      <div className="fila-flex">
        <button className="btn" onClick={() => registrar('efectivo')}>
          <Banknote size={20} /> Efectivo
        </button>
        <button className="btn" style={{ marginTop: 0 }} onClick={() => registrar('transferencia')}>
          <Landmark size={20} /> Transferencia
        </button>
      </div>
    </Hoja>
  );
}

/** Quita los pagos registrados de una persona (vuelve a quedar pendiente). */
export function useDeshacerPagos() {
  const { actualizar } = useEncuentro();
  return async (persona: Persona) => {
    const ok = await confirmar(`Se van a quitar los pagos de ${persona.nombre} y vuelve a quedar como pendiente.`, {
      aceptar: 'Marcar como pendiente',
    });
    if (!ok) return;
    actualizar((e) => {
      e.pagos = e.pagos.filter((p) => p.personaId !== persona.id);
    });
    avisar(`${persona.nombre} quedó como pendiente`);
  };
}
