import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpToLine, Check, Info, PiggyBank, Plus, ReceiptText, Users, Wallet } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { resumenGastosGenerales } from '../lib/calculos';
import { dinero } from '../lib/formato';
import { GASTOS_GENERALES } from '../lib/types';
import { FilaCompra, Hoja, Pantalla, Vacio, avisar } from '../components/ui';

const REDONDEOS = [1, 100, 500, 1000, 2000, 5000, 10000];

export default function GastosGenerales() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const g = resumenGastosGenerales(encuentro);
  const compras = encuentro.compras.filter((c) => c.comidaId === GASTOS_GENERALES);
  const [redondeando, setRedondeando] = useState(false);
  const redondeado = g.redondeo > 1;

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
            <div className="etq">{redondeado ? 'Pone cada uno' : 'Por persona'}</div>
            <div className="valor">{dinero(g.cobroPorPersona)}</div>
          </div>
        </div>
        <div className="tile verde">
          <PiggyBank className="ico" size={24} />
          <div>
            <div className="etq">Fondo común</div>
            <div className="valor">{dinero(g.fondo)}</div>
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
          Se reparten en partes iguales entre todas las personas del encuentro ({g.personas}).{' '}
          {redondeado
            ? `Cada uno pone el costo real (${dinero(g.porPersona)}) redondeado hacia arriba a ${dinero(g.redondeo)}, y lo que sobra va al fondo común.`
            : 'Sin redondeo: cada uno pone el costo exacto y no suma al fondo común.'}{' '}
          Si agregás o quitás personas, el reparto se actualiza solo.
        </span>
      </div>

      <button className="btn" onClick={() => navigate(`/compras/nueva?comida=${GASTOS_GENERALES}`)}>
        <Plus size={20} /> Registrar gasto general
      </button>
      <button className="btn borde" onClick={() => setRedondeando(true)}>
        <ArrowUpToLine size={20} /> {redondeado ? `Redondeo: ${dinero(g.redondeo)}` : 'Redondear lo que pone cada uno'}
      </button>

      {redondeando && <HojaRedondeo onCerrar={() => setRedondeando(false)} />}
    </Pantalla>
  );
}

/** Menú para redondear hacia arriba lo que pone cada uno por gastos generales. */
function HojaRedondeo({ onCerrar }: { onCerrar: () => void }) {
  const { encuentro, actualizar } = useEncuentro();
  const actual = resumenGastosGenerales(encuentro).redondeo;

  const elegir = (r: number) => {
    actualizar((e) => {
      e.redondeoGenerales = r;
    });
    onCerrar();
    avisar(r > 1 ? `Gastos generales redondeados a ${dinero(r)}` : 'Gastos generales sin redondeo');
  };

  return (
    <Hoja titulo="Redondear gastos generales" onCerrar={onCerrar}>
      <p className="ayuda" style={{ margin: '-8px 0 12px', fontSize: 13 }}>
        Elegí a cuánto redondear hacia arriba lo que pone cada uno. Lo que sobra va al fondo común.
      </p>
      <div className="lista" style={{ marginBottom: 0 }}>
        {REDONDEOS.map((r) => {
          const op = resumenGastosGenerales({ ...encuentro, redondeoGenerales: r });
          const elegido = r === actual;
          return (
            <button
              key={r}
              className={`fila opcion-redondeo ${elegido ? 'elegida' : ''}`}
              aria-pressed={elegido}
              onClick={() => elegir(r)}
            >
              <div className="cuerpo">
                <div className="titulo">{r === 1 ? 'Sin redondeo (exacto)' : `A ${dinero(r)}`}</div>
                <div className="sub">{op.fondo > 0 ? `Al fondo común: +${dinero(op.fondo)}` : 'No suma al fondo común'}</div>
              </div>
              <div className="monto">
                {dinero(op.cobroPorPersona)}
                <small>c/u</small>
              </div>
              <span className="check-opcion">{elegido && <Check size={18} strokeWidth={2.6} />}</span>
            </button>
          );
        })}
      </div>
    </Hoja>
  );
}
