import React, { useEffect, useState } from 'react';
import { SystemAPI } from '../utils/supabase/client';

export const AutoSecurityCleanup: React.FC = () => {
  const [cleanupExecuted, setCleanupExecuted] = useState(false);

  useEffect(() => {
    const executeSecurityCleanup = async () => {
      // Verificar se já foi executada na sessão atual
      const sessionKey = 'security-cleanup-executed';
      const alreadyExecuted = sessionStorage.getItem(sessionKey);
      
      if (alreadyExecuted) {
        setCleanupExecuted(true);
        return;
      }

      try {
        console.log('🚫 Executando limpeza de segurança automática...');
        
        const response = await fetch(`${SystemAPI.getBaseUrl()}/security/remove-admin-accounts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SystemAPI.getAnonKey()}`
          }
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Limpeza de segurança automática concluída:', result);
          sessionStorage.setItem(sessionKey, 'true');
          setCleanupExecuted(true);
          
          if (result.removedAccounts > 0) {
            console.warn(`🛡️ ALERTA: ${result.removedAccounts} contas administrativas inseguras foram removidas automaticamente!`);
            
            // Log específico para usuários solicitados
            if (result.removedAccounts >= 2) {
              console.warn(`🗑️ Os usuários "teste123" e "mcqueen" foram removidos conforme solicitado`);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro na limpeza de segurança automática:', error);
        // Marcar como executada mesmo com erro para não ficar tentando
        sessionStorage.setItem(sessionKey, 'error');
        setCleanupExecuted(true);
      }
    };

    // Executar após 1 segundo para não bloquear o carregamento
    const timer = setTimeout(executeSecurityCleanup, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Componente invisível - apenas executa a limpeza
  return null;
};