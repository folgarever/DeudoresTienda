import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';
import { env } from '../config/env';
import {
  RegistroDTO,
  LoginDTO,
  AuthResponse,
  UsuarioPublico,
  TokenPayload,
  CambiarPasswordDTO,
} from '../types/auth';
import { sanitizeFilterValue } from '../utils/sanitize';
import { AppError } from '../middlewares/errorHandler';

const MAX_NOMBRE = 100;
const MAX_APELLIDO = 100;
const MIN_PASSWORD = 8;

function createAuthError(message: string, statusCode: number = 400): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  return err;
}

export class AuthService {
  static generarToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  static async registrar(dto: RegistroDTO): Promise<AuthResponse> {
    // Permite cerrar el registro publico de nuevas cuentas desde el entorno.
    if (!env.REGISTRATION_ENABLED) {
      throw createAuthError(
        'El registro de nuevas cuentas esta deshabilitado. Contacte al administrador.',
        403
      );
    }

    const nombres = dto.nombres?.trim();
    const apellidos = dto.apellidos?.trim();
    const email = dto.email?.trim().toLowerCase();
    const username = dto.username?.trim().toLowerCase();
    const password = dto.password;

    if (!nombres || !apellidos || !email || !username || !password) {
      throw createAuthError('Todos los campos son obligatorios (nombres, apellidos, correo, usuario y contraseña)');
    }

    if (nombres.length > MAX_NOMBRE || apellidos.length > MAX_APELLIDO) {
      throw createAuthError(`Los nombres y apellidos no pueden superar los ${MAX_NOMBRE} caracteres`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createAuthError('El correo electrónico no tiene un formato válido');
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      throw createAuthError('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos');
    }

    if (username.length < 3 || username.length > 30) {
      throw createAuthError('El nombre de usuario debe tener entre 3 y 30 caracteres');
    }

    if (password.length < MIN_PASSWORD) {
      throw createAuthError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
    }

    // Comprobar si ya existe el correo o el nombre de usuario
    const { data: existenteEmail, error: errorEmail } = await supabase
      .from('usuarios')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (errorEmail && errorEmail.code !== 'PGRST116') {
      throw createAuthError('Error al validar el correo: ' + errorEmail.message, 500);
    }

    if (existenteEmail) {
      throw createAuthError('Ya existe una cuenta registrada con este correo electrónico', 409);
    }

    const { data: existenteUser, error: errorUser } = await supabase
      .from('usuarios')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (errorUser && errorUser.code !== 'PGRST116') {
      throw createAuthError('Error al validar el nombre de usuario: ' + errorUser.message, 500);
    }

    if (existenteUser) {
      throw createAuthError('El nombre de usuario ya está en uso', 409);
    }

    // Hashear contraseña de forma segura
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar usuario
    const { data: nuevoUsuario, error: errorInsert } = await supabase
      .from('usuarios')
      .insert({
        nombres,
        apellidos,
        email,
        username,
        password_hash,
        activo: true,
      })
      .select('id, nombres, apellidos, email, username, activo, created_at')
      .single();

    if (errorInsert || !nuevoUsuario) {
      throw createAuthError('Error al registrar el usuario: ' + (errorInsert?.message || 'Error desconocido'), 500);
    }

    const usuarioPublico: UsuarioPublico = {
      id: nuevoUsuario.id,
      nombres: nuevoUsuario.nombres,
      apellidos: nuevoUsuario.apellidos,
      email: nuevoUsuario.email,
      username: nuevoUsuario.username,
      activo: nuevoUsuario.activo,
      created_at: nuevoUsuario.created_at,
    };

    const token = this.generarToken({
      id: usuarioPublico.id,
      username: usuarioPublico.username,
      email: usuarioPublico.email,
      nombres: usuarioPublico.nombres,
      apellidos: usuarioPublico.apellidos,
    });

    return {
      token,
      usuario: usuarioPublico,
    };
  }

  static async login(dto: LoginDTO): Promise<AuthResponse> {
    const usernameOrEmail = dto.usernameOrEmail?.trim().toLowerCase();
    const password = dto.password;

    if (!usernameOrEmail || !password) {
      throw createAuthError('Debe ingresar su usuario o correo y su contraseña');
    }

    // Se sanea el valor para evitar manipular el filtro OR de PostgREST.
    const valorSaneado = sanitizeFilterValue(usernameOrEmail);

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`username.ilike.${valorSaneado},email.ilike.${valorSaneado}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw createAuthError('Error al consultar usuario: ' + error.message, 500);
    }

    if (!usuario) {
      throw createAuthError('Credenciales inválidas', 401);
    }

    if (!usuario.activo) {
      throw createAuthError('La cuenta se encuentra desactivada', 403);
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      throw createAuthError('Credenciales inválidas', 401);
    }

    const usuarioPublico: UsuarioPublico = {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.email,
      username: usuario.username,
      activo: usuario.activo,
      created_at: usuario.created_at,
    };

    const token = this.generarToken({
      id: usuarioPublico.id,
      username: usuarioPublico.username,
      email: usuarioPublico.email,
      nombres: usuarioPublico.nombres,
      apellidos: usuarioPublico.apellidos,
    });

    return {
      token,
      usuario: usuarioPublico,
    };
  }

  static async obtenerPerfil(userId: string): Promise<UsuarioPublico> {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombres, apellidos, email, username, activo, created_at')
      .eq('id', userId)
      .single();

    if (error || !usuario) {
      throw createAuthError('Usuario no encontrado', 404);
    }

    return usuario as UsuarioPublico;
  }

  static async actualizarPerfil(
    userId: string,
    dto: { nombres?: string; apellidos?: string }
  ): Promise<UsuarioPublico> {
    const nombres = dto.nombres?.trim();
    const apellidos = dto.apellidos?.trim();

    if (!nombres || !apellidos) {
      throw createAuthError('El nombre y el apellido son obligatorios');
    }

    if (nombres.length > MAX_NOMBRE || apellidos.length > MAX_APELLIDO) {
      throw createAuthError(`Los nombres y apellidos no pueden superar los ${MAX_NOMBRE} caracteres`);
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .update({ nombres, apellidos, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, nombres, apellidos, email, username, activo, created_at')
      .single();

    if (error || !usuario) {
      throw createAuthError('Error al actualizar el perfil: ' + (error?.message || 'Error desconocido'), 500);
    }

    return usuario as UsuarioPublico;
  }

  static async cambiarPassword(userId: string, dto: CambiarPasswordDTO): Promise<void> {
    const passwordActual = dto.passwordActual;
    const passwordNueva = dto.passwordNueva;

    if (!passwordActual || !passwordNueva) {
      throw createAuthError('Debe ingresar su contraseña actual y la nueva contraseña');
    }

    if (passwordNueva.length < MIN_PASSWORD) {
      throw createAuthError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
    }

    if (passwordNueva === passwordActual) {
      throw createAuthError('La nueva contraseña debe ser diferente a la actual');
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, password_hash')
      .eq('id', userId)
      .single();

    if (error || !usuario) {
      throw createAuthError('Usuario no encontrado', 404);
    }

    const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
    if (!passwordValida) {
      throw createAuthError('La contraseña actual es incorrecta', 401);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(passwordNueva, salt);

    const { error: errorUpdate } = await supabase
      .from('usuarios')
      .update({ password_hash, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (errorUpdate) {
      throw createAuthError('Error al actualizar la contraseña: ' + errorUpdate.message, 500);
    }
  }
}
