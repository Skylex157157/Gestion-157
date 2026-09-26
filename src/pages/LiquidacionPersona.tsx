import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Pencil, PiggyBank, ReceiptText, Trash2 } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenComida, resumenPersonas, ordenarComidas, transferenciasSugeridas } from '../lib/calculos';
import { dinero, fechaCorta, NOMBRE_METODO, nombreComida } from '../lib/formato';
import { GASTOS_GENERALES } from '../lib/types';
import { Avatar, Fila, IconoComida, KV, Pantalla, avisar, confirmar } from '../components/ui';
import { FormPersona } from './Personas';

export default function LiquidacionPersona() {
  const { id } = useParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'resumen' | 'detalle'>('resumen');
  const [editando, setEditando] = useState(false);

  const todos = resumenPersonas(encuentro);
  const r = todos.find((x) => x.persona.id === id);
  if (!r) return <Navigate to="/personas" replace />;
  const { persona } = r;
  const saldo = Math.round(r.saldo);
  const nombre = (pid: string) => encuentro.personas.find((p) => p.id === pid)?.nombre ?? '?';

  const transferencias = transferenciasSugeridas(todos.map((x) => ({ id: x.persona.id, saldo: x.saldo }))).filter(
    (t) => t.deId === persona.id || t.aId === persona.id,
  );

  const comidas = ordenarComidas(encuentro.comidas).filter((c) => c.asistentes.includes(persona.id));
  const compras = encuentro.compras.filter((c) => c.personaId === persona.id);
  const pagos = encuentro.pagos.filter((p) => p.deId === persona.id || p.aId === persona.id);

  const eliminar = async () => {
    const tienePagos = encuentro.pagos.some((p) => p.deId === persona.id || p.aId === persona.id);
    if (compras.length || tienePagos) {
      avisar('No se puede borrar: tiene compras o pagos registrados. Borralos primero.');
      return;
    }
    if (!(await confirmar(`Se va a borrar a ${persona.nombre} del encuentro.`, { aceptar: 'Borrar persona' }))) return;
    actualizar((e) => {
      e.personas = e.personas.filter((p) => p.id !== persona.id);
      e.comidas.forEach((c) => (c.asistentes = c.asistentes.filter((x) => x !== persona.id)));
      if (e.tesoreroId === persona.id) e.tesoreroId = null;
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
        <div>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{persona.nombre}</div>
          <div className="sub" style={{ color: 'var(--texto-2)', fontSize: 13.5 }}>
            Comidas: {r.comidas}
            {persona.esNino && ' · Chico (no paga)'}
          </div>
        </div>
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
            <KV k="Costo real de sus comidas" v={dinero(r.costoReal)} />
            <KV k="Cobrado por sus comidas" v={dinero(r.debioAportar - r.generales)} />
            {r.generales > 0 && <KV k="Su parte de gastos generales" v={dinero(r.generales)} />}
          </div>
          <div className="lista">
            <KV k="Total que debió aportar" v={dinero(r.debioAportar)} />
            <KV k="Compras realizadas" v={dinero(r.compras)} />
            {r.fondoAGuardar !== 0 && <KV k="Fondo común que guarda" v={dinero(r.fondoAGuardar)} />}
            {r.pagosEnviados > 0 && <KV k="Pagos que ya hizo" v={dinero(r.pagosEnviados)} />}
            {r.pagosRecibidos > 0 && <KV k="Pagos que ya recibió" v={`-${dinero(r.pagosRecibidos)}`} />}
          </div>

          <div className={`card card-pad ${saldo < 0 ? 'kv alerta' : saldo > 0 ? 'kv destacado' : ''}`} style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>Diferencia</span>
              <span>{dinero(Math.abs(saldo))}</span>
            </div>
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <span className={`chip ${saldo < 0 ? 'rojo' : saldo > 0 ? '' : 'gris'}`}>
                {saldo < 0 ? 'Debe pagar' : saldo > 0 ? 'Le tienen que pagar' : 'Saldado'}
              </span>
            </div>
          </div>

          {transferencias.length > 0 && (
            <div className="lista">
              {transferencias.map((t) => (
                <div className="transfer" key={t.deId + t.aId}>
                  <span>{nombre(t.deId)}</span>
                  <ArrowRight size={16} color="var(--texto-3)" />
                  <span>{nombre(t.aId)}</span>
                  <span className="monto">{dinero(t.importe)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--verde-50)' }}>
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
                    <div className="sub">
                      {persona.esNino
                        ? 'Chico · no paga'
                        : `Costo real ${dinero(rc.pagantes ? rc.gastoReal / rc.pagantes : 0)}`}
                    </div>
                  </div>
                  <div className="monto">{persona.esNino ? dinero(0) : dinero(rc.cobroPorPersona)}</div>
                </Fila>
              );
            })}
          </div>

          {r.generales > 0 && (
            <div className="lista">
              <Fila onClick={() => navigate('/resumen/generales')} chevron>
                <ReceiptText size={20} color="var(--texto-2)" />
                <div className="cuerpo">
                  <div className="titulo">Gastos generales</div>
                  <div className="sub">Su parte, repartida entre todos</div>
                </div>
                <div className="monto">{dinero(r.generales)}</div>
              </Fila>
            </div>
          )}

          {pagos.length > 0 && (
            <>
              <div className="seccion-titulo">Pagos</div>
              <div className="lista">
                {pagos.map((p) => (
                  <div className="fila" key={p.id}>
                    <div className="cuerpo">
                      <div className="titulo">
                        {p.deId === persona.id ? `Le pagó a ${nombre(p.aId)}` : `Recibió de ${nombre(p.deId)}`}
                      </div>
                      <div className="sub">
                        {fechaCorta(p.fecha)}
                        {p.metodo && ` · ${NOMBRE_METODO[p.metodo]}`}
                      </div>
                    </div>
                    <div className="monto">{dinero(p.importe)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="seccion-titulo">Compras que hizo</div>
          <div className="lista">
            {compras.length === 0 && <div className="vacio">No registró compras.</div>}
            {compras.map((c) => {
              const comida = encuentro.comidas.find((x) => x.id === c.comidaId);
              const destino = comida ? nombreComida(comida) : c.comidaId === GASTOS_GENERALES ? 'Gastos generales' : 'Comida borrada';
              return (
                <Fila key={c.id} onClick={() => navigate(`/compras/${c.id}`)}>
                  <div className="cuerpo">
                    <div className="titulo">{c.concepto}</div>
                    <div className="sub">{destino}</div>
                  </div>
                  <div className="monto">{dinero(c.importe)}</div>
                </Fila>
              );
            })}
          </div>
        </>
      )}

      {editando && <FormPersona persona={persona} onCerrar={() => setEditando(false)} />}
    </Pantalla>
  );
}
