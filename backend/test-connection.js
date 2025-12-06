import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

console.log('Testing Neon connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
  console.log('\n✅ Connection successful!');
  console.log('Current time:', result.rows[0].current_time);
  console.log('PostgreSQL version:', result.rows[0].pg_version);
} catch (error) {
  console.error('\n❌ Connection failed:');
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
} finally {
  await pool.end();
}
