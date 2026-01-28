# Integração WhatsApp via Evolution API

Este documento descreve a configuração e uso da integração com WhatsApp utilizando a Evolution API.

## Pré-requisitos

1. **Evolution API** rodando e acessível
   - Desenvolvimento: `http://localhost:8080`
   - Produção: `http://whatsapp.fluxos.co`

2. **API Key** da Evolution API configurada

## Configuração

### Variáveis de Ambiente

Adicione ao seu `.env` ou `.env.local`:

```bash
# Evolution API - WhatsApp Integration
EVOLUTION_API_URL="http://localhost:8080"        # ou http://whatsapp.fluxos.co em produção
EVOLUTION_API_KEY="sua-api-key-aqui"
EVOLUTION_INSTANCE_NAME="nfloor_whatsapp"        # nome base da instância

# Necessário para webhook
NEXT_PUBLIC_APP_URL="http://localhost:3000"      # ou https://seu-dominio.com em produção
```

### Nome da Instância

O sistema usa o padrão `{EVOLUTION_INSTANCE_NAME}_{company_id}` para criar instâncias por empresa.  
Exemplo: `nfloor_whatsapp_cm5xyz123`

## Funcionalidades

### 1. Conexão via QR Code

Acesse `/integrations` ou `/settings/integrations` e:

1. Clique em **"Criar Instância"** (primeira vez)
2. Clique em **"Conectar"** para gerar o QR Code
3. Escaneie com o WhatsApp do celular

### 2. Sincronização de Conversas

Após conectado, clique em **"Sincronizar Conversas"** para:

- Importar todos os chats do WhatsApp
- Criar `Lead` automaticamente para novos contatos (source: `WHATSAPP`)
- Criar `Conversation` vinculando Lead ao Vendedor
- Importar histórico de `Message`

**Atribuição de Leads:** Round-robin entre vendedores ativos da empresa.

### 3. Webhook para Mensagens em Tempo Real

Após conectado, clique em **"Configurar Webhook"** para ativar o recebimento de mensagens em tempo real.

**URL do Webhook:** `{NEXT_PUBLIC_APP_URL}/api/integrations/whatsapp/webhook`

O webhook processa:
- `MESSAGES_UPSERT` - Novas mensagens (salva no banco, cria Lead se necessário)
- `CONNECTION_UPDATE` - Mudanças de status da conexão
- `QRCODE_UPDATED` - Atualização do QR Code

### 4. Envio de Mensagens

```typescript
// Via API
POST /api/integrations/whatsapp
{
  "action": "send_message",
  "phone": "5511999999999",
  "message": "Olá! Como posso ajudar?"
}
```

## Arquitetura

```
src/
├── lib/integrations/
│   ├── evolution-api.ts      # Cliente da Evolution API
│   ├── whatsapp-sync.ts      # Sincronização de chats/mensagens
│   └── index.ts              # Exports
├── app/api/integrations/whatsapp/
│   ├── route.ts              # Endpoints principais
│   └── webhook/route.ts      # Receptor de webhooks
└── components/integrations/
    └── whatsapp-connection.tsx  # UI de conexão
```

## Endpoints da API

| Método | Endpoint | Ação |
|--------|----------|------|
| GET | `/api/integrations/whatsapp` | Status da conexão |
| POST | `/api/integrations/whatsapp` | Ações (ver abaixo) |
| POST | `/api/integrations/whatsapp/webhook` | Receptor de webhooks |

### Ações disponíveis (POST)

| action | Descrição |
|--------|-----------|
| `create` | Criar nova instância |
| `connect` | Obter QR Code para conexão |
| `disconnect` | Desconectar (logout) |
| `delete` | Deletar instância |
| `sync` | Sincronizar conversas do WhatsApp |
| `set_webhook` | Configurar webhook na Evolution API |
| `send_message` | Enviar mensagem (requer `phone` e `message`) |

## Fluxo de Dados

```
WhatsApp → Evolution API → Webhook NFloor → Database
                                ↓
                          Lead (round-robin)
                                ↓
                          Conversation
                                ↓
                          Message
```

## Modelos de Dados

### Lead (criado automaticamente)
- `source`: `WHATSAPP`
- `phone`: número formatado
- `name`: nome do contato ou telefone formatado
- `seller_id`: vendedor via round-robin

### Conversation
- `whatsapp_chat_id`: JID do WhatsApp (`5511999999999@s.whatsapp.net`)
- `status`: `ACTIVE` ou `WAITING_RESPONSE`
- `last_message_at`, `last_seller_message`, `last_lead_message`

### Message
- `whatsapp_id`: ID único da mensagem no WhatsApp
- `sender_type`: `SELLER` ou `LEAD`
- `content`: texto da mensagem

## Deploy em Produção

### 1. Configurar variáveis

```bash
EVOLUTION_API_URL="http://whatsapp.fluxos.co"
EVOLUTION_API_KEY="sua-api-key-producao"
EVOLUTION_INSTANCE_NAME="nfloor_whatsapp"
NEXT_PUBLIC_APP_URL="https://seu-dominio-nfloor.com"
```

### 2. Garantir que o webhook seja acessível

A Evolution API precisa conseguir fazer POST para:
```
https://seu-dominio-nfloor.com/api/integrations/whatsapp/webhook
```

### 3. Configurar webhook após conexão

Na UI de integração, clique em "Configurar Webhook" após conectar a instância.

## Troubleshooting

### Webhook não recebe mensagens
1. Verifique se `NEXT_PUBLIC_APP_URL` está correto
2. Verifique se a URL é acessível externamente
3. Confira os logs da Evolution API

### Erro "Evolution API não configurada"
- Verifique se `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` estão no `.env`
- Reinicie o servidor após alterar variáveis

### QR Code não aparece
- A instância pode já estar conectada
- Tente "Desconectar" e depois "Conectar" novamente

### Lead não é criado
- Verifique se há vendedores ativos na empresa
- Confira logs do webhook para erros

## Limitações Atuais

- Apenas mensagens de texto são sincronizadas (imagens/áudios são ignorados)
- Grupos são ignorados (apenas chats individuais)
- Não há suporte a múltiplas instâncias por empresa (1:1)

## Próximos Passos (Roadmap)

- [ ] Suporte a mídia (imagens, áudios, documentos)
- [ ] Templates de mensagem
- [ ] Automações/respostas automáticas
- [ ] Dashboard de métricas de WhatsApp
- [ ] Histórico de conexões/desconexões
