import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { agregarAlCarrito, obtenerCarrito, eliminarDelCarrito, vaciarCarrito } from '../controllers/carritoController.js';

const router = express.Router();

router.post('/agregar', authMiddleware, agregarAlCarrito);
router.get('/:cedula', authMiddleware, obtenerCarrito);
router.delete('/:cedula/:codigoProducto', authMiddleware, eliminarDelCarrito);
router.delete('/:cedula', authMiddleware, vaciarCarrito);

export default router;
