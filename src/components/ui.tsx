import React from 'react';
import { Loader2, X } from 'lucide-react';

const PALETA = ['#B08A45', '#8B6BB8', '#4A90C2', '#5DA8A0', '#E07A8A', '#B83A3A', '#7AAC6E', '#F0A040', '#1C1A17'];

export function Avatar({ nombre, id, tam = 36 }: { nombre: string; id: string; tam?: number }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
  const color = PALETA[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length];
  return (
    <span className="inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 select-none"
      style={{ width: tam, height: tam, background: color, fontSize: tam * 0.38 }}>
      {iniciales}
    </span>
  );
}

// Número de nivel sobre el avatar, como en Skool
export function AvatarNivel({ nombre, id, nivel, tam = 36 }: { nombre: string; id: string; nivel: number; tam?: number }) {
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar nombre={nombre} id={id} tam={tam} />
      <span className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white border border-linea text-[10px] font-bold text-oro flex items-center justify-center tabular-nums">
        {nivel}
      </span>
    </span>
  );
}

export function Cargando({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-gris text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> {texto}
    </div>
  );
}

export function Vacio({ titulo, texto, children }: { titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="tarjeta p-10 text-center flex flex-col items-center gap-2">
      <p className="font-display font-bold text-lg">{titulo}</p>
      {texto && <p className="text-gris text-sm max-w-md">{texto}</p>}
      {children}
    </div>
  );
}

export function Modal({ titulo, onCerrar, children, ancho = 'max-w-lg' }: { titulo: string; onCerrar: () => void; children: React.ReactNode; ancho?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-tinta/50" onClick={onCerrar} />
      <div className={`relative bg-white w-full ${ancho} rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-linea sticky top-0 bg-white z-10">
          <h3 className="font-bold text-base">{titulo}</h3>
          <button onClick={onCerrar} className="text-gris hover:text-tinta" aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Campo({ label, children, ayuda }: { label: string; children: React.ReactNode; ayuda?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {ayuda && <span className="text-xs text-gris">{ayuda}</span>}
    </label>
  );
}

export function Error({ texto }: { texto: string }) {
  if (!texto) return null;
  return <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{texto}</p>;
}
