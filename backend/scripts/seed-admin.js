import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';
import connectDB from '../config/mongodb.js';
import mongoose from 'mongoose';

dotenv.config();

// SECURITY: Script to create admin user with proper credentials
async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jjtextiles.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    if (!adminEmail || !adminPassword) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email: adminEmail, role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create admin user
    const adminUser = new userModel({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully');
    console.log(`   Email: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  } finally {
    // Ensure process exits after connection closes
    try { await mongoose.disconnect(); } catch {}
  }
}

// Run the seeding
seedAdmin().then(() => {
  console.log('🎯 Admin seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Admin seeding failed:', error);
  process.exit(1);
}); 