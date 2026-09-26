import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, ChefHat, ChevronRight, Plus, Utensils } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenGeneral } from '../lib/calculos';
import {
  dinero,
  fechaCorta,
  NOMBRE_TIPO,
  nombreComida,
  nombreDia,
  nuevoId,
  parsearImporte,
  TIPOS_COMIDA,
} from '../lib/formato';
import type { Comida, TipoComida } from '../lib/types';
import { Hoja, IconoComida, Pantalla, Switch, Vacio } from '../components/ui';

export default function Comidas() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const [agregando, setAgregando] = useState(false);
  const { comidas } = resumenGeneral(encuentro);

  return (
    <Pantalla titulo="Comidas del encuentro" atras="/">
      {comidas.length === 0 && (
        <Vacio icono={<Utensils size={40} />}>
          Agregá cada desayuno, almuerzo, merienda o cena del encuentro.
        </Vacio>
      )}
      {comidas.map((r) => (
        <button
          key={r.comida.id}
          className={`comida-card tipo-${r.comida.tipo}`}
          onClick={() => navigate(`/comidas/${r.comida.id}`)}
        >
          <IconoComida tipo={r.comida.tipo} tam={32} />
          <div className="cuerpo">
            <div className="titulo">{nombreComida(r.comida)}</div>
            {r.comida.menu && <div className="sub menu-comida">{r.comida.menu}</div>}
            <div className="sub">
              {r.comida.asistentes.length} comensales
            </div>
            <div className="monto">{dinero(r.gastoReal)}</div>
          </div>
          <ChevronRight size={20} className="chev" />
        </button>
      ))}
      <button className="btn" onClick={() => setAgregando(true)}>
        <Plus size={20} /> Agregar comida
      </button>
      {agregando && (
        <FormComida
          onCerrar={() => setAgregando(false)}
          onGuardada={(id) => navigate(`/comidas/${id}`)}
        />
      )}
    </Pantalla>
  );
}

/** Días entre dos fechas ISO, inclusive. */
function diasEntre(inicio: string, fin: string): string[] {
  const dias: string[] = [];
  if (!inicio) return dias;
  const d = new Date(inicio + 'T12:00:00');
  const hasta = new Date((fin || inicio) + 'T12:00:00');
  while (d <= hasta && dias.length < 60) {
    dias.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

export function FormComida({
  comida,
  onCerrar,
  onGuardada,
}: {
  comida?: Comida;
  onCerrar: () => void;
  onGuardada?: (id: string) => void;
}) {
  const { encuentro, actualizar } = useEncuentro();
  const [fecha, setFecha] = useState(comida?.fecha ?? encuentro.fechaInicio);
  const [tipo, setTipo] = useState<TipoComida>(comida?.tipo ?? 'almuerzo');
  const [todos, setTodos] = useState(true);
  const [menu, setMenu] = useState(comida?.menu ?? '');
  const [conPrecioFijo, setConPrecioFijo] = useState((comida?.precioFijo ?? 0) > 0);
  const [precio, setPrecio] = useState(comida?.precioFijo ? String(comida.precioFijo) : '');
  const precioFijo = conPrecioFijo ? parsearImporte(precio) : 0;
  const dias = diasEntre(encuentro.fechaInicio, encuentro.fechaFin);
  // Si la comida quedó fuera de las fechas del encuentro, igual se muestra su día
  const opcionesDia = fecha && !dias.includes(fecha) ? [...dias, fecha].sort() : dias;

  const repetida = encuentro.comidas.some((c) => c.fecha === fecha && c.tipo === tipo && c.id !== comida?.id);

  const guardar = () => {
    const id = comida?.id ?? nuevoId();
    actualizar((e) => {
      if (comida) {
        const c = e.comidas.find((x) => x.id === comida.id);
        if (c) {
          c.fecha = fecha;
          c.tipo = tipo;
          c.menu = menu.trim();
          c.precioFijo = precioFijo || null;
        }
      } else {
        e.comidas.push({
          id,
          fecha,
          tipo,
          menu: menu.trim(),
          precioFijo: precioFijo || null,
          asistentes: todos ? e.personas.map((p) => p.id) : [],
        });
      }
    });
    onCerrar();
    onGuardada?.(id);
  };

  return (
    <Hoja titulo={comida ? 'Editar comida' : 'Agregar comida'} onCerrar={onCerrar}>
      <div className="campo">
        <span className="etiqueta">Día</span>
        {opcionesDia.length > 0 ? (
          <div className="dias" role="radiogroup" aria-label="Día">
            {opcionesDia.map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={d === fecha}
                className={`dia ${d === fecha ? 'activo' : ''}`}
                onClick={() => setFecha(d)}
              >
                <span className="dia-nombre">{nombreDia(d)}</span>
                <span className="dia-fecha">{fechaCorta(d).split(' ')[1]}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="control">
            <input id="fc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        )}
        {opcionesDia.length > 0 && (
          <div className="ayuda">Para usar otros días, cambiá las fechas del encuentro.</div>
        )}
      </div>
      <div className="campo">
        <span className="etiqueta">Comida</span>
        <div className="tabs" style={{ boxShadow: 'none', border: '1.5px solid var(--borde)' }}>
          {TIPOS_COMIDA.map((t) => (
            <button key={t} className={t === tipo ? 'activo' : ''} onClick={() => setTipo(t)}>
              {NOMBRE_TIPO[t]}
            </button>
          ))}
        </div>
        {repetida && <div className="error">Ya existe esa comida ese día.</div>}
      </div>
      <div className="campo">
        <label htmlFor="fc-menu">Menú (opcional)</label>
        <div className="control">
          <ChefHat size={20} />
          <input id="fc-menu" placeholder="Ej.: Asado" value={menu} onChange={(e) => setMenu(e.target.value)} />
        </div>
      </div>
      <div className="campo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span className="etiqueta" style={{ margin: 0 }}>
              Precio fijo por persona
            </span>
            <div className="ayuda">
              {conPrecioFijo
                ? 'Se cobra este valor. La diferencia con el costo real va al fondo común.'
                : `Si no, se cobra el costo real redondeado a ${dinero(encuentro.redondeo)}.`}
            </div>
          </div>
          <Switch checked={conPrecioFijo} onChange={setConPrecioFijo} />
        </div>
        {conPrecioFijo && (
          <div className="control" style={{ marginTop: 10 }}>
            <Banknote size={20} />
            <span>$</span>
            <input
              id="fc-precio"
              inputMode="numeric"
              placeholder="Ej.: 19.000"
              value={precioFijo ? new Intl.NumberFormat('es-AR').format(precioFijo) : ''}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </div>
        )}
      </div>
      {!comida && encuentro.personas.length > 0 && (
        <div className="campo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span className="etiqueta" style={{ margin: 0 }}>
              Incluir a todos ({encuentro.personas.length})
            </span>
            <div className="ayuda">Después podés quitar a los que no vinieron.</div>
          </div>
          <Switch checked={todos} onChange={setTodos} />
        </div>
      )}
      <button className="btn" disabled={!fecha || repetida || (conPrecioFijo && !precioFijo)} onClick={guardar}>
        {comida ? 'Guardar cambios' : 'Agregar comida'}
      </button>
    </Hoja>
  );
}
