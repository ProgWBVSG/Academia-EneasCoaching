// Meta Pixel de la academia (academia.cecimentorcoach.com).
// Para activarlo: pegar el ID del Pixel (solo números) en PIXEL_ID. Con el ID vacío no carga nada.
const PIXEL_ID = '682059255545552';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const initMetaPixel = (): void => {
  const w = window as any;
  if (!PIXEL_ID || w.fbq) return;

  const fbq: any = function () {
    // eslint-disable-next-line prefer-rest-params
    fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
  };
  if (!w._fbq) w._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  w.fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', PIXEL_ID);
};

export const trackPageView = (): void => {
  (window as any).fbq?.('track', 'PageView');
};

// Eventos estándar de Meta (ViewContent, Lead, CompleteRegistration, InitiateCheckout...).
export const trackEvent = (name: string, params?: Record<string, unknown>): void => {
  (window as any).fbq?.('track', name, params);
};

// Eventos propios (por ejemplo VSL_Play).
export const trackCustom = (name: string, params?: Record<string, unknown>): void => {
  (window as any).fbq?.('trackCustom', name, params);
};
