// Cliente de la API con manejo de sesión. La sesión (tokens de Supabase) se
// guarda en localStorage y se renueva sola cuando está por vencer.

export interface Sesion { access_token: string; refresh_token: string; expires_at: number }

const CLAVE = 'academia_sesion';

export function leerSesion(): Sesion | null {
  try { return JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}
export function guardarSesion(s: Sesion | null) {
  try { s ? localStorage.setItem(CLAVE, JSON.stringify(s)) : localStorage.removeItem(CLAVE); } catch { /* sin storage */ }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public datos?: any) { super(message); }
}

let refrescando: Promise<Sesion | null> | null = null;

async function sesionVigente(): Promise<Sesion | null> {
  const s = leerSesion();
  if (!s) return null;
  // Renovamos si faltan menos de 2 minutos para que venza
  if (s.expires_at * 1000 - Date.now() > 120_000) return s;
  if (!refrescando) {
    refrescando = fetch('/api/academia?action=refrescar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    }).then(async r => {
      if (!r.ok) { guardarSesion(null); return null; }
      const { sesion } = await r.json();
      guardarSesion(sesion);
      return sesion as Sesion;
    }).finally(() => { refrescando = null; });
  }
  return refrescando;
}

export async function api<T = any>(action: string, opts: { method?: string; body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const s = await sesionVigente();
  const qs = new URLSearchParams({ action, ...(opts.query || {}) }).toString();
  const r = await fetch(`/api/academia?${qs}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(s ? { Authorization: `Bearer ${s.access_token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) guardarSesion(null);
    throw new ApiError(data.error || 'Algo salió mal. Probá de nuevo.', r.status, data);
  }
  return data as T;
}
