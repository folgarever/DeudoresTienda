import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models';

export interface ProductoDTO {
  nombre: string;
  precio_unitario: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/productos`;

  listar(search?: string, incluirInactivos?: boolean): Observable<{ success: boolean; total: number; data: Producto[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (incluirInactivos) params = params.set('incluirInactivos', 'true');

    return this.http.get<{ success: boolean; total: number; data: Producto[] }>(this.apiUrl, { params });
  }

  crear(dto: ProductoDTO): Observable<{ success: boolean; data: Producto; message?: string }> {
    return this.http.post<{ success: boolean; data: Producto; message?: string }>(this.apiUrl, dto);
  }

  actualizar(id: string, dto: Partial<ProductoDTO>): Observable<{ success: boolean; data: Producto; message?: string }> {
    return this.http.put<{ success: boolean; data: Producto; message?: string }>(`${this.apiUrl}/${id}`, dto);
  }

  desactivar(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${id}`);
  }

  reactivar(id: string): Observable<{ success: boolean; data: Producto; message?: string }> {
    return this.http.patch<{ success: boolean; data: Producto; message?: string }>(`${this.apiUrl}/${id}/reactivar`, {});
  }
}
