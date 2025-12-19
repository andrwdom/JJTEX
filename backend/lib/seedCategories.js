// backend/lib/seedCategories.js
import Category from '../models/Category.js';
import { slugify, taxonomy } from './taxonomy.js';

async function ensureCategory({ name, slugOverride, parentDoc, order, active = true, hasChildren = false }) {
  const finalSlug = slugify(slugOverride || name);
  const path = parentDoc ? `${parentDoc.path}/${finalSlug}` : finalSlug;
  const ancestors = parentDoc
    ? [ ...(parentDoc.ancestors || []), { _id: parentDoc._id, name: parentDoc.name, slug: parentDoc.slug } ]
    : [];

  // Idempotent by path
  let doc = await Category.findOne({ path });
  if (!doc) {
    doc = new Category({
      name,
      slug: finalSlug,
      parent: parentDoc ? parentDoc._id : null,
      path,
      ancestors,
      order: typeof order === 'number' ? order : 0,
      isLeaf: !hasChildren,
      active: !!active
    });
    await doc.save();

    if (parentDoc && parentDoc.isLeaf) {
      await Category.updateOne({ _id: parentDoc._id }, { $set: { isLeaf: false } });
    }
  } else {
    // Keep existing doc consistent
    const update = {};
    if (doc.name !== name) update.name = name;
    if (doc.slug !== finalSlug) update.slug = finalSlug;
    if (String(doc.parent || '') !== String(parentDoc?._id || '')) update.parent = parentDoc ? parentDoc._id : null;
    if (doc.order !== order) update.order = typeof order === 'number' ? order : 0;
    if (doc.active !== !!active) update.active = !!active;
    if (doc.isLeaf !== !hasChildren) update.isLeaf = !hasChildren;
    if (Array.isArray(doc.ancestors) || ancestors.length) update.ancestors = ancestors;

    if (Object.keys(update).length) {
      await Category.updateOne({ _id: doc._id }, { $set: update });
      doc = await Category.findById(doc._id);
    }
  }

  return doc.toObject();
}

async function processNode(node, parentDoc = null) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const selfDoc = await ensureCategory({
    name: node.name,
    slugOverride: node.slug,
    parentDoc,
    order: node._order || 0,
    active: node.active !== undefined ? node.active : true,
    hasChildren
  });

  if (hasChildren) {
    let idx = 0;
    for (const child of node.children) {
      child._order = idx++;
      await processNode(child, selfDoc);
    }
  }
}

/**
 * Seed the category taxonomy into the DB.
 *
 * @param {object} opts
 * @param {boolean} [opts.reset=false] If true, clears all categories first.
 * @param {object} [opts.logger=console] Logger with info/warn/error.
 */
export async function seedCategories(opts = {}) {
  const { reset = false, logger = console } = opts;

  if (reset) {
    logger.warn?.('[Categories] Reset enabled: deleting all categories...');
    await Category.deleteMany({});
  }

  let idx = 0;
  for (const top of taxonomy) {
    top._order = idx++;
    await processNode(top, null);
  }

  logger.info?.('[Categories] Taxonomy seeding completed.');
}



