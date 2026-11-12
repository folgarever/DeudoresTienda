import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'deudores_tienda_dev_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  isProduction: process.env.NODE_ENV === 'production',
};
