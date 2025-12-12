// =============================
// Gift Lane – Unified Server
// Serves the website + the /curate API
// =============================

import express from "express";
import OpenAI from "openai";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Required to correctly resolve file paths on Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -----------------------------
// STATIC WEBSITE
// -----------------------------
// This serves your public/index.html at giftlane.au
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
    if (central < 150) count = 2;
    else if (central >= 150 && central <= 400) count = 5;
    else count = 10;
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

Output ONLY valid JSON in this exact shape:

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

    const rawText = response.output_text;

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        error: "AI returned non-JSON. Try again.",
        debug: rawText.slice(0, 400),
      });
    }

    if (!parsed?.products || !Array.isArray(parsed.products)) {
      return res.status(500).json({ error: "AI JSON missing products array." });
    }

    // Optional: basic safety filter for links
    parsed.products = parsed.products.map((p) => ({
      title: String(p.title || "").slice(0, 120),
      why: String(p.why || "").slice(0, 300),
      price_note: String(p.price_note || "").slice(0, 60),
      links: Array.isArray(p.links)
        ? p.links
            .filter((l) => l?.url && String(l.url).startsWith("https://"))
            .slice(0, 4)
            .map((l) => ({
              label: String(l.label || "Link").slice(0, 30),
              url: String(l.url).slice(0, 400),
            }))
        : [],
    }));

    res.json(parsed);
  } catch (err) {
    console.error("Error in /curate:", err);
    res.status(500).json({ error: "Something went wrong talking to OpenAI." });
  }
});


// -----------------------------
// SERVER START (Render)
// -----------------------------
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Gift Lane server running on port ${port}`);
});

