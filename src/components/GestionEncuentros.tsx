import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, ArchiveRestore, CalendarDays, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { fechaCorta } from '../lib/formato';
import type { Encuentro } from '../lib/types';
import { Hoja, Vacio, avisar, confirmar } from './ui';

/** Lista de encuentros para abrirlos, archivarlos o borrarlos. */
export function GestionEncuentros({
  inicial = 'activos',
  onCerrar,
}: {
  inicial?: 'activos' | 'archivados';
  onCerrar: () => void;
}) {
  const { estado, encuentro: abierto, activar, archivarEncuentro, eliminarEncuentro } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState(inicial);

  const activos = estado.encuentros.filter((e) => !e.archivado);
  const archivados = estado.encuentros.filter((e) => e.archivado);
  const lista = tab === 'activos' ? activos : archivados;

  const abrir = (e: Encuentro) => {
    activar(e.id);
    onCerrar();
    navigate('/');
  };

  const archivar = (e: Encuentro) => {
    archivarEncuentro(e.id, !e.archivado);
    avisar(e.archivado ? `"${e.nombre}" volvió a tus encuentros` : `"${e.nombre}" se archivó`);
  };

  const borrar = async (e: Encuentro) => {
    const ok = await confirmar(
      e.compartido
        ? `Se va a borrar "${e.nombre}" de este teléfono. Es un encuentro compartido: los demás lo siguen teniendo, y podés volver a entrar con el link.`
        : `Se va a borrar "${e.nombre}" con todas sus comidas, compras y pagos. No se puede deshacer. Si querés guardarlo, exportá una copia de seguridad antes (menú ☰ → Exportar datos).`,
      { aceptar: 'Borrar para siempre' },
    );
    if (!ok) return;
    eliminarEncuentro(e.id);
    avisar(`"${e.nombre}" se borró`);
  };

  return (
    <Hoja titulo="Mis encuentros" onCerrar={onCerrar}>
      <div className="tabs" style={{ boxShadow: 'none', border: '1.5px solid var(--borde)' }}>
        <button className={tab === 'activos' ? 'activo' : ''} onClick={() => setTab('activos')}>
          Activos ({activos.length})
        </button>
        <button className={tab === 'archivados' ? 'activo' : ''} onClick={() => setTab('archivados')}>
          Archivados ({archivados.length})
        </button>
      </div>

      <div className="lista" style={{ boxShadow: 'none', border: '1.5px solid var(--borde)' }}>
        {lista.length === 0 && (
          <Vacio icono={tab === 'activos' ? <CalendarDays size={32} /> : <Archive size={32} />}>
            {tab === 'activos'
              ? 'No hay encuentros activos.'
              : 'No hay encuentros archivados. Cuando un encuentro termina, archivalo para que no ocupe lugar en la lista.'}
          </Vacio>
        )}
        {lista.map((e) => (
          <div className="fila" key={e.id} style={{ paddingRight: 8 }}>
            <button className="fila-link" onClick={() => abrir(e)}>
              <CalendarDays size={20} color="var(--texto-2)" />
              <div className="cuerpo">
                <div className="titulo">
                  {e.nombre}
                  {e.id === abierto?.id && (
                    <span className="chip" style={{ marginLeft: 6 }}>
                      Actual
                    </span>
                  )}
                </div>
                <div className="sub">
                  {fechaCorta(e.fechaInicio)} - {fechaCorta(e.fechaFin)} · {e.personas.length} personas ·{' '}
                  {e.comidas.length} comidas
                </div>
              </div>
            </button>
            <button
              className="icon-btn"
              style={{ color: 'var(--verde-700)' }}
              aria-label={e.archivado ? `Desarchivar ${e.nombre}` : `Archivar ${e.nombre}`}
              title={e.archivado ? 'Desarchivar' : 'Archivar'}
              onClick={() => archivar(e)}
            >
              {e.archivado ? <ArchiveRestore size={20} /> : <Archive size={20} />}
            </button>
            <button
              className="icon-btn"
              style={{ color: 'var(--rojo)' }}
              aria-label={`Borrar ${e.nombre}`}
              title="Borrar"
              onClick={() => borrar(e)}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
      <p className="ayuda" style={{ margin: '0 2px' }}>
        <Archive size={12} style={{ verticalAlign: -1 }} /> Archivar lo saca de la lista sin borrar nada: lo podés
        abrir o recuperar desde "Archivados". <Trash2 size={12} style={{ verticalAlign: -1 }} /> Borrar lo elimina
        para siempre.
      </p>
    </Hoja>
  );
}
