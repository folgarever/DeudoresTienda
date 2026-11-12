import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/auth.service';
import { ResumenHistorialCliente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/historial`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  obtenerHistorialCliente(clienteId: string): Observable<{ success: boolean; data: ResumenHistorialCliente }> {
    return this.http.get<{ success: boolean; data: ResumenHistorialCliente }>(`${this.apiUrl}/cliente/${clienteId}`, {
      headers: this.getHeaders()
    });
  }
}
