import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ResumenCaja } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  // Consulta el resumen de caja para un rango de fechas.
  // `desde` y `hasta` se envian en ISO (UTC) calculados desde la hora local del navegador.
  resumenCaja(desde: string, hasta: string): Observable<{ success: boolean; data: ResumenCaja }> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('tzOffset', String(new Date().getTimezoneOffset()));

    return this.http.get<{ success: boolean; data: ResumenCaja }>(`${this.apiUrl}/resumen`, { params });
  }
}
