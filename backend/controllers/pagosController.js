import { getConnectionQuito } from '../config/database.js';

function encriptarUltimosDigitos(numeroTarjeta) {
  if (!numeroTarjeta) return null;
  const ultimos = numeroTarjeta.slice(-4);
  return ultimos;
}

export async function procesarPago(req, res) {
  let connection;
  try {
    const {
      numeroFactura,
      cedula,
      monto,
      tipoPago,
      numeroTarjeta,
      banco,
      mesVencimiento,
      anioVencimiento
    } = req.body;

    if (!numeroFactura || !cedula || !monto || !tipoPago) {
      return res.status(400).json({ error: 'Campos requeridos faltando' });
    }

    connection = await getConnectionQuito();

    // Validar que el pedido existe y pertenece al cliente
    const pedidoResult = await connection.execute(
      `SELECT TOTAL, ESTADO FROM PEDIDOS WHERE NUMERO_FACTURA = :numeroFactura AND CEDULA = :cedula`,
      { numeroFactura, cedula }
    );

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const total = pedidoResult.rows[0][0];
    const estado = pedidoResult.rows[0][1];

    if (estado === 'PAGADO') {
      return res.status(400).json({ error: 'Pedido ya fue pagado' });
    }

    if (parseFloat(monto) !== parseFloat(total)) {
      return res.status(400).json({ error: 'Monto no coincide con el total del pedido' });
    }

    const ultimos4 = encriptarUltimosDigitos(numeroTarjeta);
    const servidor = process.env.SERVIDOR_ORIGEN || 'QUITO_MASTER';

    // Ejecutar procedimiento transaccional
    const result = await connection.execute(
      `BEGIN PR_PROCESAR_PAGO(:p_numero_factura, :p_cedula, :p_monto, :p_tipo_pago, :p_ultimos_4, :p_banco, :p_mes, :p_anio, :p_servidor, :p_resultado); END;`,
      {
        p_numero_factura: numeroFactura,
        p_cedula: cedula,
        p_monto: monto,
        p_tipo_pago: tipoPago,
        p_ultimos_4: ultimos4,
        p_banco: banco || 'N/A',
        p_mes: mesVencimiento || '00',
        p_anio: anioVencimiento || '0000',
        p_servidor: servidor,
        p_resultado: { dir: 3001, as: 'string' }
      }
    );

    const resultado = result.outBinds.p_resultado;

    if (resultado.startsWith('ERROR')) {
      return res.status(400).json({ error: resultado });
    }

    await connection.commit();

    res.status(200).json({
      mensaje: 'Pago procesado exitosamente',
      numeroFactura,
      monto,
      estado: 'PAGADO'
    });

  } catch (err) {
    console.error('Error procesando pago:', err.message);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error en rollback:', rollbackErr.message);
      }
    }
    res.status(500).json({ error: 'Error al procesar pago: ' + err.message });
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

export async function obtenerPago(req, res) {
  let connection;
  try {
    const { numeroFactura } = req.params;

    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT
        NUMERO_FACTURA,
        CEDULA,
        MONTO,
        TIPO_PAGO,
        NUMERO_TARJETA_ENCRIPTADO,
        BANCO,
        ESTADO_PAGO,
        REFERENCIA_TRANSACCION,
        FECHA_PAGO
      FROM PAGOS
      WHERE NUMERO_FACTURA = :numeroFactura`,
      { numeroFactura }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const row = result.rows[0];
    const pago = {
      numeroFactura: row[0],
      cedula: row[1],
      monto: parseFloat(row[2]),
      tipoPago: row[3],
      numeroTarjeta: row[4],
      banco: row[5],
      estadoPago: row[6],
      referenciaTransaccion: row[7],
      fechaPago: row[8]
    };

    res.json(pago);

  } catch (err) {
    console.error('Error obteniendo pago:', err.message);
    res.status(500).json({ error: 'Error al obtener pago: ' + err.message });
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
