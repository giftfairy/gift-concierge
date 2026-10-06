// =============================
// Gift Lane – Unified Server
// Website + /curate API
// Worldwide local gift discovery
// =============================

import express from "express";
import OpenAI from "openai";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// -----------------------------
// Approved affiliate partners
// -----------------------------
const AFFILIATES = {
  "Will & Bear": {
    brand: "Will & Bear",
    homepage: "https://willandbear.com.au",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=119813&awinaffid=2689862&ued=https%3A%2F%2Fwillandbear.com.au",
    category: [
      "fashion",
      "accessories",
      "hats",
      "travel",
      "gifts",
    ],
    vibe: [
      "premium",
      "sustainable",
      "outdoors",
      "travel",
    ],
  },

  "YCZ Fragrance": {
    brand: "YCZ Fragrance",
    homepage: "https://yczfragrance.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=121156&awinaffid=2689862&ued=https%3A%2F%2Fyczfragrance.com",
    category: [
      "beauty",
      "fragrance",
      "perfume",
      "gifts",
    ],
    vibe: [
      "luxury",
      "sensual",
      "modern",
    ],
  },

  "House of Sneakers DE": {
    brand: "House of Sneakers",
    homepage: "https://house-of-sneakers.de/en",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=114336&awinaffid=2689862&ued=https%3A%2F%2Fhouse-of-sneakers.de%2Fen",
    category: [
      "fashion",
      "sneakers",
      "streetwear",
      "shoes",
    ],
    vibe: [
      "trendy",
      "premium",
      "streetwear",
      "european",
    ],
  },

  "BrickZoneHub": {
    brand: "BrickZoneHub",
    homepage: "https://brickzonehub.co.uk",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=121692&awinaffid=2689862&ued=https%3A%2F%2Fbrickzonehub.co.uk",
    category: [
      "LEGO",
      "collectibles",
      "display cases",
      "display stands",
      "light kits",
      "gifts for adults",
    ],
    vibe: [
      "collector",
      "LEGO fan",
      "F1",
      "Star Wars",
      "Harry Potter",
      "display",
    ],
  },

  "EverLeakProof": {
    brand: "EverLeakProof",
    homepage: "https://www.everleakproof.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=121298&awinaffid=2689862&ued=https%3A%2F%2Fwww.everleakproof.com",
    category: [
      "leakproof underwear",
      "practical gifts",
      "wellness",
      "travel essentials",
      "reusable products",
    ],
    vibe: [
      "practical",
      "comfortable",
      "useful",
      "everyday",
    ],
  },

  "Fang Accessories": {
    brand: "Fang Accessories",
    homepage: "https://fangaccessories.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=128369&awinaffid=2689862&ued=https%3A%2F%2Ffangaccessories.com",
    category: [
      "jewellery",
      "jewelry",
      "necklaces",
      "bracelets",
      "earrings",
      "rings",
      "gemstones",
      "crystals",
    ],
    vibe: [
      "stylish",
      "sentimental",
      "spiritual",
      "handmade",
      "giftable",
    ],
  },

  "GoWithGuide": {
    brand: "GoWithGuide",
    homepage: "https://gowithguide.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=87121&awinaffid=2689862&ued=https%3A%2F%2Fgowithguide.com",
    category: [
      "travel",
      "experiences",
      "private tours",
      "local guides",
      "experience gifts",
    ],
    vibe: [
      "experiential",
      "travel",
      "adventure",
      "memorable",
      "personalised",
    ],
  },

  "Primeful": {
    brand: "Primeful",
    homepage: "https://www.primeful.co",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=130555&awinaffid=2689862&ued=https%3A%2F%2Fwww.primeful.co",
    category: [
      "slackline",
      "outdoor activities",
      "family activities",
      "fitness",
      "backyard games",
      "active gifts",
    ],
    vibe: [
      "active",
      "family",
      "outdoors",
      "fun",
      "adventurous",
    ],
  },

  "Traverseon": {
    brand: "Traverseon",
    homepage: "https://traverseon.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=124816&awinaffid=2689862&ued=https%3A%2F%2Ftraverseon.com",
    category: [
      "camping",
      "outdoor gear",
      "car camping",
      "camping accessories",
      "coolers",
      "portable power",
      "tents",
      "travel gear",
      "pet travel",
    ],
    vibe: [
      "outdoors",
      "camping",
      "adventure",
      "practical",
      "road trip",
    ],
  },

    "Foemina": {
    brand: "Foemina",
    homepage: "https://foemina.com",
    affiliate:
      "https://t.cfjump.com/94542/t/93906",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "accessories",
      "gifts for women",
    ],
    vibe: [
      "stylish",
      "fashion",
      "modern",
      "feminine",
    ],
  },

  "Gift Card Store": {
    brand: "Gift Card Store",
    homepage: "https://giftcardstore.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/62126",
    category: [
      "gift cards",
      "prepaid cards",
      "last minute gifts",
      "gifts for hard to buy for people",
      "flexible gifts",
    ],
    vibe: [
      "practical",
      "flexible",
      "easy",
      "last minute",
    ],
  },

  "Laurastar": {
    brand: "Laurastar",
    homepage: "https://www.laurastar.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/94133",
    category: [
      "home",
      "home appliances",
      "steamers",
      "ironing",
      "clothing care",
      "premium home gifts",
    ],
    vibe: [
      "premium",
      "practical",
      "home",
      "luxury",
    ],
  },

  "Mattel Shop": {
    brand: "Mattel Shop",
    homepage: "https://shop.mattel.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/93976",
    category: [
      "toys",
      "kids gifts",
      "children",
      "Barbie",
      "Hot Wheels",
      "Fisher-Price",
      "games",
      "collectibles",
    ],
    vibe: [
      "fun",
      "playful",
      "family",
      "kids",
      "collectible",
    ],
  },

    "Betty Basics": {
    brand: "Betty Basics",
    homepage: "https://bettybasics.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/93140",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "casual wear",
      "gifts for women",
    ],
    vibe: [
      "comfortable",
      "casual",
      "affordable",
      "everyday",
    ],
  },

  "Flo & Frankie": {
    brand: "Flo & Frankie",
    homepage: "https://floandfrankie.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/94014",
    category: [
      "fashion",
      "womens fashion",
      "accessories",
      "beauty",
      "homewares",
      "gifts for women",
    ],
    vibe: [
      "stylish",
      "curated",
      "modern",
      "giftable",
    ],
  },

  "Frankie and Co": {
    brand: "Frankie and Co",
    homepage: "https://frankieandco.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/93659",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "accessories",
      "gifts for women",
    ],
    vibe: [
      "modern",
      "effortless",
      "casual",
      "stylish",
    ],
  },

  "Lilly Pilly Collection": {
    brand: "Lilly Pilly Collection",
    homepage: "https://www.lillypillycollection.com",
    affiliate:
      "https://t.cfjump.com/94542/t/94093",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "accessories",
      "gifts for women",
    ],
    vibe: [
      "relaxed",
      "natural",
      "timeless",
      "feminine",
    ],
  },

  "Lime Tree Kids": {
    brand: "Lime Tree Kids",
    homepage: "https://www.limetreekids.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/34279",
    category: [
      "toys",
      "kids gifts",
      "children",
      "baby gifts",
      "educational toys",
      "products for mums",
    ],
    vibe: [
      "playful",
      "family",
      "educational",
      "useful",
    ],
  },

  "Sass Clothing": {
    brand: "Sass Clothing",
    homepage: "https://sassclothing.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/93858",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "accessories",
      "gifts for women",
    ],
    vibe: [
      "affordable",
      "trendy",
      "feminine",
      "everyday",
    ],
  },

  "Summi Summi": {
    brand: "Summi Summi",
    homepage: "https://summisummi.com.au",
    affiliate:
      "https://t.cfjump.com/94542/t/92447",
    category: [
      "fashion",
      "womens fashion",
      "clothing",
      "accessories",
      "gifts for women",
    ],
    vibe: [
      "colourful",
      "creative",
      "bold",
      "Australian",
    ],
  },

  "World Businesses For Sale": {
    brand: "World Businesses For Sale",
    homepage: "https://worldbusinessesforsale.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=116725&awinaffid=2689862&ued=https%3A%2F%2Fworldbusinessesforsale.com",
    category: [
      "business",
      "entrepreneurship",
      "business opportunities",
      "investment",
    ],
    vibe: [
      "entrepreneurial",
      "professional",
      "aspirational",
      "unusual",
    ],
  },

  "PDF Agile": {
    brand: "PDF Agile",
    homepage: "https://www.pdfagile.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=123770&awinaffid=2689862&ued=https%3A%2F%2Fwww.pdfagile.com",
    category: [
      "software",
      "productivity",
      "digital tools",
      "work",
      "study",
    ],
    vibe: [
      "practical",
      "digital",
      "productive",
      "professional",
    ],
  },
  
  "Sylvox TV": {
    brand: "Sylvox TV",
    homepage: "https://www.sylvoxtv.com.au",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=115797&awinaffid=2689862&ued=https%3A%2F%2Fwww.sylvoxtv.com.au",
    category: [
      "electronics",
      "TV",
      "home entertainment",
    ],
    vibe: [
      "modern",
      "techy",
      "giftable",
    ],
  },
};

// -----------------------------
// Render path setup
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());

// -----------------------------
// OpenAI
// -----------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------
// Budget parsing
// -----------------------------
function parseBudget(raw) {
  if (!raw) {
    return {
      min: null,
      max: null,
      raw: null,
    };
  }

  const str = String(raw).replace(/,/g, "");
  const matches = str.match(/\d+(\.\d+)?/g);

  if (!matches) {
    return {
      min: null,
      max: null,
      raw,
    };
  }

  const nums = matches.map(Number);
  const first = nums[0];
  const second = nums[1];

  if (second != null) {
    return {
      min: Math.min(first, second),
      max: Math.max(first, second),
      raw,
    };
  }

  if (/under|below|less than|up to|upto/i.test(str)) {
    return {
      min: null,
      max: first,
      raw,
    };
  }

  if (/over|more than|at least|from/i.test(str)) {
    return {
      min: first,
      max: null,
      raw,
    };
  }

  // A plain number means "budget up to this amount"
  // rather than "product must cost exactly this amount".
  return {
    min: null,
    max: first,
    raw,
  };
}

// -----------------------------
// Affiliate partner summary
// Used inside Jude's prompt so
// partner brands can be prioritised
// when genuinely relevant.
// -----------------------------
function buildAffiliatePartnerContext() {
  return Object.values(AFFILIATES)
    .map((affiliate) => {
      return `- ${affiliate.brand}
  Website: ${affiliate.homepage}
  Categories: ${affiliate.category.join(", ")}
  Style / fit: ${affiliate.vibe.join(", ")}`;
    })
    .join("\n\n");
}

// -----------------------------
// Affiliate detection
// -----------------------------
function detectAffiliateBrand({
  title = "",
  retailer = "",
  why = "",
  url = "",
}) {
  const text =
    `${title} ${retailer} ${why} ${url}`.toLowerCase();

  if (
    text.includes("will & bear") ||
    text.includes("will and bear") ||
    text.includes("willandbear.com")
  ) {
    return "Will & Bear";
  }

  if (
    text.includes("ycz") ||
    text.includes("yczfragrance.com")
  ) {
    return "YCZ Fragrance";
  }

  if (
    text.includes("house of sneakers") ||
    text.includes("house-of-sneakers") ||
    text.includes("house-of-sneakers.de")
  ) {
    return "House of Sneakers DE";
  }

  if (
    text.includes("brickzonehub") ||
    text.includes("brick zone hub") ||
    text.includes("brickzonehub.co.uk")
  ) {
    return "BrickZoneHub";
  }

  if (
    text.includes("everleakproof") ||
    text.includes("ever leakproof") ||
    text.includes("everleakproof.com")
  ) {
    return "EverLeakProof";
  }

  if (
    text.includes("fang accessories") ||
    text.includes("fangaccessories") ||
    text.includes("fangaccessories.com")
  ) {
    return "Fang Accessories";
  }

  if (
    text.includes("gowithguide") ||
    text.includes("go with guide") ||
    text.includes("gowithguide.com")
  ) {
    return "GoWithGuide";
  }

  if (
    text.includes("primeful") ||
    text.includes("primeful.co")
  ) {
    return "Primeful";
  }

  if (
    text.includes("traverseon") ||
    text.includes("traverseon.com")
  ) {
    return "Traverseon";
  }

  if (
    text.includes("foemina") ||
    text.includes("foemina.com")
  ) {
    return "Foemina";
  }

  if (
    text.includes("gift card store") ||
    text.includes("giftcardstore.com.au")
  ) {
    return "Gift Card Store";
  }

  if (
    text.includes("laurastar") ||
    text.includes("laurastar.com.au")
  ) {
    return "Laurastar";
  }

  if (
    text.includes("mattel shop") ||
    text.includes("shop.mattel.com.au")
  ) {
    return "Mattel Shop";
  }

    if (
    text.includes("betty basics") ||
    text.includes("bettybasics.com.au")
  ) {
    return "Betty Basics";
  }

  if (
    text.includes("flo & frankie") ||
    text.includes("flo and frankie") ||
    text.includes("floandfrankie.com.au")
  ) {
    return "Flo & Frankie";
  }

  if (
    text.includes("frankie and co") ||
    text.includes("frankie & co") ||
    text.includes("frankieandco.com.au")
  ) {
    return "Frankie and Co";
  }

  if (
    text.includes("lilly pilly collection") ||
    text.includes("lillypillycollection.com")
  ) {
    return "Lilly Pilly Collection";
  }

  if (
    text.includes("lime tree kids") ||
    text.includes("limetreekids.com.au")
  ) {
    return "Lime Tree Kids";
  }

  if (
    text.includes("sass clothing") ||
    text.includes("sassclothing.com.au")
  ) {
    return "Sass Clothing";
  }

  if (
    text.includes("summi summi") ||
    text.includes("summisummi.com.au")
  ) {
    return "Summi Summi";
  }

  if (
    text.includes("world businesses for sale") ||
    text.includes("worldbusinessesforsale.com")
  ) {
    return "World Businesses For Sale";
  }

  if (
    text.includes("pdf agile") ||
    text.includes("pdfagile") ||
    text.includes("pdfagile.com")
  ) {
    return "PDF Agile";
  }
  
  if (
    text.includes("sylvox") ||
    text.includes("sylvoxtv.com")
  ) {
    return "Sylvox TV";
  }

  return null;
}

function affiliateLinkFor(brandKey) {
  const affiliate = AFFILIATES?.[brandKey];

  if (!affiliate?.affiliate) {
    return null;
  }

  return {
    label: affiliate.brand,
    url: affiliate.affiliate,
    affiliate: true,
  };
}

// -----------------------------
// Prompt
// -----------------------------
function buildGiftPrompt(
  recipient,
  occasion,
  budget,
  country,
  recipientDetails = ""
) {
  const destination =
    String(country || "Australia").trim() || "Australia";

  const affiliatePartnerContext =
    buildAffiliatePartnerContext();

  const extraRecipientDetails =
    String(recipientDetails || "").trim().slice(0, 500);

  const recipientContext = extraRecipientDetails || "Not provided";

  return `
You are Jude, Gift Lane's worldwide gift concierge.

Gift Lane is an Australian company, but people anywhere in the world can use it.

Your job is to find exactly five genuinely good, current gift ideas that are appropriate for the recipient and practical to buy for delivery in their country.

DELIVERY DESTINATION:
${destination}

RECIPIENT:
${recipient}

ABOUT THEM:
${recipientContext}

OCCASION:
${occasion}

BUDGET:
${budget}

Interpret the customer's budget in the normal local currency used in the delivery destination unless another currency has been explicitly supplied.

If the budget is a maximum, treat it as a maximum spend, not a target.

Prefer excellent gifts in roughly the upper half of the budget when appropriate, but do not spend more simply to get closer to the limit.

A cheaper gift should win if it is clearly a better fit.

Avoid exceeding the stated maximum. Only include an option slightly above budget if it is unusually strong, and clearly say so in price_note.

LOCAL SHOPPING PRINCIPLE:

The recipient's delivery destination determines the shopping market.

Search as though you were shopping locally for someone in that country.

Prioritise:
- retailers that actively serve the destination market
- products shown in the destination's normal local currency
- products that appear currently available
- practical delivery within the destination
- retailers and brands that someone in that country could realistically buy from

Do not default to Australian retailers or AUD unless the destination is Australia.

Do not default to US retailers or USD unless the destination is the United States.

Apply the same principle consistently to every country.

APPROVED GIFT LANE AFFILIATE PARTNERS:

${affiliatePartnerContext}

AFFILIATE PRIORITY RULE:

Approved affiliate partners receive priority consideration only when they genuinely suit the recipient and are realistically appropriate for delivery to the destination.

If an affiliate option and a non-affiliate option are both strong and genuinely comparable, prefer the affiliate option.

Never recommend a weaker gift simply because it comes from an affiliate partner.

A non-affiliate product should win when it is materially better, more relevant, better value, more appropriate, easier to obtain locally, or fills a gap the affiliate partners do not cover.

Do not fill all five positions with affiliate products unless they genuinely represent the strongest five-result selection.

The customer must feel that Gift Lane chose the best gifts first and considered affiliate relationships second.

SEARCH AND VERIFICATION RULES:

1. Search the live web before selecting products.
2. Search relevant approved affiliate partners where appropriate.
3. Also search the wider web so the final selection is not artificially limited by affiliate coverage.
4. Recommend only real products that you can find evidence currently exist.
5. Do not invent products, retailers, prices, availability, delivery claims or URLs.
6. Prefer a direct product page over a retailer homepage, category page or search page.
7. Do not claim that delivery is confirmed unless you found reasonable evidence that the retailer or product serves the destination market.
8. If price, stock or delivery availability appears uncertain, reflect that uncertainty rather than presenting it as verified fact.
9. Do not rely only on a search-result snippet when a retailer or product page can be inspected.
10. Prefer products from retailers operating directly in the destination market over products that require complicated international shipping.
11. Avoid recommending products whose practical availability in the destination country is unclear.

GIFT SELECTION RULES:

1. Match the recipient intelligently using all available information, including relationship, interests, lifestyle, occasion, age where reasonably inferable, and the optional description.
2. Use the ABOUT THEM field meaningfully. Do not ignore personal details supplied by the customer.
3. Avoid generic fallback gifts unless they are genuinely strong fits for this specific recipient.
4. Do not return five near-identical products or five variations of the same idea.
5. Build a varied set of five where appropriate. This may include different types of gifts such as a physical product, experience, subscription, locally distinctive item, hobby-related item or indulgence.
6. At least one suggestion should ideally be something the buyer may not have thought of themselves.
7. Prefer specific products over broad product categories.
8. Each recommendation must have a clear reason connected to this particular recipient.
9. Do not use generic explanations such as "This makes a great gift" or "They are sure to love this."
10. The explanation should tell the buyer why this specific item fits this specific person.
11. Balance relevance, quality, budget, variety, local availability, practical delivery and affiliate preference.
12. The final five should feel deliberately curated rather than collected from search results.

FINAL QUALITY CHECK:

Before returning the result, compare all candidate products against each other.

Remove or replace any suggestion that is:
- substantially weaker than the others
- repetitive
- poorly matched to the recipient
- generic without a strong reason
- difficult to buy in the destination country
- outside budget without a compelling reason
- supported only by weak or uncertain product information
- inferior to another available option purely because an affiliate relationship influenced the choice

Return the strongest five results after this comparison.

OUTPUT RULES:

Return exactly 5 gift suggestions.
Output only valid JSON.
Do not output markdown.
Do not output commentary before or after the JSON.
Do not include explanatory text outside the JSON object.

Use exactly this structure:

{
  "products": [
    {
      "title": "Specific real product",
      "retailer": "Retailer or brand",
      "why": "A concise, human explanation of why this is a good fit for this particular recipient.",
      "price_note": "Approximate price with currency",
      "url": "https://actual-shopping-url"
    }
  ]
}

JSON REQUIREMENTS:

- "products" must contain exactly 5 objects.
- Every object must contain title, retailer, why, price_note and url.
- All values must be valid JSON strings.
- Do not include trailing commas.
- Do not wrap the JSON in code fences.
- URLs must point to real shopping destinations.
- If a precise price cannot be verified, say so briefly in price_note rather than inventing one.
  `.trim();
}

// -----------------------------
// /curate
// -----------------------------
app.post("/curate", async (req, res) => {
  try {
    const {
      demographic,
      occasion,
      budget,
      country,
      recipientDetails,
    } = req.body;

    if (!demographic || !occasion || !budget) {
      return res.status(400).json({
        error: "Missing fields in request.",
      });
    }

    const destination =
      String(country || "Australia").trim() || "Australia";

    const prompt = buildGiftPrompt(
      demographic,
      occasion,
      budget,
      destination,
      recipientDetails
    );

    const response = await client.responses.create({
      model: "gpt-5.6-luna",

      tools: [
        {
          type: "web_search",
        },
      ],

      input: prompt,

      max_output_tokens: 2500,
    });

    let rawText = response.output_text || "";

    rawText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.error(
        "JSON parse failed:",
        rawText
      );

      return res.status(500).json({
        error: "AI returned non-JSON. Try again.",
      });
    }

    if (!Array.isArray(parsed.products)) {
      return res.status(500).json({
        error: "AI JSON missing products array.",
      });
    }

    const cleanedProducts = parsed.products
      .slice(0, 5)
      .map((product) => {
        const title = String(
          product.title || ""
        ).slice(0, 140);

        const retailer = String(
          product.retailer || ""
        ).slice(0, 80);

        const why = String(
          product.why || ""
        ).slice(0, 350);

        const price_note = String(
          product.price_note || ""
        ).slice(0, 80);

        const normalUrl = String(
          product.url || ""
        ).trim();

        let link = null;

        if (normalUrl.startsWith("https://")) {
          link = {
            label: retailer || "Shop now",
            url: normalUrl.slice(0, 600),
            affiliate: false,
          };
        }

        // Jude considers affiliate partners DURING curation.
        // If the chosen product belongs to an approved affiliate,
        // replace the ordinary shopping link with the tracked link.
        const brandKey = detectAffiliateBrand({
          title,
          retailer,
          why,
          url: normalUrl,
        });

        if (brandKey) {
          const affiliateLink =
            affiliateLinkFor(brandKey);

          if (affiliateLink) {
            link = affiliateLink;
          }
        }

        return {
          title,
          retailer,
          why,
          price_note,
          links: link ? [link] : [],
        };
      });

    res.json({
      destination,
      products: cleanedProducts,
    });
  } catch (err) {
    console.error("Error in /curate:", err);

    res.status(500).json({
      error: "Something went wrong curating gifts.",
    });
  }
});

// -----------------------------
// Server start
// -----------------------------
const port = process.env.PORT || 10000;

app.listen(port, () => {
  console.log(
    `Gift Lane server running on port ${port}`
  );
});
