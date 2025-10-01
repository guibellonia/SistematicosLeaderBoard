import React, { useState } from 'react';
import { SystemAPI } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, User, Shield } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const AuthTest: React.FC = () => {
  const [testCredentials, setTestCredentials] = useState({
    username: 'testuario',
    password: 'teste123'
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testUser, setTestUser] = useState<any>(null);

  const addResult = (test: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      test,
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setTestUser(null);
  };

  const runFullAuthTest = async () => {
    setIsRunning(true);
    clearResults();

    try {
      // Test 1: Check server status
      addResult('Server Status', 'info', 'Verificando status do servidor...');
      try {
        const statusResult = await SystemAPI.getStatus();
        if (statusResult.success) {
          addResult('Server Status', 'success', `Servidor online - ${statusResult.totalUsers} usuários`, statusResult);
        } else {
          addResult('Server Status', 'error', 'Servidor retornou erro');
        }
      } catch (error: any) {
        addResult('Server Status', 'error', `Erro de conexão: ${error.message}`);
      }

      // Test 2: Test public endpoints
      addResult('Public Endpoints', 'info', 'Testando endpoints públicos...');
      try {
        const leaderboardResult = await SystemAPI.getLeaderboard();
        if (leaderboardResult.success) {
          addResult('Leaderboard', 'success', `Leaderboard carregado - ${leaderboardResult.leaderboard.length} usuários`);
        } else {
          addResult('Leaderboard', 'error', 'Erro ao carregar leaderboard');
        }

        const usersResult = await SystemAPI.getUsers();
        if (usersResult.success) {
          addResult('Users List', 'success', `Lista de usuários carregada - ${usersResult.users.length} usuários`);
        } else {
          addResult('Users List', 'error', 'Erro ao carregar usuários');
        }

        const globalHistoryResult = await SystemAPI.getGlobalHistory(1, 5);
        if (globalHistoryResult.success) {
          addResult('Global History', 'success', `Histórico global carregado - ${globalHistoryResult.history.length} registros`);
        } else {
          addResult('Global History', 'error', 'Erro ao carregar histórico global');
        }
      } catch (error: any) {
        addResult('Public Endpoints', 'error', `Erro nos endpoints públicos: ${error.message}`);
      }

      // Test 3: User registration
      addResult('Registration', 'info', 'Testando cadastro de usuário...');
      try {
        const registerResult = await SystemAPI.register(testCredentials.username, testCredentials.password);
        if (registerResult.success) {
          addResult('Registration', 'success', 'Usuário cadastrado com sucesso', registerResult.user);
          setTestUser(registerResult.user);
          
          // Save session for authenticated tests
          sessionStorage.setItem('sistematics-session', JSON.stringify({
            userId: registerResult.user.id,
            username: registerResult.user.username,
            token: registerResult.token,
            loginTime: new Date().toISOString(),
            isActive: true
          }));
        } else {
          addResult('Registration', 'error', `Erro no cadastro: ${registerResult.error}`);
          
          // Try login if user already exists
          addResult('Login Fallback', 'info', 'Tentando login com usuário existente...');
          try {
            const loginResult = await SystemAPI.login(testCredentials.username, testCredentials.password);
            if (loginResult.success) {
              addResult('Login Fallback', 'success', 'Login realizado com sucesso', loginResult.user);
              setTestUser(loginResult.user);
              
              sessionStorage.setItem('sistematics-session', JSON.stringify({
                userId: loginResult.user.id,
                username: loginResult.user.username,
                token: loginResult.token,
                loginTime: new Date().toISOString(),
                isActive: true
              }));
            } else {
              addResult('Login Fallback', 'error', `Erro no login: ${loginResult.error}`);
            }
          } catch (loginError: any) {
            addResult('Login Fallback', 'error', `Erro no login: ${loginError.message}`);
          }
        }
      } catch (error: any) {
        addResult('Registration', 'error', `Erro no cadastro: ${error.message}`);
      }

      // Test 4: Authenticated endpoints (only if we have a user)
      if (testUser) {
        addResult('Authenticated Endpoints', 'info', 'Testando endpoints que requerem autenticação...');
        
        try {
          // Test adding points
          const addPointResult = await SystemAPI.addPoint(testUser.username, 'teste-sistema', 5);
          if (addPointResult.success) {
            addResult('Add Points', 'success', 'Ponto adicionado com sucesso', addPointResult);
          } else {
            addResult('Add Points', 'error', `Erro ao adicionar ponto: ${addPointResult.error}`);
          }
        } catch (error: any) {
          addResult('Add Points', 'error', `Erro ao adicionar ponto: ${error.message}`);
        }

        try {
          // Test getting user profile
          const profileResult = await SystemAPI.getUserProfile(testUser.username);
          if (profileResult.success) {
            addResult('User Profile', 'success', 'Perfil do usuário carregado', profileResult.user);
          } else {
            addResult('User Profile', 'error', `Erro ao carregar perfil: ${profileResult.error}`);
          }
        } catch (error: any) {
          addResult('User Profile', 'error', `Erro ao carregar perfil: ${error.message}`);
        }

        try {
          // Test getting user history
          const historyResult = await SystemAPI.getHistory(testUser.username, 1, 10);
          if (historyResult.success) {
            addResult('User History', 'success', `Histórico do usuário carregado - ${historyResult.history.length} registros`);
          } else {
            addResult('User History', 'error', `Erro ao carregar histórico: ${historyResult.error}`);
          }
        } catch (error: any) {
          addResult('User History', 'error', `Erro ao carregar histórico: ${error.message}`);
        }

        try {
          // Test getting achievements
          const achievementsResult = await SystemAPI.getAchievements(testUser.username);
          if (achievementsResult.success) {
            addResult('Achievements', 'success', `Conquistas carregadas - ${achievementsResult.achievements.length} conquistas`);
          } else {
            addResult('Achievements', 'error', `Erro ao carregar conquistas: ${achievementsResult.error}`);
          }
        } catch (error: any) {
          addResult('Achievements', 'error', `Erro ao carregar conquistas: ${error.message}`);
        }
      }

      addResult('Test Complete', 'success', 'Testes de autenticação concluídos!');
      toast.success('Testes concluídos!');

    } catch (error: any) {
      addResult('Fatal Error', 'error', `Erro fatal nos testes: ${error.message}`);
      toast.error('Erro fatal nos testes');
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Sucesso</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Teste de Autenticação
          </CardTitle>
          <CardDescription>
            Teste completo do sistema de autenticação e endpoints após as correções
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-username">Nome de usuário</Label>
              <Input
                id="test-username"
                value={testCredentials.username}
                onChange={(e) => setTestCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="testuario"
              />
            </div>
            <div>
              <Label htmlFor="test-password">Senha</Label>
              <Input
                id="test-password"
                type="password"
                value={testCredentials.password}
                onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="teste123"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runFullAuthTest} 
              disabled={isRunning}
              className="flex-1"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <User className="w-4 h-4 mr-2" />
              )}
              {isRunning ? 'Executando Testes...' : 'Executar Teste Completo'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearResults}
              disabled={isRunning}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>
              {testResults.filter(r => r.status === 'success').length} sucessos, {testResults.filter(r => r.status === 'error').length} erros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={result.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{result.test}</div>
                      <div className="text-sm text-muted-foreground mt-1">{result.message}</div>
                      {result.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer">Ver dados</summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {testUser && (
        <Card>
          <CardHeader>
            <CardTitle>Usuário de Teste</CardTitle>
            <CardDescription>Dados do usuário usado nos testes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>ID:</strong> {testUser.id}
              </div>
              <div>
                <strong>Username:</strong> {testUser.username}
              </div>
              <div>
                <strong>Pontos:</strong> {testUser.points || 0}
              </div>
              <div>
                <strong>Total:</strong> {testUser.totalPoints || 0}
              </div>
              <div>
                <strong>Rank:</strong> {testUser.rank || 'N/A'}
              </div>
              <div>
                <strong>Criado em:</strong> {testUser.createdAt ? new Date(testUser.createdAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};