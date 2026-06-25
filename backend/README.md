# NOIRE E-COMMERCE Backend

Backend Node.js + Express conectado a Oracle (Quito Master + Guayaquil Replica)

## 🚀 Instalación Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar archivo .env
Editar `.env` con tus credenciales de Oracle:

```env
DB_QUITO_USER=sys
DB_QUITO_PASSWORD=tu_password
DB_QUITO_CONNECTIONSTRING=192.168.100.140:1521/pdbQ

DB_GUAYAQUIL_USER=sys
DB_GUAYAQUIL_PASSWORD=tu_password
DB_GUAYAQUIL_CONNECTIONSTRING=192.168.100.120:1521/pdbG

JWT_SECRET=tu_secret_key_cambiar_en_produccion
PORT=5000
```

### 3. Iniciar servidor
```bash
npm start
```

O modo desarrollo con auto-reload:
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## 📡 Endpoints Disponibles

### Autenticación
- `POST /api/auth/registro` - Registrar cliente
- `POST /api/auth/login` - Login (retorna JWT)

### Productos (Lectura desde Guayaquil)
- `GET /api/productos` - Obtener todos los productos
- `GET /api/productos?categoria=MUJER` - Filtrar por categoría
- `GET /api/productos/:codigo` - Obtener producto por código
- `GET /api/productos/categorias/lista` - Obtener categorías

### Carrito (Escritura en Quito)
- `POST /api/carrito/agregar` - Agregar producto al carrito
- `GET /api/carrito/:cedula` - Obtener carrito del cliente
- `DELETE /api/carrito/:cedula/:codigoProducto` - Eliminar producto del carrito
- `DELETE /api/carrito/:cedula` - Vaciar carrito

### Pedidos (Transacciones en Quito)
- `POST /api/pedidos/crear` - Crear pedido desde carrito
- `GET /api/pedidos/:cedula` - Obtener pedidos del cliente
- `GET /api/pedidos/:numeroFactura/detalle` - Obtener detalle del pedido

### Pagos (Transacciones en Quito)
- `POST /api/pagos/procesar` - Procesar pago
- `GET /api/pagos/:numeroFactura` - Obtener info del pago

## 🔐 Headers Requeridos

Para todas las rutas protegidas, incluir:
```
Authorization: Bearer <JWT_TOKEN>
```

## 📝 Ejemplos de Uso

### Registro
```bash
curl -X POST http://localhost:5000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "0987654321",
    "direccion": "Calle Principal 123",
    "ciudad": "Quito",
    "usuario": "juanperez",
    "password": "MiPassword123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "juanperez",
    "password": "MiPassword123"
  }'
```

### Obtener Productos
```bash
curl http://localhost:5000/api/productos
```

### Agregar al Carrito (requiere token)
```bash
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "cedula": "1234567890",
    "codigoProducto": "PROD001",
    "cantidad": 2,
    "talla": "M"
  }'
```

### Crear Pedido (requiere token)
```bash
curl -X POST http://localhost:5000/api/pedidos/crear \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "cedula": "1234567890"
  }'
```

### Procesar Pago (requiere token)
```bash
curl -X POST http://localhost:5000/api/pagos/procesar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "numeroFactura": "FAC-20240115-0001",
    "cedula": "1234567890",
    "monto": 150.00,
    "tipoPago": "TARJETA_CREDITO",
    "numeroTarjeta": "4111111111111111",
    "banco": "BANCO PICHINCHA",
    "mesVencimiento": "12",
    "anioVencimiento": "2025"
  }'
```

## 🏗️ Arquitectura

```
QUITO (Master - 192.168.100.140)
├── Escritura: USUARIOS, CLIENTES, PEDIDOS, PAGOS, CARRITO
├── Transacciones: PR_CREAR_PEDIDO, PR_PROCESAR_PAGO
└── Sincronización → Guayaquil

GUAYAQUIL (Replica - 192.168.100.120)
├── Lectura: PRODUCTOS, CATEGORIAS
├── Copia de Pedidos/Pagos (Materialized Views)
└── Performance para consultas
```

## 🔒 Seguridad

- Passwords hasheados con bcryptjs
- JWT para autenticación sin estado
- Conexiones transaccionales con Savepoints
- Números de tarjeta encriptados (últimos 4 dígitos visible)
- CORS configurado

## 🐛 Troubleshooting

### Error: "Pool no inicializado"
Verificar que las credenciales en `.env` sean correctas y que los servidores Oracle estén accesibles.

### Error: "TNS:no listener"
Verificar que el `CONNECTIONSTRING` es correcto (IP:PUERTO/NOMBREBD)

### Error: "ORA-01017: invalid username/password"
Revisar usuario y contraseña en `.env`

## 📦 Dependencias

- `express` - Framework web
- `oracledb` - Driver Oracle para Node.js
- `cors` - CORS middleware
- `jsonwebtoken` - Manejo de JWT
- `bcryptjs` - Hash de contraseñas
- `dotenv` - Variables de entorno

---

**Versión:** 1.0.0  
**Última actualización:** 2026-06-24
