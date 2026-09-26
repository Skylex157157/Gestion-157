import { useState } from 'react';
import { CalendarDays, PartyPopper } from 'lucide-react';
import { encuentroNuevo, useStore } from '../lib/store';
import { hoyISO } from '../lib/formato';
import { Hoja } from './ui';

export function NuevoEncuentro({ onCerrar }: { onCerrar: () => void }) {
  const { agregarEncuentro } = useStore();
  const [nombre, setNombre] = useState('');
  const [inicio, setInicio] = useState(hoyISO());
  const [fin, setFin] = useState(hoyISO());

  const crear = () => {
    if (!nombre.trim()) return;
    agregarEncuentro(encuentroNuevo(nombre.trim(), inicio, fin < inicio ? inicio : fin));
    onCerrar();
  };

  return (
    <Hoja titulo="Nuevo encuentro" onCerrar={onCerrar}>
      <div className="campo">
        <label htmlFor="ne-nombre">Nombre</label>
        <div className="control">
          <PartyPopper size={20} />
          <input
            id="ne-nombre"
            autoFocus
            placeholder="Ej.: Fin de semana en familia"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
      </div>
      <div className="fila-flex">
        <div className="campo">
          <label htmlFor="ne-inicio">Desde</label>
          <div className="control">
            <CalendarDays size={18} />
            <input id="ne-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
        </div>
        <div className="campo">
          <label htmlFor="ne-fin">Hasta</label>
          <div className="control">
            <CalendarDays size={18} />
            <input id="ne-fin" type="date" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} />
          </div>
        </div>
      </div>
      <button className="btn" disabled={!nombre.trim()} onClick={crear}>
        Crear encuentro
      </button>
    </Hoja>
  );
}
