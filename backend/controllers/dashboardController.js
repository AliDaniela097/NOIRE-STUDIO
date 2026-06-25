import { getConnectionGuayaquil } from '../config/database.js';

export async function obtenerEstadisticasVentas(req, res) {
  let connection;
  try {
    connection = await getConnectionGuayaquil();

    // Total vendido
    const totalRes = await connection.execute(
      `SELECT COALESCE(SUM(MONTO_VENTA), 0) as total, COUNT(*) as cantidad_ventas FROM HECHOS_VENTAS`
    );
    const totalVendido = parseFloat(totalRes.rows[0][0]) || 0;
    const totalVentas = parseInt(totalRes.rows[0][1]) || 0;

    // Productos más vendidos
    const productosRes = await connection.execute(
      `SELECT p.NOMBRE, SUM(h.CANTIDAD) as cantidad_vendida, SUM(h.MONTO_VENTA) as ingresos
       FROM HECHOS_VENTAS h
       JOIN DIM_PRODUCTO p ON h.PRODUCTO_ID = p.PRODUCTO_ID
       GROUP BY p.NOMBRE
       ORDER BY cantidad_vendida DESC`
    );

    const productosMasVendidos = (productosRes.rows || []).slice(0, 5).map(row => ({
      nombre: row[0],
      cantidad: parseInt(row[1]),
      ingresos: parseFloat(row[2])
    }));

    // Por mes
    const porMesRes = await connection.execute(
      `SELECT t.NOMBRE_MES, t.ANIO, SUM(h.MONTO_VENTA) as total_mes
       FROM HECHOS_VENTAS h
       JOIN DIM_TIEMPO t ON h.TIEMPO_ID = t.TIEMPO_ID
       GROUP BY t.NOMBRE_MES, t.ANIO
       ORDER BY t.ANIO, t.MES`
    );

    const porMes = (porMesRes.rows || []).map(row => ({
      mes: row[0],
      anio: row[1],
      total: parseFloat(row[2])
    }));

    res.json({
      totalVendido,
      totalVentas,
      productosMasVendidos,
      porMes
    });

  } catch (err) {
    console.error('Error en dashboard:', err.message);
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

export async function obtenerEstadisticasAdmin(req, res) {
  let connection;
  try {
    connection = await getConnectionGuayaquil();

    // Total clientes
    const clientesRes = await connection.execute(
      `SELECT COUNT(*) FROM DIM_CLIENTE`
    );
    const totalClientes = parseInt(clientesRes.rows[0][0]) || 0;

    // Total productos
    const productosRes = await connection.execute(
      `SELECT COUNT(*) FROM DIM_PRODUCTO`
    );
    const totalProductos = parseInt(productosRes.rows[0][0]) || 0;

    // Total ventas
    const ventasRes = await connection.execute(
      `SELECT COUNT(*), COALESCE(SUM(MONTO_VENTA), 0) FROM HECHOS_VENTAS`
    );
    const totalVentas = parseInt(ventasRes.rows[0][0]) || 0;
    const totalIngresos = parseFloat(ventasRes.rows[0][1]) || 0;

    // Top clientes
    const topClientesRes = await connection.execute(
      `SELECT c.NOMBRE, SUM(h.MONTO_VENTA) as total_cliente
       FROM HECHOS_VENTAS h
       JOIN DIM_CLIENTE c ON h.CLIENTE_ID = c.CLIENTE_ID
       GROUP BY c.NOMBRE
       ORDER BY total_cliente DESC`
    );

    const topClientes = (topClientesRes.rows || []).slice(0, 5).map(row => ({
      cliente: row[0],
      total: parseFloat(row[1])
    }));

    res.json({
      totalClientes,
      totalProductos,
      totalVentas,
      totalIngresos,
      topClientes
    });

  } catch (err) {
    console.error('Error en dashboard admin:', err.message);
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
