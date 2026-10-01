// El símbolo del Eneagrama: círculo, triángulo 3-6-9 y héxada 1-4-2-8-5-7.
// Se usa como identidad visual de la academia.
export default function Eneagrama({ tam = 320, resaltar, onElegir }: { tam?: number; resaltar?: number; onElegir?: (tipo: number) => void }) {
  const r = 42;
  const pt = (k: number) => {
    const a = ((-90 + (k % 9) * 40) * Math.PI) / 180;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  };
  const linea = (ks: number[]) => ks.map(k => pt(k).join(',')).join(' ');
  return (
    <svg viewBox="0 0 100 100" width={tam} height={tam} className="max-w-full h-auto" aria-label="Símbolo del Eneagrama">
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth=".6" />
      <polygon points={linea([3, 6, 9])} fill="none" stroke="var(--color-oro)" strokeWidth=".7" />
      <polyline points={linea([1, 4, 2, 8, 5, 7, 1])} fill="none" stroke="currentColor" strokeOpacity=".55" strokeWidth=".6" />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => {
        const [x, y] = pt(k);
        const activo = resaltar === k;
        return (
          <g key={k}
            {...(onElegir ? {
              role: 'button', tabIndex: 0, 'aria-label': `Tipo ${k}`, 'aria-pressed': activo,
              style: { cursor: 'pointer' },
              onClick: () => onElegir(k),
              onKeyDown: (e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onElegir(k); } },
            } : {})}>
            {onElegir && <circle cx={x} cy={y} r="7" fill="transparent" />}
            <circle cx={x} cy={y} r={activo ? 4.4 : 3.6} fill={activo ? 'var(--color-oro)' : 'var(--color-crema)'} stroke="var(--color-oro)" strokeWidth=".6" />
            <text x={x} y={y + 1.35} textAnchor="middle" fontSize="3.8" fontWeight="700" fontFamily="Montserrat, sans-serif" fill={activo ? '#fff' : 'currentColor'}>{k}</text>
          </g>
        );
      })}
    </svg>
  );
}
