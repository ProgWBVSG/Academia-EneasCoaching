-- Academia Eneascoaching: tablas propias dentro del mismo proyecto de Supabase
-- que usa la web. Todo el acceso pasa por la API (clave de servicio), así que
-- se activa RLS sin políticas: nadie puede leer estas tablas desde el navegador.

create table if not exists academia_perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null default '',
  profesion text,
  pais text,
  bio text,
  rol text not null default 'miembro' check (rol in ('miembro', 'admin')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'activa', 'vencida')),
  puntos integer not null default 0,
  onboarding jsonb not null default '{}'::jsonb,
  mp_preapproval_id text,
  creado timestamptz not null default now()
);

create table if not exists academia_posts (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references academia_perfiles(id) on delete cascade,
  categoria text not null default 'general',
  titulo text not null,
  cuerpo text not null default '',
  fijado boolean not null default false,
  creado timestamptz not null default now()
);
create index if not exists academia_posts_creado_idx on academia_posts (fijado desc, creado desc);

create table if not exists academia_comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references academia_posts(id) on delete cascade,
  autor_id uuid not null references academia_perfiles(id) on delete cascade,
  cuerpo text not null,
  creado timestamptz not null default now()
);
create index if not exists academia_comentarios_post_idx on academia_comentarios (post_id, creado);

create table if not exists academia_likes (
  post_id uuid not null references academia_posts(id) on delete cascade,
  usuario_id uuid not null references academia_perfiles(id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

create table if not exists academia_cursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  ruta text not null default 'Fundamentos',
  nivel_requerido integer not null default 1,
  orden integer not null default 0,
  publicado boolean not null default true,
  creado timestamptz not null default now()
);

create table if not exists academia_modulos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references academia_cursos(id) on delete cascade,
  titulo text not null,
  orden integer not null default 0
);

create table if not exists academia_lecciones (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references academia_modulos(id) on delete cascade,
  titulo text not null,
  video_url text,
  contenido text not null default '',
  recursos jsonb not null default '[]'::jsonb,
  orden integer not null default 0
);

create table if not exists academia_progreso (
  usuario_id uuid not null references academia_perfiles(id) on delete cascade,
  leccion_id uuid not null references academia_lecciones(id) on delete cascade,
  completada timestamptz not null default now(),
  primary key (usuario_id, leccion_id)
);

create table if not exists academia_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null default '',
  tipo text not null default 'clase' check (tipo in ('clase', 'supervision', 'otro')),
  inicio timestamptz not null,
  duracion_min integer not null default 60,
  link text,
  grabacion_url text,
  creado timestamptz not null default now()
);

create table if not exists academia_lab_sesiones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references academia_perfiles(id) on delete cascade,
  eneatipo integer not null check (eneatipo between 1 and 9),
  escenario text not null,
  mensajes jsonb not null default '[]'::jsonb,
  hipotesis integer,
  devolucion text,
  cerrada boolean not null default false,
  creado timestamptz not null default now()
);

-- Suma puntos de forma atómica (evita carreras si dos acciones llegan juntas)
create or replace function academia_sumar_puntos(uid uuid, n integer)
returns void language sql as $$
  update academia_perfiles set puntos = greatest(0, puntos + n) where id = uid;
$$;
revoke execute on function academia_sumar_puntos(uuid, integer) from public, anon, authenticated;

alter table academia_perfiles enable row level security;
alter table academia_posts enable row level security;
alter table academia_comentarios enable row level security;
alter table academia_likes enable row level security;
alter table academia_cursos enable row level security;
alter table academia_modulos enable row level security;
alter table academia_lecciones enable row level security;
alter table academia_progreso enable row level security;
alter table academia_eventos enable row level security;
alter table academia_lab_sesiones enable row level security;
