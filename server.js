const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve semua file static dari ROOT
app.use(express.static(path.join(__dirname)));

/* =========================
   API ROUTES (AMAN)
========================= */

app.get("/api/whois/:domain", async (req, res) => {
  const { domain } = req.params;

  res.json({
    success: true,
    domain,
    registered: true,
    message: "Gunakan tools WHOIS external untuk informasi lengkap"
  });
});

app.get("/api/download", async (req, res) => {
  const { url, type } = req.query;

  res.json({
    success: true,
    message: "Downloader service will be implemented soon",
    url,
    type
  });
});

app.get("/api/analytics", async (req, res) => {
  res.json({
    totalVisits: 0,
    activeUsers: 0,
    revenue: 0,
    quests: 0,
    markers: 0,
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "3.0.0",
    environment: "production"
  });
});

/* =========================
   SPA FALLBACK (WAJIB)
========================= */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ❌ JANGAN app.listen()
// ✅ Vercel akan handle server
module.exports = app;
