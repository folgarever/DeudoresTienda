# DeudoresTienda — Sistema de Control de Clientes, Ventas y Deudas

Aplicación web profesional para la administración de clientes, cuentas por cobrar, registro de ventas y control estricto de abonos/pagos de una tienda, con persistencia remota segura en **Supabase (PostgreSQL)** y despliegue continuo en **Vercel**.

---

## 1. Características Principales

- **Gestión de Clientes:** Registro rápido (nombre y apellido), edición, búsqueda instantánea y desactivación lógica que protege el historial financiero.
- **Registro de Compras:** Venta ágil de productos varios con ingreso manual de descripción, cantidad y precio unitario (en Quetzales `Q`). Cálculo automático de subtotales y total sumado a la deuda.
- **Abonos y Pagos:** Registro de pagos parciales o liquidación total con validación estricta (no permite abonos negativos ni montos superiores a la deuda).
- **Trazabilidad Financiera:** Historial cronológico inmutable de movimientos con balance anterior y resultante en cada operación.
- **Dashboard Estadístico:** Indicadores en tiempo real (total deudores, saldo total por cobrar, ventas acumuladas y clientes con mayor deuda).
- **Diseño Monocromático Inspirado en Uber:** Paleta blanco/negro/gris (`#000000`, `#FFFFFF`, `#F6F6F6`, `#333333`), tipografía Inter, bordes de 8px y adaptabilidad móvil total.

---

## 2. Arquitectura del Proyecto

```text
DeudoresTienda/
├── frontend/                     # SPA construida con Angular + TypeScript (Estilo Uber)
├── backend/                      # API REST con Node.js + Express + TypeScript
│   └── api/                      # Handler Serverless preparado para Vercel
├── supabase/                     # Esquema SQL y funciones transaccionales
│   └── schema.sql                # Definición de tablas, índices y funciones RPC
├── vercel.json                   # Configuración de compilación y routing unificado
└── .gitignore
```

---

## 3. Configuración de la Base de Datos (Supabase)

1. Crear un proyecto gratuito en [supabase.com](https://supabase.com).
2. Dirigirse a la sección **SQL Editor** en el panel de control de Supabase.
3. Abrir y copiar el contenido de [`supabase/schema.sql`](supabase/schema.sql).
4. Ejecutar el script. Esto creará las tablas (`usuarios`, `clientes`, `compras`, `detalles_compra`, `abonos_pagos`, `movimientos_financieros`) y las funciones transaccionales atómicas `registrar_compra_transaccional` y `registrar_abono_transaccional`.
5. Obtener desde **Project Settings > API** las credenciales:
   - `Project URL`
   - `Anon / Public Key`
   - `Service Role Key` (utilizada únicamente en el backend protegido).

---

## 4. Convenciones de Desarrollo

- Rama de trabajo exclusiva: `folgarever`.
- Identidad de autor: `FolgarEver` (`folgarever`).
- Estándar de mensajes de commit: **Conventional Commits** en español (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
