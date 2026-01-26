# Integração HubSpot - NFloor CRM

Este documento descreve como configurar e usar a integração bidirecional com o HubSpot.

## Visão Geral

A integração permite:
- **Importar** contatos do HubSpot como leads no NFloor
- **Exportar** leads do NFloor para o HubSpot
- **Sincronização bidirecional** para manter ambos os sistemas atualizados

## Configuração

### 1. Obter API Key do HubSpot

1. Acesse sua conta HubSpot em https://app.hubspot.com
2. Vá em **Settings** > **Integrations** > **Private Apps**
3. Clique em **Create a private app**
4. Dê um nome (ex: "NFloor CRM Integration")
5. Na aba **Scopes**, selecione:
   - `crm.objects.contacts.read`
   - `crm.objects.contacts.write`
6. Clique em **Create app** e copie o **Access Token**

### 2. Configurar no NFloor

1. Acesse **Configurações** > **Integrações**
2. Encontre a seção **HubSpot**
3. Cole a API Key
4. Clique em **Salvar**

### 3. Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Chave para criptografia de API keys (gerar com: openssl rand -hex 32)
ENCRYPTION_KEY=sua_chave_de_32_bytes_em_hex_aqui_64_caracteres
```

## Mapeamento de Campos

### HubSpot → NFloor

| HubSpot | NFloor |
|---------|--------|
| `email` | `email` |
| `firstname` | `first_name` |
| `lastname` | `last_name` |
| `phone` | `phone` |
| `company` | `company_name` |
| `jobtitle` | `job_title` |
| `website` | `website` |
| `lifecyclestage` | `status` (mapeado) |

### NFloor → HubSpot

| NFloor | HubSpot |
|--------|---------|
| `email` | `email` |
| `first_name` / `name` | `firstname` |
| `last_name` | `lastname` |
| `phone` | `phone` |
| `company_name` | `company` |
| `job_title` | `jobtitle` |
| `website` | `website` |
| `status` | `lifecyclestage` |

### Mapeamento de Status

| NFloor Status | HubSpot Lifecycle Stage |
|---------------|-------------------------|
| LEAD | `lead` |
| VISIT | `salesqualifiedlead` |
| CALLBACK | `salesqualifiedlead` |
| PROPOSAL | `opportunity` |
| SOLD | `customer` |

## API Endpoints

### GET /api/integrations/hubspot

Retorna informações da integração e logs de sincronização.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "integration": {
      "id": "...",
      "name": "HubSpot",
      "is_active": true,
      "last_sync_at": "2026-01-26T15:00:00Z",
      "sync_error": null
    },
    "sync_logs": [...]
  }
}
```

### POST /api/integrations/hubspot

Salva ou atualiza a configuração da integração.

**Body:**
```json
{
  "api_key": "pat-na1-xxxxxxxx",
  "name": "HubSpot Produção"
}
```

### POST /api/integrations/hubspot/sync

Executa a sincronização.

**Body:**
```json
{
  "direction": "import" | "export" | "bidirectional",
  "seller_id": "opcional - ID do vendedor para atribuir leads importados",
  "area_id": "opcional - ID da área para atribuir leads importados"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "import": {
      "records_processed": 150,
      "records_created": 45,
      "records_updated": 100,
      "records_failed": 5
    },
    "export": {
      "records_processed": 200,
      "records_created": 30,
      "records_updated": 170,
      "records_failed": 0
    }
  }
}
```

## Fontes de Leads

O sistema suporta múltiplas fontes de leads:

| Fonte | Descrição |
|-------|-----------|
| `EMAIL` | Lead capturado via email |
| `WHATSAPP` | Lead do WhatsApp |
| `BALCAO` | Atendimento presencial |
| `CRM` | Importado de outro CRM |
| `HUBSPOT` | Sincronizado do HubSpot |
| `ZAP_IMOVEIS` | Portal ZAP Imóveis |
| `OLX` | Portal OLX |
| `VIVA_REAL` | Portal Viva Real |
| `CHAVES_NA_MAO` | Portal Chaves na Mão |
| `WEBSITE` | Formulário do site |
| `INDICATION` | Indicação de cliente |
| `OTHER` | Outras fontes |

## Segurança

- As API keys são criptografadas com AES-256-GCM antes de armazenar
- Apenas usuários com nível Manager ou superior podem configurar integrações
- Logs de sincronização são mantidos para auditoria

## Troubleshooting

### Erro de Autenticação

- Verifique se a API key está correta
- Confirme que o Private App tem os scopes necessários
- Verifique se a app não foi revogada no HubSpot

### Leads não sincronizando

- Verifique se o lead tem email (campo obrigatório)
- Confirme que a integração está ativa
- Verifique os logs de sincronização para erros específicos

### Duplicatas

O sistema usa email como identificador único:
- Na importação: verifica `hubspot_id` e `email` para evitar duplicatas
- Na exportação: usa `email` como `idProperty` no HubSpot
