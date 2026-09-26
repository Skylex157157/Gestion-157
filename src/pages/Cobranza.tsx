import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CircleCheck, Undo2 } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenPersonas, transferenciasSugeridas, type Transferencia } from '../lib/calculos';
import { dinero, fechaCorta, hoyISO, nuevoId } from '../lib/formato';
import { Avatar, Fila, Pantalla, avisar, confirmar } from '../components/ui';

export default function Cobranza() {
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'saldos' | 'transferencias'>('transferencias');

  const personas = resumenPersonas(encuentro).sort((a, b) => a.saldo - b.saldo);
  const transferencias = transferenciasSugeridas(personas.map((p) => ({ id: p.persona.id, saldo: p.saldo })));
  const nombre = (id: string) => encuentro.personas.find((p) => p.id === id)?.nombre ?? '?';

  const marcarPagado = (t: Transferencia) => {
    actualizar((e) => {
      e.pagos.push({ id: nuevoId(), deId: t.deId, aId: t.aId, importe: t.importe, fecha: hoyISO() });
    });
    avisar(`Pago de ${nombre(t.deId)} registrado`);
  };

  const deshacer = async (id: string) => {
    if (!(await confirmar('El pago se va a quitar y la deuda vuelve a aparecer.', { aceptar: 'Deshacer pago' }))) return;
    actualizar((e) => {
      e.pagos = e.pagos.filter((p) => p.id !== id);
    });
  };

  return (
    <Pantalla titulo="Cobranza" atras>
      <div className="tabs">
        <button className={tab === 'saldos' ? 'activo' : ''} onClick={() => setTab('saldos')}>
          Saldos individuales
        </button>
        <button className={tab === 'transferencias' ? 'activo' : ''} onClick={() => setTab('transferencias')}>
          Quién paga a quién
        </button>
      </div>

      {tab === 'saldos' ? (
        <div className="lista">
          {personas.length === 0 && <div className="vacio">No hay personas.</div>}
          {personas.map((p) => {
            const s = Math.round(p.saldo);
            return (
              <Fila key={p.persona.id} onClick={() => navigate(`/personas/${p.persona.id}`)}>
                <Avatar persona={p.persona} tam="chico" />
                <div className="cuerpo">
                  <div className="titulo">{p.persona.nombre}</div>
                  <div className="sub">{s < 0 ? 'Debe pagar' : s > 0 ? 'Le tienen que pagar' : 'Saldado'}</div>
                </div>
                <div className={`monto ${s < 0 ? 'negativo' : s > 0 ? 'positivo' : ''}`}>
                  {s > 0 ? '+' : ''}
                  {dinero(s)}
                </div>
              </Fila>
            );
          })}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-pad" style={{ paddingBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Transferencias sugeridas</div>
              <div className="ayuda">
                Para minimizar la cantidad de movimientos entre personas. Tocá ✓ cuando se haga la transferencia.
              </div>
            </div>
            {transferencias.map((t) => (
              <div className="transfer con-accion" key={t.deId + t.aId}>
                <span>{nombre(t.deId)}</span>
                <ArrowRight size={16} color="var(--texto-3)" />
                <span>{nombre(t.aId)}</span>
                <span className="monto">{dinero(t.importe)}</span>
                <button
                  className="pagado-btn"
                  aria-label={`Marcar como pagado: ${nombre(t.deId)} a ${nombre(t.aId)}`}
                  title="Marcar como pagado"
                  onClick={() => marcarPagado(t)}
                >
                  <Check size={18} strokeWidth={2.6} />
                </button>
              </div>
            ))}
          </div>

          <div className="aviso verde">
            <CircleCheck size={22} />
            <span>
              {transferencias.length === 0
                ? '¡Todo saldado! No hace falta ninguna transferencia.'
                : `Con ${transferencias.length} ${transferencias.length === 1 ? 'transferencia' : 'transferencias'} se salda todo el grupo.`}
            </span>
          </div>

          {encuentro.pagos.length > 0 && (
            <>
              <div className="seccion-titulo">Pagos ya realizados</div>
              <div className="lista">
                {[...encuentro.pagos].reverse().map((p) => (
                  <div className="fila" key={p.id}>
                    <div className="cuerpo">
                      <div className="titulo">
                        {nombre(p.deId)} → {nombre(p.aId)}
                      </div>
                      <div className="sub">{fechaCorta(p.fecha)}</div>
                    </div>
                    <div className="monto positivo">{dinero(p.importe)}</div>
                    <button className="icon-btn" aria-label="Deshacer pago" onClick={() => deshacer(p.id)} style={{ color: 'var(--texto-3)' }}>
                      <Undo2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Pantalla>
  );
}
