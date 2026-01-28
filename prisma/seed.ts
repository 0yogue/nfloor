import {
  PrismaClient,
  AccessLevel,
  LicenseType,
  UserStatus,
  LeadStatus,
  LeadSource,
  ConversationStatus,
  SenderType,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ["error"],
});

async function main() {
  console.log("🌱 Starting seed...");

  const existing_users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      access_level: true,
      status: true,
      company_id: true,
      area_id: true,
    },
    orderBy: { created_at: "asc" },
  });
  console.log("\n👥 Existing users:");
  for (const u of existing_users) {
    console.log(`- ${u.email} (${u.access_level}) [company_id=${u.company_id || "-"} area_id=${u.area_id || "-"}]`);
  }

  // Create NFloor company (Super Admin company)
  const nfloor_company = await prisma.company.upsert({
    where: { slug: "nfloor" },
    update: {},
    create: {
      name: "NFloor",
      slug: "nfloor",
      license_type: LicenseType.ENTERPRISE,
      is_active: true,
    },
  });
  console.log("✅ Created NFloor company");

  // Create Demo company
  const demo_company = await prisma.company.upsert({
    where: { slug: "imobiliaria-demo" },
    update: {},
    create: {
      name: "Imobiliária Demo",
      slug: "imobiliaria-demo",
      license_type: LicenseType.PROFESSIONAL,
      is_active: true,
    },
  });
  console.log("✅ Created Demo company");

  // Create areas for Demo company
  const demo_area_names = [
    "Vendas",
    "Locação",
    "Lançamentos",
    "Alto Padrão",
    "Médio Padrão",
    "Parcerias",
  ];

  const demo_areas = await Promise.all(
    demo_area_names.map((name) =>
      prisma.area.upsert({
        where: {
          company_id_name: {
            company_id: demo_company.id,
            name,
          },
        },
        update: {},
        create: {
          name,
          company_id: demo_company.id,
        },
      })
    )
  );

  console.log("✅ Created demo areas");

  // Hash password
  const password_hash = await bcrypt.hash("123456", 12);

  // Create Super Admin user
  await prisma.user.upsert({
    where: { email: "admin@nfloor.com" },
    update: {},
    create: {
      email: "admin@nfloor.com",
      password_hash,
      name: "Super Admin",
      access_level: AccessLevel.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      company_id: nfloor_company.id,
    },
  });
  console.log("✅ Created Super Admin user");

  // Create Director user
  await prisma.user.upsert({
    where: { email: "diretor@demo.com" },
    update: {},
    create: {
      email: "diretor@demo.com",
      password_hash,
      name: "Carlos Diretor",
      access_level: AccessLevel.DIRECTOR,
      status: UserStatus.ACTIVE,
      company_id: demo_company.id,
    },
  });
  console.log("✅ Created Director user");

  async function upsert_demo_user(params: {
    email: string;
    name: string;
    access_level: AccessLevel;
    area_id?: string;
  }) {
    return prisma.user.upsert({
      where: { email: params.email },
      update: {},
      create: {
        email: params.email,
        password_hash,
        name: params.name,
        access_level: params.access_level,
        status: UserStatus.ACTIVE,
        company_id: demo_company.id,
        area_id: params.area_id,
      },
    });
  }

  async function upsert_area_manager(user_id: string, area_id: string) {
    return prisma.areaManager.upsert({
      where: {
        user_id_area_id: { user_id, area_id },
      },
      update: {},
      create: { user_id, area_id },
    });
  }

  // Keep legacy demo accounts for convenience
  const superintendent_legacy = await upsert_demo_user({
    email: "superintendente@demo.com",
    name: "Ana Superintendente",
    access_level: AccessLevel.SUPERINTENDENT,
    area_id: demo_areas[0].id,
  });

  const manager_legacy = await upsert_demo_user({
    email: "gerente@demo.com",
    name: "Roberto Gerente",
    access_level: AccessLevel.MANAGER,
    area_id: demo_areas[0].id,
  });

  const seller_legacy_1 = await upsert_demo_user({
    email: "vendedor1@demo.com",
    name: "Maria Vendedora",
    access_level: AccessLevel.SELLER,
    area_id: demo_areas[0].id,
  });

  const seller_legacy_2 = await upsert_demo_user({
    email: "vendedor2@demo.com",
    name: "João Vendedor",
    access_level: AccessLevel.SELLER,
    area_id: demo_areas[1].id,
  });

  // 3 superintendents managing different sets of areas
  const superintendents = await Promise.all(
    [
      {
        email: "super1@demo.com",
        name: "Fernanda Superintendente",
        area_ids: [demo_areas[0].id, demo_areas[1].id],
      },
      {
        email: "super2@demo.com",
        name: "Bruno Superintendente",
        area_ids: [demo_areas[2].id, demo_areas[3].id],
      },
      {
        email: "super3@demo.com",
        name: "Paula Superintendente",
        area_ids: [demo_areas[4].id, demo_areas[5].id],
      },
    ].map(async (s) => {
      const user = await upsert_demo_user({
        email: s.email,
        name: s.name,
        access_level: AccessLevel.SUPERINTENDENT,
        area_id: s.area_ids[0],
      });
      await Promise.all(s.area_ids.map((area_id) => upsert_area_manager(user.id, area_id)));
      return { user, area_ids: s.area_ids };
    })
  );

  await Promise.all([
    upsert_area_manager(superintendent_legacy.id, demo_areas[0].id),
    upsert_area_manager(superintendent_legacy.id, demo_areas[1].id),
  ]);

  // 6 managers (1 per area)
  const managers = await Promise.all(
    demo_areas.map((area, index) =>
      upsert_demo_user({
        email: `gerente${index + 1}@demo.com`,
        name: `Gerente ${index + 1}`,
        access_level: AccessLevel.MANAGER,
        area_id: area.id,
      })
    )
  );
  await Promise.all(managers.map((m) => (m.area_id ? upsert_area_manager(m.id, m.area_id) : Promise.resolve())));
  await upsert_area_manager(manager_legacy.id, demo_areas[0].id);

  // 20 sellers distributed across areas
  const seller_specs = Array.from({ length: 20 }, (_, i) => {
    const area = demo_areas[i % demo_areas.length];
    const n = i + 1;
    return {
      email: `vendedor${n + 2}@demo.com`,
      name: `Vendedor ${n}`,
      area_id: area.id,
    };
  });

  const sellers = await Promise.all(
    seller_specs.map((s) =>
      upsert_demo_user({
        email: s.email,
        name: s.name,
        access_level: AccessLevel.SELLER,
        area_id: s.area_id,
      })
    )
  );

  console.log("✅ Created demo org users (director/superintendents/managers/sellers)");

  const diretor = await prisma.user.findUnique({ where: { email: "diretor@demo.com" } });
  const superintendente = await prisma.user.findUnique({ where: { email: "superintendente@demo.com" } });
  const gerente = await prisma.user.findUnique({ where: { email: "gerente@demo.com" } });
  const vendedor_1 = await prisma.user.findUnique({ where: { email: "vendedor1@demo.com" } });
  const vendedor_2 = await prisma.user.findUnique({ where: { email: "vendedor2@demo.com" } });

  if (!diretor || !superintendente || !gerente || !vendedor_1 || !vendedor_2) {
    throw new Error("Seed users not found after upsert. Check user creation.");
  }

  const now = new Date();
  const one_hour_ago = new Date(now.getTime() - 60 * 60 * 1000);
  const three_hours_ago = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const twenty_five_hours_ago = new Date(now.getTime() - 25 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  async function upsert_seed_lead(params: {
    id: string;
    name: string;
    status: LeadStatus;
    seller_id: string;
    area_id: string;
    company_id: string;
  }) {
    return prisma.lead.upsert({
      where: { id: params.id },
      update: {
        name: params.name,
        status: params.status,
        seller_id: params.seller_id,
        area_id: params.area_id,
        company_id: params.company_id,
        source: LeadSource.WHATSAPP,
        phone: "+5511999999999",
        notes: "seed:dashboard",
      },
      create: {
        id: params.id,
        name: params.name,
        status: params.status,
        seller_id: params.seller_id,
        area_id: params.area_id,
        company_id: params.company_id,
        source: LeadSource.WHATSAPP,
        phone: "+5511999999999",
        notes: "seed:dashboard",
      },
    });
  }

  async function upsert_seed_conversation(params: {
    id: string;
    lead_id: string;
    seller_id: string;
    status: ConversationStatus;
    last_message_at?: Date | null;
    last_lead_message?: Date | null;
    last_seller_message?: Date | null;
  }) {
    return prisma.conversation.upsert({
      where: { id: params.id },
      update: {
        lead_id: params.lead_id,
        seller_id: params.seller_id,
        status: params.status,
        last_message_at: params.last_message_at ?? null,
        last_lead_message: params.last_lead_message ?? null,
        last_seller_message: params.last_seller_message ?? null,
        unread_count: 0,
      },
      create: {
        id: params.id,
        lead_id: params.lead_id,
        seller_id: params.seller_id,
        status: params.status,
        last_message_at: params.last_message_at ?? null,
        last_lead_message: params.last_lead_message ?? null,
        last_seller_message: params.last_seller_message ?? null,
        unread_count: 0,
      },
    });
  }

  async function upsert_seed_message(params: {
    id: string;
    conversation_id: string;
    sender_type: SenderType;
    content: string;
    created_at: Date;
    response_time?: number | null;
  }) {
    return prisma.message.upsert({
      where: { id: params.id },
      update: {
        conversation_id: params.conversation_id,
        sender_type: params.sender_type,
        content: params.content,
        created_at: params.created_at,
        response_time: params.response_time ?? null,
      },
      create: {
        id: params.id,
        conversation_id: params.conversation_id,
        sender_type: params.sender_type,
        content: params.content,
        created_at: params.created_at,
        response_time: params.response_time ?? null,
      },
    });
  }

  async function upsert_seed_playbook_score(params: {
    id: string;
    conversation_id: string;
    seller_id: string;
    score: number;
    created_at: Date;
  }) {
    return prisma.playbookScore.upsert({
      where: { id: params.id },
      update: {
        conversation_id: params.conversation_id,
        seller_id: params.seller_id,
        score: params.score,
        created_at: params.created_at,
        feedback: "seed:dashboard",
      },
      create: {
        id: params.id,
        conversation_id: params.conversation_id,
        seller_id: params.seller_id,
        score: params.score,
        created_at: params.created_at,
        feedback: "seed:dashboard",
      },
    });
  }

  async function upsert_seed_session_online(params: {
    id: string;
    user_id: string;
    token_hash: string;
  }) {
    return prisma.session.upsert({
      where: { id: params.id },
      update: {
        user_id: params.user_id,
        token_hash: params.token_hash,
        expires_at: tomorrow,
        is_online: true,
        last_heartbeat: now,
        last_used_at: now,
      },
      create: {
        id: params.id,
        user_id: params.user_id,
        token_hash: params.token_hash,
        expires_at: tomorrow,
        is_online: true,
        last_heartbeat: now,
        last_used_at: now,
      },
    });
  }

  console.log("\n📊 Creating dashboard seed data (funnel + metrics)...");

  const all_sellers = [seller_legacy_1, seller_legacy_2, ...sellers];
  const seller_area_map = new Map<string, string>();
  for (const s of all_sellers) {
    if (s.area_id) seller_area_map.set(s.id, s.area_id);
  }

  const funnel_statuses: LeadStatus[] = [
    LeadStatus.LEAD,
    LeadStatus.VISIT,
    LeadStatus.CALLBACK,
    LeadStatus.PROPOSAL,
    LeadStatus.SOLD,
  ];

  for (let seller_index = 0; seller_index < all_sellers.length; seller_index++) {
    const seller_user = all_sellers[seller_index];
    const area_id = seller_area_map.get(seller_user.id);
    if (!area_id) continue;

    // Create more volume per seller
    for (const status of funnel_statuses) {
      for (let i = 1; i <= 2; i++) {
        const lead = await upsert_seed_lead({
          id: `seed_lead_${seller_user.id}_${status}_${i}`,
          name: `Seed ${seller_user.name} - ${status} ${i}`,
          status,
          seller_id: seller_user.id,
          area_id,
          company_id: demo_company.id,
        });

        const lead_message_at = new Date(now.getTime() - (30 + i) * 60 * 1000);
        const seller_reply_at = new Date(lead_message_at.getTime() + (90 + seller_index * 5) * 1000);

        const conversation = await upsert_seed_conversation({
          id: `seed_conv_${seller_user.id}_${status}_${i}`,
          lead_id: lead.id,
          seller_id: seller_user.id,
          status: ConversationStatus.ACTIVE,
          last_message_at: seller_reply_at,
          last_lead_message: lead_message_at,
          last_seller_message: seller_reply_at,
        });

        await upsert_seed_message({
          id: `seed_msg_${conversation.id}_lead_1`,
          conversation_id: conversation.id,
          sender_type: SenderType.LEAD,
          content: "Olá, tenho interesse.",
          created_at: lead_message_at,
        });

        await upsert_seed_message({
          id: `seed_msg_${conversation.id}_seller_1`,
          conversation_id: conversation.id,
          sender_type: SenderType.SELLER,
          content: "Oi! Posso ajudar sim.",
          created_at: seller_reply_at,
          response_time: 120,
        });

        await upsert_seed_playbook_score({
          id: `seed_score_${conversation.id}`,
          conversation_id: conversation.id,
          seller_id: seller_user.id,
          score: status === LeadStatus.SOLD ? 9.2 : 7.0 + (seller_index % 4) * 0.4,
          created_at: seller_reply_at,
        });
      }
    }

    // 2h and 24h waiting response examples
    const lead_2h = await upsert_seed_lead({
      id: `seed_lead_${seller_user.id}_WAIT_2H`,
      name: `Seed ${seller_user.name} - WAITING_RESPONSE_2H`,
      status: LeadStatus.LEAD,
      seller_id: seller_user.id,
      area_id,
      company_id: demo_company.id,
    });
    await upsert_seed_conversation({
      id: `seed_conv_${seller_user.id}_WAIT_2H`,
      lead_id: lead_2h.id,
      seller_id: seller_user.id,
      status: ConversationStatus.WAITING_RESPONSE,
      last_message_at: three_hours_ago,
      last_lead_message: three_hours_ago,
      last_seller_message: yesterday,
    });

    const lead_24h = await upsert_seed_lead({
      id: `seed_lead_${seller_user.id}_WAIT_24H`,
      name: `Seed ${seller_user.name} - WAITING_RESPONSE_24H`,
      status: LeadStatus.LEAD,
      seller_id: seller_user.id,
      area_id,
      company_id: demo_company.id,
    });
    await upsert_seed_conversation({
      id: `seed_conv_${seller_user.id}_WAIT_24H`,
      lead_id: lead_24h.id,
      seller_id: seller_user.id,
      status: ConversationStatus.WAITING_RESPONSE,
      last_message_at: twenty_five_hours_ago,
      last_lead_message: twenty_five_hours_ago,
      last_seller_message: yesterday,
    });
  }

  // Mark a few sellers online
  const online_sellers = all_sellers.slice(0, 5);
  for (const s of online_sellers) {
    await upsert_seed_session_online({
      id: `seed_session_${s.id}`,
      user_id: s.id,
      token_hash: `seed_token_${s.id}`,
    });
  }

  console.log("✅ Created dashboard funnel + metrics seed data");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin:      admin@nfloor.com        / 123456");
  console.log("Diretor:          diretor@demo.com        / 123456");
  console.log("Superintendente:  superintendente@demo.com / 123456");
  console.log("Gerente:          gerente@demo.com        / 123456");
  console.log("Vendedor 1:       vendedor1@demo.com      / 123456");
  console.log("Vendedor 2:       vendedor2@demo.com      / 123456");
  console.log("Superintendentes: super1@demo.com, super2@demo.com, super3@demo.com / 123456");
  console.log("Gerentes:         gerente1@demo.com ... gerente6@demo.com / 123456");
  console.log("Vendedores:       vendedor3@demo.com ... vendedor22@demo.com / 123456");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
