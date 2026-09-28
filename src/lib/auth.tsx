import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, guardarSesion, leerSesion, type Sesion } from './api';
import type { Nivel, Onboarding, Perfil } from './tipos';

interface Estado {
  cargando: boolean;
  perfil: Perfil | null;
  nivel: Nivel | null;
  niveles: Nivel[];
  onboarding: Onboarding | null;
  recargar: () => Promise<void>;
  iniciar: (s: Sesion) => Promise<void>;
  salir: () => void;
}

const Ctx = createContext<Estado | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [datos, setDatos] = useState<{ perfil: Perfil; nivel: Nivel; niveles: Nivel[]; onboarding: Onboarding } | null>(null);

  const recargar = useCallback(async () => {
    if (!leerSesion()) { setDatos(null); setCargando(false); return; }
    try { setDatos(await api('yo')); } catch { setDatos(null); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  const iniciar = useCallback(async (s: Sesion) => { guardarSesion(s); setCargando(true); await recargar(); }, [recargar]);
  const salir = useCallback(() => { guardarSesion(null); setDatos(null); }, []);

  return (
    <Ctx.Provider value={{
      cargando, perfil: datos?.perfil || null, nivel: datos?.nivel || null, niveles: datos?.niveles || [],
      onboarding: datos?.onboarding || null, recargar, iniciar, salir,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth fuera de AuthProvider');
  return c;
}
