import express from 'express';
import { procesarCompraCompleta } from '../controllers/compraController.js';

const router = express.Router();

router.post('/procesar', procesarCompraCompleta);

export default router;
