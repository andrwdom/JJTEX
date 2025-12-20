/**
 * Fix product image URLs in MongoDB to match files on disk.
 *
 * Why: Older records may contain URLs like ".../images/products/<name>.webp"
 * even when the saved file is actually .png/.jpg/.jfif (optimization failed).
 *
 * Usage:
 *   cd backend
 *   node scripts/fix-product-image-urls.js --apply
 *
 * Without --apply it runs in dry-run mode and prints what it WOULD change.
 */

import fs from "fs";
import path from "path";
import "../config.js"; // loads backend/.env early
import productModel from "../models/productModel.js";
import connectDB from "../config/mongodb.js";

const APPLY = process.argv.includes("--apply");

const BASE_URL = process.env.BASE_URL || "https://jjtextiles.com";
const UPLOAD_PATH = process.env.UPLOAD_PATH || "./uploads";
const uploadBase = path.isAbsolute(UPLOAD_PATH)
  ? UPLOAD_PATH
  : path.resolve(process.cwd(), UPLOAD_PATH);
const productsDir = path.join(uploadBase, "products");

const preferredExts = [".webp", ".png", ".jpg", ".jpeg", ".jfif"];

function safeBasename(p) {
  return path.basename(String(p || "").replace(/\\/g, "/"));
}

function extractFilenameFromUrl(imageRef) {
  if (!imageRef || typeof imageRef !== "string") return null;
  const raw = imageRef.split(/[?#]/)[0];
  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) pathname = new URL(raw).pathname;
  } catch {
    pathname = raw;
  }
  const markers = ["/images/products/", "/uploads/products/", "images/products/", "uploads/products/"];
  for (const m of markers) {
    const idx = pathname.indexOf(m);
    if (idx !== -1) return safeBasename(pathname.substring(idx + m.length));
  }
  return safeBasename(pathname);
}

function findExistingVariant(filename) {
  const safeName = safeBasename(filename);
  const exact = path.join(productsDir, safeName);
  if (fs.existsSync(exact)) return safeName;

  const base = path.parse(safeName).name;
  if (!base) return null;

  // Try preferred extensions first
  for (const ext of preferredExts) {
    const candidate = `${base}${ext}`;
    if (fs.existsSync(path.join(productsDir, candidate))) return candidate;
  }

  // Fallback: any file matching base.*
  try {
    const files = fs.readdirSync(productsDir);
    const any = files.find((f) => f.startsWith(`${base}.`));
    return any || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("📌 BASE_URL:", BASE_URL);
  console.log("📁 Products dir:", productsDir);
  console.log("🧪 Mode:", APPLY ? "APPLY" : "DRY-RUN");

  if (!fs.existsSync(productsDir)) {
    throw new Error(`Products upload directory does not exist: ${productsDir}`);
  }

  await connectDB();

  const cursor = productModel.find({}, { images: 1, customId: 1, name: 1 }).cursor();

  let checked = 0;
  let updated = 0;

  for await (const p of cursor) {
    checked++;
    if (!Array.isArray(p.images) || p.images.length === 0) continue;

    let changed = false;
    const newImages = p.images.map((img) => {
      const filename = extractFilenameFromUrl(img);
      if (!filename) return img;

      const resolved = findExistingVariant(filename);
      if (!resolved) return img; // no file found on disk; keep as-is

      const nextUrl = `${BASE_URL}/images/products/${resolved}`;
      if (nextUrl !== img) changed = true;
      return nextUrl;
    });

    if (changed) {
      updated++;
      console.log(`🔧 Would update [${p.customId || p._id}] ${p.name || ""}`);
      console.log("   from:", p.images);
      console.log("   to:  ", newImages);

      if (APPLY) {
        await productModel.updateOne({ _id: p._id }, { $set: { images: newImages } });
      }
    }
  }

  console.log(`✅ Done. Checked: ${checked}, would-update: ${updated}`);
  if (!APPLY) console.log("Run again with --apply to write changes.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});


