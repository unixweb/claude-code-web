// Database helper for SQLite operations
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), 'data', 'dev.db');

export function getDb() {
  return new Database(dbPath);
}

// Device operations
export interface Device {
  id: string;
  name: string;
  color: string;
  ownerId: string | null;
  isActive: number;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  icon: string | null;
}

export const deviceDb = {
  findAll: (): Device[] => {
    const db = getDb();
    const devices = db.prepare('SELECT * FROM Device WHERE isActive = 1').all() as Device[];
    db.close();
    return devices;
  },

  findById: (id: string): Device | null => {
    const db = getDb();
    const device = db.prepare('SELECT * FROM Device WHERE id = ?').get(id) as Device | undefined;
    db.close();
    return device || null;
  },

  create: (device: { id: string; name: string; color: string; ownerId: string | null; description?: string; icon?: string }): Device => {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO Device (id, name, color, ownerId, isActive, description, icon, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      device.id,
      device.name,
      device.color,
      device.ownerId,
      device.description || null,
      device.icon || null
    );

    const created = db.prepare('SELECT * FROM Device WHERE id = ?').get(device.id) as Device;
    db.close();
    return created;
  },

  update: (id: string, data: { name?: string; color?: string; description?: string; icon?: string }): Device | null => {
    const db = getDb();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }

    if (updates.length === 0) {
      db.close();
      return deviceDb.findById(id);
    }

    updates.push('updatedAt = datetime(\'now\')');
    values.push(id);

    const sql = `UPDATE Device SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updated = db.prepare('SELECT * FROM Device WHERE id = ?').get(id) as Device | undefined;
    db.close();
    return updated || null;
  },

  delete: (id: string): boolean => {
    const db = getDb();
    const result = db.prepare('UPDATE Device SET isActive = 0, updatedAt = datetime(\'now\') WHERE id = ?').run(id);
    db.close();
    return result.changes > 0;
  },
};

// User operations
export interface User {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export const userDb = {
  findAll: (): User[] => {
    const db = getDb();
    const users = db.prepare('SELECT * FROM User').all() as User[];
    db.close();
    return users;
  },

  findById: (id: string): User | null => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM User WHERE id = ?').get(id) as User | undefined;
    db.close();
    return user || null;
  },

  findByUsername: (username: string): User | null => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM User WHERE username = ?').get(username) as User | undefined;
    db.close();
    return user || null;
  },

  create: (user: { id: string; username: string; email: string | null; passwordHash: string; role: string }): User => {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO User (id, username, email, passwordHash, role, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      user.id,
      user.username,
      user.email,
      user.passwordHash,
      user.role
    );

    const created = db.prepare('SELECT * FROM User WHERE id = ?').get(user.id) as User;
    db.close();
    return created;
  },

  update: (id: string, data: { username?: string; email?: string | null; passwordHash?: string; role?: string }): User | null => {
    const db = getDb();

    const updates: string[] = [];
    const values: any[] = [];

    if (data.username !== undefined) {
      updates.push('username = ?');
      values.push(data.username);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.passwordHash !== undefined) {
      updates.push('passwordHash = ?');
      values.push(data.passwordHash);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      values.push(data.role);
    }

    if (updates.length === 0) {
      db.close();
      return userDb.findById(id);
    }

    updates.push('updatedAt = datetime(\'now\')');
    values.push(id);

    const sql = `UPDATE User SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updated = db.prepare('SELECT * FROM User WHERE id = ?').get(id) as User | undefined;
    db.close();
    return updated || null;
  },

  delete: (id: string): boolean => {
    const db = getDb();
    const result = db.prepare('DELETE FROM User WHERE id = ?').run(id);
    db.close();
    return result.changes > 0;
  },
};
