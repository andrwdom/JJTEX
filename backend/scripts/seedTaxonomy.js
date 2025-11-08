import mongoose from 'mongoose';
import 'dotenv/config';
import Category from '../models/Category.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shitha';

function slugify(str) {
	return String(str || '')
		.toLowerCase()
		.trim()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

// Exact taxonomy from Andrew
const taxonomy = [
  {
    name: 'Types For Kids', // keep slug simple
    slug: 'kids',
    children: [
      {
        name: 'Girls Clothing',
        children: [
          { name: 'Dresses & Jumpsuits' },
          { name: 'Tops & Tees' },
          { name: 'Ethnic Wear' },
          { name: 'Skirts & Shorts' },
          { name: 'Jeans' },
          { name: 'Clothing set' },
          { name: 'Innerwear' }
        ]
      },
      {
        name: 'Boys clothing',
        children: [
          { name: 'Tshirt' },
          { name: 'Clothing set' },
          { name: 'Ethnic Wear' },
          { name: 'Bottoms' },
          { name: 'Shirts' },
          { name: 'Jeans' },
          { name: 'Innerwear' }
        ]
      },
      {
        name: 'Baby Clothing',
        children: [
          { name: 'Rompers & Body Suits' },
          { name: 'Clothing Set' },
          { name: 'Dresses' },
          { name: 'T shirt & Tops' },
          { name: 'Bottoms' },
          { name: 'Girls set' },
          { name: 'Accessories' }
        ]
      },
      {
        name: 'Teens',
        children: [
          { name: 'T-shirt' },
          { name: 'Shirts' },
          { name: 'Jeans' },
          { name: 'Ethnic Wear' },
          { name: 'Bottoms' },
          { name: 'Dresses & Jumpsuit' },
          { name: 'Tops and tees' },
          { name: 'Innerwear' }
        ]
      }
    ]
  },
  {
    name: 'TYPES FOR WOMAN',
    slug: 'women',
    children: [
      {
        name: 'Ethnic Wear',
        children: [
          { name: 'Kurtas & Kurtis' },
          { name: 'Kurta set' },
          { name: 'Traditional saree' },
          { name: 'Party wear saree' },
          { name: 'Blouses' },
          { name: 'Lehengas' },
          { name: 'Dupattas' },
          { name: 'Dress materials' }
        ]
      },
      {
        name: 'Western Wear',
        children: [
          { name: 'Tops' },
          { name: 'Tees' },
          { name: 'Dresses' },
          { name: 'Jumpsuit' },
          { name: 'Shirts' },
          { name: 'Jeans' },
          { name: 'Sleepwear' }
        ]
      },
      {
        name: 'Jewellery',
        children: [
          { name: 'Earings' },
          { name: 'Ring' }
        ]
      }
    ]
  }
];

async function ensureCategory({ name, parentDoc, order }) {
	const slug = slugify(name);
	const path = parentDoc ? `${parentDoc.path}/${slug}` : slug;

	// Try to find by path (idempotent)
	let doc = await Category.findOne({ path });
	if (!doc) {
		const ancestors = parentDoc ? [ ...(parentDoc.ancestors || []), { _id: parentDoc._id, name: parentDoc.name, slug: parentDoc.slug } ] : [];
		doc = new Category({
			name,
			slug,
			parent: parentDoc ? parentDoc._id : null,
			path,
			ancestors,
			order: typeof order === 'number' ? order : 0,
			isLeaf: true,
			active: true
		});
		await doc.save();
		if (parentDoc && parentDoc.isLeaf) {
			await Category.updateOne({ _id: parentDoc._id }, { $set: { isLeaf: false } });
		}
	} else {
		// Update basic fields on existing doc for consistency
		const update = {};
		if (doc.name !== name) update.name = name;
		if (doc.slug !== slug) update.slug = slug;
		if (doc.order !== order) update.order = order;
		if (Object.keys(update).length) {
			await Category.updateOne({ _id: doc._id }, { $set: update });
			doc = await Category.findById(doc._id);
		}
	}
	return doc.toObject();
}

async function processNode(node, parentDoc = null) {
	const selfDoc = await ensureCategory({ name: node.name, parentDoc, order: node._order || 0 });
	if (Array.isArray(node.children) && node.children.length) {
		let idx = 0;
		for (const child of node.children) {
			child._order = idx++;
			await processNode(child, selfDoc);
		}
	}
}

async function seedTaxonomy() {
	await mongoose.connect(MONGO_URI);
	try {
		let idx = 0;
		for (const top of taxonomy) {
			top._order = idx++;
			await processNode(top, null);
		}
		console.log('✅ Taxonomy seeding completed.');
	} catch (err) {
		console.error('❌ Taxonomy seeding failed:', err);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
}

seedTaxonomy();


