export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  saldo_pendiente: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrearClienteDTO {
  nombre: string;
  apellido: string;
}

export interface ActualizarClienteDTO {
  nombre: string;
  apellido: string;
}

export interface FiltroClientesDTO {
  search?: string;
  soloConDeuda?: boolean;
  incluirInactivos?: boolean;
}
