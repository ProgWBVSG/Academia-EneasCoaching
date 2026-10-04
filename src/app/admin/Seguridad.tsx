import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Cargando, Error } from '../../components/ui';
import { Verificacion } from './Puerta';

type Registro = { id: number; creado: string; actor_email: string | null; accion: string; objetivo: string | null; detalle: Record<string, any>; ip: string | null };

const ACCIONES: Record<string, string> = {
  login: 'Ingresó', login_fallido: 'Intento de ingreso fallido', mfa_inicio: 'Empezó a configurar la verificación en dos pasos',
  mfa_ok: 'Verificó su código', mfa_fallido: 'Código incorrecto', sesiones_cerradas: 'Cerró todas sus sesiones',
  pago_confirmado: 'Confirmó un pago', pago_rechazado: 'Rechazó un pago', alta_manual: 'Alta manual',
  rol_cambiado: 'Cambió un rol', estado_cambiado: 'Cambió el estado de una miembro',
};
const nombreAccion = (a: string) => ACCIONES[a] || (a.startsWith('admin-') ? `Cambió contenido (${a.replace('admin-', '').replace(':', ' ')})` : a);

function resumen(d: Record<string, any>) {
  const partes: string[] = [];
  if (d.codigo) partes.push(d.codigo);
  if (d.monto) partes.push(`${d.moneda === 'ARS' ? '$' : d.moneda || ''} ${d.monto}`);
  if (d.despues) partes.push(Object.entries(d.despues).map(([k, v]) => `${k}: ${v}`).join(', '));
  if (d.nota) partes.push(`"${d.nota}"`);
  return partes.join(' · ');
}

export default function Seguridad() {
  const { salir } = useAuth();
  const nav = useNavigate();
  const [estado, setEstado] = useState<{ obligatoria: boolean; aal: string; verificados: number } | null>(null);
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [cambiando, setCambiando] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  useEffect(() => { api<typeof estado>('mfa-estado').then(setEstado).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    const t = setTimeout(() => { api<Registro[]>('admin-auditoria', { query: filtro ? { accion: filtro } : {} }).then(setRegistros).catch(e => setError(e.message)); }, 250);
    return () => clearTimeout(t);
  }, [filtro]);

  const cerrarSesiones = async () => {
    setCerrando(true);
    try { await api('sesiones-cerrar', { method: 'POST' }); } catch { /* igual salimos */ }
    salir(); nav('/entrar');
  };

  if (cambiando) return <Verificacion modo="enrolar" alTerminar={() => { setCambiando(false); api<typeof estado>('mfa-estado').then(setEstado); }} />;

  return (
    <div className="flex flex-col gap-6">
      <Error texto={error} />
      <div className="tarjeta p-5 flex flex-col gap-3">
        <h2 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-oro" /> Tu cuenta de administradora</h2>
        {!estado ? <Cargando /> : (
          <ul className="text-sm flex flex-col gap-1.5">
            <li>Verificación en dos pasos: <strong>{estado.verificados > 0 ? 'activada' : 'sin configurar'}</strong>{!estado.obligatoria && ' (la exigencia está apagada en la configuración)'}</li>
            <li>Esta sesión: <strong>{estado.aal === 'aal2' ? 'verificada con código' : 'solo con contraseña'}</strong></li>
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCambiando(true)} className="btn btn-borde !py-2 text-sm">Cambiar de celular o aplicación</button>
          <button onClick={cerrarSesiones} disabled={cerrando} className="btn btn-borde !py-2 text-sm">
            {cerrando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4" /> Cerrar sesión en todos mis dispositivos</>}
          </button>
        </div>
        <p className="text-xs text-gris">Si perdés el celular, cerrá las sesiones desde otro dispositivo y pedile a otra administradora que te ayude, o escribile a quien mantiene la plataforma.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-lg">Registro de actividad</h2>
          <input id="filtro-auditoria" className="campo !w-auto min-w-[220px]" placeholder="Filtrar (pago, rol, login...)" value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <p className="text-sm text-gris">Quién hizo cada cambio, desde dónde y cuándo. No se puede editar ni borrar desde la plataforma.</p>
        {!registros ? <Cargando /> : registros.length === 0 ? <p className="text-sm text-gris">Sin movimientos todavía.</p> : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gris border-b border-linea">
                <th className="px-4 py-3 font-semibold">Cuándo</th><th className="px-4 py-3 font-semibold">Quién</th><th className="px-4 py-3 font-semibold">Qué</th><th className="px-4 py-3 font-semibold">Sobre</th><th className="px-4 py-3 font-semibold">IP</th>
              </tr></thead>
              <tbody>
                {registros.map(r => (
                  <tr key={r.id} className="border-b border-linea last:border-0 align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gris">{new Date(r.creado).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 break-all">{r.actor_email || '—'}</td>
                    <td className="px-4 py-3">{nombreAccion(r.accion)}</td>
                    <td className="px-4 py-3 text-gris break-all">{[r.objetivo, resumen(r.detalle)].filter(Boolean).join(' · ')}</td>
                    <td className="px-4 py-3 text-gris whitespace-nowrap">{r.ip || '—'}</td>
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
