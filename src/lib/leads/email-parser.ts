import {
  ParsedEmailLead,
  LeadSource,
  OperationType,
} from "@/types/leads";

interface EmailParserResult {
  success: boolean;
  lead?: ParsedEmailLead;
  error?: string;
}

interface EmailData {
  from: string;
  subject: string;
  body: string;
  received_at: Date;
}

const SOURCE_PATTERNS: { source: LeadSource; from_patterns: RegExp[]; subject_patterns: RegExp[] }[] = [
  {
    source: LeadSource.ZAP_IMOVEIS,
    from_patterns: [/zapimoveis\.com\.br/i, /zap\s*im[óo]veis/i],
    subject_patterns: [/zap\s*im[óo]veis/i, /consulta.*im[óo]vel/i],
  },
  {
    source: LeadSource.VIVA_REAL,
    from_patterns: [/vivareal\.com\.br/i],
    subject_patterns: [/viva\s*real/i, /interesse.*im[óo]vel/i],
  },
  {
    source: LeadSource.OLX,
    from_patterns: [/olx\.com\.br/i],
    subject_patterns: [/olx/i, /novo\s*contato/i],
  },
  {
    source: LeadSource.IMOVEL_WEB,
    from_patterns: [/imovelweb\.com\.br/i],
    subject_patterns: [/im[óo]vel\s*web/i],
  },
  {
    source: LeadSource.QUINTO_ANDAR,
    from_patterns: [/quintoandar\.com\.br/i],
    subject_patterns: [/quinto\s*andar/i],
  },
  {
    source: LeadSource.CHAVES_NA_MAO,
    from_patterns: [/chavesnamao\.com\.br/i],
    subject_patterns: [/chaves\s*na\s*m[ãa]o/i],
  },
];

function detect_source(email: EmailData): LeadSource {
  for (const pattern of SOURCE_PATTERNS) {
    for (const from_regex of pattern.from_patterns) {
      if (from_regex.test(email.from)) {
        return pattern.source;
      }
    }
    for (const subject_regex of pattern.subject_patterns) {
      if (subject_regex.test(email.subject)) {
        return pattern.source;
      }
    }
  }
  return LeadSource.OTHER;
}

function detect_operation_type(text: string): OperationType {
  const lower = text.toLowerCase();
  if (lower.includes("venda") || lower.includes("compra") || lower.includes("comprar")) {
    return OperationType.SALE;
  }
  if (lower.includes("aluguel") || lower.includes("alugar") || lower.includes("locação")) {
    return OperationType.RENT;
  }
  return OperationType.SALE;
}

function extract_property_code(text: string): string {
  const patterns = [
    /C[ÓO]D\.?\s*([A-Z0-9_-]+)/i,
    /c[óo]digo[:\s]+([A-Z0-9_-]+)/i,
    /ref[:\s]+([A-Z0-9_-]+)/i,
    /id[:\s]+([A-Z0-9_-]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return "N/A";
}

function extract_address(subject: string, body: string): string {
  const address_patterns = [
    /im[óo]vel\s+em\s+([^-–]+)/i,
    /endere[çc]o[:\s]+([^\n]+)/i,
    /localiza[çc][ãa]o[:\s]+([^\n]+)/i,
    /rua\s+[^\n,]+/i,
    /av\.?\s+[^\n,]+/i,
    /avenida\s+[^\n,]+/i,
  ];
  
  const combined = `${subject} ${body}`;
  
  for (const pattern of address_patterns) {
    const match = combined.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0].trim();
    }
  }
  return "Endereço não informado";
}

function extract_name(body: string): string {
  const name_patterns = [
    /nome[:\s]+([^\n<]+)/i,
    /cliente[:\s]+([^\n<]+)/i,
    /interessado[:\s]+([^\n<]+)/i,
    /de[:\s]+([A-Z][a-zà-ú]+\s+[A-Z][a-zà-ú]+)/,
  ];
  
  for (const pattern of name_patterns) {
    const match = body.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return "Nome não informado";
}

function extract_phone(body: string): string | undefined {
  const phone_patterns = [
    /telefone[:\s]+([(\d)\s\-]+)/i,
    /celular[:\s]+([(\d)\s\-]+)/i,
    /whatsapp[:\s]+([(\d)\s\-]+)/i,
    /fone[:\s]+([(\d)\s\-]+)/i,
    /\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}/,
  ];
  
  for (const pattern of phone_patterns) {
    const match = body.match(pattern);
    if (match) {
      const phone = match[1]?.trim() || match[0].trim();
      return phone.replace(/[^\d]/g, "").replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
  }
  return undefined;
}

function extract_email(body: string): string | undefined {
  const email_pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = body.match(email_pattern);
  return match ? match[0] : undefined;
}

function extract_message(body: string): string | undefined {
  const message_patterns = [
    /mensagem[:\s]+([^\n]+(?:\n[^\n]+)*)/i,
    /coment[áa]rio[:\s]+([^\n]+(?:\n[^\n]+)*)/i,
    /observa[çc][ãa]o[:\s]+([^\n]+(?:\n[^\n]+)*)/i,
  ];
  
  for (const pattern of message_patterns) {
    const match = body.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 500);
    }
  }
  return undefined;
}

export function parse_email(email: EmailData): EmailParserResult {
  try {
    const source = detect_source(email);
    const operation_type = detect_operation_type(email.subject);
    const property_code = extract_property_code(email.subject + " " + email.body);
    const address = extract_address(email.subject, email.body);
    const name = extract_name(email.body);
    const phone = extract_phone(email.body);
    const lead_email = extract_email(email.body);
    const message = extract_message(email.body);
    
    const lead: ParsedEmailLead = {
      name,
      phone,
      email: lead_email,
      message,
      property: {
        code: property_code,
        address,
        operation_type,
      },
      source,
      received_at: email.received_at,
    };
    
    return { success: true, lead };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao processar email",
    };
  }
}

export function should_process_email(
  email: EmailData,
  filter_from: string[],
  filter_subject: string[]
): boolean {
  const from_lower = email.from.toLowerCase();
  const subject_lower = email.subject.toLowerCase();
  
  const from_match = filter_from.length === 0 || filter_from.some(f => from_lower.includes(f.toLowerCase()));
  const subject_match = filter_subject.length === 0 || filter_subject.some(s => subject_lower.includes(s.toLowerCase()));
  
  return from_match || subject_match;
}

export const DEFAULT_EMAIL_FILTERS = {
  from: [
    "zapimoveis.com.br",
    "vivareal.com.br",
    "olx.com.br",
    "imovelweb.com.br",
    "quintoandar.com.br",
    "chavesnamao.com.br",
  ],
  subject: [
    "consulta",
    "interesse",
    "imóvel",
    "imovel",
    "contato",
    "venda",
    "aluguel",
  ],
};
