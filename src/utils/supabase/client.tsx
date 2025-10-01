import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cc2c4d6e`

// Classe para fazer requisições para o backend usando Supabase Auth
export class SystemAPI {
  private static async request(endpoint: string, options: RequestInit = {}, requireAuth: boolean = false) {
    const url = `${API_BASE_URL}${endpoint}`
    
    let authHeader = `Bearer ${publicAnonKey}` // Default para endpoints públicos
    
    if (requireAuth) {
      // Obter sessão atual do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        authHeader = `Bearer ${session.access_token}`
        console.log(`🔑 Usando token JWT do Supabase: ${session.access_token.substring(0, 20)}...`)
      } else {
        console.error('❌ Nenhuma sessão ativa encontrada para endpoint que requer auth')
        throw new Error('Sessão não encontrada. Faça login novamente.')
      }
    }
    
    console.log(`📡 Requisição: ${options.method || 'GET'} ${endpoint}`)
    console.log(`🔒 Require Auth: ${requireAuth}`)
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        ...options.headers,
      },
    })

    console.log(`📡 Resposta: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro de rede' }))
      console.error(`❌ Erro na requisição:`, error)
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log(`✅ Sucesso na requisição:`, result)
    return result
  }

  // Auth
  static async register(username: string, password: string) {
    console.log(`🔑 Registrando usuário: ${username}`)
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    console.log(`🔑 Resultado do registro:`, result)
    return result
  }

  // Pontos
  static async addPoint(reason: string, points: number) {
    console.log(`📤 Enviando ponto para servidor: ${reason}, ${points}`)
    const result = await this.request('/points/add', {
      method: 'POST',
      body: JSON.stringify({ reason, points }),
    }, true) // Requer autenticação
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
    return this.request(`/user/${username}`, {}, true)
  }

  // Status
  static async getStatus() {
    return this.request('/status')
  }

  // Admin - Reset da temporada
  static async resetSeason() {
    console.log('🔄 Solicitando reset da temporada...')
    return this.request('/admin/reset-season', {
      method: 'POST'
    })
  }

  // Admin - Limpeza de usuários antigos
  static async cleanupUsers() {
    console.log('🧹 Solicitando limpeza de usuários antigos...')
    return this.request('/admin/cleanup-users', {
      method: 'POST'
    })
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