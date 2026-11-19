


const express = require("express");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const memory = String(req.body.memory || "");
    const history = Array.isArray(req.body.history)
      ? req.body.history
      : [];

    if (!message) {
      return res.status(400).json({ error: "Escribí un mensaje." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Falta configurar la clave de Groq en Render."
      });
    }

    const safeHistory = history
      .filter(item =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      )
      .slice(-12);

    const messages = [
      {
        role: "system",
        content: `Sos LOREN AI, un asistente inteligente, amable y que siempre habla en español.

RECUERDOS IMPORTANTES:
${memory || "Todavía no hay recuerdos guardados."}

Usá los recuerdos para personalizar tus respuestas.
Respetá cómo el usuario quiere que lo llamen.
No inventes recuerdos y nunca digas que recordás algo que no aparece aquí.`
      },
      ...safeHistory,
      { role: "user", content: message }
    ];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Groq:", data);
      return res.status(502).json({
        error: "Groq no pudo responder. Revisá los Logs de Render."
      });
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || "No recibí una respuesta."
    });

  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "No pude conectar con la inteligencia artificial."
    });
  }
});

app.listen(PORT, () => {
  console.log(`LOREN AI está funcionando en el puerto ${PORT}`);
});
