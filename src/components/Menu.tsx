import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Check, Download, Pencil, Plus, Share2, Upload } from 'lucide-react';
import { useStore } from '../lib/store';
import {
  ES_ARTIFACT,
  compartirTexto,
  copiaDeSeguridad,
  descargarArchivo,
  leerCopia,
  textoResumen,
} from '../lib/exportar';
import type { Encuentro } from '../lib/types';
import { fechaCorta, hoyISO } from '../lib/formato';
import { avisar, confirmar, mostrarTexto } from './ui';

/** Comparte el resumen por WhatsApp, o lo copia, o lo muestra para copiar a mano. */
export async function compartirResumen(encuentro: Encuentro) {
  const texto = textoResumen(encuentro);
  const r = await compartirTexto(encuentro.nombre, texto);
  if (r === 'copiado') avisar('Resumen copiado. Pegalo en WhatsApp.');
  if (r === 'error') mostrarTexto('Resumen para WhatsApp', texto);
}

export function MenuLateral({ onCerrar, onNuevo }: { onCerrar: () => void; onNuevo: () => void }) {
  const { estado, encuentro, activar, reemplazarTodo } = useStore();
  const navigate = useNavigate();
  const archivo = useRef<HTMLInputElement>(null);

  const ir = (ruta: string) => {
    onCerrar();
    navigate(ruta);
  };

  const compartir = async () => {
    if (!encuentro) return;
    onCerrar();
    await compartirResumen(encuentro);
  };

  const exportar = () => {
    onCerrar();
    if (ES_ARTIFACT) {
      mostrarTexto('Copia de seguridad', copiaDeSeguridad(estado));
      return;
    }
    descargarArchivo(`juntada-copia-${hoyISO()}.json`, copiaDeSeguridad(estado));
    avisar('Copia de seguridad descargada');
  };

  const importar = async (f: File) => {
    const datos = leerCopia(await f.text());
    if (!datos) {
      avisar('El archivo no es una copia válida de Juntada');
      return;
    }
    const ok = await confirmar('Esto reemplaza todos los datos de este teléfono por los del archivo.', {
      aceptar: 'Reemplazar datos',
    });
    if (!ok) return;
    reemplazarTodo(datos);
    avisar('Datos restaurados');
    onCerrar();
    navigate('/');
  };

  return (
    <div className="menu-lateral" onClick={onCerrar}>
      <div className="panel">
        <nav onClick={(e) => e.stopPropagation()} aria-label="Menú">
          <div className="menu-cab">
            <strong>Juntada</strong>
            <span>Control de gastos y reparto</span>
          </div>

          <div className="menu-etq">Mis encuentros</div>
          {estado.encuentros.map((e) => (
            <button
              key={e.id}
              className={`menu-item ${e.id === encuentro?.id ? 'activo' : ''}`}
              onClick={() => {
                activar(e.id);
                ir('/');
              }}
            >
              <CalendarDays size={20} />
              <span style={{ flex: 1 }}>
                {e.nombre}
                <br />
                <small style={{ color: 'var(--texto-3)', fontWeight: 400 }}>
                  {fechaCorta(e.fechaInicio)} - {fechaCorta(e.fechaFin)}
                </small>
              </span>
              {e.id === encuentro?.id && <Check size={18} />}
            </button>
          ))}
          <button
            className="menu-item"
            onClick={() => {
              onCerrar();
              onNuevo();
            }}
          >
            <Plus size={20} /> Nuevo encuentro
          </button>

          {encuentro && (
            <>
              <div className="menu-sep" />
              <button className="menu-item" onClick={() => ir('/encuentro')}>
                <Pencil size={20} /> Editar encuentro
              </button>
              <button className="menu-item" onClick={compartir}>
                <Share2 size={20} /> Compartir resumen (WhatsApp)
              </button>
            </>
          )}

          <div className="menu-sep" />
          <div className="menu-etq">Copia de seguridad</div>
          <button className="menu-item" onClick={exportar}>
            <Download size={20} /> Exportar datos
          </button>
          <button className="menu-item" onClick={() => archivo.current?.click()}>
            <Upload size={20} /> Importar datos
          </button>
          <input
            ref={archivo}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importar(f);
              e.target.value = '';
            }}
          />
        </nav>
      </div>
    </div>
  );
}
