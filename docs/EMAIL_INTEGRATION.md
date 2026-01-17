# Integração de Leitura Automática de Emails

Este documento descreve como configurar a leitura automática de emails para importar leads de portais imobiliários (ZAP Imóveis, OLX, Viva Real, etc.).

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Portal (ZAP)   │────▶│  Email (IMAP)   │────▶│    NFloor       │
│  Envia email    │     │  Caixa de entrada│     │  Processa lead  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```bash
# Configuração IMAP para leitura de emails
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=leads@suaimobiliaria.com
IMAP_PASSWORD=app_password_aqui
IMAP_FOLDER=INBOX
IMAP_TLS=true

# Intervalo de verificação em minutos
EMAIL_CHECK_INTERVAL=5

# Filtro de remetentes permitidos (separados por vírgula)
EMAIL_ALLOWED_SENDERS=noreply@zapimoveis.com.br,noreply@olx.com.br,noreply@vivareal.com.br
```

### 2. Configuração do Gmail

Para usar Gmail, você precisa criar uma **Senha de App**:

1. Acesse https://myaccount.google.com/security
2. Ative a **Verificação em duas etapas**
3. Vá em **Senhas de app**
4. Crie uma nova senha para "Email" > "Outro (nome personalizado)"
5. Use essa senha no `IMAP_PASSWORD`

### 3. Dependências Necessárias

```bash
npm install imap mailparser
npm install -D @types/imap @types/mailparser
```

## Implementação

### Estrutura de Arquivos

```
src/
├── lib/
│   └── email/
│       ├── index.ts           # Exports
│       ├── imap-client.ts     # Cliente IMAP
│       ├── parser.ts          # Parser de emails
│       └── parsers/
│           ├── zap-imoveis.ts # Parser específico ZAP
│           ├── olx.ts         # Parser específico OLX
│           └── viva-real.ts   # Parser específico Viva Real
├── app/
│   └── api/
│       └── email/
│           ├── check/route.ts # Endpoint para verificar emails
│           └── webhook/route.ts # Webhook para receber emails
└── jobs/
    └── email-checker.ts       # Job de verificação periódica
```

### Exemplo: Cliente IMAP

```typescript
// src/lib/email/imap-client.ts
import Imap from "imap";
import { simpleParser, ParsedMail } from "mailparser";

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  folder: string;
}

export class ImapEmailClient {
  private config: ImapConfig;
  
  constructor() {
    this.config = {
      host: process.env.IMAP_HOST || "imap.gmail.com",
      port: parseInt(process.env.IMAP_PORT || "993"),
      user: process.env.IMAP_USER || "",
      password: process.env.IMAP_PASSWORD || "",
      tls: process.env.IMAP_TLS === "true",
      folder: process.env.IMAP_FOLDER || "INBOX",
    };
  }

  async fetch_unread_emails(): Promise<ParsedMail[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
      });

      const emails: ParsedMail[] = [];

      imap.once("ready", () => {
        imap.openBox(this.config.folder, false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          imap.search(["UNSEEN"], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (!results.length) {
              imap.end();
              resolve([]);
              return;
            }

            const fetch = imap.fetch(results, { bodies: "" });

            fetch.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (!err) {
                    emails.push(parsed);
                  }
                });
              });
            });

            fetch.once("end", () => {
              imap.end();
              resolve(emails);
            });
          });
        });
      });

      imap.once("error", reject);
      imap.connect();
    });
  }
}
```

### Exemplo: Parser ZAP Imóveis

```typescript
// src/lib/email/parsers/zap-imoveis.ts
import { ParsedMail } from "mailparser";
import * as cheerio from "cheerio";

interface ParsedLead {
  name: string;
  email: string;
  phone: string;
  message: string;
  property_code: string;
  property_address: string;
  property_price: number;
  property_area: number;
  property_rooms: number;
  portal: string;
  raw_email: string;
}

export function parse_zap_email(email: ParsedMail): ParsedLead | null {
  const from = email.from?.text || "";
  
  if (!from.includes("zapimoveis.com.br")) {
    return null;
  }

  const html = email.html || "";
  const $ = cheerio.load(html);

  // Extrair dados do lead
  const name = $("td:contains('Nome:')").next().text().trim();
  const lead_email = $("td:contains('E-mail:')").next().text().trim();
  const phone = $("td:contains('Telefone:')").next().text().trim();
  const message = $("td:contains('Mensagem:')").next().text().trim();

  // Extrair dados do imóvel do assunto
  const subject = email.subject || "";
  const code_match = subject.match(/CÓD\.\s*(\w+)/i);
  const property_code = code_match ? code_match[1] : "";

  // Extrair endereço
  const address_match = subject.match(/imóvel em (.+?) CÓD/i);
  const property_address = address_match ? address_match[1] : "";

  // Extrair preço e características do HTML
  const price_text = $("td:contains('Valor:')").next().text().trim();
  const price_match = price_text.match(/[\d.,]+/);
  const property_price = price_match 
    ? parseFloat(price_match[0].replace(/\./g, "").replace(",", "."))
    : 0;

  const area_text = $("td:contains('Área:')").next().text().trim();
  const area_match = area_text.match(/(\d+)/);
  const property_area = area_match ? parseInt(area_match[1]) : 0;

  const rooms_text = $("td:contains('Quartos:')").next().text().trim();
  const rooms_match = rooms_text.match(/(\d+)/);
  const property_rooms = rooms_match ? parseInt(rooms_match[1]) : 0;

  return {
    name,
    email: lead_email,
    phone,
    message,
    property_code,
    property_address,
    property_price,
    property_area,
    property_rooms,
    portal: "ZAP Imóveis",
    raw_email: html,
  };
}
```

### Exemplo: API de Verificação

```typescript
// src/app/api/email/check/route.ts
import { NextResponse } from "next/server";
import { ImapEmailClient } from "@/lib/email/imap-client";
import { parse_zap_email } from "@/lib/email/parsers/zap-imoveis";
import { prisma } from "@/lib/prisma/client";

export async function POST() {
  try {
    const client = new ImapEmailClient();
    const emails = await client.fetch_unread_emails();
    
    const leads_created: string[] = [];

    for (const email of emails) {
      const parsed = parse_zap_email(email);
      
      if (parsed) {
        // Verificar se lead já existe
        const existing = await prisma.lead.findFirst({
          where: {
            OR: [
              { email: parsed.email },
              { phone: parsed.phone },
            ],
          },
        });

        if (!existing) {
          const lead = await prisma.lead.create({
            data: {
              name: parsed.name,
              email: parsed.email,
              phone: parsed.phone,
              status: "NEW",
              notes: `Portal: ${parsed.portal}\nImóvel: ${parsed.property_address}\nCódigo: ${parsed.property_code}\nPreço: R$ ${parsed.property_price}\nÁrea: ${parsed.property_area}m²\nQuartos: ${parsed.property_rooms}\n\nMensagem: ${parsed.message}`,
              // Atribuir ao vendedor de plantão ou usar round-robin
              seller_id: await get_next_seller_id(),
              company_id: process.env.DEFAULT_COMPANY_ID,
              area_id: process.env.DEFAULT_AREA_ID,
            },
          });
          
          leads_created.push(lead.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      emails_processed: emails.length,
      leads_created: leads_created.length,
    });
  } catch (error) {
    console.error("Erro ao verificar emails:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao processar emails" },
      { status: 500 }
    );
  }
}

async function get_next_seller_id(): Promise<string> {
  // Implementar round-robin ou plantão
  const seller = await prisma.user.findFirst({
    where: {
      access_level: "SELLER",
      status: "ACTIVE",
    },
    orderBy: {
      created_at: "asc",
    },
  });
  
  return seller?.id || "";
}
```

### Job de Verificação Periódica

```typescript
// src/jobs/email-checker.ts
// Para rodar com cron ou worker

import { ImapEmailClient } from "@/lib/email/imap-client";

const INTERVAL = parseInt(process.env.EMAIL_CHECK_INTERVAL || "5") * 60 * 1000;

async function check_emails() {
  console.log(`[${new Date().toISOString()}] Verificando emails...`);
  
  try {
    const response = await fetch(`${process.env.APP_URL}/api/email/check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
      },
    });
    
    const data = await response.json();
    console.log(`Processados: ${data.emails_processed}, Criados: ${data.leads_created}`);
  } catch (error) {
    console.error("Erro:", error);
  }
}

// Executar periodicamente
setInterval(check_emails, INTERVAL);
check_emails(); // Executar imediatamente
```

## Alternativa: Webhook com Serviço Externo

Se preferir não gerenciar IMAP, use serviços como:

- **Mailgun** - Roteamento de emails para webhook
- **SendGrid Inbound Parse** - Converte emails em requisições HTTP
- **Zapier** - Automação sem código

### Configuração SendGrid Inbound Parse

1. Configure um domínio no SendGrid
2. Adicione registro MX apontando para SendGrid
3. Configure o webhook para `https://seusite.com/api/email/webhook`

```typescript
// src/app/api/email/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  
  const from = formData.get("from") as string;
  const subject = formData.get("subject") as string;
  const html = formData.get("html") as string;
  
  // Processar email recebido
  // ...
  
  return NextResponse.json({ success: true });
}
```

## Portais Suportados

| Portal | Remetente | Status |
|--------|-----------|--------|
| ZAP Imóveis | noreply@zapimoveis.com.br | ✅ Implementado |
| OLX | noreply@olx.com.br | 🔄 Pendente |
| Viva Real | noreply@vivareal.com.br | 🔄 Pendente |
| Chaves na Mão | leads@chavesnamao.com.br | 🔄 Pendente |

## Testes

```bash
# Testar parser localmente
npm run test:email-parser

# Verificar emails manualmente
curl -X POST http://localhost:3000/api/email/check
```

## Troubleshooting

### Erro de Autenticação IMAP

- Verifique se a verificação em duas etapas está ativada
- Use uma Senha de App, não a senha normal
- Confirme que o acesso IMAP está habilitado no Gmail

### Emails não são marcados como lidos

- Verifique permissões de escrita na caixa
- Confirme que o `openBox` não está em modo read-only

### Lead duplicado

- O sistema verifica email e telefone antes de criar
- Ajuste a lógica de deduplicação conforme necessário
