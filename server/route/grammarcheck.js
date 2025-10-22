require("dotenv").config();
const express = require("express");
const axios = require("axios");
const grammarCheckRoute = express.Router();

console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY);

grammarCheckRoute.post("/", async (req, res) => {
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

    // 📝 Step 3: Create grammar correction prompt
    const prompt = `
You are an English grammar correction assistant.
Fix any grammatical, spelling, or tense mistakes.
Return only the corrected sentence — do not explain.

Example:
Input: I ate tomorrow
Output: I will eat tomorrow.

Now correct this text:
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
      "❌ Error in /api/grammar-check route:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

module.exports = grammarCheckRoute;
