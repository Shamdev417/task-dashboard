'use strict';

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const tasksRouter = require('./routes/tasks');

// Initialize DB (creates schema + seeds data on first run)
require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/tasks', tasksRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for any unmatched route
app.use((req, res) => {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found.` } });
});

// Global error handler (must be last)
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Task Dashboard API running on http://localhost:${PORT}`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/tasks`);
  console.log(`  GET  http://localhost:${PORT}/api/tasks/stats`);
});

module.exports = app;
