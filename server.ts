import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API routes FIRST
  app.post("/api/analyze-pose", async (req, res) => {
    try {
      const { imageBase64, exerciseName, anglesInfo, language } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      const langStr = language === 'zh' ? 'Chinese' : language === 'ms' ? 'Malay' : 'English';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: {
          parts: [
            {
              text: `You are a professional fitness coach specialized in real-time biomechanical analysis. 
              Your task is to analyze the user's form for ${exerciseName || 'the exercise'} in this image. 
              
              ${anglesInfo || ''}
              
              CRITICAL ANALYSIS CRITERIA:
              1. Biomechanical Alignment: Check if joints are properly aligned.
              2. Range of Motion: Determine if the user is performing the full range of motion.
              3. Injury Risk: Identify any immediate risks.
              4. Form Correction: Provide one high-impact correction if needed.

              OUTPUT REQUIREMENTS:
              - Be ultra-concise and direct.
              - Provide punchy, encouraging feedback in ${langStr} (under 30 words).
              - Provide an accuracy score from 0 to 100 based on the angles and posture.
              - Assess the injury risk level: 'Low', 'Medium', or 'High'.
              - If accuracy is below 80% or risk is Medium/High, provide a very brief warning about potential injury in ${langStr}.
              - Provide one clear, actionable instruction to correct the position in ${langStr}.

              Format your response as JSON: 
              { 
                "feedback": "...", 
                "accuracy": 85, 
                "riskLevel": "Low", 
                "warning": "...", 
                "instructions": "..." 
              }`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(cleanJson);

      res.json(result);
    } catch (error) {
      console.error("Error analyzing pose:", error);
      res.status(500).json({ error: "Failed to analyze pose" });
    }
  });

  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { imageBase64 } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              text: `Analyze this food image. 
              1. Identify the food name.
              2. Estimate the total weight of the food in grams.
              3. Calculate the total calories (kcal).
              4. Calculate protein (g), carbohydrates (g), and fat (g).
              5. Provide a confidence score (0-100).
              
              Format your response as JSON:
              {
                "name": "...",
                "weight": "...",
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "confidence": 0
              }`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json\n?|```/g, '').trim();
      const result = JSON.parse(cleanJson);

      res.json(result);
    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ error: "Failed to analyze food" });
    }
  });

  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { workoutCount, avgAcc, totalCals, language } = req.body;
      const langStr = language === 'zh' ? 'Chinese' : language === 'ms' ? 'Malay' : 'English';

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [{
            text: `Analyze this user's fitness and nutrition data:
            - Workouts: ${workoutCount} sessions
            - Average Accuracy: ${avgAcc.toFixed(1)}%
            - Total Calories Logged: ${totalCals} kcal
            
            Provide a professional, encouraging executive summary (max 60 words). 
            Suggest one specific adjustment to their plan (workout or nutrition).
            Language: ${langStr}.`
          }]
        }
      });
      res.json({ summary: response.text });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
