import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore, User } from './auth-store';
import { supabase, SystemAPI } from '../utils/supabase/client';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, login, logout, isAuthenticated, syncWithServer } = useAuthStore();

  // Ouvir mudanças de estado de autenticação do Supabase
  useEffect(() => {
    console.log('🔄 Configurando listener de auth state...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ Usuário logado no Supabase');
          // O login será tratado pelo auth-store
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 Usuário deslogado no Supabase');
          // Garantir que o estado local seja limpo
          await useAuthStore.getState().logout();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed');
          // Sincronizar dados quando token é renovado
          if (isAuthenticated) {
            syncWithServer();
          }
        }
      }
    );

    return () => {
      console.log('🔄 Removendo listener de auth state');
      subscription.unsubscribe();
    };
  }, [isAuthenticated, syncWithServer]);

  // Verificar sessão existente na inicialização
  useEffect(() => {
    const checkSession = async () => {
      console.log('🔍 Verificando sessão existente...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !isAuthenticated) {
        console.log('📥 Sessão existente encontrada, tentando recuperar dados do usuário...');
        // Se há sessão mas não estamos autenticados, tentar recuperar dados
        try {
          // Extrair username do email (formato: username@sistematics.local)
          const email = session.user.email || '';
          const username = email.split('@')[0];
          
          if (username) {
            // Tentar buscar dados do usuário
            const userResponse = await SystemAPI.getUserProfile(username);
            if (userResponse.success) {
              useAuthStore.setState({
                currentUser: userResponse.user,
                isAuthenticated: true,
              });
              console.log('✅ Dados do usuário recuperados com sucesso');
            }
          }
        } catch (error) {
          console.error('❌ Erro ao recuperar dados do usuário:', error);
        }
      }
    };

    checkSession();
  }, []);

  const value = {
    user: currentUser,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};