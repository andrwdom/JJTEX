# CATEGORY SLUG TREE - COMPLETE REFERENCE

## Understanding Category Structure

### Key Concepts:
1. **`slug`**: Individual category slug (used by products in `categorySlug` field)
   - Example: `"dresses-jumpsuits"` (for "Dresses & Jumpsuits")
   
2. **`path`**: Full hierarchical path from root (unique identifier)
   - Example: `"kids/girls-clothing/dresses-jumpsuits"`

3. **Product Matching**: Products use `categorySlug` field that matches category's `slug` (NOT path)
   - Product with `categorySlug: "dresses-jumpsuits"` matches category with `slug: "dresses-jumpsuits"`

4. **Leaf Categories**: Only leaf categories (no children) should have products assigned

---

## COMPLETE CATEGORY TREE STRUCTURE

### 1. KIDS CATEGORY TREE
**Root:** `types-for-kids` (slug) / `types-for-kids` (path)
**Note:** Taxonomy object has explicit slug `'kids'`, but code uses `slugify('Types For Kids')` → `'types-for-kids'`

#### 1.1 Girls Clothing
- **Slug:** `girls-clothing`
- **Path:** `types-for-kids/girls-clothing`
- **Children (Leaf Categories - Products assigned here):**
  - `dresses-jumpsuits` → Path: `types-for-kids/girls-clothing/dresses-jumpsuits`
  - `tops-tees` → Path: `types-for-kids/girls-clothing/tops-tees`
  - `girls-ethnic-wear` → Path: `types-for-kids/girls-clothing/girls-ethnic-wear`
  - `skirts-shorts` → Path: `types-for-kids/girls-clothing/skirts-shorts`
  - `girls-jeans` → Path: `types-for-kids/girls-clothing/girls-jeans`
  - `girls-clothing-set` → Path: `types-for-kids/girls-clothing/girls-clothing-set`
  - `girls-innerwear` → Path: `types-for-kids/girls-clothing/girls-innerwear`

#### 1.2 Boys Clothing
- **Slug:** `boys-clothing`
- **Path:** `types-for-kids/boys-clothing`
- **Children (Leaf Categories - Products assigned here):**
  - `tshirt` → Path: `types-for-kids/boys-clothing/tshirt`
  - `boys-clothing-set` → Path: `types-for-kids/boys-clothing/boys-clothing-set`
  - `boys-ethnic-wear` → Path: `types-for-kids/boys-clothing/boys-ethnic-wear`
  - `boys-bottoms` → Path: `types-for-kids/boys-clothing/boys-bottoms`
  - `boys-shirts` → Path: `types-for-kids/boys-clothing/boys-shirts`
  - `boys-jeans` → Path: `types-for-kids/boys-clothing/boys-jeans`
  - `boys-innerwear` → Path: `types-for-kids/boys-clothing/boys-innerwear`

#### 1.3 Baby Clothing
- **Slug:** `baby-clothing`
- **Path:** `types-for-kids/baby-clothing`
- **Children (Leaf Categories - Products assigned here):**
  - `rompers-body-suits` → Path: `types-for-kids/baby-clothing/rompers-body-suits`
  - `baby-clothing-set` → Path: `types-for-kids/baby-clothing/baby-clothing-set`
  - `baby-dresses` → Path: `types-for-kids/baby-clothing/baby-dresses`
  - `t-shirt-tops` → Path: `types-for-kids/baby-clothing/t-shirt-tops`
  - `baby-bottoms` → Path: `types-for-kids/baby-clothing/baby-bottoms`
  - `girls-set` → Path: `types-for-kids/baby-clothing/girls-set`
  - `accessories` → Path: `types-for-kids/baby-clothing/accessories`

#### 1.4 Teens
- **Slug:** `teens`
- **Path:** `types-for-kids/teens`
- **Children (Leaf Categories - Products assigned here):**
  - `t-shirt` → Path: `types-for-kids/teens/t-shirt`
  - `teens-shirts` → Path: `types-for-kids/teens/teens-shirts`
  - `teens-jeans` → Path: `types-for-kids/teens/teens-jeans`
  - `teens-ethnic-wear` → Path: `types-for-kids/teens/teens-ethnic-wear`
  - `teens-bottoms` → Path: `types-for-kids/teens/teens-bottoms`
  - `dresses-jumpsuit` → Path: `types-for-kids/teens/dresses-jumpsuit`
  - `tops-and-tees` → Path: `types-for-kids/teens/tops-and-tees`
  - `teens-innerwear` → Path: `types-for-kids/teens/teens-innerwear`

---

### 2. WOMEN CATEGORY TREE
**Root:** `types-for-woman` (slug) / `types-for-woman` (path)
**Note:** Taxonomy object has explicit slug `'women'`, but code uses `slugify('Types for Women')` → `'types-for-woman'`

#### 2.1 Ethnic Wear
- **Slug:** `ethnic-wear`
- **Path:** `types-for-woman/ethnic-wear`
- **Children (Leaf Categories - Products assigned here):**
  - `kurtas-kurtis` → Path: `types-for-woman/ethnic-wear/kurtas-kurtis`
  - `kurta-set` → Path: `types-for-woman/ethnic-wear/kurta-set`
  - `traditional-saree` → Path: `types-for-woman/ethnic-wear/traditional-saree`
  - `party-wear-saree` → Path: `types-for-woman/ethnic-wear/party-wear-saree`
  - `blouses` → Path: `types-for-woman/ethnic-wear/blouses`
  - `lehengas` → Path: `types-for-woman/ethnic-wear/lehengas`
  - `dupattas` → Path: `types-for-woman/ethnic-wear/dupattas`
  - `dress-materials` → Path: `types-for-woman/ethnic-wear/dress-materials`

#### 2.2 Western Wear
- **Slug:** `western-wear`
- **Path:** `types-for-woman/western-wear`
- **Children (Leaf Categories - Products assigned here):**
  - `tops` → Path: `types-for-woman/western-wear/tops`
  - `tees` → Path: `types-for-woman/western-wear/tees`
  - `women-dresses` → Path: `types-for-woman/western-wear/women-dresses`
  - `jumpsuit` → Path: `types-for-woman/western-wear/jumpsuit`
  - `women-shirts` → Path: `types-for-woman/western-wear/women-shirts`
  - `women-jeans` → Path: `types-for-woman/western-wear/women-jeans`
  - `sleepwear` → Path: `types-for-woman/western-wear/sleepwear`

#### 2.3 Jewellery
- **Slug:** `jewellery`
- **Path:** `types-for-woman/jewellery`
- **Children (Leaf Categories - Products assigned here):**
  - `earings` → Path: `types-for-woman/jewellery/earings`
  - `ring` → Path: `types-for-woman/jewellery/ring`

---

## PRODUCT CATEGORYSLUG ASSIGNMENT

Products should be assigned using the **LEAF category slug** (not the path). Examples:

### Correct Product Assignments:
```javascript
// Product in "Kurtas & Kurtis" category
{
  categorySlug: "kurtas-kurtis",  // ✅ Correct - matches category.slug
  category: "Kurtas & Kurtis"      // Display name
}

// Product in "Dresses & Jumpsuits" (Girls Clothing)
{
  categorySlug: "dresses-jumpsuits",  // ✅ Correct - matches category.slug
  category: "Dresses & Jumpsuits"
}
```

### Incorrect Product Assignments:
```javascript
// ❌ WRONG - Using full path
{
  categorySlug: "types-for-woman/ethnic-wear/kurtas-kurtis"  // ❌ Should be just "kurtas-kurtis"
}

// ❌ WRONG - Using parent slug
{
  categorySlug: "ethnic-wear"  // ❌ This is parent, not leaf category
}
```

---

## SLUG GENERATION RULES

The `slugify` function converts names to slugs:
```javascript
function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

Examples:
- "Dresses & Jumpsuits" → `"dresses-jumpsuits"`
- "T-shirt & Tops" → `"t-shirt-tops"`
- "Kurtas & Kurtis" → `"kurtas-kurtis"`
- "Clothing set" → `"clothing-set"`

---

## IMPORTANT NOTES

1. **Unique Slug Constraint**: The combination of `slug + parent` must be unique
   - Same slug can exist under different parents (e.g., "ethnic-wear" appears under both "Girls Clothing" and "Boys Clothing")

2. **Path Uniqueness**: The `path` field is unique across all categories
   - Each category has a distinct path identifier

3. **Product Filtering**: When querying products by category:
   - For leaf categories: Filter by `categorySlug = category.slug`
   - For parent categories: Find all descendant slugs and filter by `categorySlug: { $in: [descendantSlugs] }`

4. **Category Lookup**: Products are matched to categories via:
   ```javascript
   // In categoryController.js line 81
   localField: 'slug',
   foreignField: 'categorySlug'
   ```

---

## COMPLETE LEAF CATEGORY SLUG LIST (For Products)

### Kids Categories:
- `dresses-jumpsuits`
- `tops-tees`
- `girls-ethnic-wear`
- `skirts-shorts`
- `girls-jeans`
- `girls-clothing-set`
- `girls-innerwear`
- `tshirt` (boys)
- `boys-clothing-set`
- `boys-ethnic-wear`
- `boys-bottoms`
- `boys-shirts`
- `boys-jeans`
- `boys-innerwear`
- `rompers-body-suits`
- `baby-clothing-set`
- `baby-dresses`
- `t-shirt-tops`
- `baby-bottoms`
- `girls-set`
- `accessories`
- `t-shirt` (teens)
- `teens-shirts`
- `teens-jeans`
- `teens-ethnic-wear`
- `teens-bottoms`
- `dresses-jumpsuit`
- `tops-and-tees`
- `teens-innerwear`

### Women Categories:
- `kurtas-kurtis`
- `kurta-set`
- `traditional-saree`
- `party-wear-saree`
- `blouses`
- `lehengas`
- `dupattas`
- `dress-materials`
- `tops`
- `tees`
- `women-dresses`
- `jumpsuit`
- `women-shirts`
- `women-jeans`
- `sleepwear`
- `earings`
- `ring`

---

**Last Updated:** Based on `backend/scripts/seedTaxonomy.js`

