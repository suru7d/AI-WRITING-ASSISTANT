require("dotenv").config();
const express = require("express");
const cors = require("cors");
const analyzeRoute = require("./route/analyze");
const grammarCheckRoute = require("./route/grammarcheck");
const spellCheckRoute = require("./route/spellCheck");
const app = express();

const PORT = process.env.PORT || 8000;
//https://api.openai.com/v1/chat/completions

//middlewares
app.use(cors()); //prevent cors error
app.use(express.json()); // help to parse incoming json data

//Routes
app.get("/", (req, res) => {
  res.json({ message: "AI Writing Assistant API is running!" });
});

app.use("/api/analyze", analyzeRoute);
app.use("/api/grammarcheck", grammarCheckRoute);
app.use("/api/spellcheck", spellCheckRoute);

//start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
