// Número de WhatsApp de la Academia (se puede cambiar con VITE_WHATSAPP) y armado de los links con mensaje.
export const WA_NUMERO = (import.meta.env.VITE_WHATSAPP as string | undefined)?.trim() || '5493515632496';
export const wa = (texto: string) => `https://wa.me/${WA_NUMERO}?text=${encodeURIComponent(texto)}`;
