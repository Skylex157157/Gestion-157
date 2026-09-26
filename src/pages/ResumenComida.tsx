import { useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Utensils } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { ordenarComidas, resumenComida } from '../lib/calculos';
import { dinero, nombreComida } from '../lib/formato';
import { FilaCompra, KV, Pantalla, Vacio } from '../components/ui';

export default function ResumenComida() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const comidas = ordenarComidas(encuentro.comidas);
  const comida = comidas.find((c) => c.id === params.get('c')) ?? comidas[0];

  if (!comida) {
    return (
      <Pantalla titulo="Resumen por comida" atras>
        <Vacio icono={<Utensils size={40} />}>Todavía no hay comidas cargadas.</Vacio>
      </Pantalla>
    );
  }

  const r = resumenComida(encuentro, comida);
  const compras = encuentro.compras.filter((c) => c.comidaId === comida.id);

  return (
    <Pantalla titulo="Resumen por comida" atras>
      <div className="control" style={{ marginBottom: 12 }}>
        <CalendarDays size={20} />
        <select value={comida.id} onChange={(e) => setParams({ c: e.target.value }, { replace: true })}>
          {comidas.map((c) => (
            <option key={c.id} value={c.id}>
              {nombreComida(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="lista">
        <KV k="Comensales" v={comida.asistentes.length} />
        <KV k="Gasto real" v={dinero(r.gastoReal)} />
        <KV k="Cobro por persona" v={dinero(r.cobroPorPersona)} />
        <KV k="Recaudado" v={dinero(r.recaudado)} />
        <KV k="Fondo común" v={dinero(r.fondo)} clase="destacado" />
      </div>

      <div className="seccion-titulo">Compras</div>
      <div className="lista">
        {compras.length === 0 && <div className="vacio">Sin compras.</div>}
        {compras.map((c) => (
          <FilaCompra key={c.id} compra={c} onClick={() => navigate(`/compras/${c.id}`)} />
        ))}
      </div>

      <button className="btn borde" onClick={() => navigate(`/comidas/${comida.id}/asistentes`)}>
        Ver detalle de comensales
      </button>
    </Pantalla>
  );
}
