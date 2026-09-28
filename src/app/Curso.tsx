import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Download, PlayCircle } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { urlEmbebible, type Leccion, type Modulo } from '../lib/tipos';
import { Cargando, Vacio } from '../components/ui';

export default function CursoVista() {
  const { id } = useParams();
  const { recargar } = useAuth();
  const [datos, setDatos] = useState<{ curso: { titulo: string; descripcion: string }; modulos: Modulo[]; completadas: string[] } | null>(null);
  const [error, setError] = useState('');
  const [actual, setActual] = useState<string | null>(null);

  useEffect(() => {
    api('curso', { query: { id: id! } })
      .then(d => {
        setDatos(d);
        const todas: Leccion[] = d.modulos.flatMap((m: Modulo) => m.lecciones);
        const pendiente = todas.find(l => !d.completadas.includes(l.id));
        setActual((pendiente || todas[0])?.id || null);
      })
      .catch((e: ApiError) => setError(e.message));
  }, [id]);

  const lecciones = useMemo(() => datos?.modulos.flatMap(m => m.lecciones) || [], [datos]);
  const leccion = lecciones.find(l => l.id === actual);
  const hechas = new Set(datos?.completadas || []);

  const alternar = async (l: Leccion) => {
    const estaba = hechas.has(l.id);
    setDatos(d => d && { ...d, completadas: estaba ? d.completadas.filter(x => x !== l.id) : [...d.completadas, l.id] });
    await api('leccion-completar', { method: 'POST', body: { leccion_id: l.id, desmarcar: estaba } });
    if (!estaba) {
      recargar();
      const i = lecciones.findIndex(x => x.id === l.id);
      if (lecciones[i + 1]) setActual(lecciones[i + 1].id);
    }
  };

  if (error) return <Vacio titulo="No podés entrar a este curso todavía" texto={error}><Link to="/app/aula" className="btn btn-borde mt-3">Volver al Aula</Link></Vacio>;
  if (!datos) return <Cargando />;

  const pct = lecciones.length ? Math.round((hechas.size / lecciones.length) * 100) : 0;
  const embed = leccion?.video_url ? urlEmbebible(leccion.video_url) : null;

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
      <aside className="tarjeta overflow-hidden lg:sticky lg:top-32">
        <div className="p-5 border-b border-linea flex flex-col gap-2">
          <Link to="/app/aula" className="text-sm text-gris flex items-center gap-1 hover:text-tinta"><ArrowLeft className="w-4 h-4" /> Aula</Link>
          <h1 className="font-bold text-lg leading-snug">{datos.curso.titulo}</h1>
          <div className="h-1.5 rounded-full bg-crema overflow-hidden"><div className="h-full bg-oro rounded-full" style={{ width: `${pct}%` }} /></div>
          <p className="text-xs text-gris tabular-nums">{pct}% completado</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {datos.modulos.map(m => (
            <div key={m.id} className="py-1">
              <p className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gris">{m.titulo}</p>
              {m.lecciones.map(l => (
                <button key={l.id} onClick={() => setActual(l.id)}
                  className={`w-full text-left px-5 py-2.5 flex items-start gap-2.5 text-sm ${l.id === actual ? 'bg-oro-suave font-semibold' : 'hover:bg-crema'}`}>
                  {hechas.has(l.id) ? <CheckCircle2 className="w-4 h-4 text-oro shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-linea shrink-0 mt-0.5" />}
                  {l.titulo}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {leccion ? (
        <div className="flex flex-col gap-5 min-w-0">
          {embed ? (
            <div className="aspect-video w-full max-w-full rounded-2xl overflow-hidden bg-tinta">
              <iframe src={embed} title={leccion.titulo} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
            </div>
          ) : (
            <div className="aspect-video w-full max-w-full rounded-2xl bg-tinta text-crema/70 flex flex-col items-center justify-center gap-2 text-sm">
              <PlayCircle className="w-10 h-10 text-oro-claro" /> El video de esta lección se publica pronto
            </div>
          )}
          <div className="tarjeta p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{leccion.titulo}</h2>
              <button onClick={() => alternar(leccion)} className={`btn !py-2 ${hechas.has(leccion.id) ? 'btn-borde' : 'btn-oscuro'}`}>
                <CheckCircle2 className="w-4 h-4" /> {hechas.has(leccion.id) ? 'Completada' : 'Marcar como completada'}
              </button>
            </div>
            {leccion.contenido && <p className="whitespace-pre-line leading-relaxed text-[15px]">{leccion.contenido}</p>}
            {leccion.recursos?.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-linea pt-4">
                <p className="text-sm font-semibold">Material de la lección</p>
                {leccion.recursos.map(r => (
                  <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-oro hover:underline">
                    <Download className="w-4 h-4" /> {r.nombre}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : <Vacio titulo="Este curso todavía no tiene lecciones" />}
    </div>
  );
}
