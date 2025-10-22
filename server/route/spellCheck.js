require("dotenv").config();
const express = require("express");
const axios = require("axios");
const spellCheckRoute = express.Router();

console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);

spellCheckRoute.post("/", async (req, res) => {
  const { text } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res
      .status(500)
      .json({ error: "Gemini API key not found in environment variables" });
  }

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    // 🔍 Step 1: Fetch available models
    const modelList = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    );

    const models = modelList.data.models.map((m) => m.name);

    // 🧠 Step 2: Pick a working model (prefer latest flash or pro)
    const model =
      models.find((m) => m.includes("gemini-2.0-pro")) ||
      models.find((m) => m.includes("gemini-1.5-pro")) ||
      models.find((m) => m.includes("gemini-1.5-flash")) ||
      models[0]; // fallback if nothing matches

    // 📝 Step 3: Create spelling-only correction prompt (no grammar changes)
    const prompt = `
You are a spell checker.
Task: ONLY fix misspelled words. Do not change grammar, word order, tone, style, or punctuation unless a punctuation mark is itself misspelled or obviously wrong (e.g., repeated characters). Preserve original capitalization and spacing except where correcting the misspelled word requires it.

Return only the corrected text with no extra words or explanations.

Examples:
Input: I am goin to shcool.
Output: I am goin to school.

Input: where are yu going
Output: where are you going

Text to correct:
"${text}"
`;

    // 🚀 Step 4: Call the Gemini model
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // ✅ Step 5: Extract corrected text
    const corrected =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Could not generate correction.";

    res.status(200).json({ corrected });
  } catch (error) {
    console.error(
      "❌ Error in /api/spell-check route:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// exports
module.exports = spellCheckRoute;
 