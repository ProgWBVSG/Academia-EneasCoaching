import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import { AvatarNivel, Cargando, Vacio } from '../components/ui';

interface Miembro { id: string; nombre: string; profesion: string | null; pais: string | null; bio: string | null; puntos: number; rol: string; nivel: number; creado: string }

export default function Miembros() {
  const [lista, setLista] = useState<Miembro[] | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => { api<Miembro[]>('miembros').then(setLista).catch(() => setLista([])); }, []);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!lista || !t) return lista || [];
    return lista.filter(m => [m.nombre, m.profesion, m.pais].some(v => v?.toLowerCase().includes(t)));
  }, [lista, q]);

  if (lista === null) return <Cargando />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold">Miembros</h1>
          <p className="text-gris text-sm tabular-nums">{lista.length} profesionales en la academia</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gris absolute left-3 top-1/2 -translate-y-1/2" />
          <input id="buscar" className="campo !pl-9" placeholder="Buscar por nombre, profesión o país" value={q} onChange={e => setQ(e.target.value)} />
        </label>
      </div>
      {filtrados.length === 0 ? <Vacio titulo="No encontramos miembros con esa búsqueda" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(m => (
            <div key={m.id} className="tarjeta p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <AvatarNivel nombre={m.nombre} id={m.id} nivel={m.nivel} tam={44} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{m.nombre}{m.rol === 'admin' && <span className="ml-1.5 text-[11px] text-oro">Equipo</span>}</p>
                  <p className="text-sm text-gris truncate">{[m.profesion, m.pais].filter(Boolean).join(' · ') || 'Miembro'}</p>
                </div>
              </div>
              {m.bio && <p className="text-sm text-gris line-clamp-3">{m.bio}</p>}
              <p className="text-xs text-gris mt-auto">Se sumó el {new Date(m.creado).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
