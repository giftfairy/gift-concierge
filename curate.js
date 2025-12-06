// Simple Express API for Gift Concierge on Render

import express from "express";
import OpenAI from "openai";
import cors from "cors";

const app = express();

// Allow JSON and cross-origin requests (from your static site)
app.use(express.json());
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rough budget parser.
 * Tries to pull out min/max numbers from things like:
 * "$80–$120", "around 200", "up to 300", "under 150", "500"
 */
function parseBudget(raw) {
  if (!raw) {
    return { min: null, max: null, raw: null };
  }

  const str = String(raw).replace(/,/g, "");
  const matches = str.match(/\d+(\.\d+)?/g);

  if (!matches) {
    return { min: null, max: null, raw };
  }

  const nums = matches.map((n) => parseFloat(n));
  const first = nums[0];
  const second = nums[1];

  // If we clearly have a range like "80-120"
  if (second != null) {
    return { min: first, max: second, raw };
  }

  // Phrases that usually mean "up to X"
  if (/under|below|less than|up to|upto/i.test(str)) {
    return { min: null, max: first, raw };
  }

  // Phrases that usually mean "from X" or "over X"
  if (/over|more than|at least|from/i.test(str)) {
    return { min: first, max: null, raw };
  }

  // Otherwise treat it as a single-point budget
  return { min: first, max: first, raw };
}

/**
 * Build a smart prompt that changes the number of ideas
 * based on the budget band.
 */
function buildGiftPrompt(recipient, occasion, budget) {
  const { min, max, raw } = parseBudget(budget);

  // Work out a "central" budget value (for banding)
  let central = null;
  if (min != null && max != null) {
    central = (min + max) / 2;
  } else if (min != null) {
    central = min;
  } else if (max != null) {
    central = max;
  }

  // Decide which band we’re in, for number of ideas
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

  const prompt = `
You are a calm, thoughtful, luxe-feeling gift-concierge assistant.

The user will tell you:
- Who the gift is for
- The occasion
- Their approximate budget

Your job is to suggest a set of gift ideas that genuinely fit that person and price range, with a focus on thoughtful, feel-good gifting rather than cheap clutter.

BUDGET CONTEXT (AUD)
- BudgetText: "${raw || budget || "not provided"}"
- BudgetMin: ${min != null ? min : "unknown"}
- BudgetMax: ${max != null ? max : "unknown"}
- BudgetBand: ${budgetBand}
- The user is in Australia and prices should be considered in AUD.

NUMBER OF IDEAS
Use the budget band to decide how many ideas to give:
- If BudgetBand is "under_150" or the budget clearly sits under $150 → give **3–4** ideas
- If BudgetBand is "150_to_400" or the budget clearly sits between $150–$400 → give **5–7** ideas
- If BudgetBand is "over_400" or the budget clearly sits over $400 → give **8–10** ideas
If the budget is unclear, make a reasonable assumption and choose a sensible number of ideas.

FORMAT FOR EACH IDEA
For each idea, include:
1. A short **bold title** for the idea  
2. A one–sentence line starting with “Why it’s a good fit:”  
3. A “Price range:” line (use a sensible range, not a single number, in AUD)  
4. 2–4 example items on separate lines starting with “- ” (dash + space)

TONE
- Calm, warm, and quietly confident – like a high-end store assistant who actually listens
- Practical but elevated: mix “treat” items with a couple of more useful or everyday things when it suits the person
- Assume the user is in Australia:
  - Use AUD pricing
  - Prefer ideas available in Australia or from stores that ship to Australia
  - You can mention general categories (e.g. “Australian-made skincare set”) rather than specific US-only brands

OUTPUT FORMAT
Reply as **JSON**, with a single key called "suggestions".

The value of "suggestions" should be a single string containing all ideas in a numbered list, for example:

{
  "suggestions": "1. **Cozy Night-In Hamper**\\nWhy it’s a good fit: ... etc"
}

Use line breaks (\\n) between ideas and between bullet points so it’s easy to read.

Now use the actual details:

Recipient: ${recipient || "not provided"}
Occasion: ${occasion || "not provided"}
Budget (raw user text): ${raw || budget || "not provided"}

Return ONLY the JSON object, nothing else.
`.trim();

  return prompt;
}

app.post("/curate", async (req, res) => {
  try {
    const { demographic, occasion, budget } = req.body;

    if (!demographic || !occasion || !budget) {
      return res.status(400).json({ error: "Missing fields in request." });
    }

    // 🔹 Smart prompt with budget bands & up to 10 ideas
    const prompt = buildGiftPrompt(demographic, occasion, budget);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 800, // a bit higher, since we may have up to 10 ideas
    });

    // This is the raw text the model returned
    const rawText = response.output_text;

    let suggestionsText = rawText;

    // 🔹 NEW: try to parse JSON and extract "suggestions"
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed.suggestions === "string") {
        suggestionsText = parsed.suggestions;
      }
    } catch (e) {
      // If it isn't valid JSON, we just fall back to rawText
      console.warn("Model response was not valid JSON, returning raw text.");
    }

    // Frontend expects: { suggestions: "big text blob..." }
    res.json({ suggestions: suggestionsText });
  } catch (err) {
    console.error("Error in /curate:", err);
    res.status(500).json({ error: "Something went wrong talking to OpenAI." });
  }
});

// Render gives us PORT in the environment
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Gift Concierge API listening on port ${port}`);
});
