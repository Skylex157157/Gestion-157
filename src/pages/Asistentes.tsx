import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, Search, Users } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { nombreComida } from '../lib/formato';
import { Avatar, Fila, Pantalla, Vacio } from '../components/ui';

export default function Asistentes() {
  const { id } = useParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');

  const comida = encuentro.comidas.find((c) => c.id === id);
  if (!comida) return <Navigate to="/comidas" replace />;

  const texto = busqueda.trim().toLowerCase();
  const personas = encuentro.personas.filter((p) => p.nombre.toLowerCase().includes(texto));
  const todos = encuentro.personas.length > 0 && comida.asistentes.length === encuentro.personas.length;

  const alternar = (pid: string) =>
    actualizar((e) => {
      const c = e.comidas.find((x) => x.id === comida.id)!;
      c.asistentes = c.asistentes.includes(pid) ? c.asistentes.filter((x) => x !== pid) : [...c.asistentes, pid];
    });

  const marcarTodos = (si: boolean) =>
    actualizar((e) => {
      const c = e.comidas.find((x) => x.id === comida.id)!;
      c.asistentes = si ? e.personas.map((p) => p.id) : [];
    });

  return (
    <Pantalla titulo="¿Quiénes comieron?" atras>
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{nombreComida(comida)}</div>
          <div className="ayuda" style={{ marginTop: 2 }}>
            {comida.asistentes.length} comensales
          </div>
        </div>
        <button className={`btn chico ${todos ? 'borde' : ''}`} onClick={() => marcarTodos(!todos)}>
          {todos ? 'Quitar a todos' : 'Marcar a todos'}
        </button>
      </div>

      <label className="buscador">
        <Search size={18} />
        <input placeholder="Buscar persona..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      <div className="lista">
        {encuentro.personas.length === 0 && (
          <Vacio icono={<Users size={36} />}>
            No hay personas en este encuentro.
            <br />
            <button className="btn chico" style={{ margin: '12px auto 0' }} onClick={() => navigate('/personas')}>
              Agregar personas
            </button>
          </Vacio>
        )}
        {personas.map((p) => {
          const si = comida.asistentes.includes(p.id);
          return (
            <Fila key={p.id} onClick={() => alternar(p.id)}>
              <Avatar persona={p} />
              <div className="cuerpo">
                <div className="titulo">{p.nombre}</div>
              </div>
              <div className={`check ${si ? 'si' : ''}`}>{si && <Check size={16} strokeWidth={3} />}</div>
            </Fila>
          );
        })}
      </div>
    </Pantalla>
  );
}
