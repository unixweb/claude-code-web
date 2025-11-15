# Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+ installed
- Prisma CLI installed (`npm install -g prisma`)

## Option 1: Local PostgreSQL

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql:
CREATE DATABASE location_tracker;
CREATE USER tracker_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE location_tracker TO tracker_user;
\q
```

### 3. Configure Environment

Add to `.env.local`:
```env
DATABASE_URL="postgresql://tracker_user:your-secure-password@localhost:5432/location_tracker"
```

## Option 2: Docker PostgreSQL

### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: location-tracker-db
    environment:
      POSTGRES_DB: location_tracker
      POSTGRES_USER: tracker_user
      POSTGRES_PASSWORD: your-secure-password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Configure Environment

Add to `.env.local`:
```env
DATABASE_URL="postgresql://tracker_user:your-secure-password@localhost:5432/location_tracker"
```

## Option 3: Cloud PostgreSQL (Recommended for Production)

### Supabase (Free Tier)

1. Sign up at https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string
5. Add to `.env.production`:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
```

### Railway (Free Tier)

1. Sign up at https://railway.app
2. Create new project → PostgreSQL
3. Copy DATABASE_URL from Variables tab
4. Add to `.env.production`

### Neon (Serverless Postgres)

1. Sign up at https://neon.tech
2. Create project
3. Copy connection string
4. Add to `.env.production`

## Prisma Setup

### 1. Install Dependencies

```bash
npm install prisma @prisma/client
npm install -D prisma
```

### 2. Initialize Prisma (Already done - schema.prisma exists)

```bash
npx prisma generate
```

### 3. Run Migrations

```bash
# Create initial migration
npx prisma migrate dev --name init

# Or reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### 4. Seed Initial Data (Optional)

Create `prisma/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin);

  // Create devices
  const device10 = await prisma.device.upsert({
    where: { id: '10' },
    update: {},
    create: {
      id: '10',
      name: 'Joachim Pixel',
      color: '#e74c3c',
      ownerId: admin.id,
    },
  });

  const device11 = await prisma.device.upsert({
    where: { id: '11' },
    update: {},
    create: {
      id: '11',
      name: 'Huawei Smartphone',
      color: '#3498db',
      ownerId: admin.id,
    },
  });

  console.log('Created devices:', device10, device11);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

## Prisma Studio (Database GUI)

```bash
npx prisma studio
```

Opens at http://localhost:5555

## Common Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create migration
npx prisma migrate dev --name description_of_changes

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database
npx prisma studio

# Format schema
npx prisma format
```

## Troubleshooting

### Connection refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list                # macOS

# Check port
sudo lsof -i :5432
```

### Migration fails

```bash
# Reset and try again
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Permission denied

```sql
-- In psql as postgres user:
ALTER DATABASE location_tracker OWNER TO tracker_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tracker_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tracker_user;
```

## Next Steps

After database is set up:

1. Update `lib/devices.ts` to fetch from database
2. Update `lib/auth.ts` to use database for users
3. Implement Device CRUD API routes
4. Migrate location data from NocoDB (optional)

See `MIGRATION.md` for migrating existing NocoDB data.
