import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido: ' + err.message });
  }
}

export function authClienteMiddleware(req, res, next) {
  try {
    if (!req.usuario || req.usuario.tipo !== 'CLIENTE') {
      return res.status(403).json({ error: 'Acceso denegado. Solo clientes.' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Error de autorización' });
  }
}

export function authEmpleadoMiddleware(req, res, next) {
  try {
    if (!req.usuario || req.usuario.tipo !== 'EMPLEADO') {
      return res.status(403).json({ error: 'Acceso denegado. Solo empleados.' });
    }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Error de autorización' });
  }
}
