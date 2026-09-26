import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ImagePlus, PartyPopper, Trash2 } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { dinero, fechaCorta, nombreComida } from '../lib/formato';
import { tesoreroEfectivo } from '../lib/calculos';
import { Pantalla, Switch, avisar, confirmar } from '../components/ui';

const REDONDEOS = [1, 100, 500, 1000, 2000, 5000];

/** Achica la foto para que entre en el almacenamiento del teléfono. */
function achicarFoto(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(archivo);
    img.onload = () => {
      const ancho = Math.min(900, img.width);
      const alto = Math.round((img.height * ancho) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;
      canvas.getContext('2d')!.drawImage(img, 0, 0, ancho, alto);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('imagen inválida'));
    };
    img.src = url;
  });
}

export default function EditarEncuentro() {
  const { encuentro, actualizar, eliminarEncuentro } = useEncuentro();
  const navigate = useNavigate();
  const archivo = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState(encuentro.nombre);
  const [inicio, setInicio] = useState(encuentro.fechaInicio);
  const [fin, setFin] = useState(encuentro.fechaFin);
  const [redondeo, setRedondeo] = useState(encuentro.redondeo);
  const [tesorero, setTesorero] = useState(tesoreroEfectivo(encuentro) ?? '');
  const [cerrado, setCerrado] = useState(!!encuentro.cerrado);

  const fueraDeRango = encuentro.comidas.filter((c) => c.fecha < inicio || c.fecha > fin);

  const guardar = () => {
    if (!nombre.trim()) return;
    actualizar((e) => {
      e.nombre = nombre.trim();
      e.fechaInicio = inicio;
      e.fechaFin = fin < inicio ? inicio : fin;
      e.redondeo = redondeo;
      e.tesoreroId = tesorero || null;
      e.cerrado = cerrado;
    });
    avisar('Encuentro guardado');
    navigate(-1);
  };

  const cambiarFoto = async (f: File) => {
    try {
      const foto = await achicarFoto(f);
      actualizar((e) => (e.foto = foto));
    } catch {
      avisar('No se pudo leer la imagen');
    }
  };

  const borrar = async () => {
    const ok = await confirmar(
      `Se va a borrar "${encuentro.nombre}" con todas sus comidas, compras y pagos. No se puede deshacer.`,
      { aceptar: 'Borrar encuentro' },
    );
    if (!ok) return;
    eliminarEncuentro(encuentro.id);
    navigate('/', { replace: true });
  };

  return (
    <Pantalla titulo="Editar encuentro" atras sinNav>
      <div className="card portada">
        <div
          className={`imagen ${encuentro.foto ? '' : 'vacia'}`}
          style={encuentro.foto ? { backgroundImage: `url(${encuentro.foto})` } : undefined}
          onClick={() => archivo.current?.click()}
          role="button"
          aria-label="Cambiar foto"
        >
          {!encuentro.foto && (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <ImagePlus size={30} /> Agregar foto de portada
            </span>
          )}
        </div>
        <div className="info" style={{ gap: 8 }}>
          <button className="btn chico borde" onClick={() => archivo.current?.click()}>
            {encuentro.foto ? 'Cambiar foto' : 'Elegir foto'}
          </button>
          {encuentro.foto && (
            <button className="btn chico peligro" style={{ marginTop: 0 }} onClick={() => actualizar((e) => (e.foto = null))}>
              Quitar foto
            </button>
          )}
        </div>
        <input
          ref={archivo}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) cambiarFoto(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="card card-pad">
        <div className="campo">
          <label htmlFor="ee-nombre">Nombre</label>
          <div className="control">
            <PartyPopper size={20} />
            <input id="ee-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        </div>
        <div className="fila-flex">
          <div className="campo">
            <label htmlFor="ee-inicio">Desde</label>
            <div className="control">
              <CalendarDays size={18} />
              <input id="ee-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="ee-fin">Hasta</label>
            <div className="control">
              <CalendarDays size={18} />
              <input id="ee-fin" type="date" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} />
            </div>
          </div>
        </div>
        {fueraDeRango.length > 0 && (
          <div className="ayuda" style={{ marginTop: -8, marginBottom: 12 }}>
            Ojo: {fueraDeRango.map(nombreComida).join(', ')} queda(n) fuera de estas fechas (
            {fechaCorta(inicio)} - {fechaCorta(fin)}).
          </div>
        )}

        <div className="campo">
          <label htmlFor="ee-redondeo">Redondear el cobro por persona a</label>
          <div className="control">
            <select id="ee-redondeo" value={redondeo} onChange={(e) => setRedondeo(Number(e.target.value))}>
              {REDONDEOS.map((r) => (
                <option key={r} value={r}>
                  {r === 1 ? 'Sin redondeo (exacto)' : `${dinero(r)} (hacia arriba)`}
                </option>
              ))}
            </select>
          </div>
          <div className="ayuda">
            Ej.: si una comida cuesta {dinero(7200)} por persona, se cobra{' '}
            {dinero(Math.ceil(7200 / redondeo) * redondeo)}. Lo que sobra va al fondo común.
          </div>
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label htmlFor="ee-tesorero">¿Quién guarda el fondo común?</label>
          <div className="control">
            <select id="ee-tesorero" value={tesorero} onChange={(e) => setTesorero(e.target.value)}>
              {encuentro.personas.length === 0 && <option value="">(Todavía no hay personas)</option>}
              {encuentro.personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span className="etiqueta" style={{ fontWeight: 500, fontSize: 13.5 }}>
            Encuentro cerrado
          </span>
          <div className="ayuda">
            Marcalo cuando terminó y solo falta cobrar. Podés seguir modificando todo igual.
          </div>
        </div>
        <Switch checked={cerrado} onChange={setCerrado} />
      </div>

      <button className="btn" disabled={!nombre.trim()} onClick={guardar}>
        Guardar cambios
      </button>
      <button className="btn peligro" onClick={borrar}>
        <Trash2 size={18} /> Borrar encuentro
      </button>
    </Pantalla>
  );
}
