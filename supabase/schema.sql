-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: DEUDORES TIENDA
-- Base de datos: PostgreSQL (Supabase)
-- Moneda: Quetzales (Q) - Manejo exacto con NUMERIC(12, 2)
-- =============================================================================

-- Habilitar extension de generacion de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- Administradoras y usuarios del sistema
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para busqueda y autenticacion
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(LOWER(email));

-- -----------------------------------------------------------------------------
-- 2. TABLA: clientes
-- Clientes de la tienda (aislados por usuario/administradora)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_pendiente >= 0.00),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para filtrado por tienda y busqueda por nombre
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_apellido ON clientes(user_id, LOWER(nombre), LOWER(apellido));
CREATE INDEX IF NOT EXISTS idx_clientes_saldo ON clientes(user_id, saldo_pendiente DESC);

-- -----------------------------------------------------------------------------
-- 3. TABLA: compras
-- Cabecera de compras realizadas por clientes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    total NUMERIC(12, 2) NOT NULL CHECK (total > 0.00),
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PARCIAL', 'PAGADO')),
    saldo_generado NUMERIC(12, 2) NOT NULL CHECK (saldo_generado >= 0.00),
    fecha_compra TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compras_cliente ON compras(cliente_id, fecha_compra DESC);
CREATE INDEX IF NOT EXISTS idx_compras_user ON compras(user_id, fecha_compra DESC);

-- -----------------------------------------------------------------------------
-- 4. TABLA: detalles_compra
-- Articulos individuales incluidos en cada compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalles_compra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    descripcion_producto VARCHAR(255) NOT NULL,
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0.00),
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0.00),
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0.00)
);

CREATE INDEX IF NOT EXISTS idx_detalles_compra_id ON detalles_compra(compra_id);

-- -----------------------------------------------------------------------------
-- 5. TABLA: abonos_pagos
-- Registro de pagos y abonos a deudas de clientes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abonos_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0.00),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('ABONO', 'PAGO_COMPLETO')),
    saldo_anterior NUMERIC(12, 2) NOT NULL CHECK (saldo_anterior >= 0.00),
    saldo_restante NUMERIC(12, 2) NOT NULL CHECK (saldo_restante >= 0.00),
    observaciones TEXT,
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_abonos_cliente ON abonos_pagos(cliente_id, fecha_pago DESC);
CREATE INDEX IF NOT EXISTS idx_abonos_user ON abonos_pagos(user_id, fecha_pago DESC);

-- -----------------------------------------------------------------------------
-- 6. TABLA: movimientos_financieros
-- Historial cronologico unificado de compras y abonos para trazabilidad
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_financieros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('COMPRA', 'ABONO')),
    referencia_id UUID NOT NULL,
    descripcion TEXT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0.00),
    saldo_anterior NUMERIC(12, 2) NOT NULL CHECK (saldo_anterior >= 0.00),
    saldo_posterior NUMERIC(12, 2) NOT NULL CHECK (saldo_posterior >= 0.00),
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_cliente ON movimientos_financieros(cliente_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_user ON movimientos_financieros(user_id, fecha DESC);

-- -----------------------------------------------------------------------------
-- 7. TABLA: productos
-- Catalogo de productos frecuentes de la tienda (con precio sugerido)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre VARCHAR(150) NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (precio_unitario >= 0.00),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_user ON productos(user_id, activo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(user_id, LOWER(nombre));

-- -----------------------------------------------------------------------------
-- PERMISOS Y POLITICAS DE SEGURIDAD (RLS)
-- Como la API de Node.js gestiona internamente la autenticacion JWT y el
-- aislamiento de datos por user_id, se deshabilita RLS en estas tablas.
-- -----------------------------------------------------------------------------
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE compras DISABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_compra DISABLE ROW LEVEL SECURITY;
ALTER TABLE abonos_pagos DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_financieros DISABLE ROW LEVEL SECURITY;
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FUNCIONES TRANSACCIONALES RPC (Integridad Absoluta)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FUNCION: recalcular_estados_pago_cliente
-- Recalcula compras.estado_pago (PENDIENTE/PARCIAL/PAGADO) aplicando los abonos
-- registrados en orden cronologico (FIFO) sobre las compras mas antiguas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalcular_estados_pago_cliente(
    p_user_id UUID,
    p_cliente_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_abonado NUMERIC(12, 2);
    v_acumulado NUMERIC(12, 2) := 0.00;
    v_compra RECORD;
    v_estado VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(monto), 0.00) INTO v_total_abonado
    FROM abonos_pagos
    WHERE cliente_id = p_cliente_id AND user_id = p_user_id;

    FOR v_compra IN
        SELECT id, total
        FROM compras
        WHERE cliente_id = p_cliente_id AND user_id = p_user_id
        ORDER BY fecha_compra ASC, created_at ASC
    LOOP
        IF v_total_abonado >= v_acumulado + v_compra.total THEN
            v_estado := 'PAGADO';
        ELSIF v_total_abonado > v_acumulado THEN
            v_estado := 'PARCIAL';
        ELSE
            v_estado := 'PENDIENTE';
        END IF;

        UPDATE compras SET estado_pago = v_estado WHERE id = v_compra.id;
        v_acumulado := v_acumulado + v_compra.total;
    END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- FUNCION: registrar_compra_transaccional
-- Registra la compra, sus detalles, incrementa el saldo y anota el movimiento
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_compra_transaccional(
    p_user_id UUID,
    p_cliente_id UUID,
    p_items JSONB,
    p_fecha TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo_actual NUMERIC(12, 2);
    v_nuevo_saldo NUMERIC(12, 2);
    v_total NUMERIC(12, 2) := 0.00;
    v_item RECORD;
    v_compra_id UUID;
    v_item_subtotal NUMERIC(12, 2);
    v_cantidad NUMERIC(10, 2);
    v_precio NUMERIC(12, 2);
    v_descripcion VARCHAR(255);
    v_fecha_efectiva TIMESTAMPTZ := COALESCE(p_fecha, NOW());
BEGIN
    -- 1. Validar que existan items
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La compra debe incluir al menos un producto';
    END IF;

    -- 2. Bloquear y validar cliente perteneciente al usuario (FOR UPDATE)
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM clientes
    WHERE id = p_cliente_id AND user_id = p_user_id AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente no encontrado o inactivo';
    END IF;

    -- 3. Calcular total validando subtotales
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        descripcion VARCHAR(255),
        cantidad NUMERIC(10, 2),
        precio_unitario NUMERIC(12, 2)
    )
    LOOP
        IF v_item.cantidad <= 0.00 THEN
            RAISE EXCEPTION 'La cantidad del producto "%" debe ser mayor a 0', v_item.descripcion;
        END IF;
        IF v_item.precio_unitario < 0.00 THEN
            RAISE EXCEPTION 'El precio del producto "%" no puede ser negativo', v_item.descripcion;
        END IF;

        v_item_subtotal := ROUND(v_item.cantidad * v_item.precio_unitario, 2);
        v_total := v_total + v_item_subtotal;
    END LOOP;

    IF v_total <= 0.00 THEN
        RAISE EXCEPTION 'El total de la compra debe ser mayor a Q0.00';
    END IF;

    v_nuevo_saldo := v_saldo_actual + v_total;

    -- 4. Insertar cabecera de compra
    INSERT INTO compras (
        cliente_id,
        user_id,
        total,
        estado_pago,
        saldo_generado,
        fecha_compra
    ) VALUES (
        p_cliente_id,
        p_user_id,
        v_total,
        'PENDIENTE',
        v_total,
        v_fecha_efectiva
    )
    RETURNING id INTO v_compra_id;

    -- 5. Insertar detalles
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        descripcion VARCHAR(255),
        cantidad NUMERIC(10, 2),
        precio_unitario NUMERIC(12, 2)
    )
    LOOP
        v_item_subtotal := ROUND(v_item.cantidad * v_item.precio_unitario, 2);
        INSERT INTO detalles_compra (
            compra_id,
            descripcion_producto,
            cantidad,
            precio_unitario,
            subtotal
        ) VALUES (
            v_compra_id,
            TRIM(v_item.descripcion),
            v_item.cantidad,
            v_item.precio_unitario,
            v_item_subtotal
        );
    END LOOP;

    -- 6. Actualizar saldo del cliente
    UPDATE clientes
    SET saldo_pendiente = v_nuevo_saldo,
        updated_at = NOW()
    WHERE id = p_cliente_id;

    -- 7. Registrar en el historial de movimientos financieros
    INSERT INTO movimientos_financieros (
        cliente_id,
        user_id,
        tipo,
        referencia_id,
        descripcion,
        monto,
        saldo_anterior,
        saldo_posterior,
        fecha
    ) VALUES (
        p_cliente_id,
        p_user_id,
        'COMPRA',
        v_compra_id,
        CONCAT('Compra de ', jsonb_array_length(p_items), ' producto(s)'),
        v_total,
        v_saldo_actual,
        v_nuevo_saldo,
        v_fecha_efectiva
    );

    -- 8. Recalcular el estado de pago de las compras del cliente
    PERFORM recalcular_estados_pago_cliente(p_user_id, p_cliente_id);

    -- 9. Retornar resultado estructurado
    RETURN jsonb_build_object(
        'compra_id', v_compra_id,
        'total', v_total,
        'saldo_anterior', v_saldo_actual,
        'nuevo_saldo', v_nuevo_saldo,
        'fecha_compra', v_fecha_efectiva
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- FUNCION: registrar_abono_transaccional
-- Valida que el abono no supere la deuda, resta saldo e inserta movimientos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION registrar_abono_transaccional(
    p_user_id UUID,
    p_cliente_id UUID,
    p_monto NUMERIC(12, 2),
    p_observaciones TEXT DEFAULT NULL,
    p_fecha TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo_actual NUMERIC(12, 2);
    v_nuevo_saldo NUMERIC(12, 2);
    v_tipo_movimiento VARCHAR(20);
    v_abono_id UUID;
    v_fecha_efectiva TIMESTAMPTZ := COALESCE(p_fecha, NOW());
BEGIN
    -- 1. Validaciones del monto
    IF p_monto IS NULL OR p_monto <= 0.00 THEN
        RAISE EXCEPTION 'El monto del abono debe ser mayor a Q0.00';
    END IF;

    -- 2. Bloquear y validar cliente (FOR UPDATE)
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM clientes
    WHERE id = p_cliente_id AND user_id = p_user_id AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente no encontrado o inactivo';
    END IF;

    -- 3. Validar existencia de deuda
    IF v_saldo_actual <= 0.00 THEN
        RAISE EXCEPTION 'El cliente no tiene deuda pendiente';
    END IF;

    -- 4. Validar que el abono no exceda la deuda
    IF p_monto > v_saldo_actual THEN
        RAISE EXCEPTION 'El monto ingresado (Q%) supera el saldo pendiente (Q%)', p_monto, v_saldo_actual;
    END IF;

    v_nuevo_saldo := ROUND(v_saldo_actual - p_monto, 2);

    IF v_nuevo_saldo = 0.00 THEN
        v_tipo_movimiento := 'PAGO_COMPLETO';
    ELSE
        v_tipo_movimiento := 'ABONO';
    END IF;

    -- 5. Insertar registro de abono
    INSERT INTO abonos_pagos (
        cliente_id,
        user_id,
        monto,
        tipo_movimiento,
        saldo_anterior,
        saldo_restante,
        observaciones,
        fecha_pago
    ) VALUES (
        p_cliente_id,
        p_user_id,
        p_monto,
        v_tipo_movimiento,
        v_saldo_actual,
        v_nuevo_saldo,
        NULLIF(TRIM(p_observaciones), ''),
        v_fecha_efectiva
    )
    RETURNING id INTO v_abono_id;

    -- 6. Actualizar saldo del cliente
    UPDATE clientes
    SET saldo_pendiente = v_nuevo_saldo,
        updated_at = NOW()
    WHERE id = p_cliente_id;

    -- 7. Registrar en el historial de movimientos financieros
    INSERT INTO movimientos_financieros (
        cliente_id,
        user_id,
        tipo,
        referencia_id,
        descripcion,
        monto,
        saldo_anterior,
        saldo_posterior,
        fecha
    ) VALUES (
        p_cliente_id,
        p_user_id,
        'ABONO',
        v_abono_id,
        CASE WHEN v_tipo_movimiento = 'PAGO_COMPLETO' THEN 'Pago completo de deuda' ELSE 'Abono a deuda' END,
        p_monto,
        v_saldo_actual,
        v_nuevo_saldo,
        v_fecha_efectiva
    );

    -- 8. Recalcular el estado de pago de las compras del cliente
    PERFORM recalcular_estados_pago_cliente(p_user_id, p_cliente_id);

    -- 9. Retornar resultado
    RETURN jsonb_build_object(
        'abono_id', v_abono_id,
        'monto', p_monto,
        'tipo_movimiento', v_tipo_movimiento,
        'saldo_anterior', v_saldo_actual,
        'nuevo_saldo', v_nuevo_saldo,
        'fecha_pago', v_fecha_efectiva
    );
END;
$$;
