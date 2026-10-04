import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import Eneagrama from '../components/Eneagrama';
import { Campo, Error } from '../components/ui';
import { api } from '../lib/api';
import {
  SITIO, PAGINAS, TERMINOS, PRIVACIDAD, ARREPENTIMIENTO_INTRO, TIPOS_SOLICITUD,
  type Seccion, type TipoSolicitud,
} from '../contenido/publico';

// Título y descripción de la página al navegar dentro de la web (el HTML inicial ya los trae del prerender)
export function useSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const p = PAGINAS.find(x => x.ruta === pathname);
    if (!p) return;
    document.title = p.titulo;
    document.querySelector('meta[name="description"]')?.setAttribute('content', p.descripcion);
  }, [pathname]);
}

// Pie con los links legales. Va en todas las páginas públicas.
export function PieLegal() {
  return (
    <footer className="border-t border-linea">
      <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col items-center gap-3 text-sm text-gris text-center">
        <span>{SITIO.nombre} · {SITIO.responsable}</span>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link to="/terminos" className="hover:text-oro">Términos y condiciones</Link>
          <Link to="/privacidad" className="hover:text-oro">Política de privacidad</Link>
          <Link to="/arrepentimiento" className="hover:text-oro">Botón de arrepentimiento</Link>
          <Link to="/arrepentimiento#baja" className="hover:text-oro">Botón de baja</Link>
        </nav>
        <a href={SITIO.web} className="hover:text-oro">cecimentorcoach.com</a>
      </div>
    </footer>
  );
}

function Marco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  useSeo();
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-crema/90 backdrop-blur border-b border-linea">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <span className="text-tinta shrink-0"><Eneagrama tam={30} /></span>
            <span className="font-display font-extrabold tracking-tight truncate">Academia <span className="text-oro">Eneascoaching</span></span>
          </Link>
          <Link to="/" className="btn btn-oscuro !py-2 !px-4 text-sm shrink-0">Volver</Link>
        </div>
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12 md:py-16 flex flex-col items-center text-center gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{titulo}</h1>
          <p className="text-sm text-gris">Última actualización: {SITIO.vigencia}</p>
        </div>
        {children}
      </main>
      <PieLegal />
    </div>
  );
}

function Secciones({ secciones }: { secciones: Seccion[] }) {
  return (
    <div className="flex flex-col gap-8 w-full">
      {secciones.map((s, i) => (
        <section key={s.titulo} className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold">{i + 1}. {s.titulo}</h2>
          {s.parrafos.map(p => <p key={p.slice(0, 40)} className="text-gris leading-relaxed">{p}</p>)}
        </section>
      ))}
    </div>
  );
}

export function Terminos() {
  return <Marco titulo="Términos y condiciones"><Secciones secciones={TERMINOS} /></Marco>;
}

export function Privacidad() {
  return <Marco titulo="Política de privacidad"><Secciones secciones={PRIVACIDAD} /></Marco>;
}

export function Arrepentimiento() {
  const { hash } = useLocation();
  const inicial = (TIPOS_SOLICITUD.find(t => `#${t.id}` === hash)?.id ?? 'arrepentimiento') as TipoSolicitud;
  const [tipo, setTipo] = useState<TipoSolicitud>(inicial);
  const [f, setF] = useState({ nombre: '', email: '', detalle: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hecho, setHecho] = useState<{ codigo: string; whatsapp: string } | null>(null);
  useEffect(() => { setTipo(inicial); }, [inicial]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError('');
    try { setHecho(await api('solicitud', { method: 'POST', body: { tipo, ...f } })); }
    catch (err: any) { setError(err.message); }
    setEnviando(false);
  };

  const elegido = TIPOS_SOLICITUD.find(t => t.id === tipo)!;

  return (
    <Marco titulo="Arrepentimiento, baja y datos personales">
      {ARREPENTIMIENTO_INTRO.map(p => <p key={p} className="text-gris leading-relaxed -mt-2">{p}</p>)}
      {hecho ? (
        <div className="tarjeta w-full p-8 flex flex-col items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-oro-suave text-oro flex items-center justify-center"><Check className="w-6 h-6" /></span>
          <h2 className="text-2xl font-extrabold">Recibimos tu pedido</h2>
          <p className="text-gris">Tu código de trámite es</p>
          <p className="font-display font-extrabold text-3xl tracking-wider">{hecho.codigo}</p>
          <p className="text-gris">Te lo mandamos por email y te respondemos dentro de las 24 horas hábiles.</p>
          <a href={hecho.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-grande w-full">Avisar también por WhatsApp</a>
        </div>
      ) : (
        <form onSubmit={enviar} className="w-full flex flex-col gap-5">
          <div role="radiogroup" aria-label="Qué querés pedir" className="grid gap-3 sm:grid-cols-3">
            {TIPOS_SOLICITUD.map(t => (
              <button key={t.id} id={t.id} type="button" role="radio" aria-checked={tipo === t.id} onClick={() => setTipo(t.id)}
                className={`tarjeta scroll-mt-24 p-4 flex flex-col items-center gap-1 transition-colors ${tipo === t.id ? 'ring-2 ring-oro bg-oro-suave' : 'hover:bg-oro-suave/50'}`}>
                <span className="font-bold">{t.titulo}</span>
              </button>
            ))}
          </div>
          <p className="text-gris">{elegido.texto}</p>
          <div className="flex flex-col gap-4 text-left">
            <Campo label="Nombre y apellido">
              <input className="campo" value={f.nombre} onChange={set('nombre')} autoComplete="name" required maxLength={120} />
            </Campo>
            <Campo label="Email" ayuda="El mismo con el que te registraste, si tenés cuenta.">
              <input type="email" className="campo" value={f.email} onChange={set('email')} autoComplete="email" required maxLength={160} />
            </Campo>
            <Campo label="Detalle (opcional)">
              <textarea className="campo min-h-24" value={f.detalle} onChange={set('detalle')} maxLength={1500} />
            </Campo>
          </div>
          <Error texto={error} />
          <button disabled={enviando} className="btn btn-oro btn-grande w-full">
            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : { arrepentimiento: 'Enviar arrepentimiento', baja: 'Pedir la baja', datos: 'Enviar pedido' }[tipo]}
          </button>
        </form>
      )}
    </Marco>
  );
}
