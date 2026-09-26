import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, Search, UserPlus, Users } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenPersonas } from '../lib/calculos';
import { COLORES_PERSONA, dinero, nuevoId } from '../lib/formato';
import type { Persona } from '../lib/types';
import { Avatar, Fila, Hoja, Pantalla, Switch, Vacio } from '../components/ui';

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
        {resumen.map((r) => {
          const saldo = Math.round(r.saldo);
          return (
            <Fila key={r.persona.id} onClick={() => navigate(`/personas/${r.persona.id}`)}>
              <Avatar persona={r.persona} />
              <div className="cuerpo">
                <div className="titulo">{r.persona.nombre}</div>
                <div className="sub">
                  Comidas: {r.comidas}
                  {r.persona.esNino && ' · Chico'}
                </div>
              </div>
              {saldo === 0 ? (
                <CircleCheck size={22} className="positivo" aria-label="Saldado" />
              ) : (
                <div className={`monto ${saldo > 0 ? 'positivo' : 'negativo'}`}>
                  {saldo > 0 ? '+' : ''}
                  {dinero(saldo)}
                  <small>{saldo > 0 ? 'le deben' : 'debe'}</small>
                </div>
              )}
            </Fila>
          );
        })}
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
  const [esNino, setEsNino] = useState(persona?.esNino ?? false);
  const [aTodas, setATodas] = useState(true);
  const [agregados, setAgregados] = useState(0);

  const repetido = encuentro.personas.some(
    (p) => p.id !== persona?.id && p.nombre.trim().toLowerCase() === nombre.trim().toLowerCase(),
  );

  const guardar = (seguir: boolean) => {
    const limpio = nombre.trim();
    if (!limpio || repetido) return;
    actualizar((e) => {
      if (persona) {
        const p = e.personas.find((x) => x.id === persona.id);
        if (p) {
          p.nombre = limpio;
          p.esNino = esNino;
        }
      } else {
        const id = nuevoId();
        e.personas.push({ id, nombre: limpio, esNino, color: COLORES_PERSONA[e.personas.length % COLORES_PERSONA.length] });
        if (aTodas) e.comidas.forEach((c) => c.asistentes.push(id));
      }
    });
    if (seguir) {
      setNombre('');
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
            Es chico
          </span>
          <div className="ayuda">Come pero no paga: su parte se reparte entre los adultos.</div>
        </div>
        <Switch checked={esNino} onChange={setEsNino} />
      </div>
      {!persona && encuentro.comidas.length > 0 && (
        <div className="campo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span className="etiqueta" style={{ margin: 0 }}>
              Anotar en todas las comidas
            </span>
            <div className="ayuda">Después podés quitarla de las comidas a las que no fue.</div>
          </div>
          <Switch checked={aTodas} onChange={setATodas} />
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
