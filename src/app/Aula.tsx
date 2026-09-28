import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Curso } from '../lib/tipos';
import { Cargando, Vacio } from '../components/ui';

// Cada ruta tiene su tono para que la grilla se lea de un vistazo
const TONO: Record<string, string> = {
  Fundamentos: '#B08A45', Patrones: '#8B6BB8', 'En sesión': '#4A90C2', Equipos: '#5DA8A0', IA: '#1C1A17',
};

export default function Aula() {
  const { niveles } = useAuth();
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  useEffect(() => { api<Curso[]>('cursos').then(setCursos).catch(() => setCursos([])); }, []);

  if (cursos === null) return <Cargando />;
  if (cursos.length === 0) return <Vacio titulo="Todavía no hay cursos publicados" texto="Pronto vas a encontrar acá las rutas de la academia." />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Aula</h1>
        <p className="text-gris text-sm">Los cursos avanzados se desbloquean al subir de nivel participando en la comunidad y completando lecciones.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cursos.map(c => {
          const pct = c.total ? Math.round((c.completadas / c.total) * 100) : 0;
          const tono = TONO[c.ruta] || '#B08A45';
          const nivelNombre = niveles.find(n => n.n === c.nivel_requerido)?.nombre;
          const contenido = (
            <>
              <div className="h-32 rounded-t-[13px] relative flex items-end p-4" style={{ background: `linear-gradient(135deg, ${tono}, ${tono}cc)` }}>
                <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">{c.ruta}</span>
                {!c.publicado && <span className="absolute top-3 right-3 text-[11px] bg-white/90 text-tinta px-2 py-0.5 rounded-full font-semibold">Borrador</span>}
                {c.bloqueado && (
                  <span className="absolute inset-0 rounded-t-[13px] bg-tinta/55 flex flex-col items-center justify-center gap-1 text-white text-sm font-semibold">
                    <Lock className="w-5 h-5" /> Se desbloquea en el nivel {c.nivel_requerido}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <h3 className="font-bold text-lg leading-snug">{c.titulo}</h3>
                <p className="text-sm text-gris flex-1">{c.descripcion}</p>
                {c.bloqueado ? (
                  <p className="text-xs text-gris">Nivel {c.nivel_requerido}{nivelNombre ? ` · ${nivelNombre}` : ''}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="h-1.5 rounded-full bg-crema overflow-hidden"><div className="h-full rounded-full bg-oro" style={{ width: `${pct}%` }} /></div>
                    <p className="text-xs text-gris tabular-nums">{c.completadas} de {c.total} lecciones · {pct}%</p>
                  </div>
                )}
              </div>
            </>
          );
          return c.bloqueado ? (
            <div key={c.id} className="tarjeta flex flex-col opacity-90" aria-disabled="true">{contenido}</div>
          ) : (
            <Link key={c.id} to={`/app/aula/${c.id}`} className="tarjeta flex flex-col hover:shadow-lg hover:!border-oro transition-shadow">{contenido}</Link>
          );
        })}
      </div>
    </div>
  );
}
