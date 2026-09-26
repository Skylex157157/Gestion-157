import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Pencil, Plus, ShoppingCart, Trash2, Users } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenComida } from '../lib/calculos';
import { dinero, fechaLarga, hora, NOMBRE_TIPO } from '../lib/formato';
import { Avatar, Fila, IconoComida, KV, Pantalla, Vacio } from '../components/ui';
import { FormComida } from './Comidas';

export default function DetalleComida() {
  const { id } = useParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);

  const comida = encuentro.comidas.find((c) => c.id === id);
  if (!comida) return <Navigate to="/comidas" replace />;
  const r = resumenComida(encuentro, comida);
  const compras = encuentro.compras
    .filter((c) => c.comidaId === comida.id)
    .sort((a, b) => a.creada.localeCompare(b.creada));
  const persona = (pid: string) => encuentro.personas.find((p) => p.id === pid);

  const eliminar = () => {
    const aviso = compras.length
      ? `Se va a borrar la comida y sus ${compras.length} compras. ¿Continuar?`
      : '¿Borrar esta comida?';
    if (!confirm(aviso)) return;
    actualizar((e) => {
      e.comidas = e.comidas.filter((c) => c.id !== comida.id);
      e.compras = e.compras.filter((c) => c.comidaId !== comida.id);
    });
    navigate('/comidas', { replace: true });
  };

  return (
    <Pantalla
      titulo="Detalle de comida"
      atras
      acciones={
        <button className="icon-btn" aria-label="Editar comida" onClick={() => setEditando(true)}>
          <Pencil size={20} />
        </button>
      }
    >
      <div className={`card cabecera-comida tipo-${comida.tipo}`}>
        <IconoComida tipo={comida.tipo} tam={38} />
        <div>
          <h2>
            {fechaLarga(comida.fecha)} - {NOMBRE_TIPO[comida.tipo]}
          </h2>
          <div className="sub">
            {comida.asistentes.length} comensales
            {r.ninos > 0 && ` (${r.ninos} ${r.ninos === 1 ? 'chico no paga' : 'chicos no pagan'})`}
          </div>
        </div>
        {r.gastoReal > 0 && <span className="chip">{r.fondo > 0 ? 'Suma al fondo' : 'Cerrada'}</span>}
      </div>

      {r.sinPagantes && (
        <div className="aviso rojo">
          <AlertTriangle size={20} />
          Esta comida tiene gastos pero ningún adulto anotado. Marcá quiénes comieron para poder repartir el gasto.
        </div>
      )}

      <div className="seccion-titulo">Resumen de la comida</div>
      <div className="lista">
        <KV k="Gasto real total" v={dinero(r.gastoReal)} />
        <KV k="Cobro por persona" v={dinero(r.cobroPorPersona)} />
        <KV k={`Recaudado (${r.pagantes} x ${dinero(r.cobroPorPersona)})`} v={dinero(r.recaudado)} />
        <KV k="Diferencia (fondo común)" v={dinero(r.fondo)} clase="destacado" />
      </div>

      <div className="seccion-titulo">
        Compras de esta comida
        <button onClick={() => navigate(`/compras/nueva?comida=${comida.id}`)}>+ Agregar</button>
      </div>
      <div className="lista">
        {compras.length === 0 && (
          <Vacio icono={<ShoppingCart size={32} />}>Todavía no hay compras para esta comida.</Vacio>
        )}
        {compras.map((c) => (
          <Fila key={c.id} onClick={() => navigate(`/compras/${c.id}`)}>
            <Avatar persona={persona(c.personaId)} tam="chico" />
            <div className="cuerpo">
              <div className="titulo">{persona(c.personaId)?.nombre ?? 'Persona borrada'}</div>
              <div className="sub">{c.concepto}</div>
            </div>
            <div className="monto">
              {dinero(c.importe)}
              <small>{c.creada && hora(c.creada)}</small>
            </div>
          </Fila>
        ))}
      </div>

      {compras.length === 0 && (
        <button className="btn" onClick={() => navigate(`/compras/nueva?comida=${comida.id}`)}>
          <Plus size={20} /> Registrar compra
        </button>
      )}
      <button className="btn borde" onClick={() => navigate(`/comidas/${comida.id}/asistentes`)}>
        <Users size={20} /> Ver todos los que asistieron ({comida.asistentes.length})
      </button>
      <button className="btn peligro" onClick={eliminar}>
        <Trash2 size={18} /> Borrar comida
      </button>

      {editando && <FormComida comida={comida} onCerrar={() => setEditando(false)} />}
    </Pantalla>
  );
}
