import { PrismaClient, AccessLevel, LicenseType, UserStatus } from "@prisma/client";
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
  const area_vendas = await prisma.area.upsert({
    where: {
      company_id_name: {
        company_id: demo_company.id,
        name: "Vendas",
      },
    },
    update: {},
    create: {
      name: "Vendas",
      company_id: demo_company.id,
    },
  });

  const area_locacao = await prisma.area.upsert({
    where: {
      company_id_name: {
        company_id: demo_company.id,
        name: "Locação",
      },
    },
    update: {},
    create: {
      name: "Locação",
      company_id: demo_company.id,
    },
  });
  console.log("✅ Created areas");

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

  // Create Superintendent user
  const superintendent = await prisma.user.upsert({
    where: { email: "superintendente@demo.com" },
    update: {},
    create: {
      email: "superintendente@demo.com",
      password_hash,
      name: "Ana Superintendente",
      access_level: AccessLevel.SUPERINTENDENT,
      status: UserStatus.ACTIVE,
      company_id: demo_company.id,
      area_id: area_vendas.id,
    },
  });

  // Assign managed areas to superintendent
  await prisma.areaManager.upsert({
    where: {
      user_id_area_id: {
        user_id: superintendent.id,
        area_id: area_vendas.id,
      },
    },
    update: {},
    create: {
      user_id: superintendent.id,
      area_id: area_vendas.id,
    },
  });

  await prisma.areaManager.upsert({
    where: {
      user_id_area_id: {
        user_id: superintendent.id,
        area_id: area_locacao.id,
      },
    },
    update: {},
    create: {
      user_id: superintendent.id,
      area_id: area_locacao.id,
    },
  });
  console.log("✅ Created Superintendent user with managed areas");

  // Create Manager user
  const manager = await prisma.user.upsert({
    where: { email: "gerente@demo.com" },
    update: {},
    create: {
      email: "gerente@demo.com",
      password_hash,
      name: "Roberto Gerente",
      access_level: AccessLevel.MANAGER,
      status: UserStatus.ACTIVE,
      company_id: demo_company.id,
      area_id: area_vendas.id,
    },
  });

  await prisma.areaManager.upsert({
    where: {
      user_id_area_id: {
        user_id: manager.id,
        area_id: area_vendas.id,
      },
    },
    update: {},
    create: {
      user_id: manager.id,
      area_id: area_vendas.id,
    },
  });
  console.log("✅ Created Manager user");

  // Create Seller users
  await prisma.user.upsert({
    where: { email: "vendedor1@demo.com" },
    update: {},
    create: {
      email: "vendedor1@demo.com",
      password_hash,
      name: "Maria Vendedora",
      access_level: AccessLevel.SELLER,
      status: UserStatus.ACTIVE,
      company_id: demo_company.id,
      area_id: area_vendas.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "vendedor2@demo.com" },
    update: {},
    create: {
      email: "vendedor2@demo.com",
      password_hash,
      name: "João Vendedor",
      access_level: AccessLevel.SELLER,
      status: UserStatus.ACTIVE,
      company_id: demo_company.id,
      area_id: area_locacao.id,
    },
  });
  console.log("✅ Created Seller users");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Super Admin:      admin@nfloor.com        / 123456");
  console.log("Diretor:          diretor@demo.com        / 123456");
  console.log("Superintendente:  superintendente@demo.com / 123456");
  console.log("Gerente:          gerente@demo.com        / 123456");
  console.log("Vendedor 1:       vendedor1@demo.com      / 123456");
  console.log("Vendedor 2:       vendedor2@demo.com      / 123456");
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
