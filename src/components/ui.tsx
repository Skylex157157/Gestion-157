import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Coffee,
  CakeSlice,
  House,
  Moon,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Users,
  Utensils,
} from 'lucide-react';
import type { Compra, Persona, TipoComida } from '../lib/types';
import { dinero, hora, iniciales } from '../lib/formato';

export function AppBar({
  titulo,
  atras,
  acciones,
}: {
  titulo: string;
  /** true = volver a la pantalla anterior; string = ir a esa ruta */
  atras?: boolean | string;
  acciones?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <header className="appbar">
      {atras && (
        <button
          className="icon-btn"
          aria-label="Volver"
          onClick={() => {
            if (typeof atras === 'string') navigate(atras);
            else if (location.key !== 'default') navigate(-1);
            else navigate('/');
          }}
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <h1>{titulo}</h1>
      {acciones}
    </header>
  );
}

export function BottomNav() {
  const items = [
    { to: '/', icon: House, label: 'Inicio', end: true },
    { to: '/comidas', icon: Utensils, label: 'Comidas' },
    { to: '/personas', icon: Users, label: 'Personas' },
    { to: '/compras', icon: ShoppingCart, label: 'Compras' },
    { to: '/resumen', icon: ReceiptText, label: 'Resumen' },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'activo' : '')}>
          <Icon size={21} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Avatar({ persona, tam }: { persona: Persona | undefined; tam?: 'chico' | 'grande' }) {
  return (
    <div className={`avatar ${tam ?? ''}`} style={{ background: persona?.color ?? '#9aa5a0' }}>
      {iniciales(persona?.nombre ?? '?')}
    </div>
  );
}

const ICONO_TIPO: Record<TipoComida, typeof Sun> = {
  desayuno: Coffee,
  almuerzo: Sun,
  merienda: CakeSlice,
  cena: Moon,
};

export function IconoComida({ tipo, tam = 26 }: { tipo: TipoComida; tam?: number }) {
  const Icono = ICONO_TIPO[tipo];
  return (
    <span className={`ico-tipo tipo-${tipo}`} style={{ display: 'inline-flex' }}>
      <Icono size={tam} strokeWidth={2.2} fill={tipo === 'cena' ? 'currentColor' : 'none'} />
    </span>
  );
}

export function Fila({
  children,
  onClick,
  chevron,
}: {
  children: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
}) {
  if (onClick) {
    return (
      <button className="fila clic" onClick={onClick}>
        {children}
        {chevron && <ChevronRight size={18} className="chev" />}
      </button>
    );
  }
  return <div className="fila">{children}</div>;
}

export function KV({
  k,
  v,
  clase,
}: {
  k: ReactNode;
  v: ReactNode;
  clase?: string;
}) {
  return (
    <div className={`kv ${clase ?? ''}`}>
      <span>{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Hoja({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [onCerrar]);
  return (
    <div className="velo" onClick={onCerrar}>
      <div className="hoja" role="dialog" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="agarre" />
        <h3>{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span />
    </label>
  );
}

let avisarGlobal: ((texto: string) => void) | null = null;

/** Muestra un mensaje breve abajo de la pantalla. */
export function avisar(texto: string) {
  avisarGlobal?.(texto);
}

export function Toasts() {
  const [texto, setTexto] = useState<string | null>(null);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    avisarGlobal = (msg) => {
      setTexto(msg);
      clearTimeout(t);
      t = setTimeout(() => setTexto(null), 2600);
    };
    return () => {
      avisarGlobal = null;
      clearTimeout(t);
    };
  }, []);
  return texto ? <div className="toast">{texto}</div> : null;
}

export function Vacio({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <div className="vacio">
      {icono}
      <div>{children}</div>
    </div>
  );
}

export function Pantalla({
  titulo,
  atras,
  acciones,
  sinNav,
  cabecera,
  children,
}: {
  titulo?: string;
  atras?: boolean | string;
  acciones?: ReactNode;
  sinNav?: boolean;
  /** Reemplaza la AppBar estándar */
  cabecera?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {cabecera ?? <AppBar titulo={titulo ?? ''} atras={atras} acciones={acciones} />}
      <main className={`contenido ${sinNav ? 'sin-nav' : ''}`}>{children}</main>
      {!sinNav && <BottomNav />}
    </>
  );
}

interface PedidoConfirmacion {
  mensaje: string;
  aceptar: string;
  peligro: boolean;
  resolver: (ok: boolean) => void;
}

let confirmarGlobal: ((p: PedidoConfirmacion) => void) | null = null;

/** Pide confirmación con un diálogo propio (los de sistema no funcionan en todos lados). */
export function confirmar(mensaje: string, opciones?: { aceptar?: string; peligro?: boolean }): Promise<boolean> {
  return new Promise((resolver) => {
    if (!confirmarGlobal) return resolver(false);
    confirmarGlobal({
      mensaje,
      aceptar: opciones?.aceptar ?? 'Aceptar',
      peligro: opciones?.peligro ?? true,
      resolver,
    });
  });
}

export function Confirmaciones() {
  const [pedido, setPedido] = useState<PedidoConfirmacion | null>(null);
  useEffect(() => {
    confirmarGlobal = setPedido;
    return () => {
      confirmarGlobal = null;
    };
  }, []);
  if (!pedido) return null;
  const responder = (ok: boolean) => {
    pedido.resolver(ok);
    setPedido(null);
  };
  return (
    <Hoja titulo="¿Estás seguro?" onCerrar={() => responder(false)}>
      <p style={{ margin: '0 0 20px', color: 'var(--texto-2)', lineHeight: 1.45 }}>{pedido.mensaje}</p>
      <button className={`btn ${pedido.peligro ? 'peligro' : ''}`} onClick={() => responder(true)}>
        {pedido.aceptar}
      </button>
      <button className="btn borde" style={{ border: 0 }} onClick={() => responder(false)}>
        Cancelar
      </button>
    </Hoja>
  );
}

let mostrarTextoGlobal: ((t: { titulo: string; texto: string }) => void) | null = null;

/** Muestra un texto largo para copiar a mano (cuando no se puede compartir ni descargar). */
export function mostrarTexto(titulo: string, texto: string) {
  mostrarTextoGlobal?.({ titulo, texto });
}

export function TextoParaCopiar() {
  const [datos, setDatos] = useState<{ titulo: string; texto: string } | null>(null);
  useEffect(() => {
    mostrarTextoGlobal = setDatos;
    return () => {
      mostrarTextoGlobal = null;
    };
  }, []);
  if (!datos) return null;
  const copiar = async (area: HTMLTextAreaElement | null) => {
    try {
      await navigator.clipboard.writeText(datos.texto);
      avisar('Copiado');
    } catch {
      area?.select();
      avisar('Seleccioná el texto y copialo');
    }
  };
  let area: HTMLTextAreaElement | null = null;
  return (
    <Hoja titulo={datos.titulo} onCerrar={() => setDatos(null)}>
      <textarea
        id="texto-para-copiar"
        ref={(el) => {
          area = el;
        }}
        readOnly
        value={datos.texto}
        onFocus={(e) => e.target.select()}
        style={{
          width: '100%',
          height: '40dvh',
          border: '1.5px solid var(--borde)',
          borderRadius: 10,
          padding: 12,
          fontSize: 13,
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          marginBottom: 12,
        }}
      />
      <button className="btn" onClick={() => copiar(area)}>
        Copiar
      </button>
    </Hoja>
  );
}

/** Una compra en una lista: concepto, detalle, importe y hora. */
export function FilaCompra({ compra, onClick, sub }: { compra: Compra; onClick?: () => void; sub?: string }) {
  const detalle = [sub, compra.observaciones].filter(Boolean).join(' · ');
  return (
    <Fila onClick={onClick}>
      <div className="ico-compra">
        <ShoppingBag size={17} />
      </div>
      <div className="cuerpo">
        <div className="titulo">{compra.concepto}</div>
        {detalle && <div className="sub">{detalle}</div>}
      </div>
      <div className="monto">
        {dinero(compra.importe)}
        {compra.creada && <small>{hora(compra.creada)}</small>}
      </div>
    </Fila>
  );
}
