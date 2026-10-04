import { useEffect, useState } from 'react';

// Precio de la membresía. El de lista se muestra tachado como referencia del
// precio que tendrá después del lanzamiento.
export const PRECIO_USD = 39;
export const PRECIO_LISTA_USD = 59;
// El precio de lanzamiento vale para las primeras 100 miembros; después pasa al de lista
export const CUPO_LANZAMIENTO = 100;

export type Moneda = 'USD' | 'ARS' | 'EUR';
type Cotizacion = { ars: number | null; eur: number | null; actualizado: string | null };

const MONEDAS: Moneda[] = ['USD', 'ARS', 'EUR'];

// Moneda inicial: la que eligió antes, o la de su zona horaria (Argentina en pesos, Europa en euros)
function monedaInicial(): Moneda {
  try {
    const guardada = localStorage.getItem('moneda') as Moneda | null;
    if (guardada && MONEDAS.includes(guardada)) return guardada;
  } catch { /* sin almacenamiento */ }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  if (tz.startsWith('America/Argentina') || tz === 'America/Buenos_Aires') return 'ARS';
  if (tz.startsWith('Europe/')) return 'EUR';
  return 'USD';
}

const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

// La cotización la trae la API (dólar oficial y euro) y se refresca cada 30 minutos
// mientras la página está abierta. Si no llega, todo se muestra en dólares.
export function usePrecio() {
  const [elegida, setElegida] = useState<Moneda>(monedaInicial);
  const [cotiz, setCotiz] = useState<Cotizacion | null>(null);

  useEffect(() => {
    const cargar = () => fetch('/api/academia?action=cotizacion')
      .then(r => (r.ok ? r.json() : null)).then(d => d && setCotiz(d)).catch(() => {});
    cargar();
    const id = setInterval(cargar, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const tasa = elegida === 'ARS' ? cotiz?.ars : elegida === 'EUR' ? cotiz?.eur : 1;
  const moneda: Moneda = tasa ? elegida : 'USD';

  const fmt = (usd: number) => {
    if (moneda === 'USD' || !tasa) return `USD ${usd}`;
    const valor = usd * tasa;
    // Pesos redondeados a la centena; euros al entero
    return `${moneda} ${numero.format(moneda === 'ARS' ? Math.round(valor / 100) * 100 : Math.round(valor))}`;
  };

  const elegir = (m: Moneda) => {
    setElegida(m);
    try { localStorage.setItem('moneda', m); } catch { /* sin almacenamiento */ }
  };

  const nota = moneda === 'ARS'
    ? 'En Argentina pagás en pesos, al dólar oficial del día: con Mercado Pago o por transferencia.'
    : moneda === 'EUR'
      ? 'Valor aproximado en euros. Desde otros países pagás con tarjeta internacional o PayPal.'
      : 'En Argentina pagás en pesos con Mercado Pago o transferencia. Desde otros países, con tarjeta internacional o PayPal.';

  return { moneda, elegir, fmt, nota, disponible: !!cotiz };
}

export function SelectorMoneda({ moneda, elegir, oscuro = false }: { moneda: Moneda; elegir: (m: Moneda) => void; oscuro?: boolean }) {
  return (
    <div role="group" aria-label="Ver el precio en" className={`inline-flex rounded-full p-1 text-xs font-semibold ${oscuro ? 'bg-white/10' : 'bg-oro-suave'}`}>
      {MONEDAS.map(m => (
        <button key={m} type="button" onClick={() => elegir(m)} aria-pressed={moneda === m}
          className={`px-3 py-1 rounded-full transition-colors ${moneda === m ? 'bg-tinta text-crema' : oscuro ? 'text-crema/70 hover:text-crema' : 'text-gris hover:text-tinta'}`}>
          {m}
        </button>
      ))}
    </div>
  );
}
