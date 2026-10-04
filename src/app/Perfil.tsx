import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AvatarNivel, Campo, Error } from '../components/ui';
import SelectorPais from '../components/SelectorPais';

const ESTADO = { activa: 'Activa', pendiente: 'Sin activar', vencida: 'Pausada' } as const;

export default function PerfilVista() {
  const { perfil, nivel, recargar } = useAuth();
  const [f, setF] = useState({ nombre: '', profesion: '', pais: '', bio: '' });
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (perfil) setF({ nombre: perfil.nombre, profesion: perfil.profesion || '', pais: perfil.pais || '', bio: perfil.bio || '' });
  }, [perfil]);

  if (!perfil || !nivel) return null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true); setOk(false); setError('');
    try { await api('perfil', { method: 'PUT', body: f }); await recargar(); setOk(true); }
    catch (err: any) { setError(err.message); }
    finally { setGuardando(false); }
  };

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <AvatarNivel nombre={perfil.nombre} id={perfil.id} nivel={nivel.n} tam={64} />
        <div>
          <h1 className="text-2xl font-extrabold">{perfil.nombre}</h1>
          <p className="text-sm text-gris">{perfil.email} · Nivel {nivel.n} {nivel.nombre} · Membresía {ESTADO[perfil.estado].toLowerCase()}</p>
        </div>
      </div>
      <form onSubmit={guardar} className="tarjeta p-6 flex flex-col gap-4">
        <Campo label="Nombre y apellido"><input id="p-nombre" className="campo" value={f.nombre} onChange={e => setF({ ...f, nombre: e.target.value })} /></Campo>
        <div className="grid sm:grid-cols-2 gap-4">
          <Campo label="Profesión"><input id="p-profesion" className="campo" value={f.profesion} onChange={e => setF({ ...f, profesion: e.target.value })} placeholder="Psicóloga, coach, RRHH..." /></Campo>
          <Campo label="País"><SelectorPais id="p-pais" valor={f.pais} onChange={v => setF({ ...f, pais: v })} /></Campo>
        </div>
        <Campo label="Sobre vos" ayuda="Se ve en el directorio de miembros. Contá cómo usás o querés usar el Eneagrama.">
          <textarea id="p-bio" className="campo min-h-[100px]" value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} />
        </Campo>
        <Error texto={error} />
        {ok && <p className="text-sm text-emerald-800">Guardado.</p>}
        <button disabled={guardando} className="btn btn-oscuro self-start">{guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar cambios'}</button>
      </form>
      {perfil.estado === 'activa' && perfil.rol !== 'admin' && (
        <p className="text-sm text-gris">
          {perfil.metodo_pago === 'transferencia'
            ? `Pagás por transferencia${perfil.vence ? `: tu acceso está pago hasta el ${new Date(perfil.vence).toLocaleDateString('es-AR')}` : ''}. Si no renovás, se pausa solo y tu progreso queda guardado.`
            : perfil.metodo_pago === 'internacional'
              ? 'Para cancelar la membresía, usá el link de gestión que te llegó por mail con tu suscripción. Tu progreso queda guardado si volvés.'
              : 'Para cancelar la membresía, entrá a Mercado Pago, sección Suscripciones. Tu progreso queda guardado si volvés.'}{' '}
          <Link to="/app/membresia" className="underline underline-offset-4 hover:text-oro">Ver opciones de pago</Link>
        </p>
      )}
    </div>
  );
}
