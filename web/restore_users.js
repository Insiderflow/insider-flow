const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const backup = JSON.parse(fs.readFileSync('data_backup.json','utf8'));
    const users = backup.users || [];
    if (!users.length) {
      console.log('No users in backup');
      process.exit(0);
    }
    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      password_hash: u.password_hash,
      email_verified: !!u.email_verified,
      email_verification_token: u.email_verification_token || null,
      password_reset_token: u.password_reset_token || null,
      password_reset_expires: u.password_reset_expires ? new Date(u.password_reset_expires) : null,
      created_at: new Date(u.created_at),
      updated_at: new Date(u.updated_at),
      notification_settings: u.notification_settings || null,
    }));
    const res = await prisma.user.createMany({ data, skipDuplicates: true });
    console.log('Users inserted:', res.count);
  } catch (e) {
    console.error('Restore users failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
