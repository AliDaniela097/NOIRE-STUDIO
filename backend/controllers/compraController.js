import { getConnectionQuito } from '../config/database.js';

function generarNumeroFactura() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${año}${mes}${dia}-${random}`;
}

export async function procesarCompraCompleta(req, res) {
  let connection;
  try {
    const { cedula, codigoProducto, cantidad, numeroTarjeta, mesVencimiento, anioVencimiento } = req.body;

    if (!cedula || !codigoProducto || !cantidad) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    connection = await getConnectionQuito();

    // 1. Obtener producto y verificar stock
    const productoResult = await connection.execute(
      `SELECT PRECIO, STOCK_ACTUAL FROM PRODUCTOS WHERE CODIGO_PRODUCTO = :codigo`,
      { codigo: codigoProducto }
    );

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const precio = parseFloat(productoResult.rows[0][0]);
    const stockActual = parseInt(productoResult.rows[0][1]);

    if (stockActual < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    const numeroFactura = generarNumeroFactura();
    const subtotal = precio * cantidad;
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    // 2. Agregar a CARRITO (o actualizar si existe)
    await connection.execute(
      `MERGE INTO CARRITO c USING DUAL ON (c.CEDULA = :cedula AND c.CODIGO_PRODUCTO = :codigo)
       WHEN MATCHED THEN UPDATE SET c.CANTIDAD = c.CANTIDAD + :cantidad
       WHEN NOT MATCHED THEN INSERT (CEDULA, CODIGO_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, TALLA, FECHA_AGREGADO)
       VALUES (:cedula, :codigo, :cantidad, :precio, NULL, SYSDATE)`,
      { cedula, codigo: codigoProducto, cantidad, precio }
    );

    // 3. Crear PEDIDO
    await connection.execute(
      `INSERT INTO PEDIDOS VALUES (:numeroFactura, :cedula, :subtotal, :iva, :total, 'PAGADO', SYSDATE, SYSDATE, 'QUITO_MASTER', NULL)`,
      { numeroFactura, cedula, subtotal, iva, total }
    );

    // 4. Crear DETALLE_PEDIDO
    await connection.execute(
      `INSERT INTO DETALLE_PEDIDO VALUES (:numeroFactura, :codigo, :cantidad, :precio, :subtotal, NULL, NULL, SYSDATE)`,
      { numeroFactura, codigo: codigoProducto, cantidad, precio, subtotal }
    );

    // 5. Crear PAGO
    const ultimos4 = numeroTarjeta ? numeroTarjeta.slice(-4) : '0000';
    await connection.execute(
      `INSERT INTO PAGOS VALUES (:numeroFactura, :cedula, :total, 'TARJETA_CREDITO', '****' || :ultimos4, 'BANCO_GENERAL', :mes, :anio, 'ENCRIPTADO', 'COMPLETADO', 'REF_' || :numeroFactura, SYSDATE, 'QUITO_MASTER', NULL)`,
      { numeroFactura, cedula, total, ultimos4, mes: mesVencimiento || '12', anio: anioVencimiento || '25' }
    );

    // 6. Decrementar stock en PRODUCTOS
    await connection.execute(
      `UPDATE PRODUCTOS SET STOCK_ACTUAL = STOCK_ACTUAL - :cantidad WHERE CODIGO_PRODUCTO = :codigo`,
      { cantidad, codigo: codigoProducto }
    );

    // 7. Registrar movimiento de inventario
    await connection.execute(
      `INSERT INTO MOVIMIENTOS_INVENTARIO VALUES (:numeroFactura, :codigo, :stockAnterior, :stockNuevo, :cantidad, 'VENTA', SYSDATE, 'QUITO_MASTER', USER, 'Venta')`,
      { numeroFactura, codigo: codigoProducto, stockAnterior: stockActual, stockNuevo: stockActual - cantidad, cantidad: -cantidad }
    );

    await connection.commit();

    res.json({
      mensaje: 'Compra realizada exitosamente',
      numeroFactura,
      subtotal,
      iva,
      total,
      nuevoStock: stockActual - cantidad
    });

  } catch (err) {
    console.error('Error procesando compra:', err.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {}
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err.message);
      }
    }
  }
}
