import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Compra, RegistrarCompraDTO } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compras`;

  registrar(dto: RegistrarCompraDTO): Observable<{ success: boolean; data: Compra; message?: string }> {
    return this.http.post<{ success: boolean; data: Compra; message?: string }>(this.apiUrl, dto);
  }

  listar(clienteId?: string, limit: number = 50): Observable<{ success: boolean; total: number; data: Compra[] }> {
    let params = new HttpParams().set('limit', limit.toString());
    if (clienteId) params = params.set('cliente_id', clienteId);

    return this.http.get<{ success: boolean; total: number; data: Compra[] }>(this.apiUrl, { params });
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: Compra }> {
    return this.http.get<{ success: boolean; data: Compra }>(`${this.apiUrl}/${id}`);
  }
}
