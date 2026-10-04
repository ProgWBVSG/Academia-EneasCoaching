import { useEffect, useState } from 'react';
import { Lock, Loader2, Copy, Check, CreditCard, Landmark, Globe, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Error } from '../components/ui';
import { IconoWhatsApp } from '../pages/Landing';

// Pantalla para activar o renovar la membresía.
// Argentina: débito automático con Mercado Pago o transferencia (sin comisión, se confirma a mano).
// Exterior: tarjeta internacional o PayPal (Lemon Squeezy), en dólares.

type Opciones = {
  usd: number; ars: number | null; mp: boolean; internacional: boolean; internacionalManual: { paypal?: string; instrucciones?: string } | null;
  transferencia: { alias?: string; cbu?: string; titular?: string; banco?: string; cuit?: string } | null;
  metodo: string | null; vence: string | null;
  pendiente: { meses: number; monto: number; moneda: string; creado: string } | null;
};

const WHATSAPP = (texto: string) => 'https://wa.me/5493515632496?text=' + encodeURIComponent(texto);
const pesos = (n: number) => `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`;
const enArgentina = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  return tz.startsWith('America/Argentina') || tz === 'America/Buenos_Aires';
};

function Copiar({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [ok, setOk] = useState(false);
  const copiar = () => {
    navigator.clipboard?.writeText(valor).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }).catch(() => {});
  };
  return (
    <button type="button" onClick={copiar} className="w-full flex items-center justify-center gap-2 rounded-xl border border-linea bg-crema px-4 py-2.5 text-sm hover:border-oro">
      <span className="text-gris">{etiqueta}:</span> <span className="font-semibold break-all">{valor}</span>
      {ok ? <Check className="w-4 h-4 text-oro shrink-0" /> : <Copy className="w-4 h-4 text-gris shrink-0" />}
    </button>
  );
}

export default function Membresia({ renovar = false }: { renovar?: boolean }) {
  const { perfil } = useAuth();
  const [op, setOp] = useState<Opciones | null>(null);
  const [desde, setDesde] = useState<'ar' | 'ext'>(perfil?.pais ? (perfil.pais === 'Argentina' ? 'ar' : 'ext') : enArgentina() ? 'ar' : 'ext');
  const [metodo, setMetodo] = useState<'mp' | 'transferencia'>('mp');
  const [meses, setMeses] = useState<1 | 3>(1);
  const [referencia, setReferencia] = useState('');
  const [cargando, setCargando] = useState('');
  const [error, setError] = useState('');
  const [avisado, setAvisado] = useState<'ARS' | 'USD' | null>(null);

  useEffect(() => {
    api<Opciones>('pago-opciones').then(o => {
      setOp(o);
      if (o.pendiente) setAvisado(o.pendiente.moneda === 'USD' ? 'USD' : 'ARS');
      if (o.metodo === 'transferencia') setMetodo('transferencia');
      if (!o.mp && o.transferencia) setMetodo('transferencia');
    }).catch(e => setError(e.message));
  }, []);

  const ir = async (accion: 'suscribirme' | 'checkout-internacional') => {
    setCargando(accion); setError('');
    try {
      const { url } = await api<{ url: string }>(accion, { method: 'POST' });
      window.location.href = url;
    } catch (e: any) { setError(e.message); setCargando(''); }
  };

  const avisar = async (via: 'local' | 'internacional' = 'local') => {
    setCargando(via === 'internacional' ? 'intl-aviso' : 'transferencia'); setError('');
    try {
      await api('transferencia-aviso', { method: 'POST', body: { meses, referencia, via } });
      setAvisado(via === 'internacional' ? 'USD' : 'ARS');
    } catch (e: any) { setError(e.message); }
    setCargando('');
  };

  const pausada = perfil?.estado === 'vencida';
  const titulo = renovar ? 'Renovar tu membresía' : pausada ? 'Tu membresía está pausada' : `Hola ${perfil?.nombre.split(' ')[0]}, falta un paso`;
  const bajada = renovar
    ? 'Elegí cómo seguir. Tu progreso y tus puntos quedan guardados.'
    : pausada
      ? 'Reactivala para volver a entrar a los cursos, los vivos y la comunidad. Tu progreso y tus puntos quedan guardados.'
      : 'Tu cuenta está creada. Activá la membresía para entrar a los cursos, los vivos y la comunidad.';

  return (
    <div className="max-w-xl mx-auto py-8 flex flex-col items-center text-center gap-5">
      <span className="w-14 h-14 rounded-2xl bg-oro-suave text-oro flex items-center justify-center"><Lock className="w-6 h-6" /></span>
      <h1 className="text-2xl font-extrabold">{titulo}</h1>
      <p className="text-gris">{bajada}</p>

      {!op ? (error ? <Error texto={error} /> : <Loader2 className="w-6 h-6 animate-spin text-gris" />) : (
        <>
          <div role="group" aria-label="Desde dónde pagás" className="inline-flex rounded-full p-1 bg-oro-suave text-sm font-semibold">
            {([['ar', 'Pago desde Argentina'], ['ext', 'Pago desde otro país']] as const).map(([k, t]) => (
              <button key={k} type="button" onClick={() => setDesde(k)} aria-pressed={desde === k}
                className={`px-4 py-2 rounded-full transition-colors ${desde === k ? 'bg-tinta text-crema' : 'text-gris hover:text-tinta'}`}>{t}</button>
            ))}
          </div>

          {desde === 'ar' ? (
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col items-center gap-1">
                <p className="font-display font-extrabold text-4xl tabular-nums">{op.ars ? pesos(op.ars) : `USD ${op.usd}`}</p>
                <p className="text-gris text-sm">por mes · USD {op.usd} al dólar oficial de hoy</p>
              </div>

              {op.mp && (
                <button type="button" onClick={() => setMetodo('mp')} aria-pressed={metodo === 'mp'}
                  className={`tarjeta p-5 flex flex-col items-center gap-2 text-center transition-colors ${metodo === 'mp' ? '!border-oro ring-1 ring-oro' : ''}`}>
                  <CreditCard className="w-6 h-6 text-oro" />
                  <span className="font-bold">Débito automático con Mercado Pago</span>
                  <span className="text-sm text-gris">Tarjeta de crédito, débito o dinero en tu cuenta. Se cobra solo cada mes y lo cancelás cuando quieras.</span>
                </button>
              )}
              {op.transferencia && (
                <button type="button" onClick={() => setMetodo('transferencia')} aria-pressed={metodo === 'transferencia'}
                  className={`tarjeta p-5 flex flex-col items-center gap-2 text-center transition-colors ${metodo === 'transferencia' ? '!border-oro ring-1 ring-oro' : ''}`}>
                  <Landmark className="w-6 h-6 text-oro" />
                  <span className="font-bold">Transferencia bancaria</span>
                  <span className="text-sm text-gris">Desde cualquier banco o billetera. Pagás uno o tres meses y te activamos apenas lo confirmamos.</span>
                </button>
              )}

              <Error texto={error} />

              {metodo === 'mp' && op.mp && (
                <button onClick={() => ir('suscribirme')} disabled={!!cargando} className="btn btn-oro btn-grande w-full">
                  {cargando === 'suscribirme' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar con Mercado Pago'}
                </button>
              )}

              {metodo === 'transferencia' && op.transferencia && (
                avisado === 'ARS' ? (
                  <div className="tarjeta p-5 flex flex-col items-center gap-3">
                    <Check className="w-7 h-7 text-oro" />
                    <p className="font-bold">¡Gracias! Recibimos tu aviso.</p>
                    <p className="text-sm text-gris">Te activamos en cuanto confirmemos la transferencia. Si querés que sea más rápido, mandanos el comprobante por WhatsApp.</p>
                    <a href={WHATSAPP(`Hola! Hice la transferencia para la Academia. Soy ${perfil?.nombre} (${perfil?.email}). Te mando el comprobante.`)}
                      target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full"><IconoWhatsApp className="w-5 h-5" /> Enviar comprobante</a>
                  </div>
                ) : (
                  <div className="tarjeta p-5 flex flex-col items-center gap-4">
                    <div role="group" aria-label="Meses" className="inline-flex rounded-full p-1 bg-oro-suave text-sm font-semibold">
                      {([1, 3] as const).map(n => (
                        <button key={n} type="button" onClick={() => setMeses(n)} aria-pressed={meses === n}
                          className={`px-4 py-1.5 rounded-full ${meses === n ? 'bg-tinta text-crema' : 'text-gris'}`}>{n === 1 ? '1 mes' : '3 meses'}</button>
                      ))}
                    </div>
                    <p className="text-sm">Transferí <strong className="tabular-nums">{op.ars ? pesos(op.ars * meses) : ''}</strong> a:</p>
                    <div className="w-full flex flex-col gap-2">
                      {op.transferencia.alias && <Copiar etiqueta="Alias" valor={op.transferencia.alias} />}
                      {op.transferencia.cbu && <Copiar etiqueta="CBU/CVU" valor={op.transferencia.cbu} />}
                      {op.transferencia.titular && <p className="text-sm text-gris">Titular: {op.transferencia.titular}{op.transferencia.cuit ? ` · CUIL/CUIT ${op.transferencia.cuit}` : ''}{op.transferencia.banco ? ` · ${op.transferencia.banco}` : ''}</p>}
                    </div>
                    <label className="w-full flex flex-col gap-1.5 text-sm">
                      <span className="text-gris">Número de operación (opcional, ayuda a confirmarla más rápido)</span>
                      <input id="ref-transferencia" className="campo text-center" value={referencia} onChange={e => setReferencia(e.target.value)} maxLength={80} />
                    </label>
                    <button onClick={() => avisar()} disabled={!!cargando} className="btn btn-oro btn-grande w-full">
                      {cargando === 'transferencia' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya transferí'}
                    </button>
                  </div>
                )
              )}

              {!op.mp && !op.transferencia && (
                <a href={WHATSAPP('Hola Cecilia! Me registré en la Academia y quiero activar mi membresía.')} target="_blank" rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-grande w-full"><IconoWhatsApp className="w-5 h-5" /> Activar por WhatsApp</a>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="flex flex-col items-center gap-1">
                <p className="font-display font-extrabold text-4xl tabular-nums">USD {op.usd}</p>
                <p className="text-gris text-sm">por mes</p>
              </div>
              <div className="tarjeta p-5 flex flex-col items-center gap-2 text-center">
                <Globe className="w-6 h-6 text-oro" />
                <span className="font-bold">{op.internacional ? 'Tarjeta internacional o PayPal' : 'Pago desde el exterior'}</span>
                <span className="text-sm text-gris">
                  {op.internacional
                    ? 'Pagás en dólares desde cualquier país. Se cobra solo cada mes y lo cancelás cuando quieras. Los impuestos de tu país, si corresponden, se calculan en el pago.'
                    : 'Pagás en dólares por PayPal o transferencia internacional, por 1 o 3 meses. Te activamos apenas confirmamos el pago.'}
                </span>
              </div>
              <Error texto={error} />
              {op.internacional ? (
                <button onClick={() => ir('checkout-internacional')} disabled={!!cargando} className="btn btn-oro btn-grande w-full">
                  {cargando === 'checkout-internacional' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pagar con tarjeta o PayPal'}
                </button>
              ) : op.internacionalManual ? (
                avisado === 'USD' ? (
                  <div className="tarjeta p-5 flex flex-col items-center gap-3">
                    <Check className="w-7 h-7 text-oro" />
                    <p className="font-bold">¡Gracias! Recibimos tu aviso.</p>
                    <p className="text-sm text-gris">Te activamos en cuanto confirmemos el pago. Si querés que sea más rápido, mandanos el comprobante por WhatsApp.</p>
                    <a href={WHATSAPP(`Hola! Hice el pago internacional de la Academia. Soy ${perfil?.nombre} (${perfil?.email}). Te mando el comprobante.`)}
                      target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full"><IconoWhatsApp className="w-5 h-5" /> Enviar comprobante</a>
                  </div>
                ) : (
                  <div className="tarjeta p-5 flex flex-col items-center gap-4">
                    <div role="group" aria-label="Meses" className="inline-flex rounded-full p-1 bg-oro-suave text-sm font-semibold">
                      {([1, 3] as const).map(n => (
                        <button key={n} type="button" onClick={() => setMeses(n)} aria-pressed={meses === n}
                          className={`px-4 py-1.5 rounded-full ${meses === n ? 'bg-tinta text-crema' : 'text-gris'}`}>{n === 1 ? '1 mes' : '3 meses'}</button>
                      ))}
                    </div>
                    <p className="text-sm">Pagá <strong className="tabular-nums">USD {op.usd * meses}</strong>{op.internacionalManual.paypal ? ' con PayPal:' : ':'}</p>
                    {op.internacionalManual.paypal && (
                      <a href={op.internacionalManual.paypal} target="_blank" rel="noopener noreferrer" className="btn btn-oro btn-grande w-full">Pagar con PayPal</a>
                    )}
                    {op.internacionalManual.instrucciones && (
                      <p className="text-sm text-gris whitespace-pre-line">{op.internacionalManual.instrucciones}</p>
                    )}
                    <label className="w-full flex flex-col gap-1.5 text-sm">
                      <span className="text-gris">Número de operación (opcional, ayuda a confirmarlo más rápido)</span>
                      <input id="ref-internacional" className="campo text-center" value={referencia} onChange={e => setReferencia(e.target.value)} maxLength={80} />
                    </label>
                    <button onClick={() => avisar('internacional')} disabled={!!cargando} className="btn btn-oscuro btn-grande w-full">
                      {cargando === 'intl-aviso' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya pagué'}
                    </button>
                  </div>
                )
              ) : (
                <a href={WHATSAPP('Hola Cecilia! Me registré en la Academia desde otro país y quiero activar mi membresía.')} target="_blank" rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-grande w-full"><IconoWhatsApp className="w-5 h-5" /> Activar por WhatsApp</a>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 text-sm text-gris pt-1">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-oro" /> Pago seguro. Cancelás cuando quieras.</span>
            <a href={WHATSAPP('Hola! Tengo una consulta sobre cómo pagar la Academia.')} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-oro">¿Dudas con el pago? Escribinos por WhatsApp</a>
          </div>
        </>
      )}
    </div>
  );
}
