import { Users, Link2, Map, FileText } from 'lucide-react';
import Eneagrama from '../components/Eneagrama';

const PASOS = [
  { icono: Users, titulo: 'Cargás tu equipo', texto: 'Nombre y rol de cada integrante, o el equipo de un cliente con el que trabajás.' },
  { icono: Link2, titulo: 'Cada persona hace el test', texto: 'Les mandás un link. Los resultados llegan solos a tu panel, sin planillas.' },
  { icono: Map, titulo: 'Ves el mapa del equipo', texto: 'Centros dominantes, tipos que faltan y las tensiones más probables entre roles.' },
  { icono: FileText, titulo: 'Te llevás el reporte', texto: 'Cómo dar feedback, motivar y repartir tareas según el tipo de cada integrante.' },
];

export default function Equipos() {
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="tarjeta p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="etiqueta">Próximamente</span>
          <h1 className="text-3xl font-extrabold leading-tight">Gestor de equipos con Eneagrama</h1>
          <p className="text-gris max-w-2xl">Una herramienta para aplicar el Eneagrama con equipos reales: los tuyos o los de tus clientes. Está incluida en tu membresía y la vas a ver acá cuando esté lista.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {PASOS.map(({ icono: Icono, titulo, texto }) => (
            <div key={titulo} className="rounded-xl bg-crema p-5 flex flex-col gap-2">
              <Icono className="w-5 h-5 text-oro" />
              <p className="font-bold">{titulo}</p>
              <p className="text-sm text-gris">{texto}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gris">Mientras tanto, la ruta Equipos y RRHH del Aula te da la base para leer un equipo por centros.</p>
      </div>
      <div className="tarjeta p-6 flex justify-center text-tinta"><Eneagrama tam={260} resaltar={8} /></div>
    </div>
  );
}
