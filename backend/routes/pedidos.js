import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { crearPedido, obtenerPedidos, obtenerDetallePedido } from '../controllers/pedidosController.js';

const router = express.Router();

router.post('/crear', authMiddleware, crearPedido);
router.get('/:cedula', authMiddleware, obtenerPedidos);
router.get('/:numeroFactura/detalle', authMiddleware, obtenerDetallePedido);

export default router;
