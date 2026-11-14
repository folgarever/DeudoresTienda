import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardStats } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/dashboard`;

  // `dias` define cuantos dias atras incluye la serie temporal de ventas y abonos.
  obtenerMetricas(dias = 14): Observable<{ success: boolean; data: DashboardStats }> {
    const params = new HttpParams()
      .set('dias', String(dias))
      .set('tzOffset', String(new Date().getTimezoneOffset()));

    return this.http.get<{ success: boolean; data: DashboardStats }>(this.apiUrl, { params });
  }
}
