import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const DB_DIR = path.join(process.cwd(), "database");
  const DB_FILE = path.join(DB_DIR, "db.json");

  // Ensure database directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
  }

  // API Routes
  app.get("/api/db", (req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.status(404).json({ error: "Database not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to read database" });
    }
  });

  app.post("/api/db", (req, res) => {
    try {
      const data = req.body;
      
      // Save consolidated db.json
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

      // Also update individual files for convenience
      if (data.players) fs.writeFileSync(path.join(DB_DIR, "players.json"), JSON.stringify(data.players, null, 2));
      if (data.bosses) fs.writeFileSync(path.join(DB_DIR, "bosses.json"), JSON.stringify(data.bosses, null, 2));
      if (data.items) fs.writeFileSync(path.join(DB_DIR, "items.json"), JSON.stringify(data.items, null, 2));
      
      const config = {
        boss_categories: data.boss_categories,
        clanLogoUrl: data.clanLogoUrl,
        adminEmail: data.adminEmail
      };
      fs.writeFileSync(path.join(DB_DIR, "config.json"), JSON.stringify(config, null, 2));

      res.json({ success: true });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save database" });
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
