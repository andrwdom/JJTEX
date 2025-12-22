type ProductLike = {
  name?: string
  description?: string
  category?: string
  categorySlug?: string
}

function normalize(s?: string) {
  return (s || "").toLowerCase()
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function detectMood(product: ProductLike) {
  const text = normalize([product.name, product.description, product.category, product.categorySlug].filter(Boolean).join(" "))

  const isDress = /dress/.test(text)
  const isJumpsuit = /jumpsuit/.test(text)
  const isKurta = /kurta|kurti/.test(text)
  const isSaree = /saree/.test(text)
  const isTop = /top|t[-\s]?shirt|tee|blouse/.test(text)
  const isDenim = /denim|jeans/.test(text)

  const fabrics = {
    cotton: /cotton|muslin|cambric/.test(text),
    linen: /linen/.test(text),
    rayon: /rayon|viscose/.test(text),
    satin: /satin/.test(text),
    chiffon: /chiffon/.test(text),
    georgette: /georgette/.test(text),
    crepe: /crepe/.test(text),
  }

  const details = {
    embroidery: /embroider|chikankari|zari|sequin|threadwork/.test(text),
    print: /print|floral|stripes|polka|motif/.test(text),
    festive: /festive|wedding|party|occasion|celebration/.test(text),
    everyday: /everyday|daily|comfort|casual/.test(text),
    work: /work|office|formal/.test(text),
  }

  return { text, isDress, isJumpsuit, isKurta, isSaree, isTop, isDenim, fabrics, details }
}

export function getRomanticizedProductTitle(product: ProductLike): string {
  const mood = detectMood(product)

  // Use the last word as a safe “item type” fallback
  const categoryHint =
    (product.category || "")
      .split(" ")
      .filter(Boolean)
      .slice(-1)[0] || "Piece"

  const baseType = mood.isJumpsuit
    ? "Jumpsuit"
    : mood.isDress
      ? "Dress"
      : mood.isKurta
        ? "Kurta"
        : mood.isSaree
          ? "Saree"
          : mood.isDenim
            ? "Denim"
            : mood.isTop
              ? "Top"
              : categoryHint

  const palettes = [
    "Midnight Dahlia",
    "Blush Atelier",
    "Rose Nocturne",
    "Velvet Petal",
    "Moonlit Bloom",
    "Pearl Serenade",
    "Soft Garnet",
    "Wildflower Whisper",
    "Ivory Kiss",
    "Pink Champagne",
  ]

  const suffixes = mood.details.festive
    ? ["Edition", "Occasion", "Soirée"]
    : mood.details.work
      ? ["Tailored", "Studio", "Signature"]
      : ["Signature", "Classic", "Muse"]

  return `The ${pick(palettes)} ${baseType} ${pick(suffixes)}`
}

export function getDesignerNote(product: ProductLike): string {
  const mood = detectMood(product)

  const fabricLine = mood.fabrics.linen
    ? "Cut to feel airy and breathable, with a linen-forward handfeel."
    : mood.fabrics.cotton
      ? "Finished in soft cotton comfort that stays easy from morning to night."
      : mood.fabrics.satin
        ? "Designed with a lustrous satin touch for a refined, boutique drape."
        : mood.fabrics.georgette || mood.fabrics.chiffon || mood.fabrics.crepe
          ? "Made for graceful movement, with a light drape that feels effortlessly elevated."
          : "Designed to feel premium on the skin, with an elevated finish and easy wearability."

  const detailLine = mood.details.embroidery
    ? "Look closely for delicate detailing—subtle, considered, and made to stand out quietly."
    : mood.details.print
      ? "The print is intentionally refined—polished enough for occasions, relaxed enough for everyday."
      : mood.details.work
        ? "A clean silhouette and thoughtful structure keep it polished without feeling stiff."
        : mood.details.festive
          ? "A celebration-ready silhouette with just the right amount of drama—never overdone."
          : "A flattering silhouette with a finish that reads effortless, not loud."

  return `${fabricLine} ${detailLine}`
}


