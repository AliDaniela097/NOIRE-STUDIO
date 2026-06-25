import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializePools, closePools } from './config/database.js';

// Rutas
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import carritoRoutes from './routes/carrito.js';
import pedidosRoutes from './routes/pedidos.js';
import pagosRoutes from './routes/pagos.js';
import compraRoutes from './routes/compra.js';
import dashboardRoutes from './routes/dashboard.js';

// Configuración
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/compra', compraRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Inicializando NOIRE E-COMMERCE Backend...');

    // Conectar a bases de datos
    await initializePools();

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(`✅ Servidor escuchando en puerto ${PORT}`);
      console.log(`📡 http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });

  } catch (err) {
    console.error('❌ Error al iniciar servidor:', err.message);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await closePools();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando servidor (SIGTERM)...');
  await closePools();
  process.exit(0);
});

startServer();
