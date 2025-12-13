// =============================
// Gift Lane – Unified Server
// Serves the website + the /curate API
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
    affiliate: "https://www.awin1.com/cread.php?awinmid=119813&awinaffid=2689862&ued=https%3A%2F%2Fwillandbear.com.au",
    category: ["fashion", "accessories", "gifts"],
    vibe: ["premium", "sustainable", "travel"]
  },    
    "YCZ Fragrance": {
  brand: "YCZ Fragrance",
  homepage: "https://yczfragrance.com",
  affiliate: "https://www.awin1.com/cread.php?awinmid=121156&awinaffid=2689862&ued=https%3A%2F%2Fyczfragrance.com",
  category: ["beauty", "fragrance", "gifts"],
  vibe: ["luxury", "sensual", "modern"]
  }
};

// Required to correctly resolve file paths on Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -----------------------------
// STATIC WEBSITE
// -----------------------------
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(cors());

// -----------------------------
// OpenAI client setup
// -----------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -----------------------------
// Helper: Budget parsing
// -----------------------------
function parseBudget(raw) {
  if (!raw) return { min: null, max: null, raw: null };

  const str = String(raw).replace(/,/g, "");
  const matches = str.match(/\d+(\.\d+)?/g);

  if (!matches) return { min: null, max: null, raw };

  const nums = matches.map((n) => parseFloat(n));
  const first = nums[0];
  const second = nums[1];

  if (second != null) return { min: first, max: second, raw };

  if (/under|below|less than|up to|upto/i.test(str))
    return { min: null, max: first, raw };

  if (/over|more than|at least|from/i.test(str))
    return { min: first, max: null, raw };

  return { min: first, max: first, raw };
}

// -----------------------------
// Gift Prompt Builder
// -----------------------------
function buildGiftPrompt(recipient, occasion, budget) {
  const { min, max, raw } = parseBudget(budget);

  let central = null;
  if (min != null && max != null) central = (min + max) / 2;
  else if (min != null) central = min;
  else if (max != null) central = max;

  let count = 5;
  if (central != null) {
    if (central < 150) count = 3;
    else if (central >= 150 && central <= 400) count = 5;
    else count = 8;
  }

  return `
You are Gift Lane’s calm, luxe-feeling gift concierge.

Recipient: ${recipient}
Occasion: ${occasion}
Budget: ${raw || budget}

Return EXACTLY ${count} product suggestions.

IMPORTANT:
- Suggest REAL, commonly available products/brands.
- Do NOT invent “random Etsy shop” type items.
- Provide links as retailer SEARCH links (not deep product links) so they stay valid.
- If a suggestion fits an approved partner brand, you MAY include it.
- Approved partner brands:
  - Will & Bear (premium sustainable hats & accessories, Australia)
  - YCZ Fragrance (luxury fragrances, Australia)

Output ONLY valid JSON in this exact shape (no markdown, no backticks, no commentary):

{
  "products": [
    {
      "title": "Product name",
      "why": "1–2 sentences why it fits",
      "price_note": "Approx $XX–$YY",
      "links": [
        { "label": "Amazon AU", "url": "https://www.amazon.com.au/s?k=..." },
        { "label": "The Iconic", "url": "https://www.theiconic.com.au/search/?q=..." }
      ]
    }
  ]
}
`.trim();
}

// -----------------------------
// -----------------------------
// /curate route – AI suggestions
// -----------------------------
app.post("/curate", async (req, res) => {
  try {
    const { demographic, occasion, budget } = req.body;

    if (!demographic || !occasion || !budget) {
      return res.status(400).json({ error: "Missing fields in request." });
    }

    const prompt = buildGiftPrompt(demographic, occasion, budget);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 900,
    });

    // ⚠️ IMPORTANT: OpenAI sometimes wraps JSON in markdown
    let rawText = response.output_text || "";

    // 🔧 HARD CLEAN
    rawText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("JSON parse failed:", rawText);
      return res.status(500).json({
        error: "AI returned non-JSON. Try again.",
      });
    }

    if (!Array.isArray(parsed.products)) {
      return res.status(500).json({
        error: "AI JSON missing products array.",
      });
    }

    // ✅ Final safety normalisation
    const cleaned = {
      products: parsed.products.map((p) => ({
        title: String(p.title || "").slice(0, 120),
        why: String(p.why || "").slice(0, 300),
        price_note: String(p.price_note || ""),
        links: Array.isArray(p.links)
          ? p.links
              .filter((l) => l?.url?.startsWith("https://"))
              .map((l) => ({
                label: String(l.label || "Search").slice(0, 30),
                url: String(l.url).slice(0, 400),
              }))
          : [],
      })),
    };

    res.json(cleaned);
  } catch (err) {
    console.error("Error in /curate:", err);
    res.status(500).json({
      error: "Something went wrong talking to OpenAI.",
    });
  }
});


// -----------------------------
// SERVER START (Render)
// -----------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Gift Lane server running on port ${port}`);
});




