import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// 🔹 Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Render exige isso!
});

// 🔹 Rota de teste
app.get("/", (req, res) => {
  res.send("✅ Tracking server is running!");
});

// 🔹 Rota de tracking
app.post("/track", async (req, res) => {
  try {
    const { event_name, user_id, page_url, metadata } = req.body;
    if (!event_name || !user_id) {
      return res.status(400).json({ success: false, error: "Missing event_name or user_id" });
    }

    const result = await pool.query(
      "INSERT INTO events (event_name, user_id, page_url, metadata) VALUES ($1, $2, $3, $4) RETURNING *",
      [event_name, user_id, page_url, metadata]
    );

    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔹 Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
