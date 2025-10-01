import { Hono } from 'npm:hono@4.6.1'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

type Database = {
  kv_store_cc2c4d6e: {
    Row: {
      key: string
      value: any
      created_at: string
      updated_at: string
    }
    Insert: {
      key: string
      value: any
      created_at?: string
      updated_at?: string
    }
    Update: {
      key?: string
      value?: any
      created_at?: string
      updated_at?: string
    }
  }
}

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Middleware para logging
app.use('*', logger(console.log))

// Rotas do sistema Sistemáticos de Plantão

// 🔐 AUTH - Cadastro de usuário
app.post('/make-server-cc2c4d6e/auth/register', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ error: 'Username e password são obrigatórios' }, 400)
    }

    // Verificar se usuário já existe
    const existingUser = await kv.get(`user:${username}`)
    if (existingUser) {
      return c.json({ error: 'Usuário já existe' }, 409)
    }

    // Criar usuário
    const user = {
      id: crypto.randomUUID(),
      username,
      password, // Em produção, usar hash
      createdAt: new Date().toISOString(),
      points: 0,
      totalPoints: 0,
      rank: 1,
      achievements: [],
      friends: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      joinedAt: new Date().toISOString()
    }

    await kv.set(`user:${username}`, user)
    await kv.set(`user:id:${user.id}`, username)

    // Adicionar ao leaderboard
    await updateLeaderboard()

    return c.json({ 
      success: true, 
      user: { ...user, password: undefined } 
    })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔐 AUTH - Login
app.post('/make-server-cc2c4d6e/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    const user = await kv.get(`user:${username}`)
    if (!user || user.password !== password) {
      return c.json({ error: 'Credenciais inválidas' }, 401)
    }

    return c.json({ 
      success: true, 
      user: { ...user, password: undefined },
      token: `fake_token_${user.id}` // Em produção, usar JWT real
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📊 PONTOS - Adicionar ponto
app.post('/make-server-cc2c4d6e/points/add', async (c) => {
  try {
    const { username, reason, points } = await c.req.json()
    
    const user = await kv.get(`user:${username}`)
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    // Atualizar pontos do usuário
    user.points += points
    user.totalPoints += points
    await kv.set(`user:${username}`, user)

    // Registrar no histórico
    const record = {
      id: crypto.randomUUID(),
      username,
      reason,
      points,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('pt-BR')
    }

    const historyKey = `history:${username}`
    const history = await kv.get(historyKey) || []
    history.unshift(record)
    
    // Manter apenas os últimos 100 registros
    if (history.length > 100) {
      history.splice(100)
    }
    
    await kv.set(historyKey, history)

    // Atualizar leaderboard
    await updateLeaderboard()

    // Verificar conquistas
    await checkAchievements(username, user)

    return c.json({ 
      success: true, 
      user: { ...user, password: undefined },
      record 
    })
  } catch (error) {
    console.error('Erro ao adicionar ponto:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🏆 LEADERBOARD - Buscar ranking
app.get('/make-server-cc2c4d6e/leaderboard', async (c) => {
  try {
    const leaderboard = await kv.get('leaderboard:current') || []
    return c.json({ success: true, leaderboard })
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📋 HISTÓRICO - Buscar registros
app.get('/make-server-cc2c4d6e/history/:username', async (c) => {
  try {
    const username = c.req.param('username')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    
    const history = await kv.get(`history:${username}`) || []
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageHistory = history.slice(startIndex, endIndex)
    
    return c.json({ 
      success: true, 
      history: pageHistory,
      total: history.length,
      page,
      totalPages: Math.ceil(history.length / limit)
    })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 👥 USUÁRIOS - Buscar todos
app.get('/make-server-cc2c4d6e/users', async (c) => {
  try {
    const userKeys = await kv.getByPrefix('user:')
    const users = userKeys
      .filter(item => !item.key.includes('user:id:'))
      .map(item => {
        const { password, ...userWithoutPassword } = item.value
        return userWithoutPassword
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
    
    return c.json({ success: true, users })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🎯 CONQUISTAS - Buscar por usuário
app.get('/make-server-cc2c4d6e/achievements/:username', async (c) => {
  try {
    const username = c.req.param('username')
    const user = await kv.get(`user:${username}`)
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    return c.json({ 
      success: true, 
      achievements: user.achievements || [] 
    })
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔄 REAL-TIME - Status do servidor
app.get('/make-server-cc2c4d6e/status', async (c) => {
  try {
    const userKeys = await kv.getByPrefix('user:')
    const totalUsers = userKeys.filter(item => !item.key.includes('user:id:')).length
    
    return c.json({ 
      success: true, 
      status: 'online',
      totalUsers,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔧 FUNÇÕES AUXILIARES

async function updateLeaderboard() {
  try {
    const userKeys = await kv.getByPrefix('user:')
    const users = userKeys
      .filter(item => !item.key.includes('user:id:'))
      .map(item => {
        const { password, ...userWithoutPassword } = item.value
        return userWithoutPassword
      })
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))

    await kv.set('leaderboard:current', users)
    
    // Atualizar rank de cada usuário
    for (const user of users) {
      const fullUser = await kv.get(`user:${user.username}`)
      if (fullUser) {
        fullUser.rank = user.rank
        await kv.set(`user:${user.username}`, fullUser)
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar leaderboard:', error)
  }
}

async function checkAchievements(username: string, user: any) {
  try {
    const achievements = [
      { id: 'first_point', name: 'Primeiro Ponto', description: 'Registrou seu primeiro ponto', condition: () => user.totalPoints >= 1 },
      { id: 'ten_points', name: 'Dez Pontos', description: 'Acumulou 10 pontos', condition: () => user.totalPoints >= 10 },
      { id: 'fifty_points', name: 'Cinquenta Pontos', description: 'Acumulou 50 pontos', condition: () => user.totalPoints >= 50 },
      { id: 'hundred_points', name: 'Cem Pontos', description: 'Acumulou 100 pontos', condition: () => user.totalPoints >= 100 },
      { id: 'top_3', name: 'Top 3', description: 'Ficou entre os 3 primeiros', condition: () => user.rank <= 3 },
      { id: 'leader', name: 'Líder', description: 'Alcançou o 1º lugar', condition: () => user.rank === 1 }
    ]

    const userAchievements = user.achievements || []
    const newAchievements = []

    for (const achievement of achievements) {
      if (!userAchievements.find(a => a.id === achievement.id) && achievement.condition()) {
        const newAchievement = {
          ...achievement,
          unlockedAt: new Date().toISOString()
        }
        userAchievements.push(newAchievement)
        newAchievements.push(newAchievement)
      }
    }

    if (newAchievements.length > 0) {
      user.achievements = userAchievements
      await kv.set(`user:${username}`, user)
    }
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error)
  }
}

console.log('🚀 Servidor Sistemáticos de Plantão iniciado!')

Deno.serve(app.fetch)