import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cc2c4d6e`

// Classe para fazer requisições para o backend
export class SystemAPI {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
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
    return this.request('/points/add', {
      method: 'POST',
      body: JSON.stringify({ username, reason, points }),
    })
  }

  // Leaderboard
  static async getLeaderboard() {
    return this.request('/leaderboard')
  }

  // Histórico
  static async getHistory(username: string, page: number = 1, limit: number = 10) {
    return this.request(`/history/${username}?page=${page}&limit=${limit}`)
  }

  // Usuários
  static async getUsers() {
    return this.request('/users')
  }

  // Conquistas
  static async getAchievements(username: string) {
    return this.request(`/achievements/${username}`)
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