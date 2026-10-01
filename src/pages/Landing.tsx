import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarDays, MessagesSquare, Users, Check, ArrowRight, ChevronDown, Play,
  Library, Compass, Heart, Briefcase, UserRound,
} from 'lucide-react';
import Eneagrama from '../components/Eneagrama';
import { useAuth } from '../lib/auth';

const WHATSAPP = 'https://wa.me/5493515632496?text=' + encodeURIComponent('Hola Cecilia! Quiero saber más de la Academia.');
const WEB = 'https://www.cecimentorcoach.com';

// Video de presentación de Cecilia. Acepta un link de YouTube, de Vimeo o un .mp4.
// Mientras no esté cargado, se muestra la foto de Cecilia con el aviso.
const VSL = (import.meta.env.VITE_VSL_URL as string | undefined)?.trim() || '';

function urlEmbed(url: string): string | null {
  const yt = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const ESCENAS = [
  'Discutís con la misma persona por lo mismo y terminás diciendo justo lo que te habías prometido no decir.',
  'Decís que sí cuando querías decir que no, y a la noche te enojás con vos.',
  'Hay alguien en tu trabajo que te saca de quicio y no terminás de entender qué le pasa.',
  'Leíste, hiciste terapia o cursos, y hay un patrón que sigue apareciendo igual.',
  'Acompañás personas, como consultantes, alumnos o un equipo, y sentís que te falta un mapa para leerlas.',
];

const TIPOS: Record<number, { nombre: string; mueve: string; traba: string; escena: string }> = {
  1: { nombre: 'La integridad', mueve: 'Hacer las cosas bien.', traba: 'No se permite descansar hasta que todo esté en orden, y se enoja en silencio cuando los demás no cumplen.', escena: 'Relee por tercera vez un mensaje antes de mandarlo.' },
  2: { nombre: 'El vínculo', mueve: 'Ser importante para quienes quiere.', traba: 'Da sin que se lo pidan y le cuesta muchísimo pedir para ella.', escena: 'Se acuerda del cumpleaños de todos. Cuando nadie se acuerda del suyo, dice que no importa.' },
  3: { nombre: 'El logro', mueve: 'Ser valiosa por lo que consigue.', traba: 'No sabe parar, y cuando no está produciendo no sabe bien qué siente.', escena: 'Se va de vacaciones y el segundo día ya está respondiendo mensajes del trabajo.' },
  4: { nombre: 'La autenticidad', mueve: 'Ser única y que la comprendan de verdad.', traba: 'Se compara y siente que a ella siempre le falta algo que los demás tienen.', escena: 'Mira las fotos de una amiga y siente que la vida de todos es más plena que la suya.' },
  5: { nombre: 'El conocimiento', mueve: 'Entender antes de actuar.', traba: 'Se guarda, se aísla y siente que no le alcanza la energía para los demás.', escena: 'Investiga tres semanas antes de decidir qué heladera comprar.' },
  6: { nombre: 'La seguridad', mueve: 'Tener respaldo y saber con quién cuenta.', traba: 'Duda, pide otra opinión y anticipa todo lo que puede salir mal.', escena: 'Antes de un viaje ya pensó qué hacer si se pierde la valija, si llueve y si cancelan el vuelo.' },
  7: { nombre: 'La libertad', mueve: 'Disfrutar y tener opciones abiertas.', traba: 'Se escapa cuando algo duele o se vuelve aburrido.', escena: 'Tiene cinco proyectos empezados y ya está entusiasmada con el sexto.' },
  8: { nombre: 'La fuerza', mueve: 'Proteger y no depender de nadie.', traba: 'Toma el control y le cuesta muchísimo mostrarse vulnerable.', escena: 'Defiende a una compañera delante de todos y no le cuenta a nadie que esa semana no durmió.' },
  9: { nombre: 'La paz', mueve: 'Que haya armonía.', traba: 'Se posterga para evitar el conflicto, hasta no saber qué quiere.', escena: 'Cuando le preguntan adónde ir a comer, contesta "donde quieran". Siempre.' },
};

const USOS = [
  { icono: UserRound, titulo: 'Con vos misma', texto: 'Reconocer tu tipo, entender de dónde vienen tus reacciones y tener un camino concreto para crecer, con meditaciones y ejercicios pensados para tu tipo.' },
  { icono: Heart, titulo: 'En tus vínculos', texto: 'Entender por qué tu pareja se cierra justo cuando vos querés hablar, cómo pedirle algo a tu hija sin que se ponga a la defensiva y qué necesita cada persona de tu familia para sentirse vista.' },
  { icono: Briefcase, titulo: 'En tu trabajo', texto: 'Leer a tu equipo, a tus compañeros y a tus clientes. Y si acompañás personas, usarlo con tus consultantes con criterio profesional.' },
];

const CAMINO = [
  { titulo: 'Descubrí tu tipo', texto: 'Hacés el test completo y en la primera ruta aprendés a confirmarlo, porque un test orienta pero no decide por vos.' },
  { titulo: 'Entendé el mapa', texto: 'Lecciones de 8 a 15 minutos que explican cada tipo con escenas de la vida real, sin tecnicismos.' },
  { titulo: 'Llevalo a tu vida', texto: 'Rutas para tus vínculos, tu crecimiento personal y tu trabajo, y dos vivos por mes para preguntar lo que te pasa a vos.' },
  { titulo: 'Profundizá', texto: 'Si querés usarlo en tu profesión, tenés una ruta para profesionales y un laboratorio de práctica. Si querés formarte, la Diplomatura.' },
];

const INCLUYE = [
  { icono: BookOpen, titulo: 'Cursos desde cero', texto: 'Seis rutas: Conocete, Tu tipo en el día a día, Crecer con tu tipo, El Eneagrama en el trabajo, El Eneagrama en tu profesión y Eneagrama e IA. Lecciones nuevas todas las semanas.' },
  { icono: CalendarDays, titulo: 'Dos vivos por mes con Cecilia', texto: 'Una clase temática y un encuentro de casos donde traés lo que te pasa con tu pareja, tu equipo o tus consultantes. Si no llegás, queda grabado.' },
  { icono: Library, titulo: 'Biblioteca', texto: 'Meditaciones para cada tipo, frases sanadoras, ejercicios sistémicos y fichas en PDF para imprimir o compartir.' },
  { icono: Compass, titulo: 'Plataforma de Eneagrama', texto: 'Tu test completo con el informe de tu tipo, para empezar sabiendo desde dónde mirás.' },
  { icono: Users, titulo: 'EneaTeams', texto: 'La app para conocer a un equipo: cada integrante hace su test y ves el mapa del grupo, sus fortalezas y sus roces.' },
  { icono: MessagesSquare, titulo: 'Comunidad', texto: 'Personas que están aprendiendo lo mismo que vos. Preguntás, compartís y sumás puntos que abren nuevos cursos.' },
];

const MES = [
  { semana: 'Semana 1', titulo: 'Clase en vivo', texto: 'Un tema a fondo con Cecilia, con tiempo para preguntas.', vivo: true },
  { semana: 'Semana 2', titulo: 'Reto de práctica', texto: 'Un ejercicio para probar con vos, con alguien de tu vida o en tu trabajo.' },
  { semana: 'Semana 3', titulo: 'Casos en vivo', texto: 'Traés una situación real y la miramos juntas con el Eneagrama.', vivo: true },
  { semana: 'Semana 4', titulo: 'Recurso nuevo', texto: 'Una lección, una meditación o un ejercicio que se suma a la Academia.' },
];

const PARA_VOS = [
  'Querés entender por qué reaccionás como reaccionás, y no solo aprender a controlarlo.',
  'Tenés un vínculo que te desgasta y querés dejar de repetir la misma discusión.',
  'Trabajás con personas y querés entenderlas mejor: un equipo, alumnos, pacientes o clientes.',
  'Escuchaste hablar del Eneagrama y querés aprenderlo bien, con alguien que lo enseña hace años.',
  'Te gusta aprender acompañada, con encuentros en vivo y no solo videos.',
  'Ya hiciste un camino de autoconocimiento y buscás una herramienta que ordene todo lo que aprendiste.',
];

const TESTIMONIOS = [
  { texto: 'Cecilia tiene una calidez única. Su método me ayudó a entender por qué repetía los mismos patrones y cómo liberarme de ellos con amor y consciencia.', nombre: 'María G.', programa: 'Mentoría' },
  { texto: 'La diplomatura cambió mi forma de ver el mundo. No solo aprendí teoría, sino que viví una transformación personal profunda que ahora aplico en mi profesión.', nombre: 'Gemma J. Fares', programa: 'Diplomatura' },
  { texto: 'Agradecida a la vida por haberte encontrado este año. Gracias por enseñarme tantas cosas.', nombre: 'Majo E.', programa: 'Mentoría' },
];

const INCLUYE_PRECIO = [
  'Seis rutas de cursos y lecciones nuevas cada semana',
  'Clase en vivo y encuentro de casos con Cecilia, todos los meses',
  'Biblioteca de meditaciones, frases sanadoras y ejercicios',
  'Test completo en la plataforma de Eneagrama',
  'EneaTeams para conocer a tu equipo',
  'Laboratorio de práctica y comunidad',
];

const FAQ = [
  ['¿Necesito saber algo de Eneagrama?', 'No. Arrancás haciendo tu test y la primera ruta explica todo desde cero, con ejemplos de la vida diaria.'],
  ['No soy psicóloga ni coach. ¿Es para mí?', 'Sí. La mayoría de las rutas son para usarlo en tu vida y en tu trabajo, sea cual sea. La ruta para profesionales es una más y la hacés solo si te interesa.'],
  ['¿El Eneagrama es algo esotérico?', 'Es un modelo de personalidad que describe qué te motiva y cómo reaccionás. Se usa en psicoterapia, coaching y empresas. Acá lo aprendés con ejemplos concretos, y cada herramienta te dice para qué sirve y cuándo usarla.'],
  ['¿Cuánto tiempo necesito?', 'Con media hora por semana avanzás. Las lecciones duran entre 8 y 15 minutos y los vivos quedan grabados.'],
  ['¿Qué diferencia hay con la Diplomatura?', 'La Academia es para aprender y practicar a tu ritmo, acompañada. La Diplomatura es la formación completa para trabajar profesionalmente con el Eneagrama, con práctica supervisada y diploma. Muchas empiezan por acá.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí. Es una suscripción mensual sin permanencia y la cancelás cuando quieras.'],
  ['¿Cómo pago desde fuera de Argentina?', 'Escribinos por WhatsApp y te pasamos la forma de pago para tu país.'],
];

function VideoCecilia() {
  const embed = VSL ? urlEmbed(VSL) : null;
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-tinta shadow-2xl shadow-oro/15 ring-1 ring-oro/30">
      {embed ? (
        <iframe src={embed} title="Cecilia te cuenta qué es la Academia" className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      ) : VSL ? (
        <video src={VSL} poster="/cecilia.jpg" controls playsInline className="absolute inset-0 w-full h-full object-cover" />
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
  const [tipo, setTipo] = useState(9);

  useEffect(() => {
    fetch('/api/academia?action=publico-info').then(r => r.ok ? r.json() : null).then(setInfo).catch(() => {});
  }, []);

  const cta = perfil ? '/app' : '/registro';
  const t = TIPOS[tipo];

  return (
    <div className="min-h-screen">
      {/* Barra */}
      <header className="sticky top-0 z-30 bg-crema/90 backdrop-blur border-b border-linea">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <span className="text-tinta shrink-0"><Eneagrama tam={30} /></span>
            <span className="font-display font-extrabold tracking-tight truncate">Academia <span className="text-oro">Eneascoaching</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-gris">
            <a href="#eneagrama" className="hover:text-tinta">Qué es el Eneagrama</a>
            <a href="#incluye" className="hover:text-tinta">Qué incluye</a>
            <a href="#precio" className="hover:text-tinta">Precio</a>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {!perfil && <Link to="/entrar" className="text-sm font-medium px-3 py-2 hover:text-oro">Ingresar</Link>}
            <Link to={cta} className="btn btn-oscuro !py-2 !px-4 text-sm">{perfil ? 'Ir a la academia' : 'Sumarme'}</Link>
          </div>
        </div>
      </header>

      {/* Hero con video */}
      <section className="max-w-4xl mx-auto px-5 pt-12 pb-16 md:pt-16 md:pb-20 flex flex-col items-center text-center gap-6">
        <span className="etiqueta">Academia de Eneagrama · Cecilia B. Sánchez</span>
        <h1 className="text-[2.1rem] md:text-[3.3rem] leading-[1.08] font-extrabold tracking-tight">
          Entendé por qué hacés lo que hacés. <span className="text-oro">Y por qué los demás hacen lo que hacen.</span>
        </h1>
        <p className="text-lg text-gris max-w-2xl">
          El Eneagrama desde cero, para usarlo con vos misma, en tus vínculos y en tu trabajo. Cursos cortos, dos encuentros en vivo por mes con Cecilia y una comunidad que lo practica.
        </p>
        <div className="w-full mt-2"><VideoCecilia /></div>
        <div className="flex flex-wrap justify-center items-center gap-3 mt-2">
          <Link to={cta} className="btn btn-oro text-base !px-7 !py-3.5">Quiero sumarme por USD 39 al mes <ArrowRight className="w-4 h-4" /></Link>
          <a href="#incluye" className="btn btn-borde">Ver qué incluye</a>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gris">
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> No necesitás saber nada de Eneagrama</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Cancelás cuando quieras</span>
          <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> +1.800 personas acompañadas por Cecilia</span>
          {info?.proximo && (
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Próximo vivo: {new Date(info.proximo.inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
          )}
        </div>
      </section>

      {/* Escenas */}
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-16 md:py-20 grid md:grid-cols-[.9fr_1.1fr] gap-10 items-start">
          <div className="flex flex-col gap-4">
            <span className="etiqueta !text-oro-claro">Puede que te pase</span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Hay cosas que se repiten, y no es por falta de voluntad</h2>
          </div>
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col gap-4 text-crema/85">
              {ESCENAS.map(e => (
                <li key={e} className="flex gap-3"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-oro shrink-0" />{e}</li>
              ))}
            </ul>
            <p className="text-crema text-lg border-l-2 border-oro pl-4">
              El Eneagrama es el mapa que falta. Describe nueve formas de mirar el mundo, qué mueve a cada una y dónde se traba. Cuando reconocés la tuya, esas escenas dejan de ser un misterio.
            </p>
          </div>
        </div>
      </section>

      {/* Qué es el Eneagrama, interactivo */}
      <section id="eneagrama" className="max-w-6xl mx-auto px-5 py-20 scroll-mt-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-5 order-2 md:order-1">
          <span className="etiqueta">Si nunca escuchaste hablar del Eneagrama</span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Nueve tipos, nueve motivaciones distintas</h2>
          <p className="text-gris">No es un horóscopo ni una etiqueta. Describe lo que te mueve por dentro, no solo lo que hacés. Dos personas pueden reaccionar igual por motivos opuestos, y ahí está la clave para entenderlas.</p>
          <div className="tarjeta p-6 flex flex-col gap-3" aria-live="polite">
            <p className="font-display font-extrabold text-xl"><span className="text-oro">Tipo {tipo}</span> · {t.nombre}</p>
            <p className="text-[15px]"><span className="font-semibold">Lo que la mueve:</span> <span className="text-gris">{t.mueve}</span></p>
            <p className="text-[15px]"><span className="font-semibold">Dónde se traba:</span> <span className="text-gris">{t.traba}</span></p>
            <p className="text-[15px] bg-oro-suave rounded-lg px-3 py-2">{t.escena}</p>
          </div>
          <p className="text-sm text-gris">Tocá un número del símbolo para ver cada tipo.</p>
        </div>
        <div className="relative flex justify-center text-tinta order-1 md:order-2">
          <div className="absolute inset-8 rounded-full bg-oro-suave blur-2xl opacity-80" aria-hidden />
          <div className="relative"><Eneagrama tam={400} resaltar={tipo} onElegir={setTipo} /></div>
        </div>
      </section>

      {/* Tres usos */}
      <section className="bg-oro-suave">
        <div className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-10">
          <div className="flex flex-col gap-3 max-w-2xl">
            <span className="etiqueta">Para qué te sirve</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">Una herramienta que vas a usar en tres lugares</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {USOS.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="tarjeta p-6 flex flex-col gap-3">
                <span className="w-11 h-11 rounded-xl bg-oro-suave text-oro flex items-center justify-center"><Icono className="w-5 h-5" /></span>
                <h3 className="font-bold text-lg">{titulo}</h3>
                <p className="text-gris text-[15px] leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* El camino */}
      <section className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="etiqueta">Cómo vas a aprender</span>
          <h2 className="text-3xl md:text-4xl font-extrabold">Empezás por vos y llegás a los demás</h2>
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAMINO.map((p, i) => (
            <li key={p.titulo} className="flex flex-col gap-2 border-t-2 border-oro pt-4">
              <span className="font-display font-extrabold text-oro text-sm tabular-nums">Paso {i + 1}</span>
              <h3 className="font-bold text-lg">{p.titulo}</h3>
              <p className="text-gris text-[15px] leading-relaxed">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Qué incluye */}
      <section id="incluye" className="max-w-6xl mx-auto px-5 pb-20 scroll-mt-16 flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="etiqueta">Qué incluye</span>
          <h2 className="text-3xl md:text-4xl font-extrabold">Todo en un solo lugar, por una cuota mensual</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INCLUYE.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="tarjeta p-6 flex flex-col gap-3">
              <span className="w-11 h-11 rounded-xl bg-oro-suave text-oro flex items-center justify-center"><Icono className="w-5 h-5" /></span>
              <h3 className="font-bold text-lg">{titulo}</h3>
              <p className="text-gris text-[15px] leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para profesionales: laboratorio */}
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4">
            <span className="etiqueta !text-oro-claro">Si acompañás personas</span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Practicá con una consultante que no sabés de qué tipo es</h2>
            <p className="text-crema/80 text-lg">Para psicólogas, coaches, terapeutas, docentes y RRHH. La IA hace de consultante en una primera sesión. Vos preguntás, reflejás y formulás tu hipótesis. Al cerrar, te muestra el tipo real, las frases que lo delataban y qué pregunta te hubiera ayudado a confirmarlo.</p>
            <p className="text-crema/70">Se suma a la ruta para profesionales y a los casos en vivo, donde Cecilia trabaja situaciones reales de consultorio.</p>
          </div>
          <div className="bg-crema text-tinta rounded-2xl p-5 flex flex-col gap-3 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between text-xs text-gris"><span>Sesión de práctica</span><span>Tipo oculto</span></div>
            <div className="self-end max-w-[85%] bg-tinta text-crema rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">¿Qué sentiste cuando tu socia tomó esa decisión sin consultarte?</div>
            <div className="self-start max-w-[85%] bg-white border border-linea rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">Nada grave, la verdad. Está bien, prefiero que no haya lío. Igual después me quedé ordenando papeles hasta tarde, que hacía rato que los tenía pendientes.</div>
            <div className="self-end max-w-[85%] bg-tinta text-crema rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">Decís que está bien, pero te quedaste hasta tarde con otra cosa. ¿Qué no dijiste?</div>
            <div className="mt-2 rounded-xl border border-oro/40 bg-oro-suave px-4 py-3 text-sm">
              <p className="font-semibold text-oro">Devolución</p>
              <p className="text-gris mt-1">Acertaste: tipo 9. "Está bien, prefiero que no haya lío" y el refugio en tareas secundarias eran las señales más claras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo es un mes */}
      <section id="mes" className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="etiqueta">Cómo es un mes</span>
          <h2 className="text-3xl md:text-4xl font-extrabold">Algo nuevo cada semana, dos encuentros en vivo</h2>
          <p className="text-gris">Un ritmo fijo para que no quede en otro curso que empezaste y no terminaste.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MES.map(s => (
            <div key={s.semana} className={`tarjeta p-5 flex flex-col gap-2 ${s.vivo ? '!border-oro' : ''}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${s.vivo ? 'text-oro' : 'text-gris'}`}>{s.semana}{s.vivo ? ' · en vivo' : ''}</span>
              <h3 className="font-bold">{s.titulo}</h3>
              <p className="text-gris text-sm">{s.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Es para vos si */}
      <section className="bg-oro-suave">
        <div className="max-w-4xl mx-auto px-5 py-20 flex flex-col gap-8">
          <div className="flex flex-col gap-3 text-center items-center">
            <span className="etiqueta">Para quién es</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">La Academia es para vos si te reconocés en alguna de estas</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-3">
            {PARA_VOS.map(p => (
              <li key={p} className="tarjeta p-4 flex gap-3 text-[15px]"><Check className="w-5 h-5 text-oro shrink-0 mt-0.5" />{p}</li>
            ))}
          </ul>
          <div className="flex justify-center">
            <Link to={cta} className="btn btn-oro text-base !px-7 !py-3.5">Sí, quiero sumarme <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* Cecilia y testimonios */}
      <section className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-10">
        <div className="tarjeta p-6 md:p-10 grid md:grid-cols-[220px_1fr] gap-8 items-center">
          <img src="/cecilia.jpg" alt="Cecilia B. Sánchez" className="w-44 h-44 md:w-56 md:h-56 rounded-2xl object-cover mx-auto" />
          <div className="flex flex-col gap-3">
            <span className="etiqueta">Quién te acompaña</span>
            <h2 className="text-2xl md:text-3xl font-extrabold">Cecilia B. Sánchez</h2>
            <p className="text-gris">Coach ontológica, eneagramista y abogada. Creó el método Eneascoaching, que integra Coaching Ontológico y Eneagrama, acompañó a más de 1.800 personas y forma profesionales en su Diplomatura en Eneagrama.</p>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <h3 className="font-display font-bold text-xl">Lo que dicen quienes trabajaron con Cecilia</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIOS.map(x => (
              <figure key={x.nombre} className="tarjeta p-6 flex flex-col gap-4">
                <blockquote className="text-gris leading-relaxed">"{x.texto}"</blockquote>
                <figcaption className="mt-auto">
                  <p className="font-bold">{x.nombre}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-oro">{x.programa}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Precio */}
      <section id="precio" className="bg-tinta text-crema scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4">
            <span className="etiqueta !text-oro-claro">Precio</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">Todo esto, por menos de lo que cuesta una sesión individual</h2>
            <p className="text-crema/75">Si después querés formarte para trabajar con el Eneagrama, o hacer un proceso personal uno a uno, la Diplomatura y las mentorías de Cecilia siguen disponibles. La Academia es el mejor lugar para empezar.</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href={`${WEB}/diplomatura`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver la Diplomatura</a>
              <a href={`${WEB}/mentorias/premium`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver las mentorías</a>
            </div>
          </div>
          <div className="bg-crema text-tinta rounded-2xl p-8 flex flex-col gap-5">
            <div>
              <p className="etiqueta">Membresía mensual</p>
              <p className="mt-2 flex items-baseline gap-2"><span className="font-display font-extrabold text-5xl tabular-nums">USD 39</span><span className="text-gris">por mes</span></p>
              <p className="text-sm text-gris mt-1">En Argentina se cobra en pesos con Mercado Pago. Sin permanencia.</p>
            </div>
            <ul className="flex flex-col gap-2.5 text-[15px]">
              {INCLUYE_PRECIO.map(x => (
                <li key={x} className="flex gap-2.5"><Check className="w-5 h-5 text-oro shrink-0" />{x}</li>
              ))}
            </ul>
            <Link to={cta} className="btn btn-oro w-full !py-3.5 text-base">Sumarme ahora</Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-center text-sm text-gris hover:text-oro">¿Tenés dudas? Escribile a Cecilia por WhatsApp</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-20 flex flex-col gap-8">
        <h2 className="text-3xl font-extrabold text-center">Preguntas frecuentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ.map(([p, r], i) => (
            <div key={p} className="tarjeta">
              <button onClick={() => setAbierta(abierta === i ? null : i)} aria-expanded={abierta === i} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold">
                {p}<ChevronDown className={`w-5 h-5 text-gris shrink-0 transition-transform ${abierta === i ? 'rotate-180' : ''}`} />
              </button>
              {abierta === i && <p className="px-5 pb-5 -mt-1 text-gris">{r}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Cierre */}
      <section className="max-w-4xl mx-auto px-5 pb-20">
        <div className="rounded-3xl bg-tinta text-crema px-6 py-14 md:px-14 flex flex-col items-center text-center gap-5">
          <span className="text-crema/80"><Eneagrama tam={64} /></span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-2xl">Tu tipo ya está funcionando, lo conozcas o no. <span className="text-oro-claro">Mejor conocerlo.</span></h2>
          <Link to={cta} className="btn btn-oro text-base !px-7 !py-3.5">Quiero sumarme por USD 39 al mes <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      <footer className="border-t border-linea">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gris">
          <span>Academia Eneascoaching · Cecilia B. Sánchez</span>
          <a href={WEB} className="hover:text-oro">cecimentorcoach.com</a>
        </div>
      </footer>
    </div>
  );
}
