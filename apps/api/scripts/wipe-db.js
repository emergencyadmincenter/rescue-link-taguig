const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log('Starting database wipe...');

  try {
    // TRUNCATE empties tables incredibly fast and keeps the schema/enums intact.
    // CASCADE ensures related rows in connected tables are also safely dropped.
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        "users",
        "roles",
        "permissions",
        "user_roles",
        "role_permissions",
        "user_tokens",
        "logs",
        "incident_categories",
        "resources",
        "log_resource_assignments",
        "calls",
        "messages",
        "fraud_assessments",
        "shadow_bans",
        "quarantined_emergency_requests",
        "internal_conversations",
        "internal_conversation_participants",
        "internal_messages"
      CASCADE;
    `);

    console.log(
      '✅ Successfully wiped all data from the database. Schema retained.',
    );
  } catch (error) {
    console.error('❌ Error wiping the database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
