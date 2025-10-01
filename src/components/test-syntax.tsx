// Arquivo de teste para verificar sintaxe
import React from 'react';
import { useAuthStore } from './auth-store';
import { Leaderboard } from './leaderboard';
import { Dashboard } from './dashboard';

// Teste básico para verificar se os componentes compilam
export const TestComponent: React.FC = () => {
  const store = useAuthStore();
  
  return (
    <div>
      <p>Test Component - Syntax Check</p>
      <p>Store state: {store.isAuthenticated ? 'Auth' : 'Not Auth'}</p>
    </div>
  );
};

export default TestComponent;