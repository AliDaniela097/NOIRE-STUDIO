import { getConnectionQuito } from '../config/database.js';

export async function agregarAlCarrito(req, res) {
  let connection;
  try {
    const { cedula, codigoProducto, cantidad, talla } = req.body;

    if (!cedula || !codigoProducto || !cantidad) {
      return res.status(400).json({ error: 'Campos requeridos faltando' });
    }

    connection = await getConnectionQuito();

    // Obtener precio del producto
    const productoResult = await connection.execute(
      `SELECT PRECIO FROM PRODUCTOS WHERE CODIGO_PRODUCTO = :codigo`,
      { codigo: codigoProducto }
    );

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const precioFinal = parseFloat(productoResult.rows[0][0]);

    // Verificar si el producto ya existe en el carrito
    const existeResult = await connection.execute(
      `SELECT CANTIDAD FROM CARRITO WHERE CEDULA = :cedula AND CODIGO_PRODUCTO = :codigo`,
      { cedula, codigo: codigoProducto }
    );

    if (existeResult.rows.length > 0) {
      // Actualizar cantidad si ya existe
      const cantidadActual = parseInt(existeResult.rows[0][0]);
      await connection.execute(
        `UPDATE CARRITO SET CANTIDAD = :cantidad, PRECIO_UNITARIO = :precio
         WHERE CEDULA = :cedula AND CODIGO_PRODUCTO = :codigo`,
        {
          cantidad: cantidadActual + cantidad,
          precio: precioFinal,
          cedula,
          codigo: codigoProducto
        }
      );
    } else {
      // Insertar nuevo item si no existe
      await connection.execute(
        `INSERT INTO CARRITO (CEDULA, CODIGO_PRODUCTO, CANTIDAD, PRECIO_UNITARIO, TALLA, FECHA_AGREGADO)
         VALUES (:cedula, :codigo, :cantidad, :precio, :talla, SYSDATE)`,
        {
          cedula,
          codigo: codigoProducto,
          cantidad,
          precio: precioFinal,
          talla: talla || null
        }
      );
    }

    await connection.commit();

    res.json({ mensaje: 'Producto agregado al carrito exitosamente' });

  } catch (err) {
    console.error('Error agregando al carrito:', err.message);
    res.status(500).json({ error: 'Error al agregar al carrito: ' + err.message });
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

export async function obtenerCarrito(req, res) {
  let connection;
  try {
    const { cedula } = req.params;

    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT
        CEDULA,
        CODIGO_PRODUCTO,
        CANTIDAD,
        PRECIO_UNITARIO,
        TALLA,
        FECHA_AGREGADO,
        (CANTIDAD * PRECIO_UNITARIO) as SUBTOTAL
      FROM CARRITO
      WHERE CEDULA = :cedula
      ORDER BY FECHA_AGREGADO DESC`,
      { cedula }
    );

    let total = 0;
    const items = result.rows.map(row => {
      const subtotal = parseFloat(row[2]) * parseFloat(row[3]);
      total += subtotal;
      return {
        codigoProducto: row[1],
        cantidad: row[2],
        precioUnitario: parseFloat(row[3]),
        talla: row[4],
        subtotal: subtotal,
        fechaAgregado: row[5]
      };
    });

    res.json({
      cedula,
      totalItems: items.length,
      total: total,
      items
    });

  } catch (err) {
    console.error('Error obteniendo carrito:', err.message);
    res.status(500).json({ error: 'Error al obtener carrito: ' + err.message });
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

export async function eliminarDelCarrito(req, res) {
  let connection;
  try {
    const { cedula, codigoProducto } = req.params;

    connection = await getConnectionQuito();

    await connection.execute(
      `DELETE FROM CARRITO WHERE CEDULA = :cedula AND CODIGO_PRODUCTO = :codigo`,
      { cedula, codigo: codigoProducto }
    );

    await connection.commit();

    res.json({ mensaje: 'Producto eliminado del carrito' });

  } catch (err) {
    console.error('Error eliminando del carrito:', err.message);
    res.status(500).json({ error: 'Error al eliminar del carrito: ' + err.message });
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

export async function vaciarCarrito(req, res) {
  let connection;
  try {
    const { cedula } = req.params;

    connection = await getConnectionQuito();

    await connection.execute(
      `DELETE FROM CARRITO WHERE CEDULA = :cedula`,
      { cedula }
    );

    await connection.commit();

    res.json({ mensaje: 'Carrito vaciado exitosamente' });

  } catch (err) {
    console.error('Error vaciando carrito:', err.message);
    res.status(500).json({ error: 'Error al vaciar carrito: ' + err.message });
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
