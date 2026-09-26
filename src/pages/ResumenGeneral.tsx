import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Banknote, ClipboardList, FileText, ReceiptText, PiggyBank, Share2, UserRound, Users, Utensils } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenGeneral } from '../lib/calculos';
import { compartirResumen } from '../components/Menu';
import { dinero, nombreComidaCorto } from '../lib/formato';

/** Versión compacta para la tabla: "$60.000" */
const corto = (v: number) => dinero(v).replace('$ ', '$');
import { IconoComida, Pantalla } from '../components/ui';

export default function ResumenGeneral() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const g = resumenGeneral(encuentro);

  const compartir = () => compartirResumen(encuentro);

  return (
    <Pantalla
      titulo="Resumen general"
      atras="/"
      acciones={
        <button className="icon-btn" aria-label="Compartir resumen" onClick={compartir}>
          <Share2 size={21} />
        </button>
      }
    >
      <div className="tiles compactas" style={{ marginBottom: 12 }}>
        <div className="tile amarillo">
          <Utensils className="ico" size={24} />
          <div>
            <div className="etq">Gasto real total</div>
            <div className="valor">{dinero(g.gastoReal)}</div>
          </div>
        </div>
        <div className="tile azul">
          <Banknote className="ico" size={24} />
          <div>
            <div className="etq">Total cobrado</div>
            <div className="valor">{dinero(g.recaudado)}</div>
          </div>
        </div>
        <div className="tile verde">
          <PiggyBank className="ico" size={24} />
          <div>
            <div className="etq">Fondo común</div>
            <div className="valor">{dinero(g.fondo)}</div>
          </div>
        </div>
        <div className="tile azul">
          <Users className="ico" size={24} />
          <div>
            <div className="etq">Total de personas</div>
            <div className="valor">{g.personas}</div>
          </div>
        </div>
      </div>

      <div className="seccion-titulo">Gastos por comida</div>
      <div className="card tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>Comida</th>
              <th>Gasto real</th>
              <th>Cobrado</th>
              <th>Fondo</th>
            </tr>
          </thead>
          <tbody>
            {g.comidas.length === 0 && g.gastosGenerales === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--texto-3)' }}>
                  Sin comidas
                </td>
              </tr>
            )}
            {g.comidas.map((r) => (
              <tr key={r.comida.id} onClick={() => navigate(`/resumen/comidas?c=${r.comida.id}`)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="nombre-comida">
                    <IconoComida tipo={r.comida.tipo} tam={14} />
                    {nombreComidaCorto(r.comida)}
                  </span>
                </td>
                <td>{corto(r.gastoReal)}</td>
                <td>{corto(r.recaudado)}</td>
                <td className="positivo">{corto(r.fondo)}</td>
              </tr>
            ))}
            {g.gastosGenerales > 0 && (
              <tr onClick={() => navigate('/resumen/generales')} style={{ cursor: 'pointer' }}>
                <td>
                  <span className="nombre-comida">
                    <ReceiptText size={14} color="var(--texto-2)" />
                    Gastos generales
                  </span>
                </td>
                <td>{corto(g.gastosGenerales)}</td>
                <td>{corto(g.gastosGenerales)}</td>
                <td className="positivo">{corto(0)}</td>
              </tr>
            )}
          </tbody>
          {(g.comidas.length > 0 || g.gastosGenerales > 0) && (
            <tfoot>
              <tr>
                <td>Total</td>
                <td>{corto(g.gastoReal)}</td>
                <td>{corto(g.recaudado)}</td>
                <td className="positivo">{corto(g.fondo)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="seccion-titulo">Ver detalle</div>
      <div className="accesos">
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/resumen/comidas')}>
          <ClipboardList size={22} /> Por comida
        </button>
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/personas')}>
          <UserRound size={22} /> Por persona
        </button>
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/resumen/fondo')}>
          <PiggyBank size={22} /> Fondo común
        </button>
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/resumen/cobranza')}>
          <ArrowLeftRight size={22} /> Cobranza
        </button>
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/resumen/generales')}>
          <ReceiptText size={22} /> Gastos generales
        </button>
        <button className="acceso" style={{ border: 0 }} onClick={() => navigate('/informe')}>
          <FileText size={22} /> Informe / PDF
        </button>
      </div>
      <button className="btn" onClick={() => navigate('/resumen/cobranza')}>
        <ArrowLeftRight size={20} /> ¿Quién paga a quién?
      </button>
    </Pantalla>
  );
}
