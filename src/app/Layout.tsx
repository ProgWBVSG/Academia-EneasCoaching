import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, LogOut, Settings, User, Check, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { AvatarNivel, Error } from '../components/ui';
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

const WHATSAPP = 'https://wa.me/5493515632496?text=' + encodeURIComponent('Hola Cecilia! Me registré en la Academia y quiero activar mi membresía.');

function Membresia() {
  const { perfil } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const suscribirme = async () => {
    setCargando(true); setError('');
    try {
      const { url } = await api('suscribirme', { method: 'POST' });
      window.location.href = url;
    } catch (e: any) { setError(e.message); setCargando(false); }
  };

  return (
    <div className="max-w-xl mx-auto py-10 flex flex-col items-center text-center gap-5">
      <span className="w-14 h-14 rounded-2xl bg-oro-suave text-oro flex items-center justify-center"><Lock className="w-6 h-6" /></span>
      <h1 className="text-2xl font-extrabold">
        {perfil?.estado === 'vencida' ? 'Tu membresía está pausada' : `Hola ${perfil?.nombre.split(' ')[0]}, falta un paso`}
      </h1>
      <p className="text-gris">
        {perfil?.estado === 'vencida'
          ? 'Reactivala para volver a entrar a los cursos, los vivos y el laboratorio. Tu progreso y tus puntos quedan guardados.'
          : 'Tu cuenta está creada. Activá la membresía para entrar a los cursos, los vivos, la comunidad y el laboratorio.'}
      </p>
      <div className="tarjeta p-6 w-full flex flex-col gap-4 text-left">
        <p className="flex items-baseline gap-2"><span className="font-display font-extrabold text-4xl">USD 39</span><span className="text-gris">por mes</span></p>
        <ul className="flex flex-col gap-2 text-sm">
          {['Todas las rutas de cursos', 'Clase en vivo y supervisión de casos cada mes', 'Laboratorio de práctica con IA', 'Comunidad de colegas'].map(t => (
            <li key={t} className="flex gap-2"><Check className="w-4 h-4 text-oro shrink-0 mt-0.5" />{t}</li>
          ))}
        </ul>
        <Error texto={error} />
        <button onClick={suscribirme} disabled={cargando} className="btn btn-oro w-full !py-3">
          {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activar con Mercado Pago'}
        </button>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn btn-borde w-full">Pagar desde otro país o por WhatsApp</a>
      </div>
    </div>
  );
}

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

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activa || enPerfil ? <Outlet /> : <Membresia />}
      </main>
    </div>
  );
}
