import { FileDown, Info } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import {
  administradorEfectivo,
  ordenarComidas,
  resumenCobranza,
  resumenGastosGenerales,
  resumenGeneral,
  resumenPersonas,
} from '../lib/calculos';
import { ES_ARTIFACT } from '../lib/exportar';
import { dinero, fechaCorta, hoyISO, NOMBRE_METODO, nombreComida, nombreComidaCorto } from '../lib/formato';
import { GASTOS_GENERALES, type Compra } from '../lib/types';
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
  const administrador = administradorEfectivo(encuentro);
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
                <td>Fondo común{administrador ? ` (lo guarda ${nombre(administrador)})` : ''}</td>
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
                <TablaCompras compras={compras} nombre={nombre} total={r.gastoReal} />
              </div>
            );
          })}
        </section>

        <section className="informe-seccion">
          <h2>Gastos generales</h2>
          <p className="informe-datos">
            Total {dinero(gen.total)} · Se reparte entre {gen.personas} personas · Costo real {dinero(gen.porPersona)} por
            persona
            {gen.redondeo > 1
              ? ` · Se cobra ${dinero(gen.cobroPorPersona)} (redondeado a ${dinero(gen.redondeo)}) · Fondo ${dinero(gen.fondo)}`
              : ' · Sin redondeo, no suma al fondo común'}
          </p>
          <TablaCompras
            nombre={nombre}
            compras={encuentro.compras.filter((c) => c.comidaId === GASTOS_GENERALES)}
            total={gen.total}
          />
        </section>

        <section className="informe-seccion">
          <h2>Liquidación final</h2>
          <p className="informe-datos">
            {administrador ? `Maneja la plata ${nombre(administrador)}: todos arreglan cuentas con esa persona. ` : ''}
            Cada uno pone lo que le toca menos lo que gastó en compras. A cobrar {dinero(cobranza.totalACobrar)}{' '}
            (cobrado {dinero(cobranza.cobrado)}: efectivo {dinero(cobranza.efectivo)}, transferencia{' '}
            {dinero(cobranza.transferencia)}) · A devolver {dinero(cobranza.totalADevolver)} (devuelto{' '}
            {dinero(cobranza.devuelto)}) · Al día {cobranza.alDia} de {cobranza.personas}
          </p>
          <div className="tabla-wrap">
            <table className="tabla informe-tabla">
              <thead>
                <tr>
                  <th>Comensal</th>
                  <th>Le toca</th>
                  <th>Compró</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {personasOrdenadas.map((p) => (
                  <tr key={p.persona.id}>
                    <td>
                      {p.persona.nombre}
                      {p.esAdministrador && <span className="informe-nota"> (maneja la plata)</span>}
                    </td>
                    <td>{dinero(p.aPagar)}</td>
                    <td>{dinero(p.compras)}</td>
                    <td className={p.saldo === 0 ? '' : p.saldo > 0 ? 'negativo' : 'positivo'}>
                      {p.saldo > 0
                          ? `Debe ${dinero(p.saldo)}`
                          : p.saldo < 0
                            ? `Se le devuelven ${dinero(-p.saldo)}`
                            : 'Al día'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {encuentro.pagos.length > 0 && (
            <>
              <h3>Pagos registrados</h3>
              <table className="tabla informe-tabla">
                <tbody>
                  {encuentro.pagos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.tipo === 'pago' ? `${nombre(p.personaId)} pagó` : `Se le devolvió a ${nombre(p.personaId)}`}
                        <span className="informe-nota">
                          {' '}
                          · {NOMBRE_METODO[p.metodo]} · {fechaCorta(p.fecha)}
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
  compras: Compra[];
  nombre: (id: string) => string;
  total: number;
}) {
  if (compras.length === 0) return <p className="informe-nota">Sin compras.</p>;
  return (
    <table className="tabla informe-tabla">
      <thead>
        <tr>
          <th>Qué se compró</th>
          <th>Quién</th>
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
