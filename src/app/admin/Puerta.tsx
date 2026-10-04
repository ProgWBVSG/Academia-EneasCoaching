import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Loader2, ShieldCheck, Copy, Check } from 'lucide-react';
import { api, guardarSesion, type Sesion } from '../../lib/api';
import { Cargando, Error } from '../../components/ui';

// Puerta del panel: pide el código de la aplicación de autenticación (segundo factor).
// La primera vez, la administradora escanea un QR para configurarla.
type Estado = 'cargando' | 'ok' | 'enrolar' | 'verificar';

export default function Puerta({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando');
  const [error, setError] = useState('');

  const comprobar = useCallback(async () => {
    try { await api('admin-sesion'); setEstado('ok'); }
    catch (e: any) {
      if (e.datos?.mfa === 'enrolar' || e.datos?.mfa === 'verificar') setEstado(e.datos.mfa);
      else setError(e.message);
    }
  }, []);
  useEffect(() => { comprobar(); }, [comprobar]);

  if (estado === 'ok') return <>{children}</>;
  if (error) return <Error texto={error} />;
  if (estado === 'cargando') return <Cargando />;
  return <Verificacion modo={estado} alTerminar={comprobar} />;
}

export function Verificacion({ modo, alTerminar }: { modo: 'enrolar' | 'verificar'; alTerminar: () => void }) {
  const [factor, setFactor] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [secreto, setSecreto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (modo === 'enrolar') {
          const r = await api<{ factor_id: string; qr: string; secreto: string }>('mfa-enrolar', { method: 'POST' });
          setFactor(r.factor_id); setQr(r.qr); setSecreto(r.secreto);
        } else {
          const r = await api<{ factores: { id: string }[] }>('mfa-estado');
          setFactor(r.factores[0]?.id || null);
        }
      } catch (e: any) { setError(e.message); }
    })();
  }, [modo]);

  const verificar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!factor) return;
    setTrabajando(true); setError('');
    try {
      const { sesion } = await api<{ sesion: Sesion }>('mfa-verificar', { method: 'POST', body: { factor_id: factor, codigo } });
      guardarSesion(sesion);
      alTerminar();
    } catch (e: any) { setError(e.message); setCodigo(''); }
    setTrabajando(false);
  };

  return (
    <div className="max-w-md mx-auto py-8 flex flex-col items-center text-center gap-5">
      <span className="w-14 h-14 rounded-2xl bg-oro-suave text-oro flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></span>
      <h1 className="text-2xl font-extrabold">{modo === 'enrolar' ? 'Activá la verificación en dos pasos' : 'Verificá que sos vos'}</h1>
      <p className="text-gris">
        {modo === 'enrolar'
          ? 'El panel maneja pagos y datos de las miembros, así que pide un código además de la contraseña. Lo hacés una sola vez.'
          : 'Abrí tu aplicación de autenticación e ingresá el código de 6 dígitos de la Academia.'}
      </p>

      {modo === 'enrolar' && (
        <div className="tarjeta p-5 w-full flex flex-col items-center gap-4">
          <ol className="text-sm text-gris text-left list-decimal pl-5 flex flex-col gap-1.5">
            <li>Instalá una aplicación de autenticación en tu celular: Google Authenticator, Microsoft Authenticator o Authy.</li>
            <li>Escaneá este código QR con la aplicación.</li>
            <li>Escribí abajo el código de 6 dígitos que te muestra.</li>
          </ol>
          {qr ? <img src={qr} alt="Código QR para la aplicación de autenticación" className="w-48 h-48 bg-white rounded-xl border border-linea p-2" /> : <Loader2 className="w-6 h-6 animate-spin text-gris" />}
          {secreto && (
            <button type="button" onClick={() => { navigator.clipboard?.writeText(secreto).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }).catch(() => {}); }}
              className="text-xs text-gris flex items-center gap-1.5 hover:text-tinta">
              ¿No podés escanearlo? Clave manual: <span className="font-mono break-all">{secreto}</span>
              {copiado ? <Check className="w-3.5 h-3.5 text-oro" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      <form onSubmit={verificar} className="w-full flex flex-col gap-3">
        <input id="codigo-mfa" className="campo text-center text-2xl tracking-[.4em] tabular-nums" inputMode="numeric" autoComplete="one-time-code"
          maxLength={6} value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))} placeholder="000000" aria-label="Código de 6 dígitos" autoFocus />
        <Error texto={error} />
        <button disabled={trabajando || codigo.length !== 6 || !factor} className="btn btn-oscuro btn-grande w-full">
          {trabajando ? <Loader2 className="w-5 h-5 animate-spin" /> : modo === 'enrolar' ? 'Activar' : 'Entrar al panel'}
        </button>
      </form>
    </div>
  );
}
