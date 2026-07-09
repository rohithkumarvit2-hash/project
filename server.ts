import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini client lazily to ensure server doesn't crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure JSON body parser
  app.use(express.json());

  // API route for password evaluation
  app.post("/api/evaluate", async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Please enter a valid sample password to analyze." });
        return;
      }

      // DO NOT log or store the password. Log length/metrics only for debugging.
      console.log(`[Security Policy Compliance] Received sample password for analysis. Length: ${password.length}`);

      const ai = getGeminiClient();

      const systemInstruction = `You are an expert Password Security Advisor. Your sole job is to evaluate a user-provided sample password for its security strength.
Evaluate it based on length, character variety (uppercase, lowercase, digits, symbols), common sequential patterns, keyboard walks (e.g. "qwerty", "12345"), and common dictionary words or names.

Strictly adhere to these rules:
1. NEVER output or repeat the original password in any part of your explanations, strongAlternative, or passphraseAlternative.
2. The score must be exactly one of: "Weak", "Medium", "Strong", or "Very Strong".
3. Provide exactly 2 to 3 concise, highly actionable bullet points analyzing the password's security or vulnerabilities. Avoid generic templates; make them specific to why this password is or is not safe.
4. Suggest one completely new, random, strong alternative password (min 14 chars, symbols, numbers, mixed case).
5. Suggest one memorable but highly secure passphrase alternative (e.g. 4+ unrelated words separated by hyphens, with mixed casing, digits, or symbols for extra security).
6. Treat this strictly as a hypothetical test or sample password.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Evaluate the strength of this sample password: "${password}"`,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.1, // low temperature for consistent classification
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: {
                type: Type.STRING,
                description: "Must be exactly 'Weak', 'Medium', 'Strong', or 'Very Strong'.",
              },
              explanations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 2 to 3 concise bullet points explaining specific vulnerabilities or strengths of this password.",
              },
              strongAlternative: {
                type: Type.STRING,
                description: "A highly secure alternative password with mixed characters, length >= 14, no common words.",
              },
              passphraseAlternative: {
                type: Type.STRING,
                description: "A memorable passphrase alternative containing 4 or more hypenated words, mixed uppercase, digits, or symbols.",
              }
            },
            required: ["score", "explanations", "strongAlternative", "passphraseAlternative"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from security analysis model.");
      }

      const parsedResult = JSON.parse(responseText.trim());
      res.json(parsedResult);
    } catch (error: any) {
      console.error("Error during password analysis:", error.message || error);
      res.status(500).json({ 
        error: "Failed to evaluate password strength. " + (error.message || "Please check your GEMINI_API_KEY configuration.")
      });
    }
  });

  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
