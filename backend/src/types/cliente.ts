export interface Cliente {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  saldo_pendiente: number;
  activo: boolean;
  // Campos calculados que solo se incluyen en el listado de clientes.
  ultimo_abono?: string | null;
  dias_sin_abonar?: number | null;
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

// Criterios de ordenamiento disponibles para el listado de clientes.
export type OrdenClientes = 'nombre' | 'saldo' | 'reciente';

export interface FiltroClientesDTO {
  search?: string;
  soloConDeuda?: boolean;
  incluirInactivos?: boolean;
  orden?: OrdenClientes;
}
