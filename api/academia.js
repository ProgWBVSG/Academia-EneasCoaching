// API de la Academia Eneascoaching. Una sola función serverless con acciones
// (?action=...), igual que la web principal. Toda la base se toca con la clave
// de servicio desde acá; el navegador nunca habla directo con Supabase.
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';

const env = (k) => (process.env[k] || '').replace(/^﻿/, '').trim();

const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});
// Cliente descartable para iniciar sesión: si usáramos el principal, quedaría
// con la sesión del usuario y las consultas dejarían de ir con la clave de servicio.
const clienteAuth = () => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Niveles ───────────────────────────────────────────────────────────
export const NIVELES = [
  { n: 1, nombre: 'Curiosidad', desde: 0 },
  { n: 2, nombre: 'Exploración', desde: 15 },
  { n: 3, nombre: 'Práctica', desde: 50 },
  { n: 4, nombre: 'Integración', desde: 120 },
  { n: 5, nombre: 'Facilitación', desde: 250 },
  { n: 6, nombre: 'Profundidad', desde: 450 },
  { n: 7, nombre: 'Maestría', desde: 700 },
  { n: 8, nombre: 'Referencia', desde: 1000 },
  { n: 9, nombre: 'Sabiduría', desde: 1400 },
];
const nivelDe = (puntos) => [...NIVELES].reverse().find(l => puntos >= l.desde) || NIVELES[0];

const PUNTOS = { post: 3, comentario: 1, like_recibido: 1, leccion: 2, laboratorio: 3 };
const sumarPuntos = (uid, n) => sb.rpc('academia_sumar_puntos', { uid, n });

const adminEmails = () => env('ACADEMIA_ADMIN_EMAILS').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

// ── Sesión ────────────────────────────────────────────────────────────
function sesionPublica(s) {
  return { access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at };
}

async function asegurarPerfil(user, extra = {}) {
  const email = (user.email || '').toLowerCase();
  const esAdmin = adminEmails().includes(email);
  let { data: perfil } = await sb.from('academia_perfiles').select('*').eq('id', user.id).maybeSingle();
  if (!perfil) {
    const { data } = await sb.from('academia_perfiles').insert({
      id: user.id, email,
      nombre: extra.nombre || user.user_metadata?.nombre || email.split('@')[0],
      profesion: extra.profesion || null,
      pais: extra.pais || null,
      rol: esAdmin ? 'admin' : 'miembro',
      estado: esAdmin ? 'activa' : 'pendiente',
    }).select('*').single();
    perfil = data;
  } else if (esAdmin && (perfil.rol !== 'admin' || perfil.estado !== 'activa')) {
    const { data } = await sb.from('academia_perfiles').update({ rol: 'admin', estado: 'activa' }).eq('id', user.id).select('*').single();
    perfil = data;
  }
  return perfil;
}

async function usuarioDe(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const perfil = await asegurarPerfil(data.user);
  const gracia = 3 * 24 * 60 * 60 * 1000;
  if (perfil?.estado === 'activa' && perfil.rol !== 'admin' && ['transferencia', 'manual'].includes(perfil.metodo_pago)
    && perfil.vence && new Date(perfil.vence).getTime() + gracia < Date.now()) {
    const { data: vencido } = await sb.from('academia_perfiles').update({ estado: 'vencida' }).eq('id', perfil.id).select('*').single();
    return vencido;
  }
  return perfil;
}

async function onboardingDe(perfil) {
  const uid = perfil.id;
  const [pres, prog, lab] = await Promise.all([
    sb.from('academia_posts').select('id', { count: 'exact', head: true }).eq('autor_id', uid).eq('categoria', 'presentaciones'),
    sb.from('academia_progreso').select('leccion_id', { count: 'exact', head: true }).eq('usuario_id', uid),
    sb.from('academia_lab_sesiones').select('id', { count: 'exact', head: true }).eq('usuario_id', uid),
  ]);
  return {
    perfil: Boolean(perfil.profesion && perfil.pais),
    presentacion: (pres.count || 0) > 0,
    leccion: (prog.count || 0) > 0,
    laboratorio: (lab.count || 0) > 0,
    vivo: Boolean(perfil.onboarding?.vivo),
  };
}

// ── Laboratorio de práctica con IA ────────────────────────────────────
// Rasgos de cada eneatipo tal como se presentan en una sesión. Sirven para que
// el cliente simulado sea coherente sin nombrar nunca el tipo.
const TIPOS = {
  1: 'Busca hacer las cosas bien y se exige mucho. Miedo de fondo: ser incorrecto o defectuoso. En sesión se nota en el "debería", la autocrítica, la irritación contenida que no admite como enojo, y en corregir detalles de lo que dice el coach.',
  2: 'Se define por ayudar y ser necesario. Miedo de fondo: no ser querido por lo que es. En sesión habla más de los demás que de sí, minimiza sus necesidades, busca agradar al coach y se resiente en silencio cuando no le agradecen.',
  3: 'Orientado a logros e imagen. Miedo de fondo: no valer sin sus resultados. En sesión presenta todo en términos de metas y eficiencia, esquiva lo emocional, quiere soluciones rápidas y le cuesta decir cómo se siente de verdad.',
  4: 'Busca autenticidad y sentido. Miedo de fondo: no tener identidad ni importancia. En sesión se compara con otros, siente que algo le falta, habla con intensidad emocional y rechaza respuestas que suenan genéricas.',
  5: 'Observa y analiza antes de involucrarse. Miedo de fondo: ser invadido o incapaz. En sesión es reservado, pide información, racionaliza lo emocional, responde breve y necesita tiempo antes de abrirse.',
  6: 'Busca seguridad y apoyo. Miedo de fondo: quedar sin sostén. En sesión duda, anticipa riesgos, pregunta "¿y si sale mal?", alterna entre confiar y desconfiar del coach, y consulta mucho antes de decidir.',
  7: 'Busca experiencias y opciones. Miedo de fondo: quedar atrapado en el dolor. En sesión salta de tema, reencuadra lo negativo en positivo, tiene muchos proyectos y se aburre si la conversación se pone pesada.',
  8: 'Busca control y protegerse. Miedo de fondo: ser dañado o controlado. En sesión es directo y frontal, pone a prueba al coach, niega la vulnerabilidad y se enoja rápido cuando siente que lo manipulan.',
  9: 'Busca paz y evitar el conflicto. Miedo de fondo: la desconexión y la pelea. En sesión es amable, dice "está bien" a todo, le cuesta decir qué quiere, se dispersa en detalles y posterga decisiones.',
};
const ESCENARIOS = [
  'Está pensando en dejar su trabajo pero no se decide.',
  'Tiene un conflicto con una socia o un socio en su emprendimiento.',
  'Siente que está estancada en su carrera hace tiempo.',
  'Asumió un puesto de liderazgo y el equipo no le responde como esperaba.',
  'Terminó una relación de pareja larga y no sabe cómo seguir.',
  'Está desbordada con demasiadas responsabilidades y no sabe decir que no.',
  'Tiene una relación tensa con su madre o su padre que le afecta.',
  'Quiere lanzar un proyecto propio y lo viene postergando.',
];
const ABRE_COACH = 'Hola, bienvenida. Contame, ¿qué te trae hoy?';
const MAX_TURNOS_COACH = 25;

const modeloIA = () => env('ACADEMIA_IA_MODEL') || 'claude-opus-5';

async function llamarClaude({ system, messages, effort, maxTokens }) {
  const key = env('ANTHROPIC_API_KEY');
  if (!key) {
    const err = new Error('El laboratorio todavía no está activado. Falta configurar la clave de IA.');
    err.status = 503;
    throw err;
  }
  const client = new Anthropic({ apiKey: key });
  const model = modeloIA();
  // Los modelos Opus 5 y Fable pueden declinar un pedido por clasificadores de
  // seguridad; con fallbacks "default" la API lo reintenta en otro modelo.
  const conRespaldo = /^claude-(opus-5|fable)/.test(model);
  const params = {
    model,
    max_tokens: maxTokens,
    system,
    messages,
    output_config: { effort },
  };
  const response = conRespaldo
    ? await client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : await client.messages.create(params);

  if (response.stop_reason === 'refusal') {
    const err = new Error('La IA no pudo continuar con este mensaje. Probá reformularlo.');
    err.status = 422;
    throw err;
  }
  return response.content.filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

function systemCliente(sesion) {
  return `Estás en un ejercicio de práctica para profesionales que se forman en Eneagrama. Hacés de cliente en una primera sesión de coaching. La persona que te escribe es la coach.

Tu personaje: ${TIPOS[sesion.eneatipo]}
Motivo de consulta: ${sesion.escenario}

Cómo actuar:
- Hablá en primera persona, en español rioplatense (voseo), como una persona real, no como un caso de manual.
- Nunca nombres el Eneagrama, un número de tipo ni términos técnicos. Si la coach te pregunta tu tipo, decí que no sabés de eso.
- Mostrá los rasgos de tu personaje en cómo contás las cosas, qué evitás y cómo reaccionás, no describiéndolos.
- Respondé entre 1 y 4 oraciones. Abrite más cuando la coach haga buenas preguntas o te refleje algo con precisión, y cerrate un poco si te juzga, te da consejos apurados o te interroga.
- Inventá detalles concretos de tu vida (nombres, lugares, situaciones) y mantenelos coherentes.`;
}

// ── Mercado Pago (suscripción mensual) ────────────────────────────────
async function mp(path, opts = {}) {
  const r = await fetch(`https://api.mercadopago.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${env('MP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.message || 'Error de Mercado Pago'); e.status = 502; throw e; }
  return data;
}

// ── Pagos ─────────────────────────────────────────────────────────────
// Argentina: Mercado Pago (débito automático en pesos) o transferencia (sin comisión, se confirma a mano).
// Exterior: Lemon Squeezy, que cobra en dólares y se encarga de los impuestos de cada país.
const CUPO_LANZAMIENTO = 100;
const sumarMeses = (desde, meses) => { const d = new Date(desde); d.setMonth(d.getMonth() + meses); return d.toISOString(); };

// Precio en dólares de cada miembro: quien entra entre las primeras 100 mantiene USD 39
async function precioUsdDe(perfil) {
  if (perfil?.precio_usd) return perfil.precio_usd;
  const { count } = await sb.from('academia_perfiles').select('id', { count: 'exact', head: true }).eq('estado', 'activa').eq('rol', 'miembro');
  return (count || 0) < CUPO_LANZAMIENTO ? 39 : 59;
}

// Pesos al dólar oficial del día, redondeados a la centena. Sin cotización, usa ACADEMIA_PRECIO_ARS.
async function precioArs(usd) {
  const { ars } = await cotizaciones();
  if (ars) return Math.round((usd * ars) / 100) * 100;
  return Number(env('ACADEMIA_PRECIO_ARS')) || null;
}

const checkoutInternacional = (usd) => env(`LS_CHECKOUT_URL_${usd}`) || env('LS_CHECKOUT_URL');

function datosTransferencia() {
  const d = { alias: env('TRANSF_ALIAS'), cbu: env('TRANSF_CBU'), titular: env('TRANSF_TITULAR'), banco: env('TRANSF_BANCO'), cuit: env('TRANSF_CUIT') };
  return d.alias || d.cbu ? d : null;
}

// Pago internacional manual (puente mientras no haya Lemon Squeezy): link de PayPal y/o instrucciones
// de transferencia internacional. Se confirma a mano en el panel, igual que la transferencia local.
function datosInternacionalManual() {
  const wu = env('INTL_WU_NOMBRE')
    ? { nombre: env('INTL_WU_NOMBRE'), pais: env('INTL_WU_PAIS') || 'Argentina', ciudad: env('INTL_WU_CIUDAD') }
    : null;
  const d = { westernUnion: wu, paypal: env('INTL_PAYPAL_URL'), instrucciones: env('INTL_INSTRUCCIONES').replace(/\n/g, '\n') };
  return d.westernUnion || d.paypal || d.instrucciones ? d : null;
}

async function leerCrudo(req) {
  if (typeof req.rawBody === 'string') return req.rawBody;
  const partes = [];
  for await (const c of req) partes.push(typeof c === 'string' ? Buffer.from(c) : c);
  return Buffer.concat(partes).toString('utf8');
}

// Webhook de Lemon Squeezy. Verifica la firma sobre el cuerpo crudo antes de tocar nada.
async function lsWebhook(req, res) {
  const crudo = await leerCrudo(req);
  const secreto = env('LS_WEBHOOK_SECRET');
  const firma = String(req.headers['x-signature'] || '');
  const esperada = secreto ? crypto.createHmac('sha256', secreto).update(crudo).digest('hex') : '';
  if (!secreto || firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) {
    return res.status(401).json({ error: 'Firma inválida' });
  }
  const ev = JSON.parse(crudo || '{}');
  const evento = ev?.meta?.event_name || '';
  const uid = ev?.meta?.custom_data?.user_id;
  const a = ev?.data?.attributes || {};
  if (!uid) return res.status(200).json({ ok: true });

  if (evento === 'subscription_payment_success') {
    await sb.from('academia_pagos').insert({
      usuario_id: uid, metodo: 'internacional', monto: (a.total || 0) / 100, moneda: String(a.currency || 'USD').toUpperCase(),
      estado: 'confirmado', referencia: String(ev.data?.id || ''), confirmado: new Date().toISOString(),
    });
  } else if (evento.startsWith('subscription_')) {
    const cambios = { metodo_pago: 'internacional', ls_subscription_id: String(ev.data?.id || '') };
    if (['active', 'on_trial', 'past_due'].includes(a.status)) { cambios.estado = 'activa'; cambios.vence = a.renews_at || null; }
    else if (a.status === 'cancelled') { cambios.estado = 'activa'; cambios.vence = a.ends_at || null; } // sigue hasta el fin del período pago
    else if (['expired', 'unpaid', 'paused'].includes(a.status)) cambios.estado = 'vencida';
    await sb.from('academia_perfiles').update(cambios).eq('id', uid);
  }
  return res.status(200).json({ ok: true });
}

// Una vez por mes (cron de Vercel): ajusta el monto en pesos de las suscripciones de Mercado Pago
// al dólar oficial, solo si cambió más de 3%.
async function ajustarPreciosMp() {
  const { data } = await sb.from('academia_perfiles').select('id,precio_usd,mp_preapproval_id')
    .eq('estado', 'activa').eq('metodo_pago', 'mercadopago').not('mp_preapproval_id', 'is', null);
  let ajustadas = 0;
  for (const p of data || []) {
    const nuevo = await precioArs(p.precio_usd || 39);
    if (!nuevo) continue;
    const pre = await mp(`/preapproval/${p.mp_preapproval_id}`).catch(() => null);
    const actual = Number(pre?.auto_recurring?.transaction_amount) || 0;
    if (!pre || pre.status !== 'authorized' || !actual || Math.abs(nuevo - actual) / actual <= 0.03) continue;
    await mp(`/preapproval/${p.mp_preapproval_id}`, { method: 'PUT', body: JSON.stringify({ auto_recurring: { transaction_amount: nuevo, currency_id: 'ARS' } }) }).catch(() => null);
    ajustadas += 1;
  }
  return { revisadas: (data || []).length, ajustadas };
}

// ── Contenido inicial ─────────────────────────────────────────────────
const SEMILLA = [
  {
    titulo: 'Fundamentos profesionales del Eneagrama', ruta: 'Fundamentos', nivel: 1,
    descripcion: 'Los 9 tipos, centros, alas, subtipos y niveles, explicados para usarlos con clientes y no como horóscopo.',
    modulos: [
      { titulo: 'El mapa', lecciones: [
        ['Qué es el Eneagrama y qué no es', 'Por qué no es un test de personalidad más, y cómo presentarlo a un cliente o a un equipo sin que suene esotérico.'],
        ['Los tres centros: instinto, emoción y mente', 'Desde dónde reacciona cada persona antes de pensar. La primera pregunta que te hacés en una sesión.'],
        ['Motivación y miedo de fondo', 'El tipo no se define por la conducta sino por el para qué. Cómo escucharlo en lo que el cliente cuenta.'],
      ]},
      { titulo: 'Los nueve tipos', lecciones: [
        ['Tipos 8, 9 y 1: el centro instintivo', 'Control, paz y corrección. Cómo se presentan en sesión y qué los hace avanzar.'],
        ['Tipos 2, 3 y 4: el centro emocional', 'Imagen, logro e identidad. Las señales que se confunden entre sí.'],
        ['Tipos 5, 6 y 7: el centro mental', 'Conocimiento, seguridad y opciones. Cómo trabajar con clientes que piensan mucho.'],
      ]},
      { titulo: 'Más allá del número', lecciones: [
        ['Alas y flechas', 'Por qué dos personas del mismo tipo pueden parecer opuestas.'],
        ['Los 27 subtipos', 'Conservación, social y sexual: el matiz que más mejora tus hipótesis.'],
        ['Niveles de desarrollo', 'El mismo tipo en su mejor y en su peor versión, y qué significa para tu trabajo.'],
      ]},
    ],
  },
  {
    titulo: 'Patrones', ruta: 'Patrones', nivel: 1,
    descripcion: 'Cómo reacciona cada tipo bajo estrés, qué defensa usa y qué repite en vínculos y en el trabajo.',
    modulos: [
      { titulo: 'Bajo presión', lecciones: [
        ['El estrés por tipo', 'Qué cambia en cada tipo cuando la presión sube, y cómo reconocerlo antes de que el cliente lo nombre.'],
        ['Mecanismos de defensa', 'La defensa de cada tipo y cómo trabajar con ella sin confrontarla de frente.'],
      ]},
    ],
  },
  {
    titulo: 'El Eneagrama en sesión', ruta: 'En sesión', nivel: 2,
    descripcion: 'Cómo tipar sin etiquetar, preguntas por tipo y qué hacer cuando el cliente no avanza.',
    modulos: [
      { titulo: 'Hipótesis, no diagnóstico', lecciones: [
        ['Cómo formular una hipótesis de tipo', 'Las tres señales que tienen que coincidir antes de sostener una hipótesis.'],
        ['Preguntas que abren cada tipo', 'Una pregunta de entrada por tipo, probada en sesión.'],
      ]},
    ],
  },
  {
    titulo: 'Equipos y RRHH', ruta: 'Equipos', nivel: 3,
    descripcion: 'Selección, roles, conflictos, motivación y feedback según el tipo.',
    modulos: [
      { titulo: 'El mapa del equipo', lecciones: [
        ['Leer un equipo por centros', 'Qué pasa cuando un equipo tiene mayoría de un centro y cómo equilibrarlo.'],
      ]},
    ],
  },
  {
    titulo: 'Eneagrama e IA', ruta: 'IA', nivel: 3,
    descripcion: 'Cómo usar la IA para preparar sesiones y materiales sin delegarle el diagnóstico.',
    modulos: [
      { titulo: 'La IA como asistente', lecciones: [
        ['Lo que la IA puede y no puede hacer', 'Límites éticos: la IA propone, la profesional decide.'],
        ['Practicar con el laboratorio', 'Cómo sacarle provecho al cliente simulado y leer la devolución.'],
      ]},
    ],
  },
];

async function sembrar(adminId) {
  const { count } = await sb.from('academia_cursos').select('id', { count: 'exact', head: true });
  if ((count || 0) > 0) return { ok: false, motivo: 'Ya hay cursos cargados.' };

  for (const [ci, c] of SEMILLA.entries()) {
    const { data: curso } = await sb.from('academia_cursos').insert({
      titulo: c.titulo, descripcion: c.descripcion, ruta: c.ruta, nivel_requerido: c.nivel, orden: ci,
    }).select('id').single();
    for (const [mi, m] of c.modulos.entries()) {
      const { data: mod } = await sb.from('academia_modulos').insert({ curso_id: curso.id, titulo: m.titulo, orden: mi }).select('id').single();
      await sb.from('academia_lecciones').insert(m.lecciones.map(([titulo, contenido], li) => ({
        modulo_id: mod.id, titulo, contenido, orden: li,
      })));
    }
  }

  const dia = (d, h) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  await sb.from('academia_eventos').insert([
    { titulo: 'Clase del mes: los tres centros en sesión', tipo: 'clase', inicio: dia(7, 19), duracion_min: 75,
      descripcion: 'Cómo detectar desde qué centro reacciona tu cliente en los primeros minutos.' },
    { titulo: 'Supervisión de casos', tipo: 'supervision', inicio: dia(21, 19), duracion_min: 90,
      descripcion: 'Traé un caso real (anonimizado) y lo trabajamos en grupo.' },
  ]);

  await sb.from('academia_posts').insert({
    autor_id: adminId, categoria: 'anuncios', fijado: true,
    titulo: 'Bienvenida a la Academia',
    cuerpo: 'Este es tu espacio para aprender, practicar y compartir cómo usás el Eneagrama en tu trabajo.\n\nPara arrancar: completá tu perfil, presentate en la categoría Presentaciones y mirá la primera lección de Fundamentos. Nos vemos en el próximo vivo.',
  });
  return { ok: true };
}

// ── Cotizaciones ──────────────────────────────────────────────────────
// Peso: dólar oficial (venta) de dolarapi.com, que toma el BNA. Euro: open.er-api.com.
// Se guardan 30 minutos en memoria; si una fuente falla, se mantiene el último valor bueno.
let cotizCache = { ars: null, eur: null, actualizado: null, hasta: 0 };

async function cotizaciones() {
  if (Date.now() < cotizCache.hasta) return cotizCache;
  const conTiempo = (url) => fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [dolar, fx] = await Promise.all([
    conTiempo('https://dolarapi.com/v1/dolares/oficial'),
    conTiempo('https://open.er-api.com/v6/latest/USD'),
  ]);
  const ars = Number(dolar?.venta) || cotizCache.ars;
  const eur = Number(fx?.rates?.EUR) || cotizCache.eur;
  cotizCache = {
    ars, eur,
    actualizado: dolar?.fechaActualizacion || cotizCache.actualizado || new Date().toISOString(),
    // Si alguna falló, se reintenta en 2 minutos en vez de esperar media hora
    hasta: Date.now() + (dolar && fx ? 30 : 2) * 60 * 1000,
  };
  return cotizCache;
}

// ── Handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const action = req.query.action;
  // Lemon Squeezy firma el cuerpo crudo: se atiende antes de usar req.body
  if (action === 'ls-webhook' && req.method === 'POST') {
    try { return await lsWebhook(req, res); } catch (e) { console.error(e); return res.status(500).json({ error: 'Error del webhook' }); }
  }
  const body = req.body || {};
  const m = req.method;

  try {
    // ── Públicas ───────────────────────────────────────────────────
    if (action === 'registro' && m === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const nombre = String(body.nombre || '').trim();
      if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: 'Ingresá un email válido.' });
      if (password.length < 8) return res.status(400).json({ error: 'La contraseña tiene que tener al menos 8 caracteres.' });
      if (!nombre) return res.status(400).json({ error: 'Ingresá tu nombre.' });

      const { data: creado, error } = await sb.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { nombre },
      });
      if (error) {
        const yaExiste = /already|registered|exists/i.test(error.message);
        return res.status(yaExiste ? 409 : 400).json({ error: yaExiste ? 'Ya existe una cuenta con ese email. Ingresá con tu contraseña.' : error.message });
      }
      await asegurarPerfil(creado.user, { nombre, profesion: body.profesion, pais: body.pais });
      const { data: s, error: e2 } = await clienteAuth().auth.signInWithPassword({ email, password });
      if (e2) return res.status(500).json({ error: 'La cuenta se creó pero no pudimos iniciar sesión. Probá ingresar.' });
      return res.status(200).json({ sesion: sesionPublica(s.session) });
    }

    if (action === 'entrar' && m === 'POST') {
      const { data, error } = await clienteAuth().auth.signInWithPassword({
        email: String(body.email || '').trim().toLowerCase(), password: String(body.password || ''),
      });
      if (error) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
      await asegurarPerfil(data.user);
      return res.status(200).json({ sesion: sesionPublica(data.session) });
    }

    if (action === 'refrescar' && m === 'POST') {
      const { data, error } = await clienteAuth().auth.refreshSession({ refresh_token: body.refresh_token });
      if (error || !data.session) return res.status(401).json({ error: 'Tu sesión venció. Volvé a ingresar.' });
      return res.status(200).json({ sesion: sesionPublica(data.session) });
    }

    if (action === 'recuperar' && m === 'POST') {
      await clienteAuth().auth.resetPasswordForEmail(String(body.email || '').trim().toLowerCase(), {
        redirectTo: `${env('ACADEMIA_URL')}/entrar`,
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'pago-webhook' && m === 'POST') {
      const id = body?.data?.id || req.query.id;
      const tipo = body?.type || req.query.topic || '';
      if (!id || !/preapproval/.test(tipo) || !env('MP_ACCESS_TOKEN')) return res.status(200).json({ ok: true });
      const pre = await mp(`/preapproval/${id}`);
      const uid = pre.external_reference;
      if (uid) {
        const estado = pre.status === 'authorized' ? 'activa' : (['cancelled', 'paused'].includes(pre.status) ? 'vencida' : null);
        if (estado) await sb.from('academia_perfiles').update({ estado, mp_preapproval_id: pre.id, metodo_pago: 'mercadopago', vence: null }).eq('id', uid);
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'cron-precios-mp' && m === 'GET') {
      if (!env('CRON_SECRET') || req.headers.authorization !== `Bearer ${env('CRON_SECRET')}`) return res.status(401).json({ error: 'No autorizado' });
      if (!env('MP_ACCESS_TOKEN')) return res.status(200).json({ revisadas: 0, ajustadas: 0 });
      return res.status(200).json(await ajustarPreciosMp());
    }

    if (action === 'publico-info' && m === 'GET') {
      const [{ count: miembros }, { data: proximo }] = await Promise.all([
        sb.from('academia_perfiles').select('id', { count: 'exact', head: true }).eq('estado', 'activa').eq('rol', 'miembro'),
        sb.from('academia_eventos').select('titulo,inicio,tipo').gte('inicio', new Date().toISOString()).order('inicio').limit(1),
      ]);
      // Precio de lanzamiento USD 39 para las primeras 100 miembros activas; después USD 59
      const lanzamiento = (miembros || 0) < 100;
      return res.status(200).json({ miembros: miembros || 0, proximo: proximo?.[0] || null, precio_usd: lanzamiento ? 39 : 59, lanzamiento });
    }

    if (action === 'cotizacion' && m === 'GET') {
      const { ars, eur, actualizado } = await cotizaciones();
      res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
      return res.status(200).json({ ars, eur, actualizado });
    }

    // ── Requieren sesión ───────────────────────────────────────────
    const yo = await usuarioDe(req);
    if (!yo) return res.status(401).json({ error: 'Tu sesión venció. Volvé a ingresar.' });
    const esAdmin = yo.rol === 'admin';
    const nivel = nivelDe(yo.puntos);

    if (action === 'yo' && m === 'GET') {
      return res.status(200).json({ perfil: yo, nivel, niveles: NIVELES, onboarding: await onboardingDe(yo) });
    }

    if (action === 'perfil' && m === 'PUT') {
      const cambios = {};
      for (const k of ['nombre', 'profesion', 'pais', 'bio']) if (k in body) cambios[k] = String(body[k] || '').trim() || null;
      if (cambios.nombre === null) delete cambios.nombre;
      const { data } = await sb.from('academia_perfiles').update(cambios).eq('id', yo.id).select('*').single();
      return res.status(200).json({ perfil: data });
    }

    if (action === 'onboarding' && m === 'PUT') {
      const onboarding = { ...(yo.onboarding || {}), [String(body.paso)]: true };
      await sb.from('academia_perfiles').update({ onboarding }).eq('id', yo.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'pago-opciones' && m === 'GET') {
      const usd = await precioUsdDe(yo);
      const ars = await precioArs(usd);
      const { data: pendiente } = await sb.from('academia_pagos').select('id,meses,monto,moneda,creado')
        .eq('usuario_id', yo.id).eq('estado', 'pendiente').order('creado', { ascending: false }).limit(1);
      return res.status(200).json({
        usd, ars,
        mp: Boolean(env('MP_ACCESS_TOKEN') && ars),
        internacional: Boolean(checkoutInternacional(usd)),
        internacionalManual: datosInternacionalManual(),
        transferencia: datosTransferencia(),
        metodo: yo.metodo_pago || null, vence: yo.vence || null,
        pendiente: pendiente?.[0] || null,
      });
    }

    if (action === 'transferencia-aviso' && m === 'POST') {
      const internacional = body.via === 'internacional';
      if (internacional ? !datosInternacionalManual() : !datosTransferencia()) {
        return res.status(503).json({ error: 'Este medio de pago todavía no está habilitado. Escribinos por WhatsApp.' });
      }
      const usd = await precioUsdDe(yo);
      const unidad = internacional ? usd : await precioArs(usd);
      if (!unidad) return res.status(503).json({ error: 'No pudimos calcular el precio en pesos. Probá en unos minutos.' });
      const meses = [1, 3].includes(Number(body.meses)) ? Number(body.meses) : 1;
      const metodo = internacional ? 'internacional' : 'transferencia';
      await sb.from('academia_pagos').delete().eq('usuario_id', yo.id).eq('estado', 'pendiente').eq('metodo', metodo);
      await sb.from('academia_pagos').insert({
        usuario_id: yo.id, metodo, monto: unidad * meses, moneda: internacional ? 'USD' : 'ARS', meses,
        referencia: String(body.referencia || '').trim().slice(0, 80) || null,
      });
      if (!yo.precio_usd) await sb.from('academia_perfiles').update({ precio_usd: usd }).eq('id', yo.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'checkout-internacional' && m === 'POST') {
      const usd = await precioUsdDe(yo);
      const base = checkoutInternacional(usd);
      if (!base) return res.status(503).json({ error: 'El pago internacional todavía no está activado. Escribinos por WhatsApp.' });
      const url = new URL(base);
      url.searchParams.set('checkout[email]', yo.email);
      url.searchParams.set('checkout[name]', yo.nombre);
      url.searchParams.set('checkout[custom][user_id]', yo.id);
      if (!yo.precio_usd) await sb.from('academia_perfiles').update({ precio_usd: usd }).eq('id', yo.id);
      return res.status(200).json({ url: url.toString() });
    }

    if (action === 'suscribirme' && m === 'POST') {
      const usd = await precioUsdDe(yo);
      const ars = await precioArs(usd);
      if (!env('MP_ACCESS_TOKEN') || !ars) {
        return res.status(503).json({ error: 'El pago online todavía no está activado. Escribinos por WhatsApp y te damos acceso.' });
      }
      if (!yo.precio_usd) await sb.from('academia_perfiles').update({ precio_usd: usd }).eq('id', yo.id);
      const pre = await mp('/preapproval', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Academia Eneascoaching · membresía mensual',
          external_reference: yo.id,
          payer_email: yo.email,
          auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: ars, currency_id: 'ARS' },
          back_url: `${env('ACADEMIA_URL')}/app?pago=ok`,
          status: 'pending',
        }),
      });
      await sb.from('academia_perfiles').update({ mp_preapproval_id: pre.id }).eq('id', yo.id);
      return res.status(200).json({ url: pre.init_point });
    }

    // ── Requieren membresía activa ─────────────────────────────────
    if (yo.estado !== 'activa' && !esAdmin) {
      return res.status(402).json({ error: 'Tu membresía no está activa.' });
    }

    // Comunidad
    if (action === 'posts' && m === 'GET') {
      let q = sb.from('academia_posts')
        .select('*, autor:academia_perfiles(id,nombre,profesion,puntos,rol), comentarios:academia_comentarios(count), likes:academia_likes(count)')
        .order('fijado', { ascending: false }).order('creado', { ascending: false }).limit(60);
      if (req.query.categoria) q = q.eq('categoria', req.query.categoria);
      const { data: posts, error } = await q;
      if (error) throw error;
      const ids = posts.map(p => p.id);
      const { data: misLikes } = ids.length
        ? await sb.from('academia_likes').select('post_id').eq('usuario_id', yo.id).in('post_id', ids)
        : { data: [] };
      const likeados = new Set((misLikes || []).map(l => l.post_id));
      return res.status(200).json(posts.map(p => ({
        ...p,
        comentarios: p.comentarios?.[0]?.count || 0,
        likes: p.likes?.[0]?.count || 0,
        me_gusta: likeados.has(p.id),
        autor: p.autor && { ...p.autor, nivel: nivelDe(p.autor.puntos).n },
      })));
    }

    if (action === 'post' && m === 'POST') {
      const titulo = String(body.titulo || '').trim();
      if (!titulo) return res.status(400).json({ error: 'Escribí un título.' });
      const categoria = ['general', 'preguntas', 'casos', 'recursos', 'presentaciones', ...(esAdmin ? ['anuncios'] : [])]
        .includes(body.categoria) ? body.categoria : 'general';
      const { data, error } = await sb.from('academia_posts').insert({
        autor_id: yo.id, categoria, titulo, cuerpo: String(body.cuerpo || '').trim(),
      }).select('*').single();
      if (error) throw error;
      await sumarPuntos(yo.id, PUNTOS.post);
      return res.status(200).json(data);
    }

    if (action === 'post' && m === 'DELETE') {
      const { data: p } = await sb.from('academia_posts').select('autor_id').eq('id', req.query.id).maybeSingle();
      if (!p) return res.status(404).json({ error: 'La publicación no existe.' });
      if (p.autor_id !== yo.id && !esAdmin) return res.status(403).json({ error: 'Solo podés borrar tus publicaciones.' });
      await sb.from('academia_posts').delete().eq('id', req.query.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'post-fijar' && m === 'PUT' && esAdmin) {
      await sb.from('academia_posts').update({ fijado: Boolean(body.fijado) }).eq('id', body.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'comentarios' && m === 'GET') {
      const { data } = await sb.from('academia_comentarios')
        .select('*, autor:academia_perfiles(id,nombre,puntos,rol)').eq('post_id', req.query.post_id).order('creado');
      return res.status(200).json((data || []).map(c => ({ ...c, autor: c.autor && { ...c.autor, nivel: nivelDe(c.autor.puntos).n } })));
    }

    if (action === 'comentario' && m === 'POST') {
      const cuerpo = String(body.cuerpo || '').trim();
      if (!cuerpo) return res.status(400).json({ error: 'Escribí un comentario.' });
      const { data, error } = await sb.from('academia_comentarios').insert({ post_id: body.post_id, autor_id: yo.id, cuerpo }).select('*').single();
      if (error) throw error;
      await sumarPuntos(yo.id, PUNTOS.comentario);
      return res.status(200).json(data);
    }

    if (action === 'like' && m === 'POST') {
      const { data: post } = await sb.from('academia_posts').select('autor_id').eq('id', body.post_id).maybeSingle();
      if (!post) return res.status(404).json({ error: 'La publicación no existe.' });
      const { data: existe } = await sb.from('academia_likes').select('post_id').eq('post_id', body.post_id).eq('usuario_id', yo.id).maybeSingle();
      if (existe) {
        await sb.from('academia_likes').delete().eq('post_id', body.post_id).eq('usuario_id', yo.id);
        if (post.autor_id !== yo.id) await sumarPuntos(post.autor_id, -PUNTOS.like_recibido);
        return res.status(200).json({ me_gusta: false });
      }
      await sb.from('academia_likes').insert({ post_id: body.post_id, usuario_id: yo.id });
      if (post.autor_id !== yo.id) await sumarPuntos(post.autor_id, PUNTOS.like_recibido);
      return res.status(200).json({ me_gusta: true });
    }

    // Aula
    if (action === 'cursos' && m === 'GET') {
      let q = sb.from('academia_cursos').select('*').order('orden');
      if (!esAdmin) q = q.eq('publicado', true);
      const { data: cursos } = await q;
      const { data: modulos } = await sb.from('academia_modulos').select('id,curso_id');
      const modIds = (modulos || []).map(x => x.id);
      const { data: lecciones } = modIds.length ? await sb.from('academia_lecciones').select('id,modulo_id').in('modulo_id', modIds) : { data: [] };
      const { data: prog } = await sb.from('academia_progreso').select('leccion_id').eq('usuario_id', yo.id);
      const hechas = new Set((prog || []).map(p => p.leccion_id));
      const cursoDeModulo = Object.fromEntries((modulos || []).map(x => [x.id, x.curso_id]));
      return res.status(200).json((cursos || []).map(c => {
        const deCurso = (lecciones || []).filter(l => cursoDeModulo[l.modulo_id] === c.id);
        return {
          ...c,
          total: deCurso.length,
          completadas: deCurso.filter(l => hechas.has(l.id)).length,
          bloqueado: !esAdmin && nivel.n < c.nivel_requerido,
        };
      }));
    }

    if (action === 'curso' && m === 'GET') {
      const { data: curso } = await sb.from('academia_cursos').select('*').eq('id', req.query.id).maybeSingle();
      if (!curso || (!curso.publicado && !esAdmin)) return res.status(404).json({ error: 'El curso no existe.' });
      if (!esAdmin && nivel.n < curso.nivel_requerido) {
        return res.status(403).json({ error: `Este curso se desbloquea en el nivel ${curso.nivel_requerido}. Participá en la comunidad y completá lecciones para subir.` });
      }
      const { data: modulos } = await sb.from('academia_modulos').select('*').eq('curso_id', curso.id).order('orden');
      const modIds = (modulos || []).map(x => x.id);
      const { data: lecciones } = modIds.length ? await sb.from('academia_lecciones').select('*').in('modulo_id', modIds).order('orden') : { data: [] };
      const { data: prog } = await sb.from('academia_progreso').select('leccion_id').eq('usuario_id', yo.id);
      return res.status(200).json({
        curso,
        modulos: (modulos || []).map(mod => ({ ...mod, lecciones: (lecciones || []).filter(l => l.modulo_id === mod.id) })),
        completadas: (prog || []).map(p => p.leccion_id),
      });
    }

    if (action === 'leccion-completar' && m === 'POST') {
      const { data: existe } = await sb.from('academia_progreso').select('leccion_id').eq('usuario_id', yo.id).eq('leccion_id', body.leccion_id).maybeSingle();
      if (existe) {
        if (body.desmarcar) await sb.from('academia_progreso').delete().eq('usuario_id', yo.id).eq('leccion_id', body.leccion_id);
        return res.status(200).json({ completada: !body.desmarcar });
      }
      await sb.from('academia_progreso').insert({ usuario_id: yo.id, leccion_id: body.leccion_id });
      await sumarPuntos(yo.id, PUNTOS.leccion);
      return res.status(200).json({ completada: true });
    }

    // Calendario
    if (action === 'eventos' && m === 'GET') {
      const desde = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString();
      const { data } = await sb.from('academia_eventos').select('*').gte('inicio', desde).order('inicio');
      return res.status(200).json(data || []);
    }

    // Miembros y ranking
    if (action === 'miembros' && m === 'GET') {
      const { data } = await sb.from('academia_perfiles').select('id,nombre,profesion,pais,bio,puntos,rol,creado')
        .eq('estado', 'activa').order('creado', { ascending: false }).limit(300);
      return res.status(200).json((data || []).map(p => ({ ...p, nivel: nivelDe(p.puntos).n })));
    }

    if (action === 'ranking' && m === 'GET') {
      const { data } = await sb.from('academia_perfiles').select('id,nombre,profesion,puntos,rol')
        .eq('estado', 'activa').order('puntos', { ascending: false }).limit(50);
      return res.status(200).json((data || []).map(p => ({ ...p, nivel: nivelDe(p.puntos) })));
    }

    // Laboratorio
    if (action === 'lab-historial' && m === 'GET') {
      const { data } = await sb.from('academia_lab_sesiones').select('id,eneatipo,escenario,hipotesis,cerrada,creado')
        .eq('usuario_id', yo.id).order('creado', { ascending: false }).limit(20);
      return res.status(200).json((data || []).map(s => ({ ...s, eneatipo: s.cerrada ? s.eneatipo : null })));
    }

    if (action === 'lab-sesion' && m === 'GET') {
      const { data: s } = await sb.from('academia_lab_sesiones').select('*').eq('id', req.query.id).eq('usuario_id', yo.id).maybeSingle();
      if (!s) return res.status(404).json({ error: 'La sesión no existe.' });
      return res.status(200).json({ ...s, eneatipo: s.cerrada ? s.eneatipo : null });
    }

    if (action === 'lab-iniciar' && m === 'POST') {
      const eneatipo = 1 + Math.floor(Math.random() * 9);
      const escenario = ESCENARIOS[Math.floor(Math.random() * ESCENARIOS.length)];
      const sesionTmp = { eneatipo, escenario };
      const respuesta = await llamarClaude({
        system: systemCliente(sesionTmp),
        messages: [{ role: 'user', content: ABRE_COACH }],
        effort: 'low', maxTokens: 4000,
      });
      const mensajes = [{ rol: 'coach', texto: ABRE_COACH }, { rol: 'cliente', texto: respuesta }];
      const { data, error } = await sb.from('academia_lab_sesiones').insert({ usuario_id: yo.id, eneatipo, escenario, mensajes }).select('id').single();
      if (error) throw error;
      return res.status(200).json({ id: data.id, escenario, mensajes });
    }

    if (action === 'lab-mensaje' && m === 'POST') {
      const texto = String(body.texto || '').trim();
      if (!texto) return res.status(400).json({ error: 'Escribí tu intervención.' });
      const { data: s } = await sb.from('academia_lab_sesiones').select('*').eq('id', body.sesion_id).eq('usuario_id', yo.id).maybeSingle();
      if (!s) return res.status(404).json({ error: 'La sesión no existe.' });
      if (s.cerrada) return res.status(400).json({ error: 'Esta sesión ya terminó.' });
      if (s.mensajes.filter(x => x.rol === 'coach').length >= MAX_TURNOS_COACH) {
        return res.status(400).json({ error: 'Llegaste al máximo de intervenciones. Formulá tu hipótesis para cerrar la sesión.' });
      }
      const mensajes = [...s.mensajes, { rol: 'coach', texto }];
      const respuesta = await llamarClaude({
        system: systemCliente(s),
        messages: mensajes.map(x => ({ role: x.rol === 'coach' ? 'user' : 'assistant', content: x.texto })),
        effort: 'low', maxTokens: 4000,
      });
      mensajes.push({ rol: 'cliente', texto: respuesta });
      await sb.from('academia_lab_sesiones').update({ mensajes }).eq('id', s.id);
      return res.status(200).json({ mensajes });
    }

    if (action === 'lab-cerrar' && m === 'POST') {
      const hipotesis = Number(body.hipotesis);
      if (!(hipotesis >= 1 && hipotesis <= 9)) return res.status(400).json({ error: 'Elegí un tipo del 1 al 9.' });
      const { data: s } = await sb.from('academia_lab_sesiones').select('*').eq('id', body.sesion_id).eq('usuario_id', yo.id).maybeSingle();
      if (!s) return res.status(404).json({ error: 'La sesión no existe.' });
      if (s.cerrada) return res.status(200).json({ eneatipo: s.eneatipo, devolucion: s.devolucion, hipotesis: s.hipotesis });

      const transcripcion = s.mensajes.map(x => `${x.rol === 'coach' ? 'COACH' : 'CLIENTE'}: ${x.texto}`).join('\n');
      const devolucion = await llamarClaude({
        system: 'Sos supervisora de una formación de coaches en Eneagrama. Das devoluciones cálidas, concretas y útiles, en español rioplatense, sin guiones largos y sin exagerar elogios.',
        messages: [{
          role: 'user',
          content: `Una alumna practicó una primera sesión con un cliente simulado.

Tipo real del cliente: ${s.eneatipo}. Rasgos que se le indicaron: ${TIPOS[s.eneatipo]}
Hipótesis de la alumna: tipo ${hipotesis}.

Transcripción:
${transcripcion}

Escribí la devolución con estos cuatro apartados, cada uno con un título corto en una línea propia:
Resultado: si acertó o no, y si no, por qué su hipótesis era razonable o no.
Señales del tipo real: 2 o 3 frases textuales del cliente que lo mostraban, citadas entre comillas, y qué indicaban.
Lo que hiciste bien: intervenciones concretas de la alumna que abrieron al cliente.
Para la próxima: una o dos preguntas o movimientos que hubieran ayudado a confirmar el tipo.

Máximo 280 palabras.`,
        }],
        effort: 'medium', maxTokens: 8000,
      });
      await sb.from('academia_lab_sesiones').update({ hipotesis, devolucion, cerrada: true }).eq('id', s.id);
      await sumarPuntos(yo.id, PUNTOS.laboratorio);
      return res.status(200).json({ eneatipo: s.eneatipo, hipotesis, devolucion });
    }

    // ── Administración ─────────────────────────────────────────────
    if (action.startsWith('admin-') && !esAdmin) return res.status(403).json({ error: 'Solo administradoras.' });

    if (action === 'admin-sembrar' && m === 'POST') {
      return res.status(200).json(await sembrar(yo.id));
    }

    if (action === 'admin-miembros' && m === 'GET') {
      const { data } = await sb.from('academia_perfiles').select('*').order('creado', { ascending: false });
      return res.status(200).json(data || []);
    }

    if (action === 'admin-pagos' && m === 'GET') {
      const { data } = await sb.from('academia_pagos').select('*, perfil:academia_perfiles(nombre,email,vence)')
        .order('creado', { ascending: false }).limit(60);
      return res.status(200).json(data || []);
    }

    if (action === 'admin-pago' && m === 'PUT') {
      const { data: pago } = await sb.from('academia_pagos').select('*').eq('id', body.id).maybeSingle();
      if (!pago || pago.estado !== 'pendiente') return res.status(400).json({ error: 'Ese pago ya fue revisado.' });
      if (body.accion === 'rechazar') {
        await sb.from('academia_pagos').update({ estado: 'rechazado', confirmado: new Date().toISOString() }).eq('id', pago.id);
        return res.status(200).json({ ok: true });
      }
      const { data: perfil } = await sb.from('academia_perfiles').select('vence').eq('id', pago.usuario_id).single();
      const desde = perfil?.vence && new Date(perfil.vence) > new Date() ? perfil.vence : new Date().toISOString();
      const vence = sumarMeses(desde, pago.meses);
      await sb.from('academia_perfiles').update({ estado: 'activa', metodo_pago: pago.metodo === 'internacional' ? 'manual' : 'transferencia', vence }).eq('id', pago.usuario_id);
      await sb.from('academia_pagos').update({ estado: 'confirmado', confirmado: new Date().toISOString() }).eq('id', pago.id);
      return res.status(200).json({ ok: true, vence });
    }

    if (action === 'admin-miembro' && m === 'PUT') {
      const cambios = {};
      if (['pendiente', 'activa', 'vencida'].includes(body.estado)) cambios.estado = body.estado;
      if (['miembro', 'admin'].includes(body.rol)) cambios.rol = body.rol;
      await sb.from('academia_perfiles').update(cambios).eq('id', body.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'admin-curso') {
      if (m === 'POST' || m === 'PUT') {
        const fila = {
          titulo: String(body.titulo || '').trim(), descripcion: String(body.descripcion || ''),
          ruta: String(body.ruta || 'Fundamentos'), nivel_requerido: Number(body.nivel_requerido) || 1,
          orden: Number(body.orden) || 0, publicado: body.publicado !== false,
        };
        if (!fila.titulo) return res.status(400).json({ error: 'El curso necesita un título.' });
        const q = body.id ? sb.from('academia_cursos').update(fila).eq('id', body.id) : sb.from('academia_cursos').insert(fila);
        const { data, error } = await q.select('*').single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (m === 'DELETE') { await sb.from('academia_cursos').delete().eq('id', req.query.id); return res.status(200).json({ ok: true }); }
    }

    if (action === 'admin-modulo') {
      if (m === 'POST' || m === 'PUT') {
        const fila = { curso_id: body.curso_id, titulo: String(body.titulo || '').trim(), orden: Number(body.orden) || 0 };
        if (!fila.titulo) return res.status(400).json({ error: 'El módulo necesita un título.' });
        const q = body.id ? sb.from('academia_modulos').update({ titulo: fila.titulo, orden: fila.orden }).eq('id', body.id) : sb.from('academia_modulos').insert(fila);
        const { data, error } = await q.select('*').single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (m === 'DELETE') { await sb.from('academia_modulos').delete().eq('id', req.query.id); return res.status(200).json({ ok: true }); }
    }

    if (action === 'admin-leccion') {
      if (m === 'POST' || m === 'PUT') {
        const recursos = Array.isArray(body.recursos) ? body.recursos.filter(r => r?.nombre && r?.url) : [];
        const fila = {
          modulo_id: body.modulo_id, titulo: String(body.titulo || '').trim(),
          video_url: String(body.video_url || '').trim() || null, contenido: String(body.contenido || ''),
          recursos, orden: Number(body.orden) || 0,
        };
        if (!fila.titulo) return res.status(400).json({ error: 'La lección necesita un título.' });
        const { modulo_id, ...resto } = fila;
        const q = body.id ? sb.from('academia_lecciones').update(resto).eq('id', body.id) : sb.from('academia_lecciones').insert(fila);
        const { data, error } = await q.select('*').single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (m === 'DELETE') { await sb.from('academia_lecciones').delete().eq('id', req.query.id); return res.status(200).json({ ok: true }); }
    }

    if (action === 'admin-evento') {
      if (m === 'POST' || m === 'PUT') {
        const fila = {
          titulo: String(body.titulo || '').trim(), descripcion: String(body.descripcion || ''),
          tipo: ['clase', 'supervision', 'otro'].includes(body.tipo) ? body.tipo : 'clase',
          inicio: body.inicio, duracion_min: Number(body.duracion_min) || 60,
          link: String(body.link || '').trim() || null, grabacion_url: String(body.grabacion_url || '').trim() || null,
        };
        if (!fila.titulo || !fila.inicio) return res.status(400).json({ error: 'El evento necesita título y fecha.' });
        const q = body.id ? sb.from('academia_eventos').update(fila).eq('id', body.id) : sb.from('academia_eventos').insert(fila);
        const { data, error } = await q.select('*').single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (m === 'DELETE') { await sb.from('academia_eventos').delete().eq('id', req.query.id); return res.status(200).json({ ok: true }); }
    }

    return res.status(400).json({ error: 'Acción inválida' });
  } catch (e) {
    console.error('academia API error:', action, e);
    return res.status(e.status || 500).json({ error: e.status ? e.message : 'Error del servidor. Probá de nuevo en un momento.' });
  }
}
