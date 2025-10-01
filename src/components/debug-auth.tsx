import React, { useState } from 'react';
import { supabase, SystemAPI } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const DebugAuth: React.FC = () => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('testpass123');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCreateUser = async () => {
    setIsLoading(true);
    addResult('🧪 Iniciando teste de criação de usuário...');
    
    try {
      // 1. Tentar registrar via servidor
      addResult(`📝 Criando usuário via servidor: ${username}`);
      const registerResponse = await SystemAPI.register(username, password);
      
      if (registerResponse.success) {
        addResult(`✅ Usuário criado no servidor: ${registerResponse.user?.username}`);
        
        // 2. Verificar se pode fazer login
        addResult(`🔑 Testando login após criação...`);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username}@sistematics.local`,
          password: password,
        });
        
        if (error) {
          addResult(`❌ Erro no login: ${error.message}`);
        } else {
          addResult(`✅ Login bem-sucedido! User ID: ${data.user?.id}`);
          
          // Fazer logout para limpar
          await supabase.auth.signOut();
          addResult(`🚪 Logout feito para limpeza`);
        }
      } else {
        addResult(`❌ Falha na criação: ${registerResponse.error}`);
      }
    } catch (error: any) {
      addResult(`💥 Erro geral: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const testListUsers = async () => {
    setIsLoading(true);
    addResult('🔍 Testando listagem de usuários...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      addResult(`📱 Sessão atual: ${session ? 'ativa' : 'nenhuma'}`);
      
      const usersResponse = await SystemAPI.getUsers();
      addResult(`👥 Usuários encontrados: ${JSON.stringify(usersResponse, null, 2)}`);
    } catch (error: any) {
      addResult(`💥 Erro: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Debug de Autenticação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testCreateUser} disabled={isLoading}>
            🧪 Criar e Testar Usuário
          </Button>
          <Button onClick={testListUsers} disabled={isLoading} variant="outline">
            👥 Listar Usuários
          </Button>
          <Button onClick={clearResults} variant="outline">
            🗑️ Limpar
          </Button>
        </div>
        
        <div className="bg-muted p-4 rounded-lg max-h-80 overflow-y-auto">
          <h3 className="font-medium mb-2">Resultados do Teste:</h3>
          {results.length === 0 ? (
            <p className="text-muted-foreground">Nenhum teste executado ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <li key={index} className="whitespace-pre-wrap">
                  {result}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};