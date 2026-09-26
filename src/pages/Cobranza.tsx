import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Check, CircleCheck, Hourglass, Landmark, Undo2, UserCheck, Wallet } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenCobranza, resumenPersonas, type ResumenPersona } from '../lib/calculos';
import { dinero, fechaCorta, NOMBRE_METODO } from '../lib/formato';
import { Avatar, Pantalla, Vacio } from '../components/ui';
import { HojaPago, useDeshacerPagos } from '../components/Pagos';

export default function Cobranza() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const deshacer = useDeshacerPagos();
  const [tab, setTab] = useState<'pendientes' | 'pagaron'>('pendientes');
  const [pagando, setPagando] = useState<ResumenPersona | null>(null);

  const personas = resumenPersonas(encuentro).sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre));
  const c = resumenCobranza(encuentro, personas);
  const comprador = encuentro.personas.find((p) => p.id === c.compradorId);
  const deudores = personas.filter((p) => !p.esComprador);
  const pendientes = deudores.filter((p) => p.pendiente > 0);
  const pagaron = deudores.filter((p) => p.pendiente === 0);

  return (
    <Pantalla titulo="Cobranza" atras>
      {comprador && (
        <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar persona={comprador} />
          <div style={{ flex: 1 }}>
            <div className="ayuda" style={{ marginTop: 0 }}>
              Todos le pagan a
            </div>
            <div style={{ fontWeight: 600, fontSize: 15.5 }}>{comprador.nombre}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="ayuda" style={{ marginTop: 0 }}>
              Total a cobrar
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{dinero(c.totalACobrar)}</div>
          </div>
        </div>
      )}

      <div className="tiles compactas" style={{ marginBottom: 12 }}>
        <div className="tile amarillo">
          <Hourglass className="ico" size={22} />
          <div>
            <div className="etq">Pendiente</div>
            <div className="valor">{dinero(c.pendiente)}</div>
          </div>
        </div>
        <div className="tile verde">
          <UserCheck className="ico" size={22} />
          <div>
            <div className="etq">Ya pagaron</div>
            <div className="valor">
              {c.alDia} / {c.deudores}
            </div>
          </div>
        </div>
        <div className="tile verde">
          <Banknote className="ico" size={22} />
          <div>
            <div className="etq">En efectivo</div>
            <div className="valor">{dinero(c.efectivo)}</div>
          </div>
        </div>
        <div className="tile azul">
          <Landmark className="ico" size={22} />
          <div>
            <div className="etq">Por transferencia</div>
            <div className="valor">{dinero(c.transferencia)}</div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === 'pendientes' ? 'activo' : ''} onClick={() => setTab('pendientes')}>
          Pendientes ({pendientes.length})
        </button>
        <button className={tab === 'pagaron' ? 'activo' : ''} onClick={() => setTab('pagaron')}>
          Pagaron ({pagaron.length})
        </button>
      </div>

      {tab === 'pendientes' ? (
        <div className="lista">
          {pendientes.length === 0 && (
            <Vacio icono={<CircleCheck size={36} className="positivo" />}>
              {deudores.length ? '¡Todos pagaron!' : 'Todavía no hay personas que deban.'}
            </Vacio>
          )}
          {pendientes.map((p) => (
            <div className="fila" key={p.persona.id}>
              <button className="fila-link" onClick={() => navigate(`/personas/${p.persona.id}`)}>
                <Avatar persona={p.persona} tam="chico" />
                <div className="cuerpo">
                  <div className="titulo">{p.persona.nombre}</div>
                  <div className="sub">{p.pagado > 0 ? `Pagó ${dinero(p.pagado)}, falta el resto` : 'Pendiente'}</div>
                </div>
                <div className="monto negativo">{dinero(p.pendiente)}</div>
              </button>
              <button
                className="pagado-btn"
                aria-label={`Marcar como pagado: ${p.persona.nombre}`}
                title="Marcar como pagado"
                onClick={() => setPagando(p)}
              >
                <Check size={18} strokeWidth={2.6} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="lista">
          {pagaron.length === 0 && <Vacio icono={<Wallet size={36} />}>Todavía nadie pagó.</Vacio>}
          {pagaron.map((p) => {
            const metodos = [...new Set(p.pagos.map((x) => NOMBRE_METODO[x.metodo]))].join(' + ');
            const ultimo = p.pagos[p.pagos.length - 1];
            return (
              <div className="fila" key={p.persona.id}>
                <button className="fila-link" onClick={() => navigate(`/personas/${p.persona.id}`)}>
                  <Avatar persona={p.persona} tam="chico" />
                  <div className="cuerpo">
                    <div className="titulo">{p.persona.nombre}</div>
                    <div className="sub">
                      {ultimo ? `${metodos} · ${fechaCorta(ultimo.fecha)}` : 'No debe nada'}
                    </div>
                  </div>
                  <div className="monto positivo">{dinero(p.pagado)}</div>
                </button>
                {p.pagos.length > 0 && (
                  <button
                    className="icon-btn"
                    aria-label={`Deshacer pago de ${p.persona.nombre}`}
                    title="Marcar como pendiente"
                    onClick={() => deshacer(p.persona)}
                    style={{ color: 'var(--texto-3)', width: 34, height: 34 }}
                  >
                    <Undo2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagando && (
        <HojaPago
          persona={pagando.persona}
          importe={pagando.pendiente}
          comprador={comprador}
          onCerrar={() => setPagando(null)}
        />
      )}
    </Pantalla>
  );
}
