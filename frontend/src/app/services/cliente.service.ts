import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/clientes`;

  listar(
    search?: string,
    soloConDeuda?: boolean,
    incluirInactivos?: boolean,
    page?: number,
    limit?: number
  ): Observable<{ success: boolean; total: number; page?: number; limit?: number; data: Cliente[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (soloConDeuda) params = params.set('soloConDeuda', 'true');
    if (incluirInactivos) params = params.set('incluirInactivos', 'true');
    if (page !== undefined) params = params.set('page', page.toString());
    if (limit !== undefined) params = params.set('limit', limit.toString());

    return this.http.get<{ success: boolean; total: number; page?: number; limit?: number; data: Cliente[] }>(
      this.apiUrl,
      { params }
    );
  }

  obtenerPorId(id: string): Observable<{ success: boolean; data: Cliente }> {
    return this.http.get<{ success: boolean; data: Cliente }>(`${this.apiUrl}/${id}`);
  }

  crear(cliente: { nombre: string; apellido: string }): Observable<{ success: boolean; data: Cliente; message?: string }> {
    return this.http.post<{ success: boolean; data: Cliente; message?: string }>(this.apiUrl, cliente);
  }

  actualizar(id: string, cliente: { nombre: string; apellido: string }): Observable<{ success: boolean; data: Cliente; message?: string }> {
    return this.http.put<{ success: boolean; data: Cliente; message?: string }>(`${this.apiUrl}/${id}`, cliente);
  }

  desactivar(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  reactivar(id: string): Observable<{ success: boolean; data: Cliente; message?: string }> {
    return this.http.patch<{ success: boolean; data: Cliente; message?: string }>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
