import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });
const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('MIGRATION OK');
} catch (err) {
  console.error('MIGRATION FAILED:', err);
} finally {
  await sql.end();
}
