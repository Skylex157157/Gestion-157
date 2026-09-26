import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Banknote, CalendarDays, ShoppingBag, Tag, Trash2, User } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { GASTOS_GENERALES } from '../lib/types';
import { ordenarComidas } from '../lib/calculos';
import { CONCEPTOS, dinero, hoyISO, nombreComida, nuevoId, parsearImporte } from '../lib/formato';
import { Pantalla, Vacio, avisar, confirmar } from '../components/ui';

export default function RegistrarCompra() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { encuentro, estado, actualizar } = useEncuentro();
  const navigate = useNavigate();

  const existente = id ? encuentro.compras.find((c) => c.id === id) : undefined;
  const comidas = ordenarComidas(encuentro.comidas);
  const comidaInicial =
    existente?.comidaId ??
    params.get('comida') ??
    (comidas.find((c) => c.fecha >= hoyISO()) ?? comidas[comidas.length - 1])?.id ??
    GASTOS_GENERALES;

  const [personaId, setPersonaId] = useState(existente?.personaId ?? '');
  const [importe, setImporte] = useState(existente ? String(existente.importe) : '');
  const [concepto, setConcepto] = useState(existente?.concepto ?? '');
  const [comidaId, setComidaId] = useState(comidaInicial);
  const [intentado, setIntentado] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);

  // Sugerencias: lo que ya se compró en cualquier encuentro (lo más reciente primero) y algunas comunes
  const sugerencias = useMemo(() => {
    const usadas = estado.encuentros
      .flatMap((e) => e.compras)
      .sort((a, b) => b.creada.localeCompare(a.creada))
      .map((c) => c.concepto.trim());
    return [...new Set([...usadas, ...CONCEPTOS])].filter(Boolean);
  }, [estado.encuentros]);
  const texto = concepto.trim().toLowerCase();
  const coincidencias = sugerencias
    .filter((s) => s.toLowerCase() !== texto && (!texto || s.toLowerCase().includes(texto)))
    .slice(0, 6);

  if (id && !existente) {
    return (
      <Pantalla titulo="Compra" atras="/compras" sinNav>
        <Vacio icono={<Tag size={36} />}>Esta compra ya no existe.</Vacio>
      </Pantalla>
    );
  }

  if (encuentro.personas.length === 0) {
    return (
      <Pantalla titulo="Registrar compra" atras sinNav>
        <Vacio icono={<Tag size={36} />}>Para registrar una compra primero tenés que cargar a las personas.</Vacio>
        <button className="btn" onClick={() => navigate('/personas')}>
          Ir a Personas
        </button>
      </Pantalla>
    );
  }

  const monto = parsearImporte(importe);
  const errores = {
    persona: !personaId && 'Elegí quién hizo la compra',
    importe: monto <= 0 && 'Ingresá cuánto gastó',
    concepto: !concepto.trim() && 'Escribí qué compró',
    comida: !comidaId && 'Elegí para qué comida es',
  };
  const valido = !Object.values(errores).some(Boolean);

  const guardar = () => {
    setIntentado(true);
    if (!valido) return;
    const datos = { personaId, comidaId, concepto: concepto.trim(), importe: monto };
    actualizar((e) => {
      if (existente) {
        const c = e.compras.find((x) => x.id === existente.id);
        if (c) Object.assign(c, datos);
      } else {
        e.compras.push({ id: nuevoId(), ...datos, creada: new Date().toISOString() });
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
          <label htmlFor="rc-persona">¿Quién hizo la compra?</label>
          <div className="control">
            <User size={20} />
            <select id="rc-persona" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
              <option value="">Elegir persona…</option>
              {[...encuentro.personas]
                .sort((a, b) => a.nombre.localeCompare(b.nombre))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
            </select>
          </div>
          {intentado && errores.persona && <div className="error">{errores.persona}</div>}
        </div>

        <div className="campo">
          <label htmlFor="rc-importe">¿Cuánto gastó?</label>
          <div className="control">
            <Banknote size={20} />
            <span style={{ fontSize: 15 }}>$</span>
            <input
              id="rc-importe"
              inputMode="numeric"
              placeholder="0"
              value={monto ? new Intl.NumberFormat('es-AR').format(monto) : ''}
              onChange={(e) => setImporte(e.target.value)}
            />
          </div>
          {intentado && errores.importe && <div className="error">{errores.importe}</div>}
        </div>

        <div className="campo">
          <label htmlFor="rc-concepto">¿Qué compró?</label>
          <div className="control">
            <ShoppingBag size={20} />
            <input
              id="rc-concepto"
              autoComplete="off"
              placeholder="Ej.: Carne y chorizos para el asado"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              onFocus={() => setEscribiendo(true)}
              onBlur={() => setTimeout(() => setEscribiendo(false), 150)}
            />
          </div>
          {escribiendo && coincidencias.length > 0 && (
            <div className="sugerencias">
              {coincidencias.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="sugerencia"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setConcepto(s);
                    setEscribiendo(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {intentado && errores.concepto && <div className="error">{errores.concepto}</div>}
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label htmlFor="rc-comida">¿Para qué comida?</label>
          <div className="control">
            <CalendarDays size={20} />
            <select id="rc-comida" value={comidaId} onChange={(e) => setComidaId(e.target.value)}>
              {comidas.map((c) => (
                <option key={c.id} value={c.id}>
                  {nombreComida(c)}
                  {c.menu ? ` (${c.menu})` : ''}
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
