
const { app, BrowserWindow, shell } = require("electron");

const express = require("express");
const path = require("path");

const serverApp = express();
const PORT = 3210;

serverApp.use(express.json({ limit: "20kb" }));
serverApp.use(express.static(path.join(__dirname, "..", "public")));

serverApp.post("/api/chat", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({ error: "Escribí un mensaje." });
    }

    const response = await fetch(
      "https://two-generation-loren-ai.onrender.com/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "No pude conectar con LOREN AI. Revisá tu conexión a Internet."
    });
  }
});

let localServer;

function createWindow() {
  const win = new BrowserWindow({
    width: 1250,
    height: 850,
    minWidth: 850,
    minHeight: 650,
    title: "LOREN AI 2.0",
    backgroundColor: "#080b18",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  win.loadURL(`http://127.0.0.1:${PORT}`);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  localServer = serverApp.listen(PORT, "127.0.0.1", createWindow);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (localServer) localServer.close();
});

