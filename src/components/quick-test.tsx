import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SystemAPI, supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

export const QuickTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    console.log(message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCompleteFlow = async () => {
    setIsLoading(true);
    setResults([]);
    
    const testUser = `test${Date.now()}`;
    const testPass = 'test123';
    
    addResult(`🧪 Testando fluxo completo com ${testUser}/${testPass}`);
    
    try {
      // 1. Tentar criar usuário
      addResult('📝 Passo 1: Criando usuário via servidor...');
      const registerResult = await SystemAPI.register(testUser, testPass);
      addResult(`📝 Resultado: ${registerResult.success ? 'Sucesso' : 'Falha'} - ${registerResult.message || registerResult.error}`);
      
      if (registerResult.success) {
        // 2. Aguardar um pouco
        addResult('⏳ Aguardando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Tentar login
        addResult('🔑 Passo 2: Tentando login no Supabase...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${testUser}@sistematics.local`,
          password: testPass,
        });
        
        if (error) {
          addResult(`❌ Erro no login: ${error.message}`);
        } else {
          addResult(`✅ Login bem-sucedido! User ID: ${data.user?.id}`);
          
          // 4. Fazer logout
          addResult('🚪 Fazendo logout...');
          await supabase.auth.signOut();
          addResult('✅ Logout completo');
          
          toast.success('🎉 Teste bem-sucedido!', {
            description: 'O sistema de autenticação está funcionando.'
          });
        }
      } else {
        addResult(`❌ Falha na criação: ${registerResult.error}`);
        toast.error('❌ Teste falhou', {
          description: 'Erro na criação do usuário.'
        });
      }
    } catch (error: any) {
      addResult(`💥 Erro geral: ${error.message}`);
      toast.error('💥 Erro no teste', {
        description: error.message
      });
    }
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Teste Rápido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={testCompleteFlow} 
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? 'Testando...' : '🧪 Testar Sistema'}
        </Button>
        
        {results.length > 0 && (
          <div className="bg-muted p-3 rounded text-xs max-h-32 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="mb-1 font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};