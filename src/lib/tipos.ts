export interface Nivel { n: number; nombre: string; desde: number }

export interface Perfil {
  id: string; email: string; nombre: string; profesion: string | null; pais: string | null; bio: string | null;
  rol: 'miembro' | 'admin'; estado: 'pendiente' | 'activa' | 'vencida'; puntos: number;
  onboarding: Record<string, boolean>; creado: string;
}

export interface Onboarding { perfil: boolean; presentacion: boolean; leccion: boolean; laboratorio: boolean; vivo: boolean }

export interface Autor { id: string; nombre: string; profesion?: string | null; puntos: number; rol: string; nivel: number }

export interface Post {
  id: string; categoria: string; titulo: string; cuerpo: string; fijado: boolean; creado: string;
  autor: Autor; comentarios: number; likes: number; me_gusta: boolean;
}

export interface Comentario { id: string; cuerpo: string; creado: string; autor: Autor }

export interface Curso {
  id: string; titulo: string; descripcion: string; ruta: string; nivel_requerido: number; orden: number;
  publicado: boolean; total: number; completadas: number; bloqueado: boolean;
}

export interface Recurso { nombre: string; url: string }
export interface Leccion { id: string; modulo_id: string; titulo: string; video_url: string | null; contenido: string; recursos: Recurso[]; orden: number }
export interface Modulo { id: string; curso_id: string; titulo: string; orden: number; lecciones: Leccion[] }

export interface Evento {
  id: string; titulo: string; descripcion: string; tipo: 'clase' | 'supervision' | 'otro';
  inicio: string; duracion_min: number; link: string | null; grabacion_url: string | null;
}

export const CATEGORIAS: { id: string; nombre: string }[] = [
  { id: 'anuncios', nombre: 'Anuncios' },
  { id: 'presentaciones', nombre: 'Presentaciones' },
  { id: 'preguntas', nombre: 'Preguntas' },
  { id: 'casos', nombre: 'Casos' },
  { id: 'recursos', nombre: 'Recursos' },
  { id: 'general', nombre: 'General' },
];

export const NOMBRE_TIPO: Record<number, string> = {
  1: 'Reformador', 2: 'Ayudador', 3: 'Triunfador', 4: 'Individualista', 5: 'Investigador',
  6: 'Leal', 7: 'Entusiasta', 8: 'Desafiador', 9: 'Pacificador',
};

export function haceCuanto(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'recién';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `hace ${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Convierte un link de YouTube, Vimeo o Drive en su versión embebible
export function urlEmbebible(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null;
}
