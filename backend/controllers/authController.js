import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { getConnectionQuito } from '../config/database.js';

export async function registrarCliente(req, res) {
  let connection;
  try {
    const { cedula, nombre, email, telefono, direccion, ciudad, usuario, password } = req.body;

    if (!cedula || !nombre || !email || !usuario || !password) {
      return res.status(400).json({ error: 'Campos requeridos faltando' });
    }

    connection = await getConnectionQuito();

    // Ejecutar procedimiento almacenado
    const result = await connection.execute(
      `BEGIN PR_REGISTRAR_CLIENTE(:p_cedula, :p_nombre, :p_email, :p_telefono, :p_direccion, :p_ciudad, :p_usuario, :p_password, :p_resultado); END;`,
      {
        p_cedula: cedula,
        p_nombre: nombre,
        p_email: email,
        p_telefono: telefono,
        p_direccion: direccion,
        p_ciudad: ciudad,
        p_usuario: usuario,
        p_password: password,
        p_resultado: { dir: 3001, as: 'string' } // OUT parameter
      }
    );

    const resultado = result.outBinds.p_resultado;

    if (resultado.startsWith('ERROR')) {
      return res.status(400).json({ error: resultado });
    }

    res.status(201).json({
      mensaje: 'Cliente registrado exitosamente',
      cedula
    });

  } catch (err) {
    console.error('Error en registro:', err.message);
    res.status(500).json({ error: 'Error al registrar cliente: ' + err.message });
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

export async function login(req, res) {
  let connection;
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    connection = await getConnectionQuito();

    // Obtener el hash de la BD
    const resultPassword = await connection.execute(
      `SELECT PASSWORD_HASH FROM USUARIOS WHERE USUARIO = :usuario`,
      { usuario }
    );

    if (resultPassword.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const passwordFromDB = resultPassword.rows[0][0];

    if (password !== passwordFromDB) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Obtener CEDULA y TIPO_USUARIO
    const userResult = await connection.execute(
      `SELECT CEDULA, TIPO_USUARIO FROM USUARIOS WHERE USUARIO = :usuario`,
      { usuario }
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const cedula = userResult.rows[0][0];
    const tipo = userResult.rows[0][1];

    // Obtener datos completos de CLIENTES
    const clientResult = await connection.execute(
      `SELECT NOMBRE, EMAIL, TELEFONO, DIRECCION, CIUDAD FROM CLIENTES WHERE CEDULA = :cedula`,
      { cedula }
    );

    const nombre = clientResult.rows.length > 0 ? clientResult.rows[0][0] : 'Usuario';
    const email = clientResult.rows.length > 0 ? clientResult.rows[0][1] : '';
    const telefono = clientResult.rows.length > 0 ? clientResult.rows[0][2] : '';
    const direccion = clientResult.rows.length > 0 ? clientResult.rows[0][3] : '';
    const ciudad = clientResult.rows.length > 0 ? clientResult.rows[0][4] : '';

    // Generar JWT
    const token = jwt.sign(
      { cedula, usuario, tipo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { cedula, nombre, tipo, email, telefono, direccion, ciudad }
    });

  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error en login: ' + err.message });
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

export async function obtenerClientePorCedula(req, res) {
  let connection;
  try {
    const { cedula } = req.params;

    if (!cedula) {
      return res.status(400).json({ error: 'Cédula requerida' });
    }

    connection = await getConnectionQuito();

    const result = await connection.execute(
      `SELECT CEDULA, NOMBRE, EMAIL, TELEFONO, DIRECCION, CIUDAD FROM CLIENTES WHERE CEDULA = :cedula`,
      { cedula }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const row = result.rows[0];
    res.json({
      cedula: row[0],
      nombre: row[1],
      email: row[2],
      telefono: row[3],
      direccion: row[4],
      ciudad: row[5]
    });

  } catch (err) {
    console.error('Error obteniendo cliente:', err.message);
    res.status(500).json({ error: 'Error al obtener cliente: ' + err.message });
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

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Token inválido: ' + err.message);
  }
}
