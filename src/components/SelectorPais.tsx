// Selector de país: Argentina y los países de habla hispana más frecuentes arriba,
// el resto del mundo en orden alfabético. Los nombres salen del navegador, en español.
const FRECUENTES = ['AR', 'UY', 'CL', 'MX', 'CO', 'PE', 'ES', 'EC', 'PY', 'BO', 'VE', 'US'];

const TODOS = [
  'AD', 'AE', 'AL', 'AM', 'AO', 'AT', 'AU', 'AZ', 'BA', 'BE', 'BG', 'BR', 'BY', 'CA', 'CH', 'CN', 'CR', 'CU', 'CY', 'CZ', 'DE', 'DK',
  'DO', 'DZ', 'EE', 'EG', 'FI', 'FR', 'GB', 'GE', 'GR', 'GT', 'HK', 'HN', 'HR', 'HU', 'IE', 'IL', 'IN', 'IS', 'IT', 'JP', 'KR', 'LB',
  'LI', 'LT', 'LU', 'LV', 'MA', 'MC', 'MD', 'ME', 'MK', 'MT', 'NI', 'NL', 'NO', 'NZ', 'PA', 'PL', 'PR', 'PT', 'QA', 'RO', 'RS', 'RU',
  'SA', 'SE', 'SG', 'SI', 'SK', 'SV', 'TR', 'UA', 'ZA',
];

function nombres() {
  let dn: Intl.DisplayNames | null = null;
  try { dn = new Intl.DisplayNames(['es'], { type: 'region' }); } catch { /* navegador viejo */ }
  const de = (c: string) => dn?.of(c) || c;
  const frecuentes = FRECUENTES.map(de);
  const resto = TODOS.filter(c => !FRECUENTES.includes(c)).map(de).sort((a, b) => a.localeCompare(b, 'es'));
  return { frecuentes, resto };
}

const { frecuentes, resto } = nombres();

export default function SelectorPais({ id, valor, onChange, requerido = false }: { id: string; valor: string; onChange: (v: string) => void; requerido?: boolean }) {
  // Si la persona ya había escrito un país a mano que no está en la lista, se conserva
  const extra = valor && !frecuentes.includes(valor) && !resto.includes(valor) ? valor : null;
  return (
    <select id={id} className="campo" value={valor} onChange={e => onChange(e.target.value)} required={requerido} autoComplete="country-name">
      <option value="">Elegí</option>
      {extra && <option value={extra}>{extra}</option>}
      <optgroup label="Más frecuentes">{frecuentes.map(p => <option key={p} value={p}>{p}</option>)}</optgroup>
      <optgroup label="Otros países">
        {resto.map(p => <option key={p} value={p}>{p}</option>)}
        <option value="Otro">Otro</option>
      </optgroup>
    </select>
  );
}
