import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: false },
	cartData: { type: Object, default: {} },
	isAdmin: { type: Boolean, default: false },
	role: { type: String, enum: ['user', 'admin'], default: 'user' } // Backward-compatible role field
}, { minimize: false })

// 🔧 FIX: Add performance indexes for frequently queried fields
// Note: email index already exists via unique: true in schema
userSchema.index({ isAdmin: 1 }); // For admin role queries
userSchema.index({ role: 1 }); // Optional role field for newer code paths
userSchema.index({ createdAt: -1 }); // For user creation date queries

const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel