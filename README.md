# Academia Eneascoaching

Membresía de USD 39/mes de Cecilia B. Sánchez para profesionales que usan el Eneagrama: comunidad, aula con cursos, calendario de vivos, miembros, ranking con niveles, laboratorio de práctica con IA y panel de administración.

## Stack

- React 19 + Vite + Tailwind 4 (frontend)
- Una función serverless de Vercel, `api/academia.js`, con todas las acciones (`?action=...`)
- Supabase: usuarios (Auth) y tablas `academia_*` en el mismo proyecto que la web principal. El navegador nunca habla con Supabase directo: todo pasa por la API con la clave de servicio
- Mercado Pago (suscripción mensual) y Claude (laboratorio), ambos opcionales

## Puesta en marcha

1. En Supabase, SQL Editor: correr `supabase/schema.sql`.
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
| `ANTHROPIC_API_KEY` | Activa el laboratorio de práctica |
| `ACADEMIA_IA_MODEL` | Opcional. Por defecto `claude-opus-5` |

## Mercado Pago

Configurar el webhook de suscripciones en Mercado Pago apuntando a `https://<dominio>/api/academia?action=pago-webhook`. Cuando la suscripción queda autorizada, el miembro se activa solo; si se cancela o pausa, pasa a "pausada".

## Puntos y niveles

Publicar +3, comentar +1, me gusta recibido +1, lección completada +2, práctica del laboratorio +3. Nueve niveles (Curiosidad a Sabiduría). Cada curso tiene un nivel mínimo: En sesión se abre en el 2, Equipos e IA en el 3.
