// backend/lib/taxonomy.js
// Central taxonomy definition (Option A: globally-unique leaf slugs)

export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * IMPORTANT:
 * - Root slugs are kept stable to match existing URLs/docs:
 *   - "Types For Kids" => "types-for-kids"
 *   - "TYPES FOR WOMAN" => "types-for-woman"
 * - Leaf slugs are globally unique to avoid Product.categorySlug collisions.
 */
export const taxonomy = [
  {
    name: 'Types For Kids',
    slug: 'types-for-kids',
    children: [
      {
        name: 'Girls Clothing',
        slug: 'girls-clothing',
        children: [
          { name: 'Dresses & Jumpsuits', slug: 'dresses-jumpsuits' },
          { name: 'Tops & Tees', slug: 'tops-tees' },
          { name: 'Ethnic Wear', slug: 'girls-ethnic-wear' },
          { name: 'Skirts & Shorts', slug: 'skirts-shorts' },
          { name: 'Jeans', slug: 'girls-jeans' },
          { name: 'Clothing set', slug: 'girls-clothing-set' },
          { name: 'Innerwear', slug: 'girls-innerwear' }
        ]
      },
      {
        name: 'Boys clothing',
        slug: 'boys-clothing',
        children: [
          { name: 'Tshirt', slug: 'tshirt' },
          { name: 'Clothing set', slug: 'boys-clothing-set' },
          { name: 'Ethnic Wear', slug: 'boys-ethnic-wear' },
          { name: 'Bottoms', slug: 'boys-bottoms' },
          { name: 'Shirts', slug: 'boys-shirts' },
          { name: 'Jeans', slug: 'boys-jeans' },
          { name: 'Innerwear', slug: 'boys-innerwear' }
        ]
      },
      {
        name: 'Baby Clothing',
        slug: 'baby-clothing',
        children: [
          { name: 'Rompers & Body Suits', slug: 'rompers-body-suits' },
          { name: 'Clothing Set', slug: 'baby-clothing-set' },
          { name: 'Dresses', slug: 'baby-dresses' },
          { name: 'T shirt & Tops', slug: 't-shirt-tops' },
          { name: 'Bottoms', slug: 'baby-bottoms' },
          { name: 'Girls set', slug: 'girls-set' },
          { name: 'Accessories', slug: 'accessories' }
        ]
      },
      {
        name: 'Teens',
        slug: 'teens',
        children: [
          { name: 'T-shirt', slug: 't-shirt' },
          { name: 'Shirts', slug: 'teens-shirts' },
          { name: 'Jeans', slug: 'teens-jeans' },
          { name: 'Ethnic Wear', slug: 'teens-ethnic-wear' },
          { name: 'Bottoms', slug: 'teens-bottoms' },
          { name: 'Dresses & Jumpsuit', slug: 'dresses-jumpsuit' },
          { name: 'Tops and tees', slug: 'tops-and-tees' },
          { name: 'Innerwear', slug: 'teens-innerwear' }
        ]
      }
    ]
  },
  {
    name: 'TYPES FOR WOMAN',
    slug: 'types-for-woman',
    children: [
      {
        name: 'Ethnic Wear',
        slug: 'ethnic-wear',
        children: [
          { name: 'Kurtas & Kurtis', slug: 'kurtas-kurtis' },
          { name: 'Kurta set', slug: 'kurta-set' },
          { name: 'Traditional saree', slug: 'traditional-saree' },
          { name: 'Party wear saree', slug: 'party-wear-saree' },
          { name: 'Blouses', slug: 'blouses' },
          { name: 'Lehengas', slug: 'lehengas' },
          { name: 'Dupattas', slug: 'dupattas' },
          { name: 'Dress materials', slug: 'dress-materials' }
        ]
      },
      {
        name: 'Western Wear',
        slug: 'western-wear',
        children: [
          { name: 'Tops', slug: 'tops' },
          { name: 'Tees', slug: 'tees' },
          { name: 'Dresses', slug: 'women-dresses' },
          { name: 'Jumpsuit', slug: 'jumpsuit' },
          { name: 'Shirts', slug: 'women-shirts' },
          { name: 'Jeans', slug: 'women-jeans' },
          { name: 'Sleepwear', slug: 'sleepwear' }
        ]
      },
      {
        name: 'Jewellery',
        slug: 'jewellery',
        children: [
          { name: 'Earings', slug: 'earings' },
          { name: 'Ring', slug: 'ring' }
        ]
      }
    ]
  }
];






