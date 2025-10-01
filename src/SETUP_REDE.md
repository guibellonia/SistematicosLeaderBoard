# 🌐 Configuração para Rede Local (LAN)

## Como hospedar o sistema para seus amigos

### 1. Iniciar o servidor em modo de rede
```bash
# Se estiver usando Vite/React
npm run dev -- --host

# Se estiver usando Next.js
npm run dev -- -H 0.0.0.0

# Ou manualmente descobrir seu IP
ipconfig (Windows) / ifconfig (Mac/Linux)
```

### 2. Descobrir seu IP local
**Windows:**
```cmd
ipconfig
```
Procure por "Endereço IPv4" na seção WiFi ou Ethernet

**Mac/Linux:**
```bash
ifconfig
```

**Exemplo de IP:** `192.168.1.100`

### 3. Compartilhar o link
Se seu IP é `192.168.1.100` e a porta é `3000`:
```
http://192.168.1.100:3000
```

### 4. 🛡️ RESOLVER PROBLEMAS DE FIREWALL

#### Windows Firewall:
1. **Abrir Firewall do Windows:**
   - Windows + R → `wf.msc` → Enter
   - Ou: Painel de Controle → Sistema e Segurança → Firewall do Windows

2. **Criar regra de entrada:**
   ```
   Regras de Entrada → Nova Regra → Porta
   TCP → Porta específica: 3000 (ou sua porta)
   Permitir conexão → Todos os perfis → Nome: "Sistemáticos LAN"
   ```

3. **Alternativa rápida (Execute como Administrador):**
   ```cmd
   netsh advfirewall firewall add rule name="Sistemáticos LAN" dir=in action=allow protocol=TCP localport=3000
   ```

#### macOS Firewall:
1. **Preferências do Sistema → Segurança → Firewall → Opções**
2. **Adicionar aplicação do terminal/navegador**
3. **Ou desabilitar temporariamente o firewall**

#### Linux (Ubuntu/Debian):
```bash
# UFW (mais comum)
sudo ufw allow 3000
sudo ufw enable

# iptables (avançado)
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### 5. 🔧 DIAGNÓSTICO DE REDE

#### Testar conectividade do computador dos amigos:
```bash
# Testar se consegue "ver" seu PC
ping 192.168.1.100

# Testar se a porta está aberta (Windows)
telnet 192.168.1.100 3000

# Testar porta no PowerShell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

#### Verificar se o servidor está rodando:
```bash
# No seu computador, verificar se está ouvindo na porta
netstat -an | find "3000"     # Windows
netstat -an | grep 3000       # Mac/Linux
```

#### Passos de diagnóstico:
1. **✅ Teste local primeiro:** `http://localhost:3000`
2. **✅ Teste no seu celular:** `http://SEU_IP:3000` 
3. **❌ Se celular funciona mas PC dos amigos não:** É firewall!
4. **❌ Se nada funciona:** Problema na configuração de rede

### 6. 🚀 SOLUÇÕES ALTERNATIVAS

#### Usar porta diferente (menos bloqueada):
```bash
# Porta 8080 é menos restritiva
npm run dev -- --host --port 8080

# Ou porta 8000
npm run dev -- --host --port 8000

# Lembrar de atualizar o link: http://SEU_IP:8080
```

#### Desabilitar firewall temporariamente:
- **Windows:** Painel de Controle → Firewall → Ativar/Desativar
- **macOS:** Preferências → Segurança → Firewall → Desligar
- **⚠️ IMPORTANTE: Reativar depois do teste!**

#### Usar hotspot do celular:
Se a rede WiFi corporativa bloqueia:
1. Ativar hotspot no celular
2. Conectar todos os dispositivos no hotspot
3. Descobrir novo IP e compartilhar

#### Verificar isolamento de cliente no roteador:
Alguns roteadores têm "AP Isolation" ou "Client Isolation":
- Acessar configurações do roteador (192.168.1.1)
- Procurar por "AP Isolation" e desabilitar
- Ou usar cabo ethernet no computador host

### 7. ⚡ COMANDOS RÁPIDOS PARA EMERGÊNCIA

#### Windows (Execute como Administrador):
```cmd
REM Desabilitar firewall temporariamente
netsh advfirewall set allprofiles state off

REM Reabilitar firewall
netsh advfirewall set allprofiles state on

REM Verificar IP
ipconfig | findstr IPv4
```

#### Mac/Linux:
```bash
# Desabilitar firewall macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Verificar IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 8. 🆘 TROUBLESHOOTING COMMON

| Problema | Solução |
|----------|---------|
| "Não consegue conectar" | Verificar IP, porta e firewall |
| "Timeout" | Problema de rede ou firewall |
| "Funciona no celular mas não no PC" | Firewall específico do Windows |
| "Rede corporativa" | Usar hotspot ou porta alternativa |
| "Roteador bloqueia" | Desabilitar AP Isolation |

## Funcionalidades Multiplayer

✅ **Funcionam:**
- Cadastro independente de usuários
- Sistema de pontos individual
- Leaderboard em tempo real
- Persistência local por usuário

❌ **Não funcionam (por design):**
- Sincronização automática entre usuários
- Chat ou comunicação
- Backup centralizado

## Alternativas de Hospedagem

Para uso mais avançado, considere:
- **Vercel/Netlify:** Deploy gratuito online
- **GitHub Pages:** Hospedagem estática
- **Heroku:** Para versões com backend

---

💡 **Dica:** Use o botão "Rede LAN" no sidebar do sistema para ver essas instruções dentro da aplicação!

🔥 **Dica Pro:** Se nada funcionar, o comando mais rápido é desabilitar o firewall temporariamente para testar!