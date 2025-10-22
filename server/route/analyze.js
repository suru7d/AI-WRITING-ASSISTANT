require("dotenv").config();
const express = require("express");
const axios = require("axios");
const analyzeRoute = express.Router();

console.log("Gemini Key Loaded:", !!process.env.GEMINI_API_KEY); // ✅ check if key is loaded

analyzeRoute.post("/", async (req, res) => {
  const { sentence } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not found in environment variables" });
  }

  if (!sentence || sentence.trim() === "") {
    return res.status(400).json({ error: "Sentence is required" });
  }

  try {
    // Gemini model endpoint (latest working one)
    const model = "models/gemini-2.0-flash";

    const prompt = `You are a rewriting assistant.
Return exactly a JSON object with key "rephrases" holding 3 alternative rephrasings of the provided sentence. 
Rules: preserve meaning; improve clarity and grammar; vary tone slightly; no extra keys or text.

Example output:
{"rephrases": ["Alt 1", "Alt 2", "Alt 3"]}

Sentence: "${sentence}"`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let rephrases = [];
    try {
      // Try parsing strict JSON first
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonText = raw.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed.rephrases)) {
          rephrases = parsed.rephrases.map((s) => String(s).trim()).filter(Boolean);
        }
      }
    } catch {}

    // Fallback: split by lines or enumerations if JSON didn't parse
    if (rephrases.length === 0) {
      rephrases = raw
        .split(/\n+/)
        .map((l) => l.replace(/^\s*\d+\.?\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    res.status(200).json({ rephrasedSentences: rephrases });
  } catch (error) {
    console.error("Error in /api/analyze route:", error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = analyzeRoute;
