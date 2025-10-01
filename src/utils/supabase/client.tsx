import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cc2c4d6e`

// Função para obter token de sessão
function getSessionToken(): string | null {
  try {
    const sessionData = sessionStorage.getItem('sistematics-session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      return session.token || null;
    }
  } catch (error) {
    console.error('Erro ao obter token de sessão:', error);
  }
  return null;
}

// Classe para fazer requisições para o backend
export class SystemAPI {
  private static async request(endpoint: string, options: RequestInit = {}, requireAuth: boolean = false) {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Usar token de sessão se disponível e necessário, senão usar chave pública
    const token = requireAuth ? getSessionToken() : null;
    const authHeader = token ? `Bearer ${token}` : `Bearer ${publicAnonKey}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro de rede' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth
  static async register(username: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  static async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  // Pontos
  static async addPoint(username: string, reason: string, points: number) {
    console.log(`📤 Enviando ponto para servidor: ${username}, ${reason}, ${points}`)
    const result = await this.request('/points/add', {
      method: 'POST',
      body: JSON.stringify({ username, reason, points }),
    })
    console.log(`📥 Resposta do servidor:`, result)
    return result
  }

  // Leaderboard
  static async getLeaderboard() {
    return this.request('/leaderboard')
  }

  // Histórico
  static async getHistory(username: string, page: number = 1, limit: number = 10) {
    return this.request(`/history/${username}?page=${page}&limit=${limit}`, {}, true)
  }

  // Histórico global (não precisa de auth)
  static async getGlobalHistory(page: number = 1, limit: number = 10) {
    return this.request(`/history/global/recent?page=${page}&limit=${limit}`)
  }

  // Usuários
  static async getUsers() {
    return this.request('/users')
  }

  // Conquistas
  static async getAchievements(username: string) {
    return this.request(`/achievements/${username}`, {}, true)
  }

  // Perfil de usuário (precisa de auth para ver outros perfis)
  static async getUserProfile(username: string) {
    return this.request(`/users/${username}`, {}, true)
  }

  // Amizades
  static async getFriends(username: string) {
    return this.request(`/friends/${username}`, {}, true)
  }

  static async getFriendRequests(username: string) {
    return this.request(`/friends/requests/${username}`, {}, true)
  }

  static async sendFriendRequest(fromUsername: string, toUsername: string) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ fromUsername, toUsername }),
    }, true)
  }

  static async respondFriendRequest(username: string, requestId: string, accept: boolean) {
    return this.request('/friends/respond', {
      method: 'POST',
      body: JSON.stringify({ username, requestId, accept }),
    }, true)
  }

  // Status
  static async getStatus() {
    return this.request('/status')
  }
}

import React from 'react'

// Hook para polling de dados em tempo real
export function useRealTimePolling(callback: () => void, interval: number = 5000) {
  React.useEffect(() => {
    const intervalId = setInterval(callback, interval)
    return () => clearInterval(intervalId)
  }, [callback, interval])
}