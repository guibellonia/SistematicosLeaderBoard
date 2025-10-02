import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SystemAPI } from '../utils/supabase/client';

export const SecurityCleanup: React.FC = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

  const handleSecurityCleanup = async () => {
    if (!confirm('ATENÇÃO: Esta ação irá remover TODAS as contas administrativas inseguras (admin, test, etc.) do sistema. Confirma?')) {
      return;
    }

    setIsClearing(true);
    try {
      console.log('🚫 Iniciando limpeza de segurança...');
      
      const response = await fetch(`${SystemAPI.getBaseUrl()}/security/remove-admin-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SystemAPI.getAnonKey()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`🛡️ Segurança reforçada! ${result.removedAccounts} contas inseguras removidas`, {
          description: 'O sistema agora está mais seguro'
        });
        setLastCleanup(new Date().toLocaleString('pt-BR'));
        console.log('✅ Limpeza de segurança concluída:', result);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('❌ Erro na limpeza de segurança:', error);
      toast.error('Erro na limpeza de segurança', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Shield className="h-5 w-5" />
          Limpeza de Segurança URGENTE
        </CardTitle>
        <CardDescription>
          Remove contas administrativas inseguras do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ALERTA DE SEGURANÇA:</strong> Foram detectadas possíveis contas administrativas 
            inseguras no sistema (admin, test, etc.). Esta ferramenta remove essas contas 
            imediatamente para proteger o sistema.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Contas que serão removidas:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• admin / administrator</li>
            <li>• test / demo / guest</li>
            <li>• root / user</li>
            <li>• Outras contas administrativas padrão</li>
          </ul>
        </div>

        {lastCleanup && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Última limpeza: {lastCleanup}
          </div>
        )}

        <Button 
          onClick={handleSecurityCleanup}
          disabled={isClearing}
          variant="destructive"
          className="w-full"
        >
          {isClearing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Removendo contas inseguras...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              EXECUTAR LIMPEZA DE SEGURANÇA
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <strong>Nota:</strong> Esta ação é irreversível e essencial para a segurança do sistema.
          Execute imediatamente se detectar contas administrativas não autorizadas.
        </div>
      </CardContent>
    </Card>
  );
};