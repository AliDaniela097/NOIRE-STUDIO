const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Almacenar token en localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

// Helper para hacer fetch con token
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ============ AUTENTICACIÓN ============

export const auth = {
  registro: async (datos) => {
    return apiCall('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  login: async (usuario, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario, password }),
    });
  },

  logout: () => {
    removeToken();
  },
};

// ============ PRODUCTOS ============

export const productos = {
  obtenerTodos: async (categoria = null) => {
    const url = categoria ? `?categoria=${categoria}` : '';
    return apiCall(`/productos${url}`);
  },

  obtenerPorCodigo: async (codigo) => {
    return apiCall(`/productos/${codigo}`);
  },

  obtenerCategorias: async () => {
    return apiCall('/productos/categorias/lista');
  },
};

// ============ CARRITO ============

export const carrito = {
  agregar: async (cedula, codigoProducto, cantidad, talla = null) => {
    return apiCall('/carrito/agregar', {
      method: 'POST',
      body: JSON.stringify({
        cedula,
        codigoProducto,
        cantidad,
        talla,
      }),
    });
  },

  obtener: async (cedula) => {
    return apiCall(`/carrito/${cedula}`);
  },

  eliminarProducto: async (cedula, codigoProducto) => {
    return apiCall(`/carrito/${cedula}/${codigoProducto}`, {
      method: 'DELETE',
    });
  },

  vaciar: async (cedula) => {
    return apiCall(`/carrito/${cedula}`, {
      method: 'DELETE',
    });
  },
};

// ============ PEDIDOS ============

export const pedidos = {
  crear: async (cedula) => {
    return apiCall('/pedidos/crear', {
      method: 'POST',
      body: JSON.stringify({ cedula }),
    });
  },

  obtenerTodos: async (cedula) => {
    return apiCall(`/pedidos/${cedula}`);
  },

  obtenerDetalle: async (numeroFactura) => {
    return apiCall(`/pedidos/${numeroFactura}/detalle`);
  },
};

// ============ PAGOS ============

export const pagos = {
  procesar: async (pago) => {
    return apiCall('/pagos/procesar', {
      method: 'POST',
      body: JSON.stringify(pago),
    });
  },

  obtener: async (numeroFactura) => {
    return apiCall(`/pagos/${numeroFactura}`);
  },
};

export default {
  auth,
  productos,
  carrito,
  pedidos,
  pagos,
};
