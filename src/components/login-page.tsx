import React, { useState } from 'react';
import { useAuthStore } from './auth-store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Target, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatus('');

    try {
      if (mode === 'login') {
        setStatus('Entrando...');
        
        const result = await login(username, password);
        if (!result.success) {
          setError(result.error || 'Erro ao fazer login');
        } else if ((result as any).wasAutoCreated) {
          toast.success('🎉 Bem-vindo! Sua conta foi criada automaticamente.', {
            description: 'Você pode começar a acumular pontos imediatamente!'
          });
        }
      } else {
        setStatus('Criando conta...');
        
        const result = await register(username, password, confirmPassword);
        if (!result.success) {
          setError(result.error || 'Erro ao criar conta');
        }
      }
    } catch (error: any) {
      setError('Erro inesperado. Tente novamente.');
      console.error('Erro no submit:', error);
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Sistemáticos de Plantão</CardTitle>
          <CardDescription>
            {mode === 'login' 
              ? 'Entre na plataforma gamificada de entretenimento'
              : 'Crie sua conta para começar a acumular pontos'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder={mode === 'login' ? 'seu_usuario' : 'escolha_um_usuario'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              {mode === 'register' && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 3 caracteres. Apenas letras, números e underscore.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres com pelo menos 1 letra e 1 número.
                </p>
              )}
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {status && (
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>{status}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (mode === 'login' ? 'Entrando...' : 'Criando conta...') 
                : (mode === 'login' ? 'Entrar' : 'Criar conta')
              }
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm"
            >
              {mode === 'login' 
                ? 'Não tem uma conta? Cadastre-se' 
                : 'Já tem uma conta? Faça login'
              }
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  );
};