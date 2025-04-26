require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const pokemonRoutes = require('./routes/pokemonRoutes');
const { Client } = require('pg');

const app = express();

// Connect to MongoDB (your connection logic, it is not used in this code though)
connectDB();

// CORS Configuration: Allow all origins (or adjust in production)
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Client setup
const client = new Client({
  connectionString: 'postgresql://pokemon_qc69_user:F3PaZNC7JKGZNwvuwlUvnkiQD11GnqBv@dpg-d01an9euk2gs73dhmro0-a.oregon-postgres.render.com/pokemon_qc69',
  ssl: { rejectUnauthorized: false } // Important for Render.com
});

// Routes
app.use('/api', pokemonRoutes);

// Connect to PostgreSQL
client.connect()
  .then(() => console.log('Connected to Postgres ✅'))
  .catch(err => console.error('Connection error ❌', err.stack));

// Endpoint to get all pokemons
app.get('/pokemon', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM "Pokemon"'); // Correctly referencing the table with quotes
    res.json(result.rows);
  } catch (err) {
    console.error('Query error', err.stack);
    res.status(500).send('Error fetching data');
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT =  5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
