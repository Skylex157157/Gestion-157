import { FileDown, Info } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import {
  ordenarComidas,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
  tesoreroEfectivo,
  transferenciasSugeridas,
} from '../lib/calculos';
import { ES_ARTIFACT } from '../lib/exportar';
import { dinero, fechaCorta, hoyISO, NOMBRE_METODO, nombreComida, nombreComidaCorto } from '../lib/formato';
import { GASTOS_GENERALES } from '../lib/types';
import { Pantalla } from '../components/ui';

/** Informe completo del encuentro, pensado para imprimir o guardar como PDF. */
export default function Informe() {
  const { encuentro } = useEncuentro();
  const g = resumenGeneral(encuentro);
  const gen = resumenGastosGenerales(encuentro);
  const personas = resumenPersonas(encuentro);
  const transferencias = transferenciasSugeridas(personas.map((p) => ({ id: p.persona.id, saldo: p.saldo })));
  const comidas = ordenarComidas(encuentro.comidas);
  const nombre = (id: string) => encuentro.personas.find((p) => p.id === id)?.nombre ?? '?';
  const tesorero = tesoreroEfectivo(encuentro);
  const personasOrdenadas = [...personas].sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre));

  return (
    <Pantalla
      titulo="Informe"
      atras
      acciones={
        !ES_ARTIFACT && (
          <button className="icon-btn" aria-label="Guardar como PDF" onClick={() => window.print()}>
            <FileDown size={21} />
          </button>
        )
      }
    >
      {ES_ARTIFACT ? (
        <div className="aviso no-imprimir">
          <Info size={20} />
          <span>
            En esta versión de prueba no se puede imprimir. En la app instalada, el botón de arriba lo guarda como PDF.
          </span>
        </div>
      ) : (
        <button className="btn no-imprimir" style={{ marginBottom: 12 }} onClick={() => window.print()}>
          <FileDown size={20} /> Guardar como PDF / Imprimir
        </button>
      )}

      <article className="informe">
        <header className="informe-cab">
          <h1>{encuentro.nombre}</h1>
          <p>
            {fechaCorta(encuentro.fechaInicio)} al {fechaCorta(encuentro.fechaFin)} ·{' '}
            {encuentro.cerrado ? 'Encuentro cerrado' : 'Encuentro abierto'} · Informe del {fechaCorta(hoyISO())}
          </p>
        </header>

        <section className="informe-seccion">
          <h2>Resumen</h2>
          <table className="tabla informe-tabla">
            <tbody>
              <tr>
                <td>Gasto en comidas</td>
                <td>{dinero(g.gastoComidas)}</td>
              </tr>
              <tr>
                <td>Gastos generales</td>
                <td>{dinero(g.gastosGenerales)}</td>
              </tr>
              <tr>
                <td>Gasto real total</td>
                <td>{dinero(g.gastoReal)}</td>
              </tr>
              <tr>
                <td>Total cobrado</td>
                <td>{dinero(g.recaudado)}</td>
              </tr>
              <tr>
                <td>Fondo común{tesorero ? ` (lo guarda ${nombre(tesorero)})` : ''}</td>
                <td>{dinero(g.fondo)}</td>
              </tr>
              <tr>
                <td>Personas</td>
                <td>{encuentro.personas.length}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="informe-seccion">
          <h2>Comensales y comidas</h2>
          <table className="tabla informe-tabla">
            <thead>
              <tr>
                <th>Comensal</th>
                <th>Comidas</th>
              </tr>
            </thead>
            <tbody>
              {personasOrdenadas.map(({ persona }) => (
                <tr key={persona.id}>
                  <td>
                    {persona.nombre}
                    {persona.esNino && <span className="informe-nota"> (chico, no paga)</span>}
                  </td>
                  <td className="informe-lista">
                    {comidas
                      .filter((c) => c.asistentes.includes(persona.id))
                      .map(nombreComidaCorto)
                      .join(', ') || 'Ninguna'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="informe-seccion">
          <h2>Comidas</h2>
          {g.comidas.length === 0 && <p className="informe-nota">No hay comidas cargadas.</p>}
          {g.comidas.map((r) => {
            const compras = encuentro.compras.filter((c) => c.comidaId === r.comida.id);
            return (
              <div className="informe-comida" key={r.comida.id}>
                <h3>
                  {nombreComida(r.comida)}
                  {r.comida.menu && <span className="informe-nota"> · {r.comida.menu}</span>}
                </h3>
                <p className="informe-datos">
                  {r.comida.asistentes.length} comensales ({r.pagantes} pagan) · Costo real por persona{' '}
                  {dinero(r.pagantes ? r.gastoReal / r.pagantes : 0)} · Se cobra {dinero(r.cobroPorPersona)}
                  {r.esPrecioFijo ? ' (precio fijo)' : ''} · Fondo {dinero(r.fondo)}
                </p>
                <TablaCompras compras={compras} nombre={nombre} total={r.gastoReal} />
              </div>
            );
          })}
        </section>

        <section className="informe-seccion">
          <h2>Gastos generales</h2>
          <p className="informe-datos">
            Total {dinero(gen.total)} · Se reparte entre {gen.adultos} adultos · {dinero(gen.porPersona)} por persona ·
            No suma al fondo común
          </p>
          <TablaCompras
            compras={encuentro.compras.filter((c) => c.comidaId === GASTOS_GENERALES)}
            nombre={nombre}
            total={gen.total}
          />
        </section>

        <section className="informe-seccion">
          <h2>Liquidación final</h2>
          <div className="tabla-wrap">
            <table className="tabla informe-tabla">
              <thead>
                <tr>
                  <th>Comensal</th>
                  <th>Le corresponde</th>
                  <th>Compró</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {personasOrdenadas.map((p) => {
                  const s = Math.round(p.saldo);
                  return (
                    <tr key={p.persona.id}>
                      <td>{p.persona.nombre}</td>
                      <td>{dinero(p.debioAportar)}</td>
                      <td>{dinero(p.compras)}</td>
                      <td className={s < 0 ? 'negativo' : s > 0 ? 'positivo' : ''}>
                        {s === 0
                          ? p.persona.esNino && p.compras === 0
                            ? 'No paga (chico)'
                            : 'Saldado'
                          : s < 0
                            ? `Paga ${dinero(-s)}`
                            : `Cobra ${dinero(s)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="informe-nota">
            El saldo ya descuenta los pagos registrados
            {tesorero ? ` y suma el fondo común a quien lo guarda (${nombre(tesorero)})` : ''}.
          </p>
        </section>

        <section className="informe-seccion">
          <h2>Quién paga a quién</h2>
          {transferencias.length === 0 ? (
            <p className="informe-nota">Todo saldado.</p>
          ) : (
            <table className="tabla informe-tabla">
              <tbody>
                {transferencias.map((t) => (
                  <tr key={t.deId + t.aId}>
                    <td>
                      {nombre(t.deId)} → {nombre(t.aId)}
                    </td>
                    <td>{dinero(t.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {encuentro.pagos.length > 0 && (
            <>
              <h3>Pagos ya realizados</h3>
              <table className="tabla informe-tabla">
                <tbody>
                  {encuentro.pagos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {nombre(p.deId)} → {nombre(p.aId)}
                        <span className="informe-nota">
                          {' '}
                          · {fechaCorta(p.fecha)}
                          {p.metodo && ` · ${NOMBRE_METODO[p.metodo]}`}
                        </span>
                      </td>
                      <td>{dinero(p.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>
      </article>
    </Pantalla>
  );
}

function TablaCompras({
  compras,
  nombre,
  total,
}: {
  compras: { id: string; concepto: string; personaId: string; importe: number }[];
  nombre: (id: string) => string;
  total: number;
}) {
  if (compras.length === 0) return <p className="informe-nota">Sin compras.</p>;
  return (
    <table className="tabla informe-tabla">
      <thead>
        <tr>
          <th>Compra</th>
          <th>Compró</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
        {compras.map((c) => (
          <tr key={c.id}>
            <td>{c.concepto}</td>
            <td>{nombre(c.personaId)}</td>
            <td>{dinero(c.importe)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>Total</td>
          <td>{dinero(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
