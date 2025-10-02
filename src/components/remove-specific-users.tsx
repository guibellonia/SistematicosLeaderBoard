import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { SystemAPI } from '../utils/supabase/client';

export const RemoveSpecificUsers: React.FC = () => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [lastRemoval, setLastRemoval] = useState<string | null>(null);

  const handleRemoveUsers = async () => {
    if (!confirm('ATENÇÃO: Esta ação irá remover os usuários "teste123" e "mcqueen" do sistema. Confirma?')) {
      return;
    }

    setIsRemoving(true);
    try {
      console.log('🗑️ Iniciando remoção de usuários específicos...');
      
      const response = await fetch(`${SystemAPI.getBaseUrl()}/security/remove-admin-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SystemAPI.getAnonKey()}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`🗑️ Usuários removidos! ${result.removedAccounts} contas removidas`, {
          description: 'Os usuários teste123 e mcqueen foram removidos do sistema'
        });
        setLastRemoval(new Date().toLocaleString('pt-BR'));
        console.log('✅ Remoção de usuários específicos concluída:', result);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('❌ Erro na remoção de usuários:', error);
      toast.error('Erro na remoção de usuários', {
        description: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <Trash2 className="h-5 w-5" />
          Remover Usuários Específicos
        </CardTitle>
        <CardDescription>
          Remove os usuários "teste123" e "mcqueen" conforme solicitado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Remoção Solicitada:</strong> Os usuários "teste123" e "mcqueen" 
            serão removidos permanentemente do sistema junto com todos os seus dados.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Usuários que serão removidos:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• teste123</li>
            <li>• mcqueen</li>
          </ul>
        </div>

        {lastRemoval && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Última remoção: {lastRemoval}
          </div>
        )}

        <Button 
          onClick={handleRemoveUsers}
          disabled={isRemoving}
          variant="destructive"
          className="w-full"
        >
          {isRemoving ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Removendo usuários...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              REMOVER USUÁRIOS ESPECÍFICOS
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <strong>Nota:</strong> Esta ação remove os usuários especificados e todos os seus dados 
          (pontos, conquistas, histórico) permanentemente.
        </div>
      </CardContent>
    </Card>
  );
};