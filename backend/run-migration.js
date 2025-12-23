import 'dotenv/config';
import db from './src/config/database.js';
import { users, businesses } from './src/config/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Finding users with existing businesses...');

    // Get all owner IDs from businesses
    const businessOwners = await db.select({ ownerId: businesses.ownerId }).from(businesses);
    const ownerIds = [...new Set(businessOwners.map(b => b.ownerId))];

    if (ownerIds.length === 0) {
      console.log('No existing businesses found.');
      return;
    }

    console.log(`Found ${ownerIds.length} users with businesses. Updating hasCompletedSetup...`);

    // Update hasCompletedSetup for these users
    for (const ownerId of ownerIds) {
      await db.update(users)
        .set({ hasCompletedSetup: true })
        .where(eq(users.id, ownerId));
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
