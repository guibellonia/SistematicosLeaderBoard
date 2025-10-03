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

// Middleware para autenticação usando Supabase JWT
async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  const endpoint = c.req.path
  
  console.log(`🔐 Middleware auth - Endpoint: ${endpoint}, Auth Header: ${authHeader ? 'presente' : 'ausente'}`)
  
  if (!authHeader) {
    console.log(`❌ Sem header de autorização para ${endpoint}`)
    return c.json({ code: 401, message: 'Token de autorização necessário' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  console.log(`🔐 Token JWT recebido: ${token.substring(0, 20)}...`)
  
  try {
    // Verificar o JWT com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log(`❌ Token JWT inválido: ${error?.message || 'Usuário não encontrado'}`)
      return c.json({ code: 401, message: 'Invalid JWT' }, 401)
    }

    console.log(`✅ JWT válido para usuário: ${user.id}`)
    
    // Extrair username do email ou metadata
    const email = user.email || ''
    const username = user.user_metadata?.username || email.split('@')[0]
    
    console.log(`🔍 Buscando dados do usuário: ${username}`)
    
    // VALIDAÇÃO DE SEGURANÇA: Bloquear usuários administrativos no middleware
    const bannedUsernames = [
      'admin', 'administrator', 'root', 'test', 'guest', 'demo', 'user', 'null', 'undefined',
      'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact', 'about',
      'login', 'register', 'signup', 'signin', 'auth', 'oauth', 'sistema', 'sistematics',
      'moderator', 'mod', 'staff', 'owner', 'service', 'bot', 'automatic',
      'teste123', 'mcqueen'  // Usuários específicos solicitados para remoção
    ];
    
    if (bannedUsernames.includes(username.toLowerCase())) {
      console.error(`🚫 ACESSO BLOQUEADO: Username banido ${username}`)
      return c.json({ code: 403, message: 'Acesso negado: usuário administrativo não permitido' }, 403)
    }
    
    // Buscar dados do usuário no nosso sistema
    let userData = await kv.get(`user:${username}`)
    
    if (!userData) {
      // Se o usuário não existe no nosso sistema, criar
      console.log(`📝 Criando novo usuário no sistema: ${username}`)
      userData = {
        id: user.id,
        username: username,
        points: 0,
        totalPoints: 0,
        rank: 1,
        achievements: [],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        joinedAt: new Date().toISOString(),
        createdAt: user.created_at,
      }
      
      await kv.set(`user:${username}`, userData)
      await kv.set(`user:id:${user.id}`, username)
      
      // Atualizar leaderboard
      await updateLeaderboard()
    }
    
    console.log(`✅ Autenticação bem-sucedida para: ${userData.username}`)
    c.set('currentUser', userData)
    c.set('isAuthenticated', true)
    c.set('supabaseUser', user)
    await next()
    return
  } catch (error) {
    console.error(`❌ Erro na verificação do JWT:`, error)
    return c.json({ code: 401, message: 'Invalid JWT' }, 401)
  }
}

// Middleware para endpoints públicos (permite token público ou JWT)
async function publicMiddleware(c: any, next: any) {
  const authHeader = c.req.header('Authorization')
  const endpoint = c.req.path
  
  console.log(`🌐 Middleware público - Endpoint: ${endpoint}, Auth Header: ${authHeader ? 'presente' : 'ausente'}`)
  
  if (!authHeader) {
    // Se não há header, permitir acesso público limitado
    console.log(`🔓 Acesso público sem autenticação para ${endpoint}`)
    c.set('isPublic', true)
    c.set('isAuthenticated', false)
    await next()
    return
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Se for o token público, permitir acesso limitado
  if (token === Deno.env.get('SUPABASE_ANON_KEY')) {
    console.log(`🔓 Acesso público com token anon para ${endpoint}`)
    c.set('isPublic', true)
    c.set('isAuthenticated', false)
    await next()
    return
  }

  // Tentar verificar se é um JWT válido do Supabase
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (!error && user) {
      console.log(`✅ JWT válido detectado em endpoint público: ${user.id}`)
      
      // Buscar dados do usuário
      const email = user.email || ''
      const username = user.user_metadata?.username || email.split('@')[0]
      const userData = await kv.get(`user:${username}`)
      
      if (userData) {
        console.log(`✅ Usuário autenticado em endpoint público: ${userData.username}`)
        c.set('currentUser', userData)
        c.set('isAuthenticated', true)
        c.set('supabaseUser', user)
        await next()
        return
      }
    }
  } catch (error) {
    console.log(`🔍 Token não é JWT válido, permitindo acesso público`)
  }

  // Se chegou aqui, permitir acesso público
  console.log(`🔓 Acesso público para ${endpoint}`)
  c.set('isPublic', true)
  c.set('isAuthenticated', false)
  await next()
}

// Rotas do sistema Sistemáticos de Plantão

// 🔐 AUTH - Registro usando Supabase Admin API
app.post('/make-server-cc2c4d6e/auth/register', publicMiddleware, async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    console.log(`🔄 REGISTRO: Iniciando para ${username} com senha de ${password?.length || 0} caracteres`)
    
    if (!username || !password) {
      console.log('❌ REGISTRO: Dados faltando')
      return c.json({ error: 'Username e password são obrigatórios' }, 400)
    }

    // VALIDAÇÕES DE SEGURANÇA ROBUSTAS
    const bannedUsernames = [
      'admin', 'administrator', 'root', 'test', 'guest', 'demo', 'user', 'null', 'undefined',
      'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact', 'about',
      'login', 'register', 'signup', 'signin', 'auth', 'oauth', 'sistema', 'sistematics',
      'moderator', 'mod', 'staff', 'owner', 'service', 'bot', 'automatic',
      'teste123', 'mcqueen'  // Usuários específicos solicitados para remoção
    ];
    
    if (bannedUsernames.includes(username.toLowerCase())) {
      console.log(`🚫 REGISTRO BLOQUEADO: Username banido ${username}`)
      return c.json({ error: 'Este nome de usuário é reservado e não pode ser usado' }, 400)
    }

    if (username.length < 3 || username.length > 30) {
      return c.json({ error: 'Nome de usuário deve ter entre 3 e 30 caracteres' }, 400)
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return c.json({ error: 'Nome de usuário pode conter apenas letras, números e underscore' }, 400)
    }

    if (password.length < 8) {
      return c.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, 400)
    }

    // Verificar senhas fracas
    const bannedPasswords = [
      'admin', 'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin123', '12345', 'senha', 'senha123', 'test', 'demo'
    ];
    
    if (bannedPasswords.includes(password.toLowerCase())) {
      return c.json({ error: 'Esta senha é muito comum e insegura. Escolha uma senha mais forte.' }, 400)
    }

    // Verificar se usuário já existe no nosso sistema
    const existingUser = await kv.get(`user:${username.toLowerCase()}`)
    if (existingUser) {
      console.log(`ℹ️ REGISTRO: Usuário ${username.toLowerCase()} já existe no sistema`)
      return c.json({ success: true, user: existingUser, message: 'Usuário já existe' })
    }

    console.log(`📝 REGISTRO: Criando usuário via Admin API: ${username.toLowerCase()}`)
    console.log(`📝 REGISTRO: Email será: ${username.toLowerCase()}@sistematics.local`)
    
    // Criar usuário via Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: `${username.toLowerCase()}@sistematics.local`,
      password: password,
      user_metadata: { 
        username: username.toLowerCase(),
        display_name: username 
      },
      // Confirmar email automaticamente já que não temos servidor de email configurado
      email_confirm: true
    })

    console.log(`📝 REGISTRO: Resposta da Admin API:`, { 
      success: !error,
      userId: data?.user?.id,
      errorMessage: error?.message 
    })

    if (error) {
      console.error('❌ Erro do Supabase Admin:', error)
      
      // Se o usuário já está registrado no Supabase, verificar se existe no nosso sistema
      if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
        console.log('ℹ️ Usuário já registrado no Supabase, verificando dados locais...')
        
        // Buscar no nosso sistema
        const localUser = await kv.get(`user:${username.toLowerCase()}`)
        if (localUser) {
          console.log('✅ Usuário encontrado no sistema local também')
          return c.json({ success: true, user: localUser, message: 'Usuário já registrado' })
        } else {
          console.log('⚠️ Usuário existe no Supabase mas não no sistema local, isso é um problema')
          return c.json({ error: 'Usuário parcialmente registrado. Tente fazer login.' }, 409)
        }
      }
      
      // Outros erros
      let friendlyError = error.message
      if (error.message.includes('Password should be at least')) {
        friendlyError = 'A senha deve ter pelo menos 6 caracteres'
      } else if (error.message.includes('Unable to validate email address')) {
        friendlyError = 'Formato de email inválido'
      }
      
      return c.json({ error: friendlyError }, 400)
    }

    if (!data.user) {
      return c.json({ error: 'Falha ao criar usuário' }, 500)
    }

    console.log(`✅ Usuário criado no Supabase: ${data.user.id}`)

    // Criar usuário no nosso sistema
    const user = {
      id: data.user.id,
      username: username.toLowerCase(),
      createdAt: data.user.created_at,
      points: 0,
      totalPoints: 0,
      rank: 1,
      achievements: [],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      joinedAt: new Date().toISOString()
    }

    console.log(`💾 REGISTRO: Salvando dados no KV store...`)
    await kv.set(`user:${username.toLowerCase()}`, user)
    await kv.set(`user:id:${data.user.id}`, username.toLowerCase())

    console.log(`📊 REGISTRO: Atualizando leaderboard...`)
    // Atualizar leaderboard
    await updateLeaderboard()

    console.log(`✅ REGISTRO: Processo completo para ${username.toLowerCase()}`)
    console.log(`✅ REGISTRO: Usuário pode fazer login com: ${username.toLowerCase()}@sistematics.local`)

    return c.json({ 
      success: true, 
      user: user,
      message: 'Usuário criado com sucesso'
    })
  } catch (error) {
    console.error('❌ Erro no registro:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📊 PONTOS - Adicionar ponto para outro usuário (requer autenticação)
app.post('/make-server-cc2c4d6e/points/add-for-user', authMiddleware, async (c) => {
  try {
    const { targetUsername, reason, points, reasonId } = await c.req.json()
    const currentUser = c.get('currentUser')
    const supabaseUser = c.get('supabaseUser')
    
    if (!currentUser || !supabaseUser) {
      console.error('❌ Usuário não encontrado no contexto de autenticação')
      return c.json({ error: 'Usuário não autenticado' }, 401)
    }
    
    console.log(`🎯 ${currentUser.username} registrando ponto para: ${targetUsername}, ${reason}, ${points}`)
    
    // Validar dados de entrada
    if (!targetUsername || !reason || typeof points !== 'number' || points <= 0) {
      console.error(`❌ Dados inválidos: targetUsername=${targetUsername}, reason=${reason}, points=${points}`)
      return c.json({ error: 'Dados inválidos' }, 400)
    }
    
    // Buscar usuário alvo
    const targetUser = await kv.get(`user:${targetUsername}`)
    if (!targetUser) {
      console.error(`❌ Usuário alvo ${targetUsername} não encontrado`)
      return c.json({ error: 'Usuário alvo não encontrado' }, 404)
    }
    
    console.log(`📊 Usuário alvo encontrado: ${targetUsername} com ${targetUser.totalPoints || 0} pontos totais`)
    
    // Atualizar pontos do usuário alvo
    const pontosAntesUpdate = targetUser.totalPoints || 0
    const pontosTemporadaAntes = targetUser.points || 0
    targetUser.points = (targetUser.points || 0) + points // Pontos da temporada atual
    targetUser.totalPoints = (targetUser.totalPoints || 0) + points // Pontos históricos totais
    await kv.set(`user:${targetUsername}`, targetUser)
    
    console.log(`📊 Pontos atualizados para ${targetUsername}:`)
    console.log(`   Total: ${pontosAntesUpdate} -> ${targetUser.totalPoints} (+${points})`)
    console.log(`   Temporada: ${pontosTemporadaAntes} -> ${targetUser.points} (+${points})`)
    
    // Registrar no histórico (registrado por quem adicionou)
    const record = {
      id: crypto.randomUUID(),
      username: targetUsername, // Quem recebeu os pontos
      userId: targetUser.id,
      reason: `${reason} (registrado por ${currentUser.username})`, // Incluir quem registrou
      reasonId: reasonId || reason,
      points,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('pt-BR'),
      avatar: targetUser.avatar,
      addedBy: currentUser.username // Campo adicional para rastrear quem adicionou
    }
    
    // Histórico individual do usuário alvo
    const historyKey = `history:${targetUsername}`
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
    
    // Verificar conquistas para o usuário alvo
    await checkAchievements(targetUsername, targetUser)
    
    console.log(`✅ Ponto adicionado por ${currentUser.username} para ${targetUsername}`)
    
    return c.json({ 
      success: true, 
      user: { ...targetUser, password: undefined },
      record,
      message: `Ponto registrado para ${targetUsername} por ${currentUser.username}`
    })
  } catch (error) {
    console.error('Erro ao adicionar ponto para outro usuário:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📊 PONTOS - Adicionar ponto (requer autenticação)
app.post('/make-server-cc2c4d6e/points/add', authMiddleware, async (c) => {
  try {
    const { reason, points, reasonId } = await c.req.json()
    const currentUser = c.get('currentUser')
    const supabaseUser = c.get('supabaseUser')
    
    if (!currentUser || !supabaseUser) {
      console.error('❌ Usuário não encontrado no contexto de autenticação')
      return c.json({ error: 'Usuário não autenticado' }, 401)
    }
    
    const username = currentUser.username
    
    console.log(`🎯 Tentativa de adicionar ponto: ${username}, ${reason}, ${points}`)
    
    // Buscar usuário atualizado do banco para garantir dados consistentes
    const user = await kv.get(`user:${username}`)
    if (!user) {
      console.error(`❌ Usuário ${username} não encontrado no banco`)
      return c.json({ error: 'Usuário não encontrado' }, 404)
    }
    
    console.log(`📊 Usuário encontrado: ${username} com ${user.totalPoints || 0} pontos totais`)

    // Validar dados de entrada
    if (!reason || typeof points !== 'number' || points <= 0) {
      console.error(`❌ Dados inválidos: reason=${reason}, points=${points}`)
      return c.json({ error: 'Dados inválidos' }, 400)
    }

    // Atualizar pontos do usuário
    const pontosAntesUpdate = user.totalPoints || 0
    const pontosTemporadaAntes = user.points || 0
    user.points = (user.points || 0) + points // Pontos da temporada atual
    user.totalPoints = (user.totalPoints || 0) + points // Pontos históricos totais
    await kv.set(`user:${username}`, user)
    
    console.log(`📊 Pontos atualizados para ${username}:`)
    console.log(`   Total: ${pontosAntesUpdate} -> ${user.totalPoints} (+${points})`)
    console.log(`   Temporada: ${pontosTemporadaAntes} -> ${user.points} (+${points})`)

    // Registrar no histórico
    const record = {
      id: crypto.randomUUID(),
      username,
      userId: user.id, // Adicionar userId para facilitar filtros
      reason,
      reasonId: reasonId || reason, // Fallback para reason se reasonId não fornecido
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

// 🏆 LEADERBOARD - Buscar ranking (público)
app.get('/make-server-cc2c4d6e/leaderboard', publicMiddleware, async (c) => {
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

// 📋 HISTÓRICO - Buscar registros globais (público)
app.get('/make-server-cc2c4d6e/history/global/recent', publicMiddleware, async (c) => {
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

// 👥 USUÁRIOS - Buscar todos (público)
app.get('/make-server-cc2c4d6e/users', publicMiddleware, async (c) => {
  try {
    const userKeys = await kv.getByPrefix('user:')
    const users = userKeys
      .filter(item => !item.key.includes('user:id:'))
      .map(item => {
        const { password, ...userWithoutPassword } = item.value
        return userWithoutPassword
      })
      .filter(user => {
        // Filtrar usuários válidos
        if (!user || !user.username || typeof user.username !== 'string' || user.username.trim() === '' || user.username === 'Usuário') {
          console.log(`⚠️ Usuário inválido filtrado da lista: ${JSON.stringify(user)}`)
          return false
        }
        // Garantir propriedades essenciais
        if (typeof user.points !== 'number') user.points = 0
        if (typeof user.totalPoints !== 'number') user.totalPoints = 0
        if (!user.avatar) user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
        if (!user.achievements) user.achievements = []
        return true
      })
      .sort((a, b) => (b.points || 0) - (a.points || 0)) // Usar pontos da temporada atual
    
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



// 📅 TEMPORADA - Buscar informações da temporada atual (público)
app.get('/make-server-cc2c4d6e/season/current', publicMiddleware, async (c) => {
  try {
    const currentSeason = await kv.get('season:current') || {
      number: 1,
      year: new Date().getFullYear(),
      title: `Temporada 1 ${new Date().getFullYear()}`,
      startDate: new Date().toISOString(),
      status: 'active'
    }
    
    return c.json({ 
      success: true, 
      season: currentSeason 
    })
  } catch (error) {
    console.error('Erro ao buscar temporada atual:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📅 TEMPORADA - Buscar histórico de temporadas de um usuário
app.get('/make-server-cc2c4d6e/season/history/:username', authMiddleware, async (c) => {
  try {
    const username = c.req.param('username')
    const seasonHistory = await kv.get(`user:${username}:seasons`) || []
    
    return c.json({ 
      success: true, 
      seasons: seasonHistory 
    })
  } catch (error) {
    console.error('Erro ao buscar histórico de temporadas:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📅 TEMPORADA - Buscar todas as temporadas finalizadas (público)
app.get('/make-server-cc2c4d6e/season/finished', publicMiddleware, async (c) => {
  try {
    // Buscar todas as temporadas finalizadas no KV store
    const seasonKeys = await kv.getByPrefix('season:')
    const finishedSeasons = seasonKeys
      .filter(item => item.key.includes(':') && item.key !== 'season:current')
      .map(item => item.value)
      .filter(season => season && season.status === 'finished')
      .sort((a, b) => {
        // Ordenar por número da temporada (mais recente primeiro)
        if (a.year !== b.year) return b.year - a.year
        return b.number - a.number
      })
    
    console.log(`📅 Encontradas ${finishedSeasons.length} temporadas finalizadas`)
    
    return c.json({ 
      success: true, 
      seasons: finishedSeasons 
    })
  } catch (error) {
    console.error('Erro ao buscar temporadas finalizadas:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 📅 TEMPORADA - Buscar detalhes de uma temporada específica (público)
app.get('/make-server-cc2c4d6e/season/:number/:year', publicMiddleware, async (c) => {
  try {
    const number = c.req.param('number')
    const year = c.req.param('year')
    const seasonKey = `season:${number}:${year}`
    
    const season = await kv.get(seasonKey)
    if (!season) {
      return c.json({ error: 'Temporada não encontrada' }, 404)
    }
    
    return c.json({ 
      success: true, 
      season: season 
    })
  } catch (error) {
    console.error('Erro ao buscar temporada:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔄 REAL-TIME - Status do servidor (público)
app.get('/make-server-cc2c4d6e/status', publicMiddleware, async (c) => {
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

// 🔄 ADMIN - Limpar usuários antigos (usuários no KV que não estão no Supabase Auth)
app.post('/make-server-cc2c4d6e/admin/cleanup-users', publicMiddleware, async (c) => {
  try {
    console.log('🧹 Iniciando limpeza de usuários antigos e inválidos...')
    
    const userKeys = await kv.getByPrefix('user:')
    const usersToCheck = userKeys.filter(item => !item.key.includes('user:id:'))
    
    let usersRemoved = 0
    let usersKept = 0
    let invalidUsersRemoved = 0
    
    for (const userItem of usersToCheck) {
      const user = userItem.value
      
      // Verificar se o usuário tem dados válidos
      if (!user || !user.username || typeof user.username !== 'string' || user.username.trim() === '' || user.username === 'Usuário') {
        console.log(`🗑️ Removendo usuário inválido: ${JSON.stringify(user)}`)
        await kv.del(userItem.key)
        if (user?.id) {
          await kv.del(`user:id:${user.id}`)
        }
        if (user?.username) {
          await kv.del(`history:${user.username}`)
          await kv.del(`user:${user.username}:seasons`)
        }
        invalidUsersRemoved++
        usersRemoved++
        continue
      }
      
      try {
        // Verificar se o usuário existe no Supabase Auth
        const email = `${user.username}@sistematics.local`
        const { data, error } = await supabase.auth.admin.getUserByEmail(email)
        
        if (error || !data.user) {
          // Usuário não existe no Supabase Auth, remover do KV
          console.log(`🗑️ Removendo usuário órfão: ${user.username}`)
          await kv.del(`user:${user.username}`)
          if (user.id) {
            await kv.del(`user:id:${user.id}`)
          }
          // Remover histórico também
          await kv.del(`history:${user.username}`)
          await kv.del(`user:${user.username}:seasons`)
          usersRemoved++
        } else {
          // Verificar e corrigir dados do usuário válido
          let needsUpdate = false
          if (typeof user.points !== 'number') {
            user.points = 0
            needsUpdate = true
          }
          if (typeof user.totalPoints !== 'number') {
            user.totalPoints = 0
            needsUpdate = true
          }
          if (!user.avatar) {
            user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
            needsUpdate = true
          }
          if (!user.achievements) {
            user.achievements = []
            needsUpdate = true
          }
          
          if (needsUpdate) {
            await kv.set(`user:${user.username}`, user)
            console.log(`🔧 Corrigindo dados do usuário: ${user.username}`)
          }
          
          console.log(`✅ Mantendo usuário válido: ${user.username}`)
          usersKept++
        }
      } catch (checkError) {
        console.error(`❌ Erro ao verificar usuário ${user.username}:`, checkError)
        // Em caso de dúvida, manter o usuário se tiver dados válidos
        usersKept++
      }
    }
    
    // Atualizar leaderboard após limpeza
    await updateLeaderboard()
    
    // Limpar e recriar histórico global apenas com usuários válidos
    const remainingUsers = await kv.getByPrefix('user:')
    const validUsernames = remainingUsers
      .filter(item => !item.key.includes('user:id:'))
      .map(item => item.value)
      .filter(user => user && user.username && typeof user.username === 'string' && user.username.trim() !== '')
      .map(user => user.username)
    
    const currentGlobalHistory = await kv.get('history:global') || []
    const cleanedGlobalHistory = currentGlobalHistory.filter(record => 
      record && record.username && validUsernames.includes(record.username)
    )
    
    await kv.set('history:global', cleanedGlobalHistory)
    
    console.log(`🏁 Limpeza concluída! ${usersRemoved} usuários removidos (${invalidUsersRemoved} inválidos), ${usersKept} usuários mantidos`)
    
    return c.json({
      success: true,
      message: `Limpeza concluída! ${usersRemoved} usuários removidos (${invalidUsersRemoved} eram dados inválidos), ${usersKept} usuários válidos mantidos`,
      usersRemoved,
      usersKept,
      invalidUsersRemoved,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro na limpeza de usuários:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🏆 BELLONIA - Finalizar temporada e criar nova (apenas para bellonia)
app.post('/make-server-cc2c4d6e/admin/finalize-season', authMiddleware, async (c) => {
  try {
    const currentUser = c.get('currentUser')
    
    // Verificar se é o usuário bellonia
    if (currentUser?.username !== 'bellonia') {
      return c.json({ error: 'Apenas o usuário bellonia pode finalizar temporadas' }, 403)
    }
    
    console.log('🏆 Iniciando finalização da temporada...')
    
    // Buscar dados da temporada atual
    const currentSeasonData = await kv.get('season:current') || {
      number: 1,
      year: new Date().getFullYear(),
      startDate: new Date().toISOString(),
      status: 'active'
    }
    
    // Buscar todos os usuários e determinar vencedores
    const userKeys = await kv.getByPrefix('user:')
    const users = userKeys
      .filter(item => !item.key.includes('user:id:'))
      .map(item => item.value)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
    
    const winners = {
      first: users[0] || null,
      second: users[1] || null,
      third: users[2] || null,
      totalParticipants: users.length
    }
    
    // Salvar temporada finalizada
    const finalizedSeason = {
      ...currentSeasonData,
      status: 'finished',
      endDate: new Date().toISOString(),
      winners: winners,
      finalLeaderboard: users.slice(0, 10), // Top 10
      totalUsers: users.length
    }
    
    await kv.set(`season:${currentSeasonData.number}:${currentSeasonData.year}`, finalizedSeason)
    
    // Criar nova temporada
    const newSeasonNumber = currentSeasonData.number + 1
    const currentYear = new Date().getFullYear()
    const newSeason = {
      number: newSeasonNumber,
      year: currentYear,
      title: `Temporada ${newSeasonNumber} ${currentYear}`,
      startDate: new Date().toISOString(),
      status: 'active',
      previousSeason: {
        number: currentSeasonData.number,
        year: currentSeasonData.year,
        winners: winners
      }
    }
    
    await kv.set('season:current', newSeason)
    
    // Resetar pontos de temporada de todos os usuários (manter totalPoints)
    let usersReset = 0
    for (const user of users) {
      if (user && user.username) {
        // Salvar dados da temporada anterior no histórico do usuário
        const userSeasonHistory = await kv.get(`user:${user.username}:seasons`) || []
        userSeasonHistory.push({
          season: currentSeasonData.number,
          year: currentSeasonData.year,
          points: user.points || 0,
          rank: users.findIndex(u => u.username === user.username) + 1,
          endDate: new Date().toISOString()
        })
        await kv.set(`user:${user.username}:seasons`, userSeasonHistory)
        
        // Resetar pontos da temporada atual
        user.points = 0
        user.rank = 1
        await kv.set(`user:${user.username}`, user)
        usersReset++
      }
    }
    
    // Atualizar leaderboard
    await updateLeaderboard()
    
    // Limpar histórico global da temporada anterior
    await kv.set('history:global', [])
    
    console.log(`🏁 Temporada ${currentSeasonData.number} finalizada e Temporada ${newSeasonNumber} criada!`)
    console.log(`🥇 Vencedores: 1º ${winners.first?.username}, 2º ${winners.second?.username}, 3º ${winners.third?.username}`)
    
    return c.json({
      success: true,
      message: `Temporada ${currentSeasonData.number} finalizada! Nova temporada ${newSeasonNumber} iniciada.`,
      previousSeason: finalizedSeason,
      newSeason: newSeason,
      winners: winners,
      usersReset: usersReset,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro ao finalizar temporada:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔄 ADMIN - Detectar e limpar usuários inválidos automaticamente
app.post('/make-server-cc2c4d6e/admin/fix-invalid-users', publicMiddleware, async (c) => {
  try {
    console.log('🔧 Detectando e corrigindo usuários inválidos...')
    
    const userKeys = await kv.getByPrefix('user:')
    const usersToCheck = userKeys.filter(item => !item.key.includes('user:id:'))
    
    let invalidUsersFixed = 0
    let invalidUsersRemoved = 0
    
    for (const userItem of usersToCheck) {
      const user = userItem.value
      
      // Verificar se o usuário tem dados inválidos
      if (!user || !user.username || typeof user.username !== 'string' || user.username.trim() === '' || user.username === 'Usuário') {
        console.log(`🗑️ Removendo usuário completamente inválido: ${JSON.stringify(user)}`)
        await kv.del(userItem.key)
        if (user?.id) {
          await kv.del(`user:id:${user.id}`)
        }
        if (user?.username) {
          await kv.del(`history:${user.username}`)
          await kv.del(`user:${user.username}:seasons`)
        }
        invalidUsersRemoved++
        continue
      }
      
      // Corrigir dados parcialmente inválidos
      let needsUpdate = false
      
      if (typeof user.points !== 'number') {
        user.points = 0
        needsUpdate = true
      }
      if (typeof user.totalPoints !== 'number') {
        user.totalPoints = 0
        needsUpdate = true
      }
      if (typeof user.rank !== 'number' || user.rank < 1) {
        user.rank = 1
        needsUpdate = true
      }
      if (!user.avatar || typeof user.avatar !== 'string') {
        user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
        needsUpdate = true
      }
      if (!Array.isArray(user.achievements)) {
        user.achievements = []
        needsUpdate = true
      }
      if (!user.joinedAt) {
        user.joinedAt = user.createdAt || new Date().toISOString()
        needsUpdate = true
      }
      
      if (needsUpdate) {
        await kv.set(`user:${user.username}`, user)
        console.log(`🔧 Corrigido usuário: ${user.username}`)
        invalidUsersFixed++
      }
    }
    
    // Atualizar leaderboard após correções
    await updateLeaderboard()
    
    console.log(`🏁 Correção concluída! ${invalidUsersFixed} usuários corrigidos, ${invalidUsersRemoved} usuários inválidos removidos`)
    
    return c.json({
      success: true,
      message: `Correção concluída! ${invalidUsersFixed} usuários corrigidos, ${invalidUsersRemoved} usuários inválidos removidos`,
      invalidUsersFixed,
      invalidUsersRemoved,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro na correção de usuários inválidos:', error)
    return c.json({ error: 'Erro interno do servidor' }, 500)
  }
})

// 🔒 SEGURANÇA - Remover contas administrativas inseguras (URGENT)
app.post('/make-server-cc2c4d6e/security/remove-admin-accounts', publicMiddleware, async (c) => {
  try {
    console.log('🚫 INICIANDO REMOÇÃO DE CONTAS ADMINISTRATIVAS INSEGURAS...')
    
    const bannedUsernames = [
      'admin', 'administrator', 'root', 'test', 'guest', 'demo', 'user',
      'teste123', 'mcqueen'  // Usuários específicos solicitados para remoção
    ];
    
    let removedAccounts = 0;
    
    for (const bannedUsername of bannedUsernames) {
      try {
        // Verificar se existe no KV store
        const existingUser = await kv.get(`user:${bannedUsername}`);
        if (existingUser) {
          console.log(`🗑️ REMOVENDO conta insegura: ${bannedUsername}`);
          
          // Remover do KV store
          await kv.del(`user:${bannedUsername}`);
          if (existingUser.id) {
            await kv.del(`user:id:${existingUser.id}`);
          }
          await kv.del(`history:${bannedUsername}`);
          await kv.del(`user:${bannedUsername}:seasons`);
          
          removedAccounts++;
          
          // Tentar remover do Supabase Auth se possível
          try {
            const { data: users, error } = await supabase.auth.admin.listUsers();
            if (!error && users) {
              const userToDelete = users.users.find(u => 
                u.email === `${bannedUsername}@sistematics.local` ||
                u.user_metadata?.username === bannedUsername
              );
              
              if (userToDelete) {
                console.log(`🗑️ REMOVENDO do Supabase Auth: ${bannedUsername} (${userToDelete.id})`);
                await supabase.auth.admin.deleteUser(userToDelete.id);
              }
            }
          } catch (authError) {
            console.warn(`⚠️ Erro ao remover ${bannedUsername} do Supabase Auth:`, authError);
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao remover ${bannedUsername}:`, error);
      }
    }
    
    // Atualizar leaderboard após remoções
    await updateLeaderboard();
    
    console.log(`✅ SEGURANÇA: ${removedAccounts} contas administrativas inseguras removidas`);
    
    return c.json({
      success: true,
      message: `${removedAccounts} contas administrativas inseguras foram removidas`,
      removedAccounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro na remoção de contas administrativas:', error);
    return c.json({ error: 'Erro interno do servidor' }, 500);
  }
});

// 🔄 ADMIN - Reset de temporada (resetar pontos de todos os usuários)
app.post('/make-server-cc2c4d6e/admin/reset-season', publicMiddleware, async (c) => {
  try {
    console.log('🔄 Iniciando reset da temporada...')
    
    const userKeys = await kv.getByPrefix('user:')
    const users = userKeys.filter(item => !item.key.includes('user:id:'))
    
    let usersReset = 0
    
    // Resetar pontos de todos os usuários
    for (const userItem of users) {
      const user = userItem.value
      if (user && user.username) {
        user.points = 0 // Zerar pontos da temporada atual
        // Manter totalPoints como histórico
        user.rank = 1 // Resetar ranking
        
        await kv.set(`user:${user.username}`, user)
        usersReset++
        
        console.log(`✅ Reset pontos do usuário: ${user.username}`)
      }
    }
    
    // Atualizar leaderboard
    await updateLeaderboard()
    
    // Limpar histórico global se desejado (opcional)
    await kv.set('history:global', [])
    
    console.log(`🏁 Reset da temporada concluído! ${usersReset} usuários resetados`)
    
    return c.json({ 
      success: true, 
      message: `Temporada resetada com sucesso! ${usersReset} usuários afetados`,
      usersReset,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Erro no reset da temporada:', error)
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
      .filter(user => {
        // Validar se o usuário tem dados válidos
        if (!user || !user.username || typeof user.username !== 'string' || user.username.trim() === '') {
          console.log(`⚠️ Usuário inválido removido do leaderboard: ${JSON.stringify(user)}`)
          return false
        }
        // Validar se tem propriedades essenciais
        if (typeof user.points !== 'number') user.points = 0
        if (typeof user.totalPoints !== 'number') user.totalPoints = 0
        if (!user.avatar) user.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
        if (!user.achievements) user.achievements = []
        return true
      })
      .sort((a, b) => (b.points || 0) - (a.points || 0)) // Usar pontos da temporada atual
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
    
    console.log(`🏆 Leaderboard atualizado com ${users.length} usuários válidos`)
  } catch (error) {
    console.error('Erro ao atualizar leaderboard:', error)
  }
}

async function checkAchievements(username: string, user: any) {
  try {
    const achievements = [
      // Conquistas de Pontos
      { id: 'first_point', name: 'Primeiro Passo', description: 'Registrou seu primeiro ponto', icon: '🎯', condition: () => (user.totalPoints || 0) >= 1 },
      { id: 'five_points', name: 'Aquecendo', description: 'Acumulou 5 pontos', icon: '🔥', condition: () => (user.totalPoints || 0) >= 5 },
      { id: 'ten_points', name: 'Dez na Área', description: 'Acumulou 10 pontos', icon: '⚡', condition: () => (user.totalPoints || 0) >= 10 },
      { id: 'twenty_five_points', name: 'Subindo o Nível', description: 'Acumulou 25 pontos', icon: '📈', condition: () => (user.totalPoints || 0) >= 25 },
      { id: 'fifty_points', name: 'Meio Século', description: 'Acumulou 50 pontos', icon: '🎊', condition: () => (user.totalPoints || 0) >= 50 },
      { id: 'hundred_points', name: 'Centena', description: 'Acumulou 100 pontos', icon: '💯', condition: () => (user.totalPoints || 0) >= 100 },
      { id: 'two_hundred_points', name: 'Dobrou a Meta', description: 'Acumulou 200 pontos', icon: '🚀', condition: () => (user.totalPoints || 0) >= 200 },
      { id: 'five_hundred_points', name: 'Quinhentos!', description: 'Acumulou 500 pontos', icon: '🏆', condition: () => (user.totalPoints || 0) >= 500 },
      { id: 'thousand_points', name: 'Milhar', description: 'Acumulou 1000 pontos', icon: '👑', condition: () => (user.totalPoints || 0) >= 1000 },
      
      // Conquistas de Ranking
      { id: 'top_10', name: 'Top 10', description: 'Ficou entre os 10 primeiros', icon: '🔟', condition: () => (user.rank || 999) <= 10 },
      { id: 'top_5', name: 'Top 5', description: 'Ficou entre os 5 primeiros', icon: '✋', condition: () => (user.rank || 999) <= 5 },
      { id: 'top_3', name: 'Pódio', description: 'Ficou entre os 3 primeiros', icon: '🥉', condition: () => (user.rank || 999) <= 3 },
      { id: 'second_place', name: 'Vice-Campeão', description: 'Alcançou o 2º lugar', icon: '🥈', condition: () => (user.rank || 999) === 2 },
      { id: 'leader', name: 'Campeão', description: 'Alcançou o 1º lugar', icon: '🥇', condition: () => (user.rank || 999) === 1 },
      
      // Conquistas Sociais
      { id: 'first_friend', name: 'Sociável', description: 'Fez seu primeiro amigo', icon: '👥', condition: () => (user.friends?.length || 0) >= 1 },
      { id: 'five_friends', name: 'Popular', description: 'Tem 5 amigos', icon: '🎉', condition: () => (user.friends?.length || 0) >= 5 },
      { id: 'ten_friends', name: 'Networking Master', description: 'Tem 10 amigos', icon: '🌟', condition: () => (user.friends?.length || 0) >= 10 },
      
      // Conquistas Especiais
      { id: 'early_adopter', name: 'Early Adopter', description: 'Um dos primeiros usuários', icon: '🚀', condition: () => user.id && user.createdAt && new Date(user.createdAt) < new Date('2025-01-01') },
      { id: 'consistent_player', name: 'Consistente', description: 'Registrou pontos por 7 dias seguidos', icon: '📅', condition: async () => await checkConsistency(username) },
      { id: 'night_owl', name: 'Coruja', description: 'Registrou pontos depois da meia-noite', icon: '🦉', condition: async () => await checkNightActivity(username) },
      { id: 'morning_bird', name: 'Madrugador', description: 'Registrou pontos antes das 6h', icon: '🌅', condition: async () => await checkMorningActivity(username) },
      
      // Conquistas Temáticas
      { id: 'henaldo_hunter', name: 'Caçador de Henaldo', description: 'Xingou o Henaldo 10 vezes', icon: '🎯', condition: async () => await checkSpecificReason(username, 'xingar-henaldo', 10) },
      { id: 'henaldo_novice', name: 'Aprendiz de Henaldo', description: 'Xingou o Henaldo pela primeira vez', icon: '😤', condition: async () => await checkSpecificReason(username, 'xingar-henaldo', 1) },
      { id: 'perfect_student', name: 'Aluno Exemplar', description: 'Tirou total em avaliação 5 vezes', icon: '📚', condition: async () => await checkSpecificReason(username, 'avaliacao-total', 5) },
      { id: 'first_perfect', name: 'Primeira Perfeição', description: 'Tirou sua primeira nota total', icon: '⭐', condition: async () => await checkSpecificReason(username, 'avaliacao-total', 1) },
      { id: 'helper', name: 'Colaborativo', description: 'Ajudou colegas 15 vezes', icon: '🤝', condition: async () => await checkSpecificReason(username, 'ajudar-colega', 15) },
      { id: 'first_helper', name: 'Primeira Ajuda', description: 'Ajudou um colega pela primeira vez', icon: '🤲', condition: async () => await checkSpecificReason(username, 'ajudar-colega', 1) },
      { id: 'expo_winner', name: 'Campeão da ExpoTech', description: 'Ganhou primeiro lugar na ExpoTech', icon: '🏆', condition: async () => await checkSpecificReason(username, 'primeiro-expotech', 1) },
      { id: 'expo_runner_up', name: 'Vice na ExpoTech', description: 'Ficou em segundo na ExpoTech', icon: '🥈', condition: async () => await checkSpecificReason(username, 'segundo-expotech', 1) },
      { id: 'expo_participant', name: 'Participante da ExpoTech', description: 'Participou da ExpoTech', icon: '🎪', condition: async () => await checkSpecificReason(username, 'participar-expotech', 1) },
      
      // Conquistas de Produtividade
      { id: 'bug_hunter', name: 'Caçador de Bugs', description: 'Corrigiu 10 bugs críticos', icon: '🐛', condition: async () => await checkSpecificReason(username, 'bug-fix', 10) },
      { id: 'first_bug_fix', name: 'Primeiro Bug Morto', description: 'Corrigiu seu primeiro bug', icon: '🔧', condition: async () => await checkSpecificReason(username, 'bug-fix', 1) },
      { id: 'feature_creator', name: 'Criador de Features', description: 'Implementou 5 novas funcionalidades', icon: '🚀', condition: async () => await checkSpecificReason(username, 'feature-nova', 5) },
      { id: 'optimizer', name: 'Otimizador', description: 'Otimizou performance 5 vezes', icon: '⚡', condition: async () => await checkSpecificReason(username, 'otimizacao', 5) },
      
      // Conquistas de Frequência
      { id: 'punctual_week', name: 'Semana Pontual', description: 'Chegou pontualmente por uma semana', icon: '⏰', condition: async () => await checkSpecificReason(username, 'chegada-pontual', 1) },
      { id: 'cleaner', name: 'Faxineiro', description: 'Limpou o laboratório 5 vezes', icon: '🧹', condition: async () => await checkSpecificReason(username, 'limpar-lab', 5) },
      { id: 'meme_master', name: 'Mestre dos Memes', description: 'Fez 10 memes engraçados', icon: '😂', condition: async () => await checkSpecificReason(username, 'meme-engracado', 10) },
    ]

    const userAchievements = user.achievements || []
    const newAchievements = []

    console.log(`🔍 Verificando conquistas para ${username} com ${user.totalPoints} pontos totais`)
    console.log(`📊 Conquistas atuais do usuário: ${userAchievements.length}`)
    
    for (const achievement of achievements) {
      const hasAchievement = userAchievements.find(a => a.id === achievement.id)
      if (!hasAchievement) {
        try {
          const conditionMet = typeof achievement.condition === 'function' 
            ? await achievement.condition() 
            : achievement.condition
            
          console.log(`🎯 Testando ${achievement.name} (${achievement.id}): ${conditionMet}`)
          
          if (conditionMet) {
            const newAchievement = {
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
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

async function checkSpecificReason(username: string, reasonId: string, count: number): Promise<boolean> {
  try {
    const history = await kv.get(`history:${username}`) || []
    // Contar tanto por reason (novo) quanto por reasonId para compatibilidade
    const reasonCount = history.filter(record => 
      record.reason === reasonId || 
      record.reasonId === reasonId ||
      (record.reason && record.reason.includes(reasonId))
    ).length
    
    console.log(`🔍 Verificando ${reasonId} para ${username}: ${reasonCount}/${count}`)
    return reasonCount >= count
  } catch (error) {
    console.error(`❌ Erro ao verificar reason ${reasonId} para ${username}:`, error)
    return false
  }
}

console.log('🚀 Servidor Sistemáticos de Plantão iniciado!')

Deno.serve(app.fetch)