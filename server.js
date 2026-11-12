
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

    if (!message) {
      return res.status(400).json({ error: "Escribí un mensaje." });
    }

    if (message.length > 4000) {
      return res.status(413).json({ error: "El mensaje es demasiado largo." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "Falta configurar la clave de Groq en Render."
      });
    }

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
          messages: [
            {
              role: "system",
              content: "Sos LOREN AI, un asistente amable que responde en español."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Groq:", data);
      return res.status(502).json({
        error: "Groq no pudo responder. Revisá la clave y el servicio."
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
  console.log(`LOREN AI está en el puerto ${PORT}`);
});

