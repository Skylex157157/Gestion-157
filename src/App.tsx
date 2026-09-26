import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './lib/store';
import { MenuLateral } from './components/Menu';
import { NuevoEncuentro } from './components/NuevoEncuentro';
import { Confirmaciones, TextoParaCopiar, Toasts } from './components/ui';
import Bienvenida from './pages/Bienvenida';
import Inicio from './pages/Inicio';
import Comidas from './pages/Comidas';
import DetalleComida from './pages/DetalleComida';
import Asistentes from './pages/Asistentes';
import Personas from './pages/Personas';
import LiquidacionPersona from './pages/LiquidacionPersona';
import Compras from './pages/Compras';
import RegistrarCompra from './pages/RegistrarCompra';
import ResumenGeneral from './pages/ResumenGeneral';
import ResumenComida from './pages/ResumenComida';
import FondoComun from './pages/FondoComun';
import Cobranza from './pages/Cobranza';
import EditarEncuentro from './pages/EditarEncuentro';

export default function App() {
  const { encuentro, errorGuardado } = useStore();
  const [menu, setMenu] = useState(false);
  const [nuevo, setNuevo] = useState(false);

  return (
    <div className="app">
      {errorGuardado && (
        <div className="aviso rojo" style={{ borderRadius: 0, margin: 0 }}>
          {errorGuardado}
        </div>
      )}
      {encuentro ? (
        <Routes>
          <Route path="/" element={<Inicio onMenu={() => setMenu(true)} />} />
          <Route path="/comidas" element={<Comidas />} />
          <Route path="/comidas/:id" element={<DetalleComida />} />
          <Route path="/comidas/:id/asistentes" element={<Asistentes />} />
          <Route path="/personas" element={<Personas />} />
          <Route path="/personas/:id" element={<LiquidacionPersona />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/compras/nueva" element={<RegistrarCompra />} />
          <Route path="/compras/:id" element={<RegistrarCompra />} />
          <Route path="/resumen" element={<ResumenGeneral />} />
          <Route path="/resumen/comidas" element={<ResumenComida />} />
          <Route path="/resumen/fondo" element={<FondoComun />} />
          <Route path="/resumen/cobranza" element={<Cobranza />} />
          <Route path="/encuentro" element={<EditarEncuentro />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Bienvenida onNuevo={() => setNuevo(true)} />
      )}
      {menu && <MenuLateral onCerrar={() => setMenu(false)} onNuevo={() => setNuevo(true)} />}
      {nuevo && <NuevoEncuentro onCerrar={() => setNuevo(false)} />}
      <Confirmaciones />
      <TextoParaCopiar />
      <Toasts />
    </div>
  );
}
