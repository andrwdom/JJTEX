import multer from "multer";
import path from "path";
import fs from "fs";
import { config } from "../config.js";

// SECURITY: Secure file upload configuration with MIME type and size validation
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Resolve base upload directory from env/config with production-first fallback
        const baseUploads =
            (config.uploadPath && path.isAbsolute(config.uploadPath)
                ? config.uploadPath
                : path.resolve(process.cwd(), config.uploadPath || "uploads"));

        // Use different folders for products and carousel
        const subFolder = req.baseUrl.includes("carousel") ? "carousel" : "products";
        const targetDir = path.join(baseUploads, subFolder);

        // Ensure directory exists
        try {
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
        } catch (e) {
            return cb(e);
        }

        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        // SECURITY: Generate filename; prefer including product customId or name
        const originalExt = path.extname(file.originalname) || '';

        // Build a safe slug from provided fields (if any)
        const sourceName = (req.body?.customId || req.body?.name || 'product')
            .toString()
            .trim()
            .toLowerCase();

        // Simple slugify without external deps
        const safeSlug = sourceName
            .normalize('NFKD')               // normalize accents
            .replace(/[\u0300-\u036f]/g, '') // remove diacritics
            .replace(/[^a-z0-9]+/g, '-')     // non-alphanumeric to dashes
            .replace(/^-+|-+$/g, '')         // trim dashes
            .substring(0, 60) || 'product';

        const timestamp = Date.now();
        const rand = Math.round(Math.random() * 1e9);
        const filename = `${safeSlug}-${timestamp}-${rand}${originalExt}`;

        cb(null, filename);
    }
});

// SECURITY: File type validation - only allow safe image formats
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
]);

const fileFilter = (req, file, cb) => {
    // SECURITY: Validate MIME type and reject unsafe files
    if (allowedMimeTypes.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Only JPEG, PNG, and WebP images are accepted.`), false);
    }
};

// SECURITY: Configure multer with security limits
// Note: We allow more files to support color variant images (multiple colors x images)
const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 24 // Allow up to 24 images per request (legacy + variants)
    }
});

export default upload;