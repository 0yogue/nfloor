/**
 * Evolution API Client for WhatsApp Integration
 * Documentation: https://doc.evolution-api.com/
 */

import {
  EvolutionAPIConfig,
  EvolutionAPIResponse,
  EvolutionInstanceInfo,
  EvolutionQRCode,
} from "@/types/integrations";

export class EvolutionAPIClient {
  private base_url: string;
  private api_key: string;

  constructor(config: EvolutionAPIConfig) {
    this.base_url = config.base_url.replace(/\/$/, "");
    this.api_key = config.api_key;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<EvolutionAPIResponse<T>> {
    try {
      const response = await fetch(`${this.base_url}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          apikey: this.api_key,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async create_instance(instance_name: string): Promise<EvolutionAPIResponse<EvolutionInstanceInfo>> {
    return this.request<EvolutionInstanceInfo>("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName: instance_name,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });
  }

  async get_instance_info(instance_name: string): Promise<EvolutionAPIResponse<EvolutionInstanceInfo>> {
    return this.request<EvolutionInstanceInfo>(`/instance/fetchInstances?instanceName=${instance_name}`);
  }

  async get_qr_code(instance_name: string): Promise<EvolutionAPIResponse<EvolutionQRCode>> {
    return this.request<EvolutionQRCode>(`/instance/connect/${instance_name}`);
  }

  async logout_instance(instance_name: string): Promise<EvolutionAPIResponse<void>> {
    return this.request<void>(`/instance/logout/${instance_name}`, {
      method: "DELETE",
    });
  }

  async delete_instance(instance_name: string): Promise<EvolutionAPIResponse<void>> {
    return this.request<void>(`/instance/delete/${instance_name}`, {
      method: "DELETE",
    });
  }

  async send_text_message(
    instance_name: string,
    phone_number: string,
    message: string
  ): Promise<EvolutionAPIResponse<unknown>> {
    const formatted_number = phone_number.replace(/\D/g, "");
    const jid = formatted_number.startsWith("55")
      ? `${formatted_number}@s.whatsapp.net`
      : `55${formatted_number}@s.whatsapp.net`;

    return this.request(`/message/sendText/${instance_name}`, {
      method: "POST",
      body: JSON.stringify({
        number: jid,
        text: message,
      }),
    });
  }

  async set_webhook(
    instance_name: string,
    webhook_url: string,
    events: string[] = ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
  ): Promise<EvolutionAPIResponse<void>> {
    return this.request<void>(`/webhook/set/${instance_name}`, {
      method: "POST",
      body: JSON.stringify({
        url: webhook_url,
        webhook_by_events: false,
        events,
      }),
    });
  }

  async get_chats(instance_name: string): Promise<EvolutionAPIResponse<unknown[]>> {
    return this.request<unknown[]>(`/chat/findChats/${instance_name}`);
  }

  async get_messages(
    instance_name: string,
    remote_jid: string,
    limit: number = 50
  ): Promise<EvolutionAPIResponse<unknown[]>> {
    return this.request<unknown[]>(`/chat/findMessages/${instance_name}`, {
      method: "POST",
      body: JSON.stringify({
        where: { key: { remoteJid: remote_jid } },
        limit,
      }),
    });
  }
}

export function create_evolution_client(): EvolutionAPIClient | null {
  const base_url = process.env.EVOLUTION_API_URL;
  const api_key = process.env.EVOLUTION_API_KEY;

  if (!base_url || !api_key) {
    console.warn("Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY.");
    return null;
  }

  return new EvolutionAPIClient({
    base_url,
    api_key,
    instance_name: "",
  });
}
