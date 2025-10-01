import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemAPI, supabase } from '../utils/supabase/client';

export interface User {
  id: string;
  username: string;
  points: number;
  totalPoints: number;
  rank: number;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  achievements?: Achievement[];
  joinedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

export interface PointRecord {
  id: string;
  username: string;
  reason: string;
  points: number;
  timestamp: string;
  date: string;
}

interface AuthState {
  currentUser: User | null;
  users: User[];
  pointRecords: PointRecord[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  leaderboard: User[];
  totalUsers: number;
  lastSync: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  addPointRecord: (reason: string, points: number) => Promise<void>;
  refreshData: () => Promise<void>;
  getHistory: (page?: number) => Promise<{ history: PointRecord[]; total: number; totalPages: number }>;
  getAllUsers: () => User[];
  getLeaderboard: () => User[];
  syncWithServer: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// Validate password strength
const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'A senha é obrigatória' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'A senha deve ter pelo menos 6 caracteres' };
  }
  if (password.length > 50) {
    return { valid: false, error: 'A senha deve ter no máximo 50 caracteres' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos uma letra' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'A senha deve conter pelo menos um número' };
  }
  // Verificar caracteres especiais perigosos
  if (/[<>{}|\\^`]/.test(password)) {
    return { valid: false, error: 'A senha contém caracteres não permitidos' };
  }
  return { valid: true };
};

export const useAuthStore = create<AuthStore>()((set, get) => ({
  currentUser: null,
  users: [],
  pointRecords: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  leaderboard: [],
  totalUsers: 0,
  lastSync: null,

  login: async (username: string, password: string) => {
    if (!username || !password) {
      return { success: false, error: 'Nome de usuário e senha são obrigatórios' };
    }

    set({ isLoading: true, error: null });

    try {
      const email = `${username.toLowerCase()}@sistematics.local`;
      console.log(`🔑 Iniciando login para: ${email}`);
      
      // Tentar login direto primeiro
      console.log('🔑 Tentando login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error && error.message.includes('Invalid login credentials')) {
        // Se login falhou, tentar criar usuário
        console.log('📝 Usuário não existe, criando...');
        try {
          const registerResponse = await SystemAPI.register(username.toLowerCase(), password);
          if (registerResponse.success) {
            console.log('✅ Usuário criado, tentando login novamente...');
            
            // Tentar login novamente após criação
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email: email,
              password: password,
            });
            
            if (!retryError && retryData.user) {
              const newUser = {
                id: retryData.user.id,
                username: username.toLowerCase(),
                points: 0,
                totalPoints: 0,
                rank: 1,
                achievements: [],
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                joinedAt: new Date().toISOString(),
                createdAt: retryData.user.created_at,
              };
              
              set({
                currentUser: newUser,
                isAuthenticated: true,
                isLoading: false,
              });

              // Sync em background, não bloquear o login
              get().syncWithServer().catch(console.error);
              return { success: true, wasAutoCreated: true };
            }
          }
        } catch (registerError: any) {
          console.error('❌ Erro ao criar usuário:', registerError);
        }
        
        // Se chegou aqui, falhou
        set({ isLoading: false, error: 'Credenciais inválidas' });
        return { success: false, error: 'Credenciais inválidas' };
      } else if (error) {
        // Outros erros
        console.error('❌ Erro do Supabase Auth:', error);
        let errorMessage = 'Erro ao fazer login';
        if (error.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Aguarde alguns minutos.';
        }
        
        set({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      if (data.user && data.session) {
        console.log('✅ Login bem-sucedido!');
        
        // Buscar dados do usuário no nosso sistema
        try {
          const userResponse = await SystemAPI.getUserProfile(username.toLowerCase());
          
          if (userResponse.success) {
            set({
              currentUser: userResponse.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Criar dados básicos se não existir no sistema
            const newUser = {
              id: data.user.id,
              username: username.toLowerCase(),
              points: 0,
              totalPoints: 0,
              rank: 1,
              achievements: [],
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
              joinedAt: new Date().toISOString(),
              createdAt: data.user.created_at,
            };
            
            set({
              currentUser: newUser,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          // Sync em background
          get().syncWithServer().catch(console.error);
          return { success: true };
        } catch (profileError: any) {
          console.warn('⚠️ Erro ao buscar perfil, usando dados básicos:', profileError);
          
          const newUser = {
            id: data.user.id,
            username: username.toLowerCase(),
            points: 0,
            totalPoints: 0,
            rank: 1,
            achievements: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            joinedAt: new Date().toISOString(),
            createdAt: data.user.created_at,
          };
          
          set({
            currentUser: newUser,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        }
      }
      
      set({ isLoading: false, error: 'Falha na autenticação' });
      return { success: false, error: 'Falha na autenticação' };
    } catch (error: any) {
      console.error('❌ Erro geral no login:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  },

  register: async (username: string, password: string, confirmPassword: string) => {
    // Validar username
    if (!username || username.length < 3) {
      return { success: false, error: 'O nome de usuário deve ter pelo menos 3 caracteres' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, error: 'O nome de usuário pode conter apenas letras, números e underscore' };
    }

    // Validar senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.error };
    }

    // Verificar confirmação de senha
    if (password !== confirmPassword) {
      return { success: false, error: 'As senhas não coincidem' };
    }

    set({ isLoading: true, error: null });

    try {
      console.log(`📝 Registrando usuário: ${username.toLowerCase()}`);
      const response = await SystemAPI.register(username.toLowerCase(), password);
      
      if (response.success) {
        console.log('✅ Usuário criado, fazendo login...');
        
        // Fazer login diretamente usando as mesmas credenciais
        const email = `${username.toLowerCase()}@sistematics.local`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        
        if (!error && data.user) {
          const newUser = {
            id: data.user.id,
            username: username.toLowerCase(),
            points: 0,
            totalPoints: 0,
            rank: 1,
            achievements: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
            joinedAt: new Date().toISOString(),
            createdAt: data.user.created_at,
          };
          
          set({
            currentUser: newUser,
            isAuthenticated: true,
            isLoading: false,
          });

          // Sync em background
          get().syncWithServer().catch(console.error);
          return { success: true };
        } else {
          set({ isLoading: false, error: 'Usuário criado, mas falha no login' });
          return { success: false, error: 'Usuário criado, mas falha no login' };
        }
      } else {
        set({ isLoading: false, error: response.error });
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message || 'Erro ao fazer cadastro' };
    }
  },

  logout: async () => {
    try {
      // Fazer logout no Supabase Auth
      console.log('🚪 Fazendo logout no Supabase...');
      await supabase.auth.signOut();
      console.log('✅ Logout bem-sucedido');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
    
    // Limpar estado local
    set({ 
      currentUser: null, 
      isAuthenticated: false,
      pointRecords: [],
      error: null
    });
  },

  addPointRecord: async (reason: string, points: number) => {
    const { currentUser } = get();
    if (!currentUser) {
      console.error('❌ Nenhum usuário autenticado para adicionar ponto');
      return;
    }

    console.log(`🎯 Auth Store: Adicionando ponto para ${currentUser.username}: ${reason} (+${points})`);
    set({ isLoading: true, error: null });

    try {
      // Verificar se ainda há sessão ativa no Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Sessão expirada, fazendo logout...');
        await get().logout();
        return;
      }
      console.log('✅ Sessão válida, prosseguindo com adição de ponto');

      const response = await SystemAPI.addPoint(reason, points);
      console.log('📥 Resposta do addPoint:', response);
      
      if (response.success) {
        console.log('✅ Ponto adicionado com sucesso!');
        set(state => ({
          currentUser: response.user,
          pointRecords: [response.record, ...state.pointRecords],
          isLoading: false,
        }));

        // Atualizar leaderboard
        console.log('🔄 Sincronizando com servidor após adicionar ponto...');
        await get().syncWithServer();
      } else {
        console.error('❌ Falha na resposta do servidor:', response);
        set({ isLoading: false, error: response.error || 'Erro desconhecido' });
      }
    } catch (error: any) {
      console.error('❌ Erro ao adicionar ponto:', error);
      // Se for erro 401, fazer logout
      if (error.message.includes('401') || error.message.includes('Sessão não encontrada')) {
        console.error('❌ Erro de autenticação, fazendo logout...');
        await get().logout();
      }
      set({ isLoading: false, error: error.message });
      throw error; // Re-throw para o componente tratar
    }
  },

  refreshData: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      await get().syncWithServer();
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      set({ error: error.message });
    }
  },

  getHistory: async (page: number = 1) => {
    const { currentUser } = get();
    if (!currentUser) {
      return { history: [], total: 0, totalPages: 0 };
    }

    try {
      // Verificar se o token ainda é válido antes de fazer a requisição
      const tokenCheck = await SystemAPI.verifyToken();
      if (!tokenCheck.valid) {
        console.error('Token inválido para buscar histórico, fazendo logout...');
        get().logout();
        return { history: [], total: 0, totalPages: 0 };
      }

      const response = await SystemAPI.getHistory(currentUser.username, page, 10);
      
      if (response.success) {
        return {
          history: response.history,
          total: response.total,
          totalPages: response.totalPages
        };
      }
      
      return { history: [], total: 0, totalPages: 0 };
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      // Se for erro 401, fazer logout
      if (error.message.includes('401') || error.message.includes('Invalid JWT')) {
        console.error('Erro de autenticação ao buscar histórico, fazendo logout...');
        get().logout();
      }
      return { history: [], total: 0, totalPages: 0 };
    }
  },

  syncWithServer: async () => {
    try {
      const { currentUser } = get();

      // Buscar leaderboard
      const leaderboardResponse = await SystemAPI.getLeaderboard();
      if (leaderboardResponse.success) {
        set({ leaderboard: leaderboardResponse.leaderboard });
      }

      // Buscar todos os usuários
      const usersResponse = await SystemAPI.getUsers();
      if (usersResponse.success) {
        set({ 
          users: usersResponse.users,
          totalUsers: usersResponse.users.length
        });
        
        // Atualizar dados do usuário atual se estiver na lista
        if (currentUser) {
          const updatedUser = usersResponse.users.find(u => u.username === currentUser.username);
          if (updatedUser) {
            set({ currentUser: updatedUser });
          }
        }
      }

      // Buscar status do servidor
      const statusResponse = await SystemAPI.getStatus();
      if (statusResponse.success) {
        set({ 
          totalUsers: statusResponse.totalUsers,
          lastSync: statusResponse.timestamp
        });
      }

    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      // Não definir error aqui para não afetar a UI principal
    }
  },

  getAllUsers: () => {
    const { users } = get();
    return users || [];
  },

  getLeaderboard: () => {
    const { leaderboard } = get();
    return leaderboard || [];
  },

  clearError: () => {
    set({ error: null });
  }
}));

// Auto-sync a cada 30 segundos se estiver autenticado
setInterval(() => {
  const { isAuthenticated, syncWithServer } = useAuthStore.getState();
  if (isAuthenticated) {
    syncWithServer();
  }
}, 30000);