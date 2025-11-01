import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Conexão com Supabase (Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Endpoint principal
app.get("/", (req, res) => {
  res.send("✅ Tracking Server online!");
});

// Endpoint de tracking
app.post("/track", async (req, res) => {
  const { event_name, user_id, page_url, metadata } = req.body;

  if (!event_name) {
    return res.status(400).json({ error: "event_name é obrigatório" });
  }

  try {
    const query = `
      INSERT INTO events (event_name, user_id, page_url, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [event_name, user_id, page_url, metadata || {}];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    res.status(500).json({ error: "Erro ao salvar evento" });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
