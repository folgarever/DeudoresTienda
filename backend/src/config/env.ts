import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET || '';

// En produccion es obligatorio definir un secreto real para firmar los tokens.
// Evita que la API arranque con un secreto por defecto conocido publicamente.
if (isProduction && !jwtSecret) {
  throw new Error(
    '[CONFIG] La variable JWT_SECRET es obligatoria en produccion. ' +
    'Definala en el panel de Vercel o en su archivo .env antes de iniciar la API.'
  );
}

// Lista de origenes permitidos para CORS separados por coma.
// Si se deja vacia se permite cualquier origen (util en desarrollo),
// pero en produccion se recomienda restringirla al dominio del frontend.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origen) => origen.trim())
  .filter((origen) => origen.length > 0);

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  JWT_SECRET: jwtSecret || 'deudores_tienda_dev_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGINS: corsOrigins,
  // Permite cerrar el registro publico de nuevas cuentas. Por defecto queda
  // habilitado para no cambiar el comportamiento; defina REGISTRATION_ENABLED=false
  // en produccion si la aplicacion es de uso personal y no desea nuevas cuentas.
  REGISTRATION_ENABLED: process.env.REGISTRATION_ENABLED !== 'false',
  isProduction,
};
