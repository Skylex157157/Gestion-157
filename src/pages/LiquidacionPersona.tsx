import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Pencil, PiggyBank, ReceiptText, Trash2, Wallet } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import {
  ordenarComidas,
  resumenCobranza,
  resumenComida,
  resumenGeneral,
  resumenPersonas,
  type ResumenCobranza,
  type ResumenPersona,
} from '../lib/calculos';
import { dinero, fechaCorta, NOMBRE_METODO, nombreComida, nombreComidaCorto } from '../lib/formato';
import { GASTOS_GENERALES } from '../lib/types';
import { Avatar, Fila, FilaCompra, IconoComida, KV, Pantalla, confirmar } from '../components/ui';
import { HojaPago, useDeshacerPagos } from '../components/Pagos';
import { FormPersona } from './Personas';

export default function LiquidacionPersona() {
  const { id } = useParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const deshacer = useDeshacerPagos();
  const [tab, setTab] = useState<'resumen' | 'detalle'>('resumen');
  const [editando, setEditando] = useState(false);
  const [arreglando, setArreglando] = useState(false);

  const todos = resumenPersonas(encuentro);
  const r = todos.find((x) => x.persona.id === id);
  if (!r) return <Navigate to="/personas" replace />;
  const { persona } = r;
  const cobranza = resumenCobranza(encuentro, todos);
  const administrador = encuentro.personas.find((p) => p.id === cobranza.administradorId);
  const comidas = ordenarComidas(encuentro.comidas).filter((c) => c.asistentes.includes(persona.id));
  const compras = encuentro.compras
    .filter((c) => c.personaId === persona.id)
    .sort((a, b) => a.creada.localeCompare(b.creada));
  const destino = (comidaId: string) => {
    const comida = encuentro.comidas.find((c) => c.id === comidaId);
    return comida ? nombreComidaCorto(comida) : comidaId === GASTOS_GENERALES ? 'Gastos generales' : 'Comida borrada';
  };

  const eliminar = async () => {
    const avisos = [`Se va a borrar a ${persona.nombre} del encuentro.`];
    if (compras.length) avisos.push(`También se borran sus ${compras.length} compras.`);
    if (r.pagos.length) avisos.push('También se borran sus pagos registrados.');
    if (r.esAdministrador) avisos.push('Maneja la plata: después elegí a otra persona en Editar encuentro.');
    if (!(await confirmar(avisos.join(' '), { aceptar: 'Borrar persona' }))) return;
    actualizar((e) => {
      e.personas = e.personas.filter((p) => p.id !== persona.id);
      e.comidas.forEach((c) => (c.asistentes = c.asistentes.filter((x) => x !== persona.id)));
      e.compras = e.compras.filter((c) => c.personaId !== persona.id);
      e.pagos = e.pagos.filter((p) => p.personaId !== persona.id);
      if (e.administradorId === persona.id) e.administradorId = null;
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
          <div style={{ color: 'var(--texto-2)', fontSize: 13.5 }}>
            Comidas: {r.comidas} · Compras: {compras.length}
          </div>
        </div>
        {r.esAdministrador && (
          <span className="chip">
            <Wallet size={12} style={{ verticalAlign: -1 }} /> Maneja la plata
          </span>
        )}
      </div>

      <div className="tabs">
        <button className={tab === 'resumen' ? 'activo' : ''} onClick={() => setTab('resumen')}>
          Resumen
        </button>
        <button className={tab === 'detalle' ? 'activo' : ''} onClick={() => setTab('detalle')}>
          Detalle
        </button>
      </div>

      {tab === 'resumen' ? (
        <>
          <div className="lista">
            <KV k="Le toca por sus comidas" v={dinero(r.aPagar - r.generales)} />
            {r.generales > 0 && <KV k="Su parte de gastos generales" v={dinero(r.generales)} />}
            <KV k="Total que le toca poner" v={dinero(r.aPagar)} clase="grande" />
            <KV k="Lo que ya gastó en compras" v={r.compras ? `-${dinero(r.compras)}` : dinero(0)} />
            <KV
              k={r.neto >= 0 ? 'Diferencia a poner' : 'Puso de más'}
              v={dinero(Math.abs(r.neto))}
              clase="grande"
            />
          </div>

          <EstadoCuenta
            r={r}
            administrador={administrador?.nombre}
            onArreglar={() => setArreglando(true)}
            onDeshacer={() => deshacer(persona)}
          />

          {r.esAdministrador && <ResumenAdministrador cobranza={cobranza} fondo={resumenGeneral(encuentro).fondo} />}

          <div
            className="card card-pad"
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--verde-50)' }}
          >
            <PiggyBank size={28} color="var(--verde-600)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Fondo común generado</div>
              <div className="ayuda" style={{ marginTop: 1 }}>
                (por el redondeo de lo que le toca)
              </div>
            </div>
            <strong>{dinero(r.fondoGenerado)}</strong>
          </div>

          <button className="btn borde" onClick={() => setTab('detalle')}>
            Ver comidas y compras
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
              <span>Total que le toca</span>
              <span className="v">{dinero(r.aPagar)}</span>
            </div>
          </div>

          <div className="seccion-titulo">Compras que hizo</div>
          <div className="lista">
            {compras.length === 0 && <div className="vacio">No hizo compras.</div>}
            {compras.map((c) => (
              <FilaCompra key={c.id} compra={c} sub={destino(c.comidaId)} onClick={() => navigate(`/compras/${c.id}`)} />
            ))}
            {compras.length > 0 && (
              <div className="kv destacado">
                <span>Total gastado</span>
                <span className="v">{dinero(r.compras)}</span>
              </div>
            )}
          </div>

          {r.pagos.length > 0 && (
            <>
              <div className="seccion-titulo">Pagos</div>
              <div className="lista">
                {r.pagos.map((p) => (
                  <div className="fila" key={p.id}>
                    <div className="cuerpo">
                      <div className="titulo">{p.tipo === 'pago' ? 'Pagó' : 'Se le devolvió'}</div>
                      <div className="sub">
                        {NOMBRE_METODO[p.metodo]} · {fechaCorta(p.fecha)}
                      </div>
                    </div>
                    <div className="monto" style={{ color: p.tipo === 'pago' ? 'var(--verde-600)' : 'var(--azul)' }}>
                      {dinero(p.importe)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {editando && <FormPersona persona={persona} onCerrar={() => setEditando(false)} />}
      {arreglando && <HojaPago r={r} administrador={administrador} onCerrar={() => setArreglando(false)} />}
    </Pantalla>
  );
}

function EstadoCuenta({
  r,
  administrador,
  onArreglar,
  onDeshacer,
}: {
  r: ResumenPersona;
  administrador: string | undefined;
  onArreglar: () => void;
  onDeshacer: () => void;
}) {
  const quien = administrador ?? 'quien maneja la plata';
  if (r.saldo !== 0) {
    const debe = r.saldo > 0;
    const color = debe ? 'var(--rojo)' : 'var(--azul)';
    return (
      <div className="card card-pad" style={{ background: debe ? 'var(--rojo-100)' : 'var(--azul-100)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, color }}>{debe ? 'Debe pagar' : 'Se le devuelve'}</div>
            <div className="ayuda" style={{ marginTop: 1, color: 'var(--texto-2)' }}>
              {r.esAdministrador
                ? debe
                  ? 'Lo pone en la caja que maneja'
                  : 'Lo saca de la caja que maneja'
                : debe
                  ? `A ${quien}`
                  : `Se lo devuelve ${quien}`}
              {r.pagado > 0 && ` · ya pagó ${dinero(r.pagado)}`}
              {r.devuelto > 0 && ` · ya se le devolvieron ${dinero(r.devuelto)}`}
            </div>
          </div>
          <strong style={{ fontSize: 20, color, whiteSpace: 'nowrap' }}>{dinero(Math.abs(r.saldo))}</strong>
        </div>
        <button className="btn" style={{ marginTop: 14 }} onClick={onArreglar}>
          <Check size={20} /> {debe ? 'Marcar como pagado' : 'Marcar como devuelto'}
        </button>
      </div>
    );
  }
  const ultimo = r.pagos[r.pagos.length - 1];
  return (
    <div className="card card-pad" style={{ background: 'var(--verde-100)' }}>
      <div style={{ fontWeight: 700, color: 'var(--verde-700)' }}>Al día</div>
      <div className="ayuda" style={{ marginTop: 1, color: 'var(--verde-800)' }}>
        {ultimo
          ? `${ultimo.tipo === 'pago' ? 'Pagó' : 'Se le devolvió'} ${dinero(ultimo.importe)} · ${NOMBRE_METODO[ultimo.metodo]} · ${fechaCorta(ultimo.fecha)}`
          : 'Sus compras cubren justo lo que le toca.'}
      </div>
      {r.pagos.length > 0 && (
        <button className="link-btn" style={{ marginTop: 10 }} onClick={onDeshacer}>
          Marcar como pendiente
        </button>
      )}
    </div>
  );
}

function ResumenAdministrador({ cobranza, fondo }: { cobranza: ResumenCobranza; fondo: number }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="seccion-titulo">Como encargado de la plata</div>
      <div className="lista">
        <KV k="Tiene que cobrar" v={dinero(cobranza.totalACobrar)} />
        <KV k="Tiene que devolver" v={dinero(cobranza.totalADevolver)} />
        <KV k="Ya cobró" v={dinero(cobranza.cobrado)} />
        <KV k="Ya devolvió" v={dinero(cobranza.devuelto)} />
        <KV
          k="Falta cobrar / devolver"
          v={`${dinero(cobranza.pendienteCobrar)} / ${dinero(cobranza.pendienteDevolver)}`}
          clase={cobranza.pendienteCobrar + cobranza.pendienteDevolver > 0 ? 'alerta' : 'destacado'}
        />
        <KV k="Fondo común que guarda" v={dinero(fondo)} />
      </div>
      <p className="ayuda" style={{ margin: '-4px 4px 12px' }}>
        Incluye su propia cuenta, igual que la de todos.
      </p>
      <button className="btn" onClick={() => navigate('/resumen/cobranza')}>
        Ver cobranza
      </button>
    </>
  );
}
