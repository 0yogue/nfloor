/**
 * WhatsApp Sync Service
 * Synchronizes chats and messages from Evolution API to database
 */

import { prisma } from "@/lib/prisma/client";
import { EvolutionAPIClient, get_instance_name } from "./evolution-api";
import { LeadSource, SenderType, ConversationStatus } from "@prisma/client";

interface EvolutionChat {
  id: string;
  remoteJid: string;
  name?: string;
  profilePictureUrl?: string;
  unreadCount?: number;
}

interface EvolutionMessageData {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
    };
    videoMessage?: {
      caption?: string;
    };
    documentMessage?: {
      caption?: string;
    };
  };
  messageTimestamp: number | string;
  pushName?: string;
}

export interface SyncResult {
  success: boolean;
  chats_synced: number;
  messages_synced: number;
  leads_created: number;
  errors: string[];
}

function extract_message_text(message?: EvolutionMessageData["message"]): string | null {
  if (!message) return null;
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    null
  );
}

function extract_phone_from_jid(remote_jid: string): string | null {
  const match = remote_jid.match(/^(\d+)@/);
  return match ? match[1] : null;
}

function format_phone_display(phone: string): string {
  if (phone.startsWith("55") && phone.length >= 12) {
    const ddd = phone.slice(2, 4);
    const rest = phone.slice(4);
    if (rest.length === 9) {
      return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return phone;
}

async function get_next_seller_round_robin(company_id: string, area_id?: string): Promise<string | null> {
  const where_clause: Record<string, unknown> = {
    company_id,
    access_level: "SELLER",
    status: "ACTIVE",
  };

  if (area_id) {
    where_clause.area_id = area_id;
  }

  const sellers = await prisma.user.findMany({
    where: where_clause,
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (sellers.length === 0) return null;

  const last_lead = await prisma.lead.findFirst({
    where: {
      company_id,
      source: LeadSource.WHATSAPP,
    },
    orderBy: { created_at: "desc" },
    select: { seller_id: true },
  });

  if (!last_lead) {
    return sellers[0].id;
  }

  const last_index = sellers.findIndex((s) => s.id === last_lead.seller_id);
  const next_index = (last_index + 1) % sellers.length;
  return sellers[next_index].id;
}

async function get_or_create_default_area(company_id: string): Promise<string> {
  const existing_area = await prisma.area.findFirst({
    where: { company_id, is_active: true },
    select: { id: true },
  });

  if (existing_area) return existing_area.id;

  const new_area = await prisma.area.create({
    data: {
      name: "WhatsApp Leads",
      company_id,
      is_active: true,
    },
  });

  return new_area.id;
}

export async function find_or_create_lead_by_phone(
  phone: string,
  name: string | null,
  company_id: string
): Promise<{ lead_id: string; seller_id: string; created: boolean }> {
  const existing_lead = await prisma.lead.findFirst({
    where: {
      phone,
      company_id,
    },
    select: { id: true, seller_id: true },
  });

  if (existing_lead) {
    return {
      lead_id: existing_lead.id,
      seller_id: existing_lead.seller_id,
      created: false,
    };
  }

  const area_id = await get_or_create_default_area(company_id);
  const seller_id = await get_next_seller_round_robin(company_id, area_id);

  if (!seller_id) {
    throw new Error("Nenhum vendedor disponível para atribuição de lead");
  }

  const lead_name = name || format_phone_display(phone);

  const new_lead = await prisma.lead.create({
    data: {
      name: lead_name,
      phone,
      source: LeadSource.WHATSAPP,
      status: "LEAD",
      seller_id,
      area_id,
      company_id,
    },
  });

  return {
    lead_id: new_lead.id,
    seller_id,
    created: true,
  };
}

export async function sync_whatsapp_chats(
  client: EvolutionAPIClient,
  company_id: string
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    chats_synced: 0,
    messages_synced: 0,
    leads_created: 0,
    errors: [],
  };

  try {
    const instance_name = get_instance_name(company_id);
    const chats_response = await client.get_chats(instance_name);

    if (!chats_response.success || !chats_response.data) {
      result.errors.push(chats_response.error || "Falha ao buscar chats");
      return result;
    }

    const chats = chats_response.data as EvolutionChat[];

    for (const chat of chats) {
      if (!chat.remoteJid.endsWith("@s.whatsapp.net")) {
        continue;
      }

      const phone = extract_phone_from_jid(chat.remoteJid);
      if (!phone) continue;

      try {
        const { lead_id, seller_id, created } = await find_or_create_lead_by_phone(
          phone,
          chat.name || null,
          company_id
        );

        if (created) {
          result.leads_created++;
        }

        const conversation = await prisma.conversation.upsert({
          where: {
            lead_id_seller_id: {
              lead_id,
              seller_id,
            },
          },
          create: {
            lead_id,
            seller_id,
            whatsapp_chat_id: chat.remoteJid,
            status: ConversationStatus.ACTIVE,
            unread_count: chat.unreadCount || 0,
          },
          update: {
            whatsapp_chat_id: chat.remoteJid,
            unread_count: chat.unreadCount || 0,
          },
        });

        const messages_synced = await sync_chat_messages(
          client,
          instance_name,
          chat.remoteJid,
          conversation.id,
          seller_id
        );

        result.messages_synced += messages_synced;
        result.chats_synced++;
      } catch (error) {
        const error_msg = error instanceof Error ? error.message : "Erro desconhecido";
        result.errors.push(`Chat ${chat.remoteJid}: ${error_msg}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    const error_msg = error instanceof Error ? error.message : "Erro desconhecido";
    result.errors.push(error_msg);
  }

  return result;
}

async function sync_chat_messages(
  client: EvolutionAPIClient,
  instance_name: string,
  remote_jid: string,
  conversation_id: string,
  seller_id: string
): Promise<number> {
  const messages_response = await client.get_messages(instance_name, remote_jid, 100);

  if (!messages_response.success || !messages_response.data) {
    return 0;
  }

  const messages = messages_response.data as EvolutionMessageData[];
  let synced_count = 0;
  let last_message_at: Date | null = null;
  let last_seller_message: Date | null = null;
  let last_lead_message: Date | null = null;

  for (const msg of messages) {
    const text = extract_message_text(msg.message);
    if (!text) continue;

    const whatsapp_id = msg.key.id;
    const sender_type = msg.key.fromMe ? SenderType.SELLER : SenderType.LEAD;
    const timestamp = typeof msg.messageTimestamp === "string"
      ? parseInt(msg.messageTimestamp, 10) * 1000
      : msg.messageTimestamp * 1000;
    const created_at = new Date(timestamp);

    const existing = await prisma.message.findFirst({
      where: { whatsapp_id },
    });

    if (existing) continue;

    await prisma.message.create({
      data: {
        conversation_id,
        sender_type,
        content: text,
        whatsapp_id,
        created_at,
      },
    });

    synced_count++;

    if (!last_message_at || created_at > last_message_at) {
      last_message_at = created_at;
    }

    if (sender_type === SenderType.SELLER) {
      if (!last_seller_message || created_at > last_seller_message) {
        last_seller_message = created_at;
      }
    } else {
      if (!last_lead_message || created_at > last_lead_message) {
        last_lead_message = created_at;
      }
    }
  }

  if (last_message_at) {
    const update_data: Record<string, unknown> = {
      last_message_at,
    };

    if (last_seller_message) {
      update_data.last_seller_message = last_seller_message;
    }
    if (last_lead_message) {
      update_data.last_lead_message = last_lead_message;
    }

    const needs_response = last_lead_message && (!last_seller_message || last_lead_message > last_seller_message);
    update_data.status = needs_response ? ConversationStatus.WAITING_RESPONSE : ConversationStatus.ACTIVE;

    await prisma.conversation.update({
      where: { id: conversation_id },
      data: update_data,
    });
  }

  return synced_count;
}

export async function process_incoming_message(
  instance_name: string,
  remote_jid: string,
  whatsapp_id: string,
  text: string,
  push_name: string | null,
  timestamp: number,
  from_me: boolean
): Promise<{ success: boolean; error?: string; filtered?: boolean }> {
  try {
    const instance_parts = instance_name.split("_");
    const company_id = instance_parts.length > 2 ? instance_parts.slice(2).join("_") : null;

    if (!company_id) {
      const company = await prisma.company.findFirst({
        where: { is_active: true },
        select: { id: true },
      });
      if (!company) {
        return { success: false, error: "Nenhuma empresa encontrada" };
      }
    }

    const phone = extract_phone_from_jid(remote_jid);
    if (!phone) {
      return { success: false, error: "Telefone inválido" };
    }

    const target_company_id = company_id || (await prisma.company.findFirst({
      where: { is_active: true },
      select: { id: true },
    }))?.id;

    if (!target_company_id) {
      return { success: false, error: "Empresa não encontrada" };
    }

    // Verificar se a empresa tem whitelist ativa
    const allowlist_count = await prisma.whatsappAllowlist.count({
      where: { company_id: target_company_id, is_active: true },
    });

    // Se existe whitelist, verificar se o telefone está na lista
    if (allowlist_count > 0) {
      const is_allowed = await prisma.whatsappAllowlist.findFirst({
        where: {
          company_id: target_company_id,
          phone: phone,
          is_active: true,
        },
      });

      if (!is_allowed) {
        console.log(`[Webhook] Telefone ${phone} não está na whitelist - ignorando`);
        return { success: true, filtered: true };
      }
    }

    const { lead_id, seller_id } = await find_or_create_lead_by_phone(
      phone,
      push_name,
      target_company_id
    );

    const conversation = await prisma.conversation.upsert({
      where: {
        lead_id_seller_id: {
          lead_id,
          seller_id,
        },
      },
      create: {
        lead_id,
        seller_id,
        whatsapp_chat_id: remote_jid,
        status: from_me ? ConversationStatus.ACTIVE : ConversationStatus.WAITING_RESPONSE,
        last_message_at: new Date(timestamp),
        last_lead_message: from_me ? undefined : new Date(timestamp),
        last_seller_message: from_me ? new Date(timestamp) : undefined,
      },
      update: {
        whatsapp_chat_id: remote_jid,
        last_message_at: new Date(timestamp),
        ...(from_me
          ? { last_seller_message: new Date(timestamp), status: ConversationStatus.ACTIVE }
          : { last_lead_message: new Date(timestamp), status: ConversationStatus.WAITING_RESPONSE }
        ),
      },
    });

    const existing_message = await prisma.message.findFirst({
      where: { whatsapp_id },
    });

    if (!existing_message) {
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          sender_type: from_me ? SenderType.SELLER : SenderType.LEAD,
          content: text,
          whatsapp_id,
          created_at: new Date(timestamp),
        },
      });
    }

    return { success: true };
  } catch (error) {
    const error_msg = error instanceof Error ? error.message : "Erro desconhecido";
    return { success: false, error: error_msg };
  }
}
