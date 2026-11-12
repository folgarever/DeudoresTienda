declare global {
  interface Window {
    API_URL?: string;
    DEUDORES_API_URL?: string;
  }
}

function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    if (window.API_URL) return window.API_URL;
    if (window.DEUDORES_API_URL) return window.DEUDORES_API_URL;
    try {
      const stored = localStorage.getItem('deudores_api_url');
      if (stored) return stored;
    } catch {}
  }
  return 'https://deudores-tienda.vercel.app/api';
}

export const environment = {
  production: true,
  apiUrl: getApiUrl(),
};
