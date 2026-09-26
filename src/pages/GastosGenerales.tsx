import { useNavigate } from 'react-router-dom';
import { Info, PiggyBank, Plus, ReceiptText, Users, Wallet } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenGastosGenerales } from '../lib/calculos';
import { dinero } from '../lib/formato';
import { GASTOS_GENERALES } from '../lib/types';
import { FilaCompra, Pantalla, Vacio } from '../components/ui';

export default function GastosGenerales() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const g = resumenGastosGenerales(encuentro);
  const compras = encuentro.compras.filter((c) => c.comidaId === GASTOS_GENERALES);

  return (
    <Pantalla titulo="Gastos generales" atras>
      <div className="tiles compactas" style={{ marginBottom: 12 }}>
        <div className="tile amarillo">
          <ReceiptText className="ico" size={24} />
          <div>
            <div className="etq">Total</div>
            <div className="valor">{dinero(g.total)}</div>
          </div>
        </div>
        <div className="tile azul">
          <Users className="ico" size={24} />
          <div>
            <div className="etq">Se reparte entre</div>
            <div className="valor">{g.personas}</div>
          </div>
        </div>
        <div className="tile azul">
          <Wallet className="ico" size={24} />
          <div>
            <div className="etq">Por persona</div>
            <div className="valor">{dinero(g.porPersona)}</div>
          </div>
        </div>
        <div className="tile verde">
          <PiggyBank className="ico" size={24} />
          <div>
            <div className="etq">Fondo común</div>
            <div className="valor">{dinero(0)}</div>
          </div>
        </div>
      </div>

      <div className="seccion-titulo">Compras</div>
      <div className="lista">
        {compras.length === 0 && (
          <Vacio icono={<ReceiptText size={32} />}>
            Todavía no hay gastos generales. Son los que no son de una comida: nafta, alquiler, limpieza…
          </Vacio>
        )}
        {compras.map((c) => (
          <FilaCompra key={c.id} compra={c} onClick={() => navigate(`/compras/${c.id}`)} />
        ))}
        {compras.length > 0 && <div className="kv destacado"><span>Total</span><span className="v">{dinero(g.total)}</span></div>}
      </div>

      <div className="aviso">
        <Info size={20} />
        <span>
          Se reparten en partes iguales entre todas las personas del encuentro ({g.personas}), sin redondeo, así que
          no suman al fondo común. Si agregás o quitás personas, el reparto se actualiza solo.
        </span>
      </div>

      <button className="btn" onClick={() => navigate(`/compras/nueva?comida=${GASTOS_GENERALES}`)}>
        <Plus size={20} /> Registrar gasto general
      </button>
    </Pantalla>
  );
}
