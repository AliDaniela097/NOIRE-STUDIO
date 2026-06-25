import { useState, useEffect, useCallback } from 'react';
import { auth, setToken, getToken, removeToken } from '../services/api';

export function useAuth() {
  const [usuario, setUsuario] = useState(null);
  const [token, setLocalToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario al montar componente
  useEffect(() => {
    const tokenGuardado = getToken();
    if (tokenGuardado) {
      setLocalToken(tokenGuardado);
      // Aquí podrías verificar el token contra el backend si es necesario
    }
    setCargando(false);
  }, []);

  const registro = useCallback(async (datos) => {
    try {
      setCargando(true);
      setError(null);
      await auth.registro(datos);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, []);

  const login = useCallback(async (usuario, password) => {
    try {
      setCargando(true);
      setError(null);
      const response = await auth.login(usuario, password);
      setToken(response.token);
      setLocalToken(response.token);
      setUsuario(response.usuario);
      return { success: true, usuario: response.usuario };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setCargando(false);
    }
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    removeToken();
    setLocalToken(null);
    setUsuario(null);
    setError(null);
  }, []);

  return {
    usuario,
    token,
    cargando,
    error,
    estaAutenticado: !!token,
    registro,
    login,
    logout,
  };
}
