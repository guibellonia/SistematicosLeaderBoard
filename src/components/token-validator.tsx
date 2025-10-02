import React, { useEffect } from 'react';
import { useAuth } from './auth-context';
import { SystemAPI } from '../utils/supabase/client';

export const TokenValidator: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const validateToken = async () => {
      try {
        const validation = await SystemAPI.verifyToken();
        if (!validation.valid) {
          console.warn('🚫 Token inválido detectado, fazendo logout automático...');
          await logout();
        }
      } catch (error) {
        console.error('❌ Erro na validação de token:', error);
        await logout();
      }
    };

    // Validar token a cada 30 segundos
    const interval = setInterval(validateToken, 30000);
    
    // Validar imediatamente
    validateToken();

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  return null;
};