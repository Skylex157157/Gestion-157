import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Pencil, Plus, ShoppingCart, Trash2, Users } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenComida } from '../lib/calculos';
import { dinero, fechaLarga, NOMBRE_TIPO } from '../lib/formato';
import { FilaCompra, IconoComida, KV, Pantalla, Vacio, confirmar } from '../components/ui';
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

  const eliminar = async () => {
    const aviso = compras.length
      ? `Se va a borrar la comida y sus ${compras.length} compras.`
      : 'Se va a borrar esta comida.';
    if (!(await confirmar(aviso, { aceptar: 'Borrar comida' }))) return;
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
          {comida.menu && <div className="sub menu-comida">{comida.menu}</div>}
          <div className="sub">
            {comida.asistentes.length} comensales
          </div>
        </div>
        {r.gastoReal > 0 && <span className="chip">{r.fondo > 0 ? 'Suma al fondo' : 'Cerrada'}</span>}
      </div>

      {r.sinComensales && (
        <div className="aviso rojo">
          <AlertTriangle size={20} />
          Esta comida tiene gastos pero nadie anotado. Marcá quiénes comieron para poder repartir el gasto.
        </div>
      )}

      {r.fondo < 0 && !r.sinComensales && (
        <div className="aviso rojo">
          <AlertTriangle size={20} />
          El precio fijo no alcanza para cubrir el gasto: faltan {dinero(-r.fondo)}, que salen del fondo común.
        </div>
      )}

      <div className="seccion-titulo">Resumen de la comida</div>
      <div className="lista">
        <KV k="Gasto real total" v={dinero(r.gastoReal)} />
        {r.comensales > 0 && <KV k="Costo real por persona" v={dinero(r.gastoReal / r.comensales)} />}
        <KV k={r.esPrecioFijo ? 'Cobro por persona (precio fijo)' : 'Cobro por persona'} v={dinero(r.cobroPorPersona)} />
        <KV k={`Recaudado (${r.comensales} x ${dinero(r.cobroPorPersona)})`} v={dinero(r.recaudado)} />
        <KV k="Diferencia (fondo común)" v={dinero(r.fondo)} clase={r.fondo < 0 ? 'alerta' : 'destacado'} />
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
          <FilaCompra key={c.id} compra={c} onClick={() => navigate(`/compras/${c.id}`)} />
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
