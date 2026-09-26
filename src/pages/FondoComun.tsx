import { useNavigate } from 'react-router-dom';
import { Info, PiggyBank } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenGeneral, tesoreroEfectivo } from '../lib/calculos';
import { dinero, nombreComidaCorto } from '../lib/formato';
import { Avatar, Fila, IconoComida, Pantalla } from '../components/ui';

export default function FondoComun() {
  const { encuentro, actualizar } = useEncuentro();
  const navigate = useNavigate();
  const g = resumenGeneral(encuentro);
  const tesoreroId = tesoreroEfectivo(encuentro);
  const tesorero = encuentro.personas.find((p) => p.id === tesoreroId);

  return (
    <Pantalla titulo="Fondo común" atras>
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--verde-100)' }}>
        <PiggyBank size={56} color="var(--verde-700)" fill="var(--verde-600)" fillOpacity={0.25} />
        <div>
          <div style={{ fontSize: 14, color: 'var(--verde-800)' }}>Total acumulado</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--verde-700)' }}>{dinero(g.fondo)}</div>
        </div>
      </div>

      <div className="seccion-titulo">Quién lo guarda</div>
      <div className="lista">
        <div className="fila">
          <Avatar persona={tesorero} tam="chico" />
          <div className="cuerpo">
            <div className="control" style={{ minHeight: 0, border: 0, padding: 0 }}>
              <select
                aria-label="Tesorero"
                value={tesoreroId ?? ''}
                onChange={(e) => actualizar((x) => (x.tesoreroId = e.target.value || null))}
                style={{ padding: '4px 22px 4px 0', fontWeight: 500 }}
              >
                {encuentro.personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="seccion-titulo">Detalle por comida</div>
      <div className="lista">
        {g.comidas.length === 0 && <div className="vacio">Sin comidas.</div>}
        {g.comidas.map((r) => (
          <Fila key={r.comida.id} onClick={() => navigate(`/comidas/${r.comida.id}`)}>
            <IconoComida tipo={r.comida.tipo} tam={18} />
            <div className="cuerpo">
              <div className="titulo">{nombreComidaCorto(r.comida)}</div>
            </div>
            <div className="monto">{dinero(r.fondo)}</div>
          </Fila>
        ))}
      </div>

      <div className="aviso">
        <Info size={20} />
        <span>
          Este dinero proviene de las diferencias entre el costo real de cada comida y el importe cobrado a los
          comensales (por el redondeo a {dinero(encuentro.redondeo)}). Queda para el grupo
          {tesorero ? ` y lo guarda ${tesorero.nombre}` : ''}.
        </span>
      </div>
    </Pantalla>
  );
}
