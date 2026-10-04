// Contenido público de la Academia que comparten la web (React) y la preparación para buscadores
// (scripts/prerender.ts): textos legales, preguntas frecuentes, datos de la marca y de cada página.
// Este archivo no importa nada: Node lo lee directo al publicar para armar el HTML, el sitemap y llms.txt.

export const SITIO = {
  url: 'https://academia.cecimentorcoach.com',
  nombre: 'Academia Eneascoaching',
  web: 'https://www.cecimentorcoach.com',
  responsable: 'Cecilia B. Sánchez',
  lugar: 'Córdoba, Argentina',
  whatsapp: 'https://wa.me/5493515632496',
  redes: ['https://www.instagram.com/ceciliabsanchez/', 'https://www.youtube.com/@CeciliaEneasCoaching', 'https://www.cecimentorcoach.com'],
  video: { id: 'D5bPKWH8KkE', titulo: 'Cómo usar el Eneagrama en tu trabajo y en tu vida | Academia Eneascoaching', duracion: 'PT4M39S', publicado: '2026-10-04' },
  vigencia: '4 de octubre de 2026',
};

// Precio de lanzamiento (los valores que manda son los de la API; estos se usan en textos y buscadores)
export const LANZAMIENTO = { usd: 39, listaUsd: 59, cupo: 50, cierre: '2026-12-31', cierreTexto: '31 de diciembre de 2026' };

export const HERO = {
  titulo: 'Comprender al otro comienza por comprenderte a vos.',
  subtitulo: 'Cómo mejorar tus vínculos con tu familia, en tu trabajo, con tu equipo y con vos mismo.',
  bajada: 'El Eneagrama aplicado a tu trabajo y a tu vida.',
};

export const INCLUYE_PRECIO = [
  'Cursos grabados con las bases del Eneagrama',
  'Dos clases en vivo por mes con Cecilia',
  'Networking con profesionales de distintas áreas',
  'Fichas de cada tipo para tu trabajo',
  'Test de tu tipo y laboratorio de práctica',
];

export const PROFESIONES_SEO = [
  'coaches (ontológicos, ejecutivos y de vida)', 'psicólogos y terapeutas', 'abogados y mediadores', 'profesionales de recursos humanos',
  'líderes y equipos de trabajo', 'docentes', 'profesionales de ventas', 'cualquier persona que quiera conocerse mejor',
];

export const FAQ: [string, string][] = [
  ['¿Necesito saber algo de Eneagrama?', 'No. Si nunca lo estudiaste, arrancás haciendo tu test y las primeras clases explican todo desde cero, con ejemplos de distintos trabajos.'],
  ['Ya conozco el Eneagrama. ¿Me sirve?', 'Sí. Los cursos son las bases y podés repasarlas cuando quieras, pero lo que más vas a aprovechar es la comunidad: los casos en vivo con Cecilia, la práctica en el laboratorio y el networking con colegas que usan la misma herramienta. Si buscás profundidad, la Diplomatura es el camino.'],
  ['Mi profesión no es psicología ni coaching. ¿Me sirve?', 'Sí. Está pensada para cualquier trabajo con personas del otro lado: derecho, educación, ventas, recursos humanos, equipos. Hay ejemplos y casos de cada área.'],
  ['¿El Eneagrama es algo esotérico?', 'Es un modelo de personalidad que describe qué motiva a cada persona y cómo reacciona. Se usa en empresas, en psicoterapia y en coaching. Acá lo aprendés con casos concretos y cada herramienta te dice para qué sirve y cuándo usarla.'],
  ['¿Con quién voy a compartir la comunidad?', 'Con profesionales de distintas áreas que trabajan con personas: abogados, psicólogos, coaches, docentes, gente de ventas y de recursos humanos. Esa mezcla es parte del valor: ves cómo usa la misma herramienta alguien que trabaja distinto que vos.'],
  ['¿Me sirve también en lo personal?', 'Sí. La Academia es para tu trabajo y para tu vida. Primero entendés tu propio tipo, y eso cambia cómo te relacionás con tu pareja, tu familia y la gente que querés, no solo con tus clientes.'],
  ['¿Reemplaza una terapia o mi formación profesional?', 'No. El Eneagrama es un mapa de observación que suma a lo que ya sabés hacer, siempre dentro del alcance y la ética de tu profesión. No reemplaza una terapia, un diagnóstico ni tu formación.'],
  ['¿Cuánto tiempo necesito?', 'Con media hora por semana avanzás. Las lecciones duran entre 8 y 15 minutos. Los vivos se anuncian en el calendario con el horario de tu país y quedan grabados.'],
  ['¿Qué diferencia hay con la Diplomatura?', 'La Academia te da las bases del Eneagrama y una comunidad para practicarlo, a tu ritmo y con colegas. La Diplomatura es la formación completa y en profundidad para trabajar como eneagramista, con práctica supervisada y diploma. Mucha gente empieza por acá.'],
  ['¿Qué pasa con el precio? ¿Puedo cancelar?', `El precio de lanzamiento es USD ${LANZAMIENTO.usd} por mes para los primeros ${LANZAMIENTO.cupo} lugares o hasta el ${LANZAMIENTO.cierreTexto}, lo que ocurra primero. Quien entra a ese precio lo mantiene en sus renovaciones. Después, el precio es USD ${LANZAMIENTO.listaUsd}. Es una suscripción sin permanencia y la cancelás cuando quieras.`],
  ['¿Cómo pago desde fuera de Argentina?', 'En dólares por Western Union. Escribinos por WhatsApp y te pasamos los datos para tu país.'],
];

// ── Textos legales ────────────────────────────────────────────────────
export type Seccion = { titulo: string; parrafos: string[] };

export const TERMINOS: Seccion[] = [
  { titulo: 'Quiénes somos y qué aceptás', parrafos: [
    `La ${SITIO.nombre} (en adelante, "la Academia") es una membresía en línea dirigida por ${SITIO.responsable}, con domicilio en ${SITIO.lugar}, que se ofrece en ${SITIO.url}.`,
    'Al crear tu cuenta aceptás estos términos y la Política de privacidad. Si no estás de acuerdo con alguna parte, no uses la Academia.',
  ] },
  { titulo: 'Qué es la Academia', parrafos: [
    'La Academia te da las bases del Eneagrama y una comunidad para practicarlo: cursos grabados, clases en vivo, material descargable, un test de tipo, un laboratorio de práctica y un espacio de intercambio con otros miembros.',
    'Los contenidos se actualizan y se suman con el tiempo. Podemos reordenar, mejorar o reemplazar lecciones y materiales, manteniendo el propósito de la membresía.',
  ] },
  { titulo: 'Tu cuenta', parrafos: [
    'Para sumarte tenés que ser mayor de 18 años y dar datos verdaderos. La cuenta es personal: no la compartas ni le des tu contraseña a nadie.',
    'Sos responsable de lo que se haga con tu cuenta. Si creés que alguien entró sin permiso, avisanos enseguida y cambiá tu contraseña.',
  ] },
  { titulo: 'Precio y medios de pago', parrafos: [
    `La membresía cuesta USD ${LANZAMIENTO.listaUsd} por mes. Durante el lanzamiento cuesta USD ${LANZAMIENTO.usd} por mes, para los primeros ${LANZAMIENTO.cupo} lugares o hasta el ${LANZAMIENTO.cierreTexto}, lo que ocurra primero. Quien se suma a ese precio lo mantiene en sus renovaciones.`,
    'En Argentina pagás en pesos, al dólar oficial del día del pago, por transferencia bancaria o con Mercado Pago cuando esté disponible. Desde otros países pagás en dólares por Western Union. La pantalla de pago muestra siempre el monto exacto antes de pagar.',
    'Las transferencias se confirman a mano: con el código de referencia que te damos y el comprobante, activamos tu acceso, normalmente dentro del mismo día hábil.',
    'Los costos que te cobren tu banco o el servicio de envío de dinero corren por tu cuenta. Si cambiamos el precio de la membresía, te avisamos por email con al menos 30 días de anticipación y el cambio se aplica desde tu siguiente renovación.',
  ] },
  { titulo: 'Renovación, vencimiento y pausa', parrafos: [
    'Si pagás por transferencia o Western Union, pagás por períodos de 1 o 3 meses. Te avisamos por email 5 días antes del vencimiento. Si no renovás, tenés 3 días de gracia y después tu acceso se pausa. Tu progreso queda guardado y se reactiva cuando renovás.',
    'Si pagás con Mercado Pago, la suscripción se renueva sola cada mes y el monto en pesos se ajusta al dólar oficial.',
  ] },
  { titulo: 'Baja', parrafos: [
    'No hay permanencia mínima: te das de baja cuando quieras desde tu perfil o con el botón de baja que está al pie de cada página, sin dar explicaciones.',
    'Al darte de baja se cancelan los cobros futuros y mantenés el acceso hasta el final del período que ya pagaste. Fuera del derecho de arrepentimiento, no hay reintegros por los días que no uses.',
  ] },
  { titulo: 'Derecho de arrepentimiento', parrafos: [
    'Tenés 10 días corridos para arrepentirte de la contratación, contados desde que pagaste o desde que recibiste el acceso, lo que ocurra último, sin dar motivos y sin costo (artículo 34 de la Ley 24.240 y artículos 1110 y siguientes del Código Civil y Comercial).',
    'Lo pedís con el botón de arrepentimiento al pie de cada página, sin necesidad de ingresar a tu cuenta. Te damos un código de trámite dentro de las 24 horas y te devolvemos el total por el mismo medio con que pagaste.',
  ] },
  { titulo: 'Uso del contenido', parrafos: [
    `Los cursos, clases, textos, fichas, audios, videos y materiales de la Academia son propiedad intelectual de ${SITIO.responsable} y están protegidos por la Ley 11.723.`,
    'Podés usar lo que aprendés en tu vida y en tu trabajo, incluso con tus clientes, pacientes y equipos, y usar las fichas descargables en tus sesiones citando la fuente.',
    'No podés grabar, descargar los videos, copiar, revender, publicar ni compartir los contenidos o tu acceso con otras personas, ni usarlos para armar cursos o formaciones propias.',
  ] },
  { titulo: 'Convivencia en la comunidad', parrafos: [
    'La comunidad funciona con respeto. No se permiten agresiones, discriminación, spam ni ofrecer servicios o productos sin autorización.',
    'Cuando compartas un caso de tu trabajo, cuidá a la persona: cambiá su nombre y cualquier dato que la pueda identificar. No compartas información de salud ni datos sensibles de terceros.',
    'Lo que se comparte en la comunidad queda en la comunidad: no difundas fuera de la Academia lo que cuentan otros miembros.',
  ] },
  { titulo: 'Clases en vivo y grabaciones', parrafos: [
    'Las clases en vivo se graban para que los miembros las vean después dentro de la Academia. Si participás con cámara, micrófono o chat, podés aparecer en la grabación. Si no querés aparecer, podés participar solo por chat o con la cámara apagada.',
  ] },
  { titulo: 'Alcance del Eneagrama', parrafos: [
    'El Eneagrama es un mapa de observación de la personalidad, no una etiqueta ni un diagnóstico. La Academia es un espacio educativo y de desarrollo personal y profesional: no reemplaza una terapia, un tratamiento, un diagnóstico médico o psicológico ni el asesoramiento profesional.',
    'Usá lo que aprendas dentro del alcance y la ética de tu profesión. Las decisiones que tomes con esta herramienta son tuyas.',
  ] },
  { titulo: 'Disponibilidad del servicio', parrafos: [
    'Trabajamos para que la Academia esté disponible siempre, pero puede haber interrupciones por mantenimiento o por fallas de proveedores externos (alojamiento, video, pagos, email). Si una interrupción larga te impide usar la Academia, escribinos y lo compensamos con días de acceso.',
  ] },
  { titulo: 'Suspensión de cuentas', parrafos: [
    'Si alguien incumple estos términos (por ejemplo, comparte su acceso, difunde contenidos o falta el respeto en la comunidad), podemos advertirle, suspender su cuenta o darla de baja. Si el incumplimiento es grave, la baja puede ser sin reintegro.',
  ] },
  { titulo: 'Cambios en estos términos', parrafos: [
    'Si cambiamos estos términos, te avisamos por email al menos 15 días antes de que rijan. Si no estás de acuerdo con los cambios, podés darte de baja antes de esa fecha.',
  ] },
  { titulo: 'Ley aplicable y reclamos', parrafos: [
    'Estos términos se rigen por las leyes de la República Argentina, incluida la Ley 24.240 de Defensa del Consumidor. Si sos consumidor en Argentina, podés hacer tu reclamo ante la autoridad de defensa del consumidor de tu jurisdicción o ante los tribunales de tu domicilio.',
    'Antes de cualquier reclamo, escribinos: casi todo se resuelve hablando.',
  ] },
  { titulo: 'Contacto', parrafos: [
    `Por cualquier consulta sobre estos términos, escribinos por WhatsApp al +54 9 351 563-2496 o con el formulario de la página de solicitudes (${SITIO.url}/arrepentimiento).`,
  ] },
];

export const PRIVACIDAD: Seccion[] = [
  { titulo: 'Quién cuida tus datos', parrafos: [
    `La responsable de tus datos personales es ${SITIO.responsable}, con domicilio en ${SITIO.lugar}, titular de la ${SITIO.nombre} (${SITIO.url}).`,
    'Esta política explica qué datos guardamos, para qué, con quién los compartimos y cómo ejercés tus derechos, según la Ley 25.326 de Protección de Datos Personales.',
  ] },
  { titulo: 'Qué datos guardamos', parrafos: [
    'Datos de tu cuenta: nombre, email, contraseña (guardada cifrada, nadie la puede leer), profesión y país.',
    'Datos de pago: método elegido, montos, fechas, códigos de referencia y estado de cada pago. No guardamos números de tarjeta ni claves bancarias: los pagos con tarjeta los procesa Mercado Pago. El comprobante de una transferencia nos lo mandás vos por WhatsApp.',
    'Datos de uso: lecciones vistas, progreso, resultado de tu test, participación en la comunidad y en las clases en vivo.',
    'Datos técnicos: dirección IP y tipo de navegador, que usamos para la seguridad (por ejemplo, para limitar intentos de ingreso) y para registrar la actividad del panel de administración.',
  ] },
  { titulo: 'Para qué los usamos', parrafos: [
    'Para darte acceso a la Academia, registrar y confirmar tus pagos, avisarte vencimientos y novedades de tu membresía, responder tus consultas, cuidar la seguridad de las cuentas y mejorar los contenidos.',
    'No vendemos ni alquilamos tus datos. No los usamos para publicidad de terceros.',
    'Te podemos mandar emails sobre tu membresía (pagos, vencimientos, clases). Si te mandamos novedades o promociones, cada email trae la forma de dejar de recibirlas.',
  ] },
  { titulo: 'Con quién los compartimos', parrafos: [
    'Solo con los proveedores que hacen funcionar la Academia, cada uno para su tarea: Supabase (base de datos e ingreso a la cuenta), Vercel (alojamiento de la web), Resend (envío de emails), Mercado Pago (cobros con tarjeta en Argentina), Western Union (envíos desde el exterior), WhatsApp de Meta (cuando nos escribís), YouTube de Google (videos, en su modo de privacidad mejorada, que no guarda cookies hasta que reproducís) y Google Fonts (tipografías).',
    'Algunos de estos proveedores guardan los datos en servidores fuera de Argentina, principalmente en Estados Unidos, con medidas de seguridad adecuadas. Al usar la Academia aceptás esa transferencia internacional.',
    'También podemos compartir datos si lo ordena una autoridad judicial o administrativa con competencia.',
  ] },
  { titulo: 'Cookies y almacenamiento en tu navegador', parrafos: [
    'No usamos cookies de publicidad ni de seguimiento. Tu navegador guarda solo lo necesario para que la web funcione: tu sesión iniciada, la moneda que elegiste para ver los precios y si cerraste el aviso de WhatsApp.',
  ] },
  { titulo: 'Cuánto tiempo los guardamos', parrafos: [
    'Mientras tengas tu cuenta. Si pedís darla de baja definitiva, borramos tus datos dentro de los 30 días, salvo los registros de pagos que la ley nos obliga a conservar por motivos contables e impositivos (hasta 10 años) y el registro de seguridad del panel de administración.',
  ] },
  { titulo: 'Cómo los protegemos', parrafos: [
    'La conexión con la web está cifrada (HTTPS). Las contraseñas se guardan cifradas. El panel de administración exige verificación en dos pasos y registra cada acción. Solo las administradoras de la Academia acceden a los datos de pago.',
  ] },
  { titulo: 'Tus derechos', parrafos: [
    'Podés pedir en cualquier momento acceder a tus datos, corregirlos, actualizarlos o borrarlos. El acceso es gratuito cada seis meses, salvo que acredites un interés legítimo para pedirlo antes (artículo 14 de la Ley 25.326). Respondemos los pedidos de acceso dentro de los 10 días corridos y los de corrección o borrado dentro de los 5 días hábiles.',
    `Para ejercerlos, usá el formulario de ${SITIO.url}/arrepentimiento (opción "Mis datos personales") o escribinos por WhatsApp al +54 9 351 563-2496.`,
    'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.',
  ] },
  { titulo: 'Menores de edad', parrafos: [
    'La Academia es para mayores de 18 años. No guardamos a sabiendas datos de menores: si detectamos una cuenta de un menor, la damos de baja.',
  ] },
  { titulo: 'Cambios en esta política', parrafos: [
    'Si cambiamos esta política de forma importante, te avisamos por email antes de que rija. La fecha de la última actualización figura al inicio.',
  ] },
];

export const ARREPENTIMIENTO_INTRO = [
  'Desde acá podés pedir el arrepentimiento de tu compra, la baja de tu membresía o hacer un pedido sobre tus datos personales. No necesitás ingresar a tu cuenta.',
  'Al enviar el formulario te damos un código de trámite y te llega por email. Lo respondemos dentro de las 24 horas hábiles.',
];

export const TIPOS_SOLICITUD = [
  { id: 'arrepentimiento', titulo: 'Botón de arrepentimiento', texto: 'Tenés 10 días corridos desde que pagaste o recibiste el acceso para arrepentirte, sin dar motivos. Te devolvemos el total por el mismo medio de pago.' },
  { id: 'baja', titulo: 'Botón de baja', texto: 'Cancelás tu membresía y los cobros futuros. Mantenés el acceso hasta el final del período que ya pagaste.' },
  { id: 'datos', titulo: 'Mis datos personales', texto: 'Pedís acceder, corregir o borrar tus datos personales.' },
] as const;
export type TipoSolicitud = typeof TIPOS_SOLICITUD[number]['id'];

// ── Cada página pública: título, descripción y si se indexa ───────────
export type PaginaSeo = { ruta: string; titulo: string; descripcion: string; indexar: boolean; prioridad?: string };

export const PAGINAS: PaginaSeo[] = [
  { ruta: '/', indexar: true, prioridad: '1.0',
    titulo: 'Academia Eneascoaching | Aprendé Eneagrama para tu trabajo y tu vida',
    descripcion: 'Membresía online de Eneagrama con Cecilia B. Sánchez: cursos desde cero, 2 clases en vivo por mes y comunidad de profesionales. Autoconocimiento, vínculos y equipos. Desde USD 39/mes.' },
  { ruta: '/terminos', indexar: true, prioridad: '0.3',
    titulo: 'Términos y condiciones | Academia Eneascoaching',
    descripcion: 'Condiciones de uso de la Academia Eneascoaching: membresía, precios, renovación, baja, derecho de arrepentimiento y uso del contenido.' },
  { ruta: '/privacidad', indexar: true, prioridad: '0.3',
    titulo: 'Política de privacidad | Academia Eneascoaching',
    descripcion: 'Qué datos guarda la Academia Eneascoaching, para qué los usa, con quién los comparte y cómo ejercés tus derechos según la Ley 25.326.' },
  { ruta: '/arrepentimiento', indexar: true, prioridad: '0.3',
    titulo: 'Botón de arrepentimiento y de baja | Academia Eneascoaching',
    descripcion: 'Pedí el arrepentimiento de tu compra, la baja de tu membresía o un trámite sobre tus datos personales, sin ingresar a tu cuenta.' },
  { ruta: '/registro', indexar: false,
    titulo: 'Creá tu cuenta | Academia Eneascoaching',
    descripcion: 'Sumate a la Academia Eneascoaching y empezá a aprender Eneagrama con Cecilia B. Sánchez.' },
  { ruta: '/entrar', indexar: false,
    titulo: 'Ingresar | Academia Eneascoaching',
    descripcion: 'Ingresá a tu cuenta de la Academia Eneascoaching.' },
];
