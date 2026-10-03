import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarDays, MessagesSquare, Users, Check, ArrowRight, ChevronDown, Play,
  Library, Briefcase, UserRound, Sparkles, ArrowUp, Brain, Compass, Scale, GraduationCap, Stethoscope,
  Handshake, MessageCircleWarning, Mic,
} from 'lucide-react';
import Eneagrama from '../components/Eneagrama';
import { useAuth } from '../lib/auth';
import { usePrecio, SelectorMoneda, PRECIO_USD, PRECIO_LISTA_USD, CUPO_LANZAMIENTO } from '../lib/precio';

// Reglas de esta página: todo centrado, sin etiquetas arriba de los títulos y un texto
// neutro para mujeres y hombres. El foco es usar el Eneagrama en el trabajo, con clientes,
// pacientes y equipos, para sumarle humanidad a la técnica. No hace falta conocerlo.

const WHATSAPP = 'https://wa.me/5493515632496?text=' + encodeURIComponent('Hola Cecilia! Quiero saber más de la Academia.');
const WEB = 'https://www.cecimentorcoach.com';

// Video de presentación de Cecilia. Acepta un link de YouTube, de Vimeo o un .mp4.
// Mientras no esté cargado, se muestra la foto de Cecilia con el aviso.
const VSL = (import.meta.env.VITE_VSL_URL as string | undefined)?.trim() || '';
// Portada del video propio: el cuadro de Cecilia diciendo "este video es para vos"
const VSL_PORTADA = (import.meta.env.VITE_VSL_POSTER as string | undefined)?.trim() || '/vsl/poster.jpg';

function urlEmbed(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const ESCENAS = [
  'El cliente que te contrató para resolver algo y no sigue ninguno de tus consejos.',
  'La mala noticia que tenés que dar sin saber cómo la van a recibir.',
  'Dos personas de tu equipo que no se soportan, y te toca a vos mediar.',
  'La negociación que se traba por algo que no tiene nada que ver con el tema.',
  'El paciente o el alumno que vuelve siempre al mismo punto, por más que le expliques.',
  'Esa persona con la que hagas lo que hagas, sentís que hablan idiomas distintos.',
];

const PROFESIONES = [
  { icono: Scale, titulo: 'Abogacía y mediación', texto: 'No todo es ley. Entendés qué mueve a tu cliente en un conflicto, cómo va a negociar la otra parte y cómo dar una mala noticia. Cecilia es abogada: lo vivió.' },
  { icono: Users, titulo: 'RRHH y equipos', texto: 'No todo es procesos. Seleccionás mejor, anticipás roces entre personas y das devoluciones que se escuchan. Con EneaTeams ves el mapa del equipo.' },
  { icono: Stethoscope, titulo: 'Salud', texto: 'No todo es diagnóstico. Sabés cómo explicarle un tratamiento a cada paciente para que lo entienda y lo siga.' },
  { icono: Brain, titulo: 'Psicología y terapia', texto: 'No todo es teoría. Entendés por qué alguien vuelve siempre al mismo punto, y qué intervención lo mueve.' },
  { icono: Compass, titulo: 'Coaching', texto: 'No todo son buenas preguntas. Ves qué frena a tu cliente aunque ya sepa lo que tiene que hacer.' },
  { icono: GraduationCap, titulo: 'Docencia', texto: 'No todo es contenido. Entendés por qué un alumno se cierra y otro desafía, y cómo llegarle a cada uno.' },
];

const TIPOS: Record<number, { nombre: string; mueve: string; traba: string; escena: string }> = {
  1: { nombre: 'la integridad', mueve: 'Hacer las cosas bien.', traba: 'No se permite un error, y se enoja en silencio cuando los demás no cumplen.', escena: 'Revisa tres veces un escrito antes de mandarlo, y corrige el de los demás aunque nadie se lo pida.' },
  2: { nombre: 'el vínculo', mueve: 'Ser importante para los demás.', traba: 'Da sin que se lo pidan y le cuesta muchísimo pedir para sí.', escena: 'Se queda después de hora ayudando a todos, y se ofende si nadie lo nota.' },
  3: { nombre: 'el logro', mueve: 'Valer por lo que consigue.', traba: 'No sabe parar, y cuando algo no funciona lo vive como un fracaso propio.', escena: 'En la primera entrevista ya pregunta cuándo va a ver resultados.' },
  4: { nombre: 'la autenticidad', mueve: 'Ser fiel a lo que siente y encontrar a alguien que lo entienda de verdad.', traba: 'Se siente distinto a los demás, y a veces incomprendido.', escena: 'Necesita sentir que lo entendés antes de escuchar cualquier solución.' },
  5: { nombre: 'el conocimiento', mueve: 'Entender antes de actuar.', traba: 'Se guarda, se aísla y siente que no le alcanza la energía para los demás.', escena: 'Pide toda la información por escrito y decide recién cuando la leyó entera.' },
  6: { nombre: 'la seguridad', mueve: 'Tener respaldo y saber con quién cuenta.', traba: 'Duda, pide otra opinión y anticipa todo lo que puede salir mal.', escena: 'Pregunta cinco veces "¿y si sale mal?" antes de firmar.' },
  7: { nombre: 'la libertad', mueve: 'Disfrutar y tener opciones abiertas.', traba: 'Se escapa cuando algo duele o se vuelve aburrido.', escena: 'Se entusiasma con la propuesta y se pierde en la letra chica.' },
  8: { nombre: 'la fuerza', mueve: 'Proteger y no depender de nadie.', traba: 'Toma el control y le cuesta muchísimo mostrarse vulnerable.', escena: 'En el primer encuentro te pone a prueba para ver si sos de fiar.' },
  9: { nombre: 'la paz', mueve: 'Que haya armonía.', traba: 'Se posterga para evitar el conflicto, hasta no saber qué quiere.', escena: 'Dice que está todo bien, y después no hace lo que acordaron.' },
};

// Lo que cambia, en tres lugares del trabajo
const USOS = [
  { icono: Handshake, titulo: 'Con tus clientes', items: [
    'En la primera conversación ya intuís qué mueve a la persona que tenés enfrente.',
    'Sabés cómo hablarle a cada uno para que te escuche y confíe.',
    'Das una mala noticia sabiendo cómo la va a recibir.',
  ] },
  { icono: Users, titulo: 'Con tu equipo', items: [
    'Entendés por qué dos personas chocan, y qué necesita cada una.',
    'Repartís las tareas según cómo funciona cada persona.',
    'Das devoluciones que se reciben, en lugar de discusiones.',
  ] },
  { icono: UserRound, titulo: 'Con vos', items: [
    'Ves qué parte de tu forma de ser se mete en tu trabajo.',
    'Trabajás con más humanidad sin perder profesionalismo.',
    'Y de paso, te entendés mejor a vos y a tu gente.',
  ] },
];

const CAMINOS = [
  { titulo: 'Si nunca lo estudiaste', bajada: 'Aprendés las bases, desde cero.', items: [
    'Descubrís tu tipo con el test de EneaTeams.',
    'Entendés qué es el Eneagrama, los tres centros y los nueve tipos.',
    'Empezás a reconocerlos en las personas con las que trabajás.',
    'Preguntás en los vivos lo que no te quedó claro.',
  ] },
  { titulo: 'Si ya lo conocés', bajada: 'Saber tu tipo es solo el principio.', items: [
    'Encontrás con quién practicarlo: colegas de distintas profesiones que hablan tu mismo idioma.',
    'Casos reales en los vivos con Cecilia, para que la herramienta no quede en la teoría.',
    'El laboratorio y los retos del mes, para mantenerla en práctica.',
    'Fichas de cada tipo para repasar antes de una conversación importante.',
  ] },
];

// Lo que incluye la comunidad: cuatro pilares y dos herramientas
const PILARES = [
  { icono: BookOpen, titulo: 'Cursos grabados', bajada: 'Las bases del Eneagrama, a tu ritmo.', items: [
    'Qué es el Eneagrama y qué no es.',
    'Los tres centros: cuerpo, corazón y mente.',
    'Los nueve tipos: qué mueve a cada uno y cómo se nota en el trabajo.',
    'Primeras claves para reconocerlos en las personas con las que trabajás.',
    'Lecciones cortas, de 8 a 15 minutos.',
  ] },
  { icono: CalendarDays, titulo: 'Dos clases en vivo por mes', bajada: 'Para preguntar y ver casos reales, con Cecilia.', items: [
    'Una clase para profundizar un tema, con tiempo para preguntas.',
    'Un encuentro de casos: traés una situación de tu trabajo y la pensamos en grupo.',
    'Los casos se comparten sin datos que identifiquen a nadie.',
    'Si no llegás, quedan grabadas.',
  ] },
  { icono: MessagesSquare, titulo: 'Networking con colegas', bajada: 'Para compartir estrategias con otros profesionales.', items: [
    'Abogados, psicólogos, coaches, docentes y profesionales de la salud y de RRHH que usan la misma herramienta.',
    'Compartís lo que te funcionó con un cliente y ves cómo lo aplica cada profesión.',
    'Un directorio por profesión y país para conectar, derivar o armar alianzas.',
    'Retos de práctica cada mes, y puntos que abren nuevos cursos.',
  ] },
  { icono: Library, titulo: 'Material para tu trabajo', bajada: 'Para tener a mano antes de cada conversación.', items: [
    'Fichas de cada tipo: qué lo mueve, cómo hablarle y qué evitar.',
    'Preguntas sencillas para reconocer cada tipo en una conversación.',
    'Meditaciones y ejercicios para trabajar tu propio tipo.',
  ] },
];

const EXTRAS = [
  { icono: Users, titulo: 'EneaTeams', texto: 'La plataforma de Eneagrama de Cecilia: tu test completo con el informe de tu tipo, y el mapa de tu equipo.' },
  { icono: Sparkles, titulo: 'Laboratorio de práctica', texto: 'Una conversación con un cliente simulado por IA, de un tipo que no conocés. Al final te devuelve qué viste y qué se te pasó.' },
];

const PARA_VOS = [
  'Trabajás con personas y sentís que la técnica no siempre te alcanza para llegarles.',
  'Estás dispuesto a observarte con honestidad antes de observar a los demás.',
  'Querés trabajar con más humanidad sin perder profesionalismo.',
  'Nunca estudiaste el Eneagrama y querés aprenderlo para aplicarlo, no como teoría.',
  'Ya lo conocés, pero te cuesta llevarlo a tus conversaciones de trabajo.',
  'Preferís aprender con colegas y con casos reales, no solo con videos.',
];

// Testimonios. Se cargan de cuatro formas:
//   video:  url de YouTube, Vimeo o un .mp4 en public/testimonios/
//   audio:  url de un .mp3 o .m4a en public/testimonios/ (por ejemplo un audio de WhatsApp), con una frase en "texto"
//   imagen: captura de un mensaje en public/testimonios/
//   texto:  la frase escrita
// "detalle" es la profesión o el programa de la persona.
type Testimonio = { tipo: 'video' | 'audio' | 'imagen' | 'texto'; nombre: string; detalle: string; texto?: string; url?: string };
const TESTIMONIOS: Testimonio[] = [
  { tipo: 'texto', texto: 'Cecilia tiene una calidez única. Su método me ayudó a entender por qué repetía los mismos patrones y cómo liberarme de ellos con amor y consciencia.', nombre: 'María G.', detalle: 'Mentoría' },
  { tipo: 'texto', texto: 'La diplomatura cambió mi forma de ver el mundo. No solo aprendí teoría, sino que viví una transformación personal profunda que ahora aplico en mi profesión.', nombre: 'Gemma J. Fares', detalle: 'Diplomatura' },
  { tipo: 'texto', texto: 'Agradecida a la vida por haberte encontrado este año. Gracias por enseñarme tantas cosas.', nombre: 'Majo E.', detalle: 'Mentoría' },
];

const INCLUYE_PRECIO = [
  'Cursos grabados con las bases del Eneagrama',
  'Dos clases en vivo por mes con Cecilia',
  'Networking con profesionales de distintas áreas',
  'Fichas de cada tipo para tu trabajo',
  'EneaTeams y laboratorio de práctica',
];

const FAQ = [
  ['¿Necesito saber algo de Eneagrama?', 'No. Si nunca lo estudiaste, arrancás haciendo tu test y las primeras clases explican todo desde cero, con ejemplos de distintos trabajos.'],
  ['Ya conozco el Eneagrama. ¿Me sirve?', 'Sí. Los cursos son las bases y podés repasarlas cuando quieras, pero lo que más vas a aprovechar es la comunidad: los casos en vivo con Cecilia, la práctica en el laboratorio y el networking con colegas que usan la misma herramienta. Si buscás profundidad, la Diplomatura es el camino.'],
  ['Mi profesión no es psicología ni coaching. ¿Me sirve?', 'Sí. Está pensada para cualquier trabajo con personas del otro lado: derecho, salud, educación, recursos humanos, equipos. Hay ejemplos y casos de cada área.'],
  ['¿El Eneagrama es algo esotérico?', 'Es un modelo de personalidad que describe qué motiva a cada persona y cómo reacciona. Se usa en empresas, en psicoterapia y en coaching. Acá lo aprendés con casos concretos y cada herramienta te dice para qué sirve y cuándo usarla.'],
  ['¿Con quién voy a compartir la comunidad?', 'Con profesionales de distintas áreas que trabajan con personas: abogados, psicólogos, coaches, docentes, gente de salud y de recursos humanos. Esa mezcla es parte del valor: ves cómo usa la misma herramienta alguien que trabaja distinto que vos.'],
  ['¿Me sirve también en lo personal?', 'Sí. Para usarlo con otros primero entendés tu propio tipo, y eso se nota en tus vínculos. Pero el foco de la Academia es aplicarlo en tu trabajo.'],
  ['¿Reemplaza una terapia o mi formación profesional?', 'No. El Eneagrama es un mapa de observación que suma a lo que ya sabés hacer, siempre dentro del alcance y la ética de tu profesión. No reemplaza una terapia, un diagnóstico ni tu formación.'],
  ['¿Cuánto tiempo necesito?', 'Con media hora por semana avanzás. Las lecciones duran entre 8 y 15 minutos. Los vivos se anuncian en el calendario con el horario de tu país y quedan grabados.'],
  ['¿Qué diferencia hay con la Diplomatura?', 'La Academia te da las bases del Eneagrama y una comunidad para practicarlo, a tu ritmo y con colegas. La Diplomatura es la formación completa y en profundidad para trabajar como eneagramista, con práctica supervisada y diploma. Mucha gente empieza por acá.'],
  ['¿Qué pasa con el precio? ¿Puedo cancelar?', 'Las primeras 100 personas pagan USD 39 por mes y mantienen ese precio mientras sigan en la Academia. Después, el precio es USD 59. Es una suscripción sin permanencia y la cancelás cuando quieras.'],
  ['¿Cómo pago desde fuera de Argentina?', 'Escribinos por WhatsApp y te pasamos la forma de pago para tu país.'],
];

// Números reales de Cecilia. Se muestran fijos, sin contadores que arranquen en cero.
const CIFRAS = [
  { dato: '7 años', texto: 'trabajando con el Eneagrama' },
  { dato: '+1.800', texto: 'personas acompañadas' },
];

const retraso = (i: number, cada = 3) => ({ '--retraso': `${(i % cada) * 110}ms` }) as CSSProperties;

// Título y bajada de cada sección, siempre centrados
function Encabezado({ titulo, texto, oscuro = false }: { titulo: ReactNode; texto?: ReactNode; oscuro?: boolean }) {
  return (
    <div className="revelar flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-[2.6rem] font-extrabold leading-[1.15]">{titulo}</h2>
      {texto && <p className={`text-lg ${oscuro ? 'text-crema/75' : 'text-gris'}`}>{texto}</p>}
    </div>
  );
}

function Icono({ icono: I, oscuro = false }: { icono: typeof BookOpen; oscuro?: boolean }) {
  return (
    <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${oscuro ? 'bg-oro/15 text-oro-claro' : 'bg-oro-suave text-oro'}`}>
      <I className="w-5 h-5" />
    </span>
  );
}

function TarjetaTestimonio({ t, style }: { t: Testimonio; style: CSSProperties }) {
  const embed = t.tipo === 'video' && t.url ? urlEmbed(t.url) : null;
  return (
    <figure style={style} className="revelar tarjeta p-5 flex flex-col items-center text-center gap-4 overflow-hidden">
      {t.tipo === 'video' && t.url && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-tinta">
          {embed
            ? <iframe src={embed} title={`Testimonio de ${t.nombre}`} className="absolute inset-0 w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
            : <video src={t.url} controls playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />}
        </div>
      )}
      {t.tipo === 'audio' && t.url && (
        <div className="w-full flex flex-col items-center gap-3 bg-oro-suave rounded-xl px-4 py-5">
          <Mic className="w-6 h-6 text-oro" />
          <audio src={t.url} controls preload="metadata" className="w-full" />
        </div>
      )}
      {t.tipo === 'imagen' && t.url && <img src={t.url} alt={`Mensaje de ${t.nombre}`} loading="lazy" className="w-full rounded-xl border border-linea" />}
      {t.texto && <blockquote className="text-gris leading-relaxed">"{t.texto}"</blockquote>}
      <figcaption className="mt-auto">
        <p className="font-bold">{t.nombre}</p>
        <p className="text-sm text-gris">{t.detalle}</p>
      </figcaption>
    </figure>
  );
}

// Video propio (.mp4): muestra la portada con un botón de play grande y, al tocarlo,
// arranca con sonido y con los controles del navegador.
export function IconoWhatsApp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function VideoPropio() {
  const ref = useRef<HTMLVideoElement>(null);
  const [empezado, setEmpezado] = useState(false);
  const reproducir = () => { setEmpezado(true); ref.current?.play().catch(() => {}); };
  return (
    <>
      <video ref={ref} src={VSL} poster={VSL_PORTADA} controls={empezado} playsInline preload="metadata"
        className="absolute inset-0 w-full h-full object-cover" onPlay={() => setEmpezado(true)} />
      {!empezado && (
        <button type="button" onClick={reproducir} aria-label="Ver el video de Cecilia"
          className="absolute inset-0 flex items-center justify-center bg-tinta/15 hover:bg-tinta/5 transition-colors group">
          <span className="w-20 h-20 rounded-full bg-oro/95 text-white flex items-center justify-center shadow-xl shadow-black/30 group-hover:scale-105 transition-transform">
            <Play className="w-9 h-9 fill-current ml-1" />
          </span>
        </button>
      )}
    </>
  );
}

function VideoCecilia() {
  const embed = VSL ? urlEmbed(VSL) : null;
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-tinta shadow-2xl shadow-oro/15 ring-1 ring-oro/30">
      {embed ? (
        <iframe src={embed} title="Cecilia te cuenta qué es la Academia" className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : VSL ? (
        <VideoPropio />
      ) : (
        <>
          <img src="/cecilia.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-t from-tinta via-tinta/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-crema text-center px-6">
            <span className="w-16 h-16 rounded-full bg-oro/90 flex items-center justify-center"><Play className="w-7 h-7 fill-current ml-1" /></span>
            <p className="font-display font-bold text-lg">Cecilia te cuenta qué es la Academia</p>
            <p className="text-sm text-crema/70">El video se publica muy pronto</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function Landing() {
  const { perfil } = useAuth();
  const [info, setInfo] = useState<{ miembros: number; proximo: { titulo: string; inicio: string } | null } | null>(null);
  const [abierta, setAbierta] = useState<number | null>(0);
  const [tipo, setTipo] = useState(6);

  // Cada bloque con la clase "revelar" aparece suave al entrar en pantalla.
  // Solo se ocultan si el navegador puede mostrarlos después (clase "animado" en <html>).
  useLayoutEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const raiz = document.documentElement;
    raiz.classList.add('animado');
    const io = new IntersectionObserver(entradas => entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.revelar').forEach(el => io.observe(el));
    return () => { io.disconnect(); raiz.classList.remove('animado'); };
  }, []);

  const [verArriba, setVerArriba] = useState(false);
  useEffect(() => {
    const alBajar = () => setVerArriba(window.scrollY > 900);
    alBajar();
    window.addEventListener('scroll', alBajar, { passive: true });
    return () => window.removeEventListener('scroll', alBajar);
  }, []);

  useEffect(() => {
    fetch('/api/academia?action=publico-info').then(r => r.ok ? r.json() : null).then(setInfo).catch(() => {});
  }, []);

  const cta = perfil ? '/app' : '/registro';
  const t = TIPOS[tipo];
  const precio = usePrecio();

  // Precio de lanzamiento mientras haya menos de 100 miembros; después, el de lista sin tachar
  const restantes = Math.max(0, CUPO_LANZAMIENTO - (info?.miembros ?? 0));
  const lanzamiento = restantes > 0;
  const mensual = precio.fmt(lanzamiento ? PRECIO_USD : PRECIO_LISTA_USD);
  const cupos = info && lanzamiento ? `Quedan ${restantes} de ${CUPO_LANZAMIENTO} lugares a este precio.` : null;

  return (
    <div className="min-h-screen">
      {/* Barra */}
      <header className="sticky top-0 z-30 bg-crema/90 backdrop-blur border-b border-linea">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <span className="text-tinta shrink-0"><Eneagrama tam={30} /></span>
            <span className="font-display font-extrabold tracking-tight truncate">Academia <span className="text-oro">Eneascoaching</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm text-gris whitespace-nowrap">
            <a href="#profesiones" className="hover:text-tinta">Para quién es</a>
            <a href="#incluye" className="hover:text-tinta">Qué incluye</a>
            <a href="#precio" className="hover:text-tinta">Precio</a>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {!perfil && <Link to="/entrar" className="text-sm font-medium px-3 py-2 hover:text-oro">Ingresar</Link>}
            <Link to={cta} className="btn btn-oscuro !py-2 !px-4 text-sm">{perfil ? 'Ir a la academia' : 'Sumarme'}</Link>
          </div>
        </div>
      </header>

      {/* Promesa, video y bajada */}
      <section className="max-w-4xl mx-auto px-5 pt-12 pb-16 md:pt-16 md:pb-20 flex flex-col items-center text-center gap-7">
        <h1 className="text-[2.3rem] md:text-[3.6rem] leading-[1.05] font-extrabold tracking-tight">
          Sabés hacer tu trabajo.<br />
          <span className="text-oro">Ahora aprendé a leer a las personas.</span>
        </h1>
        <div className="w-full"><VideoCecilia /></div>
        <p className="text-lg md:text-xl text-gris max-w-xl">
          El Eneagrama aplicado a tu trabajo, con Cecilia B. Sánchez.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-3 w-full sm:w-auto">
          <Link to={cta} className="btn btn-oro btn-grande">Quiero sumarme por {mensual} al mes <ArrowRight className="w-5 h-5" /></Link>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-grande"><IconoWhatsApp className="w-5 h-5" /> Consultar por WhatsApp</a>
        </div>
        <div className="flex flex-col items-center gap-2 text-sm text-gris">
          <div className="flex flex-wrap justify-center items-center gap-3">
            {lanzamiento
              ? <span>Precio de lanzamiento: <s className="tabular-nums">{precio.fmt(PRECIO_LISTA_USD)}</s> <strong className="text-tinta tabular-nums">{mensual}</strong> por mes</span>
              : <span><strong className="text-tinta tabular-nums">{mensual}</strong> por mes</span>}
            {precio.disponible && <SelectorMoneda moneda={precio.moneda} elegir={precio.elegir} />}
          </div>
          {cupos && <span className="font-semibold text-oro">{cupos}</span>}
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gris">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Para quien empieza y para quien ya lo conoce</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Para cualquier profesión con personas</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Cancelás cuando quieras</span>
          {info?.proximo && (
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Próximo vivo: {new Date(info.proximo.inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
          )}
        </div>
      </section>

      {/* Dolores */}
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-20 flex flex-col items-center gap-12">
          <Encabezado oscuro titulo={<>Sabés qué hay que hacer.<br /><span className="text-oro-claro">El desafío es la persona que tenés enfrente.</span></>} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {ESCENAS.map((e, i) => (
              <div key={e} style={retraso(i)} className="revelar rounded-2xl border border-white/10 bg-white/[.04] p-6 flex flex-col items-center text-center gap-4">
                <Icono icono={MessageCircleWarning} oscuro />
                <p className="text-crema/90 text-[15.5px] leading-relaxed">{e}</p>
              </div>
            ))}
          </div>
          <p className="revelar text-crema text-xl md:text-2xl font-display font-bold leading-snug max-w-3xl text-center">
            En cualquier trabajo con personas, la técnica resuelve la mitad. La otra mitad es humana: qué mueve a cada uno, qué teme y cómo escucha. El Eneagrama es el mapa de esa mitad.
          </p>
        </div>
      </section>

      {/* Profesiones */}
      <section id="profesiones" className="bg-oro-suave scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20 flex flex-col items-center gap-12">
          <Encabezado
            titulo="En tu profesión, la diferencia es humana"
            texto="La Academia es para cualquier persona que trabaja con otras personas. Aprendés a usar el Eneagrama con casos de tu área." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {PROFESIONES.map((p, i) => (
              <div key={p.titulo} style={retraso(i)} className="revelar tarjeta p-6 flex flex-col items-center text-center gap-3">
                <Icono icono={p.icono} />
                <h3 className="font-bold text-lg">{p.titulo}</h3>
                <p className="text-gris text-[15px] leading-relaxed">{p.texto}</p>
              </div>
            ))}
          </div>
          <p className="revelar text-gris text-center max-w-2xl">¿Trabajás en ventas, atención al público, una empresa familiar u otra área? También es para vos: si hay una persona del otro lado, sirve.</p>
        </div>
      </section>

      {/* Qué es el Eneagrama, interactivo */}
      <section id="eneagrama" className="max-w-4xl mx-auto px-5 py-20 scroll-mt-16 flex flex-col items-center gap-8">
        <Encabezado
          titulo="Nueve tipos, nueve formas de reaccionar"
          texto="El Eneagrama no mira solo lo que una persona hace, sino por qué lo hace. Dos clientes pueden no firmar por motivos opuestos: uno por miedo a que salga mal, otro porque siente que no lo escuchaste. Si ves el motivo, sabés qué decir." />
        <div className="revelar relative flex justify-center text-tinta">
          <div className="absolute inset-8 rounded-full bg-oro-suave blur-2xl opacity-80" aria-hidden />
          <div className="relative"><Eneagrama tam={380} resaltar={tipo} onElegir={setTipo} /></div>
        </div>
        <p className="text-sm text-gris text-center -mt-4">Tocá un número para ver cada tipo.</p>
        <div className="revelar tarjeta p-6 md:p-8 flex flex-col items-center text-center gap-3 w-full max-w-2xl" aria-live="polite">
          <p className="font-display font-extrabold text-2xl"><span className="text-oro">Tipo {tipo}</span>, {t.nombre}</p>
          <p className="text-[15px]"><span className="font-semibold">Qué lo mueve:</span> <span className="text-gris">{t.mueve}</span></p>
          <p className="text-[15px]"><span className="font-semibold">Dónde se traba:</span> <span className="text-gris">{t.traba}</span></p>
          <p className="text-[15px] bg-oro-suave rounded-lg px-4 py-2.5"><span className="font-semibold">En tu trabajo:</span> {t.escena}</p>
        </div>
      </section>

      {/* Lo que cambia, y el laboratorio */}
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-20 flex flex-col items-center gap-12">
          <Encabezado oscuro titulo="Lo que cambia cuando sabés leer a las personas" texto="Lo vas a notar en tres lugares." />
          <div className="grid md:grid-cols-3 gap-4 w-full">
            {USOS.map((u, i) => (
              <div key={u.titulo} style={retraso(i)} className="revelar rounded-2xl border border-white/10 bg-white/[.04] p-7 flex flex-col items-center text-center gap-4">
                <Icono icono={u.icono} oscuro />
                <h3 className="font-bold text-xl">{u.titulo}</h3>
                <ul className="flex flex-col gap-3 text-crema/75 text-[15px] leading-relaxed">
                  {u.items.map(x => <li key={x}>{x}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center gap-6 w-full pt-4">
            <div className="revelar flex flex-col items-center text-center gap-3 max-w-2xl">
              <h3 className="font-display font-extrabold text-2xl md:text-3xl">Y para practicar, un cliente que no sabés de qué tipo es</h3>
              <p className="text-crema/75">La IA hace de cliente en una primera conversación. Vos preguntás y formulás tu hipótesis. Al final te muestra el tipo real y las señales que se te pasaron.</p>
            </div>
            <div className="revelar bg-crema text-tinta rounded-2xl p-5 flex flex-col gap-3 shadow-xl shadow-black/30 w-full max-w-xl">
              <div className="self-end max-w-[85%] bg-tinta text-crema rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">¿Qué sentiste cuando tu socia tomó esa decisión sin consultarte?</div>
              <div className="self-start max-w-[85%] bg-white border border-linea rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">Nada grave, la verdad. Está bien, prefiero que no haya lío. Igual después me quedé ordenando papeles hasta tarde, que hacía rato que los tenía pendientes.</div>
              <div className="self-end max-w-[85%] bg-tinta text-crema rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">Decís que está bien, pero te quedaste hasta tarde con otra cosa. ¿Qué no dijiste?</div>
              <div className="mt-2 rounded-xl border border-oro/40 bg-oro-suave px-4 py-3 text-sm text-center">
                <p className="text-gris">Acertaste: era <strong className="text-tinta">tipo 9</strong>. "Está bien, prefiero que no haya lío" y el refugio en tareas secundarias eran las señales más claras.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dos puntos de partida */}
      <section className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-12">
        <Encabezado titulo="Sepas o no de Eneagrama, hay algo para vos" texto="La Academia te da las bases y una comunidad para practicar. Si después buscás profundidad, la Diplomatura y las mentorías son el siguiente paso." />
        <div className="grid md:grid-cols-2 gap-4">
          {CAMINOS.map((c, i) => (
            <div key={c.titulo} style={retraso(i, 2)} className="revelar tarjeta p-7 md:p-8 flex flex-col items-center text-center gap-5">
              <div className="flex flex-col items-center gap-1"><h3 className="font-display font-extrabold text-2xl">{c.titulo}</h3><p className="text-oro font-semibold text-[15px]">{c.bajada}</p></div>
              <ul className="flex flex-col items-center gap-4">
                {c.items.map(x => (
                  <li key={x} className="flex flex-col items-center gap-2">
                    <Check className="w-5 h-5 text-oro" />
                    <span className="text-gris text-[15px] leading-relaxed max-w-sm">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Qué incluye */}
      <section id="incluye" className="max-w-6xl mx-auto px-5 pb-20 scroll-mt-16 flex flex-col gap-10">
        <Encabezado titulo="Todo lo que incluye la comunidad" texto="Cuatro pilares para aprender las bases, practicar y pensar con otros, y dos herramientas para usar en tu trabajo." />
        <div className="grid md:grid-cols-2 gap-4">
          {PILARES.map((p, i) => (
            <div key={p.titulo} style={retraso(i, 2)} className="revelar tarjeta p-7 md:p-8 flex flex-col items-center text-center gap-3">
              <Icono icono={p.icono} />
              <h3 className="font-bold text-xl">{p.titulo}</h3>
              <p className="text-oro font-semibold text-[15px]">{p.bajada}</p>
              <ul className="flex flex-col gap-2.5 text-gris text-[15px] leading-relaxed mt-1">
                {p.items.map(x => <li key={x}>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <h3 className="revelar font-display font-extrabold text-2xl text-center pt-4">Y además, dos herramientas</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {EXTRAS.map((x, i) => (
            <div key={x.titulo} style={retraso(i, 2)} className="revelar tarjeta p-6 flex flex-col items-center text-center gap-3">
              <Icono icono={x.icono} />
              <h3 className="font-bold text-lg">{x.titulo}</h3>
              <p className="text-gris text-[15px] leading-relaxed">{x.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Es para vos si */}
      <section className="bg-oro-suave">
        <div className="max-w-5xl mx-auto px-5 py-20 flex flex-col items-center gap-10">
          <Encabezado titulo="La Academia es para vos si te reconocés en alguna de estas" />
          <ul className="grid sm:grid-cols-2 gap-4 w-full">
            {PARA_VOS.map((p, i) => (
              <li key={p} style={retraso(i, 2)} className="revelar tarjeta p-5 flex flex-col items-center text-center gap-3 text-[15px]">
                <Check className="w-5 h-5 text-oro" />{p}
              </li>
            ))}
          </ul>
          <Link to={cta} className="btn btn-oro btn-grande">Sí, quiero sumarme <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* Cecilia y testimonios */}
      <section className="max-w-6xl mx-auto px-5 py-20 flex flex-col items-center gap-14">
        <div className="revelar flex flex-col items-center text-center gap-5 max-w-2xl">
          <img src="/cecilia.jpg" alt="Cecilia B. Sánchez" className="w-44 h-44 md:w-52 md:h-52 rounded-full object-cover ring-4 ring-oro-suave" />
          <h2 className="text-3xl md:text-4xl font-extrabold">Cecilia B. Sánchez</h2>
          <p className="text-gris text-lg">Abogada, coach ontológica y eneagramista. Sabe por experiencia propia que en el trabajo no todo es técnica. Trabaja con el Eneagrama hace 7 años, creó el método Eneascoaching, acompañó a más de 1.800 personas y forma profesionales en su Diplomatura en Eneagrama.</p>
        </div>
        <div className="revelar grid grid-cols-2 gap-4 w-full max-w-xl">
          {CIFRAS.map(c => (
            <div key={c.dato} className="flex flex-col items-center text-center gap-1">
              <span className="font-display font-extrabold text-4xl md:text-5xl text-oro tabular-nums">{c.dato}</span>
              <span className="text-gris text-[15px]">{c.texto}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-8 w-full">
          <h3 className="revelar font-display font-extrabold text-2xl text-center">Lo que dicen quienes trabajaron con Cecilia</h3>
          <div className="grid md:grid-cols-3 gap-4 w-full items-start">
            {TESTIMONIOS.map((x, i) => <TarjetaTestimonio key={x.nombre + i} t={x} style={retraso(i)} />)}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section id="precio" className="bg-tinta text-crema scroll-mt-16">
        <div className="max-w-4xl mx-auto px-5 py-20 flex flex-col items-center gap-10">
          <Encabezado oscuro
            titulo="Todo esto, por una cuota mensual y sin permanencia"
            texto="Si después querés formarte como eneagramista, o implementar el Eneagrama en tu empresa, la Diplomatura y las mentorías de Cecilia siguen disponibles. La Academia es el mejor lugar para empezar." />
          <div className="revelar bg-crema text-tinta rounded-2xl p-8 flex flex-col items-center text-center gap-5 w-full max-w-md">
            {precio.disponible && <SelectorMoneda moneda={precio.moneda} elegir={precio.elegir} />}
            <div className="flex flex-col items-center gap-1">
              {lanzamiento && <p className="text-gris text-lg tabular-nums"><s>{precio.fmt(PRECIO_LISTA_USD)}</s></p>}
              <p className="font-display font-extrabold text-[2.6rem] sm:text-5xl leading-none tabular-nums">{mensual}</p>
              <p className="text-gris">{lanzamiento ? 'por mes, precio de lanzamiento' : 'por mes'}</p>
            </div>
            {cupos && <p className="text-sm font-semibold text-oro">{cupos} Quien entra ahora lo mantiene mientras siga en la Academia.</p>}
            <ul className="flex flex-col items-center gap-2.5 text-[15px]">
              {INCLUYE_PRECIO.map(x => (
                <li key={x} className="flex items-start gap-2"><Check className="w-5 h-5 text-oro shrink-0" />{x}</li>
              ))}
            </ul>
            <Link to={cta} className="btn btn-oro w-full !py-3.5 text-base">Sumarme ahora</Link>
            <p className="text-sm text-gris">{precio.nota} Sin permanencia.</p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full !py-3.5 text-base"><IconoWhatsApp className="w-5 h-5" /> Consultar por WhatsApp</a>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href={`${WEB}/diplomatura`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver la Diplomatura</a>
            <a href={`${WEB}/mentorias/premium`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver las mentorías</a>
          </div>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="max-w-3xl mx-auto px-5 py-20 flex flex-col gap-8">
        <Encabezado titulo="Preguntas frecuentes" />
        <div className="revelar flex flex-col gap-3">
          {FAQ.map(([p, r], i) => (
            <div key={p} className="tarjeta">
              <button onClick={() => setAbierta(abierta === i ? null : i)} aria-expanded={abierta === i} className="w-full flex items-center justify-center gap-3 text-center px-5 py-4 font-semibold">
                {p}<ChevronDown className={`w-5 h-5 text-gris shrink-0 transition-transform ${abierta === i ? 'rotate-180' : ''}`} />
              </button>
              {abierta === i && <p className="px-6 pb-5 -mt-1 text-gris text-center">{r}</p>}
            </div>
          ))}
        </div>
        <div className="revelar flex flex-col items-center text-center gap-3 pt-2">
          <p className="text-gris">¿Te quedó alguna duda? Hablá con nosotros antes de decidir.</p>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-grande"><IconoWhatsApp className="w-5 h-5" /> Consultar por WhatsApp</a>
        </div>
      </section>

      {/* Cierre */}
      <section className="max-w-4xl mx-auto px-5 pb-20">
        <div className="revelar rounded-3xl bg-tinta text-crema px-6 py-14 md:px-14 flex flex-col items-center text-center gap-5">
          <span className="text-crema/80"><Eneagrama tam={64} /></span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">Detrás de cada caso hay una persona. <span className="text-oro-claro">Aprendé a leerla.</span></h2>
          <Link to={cta} className="btn btn-oro btn-grande">Quiero sumarme por {mensual} al mes <ArrowRight className="w-4 h-4" /></Link>
          {cupos && <p className="text-sm text-crema/70">{cupos}</p>}
        </div>
      </section>

      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" aria-label="Consultar por WhatsApp"
        className="fixed right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 flex items-center justify-center transition-transform hover:scale-105"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
        <IconoWhatsApp className="w-7 h-7" />
      </a>

      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Volver arriba"
        className={`fixed right-5 z-40 w-12 h-12 rounded-full bg-tinta text-oro-claro shadow-lg shadow-black/25 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 ${verArriba ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))', right: '1.5rem' }} tabIndex={verArriba ? 0 : -1}>
        <ArrowUp className="w-5 h-5" />
      </button>

      <footer className="border-t border-linea">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col items-center gap-2 text-sm text-gris text-center">
          <span>Academia Eneascoaching · Cecilia B. Sánchez</span>
          <a href={WEB} className="hover:text-oro">cecimentorcoach.com</a>
        </div>
      </footer>
    </div>
  );
}
