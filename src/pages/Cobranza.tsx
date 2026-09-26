import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Banknote, Check, CircleCheck, Hourglass, Landmark, Undo2, UserCheck } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenPersonas, transferenciasSugeridas, type Transferencia } from '../lib/calculos';
import { dinero, fechaCorta, hoyISO, NOMBRE_METODO, nuevoId } from '../lib/formato';
import type { MetodoPago } from '../lib/types';
import { Avatar, Fila, Hoja, Pantalla, avisar, confirmar } from '../components/ui';

export default function Cobranza() {
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'saldos' | 'transferencias'>('transferencias');

  const personas = resumenPersonas(encuentro).sort((a, b) => a.saldo - b.saldo);
  const transferencias = transferenciasSugeridas(personas.map((p) => ({ id: p.persona.id, saldo: p.saldo })));
  const nombre = (id: string) => encuentro.personas.find((p) => p.id === id)?.nombre ?? '?';

  const [pagando, setPagando] = useState<Transferencia | null>(null);

  const registrarPago = (t: Transferencia, metodo: MetodoPago) => {
    actualizar((e) => {
      e.pagos.push({ id: nuevoId(), deId: t.deId, aId: t.aId, importe: t.importe, fecha: hoyISO(), metodo });
    });
    setPagando(null);
    avisar(`Pago de ${nombre(t.deId)} registrado (${NOMBRE_METODO[metodo].toLowerCase()})`);
  };

  const pendiente = transferencias.reduce((s, t) => s + t.importe, 0);
  const porMetodo = (m: MetodoPago) =>
    encuentro.pagos.filter((p) => p.metodo === m).reduce((s, p) => s + p.importe, 0);
  const alDia = personas.filter((p) => Math.round(p.saldo) === 0).length;

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

      <div className="tiles compactas" style={{ marginBottom: 12 }}>
        <div className="tile amarillo">
          <Hourglass className="ico" size={22} />
          <div>
            <div className="etq">Pendiente</div>
            <div className="valor">{dinero(pendiente)}</div>
          </div>
        </div>
        <div className="tile verde">
          <UserCheck className="ico" size={22} />
          <div>
            <div className="etq">Personas al día</div>
            <div className="valor">
              {alDia} / {personas.length}
            </div>
          </div>
        </div>
        <div className="tile verde">
          <Banknote className="ico" size={22} />
          <div>
            <div className="etq">Pagado en efectivo</div>
            <div className="valor">{dinero(porMetodo('efectivo'))}</div>
          </div>
        </div>
        <div className="tile azul">
          <Landmark className="ico" size={22} />
          <div>
            <div className="etq">Por transferencia</div>
            <div className="valor">{dinero(porMetodo('transferencia'))}</div>
          </div>
        </div>
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
                  onClick={() => setPagando(t)}
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
                      <div className="sub">
                        {fechaCorta(p.fecha)}
                        {p.metodo && (
                          <>
                            {' '}
                            <span className={`chip ${p.metodo === 'efectivo' ? '' : 'azul'}`}>{NOMBRE_METODO[p.metodo]}</span>
                          </>
                        )}
                      </div>
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
      {pagando && (
        <Hoja titulo="Registrar pago" onCerrar={() => setPagando(null)}>
          <div className="transfer" style={{ padding: '4px 0 18px', borderBottom: 0 }}>
            <strong>{nombre(pagando.deId)}</strong>
            <ArrowRight size={16} color="var(--texto-3)" />
            <strong>{nombre(pagando.aId)}</strong>
            <span className="monto">{dinero(pagando.importe)}</span>
          </div>
          <span className="etiqueta" style={{ display: 'block', marginBottom: 10, fontSize: 13.5, fontWeight: 500 }}>
            ¿Cómo se pagó?
          </span>
          <div className="fila-flex">
            <button className="btn" onClick={() => registrarPago(pagando, 'efectivo')}>
              <Banknote size={20} /> Efectivo
            </button>
            <button className="btn" style={{ marginTop: 0 }} onClick={() => registrarPago(pagando, 'transferencia')}>
              <Landmark size={20} /> Transferencia
            </button>
          </div>
        </Hoja>
      )}
    </Pantalla>
  );
}
