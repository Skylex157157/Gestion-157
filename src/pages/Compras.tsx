import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ReceiptText, Search, ShoppingCart } from 'lucide-react';
import { useEncuentro } from '../lib/store';
import { GASTOS_GENERALES } from '../lib/types';
import { ordenarComidas } from '../lib/calculos';
import { dinero, hora, nombreComida } from '../lib/formato';
import { Avatar, Fila, IconoComida, Pantalla, Vacio } from '../components/ui';

export default function Compras() {
  const { encuentro } = useEncuentro();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const persona = (id: string) => encuentro.personas.find((p) => p.id === id);

  const texto = busqueda.trim().toLowerCase();
  const coincide = (c: (typeof encuentro.compras)[number]) =>
    !texto ||
    c.concepto.toLowerCase().includes(texto) ||
    c.observaciones.toLowerCase().includes(texto) ||
    (persona(c.personaId)?.nombre.toLowerCase().includes(texto) ?? false);

  const deLa = (comidaId: string) =>
    encuentro.compras.filter((c) => c.comidaId === comidaId && coincide(c)).sort((a, b) => a.creada.localeCompare(b.creada));

  const grupos = [
    ...ordenarComidas(encuentro.comidas).map((comida) => ({
      clave: comida.id,
      titulo: nombreComida(comida),
      icono: <IconoComida tipo={comida.tipo} tam={18} />,
      compras: deLa(comida.id),
    })),
    {
      clave: GASTOS_GENERALES,
      titulo: 'Gastos generales',
      icono: <ReceiptText size={18} color="var(--texto-2)" />,
      compras: deLa(GASTOS_GENERALES),
    },
  ].filter((g) => g.compras.length > 0);

  const total = grupos.reduce((s, g) => s + g.compras.reduce((t, c) => t + c.importe, 0), 0);

  return (
    <Pantalla titulo="Compras" atras="/">
      <label className="buscador">
        <Search size={18} />
        <input
          placeholder="Buscar por persona o concepto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </label>

      {encuentro.compras.length > 0 && (
        <div className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          <span>{texto ? 'Total filtrado' : 'Total gastado'}</span>
          <span>{dinero(total)}</span>
        </div>
      )}

      {encuentro.compras.length === 0 && (
        <Vacio icono={<ShoppingCart size={40} />}>
          Cada vez que alguien compra algo para una comida, registralo acá.
        </Vacio>
      )}

      {grupos.map(({ clave, titulo, icono, compras }) => (
        <div key={clave}>
          <div className="seccion-titulo" style={{ justifyContent: 'flex-start', gap: 8 }}>
            {icono}
            {titulo}
            {clave === GASTOS_GENERALES && (
              <button style={{ marginLeft: 'auto' }} onClick={() => navigate('/resumen/generales')}>
                Ver reparto
              </button>
            )}
          </div>
          <div className="lista">
            {compras.map((c) => (
              <Fila key={c.id} onClick={() => navigate(`/compras/${c.id}`)}>
                <Avatar persona={persona(c.personaId)} tam="chico" />
                <div className="cuerpo">
                  <div className="titulo">{persona(c.personaId)?.nombre ?? 'Persona borrada'}</div>
                  <div className="sub">
                    {c.concepto}
                    {c.observaciones && ` · ${c.observaciones}`}
                  </div>
                </div>
                <div className="monto">
                  {dinero(c.importe)}
                  <small>{c.creada && hora(c.creada)}</small>
                </div>
              </Fila>
            ))}
          </div>
        </div>
      ))}

      <button className="btn" onClick={() => navigate('/compras/nueva')}>
        <Plus size={20} /> Registrar compra
      </button>
    </Pantalla>
  );
}
