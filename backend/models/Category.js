import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
	name: { type: String, required: true },
	slug: { type: String, required: true },
	description: String,
	image: String,

	// Hierarchy
	parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
	path: { type: String, default: '' }, // e.g., 'women/ethnic-wear/kurtas-kurtis'
	ancestors: [{
		_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
		name: String,
		slug: String
	}],
	order: { type: Number, default: 0 },
	isLeaf: { type: Boolean, default: true },
	active: { type: Boolean, default: true },

	// Metrics
	productCount: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now }
}, {
	timestamps: true
});

// Indexes for fast lookups and unique constraints
categorySchema.index({ path: 1 }, { unique: true, sparse: true });
categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ name: 1, parent: 1 }, { unique: true, sparse: true });
categorySchema.index({ slug: 1, parent: 1 }, { unique: true, sparse: true, name: 'slug_parent_unique' });
	categorySchema.index({ 'ancestors._id': 1 });

export default mongoose.model('Category', categorySchema);