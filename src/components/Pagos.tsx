import { Banknote, Landmark } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import type { ResumenPersona } from '../lib/calculos';
import { dinero, hoyISO, NOMBRE_METODO, nuevoId } from '../lib/formato';
import type { MetodoPago, Persona } from '../lib/types';
import { Avatar, Hoja, avisar, confirmar } from './ui';

/**
 * Registra que alguien arregló cuentas con quien maneja la plata:
 * si debía, que pagó; si puso de más, que se le devolvió. Pregunta si fue en efectivo o por transferencia.
 */
export function HojaPago({
  r,
  administrador,
  onCerrar,
}: {
  r: ResumenPersona;
  administrador: Persona | undefined;
  onCerrar: () => void;
}) {
  const { actualizar } = useEncuentro();
  const devolucion = r.saldo < 0;
  const importe = Math.abs(r.saldo);
  const quien = administrador?.nombre ?? 'quien maneja la plata';

  const registrar = (metodo: MetodoPago) => {
    actualizar((e) => {
      e.pagos.push({
        id: nuevoId(),
        personaId: r.persona.id,
        tipo: devolucion ? 'devolucion' : 'pago',
        importe,
        fecha: hoyISO(),
        metodo,
      });
    });
    onCerrar();
    avisar(
      devolucion
        ? `Se le devolvieron ${dinero(importe)} a ${r.persona.nombre}`
        : `${r.persona.nombre} pagó ${dinero(importe)} (${NOMBRE_METODO[metodo].toLowerCase()})`,
    );
  };

  return (
    <Hoja titulo={devolucion ? 'Registrar devolución' : 'Registrar pago'} onCerrar={onCerrar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <Avatar persona={r.persona} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{r.persona.nombre}</div>
          <div className="ayuda" style={{ marginTop: 1 }}>
            {devolucion ? `${quien} le devuelve lo que puso de más` : `Le paga a ${quien}`}
          </div>
        </div>
        <strong style={{ fontSize: 18, color: devolucion ? 'var(--azul)' : 'var(--verde-700)' }}>{dinero(importe)}</strong>
      </div>
      <span className="etiqueta" style={{ display: 'block', marginBottom: 10, fontSize: 13.5, fontWeight: 500 }}>
        {devolucion ? '¿Cómo se le devolvió?' : '¿Cómo pagó?'}
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

/** Quita los pagos y devoluciones registrados de una persona (vuelve a quedar pendiente). */
export function useDeshacerPagos() {
  const { actualizar } = useEncuentro();
  return async (persona: Persona) => {
    const ok = await confirmar(`Se van a quitar los pagos registrados de ${persona.nombre} y vuelve a quedar pendiente.`, {
      aceptar: 'Marcar como pendiente',
    });
    if (!ok) return;
    actualizar((e) => {
      e.pagos = e.pagos.filter((p) => p.personaId !== persona.id);
    });
    avisar(`${persona.nombre} quedó como pendiente`);
  };
}
