import { useEffect, useRef, useState } from 'react';
import { Loader2, Send, Sparkles, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { NOMBRE_TIPO, haceCuanto } from '../lib/tipos';
import { Error, Modal } from '../components/ui';
import Eneagrama from '../components/Eneagrama';

interface Mensaje { rol: 'coach' | 'cliente'; texto: string }
interface Historial { id: string; eneatipo: number | null; escenario: string; hipotesis: number | null; cerrada: boolean; creado: string }
interface Resultado { eneatipo: number; hipotesis: number; devolucion: string }

export default function Laboratorio() {
  const { recargar } = useAuth();
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [eligiendo, setEligiendo] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const fin = useRef<HTMLDivElement>(null);

  const cargarHistorial = () => api<Historial[]>('lab-historial').then(setHistorial).catch(() => {});
  useEffect(() => { cargarHistorial(); }, []);
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [mensajes, ocupado]);

  const empezar = async () => {
    setOcupado(true); setError(''); setResultado(null);
    try {
      const r = await api('lab-iniciar', { method: 'POST' });
      setSesionId(r.id); setMensajes(r.mensajes);
    } catch (e: any) { setError(e.message); }
    finally { setOcupado(false); }
  };

  const retomar = async (h: Historial) => {
    setOcupado(true); setError('');
    try {
      const s = await api('lab-sesion', { query: { id: h.id } });
      setSesionId(s.id); setMensajes(s.mensajes);
      setResultado(s.cerrada ? { eneatipo: s.eneatipo, hipotesis: s.hipotesis, devolucion: s.devolucion } : null);
    } catch (e: any) { setError(e.message); }
    finally { setOcupado(false); }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t || !sesionId) return;
    setTexto(''); setError('');
    setMensajes(m => [...m, { rol: 'coach', texto: t }]);
    setOcupado(true);
    try {
      const r = await api('lab-mensaje', { method: 'POST', body: { sesion_id: sesionId, texto: t } });
      setMensajes(r.mensajes);
    } catch (err: any) { setError(err.message); setMensajes(m => m.slice(0, -1)); setTexto(t); }
    finally { setOcupado(false); }
  };

  const cerrar = async (hipotesis: number) => {
    setEligiendo(false); setOcupado(true); setError('');
    try {
      const r = await api<Resultado>('lab-cerrar', { method: 'POST', body: { sesion_id: sesionId, hipotesis } });
      setResultado(r);
      recargar(); cargarHistorial();
    } catch (e: any) { setError(e.message); }
    finally { setOcupado(false); }
  };

  const nueva = () => { setSesionId(null); setMensajes([]); setResultado(null); setError(''); };

  // ── Pantalla inicial ────────────────────────────────────────────
  if (!sesionId) {
    return (
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="tarjeta p-8 flex flex-col gap-5">
          <span className="etiqueta flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Laboratorio de práctica</span>
          <h1 className="text-3xl font-extrabold leading-tight">Practicá una primera sesión con un cliente que no conocés</h1>
          <div className="flex flex-col gap-3 text-gris max-w-2xl">
            <p>La IA hace de cliente. Tiene un tipo del Eneagrama que no te dice y un motivo de consulta propio. Vos conducís la sesión como lo harías en tu consultorio.</p>
            <p>Cuando tengas una hipótesis, cerrás la sesión y elegís el tipo. Te mostramos el tipo real, las frases que lo mostraban y qué te hubiera ayudado a confirmarlo.</p>
          </div>
          <ul className="grid sm:grid-cols-3 gap-3 text-sm">
            {['Preguntá abierto y reflejá: el cliente se abre cuando se siente escuchado', 'No lo interrogues: si lo juzgás o apurás, se cierra', 'Tenés hasta 25 intervenciones por sesión'].map(t => (
              <li key={t} className="bg-crema rounded-xl p-3.5">{t}</li>
            ))}
          </ul>
          <Error texto={error} />
          <button onClick={empezar} disabled={ocupado} className="btn btn-oro self-start !px-7 !py-3.5 text-base">
            {ocupado ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparando al cliente</> : 'Empezar una sesión'}
          </button>
        </div>
        <aside className="tarjeta p-5 flex flex-col gap-3">
          <p className="font-bold">Tus prácticas</p>
          {historial.length === 0 ? <p className="text-sm text-gris">Todavía no hiciste ninguna. La primera suma 3 puntos.</p> : historial.map(h => (
            <button key={h.id} onClick={() => retomar(h)} className="text-left rounded-xl border border-linea p-3 hover:border-oro flex flex-col gap-1">
              <p className="text-sm line-clamp-2">{h.escenario}</p>
              <p className="text-xs text-gris flex items-center gap-1.5">
                {h.cerrada ? (h.hipotesis === h.eneatipo
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Acertaste el {h.eneatipo}</>
                  : <><XCircle className="w-3.5 h-3.5 text-red-700" /> Era {h.eneatipo}, dijiste {h.hipotesis}</>)
                  : 'Sin terminar'}
                <span>· {haceCuanto(h.creado)}</span>
              </p>
            </button>
          ))}
        </aside>
      </div>
    );
  }

  // ── Resultado ───────────────────────────────────────────────────
  if (resultado) {
    const acerto = resultado.eneatipo === resultado.hipotesis;
    return (
      <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        <div className="tarjeta p-6 flex flex-col items-center text-center gap-3">
          <span className="text-tinta"><Eneagrama tam={220} resaltar={resultado.eneatipo} /></span>
          <p className={`font-semibold flex items-center gap-1.5 ${acerto ? 'text-emerald-700' : 'text-red-700'}`}>
            {acerto ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {acerto ? '¡Acertaste!' : `Dijiste ${resultado.hipotesis}`}
          </p>
          <p className="font-display font-extrabold text-2xl">Tipo {resultado.eneatipo}</p>
          <p className="text-gris text-sm">{NOMBRE_TIPO[resultado.eneatipo]}</p>
          <button onClick={nueva} className="btn btn-oscuro w-full mt-2"><RotateCcw className="w-4 h-4" /> Otra sesión</button>
        </div>
        <div className="tarjeta p-6 flex flex-col gap-3">
          <p className="etiqueta">Devolución</p>
          <div className="whitespace-pre-line leading-relaxed text-[15px]">{resultado.devolucion}</div>
        </div>
      </div>
    );
  }

  // ── Sesión en curso ─────────────────────────────────────────────
  const intervenciones = mensajes.filter(m => m.rol === 'coach').length;
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Sesión de práctica</h1>
          <p className="text-sm text-gris tabular-nums">{intervenciones} de 25 intervenciones · el tipo está oculto</p>
        </div>
        <button onClick={() => setEligiendo(true)} disabled={ocupado || intervenciones < 3} className="btn btn-oro !py-2" title={intervenciones < 3 ? 'Hacé al menos 3 intervenciones' : undefined}>
          Cerrar y dar mi hipótesis
        </button>
      </div>

      <div className="tarjeta p-4 sm:p-6 flex flex-col gap-3 min-h-[50vh]">
        {mensajes.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-line ${m.rol === 'coach' ? 'self-end bg-tinta text-crema rounded-br-sm' : 'self-start bg-crema rounded-bl-sm'}`}>
            {m.texto}
          </div>
        ))}
        {ocupado && <div className="self-start bg-crema rounded-2xl px-4 py-3 text-gris text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> escribiendo</div>}
        <div ref={fin} />
      </div>

      <Error texto={error} />
      <form onSubmit={enviar} className="flex gap-2 items-end">
        <textarea id="intervencion" className="campo min-h-[52px] max-h-40" rows={2} placeholder="Tu intervención como coach"
          value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
        <button disabled={ocupado || !texto.trim()} className="btn btn-oscuro !px-4 !py-3.5" aria-label="Enviar"><Send className="w-4 h-4" /></button>
      </form>

      {eligiendo && (
        <Modal titulo="¿Qué tipo creés que es?" onCerrar={() => setEligiendo(false)}>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} onClick={() => cerrar(n)} className="rounded-xl border border-linea p-3 hover:border-oro hover:bg-oro-suave flex flex-col items-center gap-0.5">
                <span className="font-display font-extrabold text-2xl">{n}</span>
                <span className="text-xs text-gris">{NOMBRE_TIPO[n]}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
