import { Cloud, CloudOff, CloudUpload, Copy, Link2, Send, Unlink, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { useEstadoSync } from '../lib/sincronia';
import { NUBE_DISPONIBLE } from '../lib/nubeConfig';
import { ES_ARTIFACT, compartirTexto } from '../lib/exportar';
import type { Encuentro } from '../lib/types';
import { Hoja, avisar, confirmar, mostrarTexto } from './ui';

export function linkDeEquipo(id: string): string {
  return `${location.origin}${location.pathname}#/unirse/${id}`;
}

/** Chip que dice si un encuentro compartido está al día con la nube. */
export function EstadoNube({ encuentro, onClick }: { encuentro: Encuentro; onClick?: () => void }) {
  const s = useEstadoSync(encuentro.compartido ? encuentro.id : undefined);
  if (!encuentro.compartido) return null;
  const [Icono, texto, clase] = s.error
    ? [CloudOff, s.error, 'rojo']
    : !s.conectado
      ? [CloudOff, s.pendientes ? 'Sin conexión · tus cambios se envían al volver la señal' : 'Sin conexión', 'gris']
      : s.pendientes
        ? [CloudUpload, 'Enviando cambios…', 'azul']
        : [Cloud, 'En equipo · al día', ''];
  return (
    <button className={`chip estado-nube ${clase}`} onClick={onClick} type="button">
      <Icono size={13} /> {texto}
    </button>
  );
}

/** Hoja para editar un encuentro entre varios: compartir el link, ver el estado y dejar de compartir. */
export function HojaEquipo({ onCerrar }: { onCerrar: () => void }) {
  const { encuentro, compartirEncuentro, dejarDeCompartir } = useStore();
  if (!encuentro) return null;
  const link = linkDeEquipo(encuentro.id);

  const enviar = async () => {
    const texto = `Sumate a "${encuentro.nombre}" en Juntada para cargar las compras y los pagos juntos:\n${link}`;
    const r = await compartirTexto(encuentro.nombre, texto);
    if (r === 'copiado') avisar('Link copiado. Pegalo en WhatsApp.');
    if (r === 'error') mostrarTexto('Link del encuentro', link);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      avisar('Link copiado');
    } catch {
      mostrarTexto('Link del encuentro', link);
    }
  };

  const empezar = () => {
    const id = compartirEncuentro(encuentro.id);
    if (!id) avisar('No se pudo compartir');
    else avisar('Encuentro compartido. Mandá el link a quien quieras.');
  };

  const dejar = async () => {
    const ok = await confirmar(
      'Este teléfono deja de recibir y enviar cambios. Te queda una copia con todo lo que hay ahora, y los demás siguen editando la suya.',
      { aceptar: 'Dejar de compartir' },
    );
    if (!ok) return;
    dejarDeCompartir(encuentro.id);
    onCerrar();
    avisar('Este encuentro ya no se sincroniza en este teléfono');
  };

  if (!NUBE_DISPONIBLE) {
    return (
      <Hoja titulo="Editar en equipo" onCerrar={onCerrar}>
        <p className="ayuda" style={{ fontSize: 14, lineHeight: 1.45, margin: '0 0 16px' }}>
          {ES_ARTIFACT
            ? 'En esta versión de prueba no se puede compartir. Usá la app desde su link de GitHub Pages.'
            : 'Todavía no está conectada la nube (Firebase), así que por ahora cada teléfono guarda sus datos.'}
        </p>
        <button className="btn" onClick={onCerrar}>
          Entendido
        </button>
      </Hoja>
    );
  }

  if (!encuentro.compartido) {
    return (
      <Hoja titulo="Editar en equipo" onCerrar={onCerrar}>
        <div className="equipo-explica">
          <Users size={34} />
          <p>
            Compartí <strong>{encuentro.nombre}</strong> para que otras personas carguen compras y pagos desde su
            teléfono. Todos ven los cambios al instante, y sin señal se sigue usando: los cambios se envían cuando
            vuelve la conexión.
          </p>
        </div>
        <ul className="equipo-lista">
          <li>Cualquiera que tenga el link puede ver y editar este encuentro.</li>
          <li>Tus otros encuentros siguen solo en este teléfono.</li>
        </ul>
        <button className="btn" onClick={empezar}>
          <Link2 size={20} /> Compartir y obtener el link
        </button>
      </Hoja>
    );
  }

  return (
    <Hoja titulo="Editar en equipo" onCerrar={onCerrar}>
      <div style={{ marginBottom: 14 }}>
        <EstadoNube encuentro={encuentro} />
      </div>
      <p className="ayuda" style={{ fontSize: 13.5, margin: '0 0 8px' }}>
        Mandá este link a quien quieras sumar. Cualquiera que lo tenga puede editar.
      </p>
      <div className="link-equipo">{link}</div>
      <div className="fila-flex" style={{ marginTop: 12 }}>
        <button className="btn" onClick={enviar}>
          <Send size={18} /> Enviar link
        </button>
        <button className="btn borde" style={{ marginTop: 0 }} onClick={copiar}>
          <Copy size={18} /> Copiar
        </button>
      </div>
      <button className="btn peligro" onClick={dejar}>
        <Unlink size={18} /> Dejar de compartir en este teléfono
      </button>
    </Hoja>
  );
}
