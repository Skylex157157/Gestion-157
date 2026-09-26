import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, PiggyBank, ReceiptText, ShoppingCart, Trash2 } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { ordenarComidas, resumenCobranza, resumenComida, resumenGeneral, resumenPersonas } from '../lib/calculos';
import { dinero, fechaCorta, NOMBRE_METODO, nombreComida } from '../lib/formato';
import { Avatar, Fila, IconoComida, KV, Pantalla, confirmar } from '../components/ui';
import { HojaPago, useDeshacerPagos } from '../components/Pagos';
import { FormPersona } from './Personas';

export default function LiquidacionPersona() {
  const { id } = useParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const deshacer = useDeshacerPagos();
  const [tab, setTab] = useState<'resumen' | 'detalle'>('resumen');
  const [editando, setEditando] = useState(false);
  const [pagando, setPagando] = useState(false);

  const todos = resumenPersonas(encuentro);
  const r = todos.find((x) => x.persona.id === id);
  if (!r) return <Navigate to="/personas" replace />;
  const { persona } = r;
  const cobranza = resumenCobranza(encuentro, todos);
  const comprador = encuentro.personas.find((p) => p.id === cobranza.compradorId);
  const comidas = ordenarComidas(encuentro.comidas).filter((c) => c.asistentes.includes(persona.id));

  const eliminar = async () => {
    const avisos = [`Se va a borrar a ${persona.nombre} del encuentro.`];
    if (r.pagos.length) avisos.push('También se borran sus pagos registrados.');
    if (r.esComprador) avisos.push('Es quien compra todo: después elegí a otra persona en Editar encuentro.');
    if (!(await confirmar(avisos.join(' '), { aceptar: 'Borrar persona' }))) return;
    actualizar((e) => {
      e.personas = e.personas.filter((p) => p.id !== persona.id);
      e.comidas.forEach((c) => (c.asistentes = c.asistentes.filter((x) => x !== persona.id)));
      e.pagos = e.pagos.filter((p) => p.personaId !== persona.id);
      if (e.compradorId === persona.id) e.compradorId = null;
    });
    navigate('/personas', { replace: true });
  };

  return (
    <Pantalla
      titulo="Liquidación por persona"
      atras
      acciones={
        <button className="icon-btn" aria-label="Editar persona" onClick={() => setEditando(true)}>
          <Pencil size={20} />
        </button>
      }
    >
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar persona={persona} tam="grande" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{persona.nombre}</div>
          <div style={{ color: 'var(--texto-2)', fontSize: 13.5 }}>Comidas: {r.comidas}</div>
        </div>
        {r.esComprador && (
          <span className="chip">
            <ShoppingCart size={12} style={{ verticalAlign: -1 }} /> Compra todo
          </span>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'resumen' ? 'activo' : ''} onClick={() => setTab('resumen')}>
          Resumen
        </button>
        <button className={tab === 'detalle' ? 'activo' : ''} onClick={() => setTab('detalle')}>
          Detalle por comida
        </button>
      </div>

      {tab === 'resumen' ? (
        <>
          <div className="lista">
            <KV k="Costo real de sus comidas" v={dinero(r.costoReal - r.generales)} />
            <KV k="Cobrado por sus comidas" v={dinero(r.aPagar - r.generales)} />
            {r.generales > 0 && <KV k="Su parte de gastos generales" v={dinero(r.generales)} />}
            <KV k={r.esComprador ? 'Su propio consumo' : 'Total a pagar'} v={dinero(r.aPagar)} clase="grande" />
          </div>

          {r.esComprador ? (
            <ResumenComprador cobranza={cobranza} fondo={resumenGeneral(encuentro).fondo} gasto={resumenGeneral(encuentro).gastoReal} />
          ) : (
            <EstadoPago
              r={r}
              comprador={comprador?.nombre}
              onPagar={() => setPagando(true)}
              onDeshacer={() => deshacer(persona)}
            />
          )}

          <div
            className="card card-pad"
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--verde-50)' }}
          >
            <PiggyBank size={28} color="var(--verde-600)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Fondo común generado</div>
              <div className="ayuda" style={{ marginTop: 1 }}>
                (por redondeo en sus comidas)
              </div>
            </div>
            <strong>{dinero(r.fondoGenerado)}</strong>
          </div>

          <button className="btn borde" onClick={() => setTab('detalle')}>
            Ver detalle de comidas
          </button>
          <button className="btn peligro" onClick={eliminar}>
            <Trash2 size={18} /> Borrar persona
          </button>
        </>
      ) : (
        <>
          <div className="seccion-titulo">Comidas</div>
          <div className="lista">
            {comidas.length === 0 && <div className="vacio">No está anotada en ninguna comida.</div>}
            {comidas.map((c) => {
              const rc = resumenComida(encuentro, c);
              return (
                <Fila key={c.id} onClick={() => navigate(`/comidas/${c.id}`)} chevron>
                  <IconoComida tipo={c.tipo} tam={20} />
                  <div className="cuerpo">
                    <div className="titulo">{nombreComida(c)}</div>
                    <div className="sub">Costo real {dinero(rc.comensales ? rc.gastoReal / rc.comensales : 0)}</div>
                  </div>
                  <div className="monto">{dinero(rc.cobroPorPersona)}</div>
                </Fila>
              );
            })}
            {r.generales > 0 && (
              <Fila onClick={() => navigate('/resumen/generales')} chevron>
                <ReceiptText size={20} color="var(--texto-2)" />
                <div className="cuerpo">
                  <div className="titulo">Gastos generales</div>
                  <div className="sub">Su parte, repartida entre todos</div>
                </div>
                <div className="monto">{dinero(r.generales)}</div>
              </Fila>
            )}
            <div className="kv destacado">
              <span>Total</span>
              <span className="v">{dinero(r.aPagar)}</span>
            </div>
          </div>

          {r.pagos.length > 0 && (
            <>
              <div className="seccion-titulo">Pagos</div>
              <div className="lista">
                {r.pagos.map((p) => (
                  <div className="fila" key={p.id}>
                    <div className="cuerpo">
                      <div className="titulo">{NOMBRE_METODO[p.metodo]}</div>
                      <div className="sub">{fechaCorta(p.fecha)}</div>
                    </div>
                    <div className="monto positivo">{dinero(p.importe)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {editando && <FormPersona persona={persona} onCerrar={() => setEditando(false)} />}
      {pagando && (
        <HojaPago persona={persona} importe={r.pendiente} comprador={comprador} onCerrar={() => setPagando(false)} />
      )}
    </Pantalla>
  );
}

function EstadoPago({
  r,
  comprador,
  onPagar,
  onDeshacer,
}: {
  r: ReturnType<typeof resumenPersonas>[number];
  comprador: string | undefined;
  onPagar: () => void;
  onDeshacer: () => void;
}) {
  if (r.pendiente > 0) {
    return (
      <div className="card card-pad" style={{ background: 'var(--rojo-100)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--rojo)' }}>Debe pagar</div>
            <div className="ayuda" style={{ marginTop: 1, color: '#8a2525' }}>
              {comprador ? `A ${comprador}` : 'A quien compra'}
              {r.pagado > 0 && ` · ya pagó ${dinero(r.pagado)}`}
            </div>
          </div>
          <strong style={{ fontSize: 20, color: 'var(--rojo)' }}>{dinero(r.pendiente)}</strong>
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={onPagar}>
          <Check size={20} /> Marcar como pagado
        </button>
      </div>
    );
  }
  const metodos = [...new Set(r.pagos.map((p) => NOMBRE_METODO[p.metodo]))].join(' + ');
  return (
    <div className="card card-pad" style={{ background: 'var(--verde-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--verde-700)' }}>{r.pagos.length ? 'Pagó todo' : 'No debe nada'}</div>
          {r.pagos.length > 0 && (
            <div className="ayuda" style={{ marginTop: 1, color: 'var(--verde-800)' }}>
              {metodos} · {fechaCorta(r.pagos[r.pagos.length - 1].fecha)}
            </div>
          )}
        </div>
        <strong style={{ fontSize: 20, color: 'var(--verde-700)' }}>{dinero(r.pagado)}</strong>
      </div>
      {r.pagos.length > 0 && (
        <button className="link-btn" style={{ marginTop: 10 }} onClick={onDeshacer}>
          Marcar como pendiente
        </button>
      )}
    </div>
  );
}

function ResumenComprador({
  cobranza,
  gasto,
  fondo,
}: {
  cobranza: ReturnType<typeof resumenCobranza>;
  gasto: number;
  fondo: number;
}) {
  const navigate = useNavigate();
  return (
    <>
      <div className="seccion-titulo">Como comprador</div>
      <div className="lista">
        <KV k="Gastó en total" v={dinero(gasto)} />
        <KV k="Le tienen que pagar" v={dinero(cobranza.totalACobrar)} />
        <KV k="Ya cobró" v={dinero(cobranza.cobrado)} />
        <KV k="Falta cobrar" v={dinero(cobranza.pendiente)} clase={cobranza.pendiente > 0 ? 'alerta' : 'destacado'} />
        <KV k="Se queda de fondo común" v={dinero(fondo)} />
      </div>
      <button className="btn" onClick={() => navigate('/resumen/cobranza')}>
        Ver cobranza
      </button>
    </>
  );
}
