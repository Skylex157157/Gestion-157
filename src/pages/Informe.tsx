import { FileDown, Info } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import {
  compradorEfectivo,
  ordenarComidas,
  resumenCobranza,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
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
  const cobranza = resumenCobranza(encuentro, personas);
  const comidas = ordenarComidas(encuentro.comidas);
  const nombre = (id: string) => encuentro.personas.find((p) => p.id === id)?.nombre ?? '?';
  const comprador = compradorEfectivo(encuentro);
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
                <td>Fondo común{comprador ? ` (lo guarda ${nombre(comprador)})` : ''}</td>
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
                  {r.comensales} comensales · Costo real por persona{' '}
                  {dinero(r.comensales ? r.gastoReal / r.comensales : 0)} · Se cobra {dinero(r.cobroPorPersona)}
                  {r.esPrecioFijo ? ' (precio fijo)' : ''} · Fondo {dinero(r.fondo)}
                </p>
                <TablaCompras compras={compras} total={r.gastoReal} />
              </div>
            );
          })}
        </section>

        <section className="informe-seccion">
          <h2>Gastos generales</h2>
          <p className="informe-datos">
            Total {dinero(gen.total)} · Se reparte entre {gen.personas} personas · {dinero(gen.porPersona)} por persona ·
            No suma al fondo común
          </p>
          <TablaCompras
            compras={encuentro.compras.filter((c) => c.comidaId === GASTOS_GENERALES)}
            total={gen.total}
          />
        </section>

        <section className="informe-seccion">
          <h2>Liquidación final</h2>
          <p className="informe-datos">
            {comprador ? `Hizo todas las compras ${nombre(comprador)}; cada uno le paga a esa persona. ` : ''}
            Total a cobrar {dinero(cobranza.totalACobrar)} · Cobrado {dinero(cobranza.cobrado)} (efectivo{' '}
            {dinero(cobranza.efectivo)}, transferencia {dinero(cobranza.transferencia)}) · Pendiente{' '}
            {dinero(cobranza.pendiente)} · Pagaron {cobranza.alDia} de {cobranza.deudores}
          </p>
          <div className="tabla-wrap">
            <table className="tabla informe-tabla">
              <thead>
                <tr>
                  <th>Comensal</th>
                  <th>Le corresponde</th>
                  <th>Pagó</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {personasOrdenadas.map((p) => (
                  <tr key={p.persona.id}>
                    <td>{p.persona.nombre}</td>
                    <td>{dinero(p.aPagar)}</td>
                    <td>{p.esComprador ? '—' : dinero(p.pagado)}</td>
                    <td className={p.esComprador ? '' : p.pendiente > 0 ? 'negativo' : 'positivo'}>
                      {p.esComprador
                        ? 'Compra todo'
                        : p.pendiente > 0
                          ? `Debe ${dinero(p.pendiente)}`
                          : p.pagos.length
                            ? `Pagado (${[...new Set(p.pagos.map((x) => NOMBRE_METODO[x.metodo]))].join(' + ')})`
                            : 'No debe'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </article>
    </Pantalla>
  );
}

function TablaCompras({
  compras,
  total,
}: {
  compras: { id: string; concepto: string; observaciones: string; importe: number }[];
  total: number;
}) {
  if (compras.length === 0) return <p className="informe-nota">Sin compras.</p>;
  return (
    <table className="tabla informe-tabla">
      <thead>
        <tr>
          <th>Compra</th>
          <th>Importe</th>
        </tr>
      </thead>
      <tbody>
        {compras.map((c) => (
          <tr key={c.id}>
            <td>
              {c.concepto}
              {c.observaciones && <span className="informe-nota"> · {c.observaciones}</span>}
            </td>
            <td>{dinero(c.importe)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>Total</td>
          <td>{dinero(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
