import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

export const useSession = () => {
  const { checkSession } = useAuthStore();
  
  useEffect(() => {
    // Verificar sessão quando o componente monta
    checkSession();
    
    // Configurar listener para mudanças na janela (storage events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sistematics-session' || e.key === 'sistematics-auth') {
        checkSession();
      }
    };
    
    // Listener para quando a aba perde/ganha foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificar sessão periodicamente (a cada 30 segundos)
    const interval = setInterval(() => {
      checkSession();
    }, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [checkSession]);
};