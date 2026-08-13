import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Helper to initialize GoogleGenAI securely
  const getGeminiAi = (customKey?: string) => {
    const apiKey = customKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("No hay GEMINI_API_KEY configurada. Configúrala en la sección de Ajustes o en Secrets.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Helper to initialize OpenAI securely
  const getOpenAi = (customKey?: string) => {
    const apiKey = customKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("No hay OPENAI_API_KEY configurada. Ingrésala en Ajustes de IA o en el archivo .env.");
    }
    return new OpenAI({ apiKey });
  };

  // Test Connection Route
  app.post("/api/ai/test-connection", async (req, res) => {
    const startTime = Date.now();
    try {
      const { provider = "gemini", apiKey, model = "gemini-3.6-flash" } = req.body || {};

      if (provider === "openai") {
        const openai = getOpenAi(apiKey);
        const selectedModel = model || "gpt-4o-mini";

        const response = await openai.chat.completions.create({
          model: selectedModel,
          messages: [{ role: "user", content: "Responde únicamente con la frase exacta: 'Conexión exitosa con OpenAI'." }],
          temperature: 0.1,
          max_tokens: 50,
        });

        const durationMs = Date.now() - startTime;
        res.json({
          ok: true,
          message: response.choices[0]?.message?.content?.trim() || "Conexión exitosa con OpenAI.",
          modelUsed: selectedModel,
          latencyMs: durationMs,
        });
      } else {
        // Default to Gemini
        const ai = getGeminiAi(apiKey);
        const selectedModel = model || "gemini-3.6-flash";

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: [{ role: "user", parts: [{ text: "Responde únicamente con la frase exacta: 'Conexión exitosa con Gemini AI'." }] }],
          config: { temperature: 0.1 },
        });

        const durationMs = Date.now() - startTime;
        res.json({
          ok: true,
          message: response.text?.trim() || "Conexión exitosa con Gemini AI.",
          modelUsed: selectedModel,
          latencyMs: durationMs,
        });
      }
    } catch (error: any) {
      console.error("Error in test-connection route:", error);
      res.status(500).json({
        ok: false,
        error: error.message || "Error al verificar la conexión con el proveedor de IA.",
      });
    }
  });

  // API endpoint for AI Assistant
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, context, settings } = req.body || {};
      
      const provider = settings?.provider || "gemini";
      const customApiKey = settings?.apiKey;
      const temperature = typeof settings?.temperature === 'number' ? settings.temperature : 0.7;
      const assistantName = settings?.assistantName || "D'RAYO AI";
      const customSystemInstruction = settings?.systemInstruction;

      const baseSystemInstruction = customSystemInstruction || `Eres "${assistantName}", el asistente inteligente oficial de la marca D'RAYO (E-commerce de moda/ropa en Perú).
Tu función es brindar asesoramiento estratégico de negocio, análisis financiero, cálculo de ROAS de Meta Ads, optimización de ventas por WhatsApp y gestión de inventarios.

Reglas clave:
- Responde siempre en idioma español, de forma muy clara, profesional, con viñetas y formato Markdown visualmente atractivo.
- Los precios y finanzas están expresados en Soles Peruanos (S/ PEN).
- Utiliza los datos del contexto actual del negocio enviado por el cliente para responder preguntas sobre sus ventas, rentabilidad, inventario y Meta Ads.
- Si te preguntan sobre estrategias de marketing o consejos, brinda respuestas prácticas enfocadas en pymes e-commerce peruanas en WhatsApp y Meta Ads.`;

      const fullSystemInstruction = `${baseSystemInstruction}\n\nContexto actual de la tienda D'RAYO:\n${context || "No hay contexto proporcionado."}`;

      if (provider === "openai") {
        const openai = getOpenAi(customApiKey);
        const selectedModel = settings?.model || "gpt-4o-mini";

        const formattedMessages = [
          { role: "system" as const, content: fullSystemInstruction },
          ...(messages || []).map((msg: any) => ({
            role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
            content: msg.content,
          })),
        ];

        const completion = await openai.chat.completions.create({
          model: selectedModel,
          messages: formattedMessages,
          temperature,
        });

        res.json({ text: completion.choices[0]?.message?.content || "Sin respuesta de OpenAI." });
      } else {
        // Default: Google Gemini
        const ai = getGeminiAi(customApiKey);
        const selectedModel = settings?.model || "gemini-3.6-flash";

        const formattedContents = (messages || []).map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: formattedContents.length > 0 ? formattedContents : [{ role: "user", parts: [{ text: "Hola, preséntate brevemente." }] }],
          config: {
            systemInstruction: fullSystemInstruction,
            temperature,
          },
        });

        res.json({ text: response.text });
      }
    } catch (error: any) {
      console.error("Error in AI Assistant API route:", error);
      res.status(500).json({ error: error.message || "Ocurrió un error al procesar tu solicitud con el Asistente de IA." });
    }
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

