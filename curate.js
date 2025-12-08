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

  let budgetBand = "unknown";
  let ideaGuideline = "3–4 ideas";

  if (central != null) {
    if (central < 150) {
      budgetBand = "under_150";
      ideaGuideline = "3–4 ideas";
    } else if (central >= 150 && central <= 400) {
      budgetBand = "150_to_400";
      ideaGuideline = "5–7 ideas";
    } else if (central > 400) {
      budgetBand = "over_400";
      ideaGuideline = "8–10 ideas";
    }
  }

  return `
You are a calm, thoughtful, luxe-feeling gift-concierge assistant.

Recipient: ${recipient}
Occasion: ${occasion}
Budget: ${raw || budget}

Use the budget band (${budgetBand}) to decide how many ideas to offer (${ideaGuideline}).

Output ONLY JSON like:
{
  "suggestions": "1. **Gift Idea**\\nWhy it’s a good fit: ...etc"
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
      max_output_tokens: 800,
    });

    const rawText = response.output_text;
    let suggestionsText = rawText;

    try {
      const parsed = JSON.parse(rawText);
      if (parsed?.suggestions) suggestionsText = parsed.suggestions;
    } catch (e) {
      console.warn("Model returned non-JSON text – sending raw output.");
    }

    res.json({ suggestions: suggestionsText });
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
