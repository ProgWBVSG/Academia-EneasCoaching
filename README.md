# Academia Eneascoaching

Membresía de USD 39/mes de Cecilia B. Sánchez para profesionales que usan el Eneagrama: comunidad, aula con cursos, calendario de vivos, miembros, ranking con niveles, laboratorio de práctica con IA y panel de administración.

## Stack

- React 19 + Vite + Tailwind 4 (frontend)
- Una función serverless de Vercel, `api/academia.js`, con todas las acciones (`?action=...`)
- Supabase: usuarios (Auth) y tablas `academia_*` en el mismo proyecto que la web principal. El navegador nunca habla con Supabase directo: todo pasa por la API con la clave de servicio
- Mercado Pago (suscripción mensual) y Claude (laboratorio), ambos opcionales

## Puesta en marcha

1. En Supabase, SQL Editor: correr `supabase/schema.sql`, después `supabase/pagos.sql` y después `supabase/seguridad.sql`.
2. Completar `.env.local` (ver abajo) y correr `npm install` y `npm run dev`. Abre en http://localhost:5240.
3. Registrarse con un email que esté en `ACADEMIA_ADMIN_EMAILS`: esa cuenta queda como administradora y activa.
4. En Administración > Cursos, "Cargar contenido inicial" crea las cinco rutas con lecciones de ejemplo, dos vivos y un post de bienvenida.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `SUPABASE_URL` | URL del proyecto de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (secreta) |
| `ACADEMIA_ADMIN_EMAILS` | Solo sirve para crear a la **primera** administradora (si todavía no hay ninguna). Después, los permisos de admin se dan desde el panel, con motivo y registro. Así nadie puede quedarse con el rol registrándose con un email ajeno |
| `ACADEMIA_URL` | URL pública de la academia (para volver de Mercado Pago y del mail de contraseña) |
| `ADMIN_MFA` | `off` apaga la exigencia de verificación en dos pasos del panel. Solo para emergencias (por ejemplo, si se pierde el celular y no hay otra administradora); volver a quitarla enseguida |
| `VITE_WHATSAPP` | Número de WhatsApp con código de país y sin signos (por defecto el de Cecilia). Recibe los comprobantes y las consultas |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago. Sin él, el botón de pago deriva a WhatsApp |
| `ACADEMIA_PRECIO_ARS` | Precio mensual en pesos para la suscripción |
| `TRANSF_ALIAS`, `TRANSF_CBU`, `TRANSF_TITULAR`, `TRANSF_BANCO`, `TRANSF_CUIT` | Datos para pagar por transferencia. Con alias o CBU cargado, aparece la opción |
| `INTL_WU_NOMBRE`, `INTL_WU_PAIS`, `INTL_WU_CIUDAD` | Pago internacional por Western Union: nombre completo del receptor (como figura en su documento), país y ciudad. La persona envía el dinero y avisa con el número de control (MTCN) |
| `INTL_PAYPAL_URL`, `INTL_INSTRUCCIONES` | Pago internacional manual (mientras no haya Lemon Squeezy): link de PayPal (por ejemplo `https://www.paypal.com/paypalme/usuario`) y/o texto con instrucciones de transferencia internacional (`
` para salto de línea). Se confirma en Administración > Pagos |
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

## Seguridad del panel de administración

- **Verificación en dos pasos obligatoria** (aplicación de autenticación, TOTP). Sin el código, una administradora solo tiene los permisos de una miembro: el servidor lo exige en cada llamada, no solo la pantalla.
- **Registro de actividad** (`academia_auditoria`): ingresos, códigos, pagos confirmados o rechazados, altas manuales y cambios de estado o rol, con IP y dispositivo. La aplicación no puede editarlo ni borrarlo.
- **Motivo obligatorio** para rechazar un pago, dar un alta manual y cambiar el estado o el rol de una persona.
- **Límite de intentos** (`academia_intentos`): ingresos por email e IP, registros por IP, códigos de verificación y avisos de pago.
- **Reglas de roles**: nadie cambia su propio rol y siempre queda al menos una administradora.
- **Encabezados** (`vercel.json`): política de contenido, HSTS, no se puede abrir dentro de otra página y sin caché en la API.
- Las claves secretas viven solo en el servidor y las tablas tienen RLS sin políticas: el navegador nunca habla con la base.
