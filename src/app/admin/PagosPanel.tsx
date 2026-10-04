import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Campo, Cargando, Error, Modal, Vacio } from '../../components/ui';

type Pago = {
  id: string; usuario_id: string; metodo: 'mercadopago' | 'transferencia' | 'internacional'; monto: number; moneda: string; meses: number;
  estado: 'pendiente' | 'confirmado' | 'rechazado'; referencia: string | null; codigo: string | null; nota: string | null;
  creado: string; confirmado: string | null; datos: { nombre?: string; email?: string; profesion?: string; pais?: string };
  perfil: { nombre: string; email: string; profesion: string | null; pais: string | null; vence: string | null; estado: string } | null;
};

const METODO = { mercadopago: 'Mercado Pago', transferencia: 'Transferencia', internacional: 'Internacional (Western Union / PayPal)' } as const;
const dinero = (p: { moneda: string; monto: number }) => `${p.moneda === 'ARS' ? '$' : p.moneda} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(p.monto)}`;
const fecha = (s: string) => new Date(s).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

export default function PagosPanel() {
  const [lista, setLista] = useState<Pago[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [revisando, setRevisando] = useState<{ pago: Pago; accion: 'confirmar' | 'rechazar' } | null>(null);
  const [alta, setAlta] = useState(false);
  const cargar = useCallback(() => api<Pago[]>('admin-pagos').then(setLista).catch(e => setError(e.message)), []);
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!lista) return [];
    if (!t) return lista;
    return lista.filter(p => [p.codigo, p.perfil?.nombre, p.perfil?.email, p.referencia, p.datos?.email].some(v => v?.toLowerCase().includes(t)));
  }, [lista, q]);

  if (!lista) return error ? <Error texto={error} /> : <Cargando />;
  const pendientes = visibles.filter(p => p.estado === 'pendiente');
  const historial = visibles.filter(p => p.estado !== 'pendiente');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <label className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-gris absolute left-3 top-1/2 -translate-y-1/2" />
          <input id="buscar-pago" className="campo !pl-9" placeholder="Buscar por código, nombre o email" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <button onClick={() => setAlta(true)} className="btn btn-borde !py-2 text-sm"><Plus className="w-4 h-4" /> Alta manual</button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-lg">Para confirmar ({pendientes.length})</h2>
        <p className="text-sm text-gris">Cuando llega el comprobante por WhatsApp, buscá el código que trae el mensaje y verificá que el dinero haya entrado en la cuenta antes de confirmar.</p>
        <Error texto={error} />
        {pendientes.length === 0 ? <Vacio titulo="No hay pagos esperando." /> : pendientes.map(p => (
          <div key={p.id} className="tarjeta p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{p.perfil?.nombre || p.datos?.nombre} <span className="font-mono text-xs bg-oro-suave text-oro rounded px-1.5 py-0.5 ml-1">{p.codigo}</span></p>
                <p className="text-sm text-gris break-all">{p.perfil?.email || p.datos?.email}</p>
                <p className="text-sm text-gris">{[p.perfil?.profesion, p.perfil?.pais].filter(Boolean).join(' · ') || 'Sin profesión ni país'}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-extrabold text-xl tabular-nums">{dinero(p)}</p>
                <p className="text-sm text-gris">{p.meses} {p.meses === 1 ? 'mes' : 'meses'} · {METODO[p.metodo]}</p>
              </div>
            </div>
            <p className="text-xs text-gris">Avisó el {fecha(p.creado)}{p.referencia ? ` · Operación o MTCN: ${p.referencia}` : ''}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRevisando({ pago: p, accion: 'confirmar' })} className="btn btn-oscuro !py-2 !px-4 text-sm"><Check className="w-4 h-4" /> Confirmar y dar de alta</button>
              <button onClick={() => setRevisando({ pago: p, accion: 'rechazar' })} className="btn btn-borde !py-2 !px-4 text-sm"><X className="w-4 h-4" /> Rechazar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-lg">Historial</h2>
        {historial.length === 0 ? <Vacio titulo="Todavía no hay pagos revisados." /> : (
          <div className="tarjeta overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gris border-b border-linea">
                <th className="px-4 py-3 font-semibold">Código</th><th className="px-4 py-3 font-semibold">Persona</th><th className="px-4 py-3 font-semibold">Medio</th>
                <th className="px-4 py-3 font-semibold text-right">Monto</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Nota</th><th className="px-4 py-3 font-semibold">Fecha</th>
              </tr></thead>
              <tbody>
                {historial.map(p => (
                  <tr key={p.id} className="border-b border-linea last:border-0 align-top">
                    <td className="px-4 py-3 font-mono text-xs">{p.codigo || '—'}</td>
                    <td className="px-4 py-3">{p.perfil?.nombre}<p className="text-xs text-gris">{p.perfil?.email}</p></td>
                    <td className="px-4 py-3">{METODO[p.metodo].split(' (')[0]}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">{dinero(p)}</td>
                    <td className="px-4 py-3">{p.estado === 'confirmado' ? 'Confirmado' : 'Rechazado'}</td>
                    <td className="px-4 py-3 text-gris max-w-[220px]">{p.nota || ''}</td>
                    <td className="px-4 py-3 text-gris whitespace-nowrap">{fecha(p.creado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revisando && <Revisar {...revisando} alCerrar={() => setRevisando(null)} alTerminar={() => { setRevisando(null); cargar(); }} />}
      {alta && <AltaManual alCerrar={() => setAlta(false)} alTerminar={() => { setAlta(false); cargar(); }} />}
    </div>
  );
}

function Revisar({ pago, accion, alCerrar, alTerminar }: { pago: Pago; accion: 'confirmar' | 'rechazar'; alCerrar: () => void; alTerminar: () => void }) {
  const [nota, setNota] = useState('');
  const [verificado, setVerificado] = useState(false);
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const confirmar = accion === 'confirmar';
  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTrabajando(true); setError('');
    try { await api('admin-pago', { method: 'PUT', body: { id: pago.id, accion, nota } }); alTerminar(); }
    catch (e: any) { setError(e.message); setTrabajando(false); }
  };
  return (
    <Modal titulo={confirmar ? 'Confirmar pago y dar de alta' : 'Rechazar pago'} onCerrar={alCerrar}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <div className="text-sm bg-crema rounded-xl p-3 flex flex-col gap-0.5">
          <p><strong>{pago.perfil?.nombre || pago.datos?.nombre}</strong> · {pago.perfil?.email || pago.datos?.email}</p>
          <p className="text-gris">{dinero(pago)} · {pago.meses} {pago.meses === 1 ? 'mes' : 'meses'} · código {pago.codigo}{pago.referencia ? ` · ${pago.referencia}` : ''}</p>
        </div>
        {confirmar && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" id="verificado" checked={verificado} onChange={e => setVerificado(e.target.checked)} className="mt-1" />
            <span>Verifiqué que el dinero ya entró en la cuenta y coincide con el monto.</span>
          </label>
        )}
        <Campo label={confirmar ? 'Nota (opcional)' : 'Motivo del rechazo'} ayuda={confirmar ? undefined : 'Queda registrado. Es obligatorio.'}>
          <input id="nota-pago" className="campo" value={nota} onChange={e => setNota(e.target.value)} maxLength={300} required={!confirmar} />
        </Campo>
        <Error texto={error} />
        <button disabled={trabajando || (confirmar && !verificado)} className={`btn ${confirmar ? 'btn-oscuro' : 'btn-borde'} w-full`}>
          {trabajando ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmar ? 'Confirmar y activar' : 'Rechazar pago'}
        </button>
      </form>
    </Modal>
  );
}

function AltaManual({ alCerrar, alTerminar }: { alCerrar: () => void; alTerminar: () => void }) {
  const [f, setF] = useState({ email: '', monto: '', moneda: 'ARS', meses: '1', nota: '' });
  const [error, setError] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const enviar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTrabajando(true); setError('');
    try { await api('admin-alta', { method: 'POST', body: { ...f, monto: Number(f.monto), meses: Number(f.meses) } }); alTerminar(); }
    catch (e: any) { setError(e.message); setTrabajando(false); }
  };
  return (
    <Modal titulo="Alta manual" onCerrar={alCerrar}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <p className="text-sm text-gris">Para registrar un pago que no pasó por el aviso de la plataforma. La persona ya tiene que haberse registrado.</p>
        <Campo label="Email con el que se registró"><input id="alta-email" type="email" className="campo" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Monto"><input id="alta-monto" type="number" min="0" step="any" className="campo" value={f.monto} onChange={e => setF({ ...f, monto: e.target.value })} required /></Campo>
          <Campo label="Moneda"><select id="alta-moneda" className="campo" value={f.moneda} onChange={e => setF({ ...f, moneda: e.target.value })}><option>ARS</option><option>USD</option></select></Campo>
          <Campo label="Meses"><select id="alta-meses" className="campo" value={f.meses} onChange={e => setF({ ...f, meses: e.target.value })}>{['1', '3', '6', '12'].map(m => <option key={m}>{m}</option>)}</select></Campo>
        </div>
        <Campo label="Motivo" ayuda="Queda registrado. Por ejemplo: pagó en efectivo, regalo, beca."><input id="alta-nota" className="campo" value={f.nota} onChange={e => setF({ ...f, nota: e.target.value })} maxLength={300} required /></Campo>
        <Error texto={error} />
        <button disabled={trabajando} className="btn btn-oscuro w-full">{trabajando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dar de alta'}</button>
      </form>
    </Modal>
  );
}
