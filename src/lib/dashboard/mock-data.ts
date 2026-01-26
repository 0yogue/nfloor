import { Lead, User, Area, LeadStatus, LeadSource, Conversation, Message, PlaybookScore, TeamMetrics, SellerRanking } from "./types";
import { AccessLevel, ConversationStatus, SenderType } from "@/types/rbac";

const DEMO_COMPANY_ID = "demo_company_001";

export const MOCK_AREAS: Area[] = [
  { id: "area_norte", name: "Zona Norte", company_id: DEMO_COMPANY_ID },
  { id: "area_sul", name: "Zona Sul", company_id: DEMO_COMPANY_ID },
  { id: "area_leste", name: "Zona Leste", company_id: DEMO_COMPANY_ID },
  { id: "area_oeste", name: "Zona Oeste", company_id: DEMO_COMPANY_ID },
];

export const MOCK_USERS: User[] = [
  // Director
  {
    id: "user_director",
    name: "Carlos Diretor",
    email: "diretor@demo.com",
    access_level: AccessLevel.DIRECTOR,
    company_id: DEMO_COMPANY_ID,
    area_id: null,
  },
  // Superintendent
  {
    id: "user_super_norte",
    name: "Ana Superintendente",
    email: "superintendente@demo.com",
    access_level: AccessLevel.SUPERINTENDENT,
    company_id: DEMO_COMPANY_ID,
    area_id: null,
  },
  // Managers
  {
    id: "user_gerente_norte",
    name: "Roberto Gerente Norte",
    email: "gerente.norte@demo.com",
    access_level: AccessLevel.MANAGER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_norte",
  },
  {
    id: "user_gerente_sul",
    name: "Mariana Gerente Sul",
    email: "gerente.sul@demo.com",
    access_level: AccessLevel.MANAGER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_sul",
  },
  // Sellers - Zona Norte
  {
    id: "user_vendedor_1",
    name: "João Vendedor",
    email: "vendedor1@demo.com",
    access_level: AccessLevel.SELLER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_norte",
  },
  {
    id: "user_vendedor_2",
    name: "Maria Vendedora",
    email: "vendedor2@demo.com",
    access_level: AccessLevel.SELLER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_norte",
  },
  {
    id: "user_vendedor_3",
    name: "Pedro Vendedor",
    email: "vendedor3@demo.com",
    access_level: AccessLevel.SELLER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_norte",
  },
  // Sellers - Zona Sul
  {
    id: "user_vendedor_4",
    name: "Lucia Vendedora",
    email: "vendedor4@demo.com",
    access_level: AccessLevel.SELLER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_sul",
  },
  {
    id: "user_vendedor_5",
    name: "Fernando Vendedor",
    email: "vendedor5@demo.com",
    access_level: AccessLevel.SELLER,
    company_id: DEMO_COMPANY_ID,
    area_id: "area_sul",
  },
];

function generate_leads(): Lead[] {
  const leads: Lead[] = [];
  const statuses: LeadStatus[] = [
    LeadStatus.LEAD,
    LeadStatus.VISIT,
    LeadStatus.CALLBACK,
    LeadStatus.PROPOSAL,
    LeadStatus.SOLD,
    LeadStatus.LOST,
  ];
  
  const sources: LeadSource[] = [
    LeadSource.WHATSAPP,
    LeadSource.EMAIL,
    LeadSource.WEBSITE,
    LeadSource.BALCAO,
    LeadSource.HUBSPOT,
    LeadSource.ZAP_IMOVEIS,
  ];
  
  const sellers = MOCK_USERS.filter(u => u.access_level === AccessLevel.SELLER);
  const first_names = ["João", "Maria", "Pedro", "Ana", "Carlos", "Lucia", "Fernando", "Patricia"];
  const last_names = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Ferreira"];
  
  let lead_counter = 1;
  
  for (const seller of sellers) {
    const area = MOCK_AREAS.find(a => a.id === seller.area_id);
    if (!area) continue;
    
    for (let days_ago = 0; days_ago < 30; days_ago++) {
      const leads_per_day = Math.floor(Math.random() * 4) + 1;
      
      for (let i = 0; i < leads_per_day; i++) {
        const created_at = new Date();
        created_at.setDate(created_at.getDate() - days_ago);
        created_at.setHours(Math.floor(Math.random() * 12) + 8);
        
        const status_weights = [0.30, 0.15, 0.15, 0.15, 0.12, 0.13];
        const random = Math.random();
        let cumulative = 0;
        let status_index = 0;
        for (let j = 0; j < status_weights.length; j++) {
          cumulative += status_weights[j];
          if (random <= cumulative) {
            status_index = j;
            break;
          }
        }
        
        const first_name = first_names[Math.floor(Math.random() * first_names.length)];
        const last_name = last_names[Math.floor(Math.random() * last_names.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        leads.push({
          id: `lead_${lead_counter++}`,
          name: `${first_name} ${last_name}`,
          first_name,
          last_name,
          phone: `(11) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          email: `${first_name.toLowerCase()}.${last_name.toLowerCase()}${lead_counter}@email.com`,
          status: statuses[status_index],
          source,
          notes: null,
          company_name: null,
          job_title: null,
          website: null,
          hubspot_id: null,
          hubspot_synced_at: null,
          seller_id: seller.id,
          area_id: area.id,
          company_id: area.company_id,
          created_at,
          updated_at: created_at,
        });
      }
    }
  }
  
  return leads;
}

export const MOCK_LEADS: Lead[] = generate_leads();

function generate_conversations(): Conversation[] {
  const conversations: Conversation[] = [];
  let conversation_counter = 1;
  
  for (const lead of MOCK_LEADS) {
    const has_conversation = Math.random() > 0.3;
    if (!has_conversation) continue;
    
    const created_at = new Date(lead.created_at);
    const last_message_at = new Date(created_at);
    last_message_at.setHours(last_message_at.getHours() + Math.floor(Math.random() * 48));
    
    const last_seller_message = new Date(last_message_at);
    last_seller_message.setMinutes(last_seller_message.getMinutes() - Math.floor(Math.random() * 120));
    
    const waiting_response = Math.random() > 0.7;
    const last_lead_message = waiting_response 
      ? new Date(last_message_at) 
      : new Date(last_seller_message.getTime() - Math.floor(Math.random() * 60) * 60000);
    
    conversations.push({
      id: `conversation_${conversation_counter++}`,
      lead_id: lead.id,
      seller_id: lead.seller_id,
      status: waiting_response ? ConversationStatus.WAITING_RESPONSE : ConversationStatus.ACTIVE,
      last_message_at,
      last_seller_message,
      last_lead_message,
      unread_count: waiting_response ? Math.floor(Math.random() * 5) + 1 : 0,
      created_at,
    });
  }
  
  return conversations;
}

export const MOCK_CONVERSATIONS: Conversation[] = generate_conversations();

function generate_messages(): Message[] {
  const messages: Message[] = [];
  let message_counter = 1;
  
  for (const conversation of MOCK_CONVERSATIONS) {
    const num_messages = Math.floor(Math.random() * 10) + 2;
    let current_time = new Date(conversation.created_at);
    
    for (let i = 0; i < num_messages; i++) {
      const is_seller = i % 2 === 1;
      const response_time = is_seller ? Math.floor(Math.random() * 600) + 30 : null;
      
      current_time = new Date(current_time.getTime() + (response_time || Math.floor(Math.random() * 300)) * 1000);
      
      messages.push({
        id: `message_${message_counter++}`,
        conversation_id: conversation.id,
        sender_type: is_seller ? SenderType.SELLER : SenderType.LEAD,
        content: is_seller ? "Resposta do vendedor..." : "Mensagem do lead...",
        response_time,
        created_at: current_time,
      });
    }
  }
  
  return messages;
}

export const MOCK_MESSAGES: Message[] = generate_messages();

function generate_playbook_scores(): PlaybookScore[] {
  const scores: PlaybookScore[] = [];
  let score_counter = 1;
  
  for (const conversation of MOCK_CONVERSATIONS) {
    const has_score = Math.random() > 0.4;
    if (!has_score) continue;
    
    scores.push({
      id: `score_${score_counter++}`,
      conversation_id: conversation.id,
      seller_id: conversation.seller_id,
      score: Math.random() * 4 + 6,
      created_at: new Date(conversation.last_message_at || conversation.created_at),
    });
  }
  
  return scores;
}

export const MOCK_PLAYBOOK_SCORES: PlaybookScore[] = generate_playbook_scores();

export const MOCK_ONLINE_SELLERS = new Set<string>(
  MOCK_USERS
    .filter(u => u.access_level === AccessLevel.SELLER)
    .filter(() => Math.random() > 0.4)
    .map(u => u.id)
);

export function get_team_metrics(seller_ids: string[]): TeamMetrics {
  const sellers = MOCK_USERS.filter(u => seller_ids.includes(u.id));
  const sellers_online = sellers.filter(s => MOCK_ONLINE_SELLERS.has(s.id)).length;
  
  const seller_conversations = MOCK_CONVERSATIONS.filter(c => seller_ids.includes(c.seller_id));
  const now = new Date();
  const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const new_conversations = seller_conversations.filter(c => c.created_at >= today_start).length;
  
  const seller_messages = MOCK_MESSAGES.filter(
    m => m.sender_type === SenderType.SELLER && m.response_time !== null
  );
  const relevant_messages = seller_messages.filter(m => {
    const conv = MOCK_CONVERSATIONS.find(c => c.id === m.conversation_id);
    return conv && seller_ids.includes(conv.seller_id);
  });
  const avg_response_time = relevant_messages.length > 0
    ? relevant_messages.reduce((sum, m) => sum + (m.response_time || 0), 0) / relevant_messages.length
    : 0;
  
  const seller_scores = MOCK_PLAYBOOK_SCORES.filter(s => seller_ids.includes(s.seller_id));
  const avg_playbook_score = seller_scores.length > 0
    ? seller_scores.reduce((sum, s) => sum + s.score, 0) / seller_scores.length
    : 0;
  
  const leads_without_response = seller_conversations.filter(
    c => c.status === ConversationStatus.WAITING_RESPONSE
  ).length;
  
  const two_hours_ago = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const twenty_four_hours_ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const clients_no_response_2h = seller_conversations.filter(
    c => c.status === ConversationStatus.WAITING_RESPONSE && 
         c.last_lead_message && 
         c.last_lead_message < two_hours_ago
  ).length;
  
  const clients_no_response_24h = seller_conversations.filter(
    c => c.status === ConversationStatus.WAITING_RESPONSE && 
         c.last_lead_message && 
         c.last_lead_message < twenty_four_hours_ago
  ).length;
  
  const conversations_with_activity = seller_conversations.filter(
    c => c.last_message_at && c.last_message_at >= today_start
  ).length;
  
  const new_leads = MOCK_LEADS.filter(
    l => seller_ids.includes(l.seller_id) && l.created_at >= today_start
  ).length;
  
  const reactivated_conversations = seller_conversations.filter(c => {
    if (!c.last_message_at) return false;
    const last_activity = c.last_message_at;
    const created = c.created_at;
    const days_inactive = (last_activity.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return days_inactive > 7 && last_activity >= today_start;
  }).length;

  return {
    sellers_online,
    sellers_offline: sellers.length - sellers_online,
    new_conversations,
    avg_response_time: Math.round(avg_response_time),
    avg_playbook_score: Math.round(avg_playbook_score * 10) / 10,
    leads_without_response,
    avg_attendance_score: Math.round(avg_playbook_score * 10) / 10,
    new_leads,
    reactivated_conversations,
    avg_first_response_time: Math.round(avg_response_time),
    avg_weighted_response_time: Math.round(avg_response_time * 1.2),
    clients_no_response_2h,
    clients_no_response_24h,
    conversations_with_activity,
  };
}

export function get_seller_ranking(seller_ids: string[]): SellerRanking[] {
  return MOCK_USERS
    .filter(u => seller_ids.includes(u.id) && u.access_level === AccessLevel.SELLER)
    .map(seller => {
      const seller_conversations = MOCK_CONVERSATIONS.filter(c => c.seller_id === seller.id);
      const seller_leads = MOCK_LEADS.filter(l => l.seller_id === seller.id);
      const seller_scores = MOCK_PLAYBOOK_SCORES.filter(s => s.seller_id === seller.id);
      
      const now = new Date();
      const today_start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const new_conversations = seller_conversations.filter(c => c.created_at >= today_start).length;
      
      const seller_messages = MOCK_MESSAGES.filter(m => {
        if (m.sender_type !== SenderType.SELLER || m.response_time === null) return false;
        const conv = MOCK_CONVERSATIONS.find(c => c.id === m.conversation_id);
        return conv && conv.seller_id === seller.id;
      });
      
      const avg_response_time = seller_messages.length > 0
        ? seller_messages.reduce((sum, m) => sum + (m.response_time || 0), 0) / seller_messages.length
        : 0;
      
      const playbook_score = seller_scores.length > 0
        ? seller_scores.reduce((sum, s) => sum + s.score, 0) / seller_scores.length
        : 0;
      
      const leads_without_response = seller_conversations.filter(
        c => c.status === ConversationStatus.WAITING_RESPONSE
      ).length;
      
      const sold_leads = seller_leads.filter(l => l.status === LeadStatus.SOLD).length;
      const conversion_rate = seller_leads.length > 0 
        ? (sold_leads / seller_leads.length) * 100 
        : 0;
      
      return {
        id: seller.id,
        name: seller.name,
        is_online: MOCK_ONLINE_SELLERS.has(seller.id),
        new_conversations,
        avg_response_time: Math.round(avg_response_time),
        playbook_score: Math.round(playbook_score * 10) / 10,
        leads_without_response,
        total_leads: seller_leads.length,
        conversion_rate: Math.round(conversion_rate * 10) / 10,
      };
    });
}
