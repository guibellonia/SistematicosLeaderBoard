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

### 4. Verificar conectividade
- Todos devem estar na mesma rede WiFi
- Testar o link em outro dispositivo primeiro
- Verificar se o firewall não está bloqueando

### 5. Dicas importantes
- **Firewall:** Pode ser necessário adicionar exceção
- **Redes corporativas:** Podem bloquear esse tipo de conexão
- **Router:** Alguns roteadores bloqueam comunicação entre dispositivos
- **Dados:** O sistema salva tudo localmente no navegador de cada usuário

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