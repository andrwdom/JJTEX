import fs from "fs";
import path from "path";
import { config } from "../config.js";

function resolveUploadsProductsDir() {
  const baseUploads = process.env.UPLOAD_PATH || config.uploadPath || "./uploads";
  const absBase = path.isAbsolute(baseUploads)
    ? baseUploads
    : path.resolve(process.cwd(), baseUploads);
  return path.join(absBase, "products");
}

function safeBasename(p) {
  // Prevent path traversal: only keep the last path segment.
  return path.basename(String(p || "").replace(/\\/g, "/"));
}

function extractFilenameFromImageRef(imageRef) {
  if (!imageRef || typeof imageRef !== "string") return null;

  // Strip querystring/hash
  const raw = imageRef.split(/[?#]/)[0];

  // If it's a full URL, use URL parsing to get pathname.
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname;
    }
  } catch {
    pathname = raw;
  }

  // Supported formats we may store in DB:
  // - https://domain.com/images/products/<filename>
  // - /images/products/<filename>
  // - /uploads/products/<filename>
  // - <filename>
  const markers = ["/images/products/", "/uploads/products/", "images/products/", "uploads/products/"];
  for (const marker of markers) {
    const idx = pathname.indexOf(marker);
    if (idx !== -1) {
      const candidate = pathname.substring(idx + marker.length);
      return safeBasename(candidate);
    }
  }

  // Fallback: treat as a path or filename
  return safeBasename(pathname);
}

function listVariantFilenames(dir, filename) {
  const safeName = safeBasename(filename);
  const { name: base } = path.parse(safeName);
  if (!base) return [];

  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }

  // Delete:
  // - the exact filename
  // - any variant with the same basename (e.g. .webp + .png + .jpg + .jfif)
  return entries.filter((f) => f === safeName || f.startsWith(`${base}.`));
}

/**
 * Delete product images from disk, including all variants for each stored image reference.
 * Never throws: returns a summary.
 */
export function deleteProductImagesFromDisk(images) {
  const uploadDir = resolveUploadsProductsDir();

  const refs = Array.isArray(images) ? images : [];
  const summary = {
    uploadDir,
    deleted: [],
    missing: [],
    errors: [],
  };

  if (!fs.existsSync(uploadDir)) {
    summary.errors.push(`Upload directory not found: ${uploadDir}`);
    return summary;
  }

  for (const ref of refs) {
    const filename = extractFilenameFromImageRef(ref);
    if (!filename) continue;

    const variants = listVariantFilenames(uploadDir, filename);
    if (variants.length === 0) {
      summary.missing.push(filename);
      continue;
    }

    for (const v of variants) {
      const filePath = path.join(uploadDir, v);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          summary.deleted.push(v);
        } else {
          summary.missing.push(v);
        }
      } catch (e) {
        summary.errors.push(`${v}: ${e?.message || String(e)}`);
      }
    }
  }

  return summary;
}


