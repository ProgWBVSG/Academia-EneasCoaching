import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { Campo, Error } from '../components/ui';

// Página a la que lleva el link del mail de "olvidé mi contraseña".
// Supabase agrega el permiso temporal en la parte final de la dirección (#access_token=...).
export default function Restablecer() {
  // El permiso se lee una sola vez al abrir la página, antes de borrarlo de la barra de direcciones
  const [token] = useState<string | null>(() => {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return h.get('access_token') && h.get('type') === 'recovery' ? h.get('access_token') : null;
  });
  const vencido = !token;
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => { window.history.replaceState(null, '', window.location.pathname); }, []);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('La contraseña tiene que tener al menos 8 caracteres.'); return; }
    if (password !== repetir) { setError('Las contraseñas no coinciden.'); return; }
    setEnviando(true); setError('');
    try {
      await api('restablecer', { method: 'POST', body: { access_token: token, password } });
      setListo(true);
    } catch (err: any) { setError(err.message); }
    setEnviando(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-5">
        <span className="w-14 h-14 rounded-2xl bg-oro-suave text-oro flex items-center justify-center"><KeyRound className="w-6 h-6" /></span>
        {listo ? (
          <>
            <Check className="w-8 h-8 text-oro" />
            <h1 className="text-2xl font-extrabold">¡Listo! Cambiaste tu contraseña</h1>
            <p className="text-gris">Ya podés ingresar con la contraseña nueva.</p>
            <Link to="/entrar" className="btn btn-oro btn-grande w-full">Ingresar</Link>
          </>
        ) : vencido ? (
          <>
            <h1 className="text-2xl font-extrabold">Este link ya no sirve</h1>
            <p className="text-gris">Los links para crear una contraseña nueva se usan una sola vez y vencen a la hora. Pedí uno nuevo desde la pantalla de ingreso.</p>
            <Link to="/entrar" className="btn btn-oro btn-grande w-full">Ir a ingresar</Link>
          </>
        ) : (
          <form onSubmit={enviar} className="w-full flex flex-col gap-4 text-left">
            <div className="text-center flex flex-col gap-1">
              <h1 className="text-2xl font-extrabold">Creá tu contraseña nueva</h1>
              <p className="text-gris text-sm">Elegí una que no uses en otros lugares.</p>
            </div>
            <Campo label="Contraseña nueva" ayuda="Al menos 8 caracteres.">
              <input id="nueva-password" type="password" className="campo" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required autoFocus />
            </Campo>
            <Campo label="Repetila">
              <input id="repetir-password" type="password" className="campo" value={repetir} onChange={e => setRepetir(e.target.value)} autoComplete="new-password" minLength={8} required />
            </Campo>
            <Error texto={error} />
            <button disabled={enviando} className="btn btn-oro btn-grande w-full">{enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar contraseña'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
