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

// Middleware para autenticação
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader) {
    return c.json({ code: 401, message: 'Token de autorização necessário' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Se for o token público, permitir acesso limitado
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) {
    c.set('isPublic', true)
    await next()
    return
  }

  // Se for um token de usuário (formato: fake_token_USER_ID)
  if (token.startsWith('fake_token_')) {
    const userId = token.replace('fake_token_', '')
    
    // Verificar se o usuário existe
    const userRecord = await kv.get(`user:id:${userId}`)
    if (!userRecord) {
      return c.json({ code: 401, message: 'Invalid JWT' }, 401)
    }
    
    const user = await kv.get(`user:${userRecord}`)
    if (!user) {
      return c.json({ code: 401, message: 'Invalid JWT' }, 401)
    }
    
    c.set('currentUser', user)
    c.set('isAuthenticated', true)
    await next()
    return
  }

  return c.json({ code: 401, message: 'Invalid JWT' }, 401)
}

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
    
    console.log(`🎯 Tentativa de adicionar ponto: ${username}, ${reason}, ${points}`)
    
    const user = await kv.get(`user:${username}`)
    if (!user) {
      console.log(`❌ Usuário não encontrado: ${username}`)
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    console.log(`📊 Usuário encontrado: ${username} com ${user.totalPoints} pontos totais`)

    // Atualizar pontos do usuário
    const pontosAntesUpdate = user.totalPoints
    user.points += points
    user.totalPoints += points
    await kv.set(`user:${username}`, user)
    
    console.log(`📊 Pontos atualizados para ${username}: ${pontosAntesUpdate} -> ${user.totalPoints} (adicionado: ${points})`)

    // Registrar no histórico
    const record = {
      id: crypto.randomUUID(),
      username,
      reason,
      points,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('pt-BR'),
      avatar: user.avatar
    }

    // Histórico individual do usuário
    const historyKey = `history:${username}`
    const history = await kv.get(historyKey) || []
    history.unshift(record)
    
    // Manter apenas os últimos 100 registros
    if (history.length > 100) {
      history.splice(100)
    }
    
    await kv.set(historyKey, history)

    // Histórico global
    const globalHistory = await kv.get('history:global') || []
    globalHistory.unshift(record)
    
    // Manter apenas os últimos 500 registros globais
    if (globalHistory.length > 500) {
      globalHistory.splice(500)
    }
    
    await kv.set('history:global', globalHistory)

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

// 📋 HISTÓRICO - Buscar registros individuais (requer autenticação)
app.get('/make-server-cc2c4d6e/history/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    
    const currentUser = c.get('currentUser')
    const isAuthenticated = c.get('isAuthenticated')
    
    // Verificar se está autenticado para ver histórico
    if (!isAuthenticated) {
      return c.json({ code: 401, message: 'Autenticação necessária para ver histórico' }, 401)
    }
    
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

// 📋 HISTÓRICO - Buscar registros globais
app.get('/make-server-cc2c4d6e/history/global/recent', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    
    const globalHistory = await kv.get('history:global') || []
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageHistory = globalHistory.slice(startIndex, endIndex)
    
    return c.json({ 
      success: true, 
      history: pageHistory,
      total: globalHistory.length,
      page,
      totalPages: Math.ceil(globalHistory.length / limit)
    })
  } catch (error) {
    console.error('Erro ao buscar histórico global:', error)
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

// 👤 USUÁRIO - Buscar perfil específico (requer autenticação)
app.get('/make-server-cc2c4d6e/user/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const isAuthenticated = c.get('isAuthenticated')
    
    if (!isAuthenticated) {
      return c.json({ code: 401, message: 'Autenticação necessária para ver perfil' }, 401)
    }
    
    const user = await kv.get(`user:${username}`)
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }
    
    const { password, ...userWithoutPassword } = user
    return c.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error)
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

// 👥 AMIZADES - Enviar solicitação
app.post('/make-server-cc2c4d6e/friends/request', authMiddleware, async (c) => {
  try {
    const { fromUsername, toUsername } = await c.req.json()
    
    if (fromUsername === toUsername) {
      return c.json({ error: 'Não é possível enviar solicitação para si mesmo' }, 400)
    }

    const fromUser = await kv.get(`user:${fromUsername}`)
    const toUser = await kv.get(`user:${toUsername}`)
    
    if (!fromUser || !toUser) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    // Verificar se já são amigos
    if (fromUser.friends?.includes(toUsername)) {
      return c.json({ error: 'Já são amigos' }, 400)
    }

    // Criar solicitação
    const request = {
      id: crypto.randomUUID(),
      from: fromUsername,
      to: toUsername,
      fromAvatar: fromUser.avatar,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }

    // Verificar se já existe solicitação pendente
    const existingRequests = await kv.get(`friend_requests:${toUsername}`) || []
    if (existingRequests.find(req => req.from === fromUsername && req.status === 'pending')) {
      return c.json({ error: 'Solicitação já enviada' }, 400)
    }

    existingRequests.push(request)
    await kv.set(`friend_requests:${toUsername}`, existingRequests)

    return c.json({ success: true, request })
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 👥 AMIZADES - Responder solicitação
app.post('/make-server-cc2c4d6e/friends/respond', authMiddleware, async (c) => {
  try {
    const { username, requestId, accept } = await c.req.json()
    
    const requests = await kv.get(`friend_requests:${username}`) || []
    const requestIndex = requests.findIndex(req => req.id === requestId)
    
    if (requestIndex === -1) {
      return c.json({ error: 'Solicitação não encontrada' }, 404)
    }

    const request = requests[requestIndex]
    
    if (accept) {
      // Adicionar como amigos
      const user = await kv.get(`user:${username}`)
      const friendUser = await kv.get(`user:${request.from}`)
      
      if (!user.friends) user.friends = []
      if (!friendUser.friends) friendUser.friends = []
      
      user.friends.push(request.from)
      friendUser.friends.push(username)
      
      await kv.set(`user:${username}`, user)
      await kv.set(`user:${request.from}`, friendUser)
    }

    // Remover solicitação
    requests.splice(requestIndex, 1)
    await kv.set(`friend_requests:${username}`, requests)

    return c.json({ success: true })
  } catch (error) {
    console.error('Erro ao responder solicitação de amizade:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 👥 AMIZADES - Buscar solicitações
app.get('/make-server-cc2c4d6e/friends/requests/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const requests = await kv.get(`friend_requests:${username}`) || []
    
    return c.json({ 
      success: true, 
      requests: requests.filter(req => req.status === 'pending')
    })
  } catch (error) {
    console.error('Erro ao buscar solicitações de amizade:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 👥 AMIZADES - Buscar amigos
app.get('/make-server-cc2c4d6e/friends/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const user = await kv.get(`user:${username}`)
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    const friends = []
    for (const friendUsername of user.friends || []) {
      const friend = await kv.get(`user:${friendUsername}`)
      if (friend) {
        const { password, ...friendWithoutPassword } = friend
        friends.push(friendWithoutPassword)
      }
    }

    return c.json({ success: true, friends })
  } catch (error) {
    console.error('Erro ao buscar amigos:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🏆 CONQUISTAS - Buscar conquistas de um usuário
app.get('/make-server-cc2c4d6e/achievements/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const user = await kv.get(`user:${username}`)
    
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }

    return c.json({ 
      success: true, 
      achievements: user.achievements || [],
      totalPoints: user.totalPoints || 0,
      rank: user.rank || 0
    })
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error)
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
      // Conquistas de Pontos
      { id: 'first_point', name: 'Primeiro Passo', description: 'Registrou seu primeiro ponto', icon: '🎯', condition: async () => user.totalPoints >= 1 },
      { id: 'five_points', name: 'Aquecendo', description: 'Acumulou 5 pontos', icon: '🔥', condition: async () => user.totalPoints >= 5 },
      { id: 'ten_points', name: 'Dez na Área', description: 'Acumulou 10 pontos', icon: '⚡', condition: async () => user.totalPoints >= 10 },
      { id: 'twenty_five_points', name: 'Subindo o Nível', description: 'Acumulou 25 pontos', icon: '📈', condition: async () => user.totalPoints >= 25 },
      { id: 'fifty_points', name: 'Meio Século', description: 'Acumulou 50 pontos', icon: '🎊', condition: async () => user.totalPoints >= 50 },
      { id: 'hundred_points', name: 'Centena', description: 'Acumulou 100 pontos', icon: '💯', condition: async () => user.totalPoints >= 100 },
      { id: 'two_hundred_points', name: 'Dobrou a Meta', description: 'Acumulou 200 pontos', icon: '🚀', condition: async () => user.totalPoints >= 200 },
      { id: 'five_hundred_points', name: 'Quinhentos!', description: 'Acumulou 500 pontos', icon: '🏆', condition: async () => user.totalPoints >= 500 },
      { id: 'thousand_points', name: 'Milhar', description: 'Acumulou 1000 pontos', icon: '👑', condition: async () => user.totalPoints >= 1000 },
      
      // Conquistas de Ranking
      { id: 'top_10', name: 'Top 10', description: 'Ficou entre os 10 primeiros', icon: '🔟', condition: async () => user.rank <= 10 },
      { id: 'top_5', name: 'Top 5', description: 'Ficou entre os 5 primeiros', icon: '✋', condition: async () => user.rank <= 5 },
      { id: 'top_3', name: 'Pódio', description: 'Ficou entre os 3 primeiros', icon: '🥉', condition: async () => user.rank <= 3 },
      { id: 'second_place', name: 'Vice-Campeão', description: 'Alcançou o 2º lugar', icon: '🥈', condition: async () => user.rank === 2 },
      { id: 'leader', name: 'Campeão', description: 'Alcançou o 1º lugar', icon: '🥇', condition: async () => user.rank === 1 },
      
      // Conquistas Sociais
      { id: 'first_friend', name: 'Sociável', description: 'Fez seu primeiro amigo', icon: '👥', condition: async () => (user.friends?.length || 0) >= 1 },
      { id: 'five_friends', name: 'Popular', description: 'Tem 5 amigos', icon: '🎉', condition: async () => (user.friends?.length || 0) >= 5 },
      { id: 'ten_friends', name: 'Networking Master', description: 'Tem 10 amigos', icon: '🌟', condition: async () => (user.friends?.length || 0) >= 10 },
      
      // Conquistas Especiais
      { id: 'early_adopter', name: 'Early Adopter', description: 'Um dos primeiros usuários', icon: '🚀', condition: async () => user.id && new Date(user.createdAt) < new Date('2025-01-01') },
      { id: 'consistent_player', name: 'Consistente', description: 'Registrou pontos por 7 dias seguidos', icon: '📅', condition: async () => await checkConsistency(username) },
      { id: 'night_owl', name: 'Coruja', description: 'Registrou pontos depois da meia-noite', icon: '🦉', condition: async () => await checkNightActivity(username) },
      { id: 'morning_bird', name: 'Madrugador', description: 'Registrou pontos antes das 6h', icon: '🌅', condition: async () => await checkMorningActivity(username) },
      
      // Conquistas Temáticas
      { id: 'henaldo_hunter', name: 'Caçador de Henaldo', description: 'Xingou o Henaldo 10 vezes', icon: '🎯', condition: async () => await checkSpecificReason(username, 'xingar-henaldo', 10) },
      { id: 'perfect_student', name: 'Aluno Exemplar', description: 'Tirou total em avaliação 5 vezes', icon: '📚', condition: async () => await checkSpecificReason(username, 'avaliacao-total', 5) },
      { id: 'helper', name: 'Colaborativo', description: 'Ajudou colegas 15 vezes', icon: '🤝', condition: async () => await checkSpecificReason(username, 'ajudar-colega', 15) },
      { id: 'expo_winner', name: 'Campeão da ExpoTech', description: 'Ganhou primeiro lugar na ExpoTech', icon: '🏆', condition: async () => await checkSpecificReason(username, 'primeiro-expotech', 1) },
      { id: 'expo_runner_up', name: 'Vice na ExpoTech', description: 'Ficou em segundo na ExpoTech', icon: '🥈', condition: async () => await checkSpecificReason(username, 'segundo-expotech', 1) },
    ]

    const userAchievements = user.achievements || []
    const newAchievements = []

    console.log(`🔍 Verificando conquistas para ${username} com ${user.totalPoints} pontos totais`)
    console.log(`📊 Conquistas atuais do usuário: ${userAchievements.length}`)
    
    for (const achievement of achievements) {
      const hasAchievement = userAchievements.find(a => a.id === achievement.id)
      if (!hasAchievement) {
        try {
          const conditionMet = await achievement.condition()
          console.log(`🎯 Testando ${achievement.name} (${achievement.id}): ${conditionMet}`)
          if (conditionMet) {
            const newAchievement = {
              ...achievement,
              unlockedAt: new Date().toISOString()
            }
            userAchievements.push(newAchievement)
            newAchievements.push(newAchievement)
            console.log(`🏆 Nova conquista desbloqueada para ${username}: ${achievement.name}`)
          }
        } catch (error) {
          console.error(`❌ Erro ao verificar conquista ${achievement.id}:`, error)
        }
      } else {
        console.log(`✅ Já possui: ${achievement.name}`)
      }
    }

    if (newAchievements.length > 0) {
      user.achievements = userAchievements
      await kv.set(`user:${username}`, user)
      console.log(`✅ Salvas ${newAchievements.length} novas conquistas para ${username}`)
    }
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error)
  }
}

// Funções auxiliares para conquistas específicas
async function checkConsistency(username: string): Promise<boolean> {
  // Por enquanto retorna false, implementar lógica de dias consecutivos
  return false
}

async function checkNightActivity(username: string): Promise<boolean> {
  // Por enquanto retorna false, implementar verificação de horário
  return false
}

async function checkMorningActivity(username: string): Promise<boolean> {
  // Por enquanto retorna false, implementar verificação de horário
  return false
}

async function checkSpecificReason(username: string, reason: string, count: number): Promise<boolean> {
  try {
    const history = await kv.get(`history:${username}`) || []
    const reasonCount = history.filter(record => record.reason === reason).length
    return reasonCount >= count
  } catch {
    return false
  }
}

console.log('🚀 Servidor Sistemáticos de Plantão iniciado!')

Deno.serve(app.fetch)