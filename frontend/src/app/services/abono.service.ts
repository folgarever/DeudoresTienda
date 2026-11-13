import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AbonoPago, RegistrarAbonoDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AbonoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/abonos`;

  registrar(dto: RegistrarAbonoDTO): Observable<{ success: boolean; data: AbonoPago; message?: string }> {
    return this.http.post<{ success: boolean; data: AbonoPago; message?: string }>(this.apiUrl, dto);
  }

  listar(
    clienteId?: string,
    limit: number = 50,
    incluirAnulados: boolean = false
  ): Observable<{ success: boolean; total: number; data: AbonoPago[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (clienteId) params = params.set('cliente_id', clienteId);
    if (incluirAnulados) params = params.set('incluirAnulados', 'true');

    return this.http.get<{ success: boolean; total: number; data: AbonoPago[] }>(this.apiUrl, { params });
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: AbonoPago }> {
    return this.http.get<{ success: boolean; data: AbonoPago }>(`${this.apiUrl}/${id}`);
  }

  anular(id: string, motivo?: string): Observable<{ success: boolean; data: AbonoPago; message?: string }> {
    return this.http.post<{ success: boolean; data: AbonoPago; message?: string }>(`${this.apiUrl}/${id}/anular`, { motivo });
  }
}
