import mongoose from 'mongoose';
import 'dotenv/config';
import connectDB from '../config/mongodb.js';
import Category from '../models/Category.js';
import ShippingRules from '../models/ShippingRules.js';

// Deactivate legacy categories and remove legacy shipping rules (data cleanup)
const LEGACY_CATEGORY_SLUGS = [
  'maternity-feeding-wear',
  'zipless-feeding-lounge-wear',
  'non-feeding-lounge-wear',
  'zipless-feeding-dupatta-lounge-wear'
];

async function run() {
  await connectDB();
  try {
    const catRes = await Category.updateMany(
      { slug: { $in: LEGACY_CATEGORY_SLUGS } },
      { $set: { active: false } }
    );

    const rulesRes = await ShippingRules.deleteMany({ category: { $in: LEGACY_CATEGORY_SLUGS } });

    console.log('✅ Legacy cleanup completed:', {
      categoriesDeactivated: catRes.modifiedCount,
      shippingRulesRemoved: rulesRes.deletedCount
    });
  } catch (e) {
    console.error('❌ Legacy cleanup failed:', e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();



