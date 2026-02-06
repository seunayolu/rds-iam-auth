import express from "express";
import { loadConfig } from "./config.js";
import { initDb } from "./db.js";
import { child } from "./logger.js";

const log = child("server");
const app = express();
const port = process.env.PORT || 3000;

let db;

// serve static assets (CSS, images, client JS)
app.use('/static', express.static(new URL('./public', import.meta.url).pathname));

app.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, message, created_at FROM demo_table ORDER BY id DESC LIMIT 10"
    );

    const items = (rows || []).map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.message)}</td>
        <td>${new Date(r.created_at).toLocaleString()}</td>
      </tr>
    `).join('');

    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>IAM RDS Demo</title>
  <link rel="stylesheet" href="/static/style.css" />
  </head>
<body>
  <main class="container">
    <header class="header">
      <div>
        <h1>IAM RDS Demo</h1>
        <p class="muted">Demo UI for testing IAM-based RDS auth (local/demo use)</p>
      </div>
      <button class="theme-toggle">☀️ Light</button>
    </header>

    <section class="card">
      <form method="POST" action="/insert" class="row">
        <input name="msg" class="input" placeholder="Write a message..." />
        <button class="btn">Insert</button>
      </form>
    </section>

    <section class="card">
      <h2>Recent messages</h2>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>ID</th><th>Message</th><th>Created</th></tr></thead>
          <tbody>
            ${items}
          </tbody>
        </table>
      </div>
    </section>

    <footer class="foot muted">Running on port ${port}</footer>
  </main>
  <script src="/static/app.js"><\/script>
</body>
</html>`);
  } catch (err) {
    log.error('GET / failed', err);
    res.status(500).send('<h1>Error</h1><p>Unable to load messages.</p>');
  }
});

app.post("/insert", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    await db.query(
      "INSERT INTO demo_table (message) VALUES (?)",
      [req.body.msg || "Hello from IAM auth"]
    );
    res.redirect("/");
  } catch (err) {
    log.error('POST /insert failed', err);
    res.status(500).send('<h1>Error</h1><p>Unable to insert message.</p>');
  }
});

app.post("/api/insert", express.json(), async (req, res) => {
  try {
    const msg = req.body.msg || "Hello from IAM auth";
    await db.query(
      "INSERT INTO demo_table (message) VALUES (?)",
      [msg]
    );

    // Return the newly inserted row (with stub or real DB)
    const [rows] = await db.query(
      "SELECT id, message, created_at FROM demo_table ORDER BY id DESC LIMIT 1"
    );

    res.json({ row: rows[0] || { id: 1, message: msg, created_at: new Date().toISOString() } });
  } catch (err) {
    log.error('POST /api/insert failed', err);
    res.status(500).json({ error: 'Failed to insert message' });
  }
});

(async () => {
  const config = await loadConfig();
  db = await initDb(config);

  await db.query(`
    CREATE TABLE IF NOT EXISTS demo_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  app.listen(port, () => {
    log.info(`App running at http://localhost:${port}`);
  });
})();

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}