import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Coffee,
  CakeSlice,
  House,
  Moon,
  ReceiptText,
  ShoppingCart,
  Sun,
  Users,
  Utensils,
} from 'lucide-react';
import type { Persona, TipoComida } from '../lib/types';
import { iniciales } from '../lib/formato';

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
  return (
    <header className="appbar">
      {atras && (
        <button
          className="icon-btn"
          aria-label="Volver"
          onClick={() => {
            if (typeof atras === 'string') navigate(atras);
            else if (window.history.length > 1) navigate(-1);
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
