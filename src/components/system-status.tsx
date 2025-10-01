import React, { useEffect, useState } from 'react';
import { SystemAPI } from '../utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EndpointStatus {
  name: string;
  endpoint: string;
  status: 'success' | 'error' | 'loading';
  message?: string;
  responseTime?: number;
  requiresAuth?: boolean;
}

export const SystemStatus: React.FC = () => {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: 'Status', endpoint: '/status', status: 'loading', requiresAuth: false },
    { name: 'Leaderboard', endpoint: '/leaderboard', status: 'loading', requiresAuth: false },
    { name: 'Usuários', endpoint: '/users', status: 'loading', requiresAuth: false },
    { name: 'Histórico Global', endpoint: '/history/global/recent', status: 'loading', requiresAuth: false },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const testEndpoint = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (endpoint.endpoint) {
        case '/status':
          result = await SystemAPI.getStatus();
          break;
        case '/leaderboard':
          result = await SystemAPI.getLeaderboard();
          break;
        case '/users':
          result = await SystemAPI.getUsers();
          break;
        case '/history/global/recent':
          result = await SystemAPI.getGlobalHistory(1, 5);
          break;
        default:
          throw new Error('Endpoint não implementado');
      }
      
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        return {
          ...endpoint,
          status: 'success',
          message: 'OK',
          responseTime
        };
      } else {
        return {
          ...endpoint,
          status: 'error',
          message: result.error || 'Erro desconhecido',
          responseTime
        };
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      return {
        ...endpoint,
        status: 'error',
        message: error.message || 'Erro de conexão',
        responseTime
      };
    }
  };

  const runTests = async () => {
    setIsRefreshing(true);
    
    const updatedEndpoints = [];
    
    for (const endpoint of endpoints) {
      setEndpoints(prev => 
        prev.map(e => 
          e.endpoint === endpoint.endpoint 
            ? { ...e, status: 'loading' as const } 
            : e
        )
      );
      
      const result = await testEndpoint(endpoint);
      updatedEndpoints.push(result);
      
      setEndpoints(prev => 
        prev.map(e => 
          e.endpoint === endpoint.endpoint 
            ? result 
            : e
        )
      );
    }
    
    setIsRefreshing(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'loading':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: EndpointStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      case 'loading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Testando</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const successCount = endpoints.filter(e => e.status === 'success').length;
  const totalCount = endpoints.length;
  const allOnline = successCount === totalCount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {allOnline ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Verificação dos endpoints públicos ({successCount}/{totalCount} online)
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runTests}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div key={endpoint.endpoint} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(endpoint.status)}
                <div>
                  <div className="font-medium">{endpoint.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {endpoint.endpoint}
                    {endpoint.requiresAuth && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                        Auth Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {endpoint.responseTime && (
                  <span className="text-xs text-muted-foreground">
                    {endpoint.responseTime}ms
                  </span>
                )}
                {getStatusBadge(endpoint.status)}
              </div>
            </div>
          ))}
          
          {endpoints.some(e => e.status === 'error') && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Erros Detectados:</h4>
              <div className="space-y-1">
                {endpoints
                  .filter(e => e.status === 'error')
                  .map(endpoint => (
                    <div key={endpoint.endpoint} className="text-sm text-red-700">
                      <span className="font-medium">{endpoint.name}:</span> {endpoint.message}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};