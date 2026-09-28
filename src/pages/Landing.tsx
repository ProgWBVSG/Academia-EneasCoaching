import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, MessagesSquare, Sparkles, Users, Trophy, Check, ArrowRight, ChevronDown } from 'lucide-react';
import Eneagrama from '../components/Eneagrama';
import { useAuth } from '../lib/auth';

const WHATSAPP = 'https://wa.me/5493515632496?text=' + encodeURIComponent('Hola Cecilia! Quiero saber más de la Academia.');
const WEB = 'https://www.cecimentorcoach.com';

const INCLUYE = [
  { icono: BookOpen, titulo: 'Aula con cursos grabados', texto: 'Cinco rutas: Fundamentos, Patrones, el Eneagrama en sesión, Equipos y RRHH, y Eneagrama con IA. Una lección nueva por mes.' },
  { icono: CalendarDays, titulo: 'Dos vivos por mes', texto: 'Una clase temática y una supervisión de casos reales. Si no llegás, queda la grabación.' },
  { icono: Sparkles, titulo: 'Laboratorio de práctica con IA', texto: 'Una sesión con un cliente simulado de un tipo que no conocés. Al final te devuelve qué señales viste y cuáles se te pasaron.' },
  { icono: MessagesSquare, titulo: 'Comunidad de colegas', texto: 'Preguntas, casos, recursos y presentaciones. Un lugar para pensar con otras profesionales que usan la misma herramienta.' },
  { icono: Trophy, titulo: 'Niveles que desbloquean', texto: 'Participar suma puntos. Al subir de nivel se abren las rutas avanzadas.' },
  { icono: Users, titulo: 'Gestor de equipos', texto: 'Próximamente: cargá un equipo, mandá el test y mirá el mapa de dinámicas. Incluido en tu membresía cuando salga.' },
];

const MES = [
  { semana: 'Semana 1', titulo: 'Clase en vivo', texto: 'Un tema a fondo, con tiempo para preguntas.', vivo: true },
  { semana: 'Semana 2', titulo: 'Reto de práctica', texto: 'Un ejercicio para aplicar con un cliente o en el laboratorio.' },
  { semana: 'Semana 3', titulo: 'Supervisión de casos', texto: 'Traés un caso real, anonimizado, y lo trabajamos juntas.', vivo: true },
  { semana: 'Semana 4', titulo: 'Lección nueva', texto: 'Se suma al Aula y la comentamos en la comunidad.' },
];

const FAQ = [
  ['¿Necesito saber de Eneagrama para entrar?', 'No. La ruta de Fundamentos arranca desde cero, pero está pensada para usarlo con clientes o equipos, no como curiosidad personal.'],
  ['¿Qué diferencia hay con la Diplomatura?', 'La Academia es acompañamiento continuo y práctica. La Diplomatura es la formación completa, con certificación y práctica supervisada. Muchas empiezan por la Academia y después se forman.'],
  ['¿La IA reemplaza el criterio profesional?', 'No. El laboratorio es para practicar la lectura de un cliente. La IA propone y devuelve; la que decide sos vos.'],
  ['¿Puedo cancelar cuando quiera?', 'Sí. Es una suscripción mensual y la cancelás desde Mercado Pago cuando quieras, sin permanencia.'],
  ['¿Cómo pago desde fuera de Argentina?', 'Escribinos por WhatsApp y te pasamos la forma de pago para tu país.'],
];

export default function Landing() {
  const { perfil } = useAuth();
  const [info, setInfo] = useState<{ miembros: number; proximo: { titulo: string; inicio: string } | null } | null>(null);
  const [abierta, setAbierta] = useState<number | null>(0);

  useEffect(() => {
    fetch('/api/academia?action=publico-info').then(r => r.ok ? r.json() : null).then(setInfo).catch(() => {});
  }, []);

  const cta = perfil ? '/app' : '/registro';

  return (
    <div className="min-h-screen">
      {/* Barra */}
      <header className="sticky top-0 z-30 bg-crema/90 backdrop-blur border-b border-linea">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-tinta"><Eneagrama tam={30} /></span>
            <span className="font-display font-extrabold tracking-tight">Academia <span className="text-oro">Eneascoaching</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-gris">
            <a href="#incluye" className="hover:text-tinta">Qué incluye</a>
            <a href="#mes" className="hover:text-tinta">Cómo es un mes</a>
            <a href="#precio" className="hover:text-tinta">Precio</a>
          </nav>
          <div className="flex items-center gap-2">
            {!perfil && <Link to="/entrar" className="text-sm font-medium px-3 py-2 hover:text-oro">Ingresar</Link>}
            <Link to={cta} className="btn btn-oscuro !py-2 !px-4 text-sm">{perfil ? 'Ir a la academia' : 'Sumarme'}</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-14 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-[1.15fr_.85fr] gap-12 items-center">
        <div className="flex flex-col gap-6">
          <span className="etiqueta">Para psicólogas, coaches, terapeutas y RRHH</span>
          <h1 className="text-4xl md:text-[3.4rem] leading-[1.08] font-extrabold tracking-tight">
            Usá el Eneagrama con tus clientes con la seguridad de quien lo <span className="text-oro">practica todos los meses</span>.
          </h1>
          <p className="text-lg text-gris max-w-xl">
            Cursos, dos vivos por mes, supervisión de casos reales y un laboratorio para practicar con clientes simulados por IA. La comunidad de Cecilia B. Sánchez para profesionales que acompañan personas y equipos.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link to={cta} className="btn btn-oro text-base !px-7 !py-3.5">Sumarme por USD 39 al mes <ArrowRight className="w-4 h-4" /></Link>
            <a href="#incluye" className="btn btn-borde">Ver qué incluye</a>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gris">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Cancelás cuando quieras</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> +1.800 personas acompañadas por Cecilia</span>
            {info?.proximo && (
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-oro" /> Próximo vivo: {new Date(info.proximo.inicio).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}</span>
            )}
          </div>
        </div>
        <div className="relative flex justify-center text-tinta">
          <div className="absolute inset-6 rounded-full bg-oro-suave blur-2xl opacity-80" aria-hidden />
          <div className="relative"><Eneagrama tam={380} resaltar={4} /></div>
        </div>
      </section>

      {/* El problema */}
      <section className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-10 items-start">
          <div className="flex flex-col gap-4">
            <span className="etiqueta !text-oro-claro">Por qué existe</span>
            <h2 className="text-3xl font-extrabold leading-tight">Tenés el título. Lo que falta es la práctica.</h2>
          </div>
          <ul className="flex flex-col gap-4 text-crema/85">
            {[
              'Hiciste un curso de Eneagrama, pero en sesión no te sale con naturalidad.',
              'Tenés un cliente que no avanza y la duda empieza a ser sobre vos.',
              'Te da vergüenza que el Eneagrama suene a horóscopo frente a colegas.',
              'Querés usarlo con equipos y no sabés por dónde entrar.',
            ].map(t => (
              <li key={t} className="flex gap-3"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-oro shrink-0" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Qué incluye */}
      <section id="incluye" className="max-w-6xl mx-auto px-5 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="etiqueta">Qué incluye</span>
          <h2 className="text-3xl md:text-4xl font-extrabold">Todo lo que necesitás para aplicarlo, en un solo lugar</h2>
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

      {/* Laboratorio */}
      <section className="bg-oro-suave">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4">
            <span className="etiqueta">El diferencial</span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">Practicá con un cliente que no sabés de qué tipo es</h2>
            <p className="text-gris text-lg">La IA hace de cliente en una primera sesión. Vos preguntás, reflejás y formulás tu hipótesis. Al cerrar, te muestra el tipo real, las frases que lo delataban y qué pregunta te hubiera ayudado a confirmarlo.</p>
            <p className="text-gris">Es la práctica que nadie tiene tiempo de hacer entre sesión y sesión, disponible cuando vos quieras.</p>
          </div>
          <div className="tarjeta p-5 flex flex-col gap-3 shadow-xl shadow-oro/10">
            <div className="flex items-center justify-between text-xs text-gris"><span>Sesión de práctica</span><span>Tipo oculto</span></div>
            <div className="self-end max-w-[85%] bg-tinta text-crema rounded-2xl rounded-br-sm px-4 py-2.5 text-sm">¿Qué sentiste cuando tu socia tomó esa decisión sin consultarte?</div>
            <div className="self-start max-w-[85%] bg-crema rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm">Nada grave, la verdad. Está bien, prefiero que no haya lío. Igual después me quedé ordenando papeles hasta tarde, que hacía rato que los tenía pendientes.</div>
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
          <h2 className="text-3xl md:text-4xl font-extrabold">Cuatro encuentros por mes, dos en vivo</h2>
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

      {/* Cecilia */}
      <section className="max-w-6xl mx-auto px-5 pb-20">
        <div className="tarjeta p-6 md:p-10 grid md:grid-cols-[220px_1fr] gap-8 items-center">
          <img src="/cecilia.jpg" alt="Cecilia B. Sánchez" className="w-44 h-44 md:w-56 md:h-56 rounded-2xl object-cover mx-auto" />
          <div className="flex flex-col gap-3">
            <span className="etiqueta">Quién te acompaña</span>
            <h2 className="text-2xl md:text-3xl font-extrabold">Cecilia B. Sánchez</h2>
            <p className="text-gris">Coach eneagramista, abogada y creadora del método Eneascoaching, que integra Coaching Ontológico y Eneagrama. Acompañó a más de 1.800 personas y forma profesionales a través de su Diplomatura en Eneagrama.</p>
          </div>
        </div>
      </section>

      {/* Precio */}
      <section id="precio" className="bg-tinta text-crema">
        <div className="max-w-6xl mx-auto px-5 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4">
            <span className="etiqueta !text-oro-claro">Precio</span>
            <h2 className="text-3xl md:text-4xl font-extrabold">Menos que una sesión de supervisión, todos los meses</h2>
            <p className="text-crema/75">Si en algún momento querés la formación completa, la Diplomatura y la Mentoría siguen disponibles. La Academia es el mejor lugar para empezar.</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <a href={`${WEB}/diplomatura`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver la Diplomatura</a>
              <a href={`${WEB}/mentorias/premium`} className="underline underline-offset-4 text-oro-claro hover:text-crema">Ver la Mentoría para equipos</a>
            </div>
          </div>
          <div className="bg-crema text-tinta rounded-2xl p-8 flex flex-col gap-5">
            <div>
              <p className="etiqueta">Membresía mensual</p>
              <p className="mt-2 flex items-baseline gap-2"><span className="font-display font-extrabold text-5xl tabular-nums">USD 39</span><span className="text-gris">por mes</span></p>
              <p className="text-sm text-gris mt-1">En Argentina se cobra en pesos con Mercado Pago.</p>
            </div>
            <ul className="flex flex-col gap-2.5 text-[15px]">
              {['Todas las rutas de cursos y el material descargable', 'Clase en vivo y supervisión de casos cada mes', 'Laboratorio de práctica con IA', 'Comunidad y directorio de colegas', 'El gestor de equipos cuando salga, sin costo extra'].map(t => (
                <li key={t} className="flex gap-2.5"><Check className="w-5 h-5 text-oro shrink-0" />{t}</li>
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
              <button onClick={() => setAbierta(abierta === i ? null : i)} className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 font-semibold">
                {p}<ChevronDown className={`w-5 h-5 text-gris shrink-0 transition-transform ${abierta === i ? 'rotate-180' : ''}`} />
              </button>
              {abierta === i && <p className="px-5 pb-5 -mt-1 text-gris">{r}</p>}
            </div>
          ))}
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
