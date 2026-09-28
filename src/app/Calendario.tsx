import { useEffect, useState } from 'react';
import { CalendarPlus, Video, PlayCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Evento } from '../lib/tipos';
import { Cargando, Vacio } from '../components/ui';

const TIPO: Record<Evento['tipo'], { nombre: string; color: string }> = {
  clase: { nombre: 'Clase en vivo', color: '#B08A45' },
  supervision: { nombre: 'Supervisión de casos', color: '#4A90C2' },
  otro: { nombre: 'Encuentro', color: '#6B6458' },
};

function linkGoogle(e: Evento) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ini = new Date(e.inicio);
  const fin = new Date(ini.getTime() + e.duracion_min * 60000);
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: `${e.titulo} · Academia Eneascoaching`,
    dates: `${f(ini)}/${f(fin)}`, details: `${e.descripcion}\n\n${e.link || 'El link se publica en la Academia.'}`,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default function Calendario() {
  const { onboarding, recargar } = useAuth();
  const [eventos, setEventos] = useState<Evento[] | null>(null);
  useEffect(() => { api<Evento[]>('eventos').then(setEventos).catch(() => setEventos([])); }, []);

  const agendar = async () => {
    if (!onboarding?.vivo) { await api('onboarding', { method: 'PUT', body: { paso: 'vivo' } }).catch(() => {}); recargar(); }
  };

  if (eventos === null) return <Cargando />;
  const ahora = Date.now();
  const proximos = eventos.filter(e => new Date(e.inicio).getTime() + e.duracion_min * 60000 > ahora);
  const pasados = eventos.filter(e => new Date(e.inicio).getTime() + e.duracion_min * 60000 <= ahora).reverse();
  const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Calendario</h1>
        <p className="text-gris text-sm">Dos vivos por mes: una clase y una supervisión de casos. Horarios en tu zona ({zona}).</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-bold">Próximos</h2>
        {proximos.length === 0 ? <Vacio titulo="No hay vivos agendados todavía" texto="Cuando se publique la fecha la vas a ver acá." /> : proximos.map(e => {
          const d = new Date(e.inicio);
          const t = TIPO[e.tipo];
          const enCurso = d.getTime() <= ahora;
          return (
            <div key={e.id} className="tarjeta p-5 flex gap-5 items-start">
              <div className="w-16 shrink-0 text-center rounded-xl border border-linea py-2">
                <p className="text-xs uppercase text-gris">{d.toLocaleDateString('es-AR', { month: 'short' })}</p>
                <p className="font-display font-extrabold text-2xl tabular-nums leading-none mt-0.5">{d.getDate()}</p>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.color }}>{t.nombre}{enCurso ? ' · ahora' : ''}</span>
                <h3 className="font-bold text-lg leading-snug">{e.titulo}</h3>
                <p className="text-sm text-gris capitalize">{d.toLocaleString('es-AR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })} h · {e.duracion_min} min</p>
                {e.descripcion && <p className="text-sm">{e.descripcion}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  {e.link && <a href={e.link} target="_blank" rel="noopener noreferrer" onClick={agendar} className="btn btn-oscuro !py-2"><Video className="w-4 h-4" /> Entrar al vivo</a>}
                  <a href={linkGoogle(e)} target="_blank" rel="noopener noreferrer" onClick={agendar} className="btn btn-borde !py-2"><CalendarPlus className="w-4 h-4" /> Agendar en Google</a>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {pasados.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold">Grabaciones</h2>
          {pasados.map(e => (
            <div key={e.id} className="tarjeta px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{e.titulo}</p>
                <p className="text-xs text-gris">{new Date(e.inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} · {TIPO[e.tipo].nombre}</p>
              </div>
              {e.grabacion_url
                ? <a href={e.grabacion_url} target="_blank" rel="noopener noreferrer" className="btn btn-borde !py-2 shrink-0"><PlayCircle className="w-4 h-4" /> Ver</a>
                : <span className="text-xs text-gris shrink-0">Grabación pronto</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
