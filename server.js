const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("conversions.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS conversion_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_unit TEXT,
    to_unit TEXT,
    value REAL,
    result REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static("public"));

app.post("/api/convert", (req, res) => {
    const { from, to, value } = req.body;
    
    // Simple conversion logic for demo
    const rates = {
        "mm-cm": 0.1,
        "cm-mm": 10,
        "m-cm": 100,
        "cm-m": 0.01,
        "km-m": 1000,
        "m-km": 0.001
    };
    
    const key = `${from}-${to}`;
    const rate = rates[key];
    
    if (rate === undefined) {
        return res.status(400).json({ error: "Unsupported conversion" });
    }
    
    const result = value * rate;
    
    // Log to SQLite
    const stmt = db.prepare("INSERT INTO conversion_logs (from_unit, to_unit, value, result) VALUES (?, ?, ?, ?)");
    stmt.run(from, to, value, result);
    
    res.json({ result });
});

app.get("/api/history", (req, res) => {
    const logs = db.prepare("SELECT * FROM conversion_logs ORDER BY timestamp DESC LIMIT 5").all();
    res.json(logs);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});