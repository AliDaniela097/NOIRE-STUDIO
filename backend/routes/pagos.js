import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { procesarPago, obtenerPago } from '../controllers/pagosController.js';

const router = express.Router();

router.post('/procesar', authMiddleware, procesarPago);
router.get('/:numeroFactura', authMiddleware, obtenerPago);

export default router;
