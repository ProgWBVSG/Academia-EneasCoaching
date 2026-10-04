import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import Eneagrama from '../components/Eneagrama';
import { Campo, Error } from '../components/ui';
import SelectorPais from '../components/SelectorPais';

const PROFESIONES = ['Ninguna, es para mí', 'Psicóloga/o', 'Coach', 'Terapeuta', 'Abogada/o', 'RRHH', 'Líder de equipo', 'Docente', 'Psicopedagoga/o', 'Ventas o atención al cliente', 'Otra profesión'];

export default function Entrar({ modo }: { modo: 'entrar' | 'registro' }) {
  const { perfil, iniciar } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nombre: '', email: '', password: '', profesion: '', pais: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  if (perfil) return <Navigate to="/app" replace />;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError(''); setAviso('');
    try {
      const { sesion } = await api(modo, { method: 'POST', body: f });
      await iniciar(sesion);
      nav('/app');
    } catch (err: any) {
      setError(err.message);
    } finally { setEnviando(false); }
  };

  const recuperar = async () => {
    if (!f.email) { setError('Escribí tu email y volvé a tocar "Olvidé mi contraseña".'); return; }
    setError('');
    await api('recuperar', { method: 'POST', body: { email: f.email } }).catch(() => {});
    setAviso('Si existe una cuenta con ese email, te llegó un correo para crear una contraseña nueva.');
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-tinta text-crema flex-col justify-between p-12">
        <Link to="/" className="font-display font-extrabold">Academia <span className="text-oro-claro">Eneascoaching</span></Link>
        <div className="flex flex-col gap-6">
          <span className="text-crema"><Eneagrama tam={260} /></span>
          <p className="text-2xl font-display font-bold leading-snug max-w-sm">El lugar donde el Eneagrama se practica, no solo se estudia.</p>
        </div>
        <p className="text-sm text-crema/60">Cecilia B. Sánchez</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={enviar} className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1 mb-2">
            <h1 className="text-2xl font-extrabold">{modo === 'registro' ? 'Creá tu cuenta' : 'Ingresá a la academia'}</h1>
            <p className="text-gris text-sm">
              {modo === 'registro'
                ? <>¿Ya tenés cuenta? <Link to="/entrar" className="text-oro font-semibold">Ingresá</Link></>
                : <>¿Todavía no sos miembro? <Link to="/registro" className="text-oro font-semibold">Creá tu cuenta</Link></>}
            </p>
          </div>

          {modo === 'registro' && (
            <>
              <Campo label="Nombre y apellido"><input id="nombre" className="campo" value={f.nombre} onChange={set('nombre')} autoComplete="name" required /></Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Profesión">
                  <select id="profesion" className="campo" value={f.profesion} onChange={set('profesion')} required>
                    <option value="">Elegí</option>
                    {PROFESIONES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Campo>
                <Campo label="País"><SelectorPais id="pais" valor={f.pais} onChange={v => setF({ ...f, pais: v })} requerido /></Campo>
              </div>
            </>
          )}
          <Campo label="Email"><input id="email" type="email" className="campo" value={f.email} onChange={set('email')} autoComplete="email" required /></Campo>
          <Campo label="Contraseña" ayuda={modo === 'registro' ? 'Al menos 8 caracteres.' : undefined}>
            <input id="password" type="password" className="campo" value={f.password} onChange={set('password')} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} required minLength={8} />
          </Campo>

          <Error texto={error} />
          {aviso && <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{aviso}</p>}

          <button type="submit" disabled={enviando} className="btn btn-oro w-full !py-3">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : modo === 'registro' ? 'Crear cuenta' : 'Ingresar'}
          </button>
          {modo === 'entrar' && (
            <button type="button" onClick={recuperar} className="text-sm text-gris hover:text-oro">Olvidé mi contraseña</button>
          )}
        </form>
      </div>
    </div>
  );
}
