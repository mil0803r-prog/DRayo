import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import dotenv from "dotenv";
import {
  loadDatabase,
  saveDatabaseToDisk,
  getDatabaseStats,
  createDatabaseBackup,
  restoreDatabaseBackup,
  resetDatabaseToDefaults,
  DatabaseSchema,
} from "./server/db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

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

  // ==========================================
  // DATABASE API ROUTES
  // ==========================================

  // 1. Get Database Status & Statistics
  app.get("/api/db/status", (req, res) => {
    try {
      const stats = getDatabaseStats();
      res.json({ ok: true, stats });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || "Error al obtener estado de BD" });
    }
  });

  // 2. Get All Database Data
  app.get("/api/db/all", (req, res) => {
    try {
      const db = loadDatabase();
      res.json({
        ok: true,
        data: {
          products: db.products,
          sales: db.sales,
          dailyRecords: db.dailyRecords,
          metaExpenses: db.metaExpenses,
          indirectCosts: db.indirectCosts || [],
          templates: db.templates,
          pricingRecords: db.pricingRecords || [],
          aiSettings: db.aiSettings,
          lastUpdated: db.lastUpdated,
          version: db.version,
        },
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || "Error al cargar datos de BD" });
    }
  });

  // 3. Sync Full State (Batch save)
  app.post("/api/db/sync", (req, res) => {
    try {
      const { products, sales, dailyRecords, metaExpenses, indirectCosts, templates, pricingRecords, aiSettings } = req.body || {};
      const currentDb = loadDatabase();

      const updatedDb: DatabaseSchema = {
        version: currentDb.version || 2,
        lastUpdated: new Date().toISOString(),
        products: Array.isArray(products) ? products : currentDb.products,
        sales: Array.isArray(sales) ? sales : currentDb.sales,
        dailyRecords: Array.isArray(dailyRecords) ? dailyRecords : currentDb.dailyRecords,
        metaExpenses: Array.isArray(metaExpenses) ? metaExpenses : currentDb.metaExpenses,
        indirectCosts: Array.isArray(indirectCosts) ? indirectCosts : (currentDb.indirectCosts || []),
        templates: Array.isArray(templates) ? templates : currentDb.templates,
        pricingRecords: Array.isArray(pricingRecords) ? pricingRecords : (currentDb.pricingRecords || []),
        aiSettings: aiSettings || currentDb.aiSettings,
        backups: currentDb.backups || [],
      };

      const success = saveDatabaseToDisk(updatedDb);
      if (success) {
        res.json({ ok: true, message: "Base de datos sincronizada con éxito", lastUpdated: updatedDb.lastUpdated });
      } else {
        res.status(500).json({ ok: false, error: "No se pudo guardar la base de datos en disco" });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || "Error al sincronizar base de datos" });
    }
  });

  // 4. Products CRUD
  app.post("/api/db/products", (req, res) => {
    try {
      const newProduct = req.body;
      if (!newProduct || !newProduct.name) {
        return res.status(400).json({ ok: false, error: "Datos de producto inválidos" });
      }
      const db = loadDatabase();
      // If product exists, update, else push
      const idx = db.products.findIndex((p) => p.id === newProduct.id);
      if (idx >= 0) {
        db.products[idx] = newProduct;
      } else {
        db.products.push(newProduct);
      }
      saveDatabaseToDisk(db);
      res.json({ ok: true, product: newProduct });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.put("/api/db/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedProduct = req.body;
      const db = loadDatabase();
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx >= 0) {
        db.products[idx] = { ...db.products[idx], ...updatedProduct };
        saveDatabaseToDisk(db);
        res.json({ ok: true, product: db.products[idx] });
      } else {
        res.status(404).json({ ok: false, error: "Producto no encontrado" });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/db/products/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      db.products = db.products.filter((p) => p.id !== id);
      saveDatabaseToDisk(db);
      res.json({ ok: true, message: "Producto eliminado de BD" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 5. Daily Records CRUD
  app.post("/api/db/daily-records", (req, res) => {
    try {
      const newRecord = req.body;
      const db = loadDatabase();
      const idx = db.dailyRecords.findIndex((r) => r.id === newRecord.id);
      if (idx >= 0) {
        db.dailyRecords[idx] = newRecord;
      } else {
        db.dailyRecords.unshift(newRecord);
      }
      saveDatabaseToDisk(db);
      res.json({ ok: true, record: newRecord, lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/db/daily-records/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      db.dailyRecords = db.dailyRecords.filter((r) => r.id !== id);
      saveDatabaseToDisk(db);
      res.json({ ok: true, message: "Registro diario eliminado de BD", lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/daily-records/bulk-delete", (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ ok: false, error: "IDs deben ser un array" });
      }
      const db = loadDatabase();
      const idsSet = new Set(ids);
      db.dailyRecords = db.dailyRecords.filter((r) => !idsSet.has(r.id));
      saveDatabaseToDisk(db);
      res.json({ ok: true, deletedCount: ids.length, lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 5.1 Individual Sales CRUD
  app.post("/api/db/sales", (req, res) => {
    try {
      const newSale = req.body;
      if (!newSale || !newSale.id) {
        return res.status(400).json({ ok: false, error: "Datos de venta inválidos" });
      }
      const db = loadDatabase();
      if (!Array.isArray(db.sales)) db.sales = [];
      const idx = db.sales.findIndex((s) => s.id === newSale.id);
      if (idx >= 0) {
        db.sales[idx] = newSale;
      } else {
        db.sales.unshift(newSale);
      }
      saveDatabaseToDisk(db);
      res.json({ ok: true, sale: newSale, lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.put("/api/db/sales/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedFields = req.body;
      const db = loadDatabase();
      if (!Array.isArray(db.sales)) db.sales = [];
      const idx = db.sales.findIndex((s) => s.id === id);
      if (idx >= 0) {
        db.sales[idx] = { ...db.sales[idx], ...updatedFields };
        saveDatabaseToDisk(db);
        res.json({ ok: true, sale: db.sales[idx], lastUpdated: db.lastUpdated });
      } else {
        res.status(404).json({ ok: false, error: "Venta no encontrada" });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/db/sales/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      if (!Array.isArray(db.sales)) db.sales = [];
      db.sales = db.sales.filter((s) => s.id !== id);
      saveDatabaseToDisk(db);
      res.json({ ok: true, message: "Venta eliminada de BD", lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 6. Meta Expenses CRUD
  app.post("/api/db/meta-expenses", (req, res) => {
    try {
      const expense = req.body;
      const db = loadDatabase();
      if (!Array.isArray(db.metaExpenses)) db.metaExpenses = [];
      const idx = db.metaExpenses.findIndex((e) => e.id === expense.id);
      if (idx >= 0) {
        db.metaExpenses[idx] = expense;
      } else {
        db.metaExpenses.unshift(expense);
      }
      saveDatabaseToDisk(db);
      res.json({ ok: true, expense });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/db/meta-expenses/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      if (!Array.isArray(db.metaExpenses)) db.metaExpenses = [];
      db.metaExpenses = db.metaExpenses.filter((e) => e.id !== id);
      saveDatabaseToDisk(db);
      res.json({ ok: true, message: "Gasto de publicidad eliminado de BD", lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/meta-expenses/bulk-delete", (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ ok: false, error: "IDs deben ser un array" });
      }
      const db = loadDatabase();
      if (!Array.isArray(db.metaExpenses)) db.metaExpenses = [];
      const idsSet = new Set(ids);
      db.metaExpenses = db.metaExpenses.filter((e) => !idsSet.has(e.id));
      saveDatabaseToDisk(db);
      res.json({ ok: true, deletedCount: ids.length, lastUpdated: db.lastUpdated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 7. Pricing Calculations CRUD
  app.post("/api/db/pricing-records", (req, res) => {
    try {
      const record = req.body;
      const db = loadDatabase();
      if (!db.pricingRecords) db.pricingRecords = [];
      const idx = db.pricingRecords.findIndex((r) => r.id === record.id);
      if (idx >= 0) {
        db.pricingRecords[idx] = record;
      } else {
        db.pricingRecords.unshift(record);
      }
      saveDatabaseToDisk(db);
      res.json({ ok: true, record });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/db/pricing-records/:id", (req, res) => {
    try {
      const { id } = req.params;
      const db = loadDatabase();
      if (!db.pricingRecords) db.pricingRecords = [];
      db.pricingRecords = db.pricingRecords.filter((r) => r.id !== id);
      saveDatabaseToDisk(db);
      res.json({ ok: true, message: "Cálculo de precio eliminado de BD" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/pricing-records/bulk-delete", (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ ok: false, error: "IDs deben ser un array" });
      }
      const db = loadDatabase();
      if (!db.pricingRecords) db.pricingRecords = [];
      const idsSet = new Set(ids);
      db.pricingRecords = db.pricingRecords.filter((r) => !idsSet.has(r.id));
      saveDatabaseToDisk(db);
      res.json({ ok: true, deletedCount: ids.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 8. Database Backups & Snapshots
  app.get("/api/db/backups", (req, res) => {
    try {
      const db = loadDatabase();
      res.json({ ok: true, backups: db.backups || [] });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/backup", (req, res) => {
    try {
      const { label } = req.body || {};
      const backup = createDatabaseBackup(label);
      res.json({ ok: true, backup, message: "Punto de respaldo guardado en la base de datos" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/restore/:id", (req, res) => {
    try {
      const { id } = req.params;
      const success = restoreDatabaseBackup(id);
      if (success) {
        res.json({ ok: true, message: "Base de datos restaurada correctamente desde el punto de respaldo" });
      } else {
        res.status(404).json({ ok: false, error: "Punto de respaldo no encontrado" });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/db/reset", (req, res) => {
    try {
      const fresh = resetDatabaseToDefaults();
      res.json({ ok: true, data: fresh, message: "Base de datos reiniciada a valores iniciales" });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Export full JSON database
  app.get("/api/db/export", (req, res) => {
    try {
      const db = loadDatabase();
      res.setHeader("Content-Disposition", `attachment; filename="drayo_database_backup_${Date.now()}.json"`);
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Import full JSON database
  app.post("/api/db/import", (req, res) => {
    try {
      const importedData = req.body;
      if (!importedData || typeof importedData !== "object") {
        return res.status(400).json({ ok: false, error: "Estructura JSON inválida" });
      }

      const currentDb = loadDatabase();
      const newDb: DatabaseSchema = {
        version: importedData.version || 2,
        lastUpdated: new Date().toISOString(),
        products: Array.isArray(importedData.products) ? importedData.products : currentDb.products,
        sales: Array.isArray(importedData.sales) ? importedData.sales : currentDb.sales,
        dailyRecords: Array.isArray(importedData.dailyRecords) ? importedData.dailyRecords : currentDb.dailyRecords,
        metaExpenses: Array.isArray(importedData.metaExpenses) ? importedData.metaExpenses : currentDb.metaExpenses,
        templates: Array.isArray(importedData.templates) ? importedData.templates : currentDb.templates,
        pricingRecords: Array.isArray(importedData.pricingRecords) ? importedData.pricingRecords : currentDb.pricingRecords,
        aiSettings: importedData.aiSettings || currentDb.aiSettings,
        backups: currentDb.backups || [],
      };

      saveDatabaseToDisk(newDb);
      res.json({ ok: true, message: "Base de datos importada y guardada con éxito", data: newDb });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

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
      const customApiKey = settings?.apiKey || (provider === "openai" ? settings?.openAiApiKey : settings?.geminiApiKey);
      const temperature = typeof settings?.temperature === 'number' ? settings.temperature : 0.7;
      const assistantName = settings?.assistantName || "D'RAYO AI";
      const customSystemInstruction = settings?.systemInstruction;

      const baseSystemInstruction = customSystemInstruction || `Eres "${assistantName}", el asesor financiero, estratega de Meta Ads y asistente ejecutivo oficial de la marca D'RAYO (E-commerce de moda urbana en Perú).

🎯 DIRECTRICES DE FORMATO Y ESTILO PRO:
1. Responde siempre en español, con un tono ejecutivo, directo, analítico y motivador.
2. ESTRUCTURA PRO DE PÁRRAFOS Y NÚMEROS:
   - Resalta siempre los números, precios y métricas clave en negrita y formato legible:
     * Monedas en Soles: **S/ 1,250.00**
     * ROAS: **3.45x ROAS**
     * Márgenes y porcentajes: **35.5% de margen**
     * Unidades/Volumen: **25 prendas**, **40 pedidos**
   - Agrupa los análisis en párrafos cortos y estructurados con viñetas temáticas (📊 Métricas, 💡 Diagnóstico, 🚀 Plan de Acción).
   - Evita bloques de texto monótonos; usa subtítulos con emojis o viñetas claras.
3. Si el usuario consulta sobre ventas, finanzas o inventario, usa con precisión los datos en tiempo real del contexto de la tienda proporcionado.
4. Para consultas de ventas por WhatsApp y Meta Ads, proporciona respuestas accionables (estrategias de cierre con Yape/Plin, optimización de CPA, combos 2x/3x para subir el ticket promedio).`;

      const fullSystemInstruction = `${baseSystemInstruction}\n\n📊 CONTEXTO FINANCIERO Y OPERATIVO EN TIEMPO REAL (D'RAYO):\n${context || "No hay contexto proporcionado."}`;

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

