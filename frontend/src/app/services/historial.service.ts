import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResumenHistorialCliente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/historial`;

  obtenerHistorialCliente(clienteId: string): Observable<{ success: boolean; data: ResumenHistorialCliente }> {
    return this.http.get<{ success: boolean; data: ResumenHistorialCliente }>(`${this.apiUrl}/cliente/${clienteId}`);
  }
}
