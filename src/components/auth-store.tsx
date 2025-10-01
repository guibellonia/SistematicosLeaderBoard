import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SystemAPI } from '../utils/supabase/client';

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
  friends?: string[];
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
  logout: () => void;
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
      const response = await SystemAPI.login(username.toLowerCase(), password);
      
      if (response.success) {
        set({
          currentUser: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Salvar dados da sessão
        sessionStorage.setItem('sistematics-session', JSON.stringify({
          userId: response.user.id,
          username: response.user.username,
          token: response.token,
          loginTime: new Date().toISOString(),
          isActive: true
        }));

        // Sincronizar dados
        await get().syncWithServer();

        return { success: true };
      }
      
      return { success: false, error: response.error };
    } catch (error: any) {
      console.error('Erro no login:', error);
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
      const response = await SystemAPI.register(username.toLowerCase(), password);
      
      if (response.success) {
        set({
          currentUser: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // Salvar dados da sessão
        sessionStorage.setItem('sistematics-session', JSON.stringify({
          userId: response.user.id,
          username: response.user.username,
          loginTime: new Date().toISOString(),
          isActive: true
        }));

        // Sincronizar dados
        await get().syncWithServer();

        return { success: true };
      }
      
      return { success: false, error: response.error };
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      set({ isLoading: false, error: error.message });
      return { success: false, error: error.message || 'Erro ao fazer cadastro' };
    }
  },

  logout: () => {
    sessionStorage.removeItem('sistematics-session');
    sessionStorage.removeItem('sistematics-temp-data');
    
    set({ 
      currentUser: null, 
      isAuthenticated: false,
      pointRecords: [],
      error: null
    });
  },

  addPointRecord: async (reason: string, points: number) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set({ isLoading: true, error: null });

    try {
      const response = await SystemAPI.addPoint(currentUser.username, reason, points);
      
      if (response.success) {
        set(state => ({
          currentUser: response.user,
          pointRecords: [response.record, ...state.pointRecords],
          isLoading: false,
        }));

        // Atualizar leaderboard
        await get().syncWithServer();
      }
    } catch (error: any) {
      console.error('Erro ao adicionar ponto:', error);
      set({ isLoading: false, error: error.message });
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
      return { history: [], total: 0, totalPages: 0 };
    }
  },

  syncWithServer: async () => {
    try {
      set({ isLoading: true });

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
      }

      // Buscar status do servidor
      const statusResponse = await SystemAPI.getStatus();
      if (statusResponse.success) {
        set({ 
          totalUsers: statusResponse.totalUsers,
          lastSync: statusResponse.timestamp
        });
      }

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      set({ isLoading: false, error: error.message });
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