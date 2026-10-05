import { useNavigate } from 'react-router-dom';
import { Info, PiggyBank, ReceiptText } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { administradorEfectivo, resumenGastosGenerales, resumenGeneral } from '../lib/calculos';
import { dinero, nombreComidaCorto } from '../lib/formato';
import { Avatar, Fila, IconoComida, Pantalla } from '../components/ui';

export default function FondoComun() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const g = resumenGeneral(encuentro);
  const gen = resumenGastosGenerales(encuentro);
  const administradorId = administradorEfectivo(encuentro);
  const administrador = encuentro.personas.find((p) => p.id === administradorId);

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
        <Fila onClick={() => administrador && navigate(`/personas/${administrador.id}`)}>
          <Avatar persona={administrador} tam="chico" />
          <div className="cuerpo">
            <div className="titulo">{administrador?.nombre ?? 'Sin elegir'}</div>
            <div className="sub">Maneja la plata y guarda el fondo</div>
          </div>
        </Fila>
      </div>

      <div className="seccion-titulo">De dónde sale</div>
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
        {gen.fondo !== 0 && (
          <Fila onClick={() => navigate('/resumen/generales')}>
            <ReceiptText size={18} color="var(--texto-2)" />
            <div className="cuerpo">
              <div className="titulo">Gastos generales</div>
            </div>
            <div className="monto">{dinero(gen.fondo)}</div>
          </Fila>
        )}
      </div>

      <div className="aviso">
        <Info size={20} />
        <span>
          Este dinero proviene de las diferencias entre el costo real de cada comida y el importe cobrado a los
          comensales (por el redondeo a {dinero(encuentro.redondeo)})
          {gen.redondeo > 1 ? `, más el redondeo de los gastos generales a ${dinero(gen.redondeo)}` : ''}. Queda para el
          grupo
          {administrador ? ` y lo guarda ${administrador.nombre}` : ''}.
        </span>
      </div>
    </Pantalla>
  );
}
