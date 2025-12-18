import mongoose from 'mongoose';
import 'dotenv/config';
import { seedCategories } from '../lib/seedCategories.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jjtextiles';

// Usage:
//   node scripts/seedTaxonomy.js
//   node scripts/seedTaxonomy.js --reset
const reset = process.argv.includes('--reset');

async function main() {
  await mongoose.connect(MONGO_URI);
  try {
    await seedCategories({ reset, logger: console });
    console.log('✅ Category taxonomy seeding completed.');
  } catch (err) {
    console.error('❌ Category taxonomy seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();


