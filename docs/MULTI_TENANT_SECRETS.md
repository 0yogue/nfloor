# Armazenamento Multi-Tenant de Chaves de API

Este documento descreve a melhor abordagem para armazenar e usar chaves de API (como `EVOLUTION_API_KEY`) em um SaaS CRM multi-tenant.

## Arquitetura Recomendada

### Opção 1: Tabela de Configurações por Empresa (Recomendado)

Armazenar as chaves criptografadas no banco de dados, vinculadas à empresa.

```prisma
// prisma/schema.prisma

model CompanySettings {
  id                    String   @id @default(cuid())
  company_id            String   @unique
  company               Company  @relation(fields: [company_id], references: [id])
  
  // Chaves de API criptografadas
  evolution_api_key     String?  @db.Text
  evolution_api_url     String?
  whatsapp_instance_id  String?
  
  // Outras integrações
  smtp_host             String?
  smtp_port             Int?
  smtp_user             String?
  smtp_password         String?  @db.Text
  
  // Configurações gerais
  lead_auto_assignment  Boolean  @default(true)
  working_hours_start   Int      @default(8)
  working_hours_end     Int      @default(18)
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
}
```

### Implementação

#### 1. Serviço de Criptografia

```typescript
// src/lib/crypto/encryption.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function get_encryption_key(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, get_encryption_key(), iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag();
  
  // Formato: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted_text: string): string {
  const [iv_hex, tag_hex, encrypted] = encrypted_text.split(":");
  
  const iv = Buffer.from(iv_hex, "hex");
  const tag = Buffer.from(tag_hex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, get_encryption_key(), iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

#### 2. Serviço de Configurações da Empresa

```typescript
// src/lib/settings/company-settings.ts
import { prisma } from "@/lib/prisma/client";
import { encrypt, decrypt } from "@/lib/crypto/encryption";

interface EvolutionConfig {
  api_key: string;
  api_url: string;
  instance_id: string;
}

export async function get_evolution_config(company_id: string): Promise<EvolutionConfig | null> {
  const settings = await prisma.companySettings.findUnique({
    where: { company_id },
  });

  if (!settings?.evolution_api_key) {
    return null;
  }

  return {
    api_key: decrypt(settings.evolution_api_key),
    api_url: settings.evolution_api_url || "https://api.evolution.com",
    instance_id: settings.whatsapp_instance_id || "",
  };
}

export async function save_evolution_config(
  company_id: string,
  config: EvolutionConfig
): Promise<void> {
  await prisma.companySettings.upsert({
    where: { company_id },
    create: {
      company_id,
      evolution_api_key: encrypt(config.api_key),
      evolution_api_url: config.api_url,
      whatsapp_instance_id: config.instance_id,
    },
    update: {
      evolution_api_key: encrypt(config.api_key),
      evolution_api_url: config.api_url,
      whatsapp_instance_id: config.instance_id,
    },
  });
}
```

#### 3. Uso no Cliente Evolution

```typescript
// src/lib/evolution/client.ts
import { get_evolution_config } from "@/lib/settings/company-settings";

export class EvolutionClient {
  private api_key: string;
  private api_url: string;
  private instance_id: string;

  private constructor(config: { api_key: string; api_url: string; instance_id: string }) {
    this.api_key = config.api_key;
    this.api_url = config.api_url;
    this.instance_id = config.instance_id;
  }

  static async for_company(company_id: string): Promise<EvolutionClient | null> {
    const config = await get_evolution_config(company_id);
    if (!config) return null;
    return new EvolutionClient(config);
  }

  async send_message(phone: string, message: string): Promise<boolean> {
    const response = await fetch(`${this.api_url}/message/sendText/${this.instance_id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": this.api_key,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    });

    return response.ok;
  }

  async get_qr_code(): Promise<string | null> {
    const response = await fetch(`${this.api_url}/instance/connect/${this.instance_id}`, {
      headers: { "apikey": this.api_key },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.qrcode?.base64 || null;
  }
}
```

#### 4. API para Configuração

```typescript
// src/app/api/settings/evolution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { get_session_user } from "@/lib/auth/session";
import { get_evolution_config, save_evolution_config } from "@/lib/settings/company-settings";
import { is_manager_or_higher } from "@/lib/rbac/permissions";

export async function GET() {
  const user = await get_session_user();
  if (!user || !is_manager_or_higher(user.access_level)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const config = await get_evolution_config(user.company_id);
  
  return NextResponse.json({
    success: true,
    data: config ? {
      api_url: config.api_url,
      instance_id: config.instance_id,
      has_api_key: true,
    } : null,
  });
}

export async function POST(request: NextRequest) {
  const user = await get_session_user();
  if (!user || !is_manager_or_higher(user.access_level)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { api_key, api_url, instance_id } = body;

  if (!api_key || !api_url || !instance_id) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  await save_evolution_config(user.company_id, { api_key, api_url, instance_id });

  return NextResponse.json({ success: true });
}
```

## Variáveis de Ambiente Necessárias

```bash
# .env
# Chave de criptografia (gerar com: openssl rand -hex 32)
ENCRYPTION_KEY=sua_chave_de_32_bytes_em_hex_aqui_64_caracteres
```

**Gerar nova chave:**
```bash
openssl rand -hex 32
```

## Segurança

### Boas Práticas

1. **Nunca exponha chaves no frontend** - Todas as chamadas à Evolution API devem passar pelo backend
2. **Criptografia em repouso** - Todas as chaves são criptografadas com AES-256-GCM
3. **Acesso restrito** - Apenas managers+ podem configurar integrações
4. **Auditoria** - Log de alterações nas configurações
5. **Rotação de chaves** - Suporte para rotação da `ENCRYPTION_KEY`

### Rotação de Chaves

```typescript
// scripts/rotate-encryption-key.ts
import { prisma } from "@/lib/prisma/client";

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY!;
const NEW_KEY = process.env.ENCRYPTION_KEY!;

async function rotate_keys() {
  const settings = await prisma.companySettings.findMany();
  
  for (const setting of settings) {
    if (setting.evolution_api_key) {
      // Descriptografar com chave antiga
      const decrypted = decrypt_with_key(setting.evolution_api_key, OLD_KEY);
      // Criptografar com chave nova
      const encrypted = encrypt_with_key(decrypted, NEW_KEY);
      
      await prisma.companySettings.update({
        where: { id: setting.id },
        data: { evolution_api_key: encrypted },
      });
    }
  }
}
```

## Comparativo de Abordagens

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **Banco + Criptografia** ✅ | Flexível, cada empresa configura a sua | Requer gerenciamento de chave mestra |
| Variáveis de Ambiente | Simples | Não escala para multi-tenant |
| Vault (HashiCorp) | Muito seguro, auditoria | Complexidade, custo |
| AWS Secrets Manager | Gerenciado, seguro | Vendor lock-in, custo |

## Implementação Mínima

Para começar rapidamente:

1. Adicione a migration do `CompanySettings`
2. Configure `ENCRYPTION_KEY` no `.env`
3. Use `get_evolution_config(company_id)` onde precisar da API

```typescript
// Exemplo de uso em qualquer lugar do código
const client = await EvolutionClient.for_company(user.company_id);
if (client) {
  await client.send_message(lead.phone, "Olá! Como posso ajudar?");
}
```
