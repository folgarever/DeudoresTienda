export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  password_hash: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioPublico {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  activo: boolean;
  created_at?: string;
}

export interface RegistroDTO {
  nombres: string;
  apellidos: string;
  email: string;
  username: string;
  password: string;
}

export interface LoginDTO {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioPublico;
}

export interface TokenPayload {
  id: string;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
}
