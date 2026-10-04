-- Seguridad y panel de administración de la Academia.
-- Correr después de schema.sql y pagos.sql. Se puede correr más de una vez.

-- ── Pagos: código corto para identificarlos en WhatsApp y copia de los datos del registro ──
alter table academia_pagos add column if not exists codigo text;
alter table academia_pagos add column if not exists datos jsonb not null default '{}'::jsonb;
alter table academia_pagos add column if not exists nota text;
alter table academia_pagos add column if not exists revisado_por uuid;
create unique index if not exists academia_pagos_codigo_idx on academia_pagos (codigo) where codigo is not null;


-- ── Auditoría: quién hizo qué, desde dónde y cuándo. Solo se agrega: la app no puede editar ni borrar ──
create table if not exists academia_auditoria (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  actor_id uuid,
  actor_email text,
  accion text not null,
  objetivo text,
  detalle jsonb not null default '{}'::jsonb,
  ip text,
  ua text
);
create index if not exists academia_auditoria_creado_idx on academia_auditoria (creado desc);
create index if not exists academia_auditoria_accion_idx on academia_auditoria (accion, creado desc);
alter table academia_auditoria enable row level security;
revoke update, delete, truncate on academia_auditoria from anon, authenticated, service_role;

-- ── Intentos de ingreso, registro y verificación: para frenar fuerza bruta y registros en masa ──
create table if not exists academia_intentos (
  id bigint generated always as identity primary key,
  clave text not null,
  tipo text not null,
  creado timestamptz not null default now()
);
create index if not exists academia_intentos_idx on academia_intentos (tipo, clave, creado desc);
alter table academia_intentos enable row level security;

-- Para limpiar filas de prueba de la auditoría (solo desde el editor SQL, como dueña del proyecto):
--   delete from academia_auditoria where actor_email like '%@example.com';
