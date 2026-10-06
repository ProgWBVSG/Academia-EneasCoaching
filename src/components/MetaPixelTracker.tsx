import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent, trackPageView } from '../lib/metaPixel';

// La web es de una sola página (BrowserRouter): hay que avisarle al Pixel en cada cambio de ruta.
export default function MetaPixelTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView();
    if (pathname === '/') {
      trackEvent('ViewContent', { content_name: 'Academia', content_category: 'Membresía', value: 39, currency: 'USD' });
    }
  }, [pathname]);

  // Cualquier clic a WhatsApp (consulta) cuenta como Lead.
  useEffect(() => {
    const alClic = (e: MouseEvent) => {
      const enlace = (e.target as HTMLElement | null)?.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (enlace) trackEvent('Lead', { content_name: window.location.pathname });
    };
    document.addEventListener('click', alClic);
    return () => document.removeEventListener('click', alClic);
  }, []);

  return null;
}
