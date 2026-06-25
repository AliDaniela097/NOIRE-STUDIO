import { useState, useCallback } from 'react';
import { carrito } from '../services/api';

export function useCarrito(cedula) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCarrito = useCallback(async () => {
    if (!cedula) return;
    try {
      setCargando(true);
      setError(null);
      const data = await carrito.obtener(cedula);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [cedula]);

  const agregarProducto = useCallback(async (codigoProducto, cantidad, talla = null) => {
    if (!cedula) {
      setError('Debes iniciar sesión');
      return false;
    }
    try {
      setError(null);
      await carrito.agregar(cedula, codigoProducto, cantidad, talla);
      await cargarCarrito();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [cedula, cargarCarrito]);

  const eliminarProducto = useCallback(async (codigoProducto) => {
    if (!cedula) return false;
    try {
      setError(null);
      await carrito.eliminarProducto(cedula, codigoProducto);
      await cargarCarrito();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [cedula, cargarCarrito]);

  const vaciar = useCallback(async () => {
    if (!cedula) return false;
    try {
      setError(null);
      await carrito.vaciar(cedula);
      setItems([]);
      setTotal(0);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [cedula]);

  return {
    items,
    total,
    cargando,
    error,
    cargarCarrito,
    agregarProducto,
    eliminarProducto,
    vaciar,
  };
}
