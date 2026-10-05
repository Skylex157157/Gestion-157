import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CloudOff, LoaderCircle, SearchX } from 'lucide-react';
import { cargarNube, useStore } from '../lib/store';
import { ES_ARTIFACT } from '../lib/exportar';
import { avisar } from '../components/ui';

/** Abre el link de un encuentro compartido: lo baja de la nube y lo suma a este teléfono. */
export default function Unirse() {
  const { id = '' } = useParams();
  const { estado, activar, agregarEncuentro } = useStore();
  const navigate = useNavigate();
  const [problema, setProblema] = useState<'no-existe' | 'sin-conexion' | 'sin-nube' | null>(null);
  const yaEsta = estado.encuentros.find((e) => e.id === id);

  useEffect(() => {
    if (yaEsta) {
      activar(id);
      navigate('/', { replace: true });
      return;
    }
    const cargando = cargarNube();
    if (!cargando) {
      setProblema('sin-nube');
      return;
    }
    let vigente = true;
    cargando
      .then((n) => n.buscarEncuentro(id))
      .then((e) => {
        if (!vigente) return;
        if (!e) return setProblema('no-existe');
        agregarEncuentro(e);
        avisar(`Te sumaste a "${e.nombre}"`);
        navigate('/', { replace: true });
      })
      .catch(() => vigente && setProblema('sin-conexion'));
    return () => {
      vigente = false;
    };
  }, [id]);

  const [Icono, titulo, texto] =
    problema === 'no-existe'
      ? [SearchX, 'No se encontró el encuentro', 'Revisá que el link esté completo, o pedile a quien te lo mandó que lo vuelva a enviar.']
      : problema === 'sin-conexion'
        ? [CloudOff, 'Sin conexión', 'La primera vez hace falta internet para bajar el encuentro. Probá de nuevo cuando tengas señal.']
        : problema === 'sin-nube'
          ? [
              CloudOff,
              'No se puede abrir acá',
              ES_ARTIFACT
                ? 'Los encuentros compartidos se abren desde la app en GitHub Pages.'
                : 'Esta versión de la app todavía no está conectada a la nube.',
            ]
          : [LoaderCircle, 'Uniéndote al encuentro…', 'Bajando los datos compartidos.'];

  return (
    <div className="bienvenida">
      <div className="logo">
        <Icono size={40} className={problema ? '' : 'girando'} />
      </div>
      <h2>{titulo}</h2>
      <p>{texto}</p>
      {problema === 'sin-conexion' && (
        <button className="btn" onClick={() => location.reload()}>
          Probar de nuevo
        </button>
      )}
      {problema && (
        <button className="btn borde" onClick={() => navigate('/', { replace: true })}>
          Ir al inicio
        </button>
      )}
    </div>
  );
}
