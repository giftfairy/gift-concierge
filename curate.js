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

app.post("/curate", async (req, res) => {
  try {
    const { demographic, occasion, budget } = req.body;

    if (!demographic || !occasion || !budget) {
      return res.status(400).json({ error: "Missing fields in request." });
    }

    const prompt = `
Create 3 personalised gift recommendations.

Person: ${demographic}
Occasion: ${occasion}
Budget: ${budget}

For each recommendation, include:
- A fun name
- Why it's a good fit for this person/occasion
- A rough price range
- One or two example items (no links needed)
Keep it friendly, specific, and practical.
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 400,
    });

    // OpenAI Node SDK gives us nice combined text here:
    const text = response.output_text;

    res.json({ suggestions: text });
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
