const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ error: "Escribí un mensaje." });
    if (message.length > 4000) return res.status(413).json({ error: "El mensaje es demasiado largo." });

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: message }],
        stream: false
      })
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "No pude conectar con Ollama. Comprobá que esté instalado y funcionando en esta computadora."
      });
    }

    const data = await response.json();
    res.json({ reply: data.message?.content || "No recibí una respuesta." });
  } catch (error) {
    res.status(502).json({
      error: "No encuentro la IA local. Instalá Ollama, iniciá un modelo y volvé a probar."
    });
  }
});

app.listen(PORT, () => {
  console.log(`LOREN AI está en http://localhost:${PORT}`);
});
