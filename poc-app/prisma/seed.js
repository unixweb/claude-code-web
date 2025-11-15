// Seed script to populate initial data
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const { randomUUID } = require('crypto');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('🌱 Seeding database...');

async function seed() {
  // Hash admin password
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminId = randomUUID();

  // Insert admin user
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO User (id, username, email, passwordHash, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  insertUser.run(
    adminId,
    'admin',
    'admin@localhost',
    passwordHash,
    'ADMIN'
  );

  console.log('✅ Admin user created (username: admin, password: admin123)');

  // Insert devices from lib/devices.ts
  const insertDevice = db.prepare(`
    INSERT OR REPLACE INTO Device (id, name, color, ownerId, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  insertDevice.run('10', 'Joachim Pixel', '#e74c3c', adminId, 1);
  insertDevice.run('11', 'Huawei Smartphone', '#3498db', adminId, 1);

  console.log('✅ Devices created:');
  console.log('   - Device 10: Joachim Pixel (red)');
  console.log('   - Device 11: Huawei Smartphone (blue)');

  db.close();
  console.log('🎉 Seeding completed!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
