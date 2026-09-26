import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CircleCheck, Search, ShoppingCart, UserPlus, Users } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { compradorEfectivo, ordenarComidas, resumenPersonas } from '../lib/calculos';
import { COLORES_PERSONA, dinero, nombreComida, nuevoId } from '../lib/formato';
import type { Persona } from '../lib/types';
import { Avatar, Fila, Hoja, IconoComida, Pantalla, Switch, Vacio } from '../components/ui';

export default function Personas() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [agregando, setAgregando] = useState(false);

  const texto = busqueda.trim().toLowerCase();
  const resumen = resumenPersonas(encuentro).filter((r) => r.persona.nombre.toLowerCase().includes(texto));

  return (
    <Pantalla
      titulo="Personas"
      atras="/"
      acciones={
        <button className="icon-btn" aria-label="Agregar persona" onClick={() => setAgregando(true)}>
          <UserPlus size={22} />
        </button>
      }
    >
      <label className="buscador">
        <Search size={18} />
        <input placeholder="Buscar persona..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </label>

      <div className="lista">
        {encuentro.personas.length === 0 && (
          <Vacio icono={<Users size={40} />}>Agregá a todos los que participan del encuentro.</Vacio>
        )}
        {resumen.map((r) => (
          <Fila key={r.persona.id} onClick={() => navigate(`/personas/${r.persona.id}`)}>
            <Avatar persona={r.persona} />
            <div className="cuerpo">
              <div className="titulo">{r.persona.nombre}</div>
              <div className="sub">Comidas: {r.comidas}</div>
            </div>
            {r.esComprador ? (
              <span className="chip">
                <ShoppingCart size={12} style={{ verticalAlign: -1 }} /> Compra todo
              </span>
            ) : r.pendiente === 0 ? (
              <CircleCheck size={22} className="positivo" aria-label="Pagó" />
            ) : (
              <div className="monto negativo">
                {dinero(r.pendiente)}
                <small>debe</small>
              </div>
            )}
          </Fila>
        ))}
      </div>

      <button className="btn" onClick={() => setAgregando(true)}>
        <UserPlus size={20} /> Agregar persona
      </button>

      {agregando && <FormPersona onCerrar={() => setAgregando(false)} />}
    </Pantalla>
  );
}

export function FormPersona({ persona, onCerrar }: { persona?: Persona; onCerrar: () => void }) {
  const { encuentro, actualizar } = useEncuentro();
  const [nombre, setNombre] = useState(persona?.nombre ?? '');
  const [esComprador, setEsComprador] = useState(!!persona && compradorEfectivo(encuentro) === persona.id);
  const comidas = ordenarComidas(encuentro.comidas);
  const [elegidas, setElegidas] = useState<string[]>(() =>
    persona ? comidas.filter((c) => c.asistentes.includes(persona.id)).map((c) => c.id) : comidas.map((c) => c.id),
  );
  const alternar = (id: string) =>
    setElegidas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const [agregados, setAgregados] = useState(0);

  const repetido = encuentro.personas.some(
    (p) => p.id !== persona?.id && p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
  );

  const guardar = (seguir: boolean) => {
    const limpio = nombre.trim();
    if (!limpio || repetido) return;
    actualizar((e) => {
      let id = persona?.id;
      if (persona) {
        const p = e.personas.find((x) => x.id === persona.id);
        if (p) {
          p.nombre = limpio;
        }
      } else {
        id = nuevoId();
        e.personas.push({ id, nombre: limpio, color: COLORES_PERSONA[e.personas.length % COLORES_PERSONA.length] });
      }
      if (esComprador) e.compradorId = id!;
      else if (e.compradorId === id) e.compradorId = null;
      for (const c of e.comidas) {
        const va = elegidas.includes(c.id);
        const esta = c.asistentes.includes(id!);
        if (va && !esta) c.asistentes.push(id!);
        if (!va && esta) c.asistentes = c.asistentes.filter((x) => x !== id);
      }
    });
    if (seguir) {
      setNombre('');
      setEsComprador(false);
      setAgregados((n) => n + 1);
    } else {
      onCerrar();
    }
  };

  return (
    <Hoja titulo={persona ? 'Editar persona' : 'Agregar persona'} onCerrar={onCerrar}>
      <div className="campo">
        <label htmlFor="fp-nombre">Nombre</label>
        <div className="control">
          <input
            id="fp-nombre"
            autoFocus
            placeholder="Ej.: Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardar(!persona)}
          />
        </div>
        {repetido && <div className="error">Ya hay una persona con ese nombre.</div>}
        {agregados > 0 && <div className="ayuda">✓ {agregados} agregada(s). Podés seguir cargando.</div>}
      </div>
      <div className="campo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span className="etiqueta" style={{ margin: 0 }}>
            Compra todo
          </span>
          <div className="ayuda">Hace todas las compras: los demás le pagan a esta persona.</div>
        </div>
        <Switch checked={esComprador} onChange={setEsComprador} />
      </div>
      {comidas.length > 0 && (
        <div className="campo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="etiqueta" style={{ margin: 0, flex: 1 }}>
              Comidas a las que va ({elegidas.length}/{comidas.length})
            </span>
            <button
              className="link-btn"
              onClick={() => setElegidas(elegidas.length === comidas.length ? [] : comidas.map((c) => c.id))}
            >
              {elegidas.length === comidas.length ? 'Desmarcar todas' : 'Marcar todas'}
            </button>
          </div>
          <div className="lista" style={{ boxShadow: 'none', border: '1.5px solid var(--borde)', marginBottom: 0 }}>
            {comidas.map((c) => {
              const si = elegidas.includes(c.id);
              return (
                <button key={c.id} className="fila clic" style={{ padding: '9px 12px' }} onClick={() => alternar(c.id)}>
                  <IconoComida tipo={c.tipo} tam={18} />
                  <div className="cuerpo">
                    <div className="titulo" style={{ fontSize: 14 }}>
                      {nombreComida(c)}
                    </div>
                  </div>
                  <div className={`check ${si ? 'si' : ''}`}>{si && <Check size={16} strokeWidth={3} />}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {persona ? (
        <button className="btn" disabled={!nombre.trim() || repetido} onClick={() => guardar(false)}>
          Guardar cambios
        </button>
      ) : (
        <>
          <button className="btn" disabled={!nombre.trim() || repetido} onClick={() => guardar(true)}>
            Agregar y cargar otra
          </button>
          <button className="btn borde" disabled={!nombre.trim() || repetido} onClick={() => guardar(false)}>
            Agregar y cerrar
          </button>
        </>
      )}
    </Hoja>
  );
}
