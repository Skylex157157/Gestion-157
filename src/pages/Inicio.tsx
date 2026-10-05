import { useNavigate } from 'react-router-dom';
import { Archive, Banknote, ImagePlus, Menu, Pencil, PiggyBank, Plus, Users, Utensils, Wallet } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { administradorEfectivo, ordenarComidas, resumenGeneral } from '../lib/calculos';
import { dinero, fechaCorta, hoyISO, nombreComida } from '../lib/formato';
import { Fila, IconoComida, Pantalla, avisar } from '../components/ui';
import { EstadoNube } from '../components/Equipo';

export default function Inicio({ onMenu, onEquipo }: { onMenu: () => void; onEquipo: () => void }) {
  const { encuentro, archivarEncuentro } = useEncuentro();
  const navigate = useNavigate();
  const general = resumenGeneral(encuentro);
  const administrador = encuentro.personas.find((p) => p.id === administradorEfectivo(encuentro));

  const hoy = hoyISO();
  const ordenadas = ordenarComidas(encuentro.comidas);
  const futuras = ordenadas.filter((c) => c.fecha >= hoy);
  const proximas = (futuras.length ? futuras : ordenadas).slice(0, 3);

  const cabecera = (
    <header className="appbar">
      <div className="marca">
        <Users size={34} />
        <div>
          <h1>Juntada</h1>
          <small>Control de gastos y reparto</small>
        </div>
      </div>
      <button className="icon-btn" aria-label="Menú" onClick={onMenu}>
        <Menu size={24} />
      </button>
    </header>
  );

  const pasos = [
    { hecho: encuentro.personas.length > 0, texto: 'Agregá a las personas', ruta: '/personas' },
    { hecho: encuentro.comidas.length > 0, texto: 'Cargá las comidas', ruta: '/comidas' },
    { hecho: encuentro.compras.length > 0, texto: 'Registrá las compras', ruta: '/compras/nueva' },
  ];

  return (
    <Pantalla cabecera={cabecera}>
      {encuentro.archivado && (
        <div className="aviso" style={{ alignItems: 'center' }}>
          <Archive size={20} />
          <span style={{ flex: 1 }}>Este encuentro está archivado.</span>
          <button
            className="btn chico borde"
            onClick={() => {
              archivarEncuentro(encuentro.id, false);
              avisar(`"${encuentro.nombre}" volvió a tus encuentros`);
            }}
          >
            Desarchivar
          </button>
        </div>
      )}
      <div className="card portada">
        <div
          className={`imagen ${encuentro.foto ? '' : 'vacia'}`}
          style={encuentro.foto ? { backgroundImage: `url(${encuentro.foto})` } : undefined}
          onClick={() => !encuentro.foto && navigate('/encuentro')}
        >
          {!encuentro.foto && <ImagePlus size={30} />}
        </div>
        <div className="info">
          <div>
            <h2>{encuentro.nombre}</h2>
            <div className="fechas">
              {fechaCorta(encuentro.fechaInicio)} - {fechaCorta(encuentro.fechaFin)}{' '}
              <span className={`chip ${encuentro.cerrado ? 'gris' : ''}`} style={{ marginLeft: 4 }}>
                {encuentro.cerrado ? 'Cerrado' : 'Abierto'}
              </span>
            </div>
            {administrador && (
              <div className="fechas">
                <Wallet size={12} style={{ verticalAlign: -1 }} /> Maneja la plata: {administrador.nombre}
              </div>
            )}
            {encuentro.compartido && (
              <div style={{ marginTop: 6 }}>
                <EstadoNube encuentro={encuentro} onClick={onEquipo} />
              </div>
            )}
          </div>
          <button className="icon-btn" aria-label="Editar encuentro" onClick={() => navigate('/encuentro')}>
            <Pencil size={19} />
          </button>
        </div>
      </div>

      <div className="tiles">
        <div className="tile amarillo">
          <Utensils className="ico" size={26} />
          <span className="etq">Gasto real total</span>
          <span className="valor">{dinero(general.gastoReal)}</span>
        </div>
        <div className="tile azul">
          <Banknote className="ico" size={26} />
          <span className="etq">Total cobrado</span>
          <span className="valor">{dinero(general.recaudado)}</span>
        </div>
        <button className="tile verde" style={{ border: 0, textAlign: 'left' }} onClick={() => navigate('/resumen/fondo')}>
          <PiggyBank className="ico" size={26} />
          <span className="etq">Fondo común</span>
          <span className="valor">{dinero(general.fondo)}</span>
        </button>
        <button className="tile azul" style={{ border: 0, textAlign: 'left' }} onClick={() => navigate('/personas')}>
          <Users className="ico" size={26} />
          <span className="etq">Personas</span>
          <span className="valor">{general.personas}</span>
        </button>
      </div>

      {pasos.some((p) => !p.hecho) && (
        <>
          <div className="seccion-titulo">Para empezar</div>
          <div className="lista">
            {pasos.map((p, i) => (
              <Fila key={p.ruta} onClick={() => navigate(p.ruta)} chevron>
                <div className={`check ${p.hecho ? 'si' : ''}`}>{p.hecho ? '✓' : ''}</div>
                <div className="cuerpo">
                  <div className="titulo" style={p.hecho ? { color: 'var(--texto-3)', textDecoration: 'line-through' } : undefined}>
                    {i + 1}. {p.texto}
                  </div>
                </div>
              </Fila>
            ))}
          </div>
        </>
      )}

      <div className="seccion-titulo">
        {futuras.length ? 'Próximas comidas' : 'Comidas'}
        <a onClick={() => navigate('/comidas')}>Ver todas</a>
      </div>
      <div className="lista">
        {proximas.length === 0 && <div className="vacio">Todavía no hay comidas cargadas.</div>}
        {proximas.map((c) => (
          <Fila key={c.id} onClick={() => navigate(`/comidas/${c.id}`)} chevron>
            <IconoComida tipo={c.tipo} tam={20} />
            <div className="cuerpo">
              <div className="titulo">{nombreComida(c)}</div>
              <div className="sub">
                {c.asistentes.length} comensales
              </div>
            </div>
          </Fila>
        ))}
      </div>

      <button className="fab" aria-label="Registrar compra" onClick={() => navigate('/compras/nueva')}>
        <Plus size={28} />
      </button>
      {/* Evita que el botón flotante tape el último elemento */}
      <div style={{ height: 40 }} />
    </Pantalla>
  );
}
