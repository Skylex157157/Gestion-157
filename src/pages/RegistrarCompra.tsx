import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Banknote, CalendarDays, FileText, Tag, Trash2 } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { GASTOS_GENERALES } from '../lib/types';
import { ordenarComidas } from '../lib/calculos';
import { CONCEPTOS, dinero, hoyISO, nombreComida, nuevoId, parsearImporte } from '../lib/formato';
import { Pantalla, Vacio, avisar, confirmar } from '../components/ui';

const OTRO = '__otro__';

export default function RegistrarCompra() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();

  const existente = id ? encuentro.compras.find((c) => c.id === id) : undefined;
  const comidas = ordenarComidas(encuentro.comidas);
  const comidaInicial =
    existente?.comidaId ??
    params.get('comida') ??
    (comidas.find((c) => c.fecha >= hoyISO()) ?? comidas[comidas.length - 1])?.id ??
    GASTOS_GENERALES;

  const [comidaId, setComidaId] = useState(comidaInicial);
  const conceptoConocido = !existente || CONCEPTOS.includes(existente.concepto);
  const [concepto, setConcepto] = useState(existente ? (conceptoConocido ? existente.concepto : OTRO) : CONCEPTOS[0]);
  const [conceptoLibre, setConceptoLibre] = useState(conceptoConocido ? '' : (existente?.concepto ?? ''));
  const [importe, setImporte] = useState(existente ? String(existente.importe) : '');
  const [obs, setObs] = useState(existente?.observaciones ?? '');
  const [intentado, setIntentado] = useState(false);

  if (id && !existente) {
    return (
      <Pantalla titulo="Compra" atras="/compras" sinNav>
        <Vacio icono={<Tag size={36} />}>Esta compra ya no existe.</Vacio>
      </Pantalla>
    );
  }

  const monto = parsearImporte(importe);
  const conceptoFinal = concepto === OTRO ? conceptoLibre.trim() : concepto;
  const errores = {
    comida: !comidaId && 'Elegí la comida',
    concepto: !conceptoFinal && 'Escribí el concepto',
    importe: monto <= 0 && 'Ingresá el importe',
  };
  const valido = !Object.values(errores).some(Boolean);

  const guardar = () => {
    setIntentado(true);
    if (!valido) return;
    actualizar((e) => {
      if (existente) {
        const c = e.compras.find((x) => x.id === existente.id);
        if (c) Object.assign(c, { comidaId, concepto: conceptoFinal, importe: monto, observaciones: obs.trim() });
      } else {
        e.compras.push({
          id: nuevoId(),
          comidaId,
          concepto: conceptoFinal,
          importe: monto,
          observaciones: obs.trim(),
          creada: new Date().toISOString(),
        });
      }
    });
    avisar(existente ? 'Compra actualizada' : `Compra de ${dinero(monto)} guardada`);
    navigate(-1);
  };

  const eliminar = async () => {
    if (!existente || !(await confirmar('Se va a borrar esta compra.', { aceptar: 'Borrar compra' }))) return;
    actualizar((e) => {
      e.compras = e.compras.filter((c) => c.id !== existente.id);
    });
    avisar('Compra borrada');
    navigate(-1);
  };

  return (
    <Pantalla titulo={existente ? 'Editar compra' : 'Registrar compra'} atras sinNav>
      <div className="card card-pad">
        <div className="campo">
          <label htmlFor="rc-comida">Asignar a</label>
          <div className="control">
            <CalendarDays size={20} />
            <select id="rc-comida" value={comidaId} onChange={(e) => setComidaId(e.target.value)}>
              <option value="">Elegir comida…</option>
              {comidas.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreComida(c)}
                </option>
              ))}
              <option value={GASTOS_GENERALES}>Gastos generales (entre todos)</option>
            </select>
          </div>
          {comidaId === GASTOS_GENERALES && (
            <div className="ayuda">
              Nafta, alquiler, limpieza… Se reparte en partes iguales entre todos y no suma al fondo común.
            </div>
          )}
          {intentado && errores.comida && <div className="error">{errores.comida}</div>}
        </div>

        <div className="campo">
          <label htmlFor="rc-concepto">Concepto</label>
          <div className="control">
            <Tag size={20} />
            <select id="rc-concepto" value={concepto} onChange={(e) => setConcepto(e.target.value)}>
              {CONCEPTOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={OTRO}>Otro (escribir)…</option>
            </select>
          </div>
          {concepto === OTRO && (
            <div className="control" style={{ marginTop: 8 }}>
              <input
                autoFocus
                placeholder="Ej.: Helado"
                value={conceptoLibre}
                onChange={(e) => setConceptoLibre(e.target.value)}
              />
            </div>
          )}
          {intentado && errores.concepto && <div className="error">{errores.concepto}</div>}
        </div>

        <div className="campo">
          <label htmlFor="rc-importe">Importe</label>
          <div className="control">
            <Banknote size={20} />
            <span style={{ fontSize: 15 }}>$</span>
            <input
              id="rc-importe"
              inputMode="numeric"
              placeholder="0"
              value={monto ? new Intl.NumberFormat('es-AR').format(monto) : importe.replace(/[^\d]/g, '')}
              onChange={(e) => setImporte(e.target.value)}
            />
          </div>
          {intentado && errores.importe && <div className="error">{errores.importe}</div>}
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label htmlFor="rc-obs">Observaciones (opcional)</label>
          <div className="control" style={{ alignItems: 'flex-start', paddingTop: 13 }}>
            <FileText size={20} />
            <textarea
              id="rc-obs"
              rows={2}
              placeholder="Ej.: compra en carnicería"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              style={{ paddingTop: 0 }}
            />
          </div>
        </div>
      </div>

      <button className="btn" onClick={guardar}>
        Guardar compra
      </button>
      {existente && (
        <button className="btn peligro" onClick={eliminar}>
          <Trash2 size={18} /> Borrar compra
        </button>
      )}
    </Pantalla>
  );
}
