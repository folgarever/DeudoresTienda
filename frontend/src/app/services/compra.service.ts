import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { Compra, RegistrarCompraDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/compras`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  registrar(dto: RegistrarCompraDTO): Observable<{ success: boolean; data: Compra; message?: string }> {
    return this.http.post<{ success: boolean; data: Compra; message?: string }>(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  listar(clienteId?: string, limit: number = 50): Observable<{ success: boolean; data: Compra[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (clienteId) params = params.set('cliente_id', clienteId);

    return this.http.get<{ success: boolean; data: Compra[] }>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: Compra }> {
    return this.http.get<{ success: boolean; data: Compra }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
