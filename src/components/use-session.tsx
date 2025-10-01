import { useEffect } from 'react';
import { useAuthStore } from './auth-store';

export const useSession = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    logout, 
    syncWithServer 
  } = useAuthStore();
  
  useEffect(() => {
    // Verificar se há uma sessão salva e sincronizar com o servidor
    const checkSession = () => {
      const sessionData = sessionStorage.getItem('sistematics-session');
      
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          
          // Verificar se a sessão ainda é válida (não expirou)
          if (session.isActive && session.loginTime) {
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
            
            // Se a sessão tem mais de 24 horas, fazer logout
            if (hoursDiff > 24) {
              logout();
              return;
            }
            
            // Se há sessão válida mas não está autenticado, sincronizar
            if (!isAuthenticated && session.userId) {
              syncWithServer();
            }
          } else {
            // Sessão inválida, fazer logout
            logout();
          }
        } catch (error) {
          console.error('Erro ao verificar sessão:', error);
          logout();
        }
      } else if (isAuthenticated && !currentUser) {
        // Se está autenticado mas não há dados do usuário, fazer logout
        logout();
      }
    };

    // Verificar sessão quando o componente monta
    checkSession();
    
    // Configurar listener para mudanças no storage (tabs compartilhadas)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sistematics-session') {
        checkSession();
      }
    };
    
    // Listener para quando a aba perde/ganha foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSession();
        // Sincronizar dados quando a aba ganha foco
        if (isAuthenticated) {
          syncWithServer();
        }
      }
    };
    
    // Listener para quando a aba vai fechar
    const handleBeforeUnload = () => {
      // Atualizar timestamp da sessão
      const sessionData = sessionStorage.getItem('sistematics-session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          session.lastActivity = new Date().toISOString();
          sessionStorage.setItem('sistematics-session', JSON.stringify(session));
        } catch (error) {
          console.error('Erro ao atualizar sessão:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Verificar sessão periodicamente (a cada 5 minutos)
    const interval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [isAuthenticated, currentUser, logout, syncWithServer]);
};