import prisma from "@/lib/prisma/client";
import { encrypt, decrypt } from "@/lib/crypto/encryption";
import { LeadSource, LeadStatus } from "@/lib/dashboard/types";

const HUBSPOT_API_BASE = "https://api.hubapi.com";

export interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    website?: string;
    lifecyclestage?: string;
    hs_lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotContactInput {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  jobtitle?: string;
  website?: string;
  lifecyclestage?: string;
}

interface HubSpotListResponse {
  results: HubSpotContact[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
}

interface SyncResult {
  success: boolean;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  errors: Array<{ record: string; error: string }>;
}

export class HubSpotClient {
  private api_key: string;
  private company_id: string;

  private constructor(api_key: string, company_id: string) {
    this.api_key = api_key;
    this.company_id = company_id;
  }

  static async for_company(company_id: string): Promise<HubSpotClient | null> {
    const integration = await prisma.companyIntegration.findUnique({
      where: {
        company_id_type: {
          company_id,
          type: "HUBSPOT",
        },
      },
    });

    if (!integration?.api_key || !integration.is_active) {
      return null;
    }

    const decrypted_key = decrypt(integration.api_key);
    return new HubSpotClient(decrypted_key, company_id);
  }

  private async fetch_api<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${HUBSPOT_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.api_key}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error_text = await response.text();
      throw new Error(`HubSpot API error: ${response.status} - ${error_text}`);
    }

    return response.json();
  }

  async get_contact(contact_id: string): Promise<HubSpotContact | null> {
    try {
      return await this.fetch_api<HubSpotContact>(
        `/crm/v3/objects/contacts/${contact_id}?properties=email,firstname,lastname,phone,company,jobtitle,website,lifecyclestage,hs_lead_status`
      );
    } catch {
      return null;
    }
  }

  async get_contact_by_email(email: string): Promise<HubSpotContact | null> {
    try {
      return await this.fetch_api<HubSpotContact>(
        `/crm/v3/objects/contacts/${email}?idProperty=email&properties=email,firstname,lastname,phone,company,jobtitle,website,lifecyclestage,hs_lead_status`
      );
    } catch {
      return null;
    }
  }

  async list_contacts(limit: number = 100, after?: string): Promise<HubSpotListResponse> {
    let url = `/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,phone,company,jobtitle,website,lifecyclestage,hs_lead_status,createdate,lastmodifieddate`;
    if (after) {
      url += `&after=${after}`;
    }
    return this.fetch_api<HubSpotListResponse>(url);
  }

  async create_contact(contact: HubSpotContactInput): Promise<HubSpotContact> {
    return this.fetch_api<HubSpotContact>("/crm/v3/objects/contacts", {
      method: "POST",
      body: JSON.stringify({ properties: contact }),
    });
  }

  async update_contact(
    contact_id: string,
    properties: Partial<HubSpotContactInput>
  ): Promise<HubSpotContact> {
    return this.fetch_api<HubSpotContact>(
      `/crm/v3/objects/contacts/${contact_id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      }
    );
  }

  async upsert_contact(contact: HubSpotContactInput): Promise<HubSpotContact> {
    const existing = await this.get_contact_by_email(contact.email);
    if (existing) {
      return this.update_contact(existing.id, contact);
    }
    return this.create_contact(contact);
  }

  async import_contacts_to_leads(
    seller_id: string,
    area_id: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      errors: [],
    };

    const log = await prisma.hubSpotSyncLog.create({
      data: {
        id: crypto.randomUUID(),
        company_id: this.company_id,
        direction: "IMPORT",
        entity_type: "CONTACT",
        status: "RUNNING",
      },
    });

    try {
      let after: string | undefined;
      let has_more = true;

      while (has_more) {
        const response = await this.list_contacts(100, after);
        
        for (const contact of response.results) {
          result.records_processed++;
          
          try {
            const lead_data = this.map_hubspot_to_lead(contact, seller_id, area_id);
            
            const existing_lead = await prisma.lead.findFirst({
              where: {
                OR: [
                  { hubspot_id: contact.id },
                  { email: contact.properties.email },
                ],
                company_id: this.company_id,
              },
            });

            if (existing_lead) {
              await prisma.lead.update({
                where: { id: existing_lead.id },
                data: {
                  ...lead_data,
                  hubspot_synced_at: new Date(),
                },
              });
              result.records_updated++;
            } else {
              await prisma.lead.create({
                data: {
                  ...lead_data,
                  id: crypto.randomUUID(),
                  company_id: this.company_id,
                  hubspot_synced_at: new Date(),
                },
              });
              result.records_created++;
            }
          } catch (error) {
            result.records_failed++;
            result.errors.push({
              record: contact.properties.email || contact.id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        if (response.paging?.next?.after) {
          after = response.paging.next.after;
        } else {
          has_more = false;
        }
      }

      await prisma.hubSpotSyncLog.update({
        where: { id: log.id },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
          records_processed: result.records_processed,
          records_created: result.records_created,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          error_details: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      await prisma.companyIntegration.update({
        where: {
          company_id_type: {
            company_id: this.company_id,
            type: "HUBSPOT",
          },
        },
        data: {
          last_sync_at: new Date(),
          sync_error: null,
        },
      });
    } catch (error) {
      result.success = false;
      
      await prisma.hubSpotSyncLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          completed_at: new Date(),
          records_processed: result.records_processed,
          records_created: result.records_created,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          error_details: { error: error instanceof Error ? error.message : "Unknown error" },
        },
      });

      await prisma.companyIntegration.update({
        where: {
          company_id_type: {
            company_id: this.company_id,
            type: "HUBSPOT",
          },
        },
        data: {
          sync_error: error instanceof Error ? error.message : "Sync failed",
        },
      });
    }

    return result;
  }

  async export_leads_to_hubspot(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      records_created: 0,
      records_updated: 0,
      records_failed: 0,
      errors: [],
    };

    const log = await prisma.hubSpotSyncLog.create({
      data: {
        id: crypto.randomUUID(),
        company_id: this.company_id,
        direction: "EXPORT",
        entity_type: "CONTACT",
        status: "RUNNING",
      },
    });

    try {
      const leads = await prisma.lead.findMany({
        where: {
          company_id: this.company_id,
          email: { not: null },
        },
      });

      for (const lead of leads) {
        result.records_processed++;
        
        try {
          if (!lead.email) continue;

          const hubspot_data = this.map_lead_to_hubspot(lead);
          const hubspot_contact = await this.upsert_contact(hubspot_data);

          if (!lead.hubspot_id) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                hubspot_id: hubspot_contact.id,
                hubspot_synced_at: new Date(),
              },
            });
            result.records_created++;
          } else {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { hubspot_synced_at: new Date() },
            });
            result.records_updated++;
          }
        } catch (error) {
          result.records_failed++;
          result.errors.push({
            record: lead.email || lead.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      await prisma.hubSpotSyncLog.update({
        where: { id: log.id },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
          records_processed: result.records_processed,
          records_created: result.records_created,
          records_updated: result.records_updated,
          records_failed: result.records_failed,
          error_details: result.errors.length > 0 ? result.errors : undefined,
        },
      });

      await prisma.companyIntegration.update({
        where: {
          company_id_type: {
            company_id: this.company_id,
            type: "HUBSPOT",
          },
        },
        data: {
          last_sync_at: new Date(),
          sync_error: null,
        },
      });
    } catch (error) {
      result.success = false;
      
      await prisma.hubSpotSyncLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          completed_at: new Date(),
          error_details: { error: error instanceof Error ? error.message : "Unknown error" },
        },
      });
    }

    return result;
  }

  private map_hubspot_to_lead(
    contact: HubSpotContact,
    seller_id: string,
    area_id: string
  ) {
    const props = contact.properties;
    
    return {
      name: [props.firstname, props.lastname].filter(Boolean).join(" ") || props.email || "Sem nome",
      first_name: props.firstname || null,
      last_name: props.lastname || null,
      email: props.email || null,
      phone: props.phone || null,
      company_name: props.company || null,
      job_title: props.jobtitle || null,
      website: props.website || null,
      source: LeadSource.HUBSPOT,
      status: this.map_lifecycle_to_status(props.lifecyclestage),
      hubspot_id: contact.id,
      seller_id,
      area_id,
    };
  }

  private map_lead_to_hubspot(lead: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    name: string;
    phone: string | null;
    company_name: string | null;
    job_title: string | null;
    website: string | null;
    status: string;
  }): HubSpotContactInput {
    const names = lead.name.split(" ");
    const firstname = lead.first_name || names[0] || "";
    const lastname = lead.last_name || names.slice(1).join(" ") || "";

    return {
      email: lead.email!,
      firstname,
      lastname,
      phone: lead.phone || undefined,
      company: lead.company_name || undefined,
      jobtitle: lead.job_title || undefined,
      website: lead.website || undefined,
      lifecyclestage: this.map_status_to_lifecycle(lead.status),
    };
  }

  private map_lifecycle_to_status(lifecycle?: string): LeadStatus {
    switch (lifecycle?.toLowerCase()) {
      case "subscriber":
      case "lead":
      case "marketingqualifiedlead":
        return LeadStatus.LEAD;
      case "salesqualifiedlead":
      case "opportunity":
        return LeadStatus.PROPOSAL;
      case "customer":
        return LeadStatus.SOLD;
      default:
        return LeadStatus.LEAD;
    }
  }

  private map_status_to_lifecycle(status: string): string {
    switch (status) {
      case LeadStatus.LEAD:
        return "lead";
      case LeadStatus.VISIT:
      case LeadStatus.CALLBACK:
        return "salesqualifiedlead";
      case LeadStatus.PROPOSAL:
        return "opportunity";
      case LeadStatus.SOLD:
        return "customer";
      default:
        return "lead";
    }
  }
}

export async function save_hubspot_integration(
  company_id: string,
  api_key: string,
  name: string = "HubSpot"
): Promise<void> {
  const encrypted_key = encrypt(api_key);
  
  await prisma.companyIntegration.upsert({
    where: {
      company_id_type: {
        company_id,
        type: "HUBSPOT",
      },
    },
    create: {
      id: crypto.randomUUID(),
      company_id,
      type: "HUBSPOT",
      name,
      api_key: encrypted_key,
      is_active: true,
    },
    update: {
      api_key: encrypted_key,
      name,
      is_active: true,
      sync_error: null,
    },
  });
}

export async function get_hubspot_integration(company_id: string) {
  const integration = await prisma.companyIntegration.findUnique({
    where: {
      company_id_type: {
        company_id,
        type: "HUBSPOT",
      },
    },
    select: {
      id: true,
      name: true,
      is_active: true,
      last_sync_at: true,
      sync_error: true,
      created_at: true,
    },
  });

  return integration;
}

export async function get_sync_logs(company_id: string, limit: number = 10) {
  return prisma.hubSpotSyncLog.findMany({
    where: { company_id },
    orderBy: { started_at: "desc" },
    take: limit,
  });
}
