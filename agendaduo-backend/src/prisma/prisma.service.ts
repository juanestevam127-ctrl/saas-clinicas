import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function buildPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL não está definida nas variáveis de ambiente!');
  }

  try {
    const dbUrl = new URL(connectionString);
    
    // Decodifica usuário e senha que podem ter caracteres especiais URL-encoded (%40 = @, %23 = #, etc.)
    const user = decodeURIComponent(dbUrl.username);
    const password = decodeURIComponent(dbUrl.password);
    const host = dbUrl.hostname;
    const port = dbUrl.port ? parseInt(dbUrl.port, 10) : 5432;
    const database = dbUrl.pathname.replace(/^\//, '');
    
    const sslEnabled = 
      connectionString.includes('sslmode=require') ||
      connectionString.includes('ssl=true');

    console.log(`[Prisma] Conectando em ${host}:${port}/${database} com usuário "${user}"`);

    return new Pool({
      user,
      password,
      host,
      port,
      database,
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    });
  } catch (e) {
    console.error('[Prisma] Erro ao parsear DATABASE_URL:', e);
    throw e;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = buildPool();
    const adapter = new PrismaPg(pool);
    
    super({
      adapter,
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
