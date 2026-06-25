import { getConnectionQuito } from '../config/database.js';

export async function obtenerProductos(req, res) {
  let connection;
  try {
    const { categoria } = req.query;
    connection = await getConnectionQuito();

    // Usar procedimiento almacenado o query directa
    const result = await connection.execute(
      `SELECT
        CODIGO_PRODUCTO,
        NOMBRE,
        DESCRIPCION,
        PRECIO,
        DESCUENTO,
        PRECIO_FINAL,
        STOCK_ACTUAL,
        IMAGEN_URL,
        TIENE_IVA,
        UNIDAD,
        CATEGORIA,
        SUBCATEGORIA
      FROM PRODUCTOS
      WHERE ESTADO = 'ACTIVO'
      AND STOCK_ACTUAL > 0
      ${categoria ? "AND CATEGORIA = '" + categoria + "'" : ''}
      ORDER BY NOMBRE`,
      []
    );

    const productos = result.rows.map(row => ({
      codigoProducto: row[0],
      nombre: row[1],
      descripcion: row[2],
      precio: parseFloat(row[3]),
      descuento: row[4],
      precioFinal: parseFloat(row[5]),
      stockActual: row[6],
      imagenUrl: row[7],
      tieneIva: row[8],
      unidad: row[9],
      categoria: row[10],
      subcategoria: row[11]
    }));

    res.json({
      totalProductos: productos.length,
      productos
    });

  } catch (err) {
    console.error('Error obteniendo productos:', err.message);
    res.status(500).json({ error: 'Error al obtener productos: ' + err.message });
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

export async function obtenerProductoPorCodigo(req, res) {
  let connection;
  try {
    const { codigo } = req.params;
    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT * FROM PRODUCTOS WHERE CODIGO_PRODUCTO = :codigo`,
      { codigo },
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const row = result.rows[0];
    const producto = {
      codigoProducto: row[0],
      nombre: row[1],
      descripcion: row[2],
      precio: parseFloat(row[3]),
      descuento: row[4],
      precioFinal: parseFloat(row[5]),
      stockActual: row[6],
      imagenUrl: row[7],
      tieneIva: row[8],
      unidad: row[9],
      categoria: row[10],
      subcategoria: row[11],
      estado: row[12]
    };

    res.json(producto);

  } catch (err) {
    console.error('Error obteniendo producto:', err.message);
    res.status(500).json({ error: 'Error al obtener producto: ' + err.message });
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

export async function obtenerCategorias(req, res) {
  let connection;
  try {
    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT NOMBRE, DESCRIPCION, ESTADO FROM CATEGORIAS WHERE ESTADO = 'ACTIVO' ORDER BY NOMBRE`,
      [],
    );

    const categorias = result.rows.map(row => ({
      nombre: row[0],
      descripcion: row[1],
      estado: row[2]
    }));

    res.json(categorias);

  } catch (err) {
    console.error('Error obteniendo categorías:', err.message);
    res.status(500).json({ error: 'Error al obtener categorías: ' + err.message });
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

export async function obtenerTallasProducto(req, res) {
  let connection;
  try {
    const { codigo } = req.params;
    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT TALLA, STOCK_TALLA FROM TALLAS_DISPONIBLES
       WHERE CODIGO_PRODUCTO = :codigo
       ORDER BY TALLA`,
      { codigo }
    );

    const tallas = result.rows.map(row => ({
      talla: row[0],
      stock: row[1]
    }));

    res.json(tallas);

  } catch (err) {
    console.error('Error obteniendo tallas:', err.message);
    res.status(500).json({ error: 'Error al obtener tallas: ' + err.message });
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
