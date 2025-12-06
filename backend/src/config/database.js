import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create Neon serverless connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Initialize Drizzle ORM with the pool, schema, and WebSocket
const db = drizzle({
  client: pool,
  schema,
  ws,
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await pool.end();
});

console.log('✅ Drizzle ORM initialized with Neon');

export { pool };
export default db;
