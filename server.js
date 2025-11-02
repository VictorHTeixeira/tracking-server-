import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(express.json());

// 🔧 Configuração do pool de conexões (Session Pooler do Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

// 🧠 Testa conexão inicial
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao banco com sucesso!");
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  }
}

// 🚀 Endpoint principal — recebe e salva eventos
app.post("/track", async (req, res) => {
  const { event_name, user_id, page_url, metadata } = req.body;

  // Validação básica
  if (!event_name || !user_id) {
    return res.status(400).json({
      success: false,
      error: "Campos obrigatórios ausentes (event_name, user_id).",
    });
  }

  try {
    // 🏗️ Cria tabela automaticamente (caso não exista)
    const createTable = `
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        event_name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        page_url TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await pool.query(createTable);

    // 💾 Insere o evento
    const insertQuery = `
      INSERT INTO events (event_name, user_id, page_url, metadata)
      VALUES ($1, $2, $3, $4)
    `;
    const values = [event_name, user_id, page_url, metadata || {}];
    await pool.query(insertQuery, values);

    console.log(`✅ Evento salvo: ${event_name} (${user_id})`);
    res.json({ success: true, message: "Evento salvo com sucesso!" });
  } catch (err) {
    // 🧩 Log detalhado para depuração
    console.error("❌ Erro ao salvar evento completo:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Erro desconhecido",
      stack: err.stack,
    });
  }
});

// 🚀 Inicializa o servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  testConnection();
});
