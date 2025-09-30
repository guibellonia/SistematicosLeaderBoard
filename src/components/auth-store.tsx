import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  points: number;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
}

export interface PointRecord {
  id: string;
  userId: string;
  reason: string;
  points: number;
  timestamp: string;
  username: string;
}

interface AuthState {
  currentUser: User | null;
  users: User[];
  pointRecords: PointRecord[];
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addPointRecord: (reason: string, points: number) => void;
  updateUserPoints: (userId: string, points: number) => void;
  getAllUsers: () => User[];
  getLeaderboard: () => User[];
  checkSession: () => void;
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

// Simple hash function for passwords (in production, use proper hashing)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      pointRecords: [],
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const { users } = get();
        
        if (!username || !password) {
          return { success: false, error: 'Nome de usuário e senha são obrigatórios' };
        }

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = users.find(u => u?.username?.toLowerCase() === username.toLowerCase());
        
        if (!user) {
          return { success: false, error: 'Usuário não encontrado' };
        }

        // Verificar senha
        const passwords = JSON.parse(localStorage.getItem('sistematics-passwords') || '{}');
        const hashedPassword = hashPassword(password);
        
        if (passwords[user.id] && passwords[user.id] !== hashedPassword) {
          return { success: false, error: 'Senha incorreta' };
        }

        const now = new Date().toISOString();
        const updatedUser = { ...user, lastLogin: now };
        
        // Salvar dados da sessão no sessionStorage
        sessionStorage.setItem('sistematics-session', JSON.stringify({
          userId: updatedUser.id,
          loginTime: now,
          isActive: true
        }));
        
        set(state => ({
          currentUser: updatedUser,
          isAuthenticated: true,
          users: state.users.map(u => u.id === user.id ? updatedUser : u)
        }));

        return { success: true };
      },

      register: async (username: string, password: string, confirmPassword: string) => {
        const { users } = get();

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));

        // Validar username
        if (!username || username.length < 3) {
          return { success: false, error: 'O nome de usuário deve ter pelo menos 3 caracteres' };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return { success: false, error: 'O nome de usuário pode conter apenas letras, números e underscore' };
        }

        // Verificar se username já existe
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          return { success: false, error: 'Este nome de usuário já está em uso' };
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

        // Criar novo usuário
        const now = new Date().toISOString();
        const newUser: User = {
          id: Date.now().toString(),
          username: username.toLowerCase(),
          points: 0,
          createdAt: now,
          lastLogin: now
        };

        // Salvar senha hasheada em localStorage separado (para segurança básica)
        const hashedPassword = hashPassword(password);
        const passwords = JSON.parse(localStorage.getItem('sistematics-passwords') || '{}');
        passwords[newUser.id] = hashedPassword;
        localStorage.setItem('sistematics-passwords', JSON.stringify(passwords));

        set(state => ({
          currentUser: newUser,
          isAuthenticated: true,
          users: [...state.users, newUser]
        }));

        return { success: true };
      },

      logout: () => {
        // Limpar dados da sessão
        sessionStorage.removeItem('sistematics-session');
        sessionStorage.removeItem('sistematics-temp-data');
        
        set({ currentUser: null, isAuthenticated: false });
      },

      addPointRecord: (reason: string, points: number) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newRecord: PointRecord = {
          id: Date.now().toString(),
          userId: currentUser.id,
          username: currentUser.username,
          reason,
          points,
          timestamp: new Date().toISOString()
        };

        // Salvar na sessão temporária
        const tempData = JSON.parse(sessionStorage.getItem('sistematics-temp-data') || '{}');
        tempData.lastPointRecord = newRecord;
        sessionStorage.setItem('sistematics-temp-data', JSON.stringify(tempData));

        set(state => ({
          pointRecords: [newRecord, ...state.pointRecords],
          currentUser: state.currentUser ? { 
            ...state.currentUser, 
            points: state.currentUser.points + points 
          } : null,
          users: state.users.map(u => 
            u && u.id === currentUser.id ? { ...u, points: u.points + points } : u
          )
        }));
      },

      updateUserPoints: (userId: string, points: number) => {
        set(state => ({
          users: state.users.map(u => 
            u && u.id === userId ? { ...u, points: u.points + points } : u
          ).filter(Boolean),
          currentUser: state.currentUser?.id === userId ? 
            { ...state.currentUser, points: state.currentUser.points + points } : 
            state.currentUser
        }));
      },

      getAllUsers: () => {
        const { users } = get();
        return (users || []).filter(Boolean);
      },

      getLeaderboard: () => {
        const { users } = get();
        return [...(users || [])].filter(Boolean).sort((a, b) => (b.points || 0) - (a.points || 0));
      },

      checkSession: () => {
        const { users } = get();
        
        // Verificar se há uma sessão ativa
        const session = sessionStorage.getItem('sistematics-session');
        if (session) {
          try {
            const sessionData = JSON.parse(session);
            if (sessionData.isActive && sessionData.userId) {
              const user = users.find(u => u?.id === sessionData.userId);
              if (user) {
                set({ currentUser: user, isAuthenticated: true });
                return;
              }
            }
          } catch (error) {
            console.error('Erro ao verificar sessão:', error);
          }
        }
        
        // Se não há sessão válida, fazer logout
        set({ currentUser: null, isAuthenticated: false });
        sessionStorage.removeItem('sistematics-session');
      }
    }),
    {
      name: 'sistematics-auth',
      storage: {
        getItem: (name) => {
          // Tentar primeiro do sessionStorage para dados da sessão atual
          let str = sessionStorage.getItem(name);
          if (!str) {
            // Se não encontrar, tentar do localStorage
            str = localStorage.getItem(name);
          }
          if (!str) return null;
          try {
            const data = JSON.parse(str);
            // Verificar se os dados são válidos
            if (data && typeof data === 'object') {
              return data;
            }
            return null;
          } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const jsonValue = JSON.stringify(value);
            // Salvar no localStorage para persistência
            localStorage.setItem(name, jsonValue);
            // Salvar no sessionStorage para acesso rápido
            sessionStorage.setItem(name, jsonValue);
          } catch (error) {
            console.error('Erro ao salvar dados:', error);
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        users: state.users || [],
        pointRecords: state.pointRecords || [],
        // Não persistir currentUser e isAuthenticated, eles são gerenciados pela sessão
      }),
    }
  )
);