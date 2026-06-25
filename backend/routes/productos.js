import express from 'express';
import { obtenerProductos, obtenerProductoPorCodigo, obtenerCategorias, obtenerTallasProducto } from '../controllers/productosController.js';

const router = express.Router();

router.get('/', obtenerProductos);
router.get('/categorias/lista', obtenerCategorias);
router.get('/tallas-disponibles/:codigo', obtenerTallasProducto);
router.get('/:codigo', obtenerProductoPorCodigo);

export default router;
