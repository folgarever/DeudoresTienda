import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { Cliente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/clientes`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  listar(search?: string, soloConDeuda?: boolean): Observable<{ success: boolean; data: Cliente[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (soloConDeuda) params = params.set('soloConDeuda', 'true');

    return this.http.get<{ success: boolean; data: Cliente[] }>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: Cliente }> {
    return this.http.get<{ success: boolean; data: Cliente }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  crear(cliente: { nombre: string; apellido: string }): Observable<{ success: boolean; data: Cliente; message?: string }> {
    return this.http.post<{ success: boolean; data: Cliente; message?: string }>(this.apiUrl, cliente, {
      headers: this.getHeaders()
    });
  }

  actualizar(id: string, cliente: { nombre: string; apellido: string }): Observable<{ success: boolean; data: Cliente; message?: string }> {
    return this.http.put<{ success: boolean; data: Cliente; message?: string }>(`${this.apiUrl}/${id}`, cliente, {
      headers: this.getHeaders()
    });
  }

  desactivar(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
