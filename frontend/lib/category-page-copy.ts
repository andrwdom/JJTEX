export type CategoryHeroCopy = {
  title: string
  description: string
  eyebrow?: string
}

type ProductLike = {
  name?: string
  description?: string
  category?: string
  categorySlug?: string
  price?: number
}

export function humanizeCategorySlug(categorySlug: string): string {
  return (categorySlug || "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function normalizeText(s?: string): string {
  return (s || "").toLowerCase()
}

function pickFirst<T>(items: T[]): T | undefined {
  return items.length ? items[0] : undefined
}

function detectSignals(products: ProductLike[]) {
  const text = normalizeText(
    products
      .map((p) => [p.name, p.description, p.category, p.categorySlug].filter(Boolean).join(" "))
      .join(" | "),
  )

  const signals = {
    hasCotton: /cotton|muslin|cambric/.test(text),
    hasLinen: /linen/.test(text),
    hasRayon: /rayon|viscose/.test(text),
    hasSatin: /satin/.test(text),
    hasGeorgette: /georgette/.test(text),
    hasChiffon: /chiffon/.test(text),
    hasCrepe: /crepe/.test(text),
    hasDenim: /denim|jeans/.test(text),
    hasKnit: /knit|rib|jersey/.test(text),
    hasEmbroidery: /embroider|chikankari|zari|sequin|threadwork/.test(text),
    hasPrint: /print|floral|stripes|polka|motif/.test(text),
    hasFestive: /festive|wedding|party|occasion|celebration/.test(text),
    hasCasual: /casual|everyday|daily|comfort/.test(text),
    hasWorkwear: /work|office|formal/.test(text),
  }

  return signals
}

export function getCategoryHeroCopy(categorySlug: string, products: ProductLike[] = []): CategoryHeroCopy {
  const name = humanizeCategorySlug(categorySlug)
  const slug = normalizeText(categorySlug)
  const signals = detectSignals(products)

  // Category-led voice first, then refined by product signals.
  const bySlug: Record<string, CategoryHeroCopy> = {
    "dresses-jumpsuits": {
      eyebrow: "Everyday elegance",
      title: `${name}`,
      description:
        "Effortless silhouettes, refined details, and a flattering drape—pieces made to feel as beautiful as they look.",
    },
    tops: {
      eyebrow: "Made to mix & match",
      title: `${name}`,
      description:
        "Versatile staples with elevated finishes—easy to style, easy to love, and designed for comfort that lasts all day.",
    },
    "ethnic-wear": {
      eyebrow: "Tradition, styled today",
      title: `${name}`,
      description:
        "Modern takes on timeless craft—graceful fits, thoughtful detailing, and fabric that moves with you from day to occasion.",
    },
    skirts: {
      eyebrow: "Soft movement, clean lines",
      title: `${name}`,
      description:
        "From crisp pleats to fluid drapes—skirts designed to flatter, flow, and pair seamlessly with your wardrobe favorites.",
    },
    sarees: {
      eyebrow: "Signature drape",
      title: `${name}`,
      description:
        "Light, luxurious, and beautifully finished—sarees that celebrate tradition with an effortlessly modern sensibility.",
    },
    kurtas: {
      eyebrow: "Comfort with craft",
      title: `${name}`,
      description:
        "Easy silhouettes with elevated detailing—kurta styles you’ll reach for on repeat, from everyday to festive moments.",
    },
  }

  const base = bySlug[slug] || {
    eyebrow: "Curated for you",
    title: name || "Collection",
    description: "Curated pieces for everyday comfort and everyday elegance—made to look polished, feel soft, and wear beautifully.",
  }

  // Refine the copy based on detected fabrics/details.
  const refinements: string[] = []
  if (signals.hasEmbroidery) refinements.push("finished with delicate detailing")
  if (signals.hasPrint) refinements.push("with prints that feel fresh and refined")
  if (signals.hasCotton || signals.hasLinen) refinements.push("in breathable, skin-friendly fabrics")
  if (signals.hasSatin || signals.hasGeorgette || signals.hasChiffon || signals.hasCrepe)
    refinements.push("with a graceful, occasion-ready drape")
  if (signals.hasWorkwear) refinements.push("perfect for polished, day-long wear")
  if (signals.hasFestive) refinements.push("ideal for celebrations and special moments")

  const refinedDescription =
    refinements.length >= 2
      ? `${base.description} ${pickFirst(refinements)?.charAt(0)?.toUpperCase()}${pickFirst(refinements)?.slice(1) || ""}, ${refinements
          .slice(1, 3)
          .join(", ")}.`
      : refinements.length === 1
        ? `${base.description} ${refinements[0].charAt(0).toUpperCase()}${refinements[0].slice(1)}.`
        : base.description

  return { ...base, description: refinedDescription }
}

function titleCaseLoose(input: string) {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ")
}

function stripSkuNoise(name: string) {
  // Remove common SKU-ish fragments without being destructive.
  return name
    .replace(/\b(kk|jj|sku|code)\b[:\-]?\s*\w+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

export function getProductDisplayTitle(product: ProductLike, categorySlug: string): string {
  const raw = (product?.name || "").trim()
  if (!raw) return "Premium Pick"

  const cleaned = titleCaseLoose(stripSkuNoise(raw))

  // Add a subtle upgrade only if the name is very short/generic.
  const slug = normalizeText(categorySlug)
  if (cleaned.length < 10) {
    if (slug.includes("dress")) return `Signature ${cleaned}`
    if (slug.includes("top")) return `Everyday ${cleaned}`
    if (slug.includes("kurta") || slug.includes("ethnic")) return `Classic ${cleaned}`
  }

  return cleaned
}

export function getProductFeatureSummary(product: ProductLike, categorySlug: string): string {
  const text = normalizeText([product?.name, product?.description, product?.category].filter(Boolean).join(" "))
  const slug = normalizeText(categorySlug)

  const material =
    /linen/.test(text)
      ? "Breathable linen feel"
      : /cotton|muslin|cambric/.test(text)
        ? "Soft cotton comfort"
        : /rayon|viscose/.test(text)
          ? "Silky-soft rayon blend"
          : /satin/.test(text)
            ? "Lustrous satin touch"
            : /georgette/.test(text)
              ? "Light georgette drape"
              : /chiffon/.test(text)
                ? "Air-light chiffon flow"
                : /crepe/.test(text)
                  ? "Smooth crepe finish"
                  : /denim|jeans/.test(text)
                    ? "Everyday denim ease"
                    : /knit|rib|jersey/.test(text)
                      ? "Comfortable knit stretch"
                      : "Premium everyday fabric"

  const detail =
    /embroider|chikankari|zari|sequin|threadwork/.test(text)
      ? "with delicate detailing"
      : /print|floral|stripes|polka|motif/.test(text)
        ? "with a refined print"
        : /solid|plain/.test(text)
          ? "in a clean, elevated solid"
          : "with a flattering finish"

  const intent =
    /work|office|formal/.test(text)
      ? "made for polished days"
      : /festive|party|occasion|celebration|wedding/.test(text)
        ? "made for special moments"
        : /casual|everyday|daily|comfort/.test(text)
          ? "made for everyday wear"
          : slug.includes("dress") || slug.includes("jumpsuit")
            ? "made for effortless elegance"
            : slug.includes("top")
              ? "made to mix and match"
              : "made to wear beautifully"

  return `${material} ${detail} — ${intent}.`
}


