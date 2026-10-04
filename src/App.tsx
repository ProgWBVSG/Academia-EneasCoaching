import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Cargando } from './components/ui';
import Landing from './pages/Landing';
import Entrar from './pages/Entrar';
import Restablecer from './pages/Restablecer';
import Layout from './app/Layout';
import Comunidad from './app/Comunidad';
import Aula from './app/Aula';
import CursoVista from './app/Curso';
import Calendario from './app/Calendario';
import Miembros from './app/Miembros';
import Ranking from './app/Ranking';
import Laboratorio from './app/Laboratorio';
import Equipos from './app/Equipos';
import PerfilVista from './app/Perfil';
import Admin from './app/Admin';

function Protegida({ children }: { children: React.ReactNode }) {
  const { cargando, perfil } = useAuth();
  if (cargando) return <Cargando />;
  if (!perfil) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={<Entrar modo="entrar" />} />
          <Route path="/registro" element={<Entrar modo="registro" />} />
          <Route path="/restablecer" element={<Restablecer />} />
          <Route path="/app" element={<Protegida><Layout /></Protegida>}>
            <Route index element={<Comunidad />} />
            <Route path="aula" element={<Aula />} />
            <Route path="aula/:id" element={<CursoVista />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="miembros" element={<Miembros />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="laboratorio" element={<Laboratorio />} />
            <Route path="equipos" element={<Equipos />} />
            <Route path="membresia" element={null} />
            <Route path="perfil" element={<PerfilVista />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
