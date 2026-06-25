import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const usuarios = {};
const productos = [
  { codigoProducto: 'PROD001', nombre: 'Camiseta Premium', precio: 45.00, stock: 50, categoria: 'MUJER' },
  { codigoProducto: 'PROD002', nombre: 'Pantalón Denim', precio: 89.99, stock: 30, categoria: 'HOMBRE' },
  { codigoProducto: 'PROD003', nombre: 'Zapatos Deportivos', precio: 120.00, stock: 20, categoria: 'CALZADO' },
];
const carritos = {};
const pedidos = {};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK (MOCK MODE)', timestamp: new Date().toISOString() });
});

// ============ AUTH ============
app.post('/api/auth/registro', (req, res) => {
  const { cedula, nombre, email, usuario, password } = req.body;
  if (!cedula || !usuario || !password) {
    return res.status(400).json({ error: 'Campos requeridos faltando' });
  }
  if (usuarios[usuario]) {
    return res.status(400).json({ error: 'Usuario ya existe' });
  }
  usuarios[usuario] = { cedula, nombre, email, password };
  res.status(201).json({ mensaje: 'Cliente registrado exitosamente', cedula });
});

app.post('/api/auth/login', (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const user = usuarios[usuario];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const token = Buffer.from(`${usuario}:${user.cedula}`).toString('base64');
  res.json({
    mensaje: 'Login exitoso',
    token,
    usuario: { cedula: user.cedula, nombre: user.nombre, tipo: 'CLIENTE' }
  });
});

// ============ PRODUCTOS ============
app.get('/api/productos', (req, res) => {
  const { categoria } = req.query;
  let prods = productos;
  if (categoria) {
    prods = prods.filter(p => p.categoria === categoria);
  }
  res.json({ totalProductos: prods.length, productos: prods });
});

app.get('/api/productos/:codigo', (req, res) => {
  const prod = productos.find(p => p.codigoProducto === req.params.codigo);
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(prod);
});

app.get('/api/productos/categorias/lista', (req, res) => {
  const categorias = [...new Set(productos.map(p => p.categoria))];
  res.json(categorias.map(c => ({ nombre: c, descripcion: '', estado: 'ACTIVO' })));
});

// ============ CARRITO ============
app.post('/api/carrito/agregar', (req, res) => {
  const { cedula, codigoProducto, cantidad } = req.body;
  if (!cedula || !codigoProducto || !cantidad) {
    return res.status(400).json({ error: 'Campos requeridos faltando' });
  }
  const prod = productos.find(p => p.codigoProducto === codigoProducto);
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

  if (!carritos[cedula]) carritos[cedula] = [];
  const item = carritos[cedula].find(i => i.codigoProducto === codigoProducto);
  if (item) {
    item.cantidad += cantidad;
  } else {
    carritos[cedula].push({ codigoProducto, cantidad, precioUnitario: prod.precio, talla: null });
  }
  res.json({ mensaje: 'Producto agregado al carrito exitosamente' });
});

app.get('/api/carrito/:cedula', (req, res) => {
  const items = carritos[req.params.cedula] || [];
  const total = items.reduce((sum, i) => sum + (i.cantidad * i.precioUnitario), 0);
  res.json({ cedula: req.params.cedula, totalItems: items.length, total, items });
});

app.delete('/api/carrito/:cedula/:codigoProducto', (req, res) => {
  if (carritos[req.params.cedula]) {
    carritos[req.params.cedula] = carritos[req.params.cedula].filter(
      i => i.codigoProducto !== req.params.codigoProducto
    );
  }
  res.json({ mensaje: 'Producto eliminado del carrito' });
});

app.delete('/api/carrito/:cedula', (req, res) => {
  carritos[req.params.cedula] = [];
  res.json({ mensaje: 'Carrito vaciado exitosamente' });
});

// ============ PEDIDOS ============
app.post('/api/pedidos/crear', (req, res) => {
  const { cedula } = req.body;
  if (!cedula) return res.status(400).json({ error: 'Cédula requerida' });

  const items = carritos[cedula] || [];
  if (items.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

  const subtotal = items.reduce((sum, i) => sum + (i.cantidad * i.precioUnitario), 0);
  const iva = subtotal * 0.12;
  const total = subtotal + iva;
  const numeroFactura = `FAC-${Date.now()}`;

  pedidos[numeroFactura] = { cedula, subtotal, iva, total, estado: 'PENDIENTE', items };
  carritos[cedula] = [];

  res.status(201).json({ mensaje: 'Pedido creado exitosamente', numeroFactura, subtotal, iva, total });
});

app.get('/api/pedidos/:cedula', (req, res) => {
  const userPedidos = Object.entries(pedidos)
    .filter(([_, p]) => p.cedula === req.params.cedula)
    .map(([num, p]) => ({ numeroFactura: num, ...p }));
  res.json({ totalPedidos: userPedidos.length, pedidos: userPedidos });
});

// ============ PAGOS ============
app.post('/api/pagos/procesar', (req, res) => {
  const { numeroFactura, cedula, monto } = req.body;
  if (!numeroFactura || !cedula || !monto) {
    return res.status(400).json({ error: 'Campos requeridos faltando' });
  }
  const pedido = pedidos[numeroFactura];
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (parseFloat(monto) !== parseFloat(pedido.total)) {
    return res.status(400).json({ error: 'Monto no coincide' });
  }
  pedido.estado = 'PAGADO';
  res.json({ mensaje: 'Pago procesado exitosamente', numeroFactura, monto, estado: 'PAGADO' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ MOCK Backend escuchando en puerto ${PORT}`);
  console.log(`📡 http://localhost:${PORT}/health`);
  console.log(`⚠️  MODO MOCK - Sin conexión a Oracle (para desarrollo)`);
});
