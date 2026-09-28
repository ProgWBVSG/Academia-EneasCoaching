import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Pin, Trash2, Check, Loader2, CalendarDays } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CATEGORIAS, haceCuanto, type Comentario, type Evento, type Post } from '../lib/tipos';
import { AvatarNivel, Cargando, Error, Modal, Vacio } from '../components/ui';

function PrimerosPasos() {
  const { onboarding } = useAuth();
  if (!onboarding) return null;
  const pasos = [
    { k: 'perfil', texto: 'Completá tu perfil', to: '/app/perfil' },
    { k: 'presentacion', texto: 'Presentate en la comunidad', to: '/app' },
    { k: 'leccion', texto: 'Mirá tu primera lección', to: '/app/aula' },
    { k: 'laboratorio', texto: 'Probá el laboratorio', to: '/app/laboratorio' },
    { k: 'vivo', texto: 'Agendá el próximo vivo', to: '/app/calendario' },
  ] as const;
  const hechos = pasos.filter(p => onboarding[p.k]).length;
  if (hechos === pasos.length) return null;
  return (
    <div className="tarjeta p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold">Primeros pasos</p>
        <span className="text-xs text-gris tabular-nums">{hechos} de {pasos.length}</span>
      </div>
      <div className="h-1.5 rounded-full bg-crema overflow-hidden"><div className="h-full bg-oro rounded-full" style={{ width: `${(hechos / pasos.length) * 100}%` }} /></div>
      <ul className="flex flex-col gap-1">
        {pasos.map(p => (
          <li key={p.k}>
            <Link to={p.to} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm hover:bg-crema ${onboarding[p.k] ? 'text-gris line-through' : ''}`}>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${onboarding[p.k] ? 'bg-oro border-oro text-white' : 'border-linea'}`}>
                {onboarding[p.k] && <Check className="w-3 h-3" />}
              </span>
              {p.texto}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProximoVivo() {
  const [ev, setEv] = useState<Evento | null>(null);
  useEffect(() => {
    api<Evento[]>('eventos').then(l => setEv(l.find(e => new Date(e.inicio).getTime() > Date.now()) || null)).catch(() => {});
  }, []);
  if (!ev) return null;
  return (
    <Link to="/app/calendario" className="tarjeta p-5 flex flex-col gap-2 hover:!border-oro">
      <span className="etiqueta flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Próximo vivo</span>
      <p className="font-semibold leading-snug">{ev.titulo}</p>
      <p className="text-sm text-gris capitalize">{new Date(ev.inicio).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })} h</p>
    </Link>
  );
}

function Detalle({ post, onCerrar, onCambio }: { post: Post; onCerrar: () => void; onCambio: () => void }) {
  const { perfil, nivel } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => api<Comentario[]>('comentarios', { query: { post_id: post.id } }).then(setComentarios), [post.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const comentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true); setError('');
    try { await api('comentario', { method: 'POST', body: { post_id: post.id, cuerpo: texto } }); setTexto(''); await cargar(); onCambio(); }
    catch (err: any) { setError(err.message); }
    finally { setEnviando(false); }
  };

  return (
    <Modal titulo={CATEGORIAS.find(c => c.id === post.categoria)?.nombre || 'Publicación'} onCerrar={onCerrar} ancho="max-w-2xl">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <AvatarNivel nombre={post.autor.nombre} id={post.autor.id} nivel={post.autor.nivel} />
          <div className="text-sm"><p className="font-semibold">{post.autor.nombre}</p><p className="text-gris">{haceCuanto(post.creado)}</p></div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{post.titulo}</h2>
          {post.cuerpo && <p className="whitespace-pre-line text-[15px] leading-relaxed">{post.cuerpo}</p>}
        </div>
        <div className="border-t border-linea pt-4 flex flex-col gap-4">
          {comentarios === null ? <Cargando /> : comentarios.map(c => (
            <div key={c.id} className="flex gap-3">
              <AvatarNivel nombre={c.autor.nombre} id={c.autor.id} nivel={c.autor.nivel} tam={30} />
              <div className="bg-crema rounded-xl px-3.5 py-2.5 flex-1">
                <p className="text-sm"><span className="font-semibold">{c.autor.nombre}</span> <span className="text-gris text-xs">{haceCuanto(c.creado)}</span></p>
                <p className="text-sm whitespace-pre-line mt-0.5">{c.cuerpo}</p>
              </div>
            </div>
          ))}
          <form onSubmit={comentar} className="flex gap-3 items-start">
            {perfil && <AvatarNivel nombre={perfil.nombre} id={perfil.id} nivel={nivel?.n || 1} tam={30} />}
            <div className="flex-1 flex flex-col gap-2">
              <textarea id="comentario" className="campo min-h-[70px]" placeholder="Escribí un comentario" value={texto} onChange={e => setTexto(e.target.value)} />
              <Error texto={error} />
              <button disabled={enviando || !texto.trim()} className="btn btn-oscuro self-end !py-2">{enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Comentar'}</button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

export default function Comunidad() {
  const { perfil, nivel, recargar } = useAuth();
  const [categoria, setCategoria] = useState('');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [abierto, setAbierto] = useState<Post | null>(null);
  const [nuevo, setNuevo] = useState({ categoria: 'presentaciones', titulo: '', cuerpo: '' });
  const [escribiendo, setEscribiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => api<Post[]>('posts', { query: categoria ? { categoria } : {} }).then(setPosts).catch(() => setPosts([])), [categoria]);
  useEffect(() => { cargar(); }, [cargar]);

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true); setError('');
    try {
      await api('post', { method: 'POST', body: nuevo });
      setNuevo({ categoria: 'general', titulo: '', cuerpo: '' }); setEscribiendo(false);
      await Promise.all([cargar(), recargar()]);
    } catch (err: any) { setError(err.message); }
    finally { setEnviando(false); }
  };

  const meGusta = async (p: Post) => {
    setPosts(ps => ps?.map(x => x.id === p.id ? { ...x, me_gusta: !x.me_gusta, likes: x.likes + (x.me_gusta ? -1 : 1) } : x) || null);
    await api('like', { method: 'POST', body: { post_id: p.id } }).catch(() => cargar());
  };

  const borrar = async (p: Post) => { await api('post', { method: 'DELETE', query: { id: p.id } }); cargar(); };
  const fijar = async (p: Post) => { await api('post-fijar', { method: 'PUT', body: { id: p.id, fijado: !p.fijado } }); cargar(); };

  const esAdmin = perfil?.rol === 'admin';
  const categoriasPublicables = CATEGORIAS.filter(c => c.id !== 'anuncios' || esAdmin);

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        {/* Redactar */}
        {!escribiendo ? (
          <button onClick={() => setEscribiendo(true)} className="tarjeta px-4 py-3.5 flex items-center gap-3 text-left text-gris hover:!border-oro">
            {perfil && <AvatarNivel nombre={perfil.nombre} id={perfil.id} nivel={nivel?.n || 1} tam={32} />}
            Escribí algo para la comunidad
          </button>
        ) : (
          <form onSubmit={publicar} className="tarjeta p-4 flex flex-col gap-3">
            <input id="titulo" className="campo font-semibold" placeholder="Título" value={nuevo.titulo} onChange={e => setNuevo({ ...nuevo, titulo: e.target.value })} autoFocus />
            <textarea id="cuerpo" className="campo min-h-[110px]" placeholder="Contá tu pregunta, caso o recurso. Si es un caso, anonimizalo." value={nuevo.cuerpo} onChange={e => setNuevo({ ...nuevo, cuerpo: e.target.value })} />
            <Error texto={error} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select id="categoria" className="campo !w-auto !py-2" value={nuevo.categoria} onChange={e => setNuevo({ ...nuevo, categoria: e.target.value })}>
                {categoriasPublicables.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEscribiendo(false)} className="btn btn-borde !py-2">Cancelar</button>
                <button disabled={enviando || !nuevo.titulo.trim()} className="btn btn-oscuro !py-2">{enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}</button>
              </div>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ id: '', nombre: 'Todo' }, ...CATEGORIAS].map(c => (
            <button key={c.id} onClick={() => setCategoria(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap border ${categoria === c.id ? 'bg-tinta text-white border-tinta' : 'bg-white border-linea text-gris hover:text-tinta'}`}>
              {c.nombre}
            </button>
          ))}
        </div>

        {/* Muro */}
        {posts === null ? <Cargando /> : posts.length === 0 ? (
          <Vacio titulo="Todavía no hay publicaciones acá" texto="Arrancá presentándote: contá a qué te dedicás y qué te gustaría aprender del Eneagrama." />
        ) : posts.map(p => (
          <article key={p.id} className="tarjeta p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <AvatarNivel nombre={p.autor.nombre} id={p.autor.id} nivel={p.autor.nivel} />
              <div className="text-sm min-w-0 flex-1">
                <p className="font-semibold truncate">{p.autor.nombre}{p.autor.rol === 'admin' && <span className="ml-1.5 text-[11px] font-semibold text-oro">Equipo</span>}</p>
                <p className="text-gris">{haceCuanto(p.creado)} · {CATEGORIAS.find(c => c.id === p.categoria)?.nombre}</p>
              </div>
              {p.fijado && <span className="flex items-center gap-1 text-xs text-oro font-semibold"><Pin className="w-3.5 h-3.5" /> Fijado</span>}
            </div>
            <button onClick={() => setAbierto(p)} className="text-left flex flex-col gap-1.5">
              <h3 className="font-bold text-lg leading-snug">{p.titulo}</h3>
              {p.cuerpo && <p className="text-gris line-clamp-3 whitespace-pre-line text-[15px]">{p.cuerpo}</p>}
            </button>
            <div className="flex items-center gap-5 text-sm text-gris">
              <button onClick={() => meGusta(p)} className={`flex items-center gap-1.5 ${p.me_gusta ? 'text-oro font-semibold' : 'hover:text-tinta'}`} aria-pressed={p.me_gusta}>
                <Heart className={`w-4 h-4 ${p.me_gusta ? 'fill-current' : ''}`} /> {p.likes}
              </button>
              <button onClick={() => setAbierto(p)} className="flex items-center gap-1.5 hover:text-tinta"><MessageCircle className="w-4 h-4" /> {p.comentarios}</button>
              <span className="flex-1" />
              {esAdmin && <button onClick={() => fijar(p)} className="hover:text-tinta" title={p.fijado ? 'Desfijar' : 'Fijar'}><Pin className="w-4 h-4" /></button>}
              {(esAdmin || p.autor.id === perfil?.id) && <button onClick={() => borrar(p)} className="hover:text-red-700" title="Borrar"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </article>
        ))}
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-32">
        <PrimerosPasos />
        <ProximoVivo />
      </aside>

      {abierto && <Detalle post={abierto} onCerrar={() => setAbierto(null)} onCambio={cargar} />}
    </div>
  );
}
