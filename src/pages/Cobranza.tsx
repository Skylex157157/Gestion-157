import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Banknote, Check, CircleCheck, Landmark, Undo2, UserCheck } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenCobranza, resumenPersonas, type ResumenPersona } from '../lib/calculos';
import { dinero, fechaCorta, NOMBRE_METODO } from '../lib/formato';
import { Avatar, Pantalla, Vacio } from '../components/ui';
import { HojaPago, useDeshacerPagos } from '../components/Pagos';

type Pestana = 'deben' | 'devolver' | 'alDia';

export default function Cobranza() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const deshacer = useDeshacerPagos();
  const [tab, setTab] = useState<Pestana>('deben');
  const [arreglando, setArreglando] = useState<ResumenPersona | null>(null);

  const personas = resumenPersonas(encuentro).sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre));
  const c = resumenCobranza(encuentro, personas);
  const administrador = encuentro.personas.find((p) => p.id === c.administradorId);
  const otros = personas.filter((p) => !p.esAdministrador);
  const listas: Record<Pestana, ResumenPersona[]> = {
    deben: otros.filter((p) => p.saldo > 0),
    devolver: otros.filter((p) => p.saldo < 0),
    alDia: otros.filter((p) => p.saldo === 0),
  };
  const lista = listas[tab];

  return (
    <Pantalla titulo="Cobranza" atras>
      {administrador && (
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar persona={administrador} />
          <div style={{ flex: 1 }}>
            <div className="ayuda" style={{ marginTop: 0 }}>
              Maneja la plata
            </div>
            <div style={{ fontWeight: 600, fontSize: 15.5 }}>{administrador.nombre}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="ayuda" style={{ marginTop: 0 }}>
              Personas al día
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {c.alDia} / {c.personas}
            </div>
          </div>
        </div>
      )}

      <div className="tiles compactas" style={{ marginBottom: 12 }}>
        <div className="tile amarillo">
          <ArrowDownLeft className="ico" size={22} />
          <div>
            <div className="etq">Falta cobrar</div>
            <div className="valor">{dinero(c.pendienteCobrar)}</div>
          </div>
        </div>
        <div className="tile azul">
          <ArrowUpRight className="ico" size={22} />
          <div>
            <div className="etq">Falta devolver</div>
            <div className="valor">{dinero(c.pendienteDevolver)}</div>
          </div>
        </div>
        <div className="tile verde">
          <Banknote className="ico" size={22} />
          <div>
            <div className="etq">Cobrado en efectivo</div>
            <div className="valor">{dinero(c.efectivo)}</div>
          </div>
        </div>
        <div className="tile verde">
          <Landmark className="ico" size={22} />
          <div>
            <div className="etq">Por transferencia</div>
            <div className="valor">{dinero(c.transferencia)}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'deben' ? 'activo' : ''} onClick={() => setTab('deben')}>
          Deben ({listas.deben.length})
        </button>
        <button className={tab === 'devolver' ? 'activo' : ''} onClick={() => setTab('devolver')}>
          A devolver ({listas.devolver.length})
        </button>
        <button className={tab === 'alDia' ? 'activo' : ''} onClick={() => setTab('alDia')}>
          Al día ({listas.alDia.length})
        </button>
      </div>

      <div className="lista">
        {lista.length === 0 && (
          <Vacio icono={tab === 'alDia' ? <UserCheck size={36} /> : <CircleCheck size={36} className="positivo" />}>
            {tab === 'deben'
              ? 'Nadie debe nada.'
              : tab === 'devolver'
                ? 'No hay que devolverle plata a nadie.'
                : 'Todavía nadie está al día.'}
          </Vacio>
        )}
        {lista.map((p) => {
          const ultimo = p.pagos[p.pagos.length - 1];
          return (
            <div className="fila" key={p.persona.id}>
              <button className="fila-link" onClick={() => navigate(`/personas/${p.persona.id}`)}>
                <Avatar persona={p.persona} tam="chico" />
                <div className="cuerpo">
                  <div className="titulo">{p.persona.nombre}</div>
                  <div className="sub">
                    {tab === 'alDia'
                      ? ultimo
                        ? `${NOMBRE_METODO[ultimo.metodo]} · ${fechaCorta(ultimo.fecha)}`
                        : 'Sus compras cubren justo su parte'
                      : p.compras > 0
                        ? `Le toca ${dinero(p.aPagar)} · compró ${dinero(p.compras)}`
                        : `Le toca ${dinero(p.aPagar)}`}
                  </div>
                </div>
                {tab !== 'alDia' && (
                  <div className="monto" style={{ color: tab === 'deben' ? 'var(--rojo)' : 'var(--azul)' }}>
                    {dinero(Math.abs(p.saldo))}
                  </div>
                )}
              </button>
              {tab === 'alDia' ? (
                p.pagos.length > 0 && (
                  <button
                    className="icon-btn"
                    aria-label={`Deshacer pagos de ${p.persona.nombre}`}
                    title="Marcar como pendiente"
                    onClick={() => deshacer(p.persona)}
                    style={{ color: 'var(--texto-3)', width: 34, height: 34 }}
                  >
                    <Undo2 size={18} />
                  </button>
                )
              ) : (
                <button
                  className="pagado-btn"
                  aria-label={tab === 'deben' ? `Marcar como pagado: ${p.persona.nombre}` : `Marcar como devuelto: ${p.persona.nombre}`}
                  title={tab === 'deben' ? 'Marcar como pagado' : 'Marcar como devuelto'}
                  onClick={() => setArreglando(p)}
                >
                  <Check size={18} strokeWidth={2.6} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {arreglando && <HojaPago r={arreglando} administrador={administrador} onCerrar={() => setArreglando(null)} />}
    </Pantalla>
  );
}
