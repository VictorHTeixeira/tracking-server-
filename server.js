// server.js
import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const { Pool } = pkg;
const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Conexão com o banco de dados (com SSL habilitado para o Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Teste inicial de conexão
pool.connect()
  .then(() => console.log("✅ Conectado ao banco de dados com sucesso!"))
  .catch((err) => console.error("❌ Erro ao conectar ao banco:", err.message));

// Endpoint principal
app.post("/track", async (req, res) => {
  const { event_name, user_id, page_url, metadata } = req.body;

  try {
    // Validação básica
    if (!event_name || !user_id || !page_url) {
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios: event_name, user_id, page_url"
      });
    }

    // Inserção no banco
    const result = await pool.query(
      "INSERT INTO events (event_name, user_id, page_url, metadata) VALUES ($1, $2, $3, $4) RETURNING *",
      [event_name, user_id, page_url, metadata || {}]
    );

    console.log("✅ Novo evento registrado:", result.rows[0]);

    res.status(200).json({
      success: true,
      event: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Erro ao salvar evento:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Rota de verificação rápida
app.get("/", (req, res) => {
  res.send("🔥 Tracking Server está ativo e funcionando!");
});

// Inicializa o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
