import { useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { supabase } from '../utils/supabase/client';

export const useSession = () => {
  const { 
    isAuthenticated, 
    currentUser, 
    logout, 
    syncWithServer 
  } = useAuthStore();
  
  useEffect(() => {
    // A gestão de sessão agora é feita pelo Supabase Auth no auth-context
    // Este hook agora é principalmente para sincronização de dados
    
    // Sincronizar dados quando a aba ganha foco
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('🔄 Aba ganhou foco, sincronizando dados...');
        syncWithServer();
      }
    };
    
    // Sincronizar dados periodicamente (a cada 30 segundos)
    const interval = setInterval(() => {
      if (isAuthenticated) {
        console.log('🔄 Sincronização periódica...');
        syncWithServer();
      }
    }, 30 * 1000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, syncWithServer]);
};