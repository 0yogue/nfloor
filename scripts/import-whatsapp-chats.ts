/**
 * Script para importar conversas do WhatsApp exportadas (.zip)
 * Formato: DD/MM/YYYY HH:MM - Nome: Mensagem
 * 
 * Uso: npx tsx scripts/import-whatsapp-chats.ts
 */

import "dotenv/config";
import { PrismaClient, LeadSource, SenderType, ConversationStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";

function create_prisma_client(): PrismaClient {
  const connection_string = process.env.DATABASE_URL;
  
  if (!connection_string) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  const pool = new Pool({ connectionString: connection_string });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = create_prisma_client();

interface ParsedMessage {
  date: Date;
  sender_name: string;
  content: string;
  is_from_me: boolean;
}

const SELLER_NAME = "Maitê Liuzzi"; // Nome do vendedor nas conversas

function parse_whatsapp_date(date_str: string, time_str: string): Date {
  const [day, month, year] = date_str.split("/").map(Number);
  const [hour, minute] = time_str.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function parse_whatsapp_chat(content: string): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const lines = content.split("\n");
  
  // Regex para detectar início de mensagem: DD/MM/YYYY HH:MM - Nome: Mensagem
  const message_regex = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+-\s+(.+?):\s+(.+)$/;
  
  let current_message: ParsedMessage | null = null;
  
  for (const line of lines) {
    const match = line.match(message_regex);
    
    if (match) {
      // Salvar mensagem anterior se existir
      if (current_message) {
        messages.push(current_message);
      }
      
      const [, date_str, time_str, sender_name, content] = match;
      
      // Ignorar mensagens do sistema
      if (content.includes("criptografia de ponta a ponta") || 
          content === "<Mídia oculta>" ||
          sender_name.includes("alterou o código de segurança")) {
        current_message = null;
        continue;
      }
      
      current_message = {
        date: parse_whatsapp_date(date_str, time_str),
        sender_name: sender_name.trim(),
        content: content.trim(),
        is_from_me: sender_name.includes(SELLER_NAME),
      };
    } else if (current_message && line.trim()) {
      // Linha de continuação da mensagem anterior
      current_message.content += "\n" + line.trim();
    }
  }
  
  // Adicionar última mensagem
  if (current_message) {
    messages.push(current_message);
  }
  
  return messages;
}

function extract_phone_from_name(name: string): string | null {
  // Tentar extrair número de telefone do nome (se tiver)
  const phone_match = name.match(/(\d{10,13})/);
  return phone_match ? phone_match[1] : null;
}

async function import_conversation(
  file_path: string,
  seller_id: string,
  area_id: string,
  company_id: string,
  category: string
) {
  const content = fs.readFileSync(file_path, "utf-8");
  const messages = parse_whatsapp_chat(content);
  
  if (messages.length === 0) {
    console.log(`  ⚠️ Sem mensagens em: ${path.basename(file_path)}`);
    return { success: false, reason: "no_messages" };
  }
  
  // Extrair nome do lead do nome do arquivo ou primeira mensagem recebida
  const file_name = path.basename(file_path, ".txt");
  const lead_name_match = file_name.match(/Conversa do WhatsApp com (.+)/);
  const lead_name = lead_name_match ? lead_name_match[1].trim() : "Contato";
  
  // Tentar extrair telefone ou gerar um placeholder
  const phone = extract_phone_from_name(lead_name) || `import_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log(`  📱 Importando: ${lead_name} (${messages.length} mensagens)`);
  
  // Criar ou buscar lead
  let lead = await prisma.lead.findFirst({
    where: { name: lead_name, company_id },
  });
  
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        name: lead_name,
        phone,
        source: LeadSource.WHATSAPP,
        status: category.includes("venda") ? "SOLD" : 
                category.includes("perdida") ? "LOST" : "LEAD",
        seller_id,
        area_id,
        company_id,
        notes: `Importado de: ${category}`,
      },
    });
    console.log(`    ✅ Lead criado: ${lead.name}`);
  }
  
  // Criar conversa
  const conversation = await prisma.conversation.upsert({
    where: {
      lead_id_seller_id: {
        lead_id: lead.id,
        seller_id,
      },
    },
    create: {
      lead_id: lead.id,
      seller_id,
      status: ConversationStatus.ARCHIVED,
      last_message_at: messages[messages.length - 1].date,
    },
    update: {
      last_message_at: messages[messages.length - 1].date,
    },
  });
  
  // Importar mensagens
  let imported_count = 0;
  for (const msg of messages) {
    const whatsapp_id = `import_${conversation.id}_${msg.date.getTime()}_${Math.random().toString(36).substring(7)}`;
    
    const existing = await prisma.message.findFirst({
      where: {
        conversation_id: conversation.id,
        created_at: msg.date,
        content: msg.content.substring(0, 100),
      },
    });
    
    if (!existing) {
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          sender_type: msg.is_from_me ? SenderType.SELLER : SenderType.LEAD,
          content: msg.content,
          whatsapp_id,
          created_at: msg.date,
        },
      });
      imported_count++;
    }
  }
  
  console.log(`    💬 ${imported_count} mensagens importadas`);
  
  return { success: true, messages: imported_count };
}

async function process_zip_file(
  zip_path: string,
  seller_id: string,
  area_id: string,
  company_id: string
) {
  const category = path.basename(zip_path, ".zip").split("-")[0].trim();
  console.log(`\n📦 Processando: ${category}`);
  
  const zip = new AdmZip(zip_path);
  const temp_dir = `/tmp/whatsapp_import_${Date.now()}`;
  
  zip.extractAllTo(temp_dir, true);
  
  // Encontrar arquivos .txt recursivamente
  const find_txt_files = (dir: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const full_path = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...find_txt_files(full_path));
      } else if (entry.name.endsWith(".txt")) {
        files.push(full_path);
      } else if (entry.name.endsWith(".zip")) {
        // ZIP dentro de ZIP
        const inner_zip = new AdmZip(full_path);
        const inner_temp = `${temp_dir}/inner_${Date.now()}`;
        inner_zip.extractAllTo(inner_temp, true);
        files.push(...find_txt_files(inner_temp));
      }
    }
    
    return files;
  };
  
  const txt_files = find_txt_files(temp_dir);
  console.log(`  📄 Encontrados ${txt_files.length} arquivos de conversa`);
  
  let total_messages = 0;
  let total_conversations = 0;
  
  for (const txt_file of txt_files) {
    const result = await import_conversation(txt_file, seller_id, area_id, company_id, category);
    if (result.success) {
      total_conversations++;
      total_messages += result.messages || 0;
    }
  }
  
  // Limpar temp
  fs.rmSync(temp_dir, { recursive: true, force: true });
  
  return { conversations: total_conversations, messages: total_messages };
}

async function main() {
  console.log("🚀 Iniciando importação de conversas do WhatsApp...\n");
  
  // Buscar diretor@demo.com
  const director = await prisma.user.findFirst({
    where: { email: "diretor@demo.com" },
    include: { company: true },
  });
  
  if (!director) {
    console.error("❌ Usuário diretor@demo.com não encontrado!");
    process.exit(1);
  }
  
  console.log(`👤 Diretor: ${director.name} (${director.email})`);
  console.log(`🏢 Empresa: ${director.company?.name || director.company_id}`);
  
  // Buscar um vendedor da mesma empresa
  const seller = await prisma.user.findFirst({
    where: {
      company_id: director.company_id!,
      access_level: "SELLER",
      status: "ACTIVE",
    },
  });
  
  if (!seller) {
    console.error("❌ Nenhum vendedor encontrado na empresa!");
    process.exit(1);
  }
  
  console.log(`👨‍💼 Vendedor: ${seller.name} (${seller.email})`);
  
  // Buscar área do vendedor
  const area_id = seller.area_id;
  if (!area_id) {
    console.error("❌ Vendedor sem área definida!");
    process.exit(1);
  }
  
  // Processar arquivos ZIP
  const whatsapp_dir = path.join(process.cwd(), "data", "whatsapp");
  const zip_files = fs.readdirSync(whatsapp_dir).filter((f) => f.endsWith(".zip"));
  
  console.log(`\n📂 Encontrados ${zip_files.length} arquivos ZIP em ${whatsapp_dir}`);
  
  let grand_total_conversations = 0;
  let grand_total_messages = 0;
  
  for (const zip_file of zip_files) {
    const result = await process_zip_file(
      path.join(whatsapp_dir, zip_file),
      seller.id,
      area_id,
      director.company_id!
    );
    grand_total_conversations += result.conversations;
    grand_total_messages += result.messages;
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Importação concluída!`);
  console.log(`   📊 ${grand_total_conversations} conversas`);
  console.log(`   💬 ${grand_total_messages} mensagens`);
  console.log("=".repeat(50));
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro na importação:", error);
  process.exit(1);
});
