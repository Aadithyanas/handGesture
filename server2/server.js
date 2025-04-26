// Import libraries (CommonJS style)
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

// Initialize app
const app = express();
app.use(cors());

// Connect to PostgreSQL
const client = new Client({
  connectionString: 'postgresql://pokemon_qc69_user:F3PaZNC7JKGZNwvuwlUvnkiQD11GnqBv@dpg-d01an9euk2gs73dhmro0-a.oregon-postgres.render.com/pokemon_qc69',
  ssl: { rejectUnauthorized: false }, // Important for Render.com
});

client.connect()
  .then(() => console.log('Connected to Postgres ✅'))
  .catch(err => console.error('Connection error ❌', err.stack));

// Endpoint to get all pokemons
app.get('/pokemon', async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM "Pokemon"'); // <-- with quotes!
      res.json(result.rows);
    } catch (err) {
      console.error('Query error', err.stack);
      res.status(500).send('Error fetching data');
    }
  });
  

// Start server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
