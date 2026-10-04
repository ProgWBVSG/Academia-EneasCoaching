-- Pagos de la Academia: Mercado Pago (Argentina), transferencia y cobro internacional.
-- Se puede correr más de una vez.

alter table academia_perfiles add column if not exists metodo_pago text
  check (metodo_pago in ('mercadopago', 'transferencia', 'internacional', 'manual'));
-- Hasta cuándo está pago el acceso (transferencias y suscripciones internacionales canceladas)
alter table academia_perfiles add column if not exists vence timestamptz;
-- Precio en dólares con el que entró: las primeras 100 mantienen USD 39
alter table academia_perfiles add column if not exists precio_usd integer;
alter table academia_perfiles add column if not exists ls_subscription_id text;

create table if not exists academia_pagos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references academia_perfiles(id) on delete cascade,
  metodo text not null check (metodo in ('mercadopago', 'transferencia', 'internacional')),
  monto numeric not null,
  moneda text not null,
  meses integer not null default 1,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado')),
  referencia text,
  creado timestamptz not null default now(),
  confirmado timestamptz
);
create index if not exists academia_pagos_estado_idx on academia_pagos (estado, creado desc);
create index if not exists academia_pagos_usuario_idx on academia_pagos (usuario_id, creado desc);

alter table academia_pagos enable row level security;
