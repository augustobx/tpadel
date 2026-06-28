import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  await prisma.systemSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, topbarName: 'T-Padel', splashLogo: 'T-Padel', splashName: 'T-Padel' },
  });
  console.log("Settings seeded via raw PrismaClient");
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
