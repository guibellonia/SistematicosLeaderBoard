import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Copy, Wifi, Users, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface NetworkInfoProps {
  onClose?: () => void;
}

export const NetworkInfo: React.FC<NetworkInfoProps> = ({ onClose }) => {
  const [localIP, setLocalIP] = useState<string>('');
  const [currentURL, setCurrentURL] = useState<string>('');

  useEffect(() => {
    // Detectar URL atual
    setCurrentURL(window.location.origin);
    
    // Tentar detectar IP local (isso só funciona em desenvolvimento)
    const detectLocalIP = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Em desenvolvimento, sugerir alguns IPs comuns
        setLocalIP('192.168.1.xxx');
      } else {
        setLocalIP(hostname);
      }
    };
    
    detectLocalIP();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado para a área de transferência!`);
    }).catch(() => {
      toast.error('Erro ao copiar. Selecione e copie manualmente.');
    });
  };

  const steps = [
    {
      number: 1,
      title: "Descobrir seu IP local",
      description: "No Windows: abra o Prompt de Comando e digite 'ipconfig'. Procure por 'IPv4' na seção WiFi/Ethernet.",
      command: "ipconfig"
    },
    {
      number: 2,
      title: "Compartilhar o link",
      description: "Substitua 'localhost' pelo seu IP local e compartilhe com seus amigos.",
      example: `http://${localIP}:3000` // ou a porta que estiver usando
    },
    {
      number: 3,
      title: "Certificar-se da rede",
      description: "Todos devem estar na mesma rede WiFi/LAN para conseguir acessar.",
      tip: "Verifique se o firewall não está bloqueando a conexão."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-primary" />
              <CardTitle>Compartilhar em Rede Local (LAN)</CardTitle>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
          <CardDescription>
            Configure para que seus amigos acessem o sistema na mesma rede
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* URL Atual */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">URL Atual:</p>
                <p className="text-sm text-muted-foreground font-mono">{currentURL}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(currentURL, 'URL atual')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Passos */}
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  
                  {step.command && (
                    <div className="mt-2 p-2 bg-black text-green-400 rounded font-mono text-sm">
                      $ {step.command}
                    </div>
                  )}
                  
                  {step.example && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm">{step.example}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(step.example, 'URL de exemplo')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {step.tip && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-700">{step.tip}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dicas Adicionais */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">💡 Dicas Importantes:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Certifique-se de que todos estão na mesma rede WiFi</li>
              <li>• O firewall pode bloquear conexões - adicione exceção se necessário</li>
              <li>• Em redes corporativas, pode ser necessário permissão do administrador</li>
              <li>• Teste primeiro com um dispositivo próprio antes de compartilhar</li>
            </ul>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm">Sistema pronto para múltiplos usuários!</span>
            <Badge variant="secondary">Multiplayer</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};