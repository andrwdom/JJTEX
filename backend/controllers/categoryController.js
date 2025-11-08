import Category from '../models/Category.js';
import productModel from '../models/productModel.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';

function slugify(str) {
	return String(str || '')
		.toLowerCase()
		.trim()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildTree(nodes) {
	const byId = new Map(nodes.map(n => [String(n._id), { ...n, children: [] }]));
	const roots = [];
	for (const node of byId.values()) {
		if (node.parent) {
			const parent = byId.get(String(node.parent));
			if (parent) parent.children.push(node);
			else roots.push(node);
		} else {
			roots.push(node);
		}
	}
	// sort by order then name within each level
	const sortFn = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name);
	const sortTree = (arr) => {
		arr.sort(sortFn);
		for (const item of arr) sortTree(item.children);
	};
	sortTree(roots);
	return roots;
}

export const getAllCategories = async (req, res) => {
    try {
        // 🔧 FIX: Use aggregation pipeline for better performance instead of multiple DB calls
		const categoriesWithCount = await Category.aggregate([
            {
                $lookup: {
                    from: 'products', // Collection name for products
                    localField: 'slug',
                    foreignField: 'categorySlug',
                    as: 'products'
                }
            },
            {
                $addFields: {
					productCount: { $size: '$products' }
                }
            },
            {
                $project: {
                    products: 0 // Remove the products array from response
                }
            },
            {
                $sort: { name: 1 }
            }
        ]);
        
        successResponse(res, categoriesWithCount, 'Categories fetched successfully');
    } catch (error) {
        console.error('Get All Categories Error:', error);
        errorResponse(res, 500, error.message);
    }
};

export const getCategoryBySlug = async (req, res) => {
    try {
        // 🔧 FIX: Use aggregation pipeline for better performance
		const categoriesWithCount = await Category.aggregate([
            {
                $match: { slug: req.params.slug }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'slug',
                    foreignField: 'categorySlug',
                    as: 'products'
                }
            },
            {
                $addFields: {
					productCount: { $size: '$products' }
                }
            },
            {
                $project: {
                    products: 0
                }
            }
        ]);
        
        if (categoriesWithCount.length === 0) {
            return errorResponse(res, 404, 'Category not found');
        }
        
        successResponse(res, categoriesWithCount[0], 'Category fetched successfully');
    } catch (error) {
        console.error('Get Category By Slug Error:', error);
        errorResponse(res, 500, error.message);
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { page = 1, limit = 1000, sortBy = 'createdAt', search, minPrice, maxPrice } = req.query;
        
		const category = await Category.findOne({ slug: req.params.slug });
        if (!category) {
            return errorResponse(res, 404, 'Category not found');
        }

		// Build filter object (supports non-leaf categories by including descendants)
		let filter = {};
		if (category.isLeaf) {
			filter.categorySlug = category.slug;
		} else {
			const descendants = await Category.find({ 'ancestors._id': category._id }).select('slug').lean();
			const slugs = [category.slug, ...descendants.map(d => d.slug)];
			filter.categorySlug = { $in: slugs };
		}
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Build sort object
        const sort = {};
        if (sortBy === 'createdAt') sort.createdAt = -1;
        if (sortBy === 'rating') sort.rating = -1;
        if (sortBy === 'price') sort.price = 1;
        if (sortBy === 'name') sort.name = 1;
        if (sortBy === 'date') sort.date = -1;

        const skip = (page - 1) * limit;
        const products = await productModel.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));
        
        const total = await productModel.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        paginatedResponse(res, products, total, page, totalPages, 'Products fetched successfully');
    } catch (error) {
        console.error('Get Products By Category Error:', error);
        errorResponse(res, 500, error.message);
    }
};

export const getCategoryTree = async (req, res) => {
	try {
		// fetch categories and product counts in one aggregation
		const docs = await Category.aggregate([
			{ $match: { active: true } },
			{
				$lookup: {
					from: 'products',
					localField: 'slug',
					foreignField: 'categorySlug',
					as: 'products'
				}
			},
			{
				$addFields: {
					productCount: { $size: '$products' }
				}
			},
			{ $project: { products: 0 } }
		]);

		const tree = buildTree(docs.map(d => ({
			_id: d._id,
			name: d.name,
			slug: d.slug,
			path: d.path,
			parent: d.parent,
			order: d.order ?? 0,
			isLeaf: !!d.isLeaf,
			productCount: d.productCount ?? 0
		})));

		successResponse(res, tree, 'Category tree fetched successfully');
	} catch (error) {
		console.error('Get Category Tree Error:', error);
		errorResponse(res, 500, error.message);
	}
};

export const getCategoryByPath = async (req, res) => {
	try {
		const rawPath = req.params.path || '';
		const normalizedPath = slugify(rawPath).replace(/\/+/g, '/');
		const category = await Category.findOne({ path: normalizedPath }).lean();
		if (!category) {
			return errorResponse(res, 404, 'Category not found');
		}
		const breadcrumbs = [...(category.ancestors || []).map(a => ({
			name: a.name, slug: a.slug, path: (a.path || null)
		})), { name: category.name, slug: category.slug, path: category.path }];

		const children = await Category.find({ parent: category._id, active: true })
			.select('_id name slug path order isLeaf')
			.sort({ order: 1, name: 1 })
			.lean();

		successResponse(res, { category, breadcrumbs, children }, 'Category fetched successfully');
	} catch (error) {
		console.error('Get Category By Path Error:', error);
		errorResponse(res, 500, error.message);
	}
};

export const addCategory = async (req, res) => {
    try {
		const { name, slug, description, image, parentId, order, active = true } = req.body;
		if (!name) {
            return errorResponse(res, 400, 'Name and slug are required');
        }
		const finalSlug = slug ? slugify(slug) : slugify(name);

		const exists = await Category.findOne({ slug: finalSlug });
        if (exists) {
            return errorResponse(res, 400, 'Category with this slug already exists');
        }

		let parent = null;
		let ancestors = [];
		let path = finalSlug;

		if (parentId) {
			parent = await Category.findById(parentId).lean();
			if (!parent) return errorResponse(res, 400, 'Invalid parent category');
			ancestors = [ ...(parent.ancestors || []), { _id: parent._id, name: parent.name, slug: parent.slug } ];
			path = parent.path ? `${parent.path}/${finalSlug}` : `${parent.slug}/${finalSlug}`;
		}

		const category = new Category({ 
			name, 
			slug: finalSlug, 
			description, 
			image,
			parent: parent ? parent._id : null,
			path,
			ancestors,
			order: typeof order === 'number' ? order : 0,
			isLeaf: true,
			active: !!active
		});

		// Save and update parent isLeaf if needed
        await category.save();
		if (parent) {
			await Category.updateOne({ _id: parent._id }, { $set: { isLeaf: false } });
		}

        successResponse(res, category, 'Category added successfully');
    } catch (error) {
        console.error('Add Category Error:', error);
        errorResponse(res, 500, error.message);
    }
}; 