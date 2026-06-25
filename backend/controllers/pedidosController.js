import { getConnectionQuito, getConnectionGuayaquil } from '../config/database.js';

function generarNumeroFactura() {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FAC-${año}${mes}${dia}-${random}`;
}

export async function crearPedido(req, res) {
  let connection;
  try {
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ error: 'Cédula requerida' });
    }

    connection = await getConnectionQuito();

    // Obtener carrito del cliente
    const carritoResult = await connection.execute(
      `SELECT SUM(CANTIDAD * PRECIO_UNITARIO) as subtotal, SUM(CANTIDAD * PRECIO_UNITARIO * 0.12) as iva
       FROM CARRITO WHERE CEDULA = :cedula`,
      { cedula },
    );

    if (!carritoResult.rows || carritoResult.rows.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const { SUBTOTAL, IVA } = carritoResult.rows[0];
    const subtotal = parseFloat(SUBTOTAL) || 0;
    const iva = parseFloat(IVA) || 0;
    const total = subtotal + iva;

    if (subtotal === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const numeroFactura = generarNumeroFactura();
    const servidor = process.env.SERVIDOR_ORIGEN || 'QUITO_MASTER';

    // Ejecutar procedimiento transaccional
    const result = await connection.execute(
      `BEGIN PR_CREAR_PEDIDO(:p_cedula, :p_numero_factura, :p_subtotal, :p_iva, :p_total, :p_servidor, :p_resultado); END;`,
      {
        p_cedula: cedula,
        p_numero_factura: numeroFactura,
        p_subtotal: subtotal,
        p_iva: iva,
        p_total: total,
        p_servidor: servidor,
        p_resultado: { dir: 3001, as: 'string' }
      }
    );

    const resultado = result.outBinds.p_resultado;

    if (resultado.startsWith('ERROR')) {
      return res.status(400).json({ error: resultado });
    }

    await connection.commit();

    res.status(201).json({
      mensaje: 'Pedido creado exitosamente',
      numeroFactura,
      subtotal,
      iva,
      total
    });

  } catch (err) {
    console.error('Error creando pedido:', err.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error en rollback:', rollbackErr.message);
      }
    }
    res.status(500).json({ error: 'Error al crear pedido: ' + err.message });
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

export async function obtenerPedidos(req, res) {
  let connection;
  try {
    const { cedula } = req.params;

    // Leer de Quito (Master)
    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT
        NUMERO_FACTURA,
        CEDULA,
        SUBTOTAL,
        IVA,
        TOTAL,
        ESTADO,
        FECHA_PEDIDO,
        FECHA_ACTUALIZACION
      FROM PEDIDOS
      WHERE CEDULA = :cedula
      ORDER BY FECHA_PEDIDO DESC`,
      { cedula }
    );

    const pedidos = result.rows.map(row => ({
      numeroFactura: row[0],
      cedula: row[1],
      subtotal: parseFloat(row[2]),
      iva: parseFloat(row[3]),
      total: parseFloat(row[4]),
      estado: row[5],
      fechaPedido: row[6],
      fechaActualizacion: row[7]
    }));

    res.json({
      totalPedidos: pedidos.length,
      pedidos
    });

  } catch (err) {
    console.error('Error obteniendo pedidos:', err.message);
    res.status(500).json({ error: 'Error al obtener pedidos: ' + err.message });
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

export async function obtenerDetallePedido(req, res) {
  let connection;
  try {
    const { numeroFactura } = req.params;

    // Leer de Quito (Master)
    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT
        NUMERO_FACTURA,
        CODIGO_PRODUCTO,
        CANTIDAD,
        PRECIO_UNITARIO,
        SUBTOTAL,
        TALLA,
        DESCUENTO_APLICADO,
        FECHA_AGREGADO
      FROM DETALLE_PEDIDO
      WHERE NUMERO_FACTURA = :numeroFactura`,
      { numeroFactura }
    );

    const detalles = result.rows.map(row => ({
      codigoProducto: row[1],
      cantidad: row[2],
      precioUnitario: parseFloat(row[3]),
      subtotal: parseFloat(row[4]),
      talla: row[5],
      descuentoAplicado: row[6],
      fechaAgregado: row[7]
    }));

    res.json({
      numeroFactura,
      totalItems: detalles.length,
      detalles
    });

  } catch (err) {
    console.error('Error obteniendo detalle pedido:', err.message);
    res.status(500).json({ error: 'Error al obtener detalle pedido: ' + err.message });
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
