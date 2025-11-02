import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();

app.use(express.json());

// Configura o pool de conexões com o Supabase (Session Pooler)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // evita erro de certificado no Render
  },
  max: 5, // número máximo de conexões simultâneas
  idleTimeoutMillis: 30000 // fecha conexões inativas após 30s
});

// Função pra testar a conexão assim que o servidor sobe
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao banco com sucesso!");
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar ao banco:", err.message);
  }
}

app.post("/track", async (req, res) => {
  const { event_name, user_id, page_url, metadata } = req.body;

  if (!event_name || !user_id) {
    return res.status(400).json({ success: false, error: "Campos obrigatórios ausentes" });
  }

  try {
    const query = `
      INSERT INTO tracking_events (event_name, user_id, page_url, metadata, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `;
    const values = [event_name, user_id, page_url, metadata || {}];

    await pool.query(query, values);
    res.json({ success: true, message: "Evento salvo com sucesso" });
  } catch (err) {
    console.error("❌ Erro ao salvar evento:", err.message);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  testConnection();
});
