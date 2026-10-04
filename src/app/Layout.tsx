import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AvatarNivel } from '../components/ui';
import Membresia from './Membresia';
import Eneagrama from '../components/Eneagrama';

const TABS = [
  { to: '/app', label: 'Comunidad', end: true },
  { to: '/app/aula', label: 'Aula' },
  { to: '/app/calendario', label: 'Calendario' },
  { to: '/app/laboratorio', label: 'Laboratorio' },
  { to: '/app/miembros', label: 'Miembros' },
  { to: '/app/ranking', label: 'Ranking' },
  { to: '/app/equipos', label: 'Equipos' },
];

export default function Layout() {
  const { perfil, nivel, salir, recargar } = useAuth();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  useEffect(() => setMenu(false), [loc.pathname]);

  // Al volver de Mercado Pago el webhook puede tardar unos segundos
  useEffect(() => {
    if (params.get('pago') !== 'ok') return;
    let intentos = 0;
    const t = setInterval(async () => {
      intentos += 1;
      await recargar();
      if (intentos >= 6) { clearInterval(t); params.delete('pago'); setParams(params, { replace: true }); }
    }, 3000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!perfil || !nivel) return null;
  const activa = perfil.estado === 'activa' || perfil.rol === 'admin';
  const enPerfil = loc.pathname.startsWith('/app/perfil');
  const enMembresia = loc.pathname.startsWith('/app/membresia');
  // Aviso cuando el acceso pagado por transferencia vence en los próximos 5 días
  const dias = perfil.vence ? Math.ceil((new Date(perfil.vence).getTime() - Date.now()) / 86400000) : null;
  const porVencer = activa && perfil.rol !== 'admin' && perfil.metodo_pago === 'transferencia' && dias !== null && dias <= 5;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-linea sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link to="/app" className="flex items-center gap-2 shrink-0">
            <span className="text-tinta"><Eneagrama tam={26} /></span>
            <span className="font-display font-extrabold text-[15px] hidden sm:inline">Academia <span className="text-oro">Eneascoaching</span></span>
          </Link>
          <div className="relative">
            <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-crema" aria-haspopup="menu" aria-expanded={menu}>
              <AvatarNivel nombre={perfil.nombre} id={perfil.id} nivel={nivel.n} tam={32} />
              <span className="text-sm font-medium hidden sm:inline">{perfil.nombre.split(' ')[0]}</span>
            </button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-60 tarjeta shadow-xl p-2 flex flex-col text-sm z-40">
                <div className="px-3 py-2 border-b border-linea mb-1">
                  <p className="font-semibold truncate">{perfil.nombre}</p>
                  <p className="text-xs text-gris">Nivel {nivel.n} · {nivel.nombre} · {perfil.puntos} pts</p>
                </div>
                <button onClick={() => nav('/app/perfil')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-crema text-left"><User className="w-4 h-4" /> Mi perfil</button>
                {perfil.rol === 'admin' && (
                  <button onClick={() => nav('/app/admin')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-crema text-left"><Settings className="w-4 h-4" /> Administración</button>
                )}
                <button onClick={() => { salir(); nav('/'); }} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-crema text-left"><LogOut className="w-4 h-4" /> Salir</button>
              </div>
            )}
          </div>
        </div>
        {activa && (
          <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto -mb-px" aria-label="Secciones">
            {TABS.map(t => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) => `px-3 py-2.5 text-sm whitespace-nowrap border-b-2 ${isActive ? 'border-tinta text-tinta font-semibold' : 'border-transparent text-gris hover:text-tinta'}`}>
                {t.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {porVencer && !enMembresia && (
        <div className="bg-oro-suave border-b border-linea">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-3 text-sm text-center">
            <span>Tu acceso vence {dias! <= 0 ? 'hoy' : `en ${dias} ${dias === 1 ? 'día' : 'días'}`}. Renovalo para no perder la continuidad.</span>
            <Link to="/app/membresia" className="btn btn-oscuro !py-1.5 !px-4 text-sm">Renovar</Link>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {enMembresia ? <Membresia renovar={activa} /> : activa || enPerfil ? <Outlet /> : <Membresia />}
      </main>
    </div>
  );
}
