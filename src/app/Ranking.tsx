import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Nivel } from '../lib/tipos';
import { AvatarNivel, Cargando } from '../components/ui';

interface Fila { id: string; nombre: string; profesion: string | null; puntos: number; rol: string; nivel: Nivel }

const COMO_SUMAR = [
  ['Publicar en la comunidad', 3], ['Completar una lección', 2], ['Terminar una práctica en el laboratorio', 3],
  ['Comentar', 1], ['Recibir un me gusta', 1],
] as const;

export default function Ranking() {
  const { perfil, nivel, niveles } = useAuth();
  const [filas, setFilas] = useState<Fila[] | null>(null);
  useEffect(() => { api<Fila[]>('ranking').then(setFilas).catch(() => setFilas([])); }, []);

  if (!perfil || !nivel) return null;
  const siguiente = niveles.find(n => n.n === nivel.n + 1);
  const pct = siguiente ? Math.min(100, Math.round(((perfil.puntos - nivel.desde) / (siguiente.desde - nivel.desde)) * 100)) : 100;

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <h1 className="text-2xl font-extrabold">Ranking</h1>
        <div className="tarjeta overflow-hidden">
          {filas === null ? <Cargando /> : filas.map((f, i) => (
            <div key={f.id} className={`flex items-center gap-4 px-5 py-3.5 border-b border-linea last:border-0 ${f.id === perfil.id ? 'bg-oro-suave' : ''}`}>
              <span className={`w-7 text-center font-display font-extrabold tabular-nums ${i < 3 ? 'text-oro text-lg' : 'text-gris'}`}>{i + 1}</span>
              <AvatarNivel nombre={f.nombre} id={f.id} nivel={f.nivel.n} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{f.nombre}</p>
                <p className="text-xs text-gris truncate">Nivel {f.nivel.n} · {f.nivel.nombre}{f.profesion ? ` · ${f.profesion}` : ''}</p>
              </div>
              <span className="font-semibold tabular-nums">{f.puntos}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="tarjeta p-5 flex flex-col gap-3">
          <p className="etiqueta">Tu nivel</p>
          <div className="flex items-center gap-3">
            <AvatarNivel nombre={perfil.nombre} id={perfil.id} nivel={nivel.n} tam={48} />
            <div>
              <p className="font-display font-extrabold text-xl">{nivel.nombre}</p>
              <p className="text-sm text-gris tabular-nums">{perfil.puntos} puntos</p>
            </div>
          </div>
          {siguiente && (
            <>
              <div className="h-2 rounded-full bg-crema overflow-hidden"><div className="h-full bg-oro rounded-full" style={{ width: `${pct}%` }} /></div>
              <p className="text-xs text-gris tabular-nums">Te faltan {siguiente.desde - perfil.puntos} puntos para {siguiente.nombre} (nivel {siguiente.n})</p>
            </>
          )}
        </div>
        <div className="tarjeta p-5 flex flex-col gap-3">
          <p className="font-bold">Cómo sumar puntos</p>
          <ul className="flex flex-col gap-2 text-sm">
            {COMO_SUMAR.map(([t, p]) => (
              <li key={t} className="flex justify-between gap-3"><span>{t}</span><span className="font-semibold text-oro tabular-nums">+{p}</span></li>
            ))}
          </ul>
        </div>
        <div className="tarjeta p-5 flex flex-col gap-2">
          <p className="font-bold">Niveles</p>
          {niveles.map(n => (
            <div key={n.n} className={`flex justify-between text-sm ${n.n === nivel.n ? 'font-semibold text-oro' : n.n < nivel.n ? 'text-gris' : ''}`}>
              <span>{n.n} · {n.nombre}</span><span className="tabular-nums">{n.desde} pts</span>
            </div>
          ))}
          <p className="text-xs text-gris pt-1">La ruta En sesión se abre en el nivel 2 y las de Equipos e IA en el nivel 3.</p>
        </div>
      </aside>
    </div>
  );
}
