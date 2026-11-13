# DeudoresTienda — Sistema de Control de Clientes, Ventas y Deudas

Aplicación web profesional para la administración de clientes, cuentas por cobrar, registro de ventas y control estricto de abonos/pagos de una tienda, con persistencia remota segura en **Supabase (PostgreSQL)** y despliegue continuo en **Vercel**.

[![Despliegue en Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=deudores-tienda)](https://vercel.com)

---

## 1. Características Principales

- **Gestión de Clientes:** Registro rápido (nombre y apellido), edición, búsqueda instantánea, paginación, exportación a CSV, desactivación lógica que protege el historial financiero y reactivación de clientes inactivos.
- **Registro de Compras:** Venta ágil de productos varios con ingreso manual de descripción, cantidad y precio unitario (en Quetzales `Q`) o desde el catálogo de productos frecuentes. Cálculo automático de subtotales y total sumado a la deuda. Permite registrar la compra con **fecha retroactiva**.
- **Abonos y Pagos:** Registro de pagos parciales o liquidación total con validación estricta (no permite abonos negativos ni montos superiores a la deuda). El estado de cada compra (`PENDIENTE` / `PARCIAL` / `PAGADO`) se recalcula automáticamente en orden FIFO. Permite registrar el abono con **fecha retroactiva**.
- **Trazabilidad Financiera:** Historial cronológico inmutable de movimientos con balance anterior y resultante en cada operación. Incluye detalle de productos por compra, filtro por rango de fechas, exportación a CSV e impresión del estado de cuenta.
- **Catálogo de Productos:** Productos frecuentes con precio sugerido para agregarlos a una venta con un clic (ventas más rápidas).
- **Cierre de Caja:** Reporte de ventas y abonos por día, semana o mes, con totales, desglose diario, exportación a CSV e impresión.
- **Dashboard Estadístico:** Indicadores en tiempo real (total deudores, saldo total por cobrar, ventas acumuladas, total vendido y clientes con mayor deuda).
- **Perfil de Usuario:** Edición de nombres y apellidos, además de cambio de contraseña autenticado.
- **Seguridad:** Tokens JWT, contraseñas cifradas con `bcrypt`, limitador de intentos de autenticación, saneamiento de filtros de búsqueda, CORS configurable y ocultamiento de errores internos en producción.
- **Diseño Monocromático Inspirado en Uber:** Paleta blanco/negro/gris (`#000000`, `#FFFFFF`, `#F6F6F6`, `#333333`), tipografía Inter, bordes de 8px y adaptabilidad móvil total.
- **Perfil de Usuario:** Edición de nombres y apellidos, además de cambio de contraseña autenticado.
- **Seguridad:** Tokens JWT, contraseñas cifradas con `bcrypt`, limitador de intentos de autenticación, saneamiento de filtros de búsqueda, CORS configurable y ocultamiento de errores internos en producción.
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
4. Ejecutar el script. Esto creará las tablas (`usuarios`, `clientes`, `compras`, `detalles_compra`, `abonos_pagos`, `movimientos_financieros`, `productos`) y las funciones transaccionales atómicas `registrar_compra_transaccional`, `registrar_abono_transaccional` y `recalcular_estados_pago_cliente`.
5. Obtener desde **Project Settings > API** las credenciales:
   - `Project URL`
   - `Anon / Public Key`
   - `Service Role Key` (utilizada únicamente en el backend protegido).

> **Migraciones:** si ya tenía una base de datos creada con una versión anterior del esquema, vuelva a ejecutar `supabase/schema.sql`. El script usa `CREATE OR REPLACE` y `CREATE TABLE IF NOT EXISTS`, por lo que actualizará las funciones existentes y agregará la tabla `productos` sin perder datos.

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
   - `CORS_ORIGINS`: Dominios autorizados separados por coma (ej. `https://deudores-tienda.vercel.app`). Si se deja vacío se permite cualquier origen (recomendado sólo en desarrollo).
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
- **Dashboard:** `/dashboard` con indicadores en tiempo real (clientes, deudores, total por cobrar `Q`, ventas, total vendido, abonos y Top 10 deudores).
- **Clientes:** `/clientes` con buscador en vivo, filtro de deudores, filtro para mostrar inactivos, paginación, exportación a CSV, creación rápida (sólo Nombre y Apellido), desactivación lógica que protege el historial y reactivación de clientes.
- **Ventas y Compras:** `/ventas/nueva` para agregar productos libres (o desde el catálogo) con cantidad y precio unitario; permite fecha retroactiva y suma atómicamente a la deuda pendiente del cliente.
- **Abonos y Pagos:** `/abonos/nuevo` con botón de pago completo, fecha retroactiva, validación estricta que prohíbe abonos negativos o mayores a la deuda y resta el saldo pendiente en tiempo real.
- **Historial Individual:** `/clientes/:id/historial` con resumen acumulado, detalle de productos por compra, filtro por rango de fechas, exportación a CSV e impresión del estado de cuenta.
- **Cierre de Caja:** `/reportes` con presets (hoy, esta semana, este mes, mes anterior), tarjetas de totales, desglose diario, exportación a CSV e impresión.
- **Catálogo de Productos:** `/productos` para administrar productos frecuentes con precio y agregarlos a una venta con un clic.
- **Mi Perfil:** `/perfil` para editar nombres y apellidos y cambiar la contraseña.

---

## 8. Referencia de la API REST

Todas las rutas (excepto autenticación) requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Registrar un nuevo usuario |
| `POST` | `/api/auth/login` | Iniciar sesión (limitado por intentos) |
| `GET` | `/api/auth/profile` | Obtener el perfil del usuario autenticado |
| `PUT` | `/api/auth/profile` | Actualizar nombres y apellidos |
| `PUT` | `/api/auth/password` | Cambiar la contraseña |
| `GET` | `/api/clientes` | Listar clientes (`search`, `soloConDeuda`, `incluirInactivos`, `page`, `limit`) |
| `POST` | `/api/clientes` | Crear un cliente |
| `GET` | `/api/clientes/:id` | Obtener un cliente |
| `PUT` | `/api/clientes/:id` | Actualizar un cliente |
| `PATCH` | `/api/clientes/:id/reactivar` | Reactivar un cliente inactivo |
| `DELETE` | `/api/clientes/:id` | Desactivar un cliente (borrado lógico) |
| `GET` | `/api/compras` | Listar compras (`cliente_id`, `limit`, `page`) |
| `POST` | `/api/compras` | Registrar una compra |
| `GET` | `/api/compras/:id` | Obtener una compra |
| `GET` | `/api/abonos` | Listar abonos (`cliente_id`, `limit`, `page`) |
| `POST` | `/api/abonos` | Registrar un abono o pago |
| `GET` | `/api/abonos/:id` | Obtener un abono |
| `GET` | `/api/historial/cliente/:id` | Historial financiero de un cliente |
| `GET` | `/api/dashboard` | Métricas del panel de control |
| `GET` | `/api/reportes/resumen` | Cierre de caja por rango (`desde`, `hasta`, `tzOffset`) |
| `GET` | `/api/productos` | Listar productos (`search`, `incluirInactivos`, `page`, `limit`) |
| `POST` | `/api/productos` | Crear un producto (`nombre`, `precio_unitario`) |
| `GET` | `/api/productos/:id` | Obtener un producto |
| `PUT` | `/api/productos/:id` | Actualizar un producto |
| `PATCH` | `/api/productos/:id/reactivar` | Reactivar un producto inactivo |
| `DELETE` | `/api/productos/:id` | Desactivar un producto (borrado lógico) |
| `GET` | `/api/health` | Estado del servicio |

Los listados devuelven `{ success, total, page, limit, data }`. La paginación es opcional: si no se envían `page` ni `limit` se conserva el comportamiento de traer todos los registros.

