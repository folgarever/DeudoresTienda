const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const environment = {
  production: !isLocal,
  apiUrl: isLocal && typeof window !== 'undefined' && window.location.port === '4200'
    ? 'http://localhost:3000/api'
    : 'https://deudores-tienda.vercel.app/api',
};
