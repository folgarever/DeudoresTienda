import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { AbonoPago, RegistrarAbonoDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AbonoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/abonos`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  registrar(dto: RegistrarAbonoDTO): Observable<{ success: boolean; data: AbonoPago; message?: string }> {
    return this.http.post<{ success: boolean; data: AbonoPago; message?: string }>(this.apiUrl, dto, {
      headers: this.getHeaders()
    });
  }

  listar(clienteId?: string, limit: number = 50): Observable<{ success: boolean; data: AbonoPago[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (clienteId) params = params.set('cliente_id', clienteId);

    return this.http.get<{ success: boolean; data: AbonoPago[] }>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: AbonoPago }> {
    return this.http.get<{ success: boolean; data: AbonoPago }>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }
}
