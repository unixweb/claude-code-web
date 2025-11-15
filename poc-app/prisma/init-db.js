// Script to manually initialize SQLite database
// This creates the tables based on our Prisma schema

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');
const db = new Database(dbPath);

console.log('Creating SQLite database at:', dbPath);

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'VIEWER' CHECK(role IN ('ADMIN', 'VIEWER')),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastLoginAt DATETIME
  );

  CREATE INDEX IF NOT EXISTS User_username_idx ON User(username);
  CREATE INDEX IF NOT EXISTS User_email_idx ON User(email);

  -- Sessions table
  CREATE TABLE IF NOT EXISTS Session (
    id TEXT PRIMARY KEY,
    sessionToken TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    expires DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS Session_userId_idx ON Session(userId);

  -- Devices table
  CREATE TABLE IF NOT EXISTS Device (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#95a5a6',
    ownerId TEXT,
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    icon TEXT,
    FOREIGN KEY (ownerId) REFERENCES User(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS Device_ownerId_idx ON Device(ownerId);
  CREATE INDEX IF NOT EXISTS Device_isActive_idx ON Device(isActive);
`);

console.log('✅ Database tables created successfully!');

db.close();
