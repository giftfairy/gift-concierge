// Serverless function for Render
import OpenAI from "openai";

export const config = { path: "/curate" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { demographic, occasion, budget } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
      Create 3 personalised gift recommendations.
      Person: ${demographic}
      Occasion: ${occasion}
      Budget: $${budget}

      Return JSON with:
      [
        { "name": "", "price": "", "note": "", "affiliateLink": "" }
      ]
    `;

    const aiResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = aiResponse.choices[0].message.content;
    const suggestions = JSON.parse(text);

    res.status(200).json({ suggestions });

  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: "AI failed to generate suggestions" });
  }
}

