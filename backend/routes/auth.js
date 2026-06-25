import express from 'express';
import { registrarCliente, login, obtenerClientePorCedula } from '../controllers/authController.js';

const router = express.Router();

router.post('/registro', registrarCliente);
router.post('/login', login);
router.get('/cliente/:cedula', obtenerClientePorCedula);

export default router;
