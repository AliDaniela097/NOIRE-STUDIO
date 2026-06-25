import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Pool para QUITO (Master - Escritura)
const dbQuitoConfig = {
  user: process.env.DB_QUITO_USER,
  password: process.env.DB_QUITO_PASSWORD,
  connectionString: process.env.DB_QUITO_CONNECTIONSTRING,
  externalAuth: false,
  privilege: oracledb.SYSDBA,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
};

// Pool para GUAYAQUIL (Replica - Lectura)
const dbGuayaquilConfig = {
  user: process.env.DB_GUAYAQUIL_USER,
  password: process.env.DB_GUAYAQUIL_PASSWORD,
  connectionString: process.env.DB_GUAYAQUIL_CONNECTIONSTRING,
  externalAuth: false,
  privilege: oracledb.SYSDBA,
  poolMin: 1,
  poolMax: 5,
  poolIncrement: 1,
};

let poolQuito = null;
let poolGuayaquil = null;

export async function initializePools() {
  try {
    console.log('🔗 Inicializando conexión QUITO (Master)...');
    poolQuito = await oracledb.createPool(dbQuitoConfig);
    console.log('✅ Quito conectado exitosamente');

    console.log('🔗 Inicializando conexión GUAYAQUIL (Replica)...');
    try {
      poolGuayaquil = await oracledb.createPool(dbGuayaquilConfig);
      console.log('✅ Guayaquil conectado exitosamente');
    } catch (guayaquilErr) {
      console.warn('⚠️  Guayaquil no disponible, continuando sin Replica:', guayaquilErr.message);
      poolGuayaquil = null;
    }
  } catch (err) {
    console.error('❌ Error al conectar QUITO (Master):', err.message);
    throw err;
  }
}

export async function getConnectionQuito() {
  try {
    if (!poolQuito) {
      throw new Error('Pool Quito no inicializado');
    }
    return await poolQuito.getConnection();
  } catch (err) {
    console.error('Error al obtener conexión Quito:', err.message);
    throw err;
  }
}

export async function getConnectionGuayaquil() {
  try {
    if (!poolGuayaquil) {
      throw new Error('Pool Guayaquil no inicializado');
    }
    return await poolGuayaquil.getConnection();
  } catch (err) {
    console.error('Error al obtener conexión Guayaquil:', err.message);
    throw err;
  }
}

export async function closePools() {
  try {
    if (poolQuito) {
      await poolQuito.close();
      console.log('Pool Quito cerrado');
    }
    if (poolGuayaquil) {
      await poolGuayaquil.close();
      console.log('Pool Guayaquil cerrado');
    }
  } catch (err) {
    console.error('Error al cerrar pools:', err.message);
  }
}

export default {
  initializePools,
  getConnectionQuito,
  getConnectionGuayaquil,
  closePools,
};
