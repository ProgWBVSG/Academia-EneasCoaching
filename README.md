# Academia Eneascoaching

Membresía de USD 39/mes de Cecilia B. Sánchez para profesionales que usan el Eneagrama: comunidad, aula con cursos, calendario de vivos, miembros, ranking con niveles, laboratorio de práctica con IA y panel de administración.

## Stack

- React 19 + Vite + Tailwind 4 (frontend)
- Una función serverless de Vercel, `api/academia.js`, con todas las acciones (`?action=...`)
- Supabase: usuarios (Auth) y tablas `academia_*` en el mismo proyecto que la web principal. El navegador nunca habla con Supabase directo: todo pasa por la API con la clave de servicio
- Mercado Pago (suscripción mensual) y Claude (laboratorio), ambos opcionales

## Puesta en marcha

1. En Supabase, SQL Editor: correr `supabase/schema.sql` y después `supabase/pagos.sql`.
2. Completar `.env.local` (ver abajo) y correr `npm install` y `npm run dev`. Abre en http://localhost:5240.
3. Registrarse con un email que esté en `ACADEMIA_ADMIN_EMAILS`: esa cuenta queda como administradora y activa.
4. En Administración > Cursos, "Cargar contenido inicial" crea las cinco rutas con lecciones de ejemplo, dos vivos y un post de bienvenida.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (secreta) |
| `ACADEMIA_ADMIN_EMAILS` | Emails separados por coma que entran como administradoras |
| `ACADEMIA_URL` | URL pública de la academia (para volver de Mercado Pago y del mail de contraseña) |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago. Sin él, el botón de pago deriva a WhatsApp |
| `ACADEMIA_PRECIO_ARS` | Precio mensual en pesos para la suscripción |
| `TRANSF_ALIAS`, `TRANSF_CBU`, `TRANSF_TITULAR`, `TRANSF_BANCO`, `TRANSF_CUIT` | Datos para pagar por transferencia. Con alias o CBU cargado, aparece la opción |
| `LS_CHECKOUT_URL_39`, `LS_CHECKOUT_URL_59` (o `LS_CHECKOUT_URL`) | Links de checkout de Lemon Squeezy para el pago internacional, uno por precio |
| `LS_WEBHOOK_SECRET` | Clave para verificar los avisos de Lemon Squeezy (webhook en `/api/academia?action=ls-webhook`) |
| `CRON_SECRET` | Clave del cron mensual de Vercel que ajusta las suscripciones de Mercado Pago al dólar oficial |
| `ANTHROPIC_API_KEY` | Activa el laboratorio de práctica |
| `ACADEMIA_IA_MODEL` | Opcional. Por defecto `claude-opus-5` |
| `VITE_VSL_URL` | Link del video de Cecilia en la landing (YouTube, Vimeo o .mp4). En local: `/vsl/vsl-cecilia.mp4` (comprimido a 1080p, no se sube al repositorio). Sin él, se ve su foto con el aviso "se publica muy pronto" |
| `VITE_VSL_POSTER` | Opcional. Portada del video .mp4. Por defecto `/vsl/poster.jpg` |

## Mercado Pago

Configurar el webhook de suscripciones en Mercado Pago apuntando a `https://<dominio>/api/academia?action=pago-webhook`. Cuando la suscripción queda autorizada, el miembro se activa solo; si se cancela o pausa, pasa a "pausada".

## Puntos y niveles

Publicar +3, comentar +1, me gusta recibido +1, lección completada +2, práctica del laboratorio +3. Nueve niveles (Curiosidad a Sabiduría). Cada curso tiene un nivel mínimo: En sesión se abre en el 2, Equipos e IA en el 3.
