import mongoose from 'mongoose';
import 'dotenv/config';
import Category from '../models/Category.js';
import connectDB from '../config/mongodb.js';

const OLD_SLUGS = [
  'maternity-feeding-wear',
  'zipless-feeding-lounge-wear',
  'non-feeding-lounge-wear',
  'zipless-feeding-dupatta-lounge-wear'
];

async function run() {
  await connectDB();
  try {
    const res = await Category.updateMany(
      { slug: { $in: OLD_SLUGS } },
      { $set: { active: false } }
    );
    console.log(`Deprecated ${res.modifiedCount} old categories`);
  } catch (e) {
    console.error('Deprecation failed:', e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();


