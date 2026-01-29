import fs from "fs";
import path from "path";
import imageOptimizer from '../utils/imageOptimizer.js';
import productModel from '../models/productModel.js';
import Category from '../models/Category.js';
import { deleteProductImagesFromDisk } from '../utils/productImageCleanup.js';


// GET /api/products/:id or /api/products/custom/:customId - RESTful single product fetch
export const getProductById = async (req, res) => {
    try {
        console.log('🔧 DEBUG: getProductById called with ID:', req.params.id);
        console.log('🔧 DEBUG: Query params:', req.query);
        
        let product;
        if (req.params.id && req.params.id.length === 24) {
            product = await productModel.findById(req.params.id).lean();
            console.log('🔧 DEBUG: Found by MongoDB ID:', product ? 'Yes' : 'No');
        }
        if (!product && req.params.id) {
            // Try fetching by customId
            product = await productModel.findOne({ customId: req.params.id }).lean();
            console.log('🔧 DEBUG: Found by customId:', product ? 'Yes' : 'No');
        }
        if (!product) {
            console.log('🔧 DEBUG: Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }
        
        console.log('🔧 DEBUG: Product found - sizes before processing:', JSON.stringify(product.sizes, null, 2));
        console.log('🔧 DEBUG: Product name:', product.name);
        console.log('🔧 DEBUG: Product customId:', product.customId);
        
        // 🔑 CRITICAL FIX: Calculate available stock (stock - reserved) for each size
        if (product.sizes && Array.isArray(product.sizes)) {
            product.sizes = product.sizes.map(sizeObj => ({
                ...sizeObj,
                availableStock: Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0)),
                // Keep original values for reference
                originalStock: sizeObj.stock || 0,
                reserved: sizeObj.reserved || 0
            }));
        }
        
        console.log('🔧 DEBUG: Product sizes after processing:', JSON.stringify(product.sizes, null, 2));
        console.log('🔧 DEBUG: Total sizes count:', product.sizes ? product.sizes.length : 0);
        
        // Add cache busting headers
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        res.status(200).json({ product });
    } catch (error) {
        console.error('Get Product By ID Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/products/category/:category or /api/products?category=...
export const getAllProducts = async (req, res) => {
    try {
        const category = req.params.category || req.query.category;
        console.log('GET /api/products category query:', category);
        const {
            page = 1,
            limit = 1000,
            search,
            isNewArrival,
            isBestSeller,
            sortBy = 'createdAt',
            minPrice,
            maxPrice,
            categorySlug,
            size,
            sleeveType
        } = req.query;
        const filter = {};
        if (category) {
            console.log('Filtering by category:', category);
            filter.categorySlug = category.toLowerCase();
        }
        if (categorySlug) {
            console.log('Filtering by categorySlug:', categorySlug);
            filter.categorySlug = categorySlug;
        }
        if (isNewArrival) filter.isNewArrival = isNewArrival === 'true';
        if (isBestSeller) filter.isBestSeller = isBestSeller === 'true';
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Size filtering - check if the size exists in availableSizes array AND has stock
        if (size) {
            console.log('Filtering by size:', size);
            // Filter products that have the selected size AND have stock for that size
            filter['sizes'] = {
                $elemMatch: {
                    'size': size,
                    'stock': { $gt: 0 }
                }
            };
        }
        
        // Sleeve type filtering removed (deprecated)
        
        // Debug logging removed for production performance
        
        // --- Sorting logic update for displayOrder ---
        const sortField = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const sort = { [sortField]: sortOrder };
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // 🔧 PRODUCTION OPTIMIZATION: Use parallel queries for better performance
        const [total, products] = await Promise.all([
            productModel.countDocuments(filter),
            productModel.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .lean()
        ]);
            
        // Always include customId and calculate available stock in the response
        const productsWithCustomId = products.map(p => {
            const product = { ...p, customId: p.customId };
            
            // 🔑 CRITICAL FIX: Calculate available stock (stock - reserved) for each size
            if (product.sizes && Array.isArray(product.sizes)) {
                product.sizes = product.sizes.map(sizeObj => ({
                    ...sizeObj,
                    availableStock: Math.max(0, (sizeObj.stock || 0) - (sizeObj.reserved || 0)),
                    // Keep original values for reference
                    originalStock: sizeObj.stock || 0,
                    reserved: sizeObj.reserved || 0
                }));
            }
            
            return product;
        });
        
        // Debug logging removed for production performance
        
        res.status(200).json({ 
            products: productsWithCustomId,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum
        });
    } catch (error) {
        console.error('Get All Products Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// List all products with filtering, sorting, and pagination
export const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 24;
        const skip = (page - 1) * limit;

        const {
            search,
            categorySlug,
            size,
            minPrice,
            maxPrice,
            sortBy = 'displayOrder',
            sortOrder = 'asc',
            stockFilter // Add stock filter support
        } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { customId: { $regex: search, $options: 'i' } }
            ];
        }

        // Enhanced category filtering - handle both categorySlug and category fields
        if (categorySlug) {
            // First try to find by categorySlug
            const categoryBySlug = await Category.findOne({ slug: categorySlug });
            if (categoryBySlug) {
                // Use both categorySlug and category name for comprehensive filtering
                query.$or = [
                    { categorySlug: categorySlug },
                    { category: categoryBySlug.name }
                ];
            } else {
                // Fallback to direct categorySlug match
                query.categorySlug = categorySlug;
            }
        }

        if (size) {
            query['sizes.size'] = size;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) {
                query.price.$gte = parseInt(minPrice);
            }
            if (maxPrice) {
                query.price.$lte = parseInt(maxPrice);
            }
        }

        // Enhanced stock filtering at database level
        if (stockFilter === 'low') {
            // Products with total stock between 1-3
            query.$expr = {
                $and: [
                    { $gt: [{ $sum: '$sizes.stock' }, 0] },
                    { $lte: [{ $sum: '$sizes.stock' }, 3] }
                ]
            };
        } else if (stockFilter === 'out') {
            // Products with zero total stock
            query.$expr = {
                $eq: [{ $sum: '$sizes.stock' }, 0]
            };
        }
        
        // Enhanced sorting with fallbacks
        const sortOptions = {};
        if (sortBy === 'displayOrder') {
            // Primary sort by displayOrder, secondary by createdAt
            sortOptions.displayOrder = sortOrder === 'desc' ? -1 : 1;
            sortOptions.createdAt = sortOrder === 'desc' ? -1 : 1;
        } else {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
            // Add displayOrder as secondary sort for consistency
            if (sortBy !== 'displayOrder') {
                sortOptions.displayOrder = 1;
            }
        }

        // Use aggregation pipeline for better performance and consistency
        const pipeline = [
            { $match: query },
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: limit }
        ];

        const products = await productModel.aggregate(pipeline);
        const total = await productModel.countDocuments(query);
        const pages = Math.ceil(total / limit);

        // Add debugging info for admin panel
        console.log(`API Query - Page: ${page}, Limit: ${limit}, Category: ${categorySlug}, Total: ${total}, Pages: ${pages}`);

        res.json({ 
            success: true, 
            products, 
            total, 
            pages,
            currentPage: page,
            limit: limit,
            hasNextPage: page < pages,
            hasPrevPage: page > 1
        });
    } catch (error) {
        console.error("Error in listProducts:", error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
};

// Add product
export const addProduct = async (req, res) => {
    try {
        console.log('Add Product Request Body:', req.body);
        console.log('Add Product Files:', req.files);
        console.log('Files type:', Array.isArray(req.files) ? 'Array' : typeof req.files);
        if (Array.isArray(req.files)) {
            console.log('Files array length:', req.files.length);
            console.log('Files fieldnames:', req.files.map(f => f.fieldname));
        } else if (req.files) {
            console.log('Files object keys:', Object.keys(req.files));
        }
        console.log('Raw sizes value:', req.body.sizes);
        console.log('Raw availableSizes value:', req.body.availableSizes);

        const { customId, name, description, price, category, subCategory, type, sizes, bestseller, originalPrice, categorySlug, features, isNewArrival, isBestSeller, availableSizes, stock, sleeveType, color, colorName, colorVariants } = req.body

        // Validate required fields
        if (!customId) {
            return res.status(400).json({ success: false, message: "Custom product ID is required" });
        }
        if (!name || !description || !price || !category) {
            console.log('Missing fields:', {
                customId: !customId,
                name: !name,
                description: !description,
                price: !price,
                category: !category
            });
            return res.status(400).json({ 
                success: false, 
                message: "Missing required fields",
                missing: {
                    customId: !customId,
                    name: !name,
                    description: !description,
                    price: !price,
                    category: !category
                }
            });
        }

        // Validate price is a number
        if (isNaN(Number(price)) || Number(price) <= 0) {
            console.log('Invalid price:', price);
            return res.status(400).json({
                success: false,
                message: "Price must be a positive number"
            });
        }

        // Validate sizes
        let parsedSizes;
        try {
            console.log('Raw sizes:', sizes);
            parsedSizes = JSON.parse(sizes);
            if (!Array.isArray(parsedSizes)) {
                console.log('Sizes is not an array:', parsedSizes);
                throw new Error('Sizes must be an array');
            }
            if (parsedSizes.length === 0) {
                console.log('Sizes array is empty');
                return res.status(400).json({
                    success: false,
                    message: "At least one size must be selected"
                });
            }
            
            // Validate that at least one size has stock > 0
            const sizesWithStock = parsedSizes.filter(s => s.stock > 0);
            if (sizesWithStock.length === 0) {
                console.log('No sizes with stock > 0 found');
                return res.status(400).json({
                    success: false,
                    message: "At least one size must have stock greater than 0"
                });
            }
            
            console.log('Parsed sizes:', parsedSizes);
        } catch (error) {
            console.error('Sizes parsing error:', error);
            return res.status(400).json({
                success: false,
                message: "Invalid sizes format",
                error: error.message
            });
        }

        // Parse availableSizes if provided
        let parsedAvailableSizes = [];
        if (availableSizes) {
            try {
                parsedAvailableSizes = JSON.parse(availableSizes);
                if (!Array.isArray(parsedAvailableSizes)) {
                    throw new Error('availableSizes must be an array');
                }
            } catch (error) {
                console.error('availableSizes parsing error:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableSizes format",
                    error: error.message
                });
            }
        }

        // Parse color variants if provided
        let parsedColorVariants = [];
        let useColorVariants = false;
        
        if (colorVariants) {
            try {
                parsedColorVariants = JSON.parse(colorVariants);
                if (Array.isArray(parsedColorVariants) && parsedColorVariants.length > 0) {
                    useColorVariants = true;
                    console.log('Color variants found:', parsedColorVariants.length);
                }
            } catch (error) {
                console.error('Color variants parsing error:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid color variants format",
                    error: error.message
                });
            }
        }

        // Helper function to get file by fieldname (works with both multer.fields and multer.any)
        const getFileByFieldname = (fieldname) => {
            if (!req.files) return undefined;
            // If req.files is an array (multer.any), search by fieldname
            if (Array.isArray(req.files)) {
                return req.files.find(f => f.fieldname === fieldname);
            }
            // If req.files is an object (multer.fields), access directly
            return req.files[fieldname]?.[0];
        };

        const image1 = getFileByFieldname('image1');
        const image2 = getFileByFieldname('image2');
        const image3 = getFileByFieldname('image3');
        const image4 = getFileByFieldname('image4');

        console.log('Image files:', { image1, image2, image3, image4 });
        console.log('All files:', req.files);

        // If using color variants, process variant images instead
        let images = [];
        let imagesUrl = [];
        let processedColorVariants = [];

        if (useColorVariants) {
            // Process variant images
            console.log('🔄 Processing color variant images...');
            console.log('📦 Received files:', req.files ? (Array.isArray(req.files) ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname })) : Object.keys(req.files)) : 'No files');
            console.log('📦 Color variants to process:', parsedColorVariants.length);
            const baseUploads = process.env.UPLOAD_PATH || './uploads';
            const uploadDir = path.join(path.isAbsolute(baseUploads) ? baseUploads : path.resolve(process.cwd(), baseUploads), 'products');
            const baseUrl = process.env.BASE_URL || 'https://jjtextiles.com';

            for (let variantIndex = 0; variantIndex < parsedColorVariants.length; variantIndex++) {
                const variant = parsedColorVariants[variantIndex];
                const variantImages = [];
                
                console.log(`🔍 Looking for images for variant ${variantIndex} (${variant.colorName})...`);
                
                // Get images for this variant
                // First, find all files that start with variant_X_ to see what we have
                if (Array.isArray(req.files)) {
                    const variantFiles = req.files.filter(f => f.fieldname && f.fieldname.startsWith(`variant_${variantIndex}_image_`));
                    console.log(`  📁 All files for variant ${variantIndex}:`, variantFiles.map(f => f.fieldname));
                }
                
                for (let imgIndex = 0; imgIndex < 4; imgIndex++) {
                    const fileKey = `variant_${variantIndex}_image_${imgIndex}`;
                    // Handle both multer.any() (array) and multer.fields() (object) formats
                    let file;
                    if (Array.isArray(req.files)) {
                        file = req.files.find(f => f.fieldname === fileKey);
                        if (!file) {
                            console.log(`  ⚠️ File not found: ${fileKey}`);
                        } else {
                            console.log(`  ✅ Found file: ${fileKey} (${file.originalname})`);
                        }
                    } else {
                        file = req.files?.[fileKey]?.[0];
                    }
                    if (file) {
                        variantImages.push(file);
                    }
                }
                
                console.log(`📸 Variant ${variantIndex} has ${variantImages.length} images`);

                if (variantImages.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Color variant "${variant.colorName || variantIndex + 1}" must have at least one image`
                    });
                }

                // Optimize variant images
                try {
                    const optimizationResult = await imageOptimizer.optimizeMultipleImages(variantImages, uploadDir);
                    const variantImageUrls = optimizationResult.optimizedFiles.map(img => 
                        `${baseUrl}/images/products/${img.filename}`
                    );

                    processedColorVariants.push({
                        color: variant.color,
                        colorName: variant.colorName,
                        images: variantImageUrls,
                        isDefault: variant.isDefault || false
                    });
                } catch (error) {
                    console.error(`Error optimizing variant ${variantIndex} images:`, error);
                    return res.status(500).json({
                        success: false,
                        message: `Failed to process images for variant "${variant.colorName}"`,
                        error: error.message
                    });
                }
            }

            // Use first variant's images as main product images (for backward compatibility)
            if (processedColorVariants.length > 0) {
                const defaultVariant = processedColorVariants.find(v => v.isDefault) || processedColorVariants[0];
                imagesUrl = defaultVariant.images;
            }
        } else {
            // Legacy: use regular image uploads
            images = [image1, image2, image3, image4].filter((item) => item !== undefined);

            if (images.length === 0) {
                console.log('No images provided');
                return res.status(400).json({ 
                    success: false, 
                    message: "At least one image is required" 
                });
            }
        }

        // Optimize images (only if not using color variants)
        let optimizationResult;
        let optimizedFiles;
        let results;
        let stats;
        
        if (!useColorVariants) {
            console.log('🔄 Starting image optimization...');
            // Resolve uploads/products directory via env/config
            const baseUploads = process.env.UPLOAD_PATH || './uploads';
            const uploadDir = path.join(path.isAbsolute(baseUploads) ? baseUploads : path.resolve(process.cwd(), baseUploads), 'products');
            
            try {
                optimizationResult = await imageOptimizer.optimizeMultipleImages(images, uploadDir);
                optimizedFiles = optimizationResult.optimizedFiles;
                results = optimizationResult.results;
                stats = imageOptimizer.getOptimizationStats(results);
            } catch (error) {
                console.error('❌ Image optimization failed:', error);
                // Use fallback - keep original files
                optimizedFiles = images;
                results = images.map(img => ({
                    originalName: img.originalname,
                    optimizedName: img.filename,
                    originalSize: '0 Bytes',
                    optimizedSize: '0 Bytes',
                    compressionRatio: 0,
                    processingTime: 0,
                    success: true,
                    error: null
                }));
                stats = {
                    totalFiles: images.length,
                    successful: images.length,
                    failed: 0,
                    avgCompressionRatio: 0,
                    totalProcessingTime: 0
                };
            }

            console.log('📊 FAST Image Optimization Summary:');
            console.log(`   Total files: ${stats.totalFiles}`);
            console.log(`   Successful: ${stats.successful}`);
            console.log(`   Failed: ${stats.failed}`);
            console.log(`   Average compression: ${stats.avgCompressionRatio}%`);
            console.log(`   Total processing time: ${stats.totalProcessingTime}ms`);

            // Build image URLs using the actual saved filename.
            const baseUrl = process.env.BASE_URL || 'https://jjtextiles.com';
            imagesUrl = optimizedFiles.map(img => `${baseUrl}/images/products/${img.filename}`);

            console.log('📊 Image URLs generated:', imagesUrl);
        }

        // Parse features if provided
        let parsedFeatures = [];
        if (features) {
            try {
                parsedFeatures = JSON.parse(features);
                if (!Array.isArray(parsedFeatures)) {
                    throw new Error('Features must be an array');
                }
            } catch (error) {
                console.error('Features parsing error:', error);
                return res.status(400).json({
                    success: false,
                    message: "Invalid features format",
                    error: error.message
                });
            }
        }

        // Ensure both bestseller and isBestSeller are set for compatibility
        const bestsellerValue = (bestseller === "true" || isBestSeller === "true") ? true : false;

        // Sleeve type is deprecated - ignore if provided

        const productData = {
            customId,
            name,
            description,
            category,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            subCategory: subCategory || "",
            type: type || "",
            categorySlug: categorySlug || "",
            bestseller: bestsellerValue,
            isBestSeller: bestsellerValue,
            isNewArrival: isNewArrival === "true" ? true : false,
            sizes: parsedSizes,
            availableSizes: parsedAvailableSizes,
            features: parsedFeatures,
            images: imagesUrl,
            color: color || "",
            colorName: colorName || "",
            colorVariants: useColorVariants ? processedColorVariants : [],
            date: Date.now(),
            stock: stock !== undefined ? Number(stock) : 0,
            // Sleeve type is deprecated - not included
        }

        // After parsing sizes, always sync main stock field
        const totalStock = Array.isArray(parsedSizes) ? parsedSizes.reduce((sum, s) => sum + (s.stock || 0), 0) : 0;
        productData.stock = totalStock;

        console.log('Creating product with data:', productData);

        const product = new productModel(productData);
        await product.save();

        console.log('Product saved successfully:', product._id);

        // Return response with optimization stats
        res.status(201).json({ 
            product,
            imageOptimization: {
                stats,
                details: results.map(result => ({
                    originalName: result.originalName,
                    optimizedName: result.optimizedName,
                    originalSize: imageOptimizer.formatFileSize(result.originalSize),
                    optimizedSize: imageOptimizer.formatFileSize(result.optimizedSize),
                    compressionRatio: result.compressionRatio,
                    processingTime: result.processingTime
                }))
            }
        });
    } catch (error) {
        console.error('Add Product Error:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to add product';
        let statusCode = 500;
        
        if (error.name === 'ValidationError') {
            errorMessage = 'Product validation failed: ' + error.message;
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'Product ID already exists. Please use a unique ID.';
            statusCode = 400;
        } else if (error.message.includes('ENOENT')) {
            errorMessage = 'File system error. Please check server configuration.';
            statusCode = 500;
        } else if (error.message.includes('permission')) {
            errorMessage = 'Permission denied. Please check file permissions.';
            statusCode = 500;
        }
        
        res.status(statusCode).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// function for removing product
export const removeProduct = async (req, res) => {
    console.log('req.method:', req.method, 'req.originalUrl:', req.originalUrl, 'req.params:', req.params);
    console.log('DELETE params:', req.params, 'body:', req.body, 'query:', req.query);
    try {
        const id = req.params.id;
        if (!id) {
            return res.json({ success: false, message: "Product ID is required" });
        }
        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }
        // Delete associated image files from VPS disk (all variants)
        const cleanup = deleteProductImagesFromDisk(product.images);
        if (cleanup.errors.length) {
            console.warn('⚠️ Product image cleanup errors:', cleanup);
        }
        await productModel.findByIdAndDelete(id);
        res.json({ success: true, message: "Product Removed Successfully" })
    } catch (error) {
        console.error('Remove Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to remove product" })
    }
}

// function for single product info
export const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product })
    } catch (error) {
        console.error('Single Product Error:', error);
        res.json({ success: false, message: error.message || "Failed to fetch product" })
    }
}

// PUT /api/products/:id - Update product
export const updateProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const { customId, name, description, price, category, subCategory, type, sizes, bestseller, originalPrice, categorySlug, features, isNewArrival, isBestSeller, stock, sleeveType, color, colorName } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // If customId is being updated, check uniqueness
        if (customId && customId !== product.customId) {
            const exists = await productModel.findOne({ customId });
            if (exists) {
                return res.status(400).json({ success: false, message: "Custom product ID already exists" });
            }
            product.customId = customId;
        }

        // Sleeve type is deprecated - ignore if provided

        // Parse features if provided
        let parsedFeatures = product.features || [];
        if (features) {
            try {
                parsedFeatures = JSON.parse(features);
                if (!Array.isArray(parsedFeatures)) {
                    throw new Error('Features must be an array');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid features format",
                    error: error.message
                });
            }
        }

        // 🔧 FIX: Validate price if provided to prevent negative totals
        if (price !== undefined) {
            const numericPrice = Number(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Price must be a positive number"
                });
            }
            // 🔧 REMOVED: Minimum price restriction for testing purposes
            // Users can now set any price >= 1 for testing
        }

        // Handle image uploads if provided
        let imagesUrl = product.images;
        let imageOptimizationStats = null;
        
        // Helper function to get file by fieldname (works with both multer.fields and multer.any)
        const getFileByFieldname = (fieldname) => {
            if (!req.files) return undefined;
            // If req.files is an array (multer.any), search by fieldname
            if (Array.isArray(req.files)) {
                return req.files.find(f => f.fieldname === fieldname);
            }
            // If req.files is an object (multer.fields), access directly
            return req.files[fieldname]?.[0];
        };
        
        if (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0)) {
            const image1 = getFileByFieldname('image1');
            const image2 = getFileByFieldname('image2');
            const image3 = getFileByFieldname('image3');
            const image4 = getFileByFieldname('image4');

            const newImages = [image1, image2, image3, image4].filter((item) => item !== undefined)

            if (newImages.length > 0) {
                try {
                    // Optimize new images
                    console.log('🔄 Starting image optimization for update...');
                    const baseUploads = process.env.UPLOAD_PATH || './uploads';
                    const uploadDir = path.join(path.isAbsolute(baseUploads) ? baseUploads : path.resolve(process.cwd(), baseUploads), 'products');
                    const optimizationResult = await imageOptimizer.optimizeMultipleImages(newImages, uploadDir);
                    
                    const { optimizedFiles, results } = optimizationResult;
                    const stats = imageOptimizer.getOptimizationStats(results);

                    console.log('📊 FAST Image Optimization Summary (Update):');
                    console.log(`   Total files: ${stats.totalFiles}`);
                    console.log(`   Successful: ${stats.successful}`);
                    console.log(`   Failed: ${stats.failed}`);
                    console.log(`   Average compression: ${stats.avgCompressionRatio}%`);
                    console.log(`   Total processing time: ${stats.totalProcessingTime}ms`);

                    // Build image URLs using the actual saved filename (no forced .webp)
                    const baseUrl = process.env.BASE_URL || 'https://jjtextiles.com';
                    imagesUrl = optimizedFiles.map(img => `${baseUrl}/images/products/${img.filename}`);
                    
                    // Store optimization stats for response
                    imageOptimizationStats = {
                        stats,
                        details: results.map(result => ({
                            originalName: result.originalName,
                            optimizedName: result.optimizedName,
                            originalSize: imageOptimizer.formatFileSize(result.originalSize),
                            optimizedSize: imageOptimizer.formatFileSize(result.optimizedSize),
                            compressionRatio: result.compressionRatio,
                            processingTime: result.processingTime
                        }))
                    };
                    
                } catch (error) {
                    console.error('Image optimization error in update:', error);
                    return res.status(500).json({
                        success: false,
                        message: "Failed to optimize images",
                        error: error.message
                    });
                }
            }
        }

        const updateData = {
            name: name || product.name,
            description: description || product.description,
            price: price ? Number(price) : product.price,
            originalPrice: originalPrice ? Number(originalPrice) : product.originalPrice,
            category: category || product.category,
            categorySlug: categorySlug || product.categorySlug,
            subCategory: subCategory || product.subCategory,
            type: type || product.type,
            // Ensure both bestseller and isBestSeller are set for compatibility
            bestseller: (bestseller !== undefined ? bestseller === "true" : product.bestseller) || (isBestSeller !== undefined ? isBestSeller === "true" : product.isBestSeller),
            isBestSeller: (bestseller !== undefined ? bestseller === "true" : product.bestseller) || (isBestSeller !== undefined ? isBestSeller === "true" : product.isBestSeller),
            isNewArrival: isNewArrival !== undefined ? isNewArrival === "true" : product.isNewArrival,
            features: parsedFeatures,
            images: imagesUrl,
            updatedAt: new Date(),
            ...(stock !== undefined ? { stock: Number(stock) } : {}),
            ...(color !== undefined ? { color: color } : {}),
            ...(colorName !== undefined ? { colorName: colorName } : {}),
            // If sleeveType provided, set it (allow clearing with empty string -> null)
            ...(sleeveType !== undefined
                ? { sleeveType: sleeveType ? sleeveType : null }
                : {})
        };

        // Only update sizes if explicitly provided
        if (sizes) {
            try {
                const newSizes = JSON.parse(sizes);
                if (!Array.isArray(newSizes)) throw new Error('Sizes must be an array');
                updateData.sizes = newSizes;
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid sizes format",
                    error: error.message
                });
            }
        }

        // In updateProduct, after parsing newSizes (if provided), always sync main stock field
        if (updateData.sizes) {
            updateData.stock = Array.isArray(updateData.sizes) ? updateData.sizes.reduce((sum, s) => sum + (s.stock || 0), 0) : 0;
        }

        const updatedProduct = await productModel.findByIdAndUpdate(id, updateData, { new: true });
        
        // Return response with optimization stats if images were processed
        const response = { success: true, product: updatedProduct };
        if (imageOptimizationStats) {
            response.imageOptimization = imageOptimizationStats;
        }
        
        res.status(200).json(response);

    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Batch update product order
export const reorderProducts = async (req, res) => {
  try {
    let { products, categorySlug } = req.body;
    console.log('Reorder request:', { products: products?.length, categorySlug });
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid payload: products must be an array' });
    }
    if (!categorySlug) {
      return res.status(400).json({ success: false, message: 'categorySlug is required' });
    }
    
    // Get all products in the category (both by categorySlug and category name)
    const dbProducts = await productModel.find({
      $or: [
        { categorySlug: categorySlug },
        { category: categorySlug }
      ]
    });
    
    console.log('Found products in category:', dbProducts.length);
    const dbIds = dbProducts.map(p => String(p._id));
    
    // Filter input to only those in this category
    products = products.filter(p => dbIds.includes(String(p._id)));
    console.log('Filtered products to update:', products.length);
    
    // Sort and reassign displayOrder with buffer
    products = products
      .filter(p => p._id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((p, i) => ({ ...p, displayOrder: (i + 1) * 10 }));
    // Prepare bulk ops - remove categorySlug filter to be more flexible
    const ops = products.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { displayOrder: p.displayOrder } }
      }
    }));
    
    if (ops.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products to reorder for this category' });
    }
    
    console.log('Updating products with ops:', ops.length);
    await productModel.bulkWrite(ops);
    
    // Fetch updated products to return
    const updatedProducts = await productModel.find({
      _id: { $in: products.map(p => p._id) }
    }).sort({ displayOrder: 1 });
    
    console.log('Successfully updated, updatedProducts.length:', updatedProducts.length, 'products');
    res.status(200).json({ success: true, message: 'Product order updated for category', products: updatedProducts });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Move product to top or bottom of category
export const moveProduct = async (req, res) => {
  try {
    const { productId, action, categorySlug } = req.body;
    console.log('Move product request:', { productId, action, categorySlug });
    
    if (!productId || !action || !categorySlug) {
      return res.status(400).json({ 
        success: false, 
        message: 'productId, action (top/bottom), and categorySlug are required' 
      });
    }
    
    if (!['top', 'bottom'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'action must be either "top" or "bottom"' 
      });
    }

    // Validate productId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }
    
    // Get the product to move
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Get all products in the category
    const categoryProducts = await productModel.find({
      $or: [
        { categorySlug: categorySlug },
        { category: categorySlug }
      ]
    }).sort({ displayOrder: 1 });
    
    console.log('Found products in category:', categoryProducts.length);
    
    if (categoryProducts.length === 0) {
      return res.status(400).json({ success: false, message: 'No products found in category' });
    }
    
    // Remove the product from current position
    const productsWithoutTarget = categoryProducts.filter(p => String(p._id) !== String(productId));
    
    let newOrder;
    if (action === 'top') {
      // Move to top (displayOrder: 0)
      newOrder = [
        { _id: productId, displayOrder: 0 },
        ...productsWithoutTarget.map((p, i) => ({ _id: p._id, displayOrder: (i + 1) * 10 }))
      ];
    } else {
      // Move to bottom (highest displayOrder + 10)
      const maxOrder = Math.max(...productsWithoutTarget.map(p => p.displayOrder || 0), 0);
      newOrder = [
        ...productsWithoutTarget.map((p, i) => ({ _id: p._id, displayOrder: i * 10 })),
        { _id: productId, displayOrder: maxOrder + 10 }
      ];
    }
    
    // Prepare bulk operations
    const ops = newOrder.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: { displayOrder: p.displayOrder } }
      }
    }));
    
    console.log('Updating products with ops:', ops.length);
    await productModel.bulkWrite(ops);
    
    // Fetch updated products to return
    const updatedProducts = await productModel.find({
      _id: { $in: newOrder.map(p => p._id) }
    }).sort({ displayOrder: 1 });
    
    console.log('Successfully moved product, updatedProducts.length:', updatedProducts.length);
    res.status(200).json({ 
      success: true, 
      message: `Product moved to ${action} of category`, 
      products: updatedProducts 
    });
  } catch (error) {
    console.error('Move product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};