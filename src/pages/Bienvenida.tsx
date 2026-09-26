import { useRef } from 'react';
import { Users } from 'lucide-react';
import { useStore } from '../lib/store';
import { encuentroEjemplo } from '../lib/ejemplo';
import { leerCopia } from '../lib/exportar';
import { avisar } from '../components/ui';

export default function Bienvenida({ onNuevo }: { onNuevo: () => void }) {
  const { agregarEncuentro, reemplazarTodo } = useStore();
  const archivo = useRef<HTMLInputElement>(null);

  return (
    <main className="bienvenida">
      <div className="logo">
        <Users size={44} />
      </div>
      <h2>Juntada</h2>
      <p>
        Anotá quién compró qué en cada comida, y la app calcula cuánto le toca poner a cada uno y quién le
        tiene que pagar a quién.
      </p>
      <button className="btn" onClick={onNuevo}>
        Crear mi primer encuentro
      </button>
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
