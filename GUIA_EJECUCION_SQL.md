# 🗄️ GUÍA: Ejecutar SQL de Tallas y Productos

## 📍 Ubicación del Script
```
C:\Users\ALISSON BASANTES\Desktop\NOIRE_STUDIO_ECOMMERCE\SQL_TALLAS_Y_PRODUCTOS.sql
```

## 🚀 PASO 1: Ejecutar en QUITO (Master)

### Opción A: SQL Developer
1. Abre **SQL Developer**
2. Conecta a **QUITO** (192.168.100.140)
3. Abre el archivo `SQL_TALLAS_Y_PRODUCTOS.sql`
4. Click **"Run Script"** (o Ctrl+Shift+Enter)
5. Verifica que dice `✅ Commit completado`

### Opción B: SQL*Plus (desde terminal)
```bash
sqlplus sdmppdbQ/lticPUCE26@192.168.100.140:1521/pdbQ
SQL> @SQL_TALLAS_Y_PRODUCTOS.sql
SQL> EXIT
```

---

## ✅ QUÉ HACE EL SCRIPT

### 1. Modifica tabla PRODUCTOS
- Agrega columna `TIPO_TALLA` (SIN_TALLA, TALLA_ROPA, TALLA_NUMERO)

### 2. Crea tabla TALLAS_DISPONIBLES
```sql
CODIGO_PRODUCTO | TALLA | STOCK_TALLA
ROPA001         | S     | 15
ROPA001         | M     | 20
ROPA001         | L     | 10
ROPA001         | XL    | 5
CALZ001         | 35    | 5
CALZ001         | 36    | 8
...
```

### 3. Inserta DATOS DE PRUEBA

#### 👕 ROPA (Tallas: S, M, L, XL)
- **ROPA001** - Camiseta Premium Mujer
- **ROPA002** - Pantalón Denim Clásico
- **ROPA003** - Vestido Elegante

#### 👞 CALZADO (Tallas: 35-50)
- **CALZ001** - Zapatos Deportivos Hombre
- **CALZ002** - Botas Chelsea Mujer

#### 👠 TACONES (Tallas: 35-50)
- **TAC001** - Tacones Altos Rosa
- **TAC002** - Tacones Negros Elegantes

#### 🎁 SIN TALLA
- **ACC001** - Bufanda Lana Camel (SIN_TALLA)
- **ACC002** - Bolso Cuero Marrón (SIN_TALLA)
- **ACC003** - Gorra Deportiva Azul (SIN_TALLA)

---

## 🔗 PASO 2: Crear DBLinks (Quito ↔ Guayaquil)

Ejecuta esto en **QUITO** para crear el link a Guayaquil:

```sql
-- En QUITO: Link hacia GUAYAQUIL
CREATE PUBLIC DATABASE LINK guayaquil_link
CONNECT TO sdmppdbGY IDENTIFIED BY lticPUCE26
USING '192.168.100.120:1521/pdbGY';

-- Probar el link
SELECT * FROM DUAL@guayaquil_link;
```

Ejecuta esto en **GUAYAQUIL** para crear el link a Quito:

```sql
-- En GUAYAQUIL: Link hacia QUITO
CREATE PUBLIC DATABASE LINK quito_link
CONNECT TO sdmppdbQ IDENTIFIED BY lticPUCE26
USING '192.168.100.140:1521/pdbQ';

-- Probar el link
SELECT * FROM DUAL@quito_link;
```

---

## ⏱️ Replicación: Quito → Guayaquil

Después de los DBLinks, ejecuta en **QUITO**:

```sql
-- Crear Materialized View en Quito para replicar a Guayaquil
CREATE MATERIALIZED VIEW MV_PRODUCTOS_REPLICA
REFRESH COMPLETE ON COMMIT
AS
SELECT * FROM PRODUCTOS;

-- O con refresh programado cada 5 minutos:
CREATE MATERIALIZED VIEW MV_PRODUCTOS_REPLICA
REFRESH COMPLETE
START WITH SYSDATE
NEXT SYSDATE + INTERVAL '5' MINUTE
AS
SELECT * FROM PRODUCTOS;
```

---

## ✔️ VERIFICACIÓN

Después de ejecutar el script, verifica en QUITO:

```sql
-- Ver todos los productos
SELECT CODIGO_PRODUCTO, NOMBRE, TIPO_TALLA FROM PRODUCTOS;

-- Ver productos con sus tallas
SELECT p.CODIGO_PRODUCTO, p.NOMBRE, p.TIPO_TALLA, t.TALLA, t.STOCK_TALLA
FROM PRODUCTOS p
LEFT JOIN TALLAS_DISPONIBLES t ON p.CODIGO_PRODUCTO = t.CODIGO_PRODUCTO
ORDER BY p.CODIGO_PRODUCTO, t.TALLA;

-- Contar registros
SELECT COUNT(*) FROM PRODUCTOS;  -- Debe ser 10
SELECT COUNT(*) FROM TALLAS_DISPONIBLES;  -- Debe ser 38
```

---

## 🔍 Estructura Final

```
BASE DE DATOS QUITO
├── CATEGORIAS (4 registros)
├── SUBCATEGORIAS (10 registros)
├── PRODUCTOS (10 registros)
│   ├── ROPA (3) - TIPO_TALLA = TALLA_ROPA
│   ├── CALZADO (2) - TIPO_TALLA = TALLA_NUMERO
│   ├── TACONES (2) - TIPO_TALLA = TALLA_NUMERO
│   └── ACCESORIOS (3) - TIPO_TALLA = SIN_TALLA
│
└── TALLAS_DISPONIBLES (38 registros)
    ├── ROPA001: S(15), M(20), L(10), XL(5)
    ├── ROPA002: S(12), M(15), L(8), XL(5)
    ├── ROPA003: S(8), M(10), L(5), XL(2)
    ├── CALZ001: 35(5), 36(8), 37(10), 38(12), 39(10), 40(10), 41(5)
    ├── CALZ002: 36(6), 37(8), 38(10), 39(7), 40(4)
    ├── TAC001: 35(6), 36(8), 37(10), 38(12), 39(9)
    └── TAC002: 36(7), 37(9), 38(11), 39(8), 40(5)
```

---

## 📝 NOTAS

- ✅ Todo está en la **BASE DE DATOS**
- ✅ Las tallas se manejan por **categoría**
- ✅ El frontend solo **consume** datos de la API
- ✅ La API lee de Oracle Quito/Guayaquil
- ✅ DBLinks sincronizan Quito → Guayaquil

---

## ❓ ¿Dudas?

- **¿Dónde ejecuto?** → En SQL Developer, conectado a QUITO
- **¿Qué pasa con Guayaquil?** → Se replica automáticamente con Materialized Views
- **¿Y el frontend?** → Seguirá funcionando, solo consume los nuevos datos
- **¿Las tallas se ven en la web?** → Sí, el carrito mostrará las tallas según el producto

