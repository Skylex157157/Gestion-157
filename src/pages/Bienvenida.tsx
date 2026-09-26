import { useRef } from 'react';
import { Archive, Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { encuentroEjemplo } from '../lib/ejemplo';
import { leerCopia } from '../lib/exportar';
import { avisar } from '../components/ui';

export default function Bienvenida({ onNuevo, onArchivados }: { onNuevo: () => void; onArchivados: () => void }) {
  const { estado, agregarEncuentro, reemplazarTodo } = useStore();
  const archivados = estado.encuentros.filter((e) => e.archivado).length;
  const archivo = useRef<HTMLInputElement>(null);

  return (
    <main className="bienvenida">
      <div className="logo">
        <Users size={44} />
      </div>
      <h2>Juntada</h2>
      <p>
        Anotá quién compró qué para cada comida, y la app calcula cuánto le toca poner a cada uno y cómo quedan
        las cuentas con quien maneja la plata.
      </p>
      <button className="btn" onClick={onNuevo}>
        {archivados ? 'Crear un encuentro nuevo' : 'Crear mi primer encuentro'}
      </button>
      {archivados > 0 && (
        <button className="btn borde" onClick={onArchivados}>
          <Archive size={18} /> Ver encuentros archivados ({archivados})
        </button>
      )}
      <button className="btn borde" onClick={() => agregarEncuentro(encuentroEjemplo())}>
        Ver un ejemplo
      </button>
      <button
        className="btn borde"
        style={{ border: 0, background: 'none' }}
        onClick={() => archivo.current?.click()}
      >
        Restaurar una copia de seguridad
      </button>
      <input
        ref={archivo}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          const datos = leerCopia(await f.text());
          if (datos) reemplazarTodo(datos);
          else avisar('El archivo no es una copia válida de Juntada');
        }}
      />
    </main>
  );
}
