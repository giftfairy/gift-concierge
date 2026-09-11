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
    category: ["fashion", "accessories", "gifts"],
    vibe: ["premium", "sustainable", "travel"],
  },

  "YCZ Fragrance": {
    brand: "YCZ Fragrance",
    homepage: "https://yczfragrance.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=121156&awinaffid=2689862&ued=https%3A%2F%2Fyczfragrance.com",
    category: ["beauty", "fragrance", "gifts"],
    vibe: ["luxury", "sensual", "modern"],
  },

  "House of Sneakers DE": {
    brand: "House of Sneakers",
    homepage: "https://house-of-sneakers.de/en",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=114336&awinaffid=2689862&ued=https%3A%2F%2Fhouse-of-sneakers.de%2Fen",
    category: ["fashion", "sneakers", "streetwear"],
    vibe: ["trendy", "premium", "european"],
  },

  "Primeful": {
    brand: "Hero of My Book",
    homepage: "https://heroofmybook.com",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=130555&awinaffid=2689862&ued=https%3A%2F%2Fheroofmybook.com",
    category: [
      "children",
      "books",
      "personalised gifts",
      "kids gifts",
    ],
    vibe: [
      "personalised",
      "creative",
      "sentimental",
      "educational",
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
 
  "Sylvox TV": {
    brand: "Sylvox TV",
    homepage: "https://www.sylvoxtv.com.au",
    affiliate:
      "https://www.awin1.com/cread.php?awinmid=115797&awinaffid=2689862&ued=https%3A%2F%2Fwww.sylvoxtv.com.au",
    category: ["electronics", "TV", "home entertainment"],
    vibe: ["modern", "techy", "giftable"],
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
    text.includes("sylvox") ||
    text.includes("sylvoxtv.com")
  ) {
    return "Sylvox TV";
  }

  if (
    text.includes("hero of my book") ||
    text.includes("heroofmybook.com") ||
    text.includes("primeful")
  ) {
    return "Primeful";
  }

  if (
  text.includes("brickzonehub") ||
  text.includes("brick zone hub") ||
  text.includes("brickzonehub.co.uk")
) {
  return "BrickZoneHub";
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
  country
) {
  const parsedBudget = parseBudget(budget);

  const destination =
    String(country || "Australia").trim() || "Australia";

  let budgetInstruction =
    `The customer's stated budget is ${budget} in the normal local currency used in ${destination}.`;

  if (
    parsedBudget.max != null &&
    parsedBudget.min == null
  ) {
    budgetInstruction += `
Treat this as a maximum spend, not a target price.
Prefer excellent gifts in roughly the upper half of the budget when appropriate,
but include a cheaper option if it is genuinely a better gift.
Never exceed the stated maximum unless clearly labelled as slightly over budget.`;
  }

  if (
    parsedBudget.min != null &&
    parsedBudget.max != null
  ) {
    budgetInstruction += `
Prefer products inside the customer's stated budget range of ${parsedBudget.min}–${parsedBudget.max} in the normal local currency used in ${destination}.`;
  }

  const affiliatePartnerContext =
    buildAffiliatePartnerContext();

  return `
You are Jude, Gift Lane's worldwide gift concierge.

Gift Lane is an Australian company, but people anywhere in the world can use it.

Your job is to find genuinely good, CURRENT gift ideas that are appropriate
for the country where the gift will be delivered.

DELIVERY DESTINATION:
${destination}

Recipient:
${recipient}

Occasion:
${occasion}

${budgetInstruction}

LOCAL SHOPPING PRINCIPLE:

The delivery destination determines the shopping market.

For this request, prioritise products that are practical to buy and deliver
to ${destination}.

Use the normal local currency for ${destination} when presenting prices.

Do NOT default to Australian retailers, AUD pricing or Australian availability
unless the delivery destination is Australia.

Do NOT default to US retailers or USD pricing unless the delivery destination
is the United States.

Apply the same principle to every country.

APPROVED GIFT LANE AFFILIATE PARTNERS:

${affiliatePartnerContext}

AFFILIATE PRIORITY RULE:

Gift Lane's approved affiliate partners should receive priority consideration
when they have products that genuinely suit this shopper AND are realistically
available for delivery to ${destination}.

This means:

- First consider whether any approved affiliate partner has a genuinely strong
  product for this recipient, occasion, budget and delivery destination.

- Before recommending an affiliate partner, make sure that retailer or brand
  can reasonably serve customers in ${destination}.

- If an affiliate-partner product and a non-affiliate product are both strong,
  comparable matches and both are suitable for ${destination}, prefer the
  affiliate-partner product.

- An affiliate product does NOT need to be the absolute cheapest option.

- Do not recommend an affiliate product merely because it is an affiliate.
  It must still be a genuinely good gift.

- A non-affiliate product should still be recommended where it is materially
  better, more relevant, better value, more appropriate, easier to obtain in
  ${destination}, or fills a gap that affiliate partners do not cover.

- Do not fill all five positions with affiliate products unless those five
  genuinely represent the strongest and most useful selection.

SEARCH RULES:

1. Search the live web before choosing products.

2. LOCAL FIRST.

Prioritise:
- retailers based in or serving ${destination}
- brand websites appropriate for customers in ${destination}
- products priced in the normal local currency of ${destination}
- products currently available to customers in ${destination}
- practical delivery to ${destination}

3. International retailers are allowed when:
- the product is genuinely excellent
- it reliably ships to ${destination}
- delivery is practical
- it offers something meaningfully worthwhile compared with local options

4. Search relevant approved affiliate partners as part of the gift discovery
process whenever their categories plausibly match the request AND they can
serve the delivery destination.

5. After considering relevant affiliate partners, search the wider web so the
customer still receives a strong, varied set of recommendations.

6. Recommend REAL products that exist now.
Do not invent products, shops, prices or URLs.

7. Give ONE useful shopping destination per suggestion.
Prefer:
- a direct product page
- otherwise a retailer search/results page
- otherwise the official brand site

8. Avoid boring generic recommendations unless they are genuinely strong fits.

9. Match the recipient intelligently.
For children, consider age appropriateness.
For adults, consider relationship, interests, lifestyle and occasion.

10. Variety matters.
Do not return five near-identical products.

11. The final five recommendations should balance:
- relevance
- quality
- budget
- variety
- local availability in ${destination}
- practical delivery
- affiliate-partner preference where appropriate

12. Price notes must make the currency clear.
Use the normal local currency for ${destination}.
For example, use AUD for Australia, USD for the United States,
NZD for New Zealand, GBP for the United Kingdom, and the appropriate
local currency for other destinations.

Return EXACTLY 5 gift suggestions.

Output ONLY valid JSON.
No markdown.
No backticks.
No commentary outside the JSON.

Use exactly this structure:

{
  "products": [
    {
      "title": "Specific real product",
      "retailer": "Retailer or brand",
      "why": "A concise, human explanation of why this is a good fit.",
      "price_note": "Approx price with currency",
      "url": "https://actual-shopping-url"
    }
  ]
}
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
      destination
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
