# 🚀 SETUP RÁPIDO - NOIRE E-COMMERCE (HOY)

## Paso 1: Instalar Backend (5 minutos)

```bash
cd backend
npm install
```

## Paso 2: Configurar Credenciales Oracle (.env)

Editar `backend/.env`:

```env
DB_QUITO_USER=sys
DB_QUITO_PASSWORD=[TU_PASSWORD_QUITO]
DB_QUITO_CONNECTIONSTRING=192.168.100.140:1521/pdbQ

DB_GUAYAQUIL_USER=sys
DB_GUAYAQUIL_PASSWORD=[TU_PASSWORD_GUAYAQUIL]
DB_GUAYAQUIL_CONNECTIONSTRING=192.168.100.120:1521/pdbG

JWT_SECRET=noire_ecommerce_secret_key_2024
PORT=5000
```

## Paso 3: Iniciar Backend

```bash
npm start
```

Esperar hasta ver:
```
✅ Quito conectado exitosamente
✅ Guayaquil conectado exitosamente
✅ Servidor escuchando en puerto 5000
```

## Paso 4: Instalar Frontend (en otra terminal)

```bash
cd NOIRE_STUDIO_ECOMMERCE
npm install
```

## Paso 5: Iniciar Frontend

```bash
npm run dev
```

Abrirá automáticamente en `http://localhost:5173` (o similar)

---

## ✅ Sistema Listo

| Componente | URL | Estado |
|-----------|-----|--------|
| Frontend React | http://localhost:5173 | ✅ Activo |
| Backend API | http://localhost:5000 | ✅ Activo |
| Oracle Quito (Master) | 192.168.100.140:1521 | ✅ Conectado |
| Oracle Guayaquil (Replica) | 192.168.100.120:1521 | ✅ Conectado |

---

## 🧪 Probar API con cURL

### 1. Registrar Usuario
```bash
curl -X POST http://localhost:5000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": "1234567890",
    "nombre": "Juan Test",
    "email": "juan@test.com",
    "telefono": "0987654321",
    "direccion": "Calle Test 123",
    "ciudad": "Quito",
    "usuario": "juantest",
    "password": "Test123456"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "juantest",
    "password": "Test123456"
  }'
```

Esto retornará un `token` (JWT). Copiar el token para los siguientes pasos.

### 3. Obtener Productos
```bash
curl http://localhost:5000/api/productos
```

### 4. Agregar al Carrito (con token)
```bash
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_DEL_LOGIN]" \
  -d '{
    "cedula": "1234567890",
    "codigoProducto": "PROD001",
    "cantidad": 2,
    "talla": "M"
  }'
```

### 5. Ver Carrito
```bash
curl http://localhost:5000/api/carrito/1234567890 \
  -H "Authorization: Bearer [TOKEN_DEL_LOGIN]"
```

### 6. Crear Pedido
```bash
curl -X POST http://localhost:5000/api/pedidos/crear \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN_DEL_LOGIN]" \
  -d '{
    "cedula": "1234567890"
  }'
```

---

## 🐛 Problemas Comunes

### ❌ "Cannot connect to Quito"
- Verificar que `192.168.100.140` está accesible
- Revisar `.env` con credenciales correctas
- Asegurar que Oracle está corriendo en Quito

### ❌ "Token inválido"
- Copiar el JWT completo del login (sin comillas)
- Usar en header: `Authorization: Bearer TOKEN`

### ❌ "Producto no encontrado"
- Primero insertar datos de prueba en Oracle
- Ejecutar script de categorías/productos

---

## 📚 Documentación Completa

- Backend: `backend/README.md`
- Configuración: `.env` y `.env.local`
- Servicios API: `src/services/api.js`
- Hooks: `src/hooks/useAuth.js`, `useCarrito.js`

---

## 🎉 ¡Listo!

Sistema completo funcionando en **30 minutos** con transaccionalidad y replicación.

**Arquitectura:**
- ✅ Quito = Master (escritura: pedidos, pagos, usuarios)
- ✅ Guayaquil = Replica (lectura: productos, catálogos)
- ✅ JWT Authentication
- ✅ Procedimientos transaccionales en Oracle
- ✅ React Frontend listo

---

**Fecha:** 2026-06-24  
**Estado:** 🚀 PRODUCCIÓN LISTA
