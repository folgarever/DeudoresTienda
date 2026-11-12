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

---

## 5. Guía de Despliegue en Vercel (24/7 en la Nube)

La aplicación está preparada para funcionar permanentemente en internet sin depender de tener la computadora encendida:

1. Ingresar a [vercel.com](https://vercel.com) e iniciar sesión con tu cuenta de GitHub.
2. Hacer clic en **Add New... > Project** y seleccionar el repositorio `folgarever/DeudoresTienda`.
3. Seleccionar la rama `folgarever`.
4. En **Environment Variables**, agregar las siguientes variables:
   - `SUPABASE_URL`: La URL de tu proyecto Supabase (ej. `https://xxxx.supabase.co`).
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu clave secreta `service_role` de Supabase.
   - `SUPABASE_ANON_KEY`: Tu clave pública `anon` de Supabase.
   - `JWT_SECRET`: Una clave secreta larga y segura para firmar los tokens de sesión.
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
5. Hacer clic en **Deploy**.
6. Vercel compilará automáticamente el frontend en Angular, desplegará la API en Serverless Functions bajo `/api/*` y publicará la aplicación con certificado SSL (HTTPS) gratuito en un dominio `.vercel.app`.

---

## 6. Ejecución y Pruebas en Entorno Local

### Backend:
```bash
cd backend
npm install
npm run dev        # Inicia con recarga automatica en http://localhost:3000
npm run build      # Compila TypeScript a dist/
```

### Frontend:
```bash
cd frontend
npm install
npm start          # Inicia Angular CLI en http://localhost:4200
npm run build      # Genera bundle optimizado de produccion
```

---

## 7. Módulos y Flujo Operativo

- **Autenticación:** `/login` y `/registro` con validación de credenciales únicas y contraseñas cifradas con `bcrypt`.
- **Dashboard:** `/dashboard` con indicadores en tiempo real (clientes, deudores, total por cobrar `Q`, ventas, abonos y Top 10 deudores).
- **Clientes:** `/clientes` con buscador en vivo, filtro de deudores, creación rápida (sólo Nombre y Apellido) y desactivación lógica que protege el historial.
- **Ventas y Compras:** `/ventas/nueva` para agregar productos libres con cantidad y precio unitario manual; suma atómicamente a la deuda pendiente del cliente.
- **Abonos y Pagos:** `/abonos/nuevo` con botón de pago completo, validación estricta que prohíbe abonos negativos o mayores a la deuda y resta el saldo pendiente en tiempo real.
- **Historial Individual:** `/clientes/:id/historial` con resumen acumulado y tabla cronológica de compras y abonos con saldo anterior y posterior en cada movimiento.

