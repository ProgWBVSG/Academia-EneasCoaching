import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { Curso, Evento, Leccion, Modulo, Perfil } from '../lib/tipos';
import { Campo, Cargando, Error, Modal, Vacio } from '../components/ui';

type Tab = 'miembros' | 'pagos' | 'cursos' | 'eventos';

// ── Miembros ────────────────────────────────────────────────────────
function Miembros() {
  const [lista, setLista] = useState<Perfil[] | null>(null);
  const [filtro, setFiltro] = useState<'todas' | Perfil['estado']>('todas');
  const cargar = useCallback(() => api<Perfil[]>('admin-miembros').then(setLista), []);
  useEffect(() => { cargar(); }, [cargar]);

  const cambiar = async (id: string, cambios: Partial<Perfil>) => {
    setLista(l => l?.map(p => p.id === id ? { ...p, ...cambios } : p) || null);
    await api('admin-miembro', { method: 'PUT', body: { id, ...cambios } });
  };

  if (!lista) return <Cargando />;
  const cuenta = (e: Perfil['estado']) => lista.filter(p => p.estado === e).length;
  const visibles = filtro === 'todas' ? lista : lista.filter(p => p.estado === filtro);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {([['todas', `Todas (${lista.length})`], ['pendiente', `Sin activar (${cuenta('pendiente')})`], ['activa', `Activas (${cuenta('activa')})`], ['vencida', `Pausadas (${cuenta('vencida')})`]] as const).map(([k, t]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`px-3.5 py-1.5 rounded-full text-sm border ${filtro === k ? 'bg-tinta text-white border-tinta' : 'bg-white border-linea text-gris'}`}>{t}</button>
        ))}
      </div>
      <p className="text-sm text-gris">Quien paga con Mercado Pago o desde el exterior se activa sola. Las transferencias se confirman en la pestaña Pagos.</p>
      <div className="tarjeta overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gris border-b border-linea">
            <th className="px-4 py-3 font-semibold">Nombre</th><th className="px-4 py-3 font-semibold">Profesión</th>
            <th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Rol</th>
            <th className="px-4 py-3 font-semibold text-right">Puntos</th><th className="px-4 py-3 font-semibold">Alta</th>
          </tr></thead>
          <tbody>
            {visibles.map(p => (
              <tr key={p.id} className="border-b border-linea last:border-0">
                <td className="px-4 py-3"><p className="font-semibold">{p.nombre}</p><p className="text-xs text-gris">{p.email}</p></td>
                <td className="px-4 py-3">{[p.profesion, p.pais].filter(Boolean).join(' · ') || '—'}</td>
                <td className="px-4 py-3">
                  <select className="campo !py-1.5 !w-auto" value={p.estado} onChange={e => cambiar(p.id, { estado: e.target.value as Perfil['estado'] })} aria-label={`Estado de ${p.nombre}`}>
                    <option value="pendiente">Sin activar</option><option value="activa">Activa</option><option value="vencida">Pausada</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select className="campo !py-1.5 !w-auto" value={p.rol} onChange={e => cambiar(p.id, { rol: e.target.value as Perfil['rol'] })} aria-label={`Rol de ${p.nombre}`}>
                    <option value="miembro">Miembro</option><option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{p.puntos}</td>
                <td className="px-4 py-3 text-gris whitespace-nowrap">{new Date(p.creado).toLocaleDateString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pagos ───────────────────────────────────────────────────────────
type Pago = {
  id: string; metodo: 'mercadopago' | 'transferencia' | 'internacional'; monto: number; moneda: string; meses: number;
  estado: 'pendiente' | 'confirmado' | 'rechazado'; referencia: string | null; creado: string; confirmado: string | null;
  perfil: { nombre: string; email: string; vence: string | null } | null;
};
const METODO = { mercadopago: 'Mercado Pago', transferencia: 'Transferencia', internacional: 'PayPal / internacional' } as const;
const dinero = (p: Pago) => `${p.moneda === 'ARS' ? '$' : p.moneda} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(p.monto)}`;

function Pagos() {
  const [lista, setLista] = useState<Pago[] | null>(null);
  const [trabajando, setTrabajando] = useState('');
  const [error, setError] = useState('');
  const cargar = useCallback(() => api<Pago[]>('admin-pagos').then(setLista).catch(e => setError(e.message)), []);
  useEffect(() => { cargar(); }, [cargar]);

  const revisar = async (id: string, accion: 'confirmar' | 'rechazar') => {
    setTrabajando(id); setError('');
    try { await api('admin-pago', { method: 'PUT', body: { id, accion } }); await cargar(); }
    catch (e: any) { setError(e.message); }
    setTrabajando('');
  };

  if (!lista) return error ? <Error texto={error} /> : <Cargando />;
  const pendientes = lista.filter(p => p.estado === 'pendiente');
  const historial = lista.filter(p => p.estado !== 'pendiente');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-lg">Pagos para confirmar ({pendientes.length})</h2>
        <p className="text-sm text-gris">Revisá que el dinero haya entrado (transferencia o PayPal) y confirmá. La persona queda activa por los meses que pagó. Mercado Pago y el pago con tarjeta internacional se activan solos.</p>
        <Error texto={error} />
        {pendientes.length === 0 ? <Vacio titulo="No hay pagos esperando." /> : pendientes.map(p => (
          <div key={p.id} className="tarjeta p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{p.perfil?.nombre || 'Sin nombre'} <span className="text-gris font-normal text-sm">{p.perfil?.email}</span></p>
              <p className="text-sm text-gris">{dinero(p)} · {p.meses} {p.meses === 1 ? 'mes' : 'meses'} · {new Date(p.creado).toLocaleString('es-AR')}{p.referencia ? ` · Operación ${p.referencia}` : ''}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => revisar(p.id, 'confirmar')} disabled={!!trabajando} className="btn btn-oscuro !py-2 !px-4 text-sm">
                {trabajando === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirmar</>}
              </button>
              <button onClick={() => revisar(p.id, 'rechazar')} disabled={!!trabajando} className="btn btn-borde !py-2 !px-4 text-sm"><X className="w-4 h-4" /> Rechazar</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-lg">Últimos pagos</h2>
        {historial.length === 0 ? <Vacio titulo="Todavía no hay pagos registrados." /> : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gris border-b border-linea">
                <th className="px-4 py-3 font-semibold">Persona</th><th className="px-4 py-3 font-semibold">Medio</th>
                <th className="px-4 py-3 font-semibold text-right">Monto</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Fecha</th>
              </tr></thead>
              <tbody>
                {historial.map(p => (
                  <tr key={p.id} className="border-b border-linea last:border-0">
                    <td className="px-4 py-3">{p.perfil?.nombre}<p className="text-xs text-gris">{p.perfil?.email}</p></td>
                    <td className="px-4 py-3">{METODO[p.metodo]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{dinero(p)}</td>
                    <td className="px-4 py-3">{p.estado === 'confirmado' ? 'Confirmado' : 'Rechazado'}</td>
                    <td className="px-4 py-3 text-gris whitespace-nowrap">{new Date(p.creado).toLocaleDateString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cursos ──────────────────────────────────────────────────────────
const CURSO_VACIO = { titulo: '', descripcion: '', ruta: 'Fundamentos', nivel_requerido: 1, orden: 0, publicado: true };

function Cursos() {
  const [cursos, setCursos] = useState<Curso[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [arbol, setArbol] = useState<Modulo[]>([]);
  const [editCurso, setEditCurso] = useState<any>(null);
  const [editLeccion, setEditLeccion] = useState<any>(null);
  const [nuevoModulo, setNuevoModulo] = useState('');
  const [error, setError] = useState('');
  const [sembrando, setSembrando] = useState(false);

  const cargarCursos = useCallback(() => api<Curso[]>('cursos').then(c => { setCursos(c); if (!sel && c[0]) setSel(c[0].id); }), [sel]);
  const cargarArbol = useCallback(() => { if (sel) api('curso', { query: { id: sel } }).then(d => setArbol(d.modulos)); }, [sel]);
  useEffect(() => { cargarCursos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { cargarArbol(); }, [cargarArbol]);

  const guardarCurso = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const c = await api('admin-curso', { method: editCurso.id ? 'PUT' : 'POST', body: editCurso });
      setEditCurso(null); setSel(c.id); await cargarCursos();
    } catch (err: any) { setError(err.message); }
  };
  const borrarCurso = async (id: string) => { await api('admin-curso', { method: 'DELETE', query: { id } }); setSel(null); setArbol([]); cargarCursos(); };

  const agregarModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoModulo.trim() || !sel) return;
    await api('admin-modulo', { method: 'POST', body: { curso_id: sel, titulo: nuevoModulo, orden: arbol.length } });
    setNuevoModulo(''); cargarArbol();
  };
  const borrarModulo = async (id: string) => { await api('admin-modulo', { method: 'DELETE', query: { id } }); cargarArbol(); };

  const guardarLeccion = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const recursos = String(editLeccion.recursosTexto || '').split('\n').map((l: string) => {
      const [nombre, url] = l.split('|').map(s => s.trim());
      return { nombre, url };
    }).filter((r: any) => r.nombre && r.url);
    try {
      await api('admin-leccion', { method: editLeccion.id ? 'PUT' : 'POST', body: { ...editLeccion, recursos } });
      setEditLeccion(null); cargarArbol(); cargarCursos();
    } catch (err: any) { setError(err.message); }
  };
  const borrarLeccion = async (id: string) => { await api('admin-leccion', { method: 'DELETE', query: { id } }); cargarArbol(); cargarCursos(); };

  const sembrar = async () => {
    setSembrando(true);
    const r = await api('admin-sembrar', { method: 'POST' }).catch(e => ({ ok: false, motivo: e.message }));
    setSembrando(false);
    if (!r.ok) setError(r.motivo); else cargarCursos();
  };

  if (!cursos) return <Cargando />;
  const curso = cursos.find(c => c.id === sel);

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
      <div className="flex flex-col gap-3">
        <button onClick={() => setEditCurso({ ...CURSO_VACIO, orden: cursos.length })} className="btn btn-oscuro"><Plus className="w-4 h-4" /> Nuevo curso</button>
        {cursos.length === 0 && (
          <div className="tarjeta p-4 flex flex-col gap-2 text-sm">
            <p>No hay cursos. Podés cargar la estructura inicial de las cinco rutas, con lecciones de ejemplo y dos vivos, y editarla después.</p>
            <button onClick={sembrar} disabled={sembrando} className="btn btn-oro !py-2">{sembrando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cargar contenido inicial'}</button>
          </div>
        )}
        {cursos.map(c => (
          <button key={c.id} onClick={() => setSel(c.id)} className={`tarjeta text-left px-4 py-3 ${c.id === sel ? '!border-oro bg-oro-suave' : ''}`}>
            <p className="font-semibold text-sm flex items-center gap-1.5">{!c.publicado && <EyeOff className="w-3.5 h-3.5 text-gris" />}{c.titulo}</p>
            <p className="text-xs text-gris">{c.ruta} · nivel {c.nivel_requerido} · {c.total} lecciones</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 min-w-0">
        <Error texto={error} />
        {!curso ? <Vacio titulo="Elegí un curso para editarlo" /> : (
          <>
            <div className="tarjeta p-5 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-lg">{curso.titulo}</h2>
                <p className="text-sm text-gris">{curso.descripcion}</p>
                <p className="text-xs text-gris mt-1 flex items-center gap-1">{curso.publicado ? <><Eye className="w-3.5 h-3.5" /> Publicado</> : <><EyeOff className="w-3.5 h-3.5" /> Borrador</>} · Ruta {curso.ruta} · Nivel {curso.nivel_requerido}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditCurso(curso)} className="btn btn-borde !py-2"><Pencil className="w-4 h-4" /> Editar</button>
                <button onClick={() => borrarCurso(curso.id)} className="btn btn-borde !py-2 hover:!border-red-300 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {arbol.map(m => (
              <div key={m.id} className="tarjeta overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-crema border-b border-linea">
                  <p className="font-semibold">{m.titulo}</p>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditLeccion({ modulo_id: m.id, titulo: '', video_url: '', contenido: '', recursosTexto: '', orden: m.lecciones.length })} className="text-oro font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Lección</button>
                    <button onClick={() => borrarModulo(m.id)} className="text-gris hover:text-red-700" aria-label="Borrar módulo"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {m.lecciones.length === 0 ? <p className="px-5 py-4 text-sm text-gris">Sin lecciones todavía.</p> : m.lecciones.map((l: Leccion) => (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3 border-b border-linea last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${l.video_url ? 'bg-emerald-600' : 'bg-linea'}`} title={l.video_url ? 'Con video' : 'Sin video'} />
                    <p className="flex-1 text-sm min-w-0 truncate">{l.titulo}</p>
                    <button onClick={() => setEditLeccion({ ...l, recursosTexto: (l.recursos || []).map(r => `${r.nombre} | ${r.url}`).join('\n') })} className="text-gris hover:text-tinta" aria-label="Editar lección"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => borrarLeccion(l.id)} className="text-gris hover:text-red-700" aria-label="Borrar lección"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            ))}

            <form onSubmit={agregarModulo} className="flex gap-2">
              <input id="nuevo-modulo" className="campo" placeholder="Nombre del nuevo módulo" value={nuevoModulo} onChange={e => setNuevoModulo(e.target.value)} />
              <button className="btn btn-oscuro !py-2 shrink-0"><Plus className="w-4 h-4" /> Módulo</button>
            </form>
          </>
        )}
      </div>

      {editCurso && (
        <Modal titulo={editCurso.id ? 'Editar curso' : 'Nuevo curso'} onCerrar={() => setEditCurso(null)}>
          <form onSubmit={guardarCurso} className="flex flex-col gap-4">
            <Campo label="Título"><input id="c-titulo" className="campo" value={editCurso.titulo} onChange={e => setEditCurso({ ...editCurso, titulo: e.target.value })} /></Campo>
            <Campo label="Descripción"><textarea id="c-desc" className="campo min-h-[80px]" value={editCurso.descripcion} onChange={e => setEditCurso({ ...editCurso, descripcion: e.target.value })} /></Campo>
            <div className="grid grid-cols-3 gap-3">
              <Campo label="Ruta">
                <select id="c-ruta" className="campo" value={editCurso.ruta} onChange={e => setEditCurso({ ...editCurso, ruta: e.target.value })}>
                  {['Fundamentos', 'Patrones', 'En sesión', 'Equipos', 'IA'].map(r => <option key={r}>{r}</option>)}
                </select>
              </Campo>
              <Campo label="Nivel mínimo"><input id="c-nivel" type="number" min={1} max={9} className="campo" value={editCurso.nivel_requerido} onChange={e => setEditCurso({ ...editCurso, nivel_requerido: Number(e.target.value) })} /></Campo>
              <Campo label="Orden"><input id="c-orden" type="number" className="campo" value={editCurso.orden} onChange={e => setEditCurso({ ...editCurso, orden: Number(e.target.value) })} /></Campo>
            </div>
            <label className="flex items-center gap-2 text-sm"><input id="c-pub" type="checkbox" checked={editCurso.publicado} onChange={e => setEditCurso({ ...editCurso, publicado: e.target.checked })} /> Publicado (visible para miembros)</label>
            <button className="btn btn-oscuro self-end">Guardar</button>
          </form>
        </Modal>
      )}

      {editLeccion && (
        <Modal titulo={editLeccion.id ? 'Editar lección' : 'Nueva lección'} onCerrar={() => setEditLeccion(null)} ancho="max-w-2xl">
          <form onSubmit={guardarLeccion} className="flex flex-col gap-4">
            <Campo label="Título"><input id="l-titulo" className="campo" value={editLeccion.titulo} onChange={e => setEditLeccion({ ...editLeccion, titulo: e.target.value })} /></Campo>
            <Campo label="Link del video" ayuda="YouTube (no listado), Vimeo o Google Drive.">
              <input id="l-video" className="campo" value={editLeccion.video_url || ''} onChange={e => setEditLeccion({ ...editLeccion, video_url: e.target.value })} placeholder="https://youtu.be/..." />
            </Campo>
            <Campo label="Texto de la lección"><textarea id="l-contenido" className="campo min-h-[140px]" value={editLeccion.contenido} onChange={e => setEditLeccion({ ...editLeccion, contenido: e.target.value })} /></Campo>
            <Campo label="Material descargable" ayuda="Una línea por archivo: Nombre | link">
              <textarea id="l-recursos" className="campo min-h-[80px] font-mono text-xs" value={editLeccion.recursosTexto} onChange={e => setEditLeccion({ ...editLeccion, recursosTexto: e.target.value })} placeholder="Ficha del tipo 4 | https://drive.google.com/..." />
            </Campo>
            <button className="btn btn-oscuro self-end">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Eventos ─────────────────────────────────────────────────────────
const aLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

function Eventos() {
  const [lista, setLista] = useState<Evento[] | null>(null);
  const [edit, setEdit] = useState<any>(null);
  const [error, setError] = useState('');
  const cargar = useCallback(() => api<Evento[]>('eventos').then(setLista), []);
  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api('admin-evento', { method: edit.id ? 'PUT' : 'POST', body: { ...edit, inicio: new Date(edit.inicioLocal).toISOString() } });
      setEdit(null); cargar();
    } catch (err: any) { setError(err.message); }
  };
  const borrar = async (id: string) => { await api('admin-evento', { method: 'DELETE', query: { id } }); cargar(); };

  if (!lista) return <Cargando />;
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <button onClick={() => setEdit({ titulo: '', tipo: 'clase', inicioLocal: '', duracion_min: 75, link: '', grabacion_url: '', descripcion: '' })} className="btn btn-oscuro self-start"><Plus className="w-4 h-4" /> Nuevo vivo</button>
      {lista.length === 0 ? <Vacio titulo="No hay vivos cargados" /> : lista.map(ev => (
        <div key={ev.id} className="tarjeta px-5 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{ev.titulo}</p>
            <p className="text-xs text-gris">{new Date(ev.inicio).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })} · {ev.tipo === 'supervision' ? 'Supervisión' : ev.tipo === 'clase' ? 'Clase' : 'Otro'}{ev.link ? '' : ' · sin link'}{ev.grabacion_url ? ' · con grabación' : ''}</p>
          </div>
          <button onClick={() => setEdit({ ...ev, inicioLocal: aLocal(ev.inicio) })} className="text-gris hover:text-tinta" aria-label="Editar"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => borrar(ev.id)} className="text-gris hover:text-red-700" aria-label="Borrar"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {edit && (
        <Modal titulo={edit.id ? 'Editar vivo' : 'Nuevo vivo'} onCerrar={() => setEdit(null)}>
          <form onSubmit={guardar} className="flex flex-col gap-4">
            <Campo label="Título"><input id="e-titulo" className="campo" value={edit.titulo} onChange={e => setEdit({ ...edit, titulo: e.target.value })} /></Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Tipo">
                <select id="e-tipo" className="campo" value={edit.tipo} onChange={e => setEdit({ ...edit, tipo: e.target.value })}>
                  <option value="clase">Clase en vivo</option><option value="supervision">Supervisión de casos</option><option value="otro">Otro</option>
                </select>
              </Campo>
              <Campo label="Duración (min)"><input id="e-dur" type="number" className="campo" value={edit.duracion_min} onChange={e => setEdit({ ...edit, duracion_min: Number(e.target.value) })} /></Campo>
            </div>
            <Campo label="Fecha y hora" ayuda="En tu zona horaria. Cada miembro lo ve convertido a la suya."><input id="e-inicio" type="datetime-local" className="campo" value={edit.inicioLocal} onChange={e => setEdit({ ...edit, inicioLocal: e.target.value })} required /></Campo>
            <Campo label="Link de Zoom o Meet"><input id="e-link" className="campo" value={edit.link || ''} onChange={e => setEdit({ ...edit, link: e.target.value })} /></Campo>
            <Campo label="Link de la grabación" ayuda="Cargalo después del vivo."><input id="e-grab" className="campo" value={edit.grabacion_url || ''} onChange={e => setEdit({ ...edit, grabacion_url: e.target.value })} /></Campo>
            <Campo label="Descripción"><textarea id="e-desc" className="campo min-h-[70px]" value={edit.descripcion} onChange={e => setEdit({ ...edit, descripcion: e.target.value })} /></Campo>
            <Error texto={error} />
            <button className="btn btn-oscuro self-end">Guardar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function Admin() {
  const { perfil } = useAuth();
  const [tab, setTab] = useState<Tab>('miembros');
  if (perfil?.rol !== 'admin') return <Navigate to="/app" replace />;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Administración</h1>
        <div className="flex gap-1 bg-white border border-linea rounded-full p-1">
          {([['miembros', 'Miembros'], ['pagos', 'Pagos'], ['cursos', 'Cursos'], ['eventos', 'Vivos']] as const).map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-1.5 rounded-full text-sm ${tab === k ? 'bg-tinta text-white' : 'text-gris'}`}>{t}</button>
          ))}
        </div>
      </div>
      {tab === 'miembros' && <Miembros />}
      {tab === 'pagos' && <Pagos />}
      {tab === 'cursos' && <Cursos />}
      {tab === 'eventos' && <Eventos />}
    </div>
  );
}
