import express from 'express';
import { obtenerEstadisticasVentas, obtenerEstadisticasAdmin } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/ventas', obtenerEstadisticasVentas);
router.get('/admin', obtenerEstadisticasAdmin);

export default router;
