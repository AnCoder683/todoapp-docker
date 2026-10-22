import express from 'express';

const app = express();
const port = process.env.PORT ?? 3000;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
