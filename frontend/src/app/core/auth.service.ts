import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'deudores_token';
  private userKey = 'deudores_user';

  currentUser = signal<Usuario | null>(this.getStoredUser());
  isAuthenticated = signal<boolean>(!!this.getStoredToken());

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  private getStoredUser(): Usuario | null {
    try {
      const u = localStorage.getItem(this.userKey);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  register(data: { nombres: string; apellidos: string; email: string; username: string; password: string }): Observable<{ success: boolean; data: AuthResponse; message?: string }> {
    return this.http.post<{ success: boolean; data: AuthResponse; message?: string }>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.usuario);
        }
      })
    );
  }

  login(credentials: { usernameOrEmail: string; password: string }): Observable<{ success: boolean; data: AuthResponse; message?: string }> {
    return this.http.post<{ success: boolean; data: AuthResponse; message?: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.usuario);
        }
      })
    );
  }

  private setSession(token: string, usuario: Usuario): void {
    try {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(usuario));
    } catch (e) {
      console.error('Error al guardar sesion:', e);
    }
    this.currentUser.set(usuario);
    this.isAuthenticated.set(true);
  }

  logout(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch (e) {
      console.error('Error al limpiar sesion:', e);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}
