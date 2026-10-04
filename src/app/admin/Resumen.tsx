import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Cargando, Error } from '../../components/ui';

type Datos = {
  activas: number; total: number; nuevas: number; pendientes: number; porVencer: number;
  ingresos: Record<string, number>; cupoRestante: number;
};

const dinero = (moneda: string, n: number) => `${moneda === 'ARS' ? '$' : moneda} ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`;

function Dato({ cifra, texto, destacado, onClick }: { cifra: string; texto: string; destacado?: boolean; onClick?: () => void }) {
  const base = `tarjeta p-5 flex flex-col items-center text-center gap-1 ${destacado ? '!border-oro bg-oro-suave' : ''}`;
  const contenido = <><span className="font-display font-extrabold text-3xl tabular-nums">{cifra}</span><span className="text-sm text-gris">{texto}</span></>;
  return onClick
    ? <button type="button" onClick={onClick} className={`${base} hover:border-oro transition-colors`}>{contenido}</button>
    : <div className={base}>{contenido}</div>;
}

export default function Resumen({ onIr }: { onIr: (tab: 'pagos' | 'miembros') => void }) {
  const [d, setD] = useState<Datos | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<Datos>('admin-resumen').then(setD).catch(e => setError(e.message)); }, []);
  if (error) return <Error texto={error} />;
  if (!d) return <Cargando />;
  const ingresos = Object.entries(d.ingresos);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Dato cifra={String(d.pendientes)} texto="Pagos para confirmar" destacado={d.pendientes > 0} onClick={() => onIr('pagos')} />
        <Dato cifra={String(d.activas)} texto="Miembros activas" onClick={() => onIr('miembros')} />
        <Dato cifra={String(d.porVencer)} texto="Vencen en 7 días" onClick={() => onIr('miembros')} />
        <Dato cifra={String(d.nuevas)} texto="Registros nuevos esta semana" />
        <Dato cifra={String(d.cupoRestante)} texto="Lugares de lanzamiento (USD 39)" />
        <Dato cifra={ingresos.length ? ingresos.map(([m, n]) => dinero(m, n)).join(' + ') : '$ 0'} texto="Cobrado este mes" />
      </div>
      <p className="text-sm text-gris text-center">{d.total} cuentas registradas en total. Los cobros incluyen los pagos confirmados por transferencia, internacional y altas manuales.</p>
    </div>
  );
}
