const express = require('express');
const router = express.Router();
const Pokemon = require('../models/Pokemon');

// POST /api/pokemon - Store a new Pokémon
router.post('/pokemon', async (req, res) => {
  try {
    const { id, name, slug, types, abilities, weekness, description, category, sprite } = req.body;

    console.log(id, name, slug, types, abilities, weekness, description, category, sprite);

    // Validation
    if (!id || !name || !slug || !types || !abilities || !weekness || !description || !category || !sprite) {
      return res.status(400).json({ 
        error: 'Missing required fields: id, name, slug, types, abilities, weekness, description, category, sprite' 
      });
    }

    // Check for existing Pokémon with the same ID or name and delete it if it exists
    const existingPokemon = await Pokemon.findOne({ $or: [{ id }, { name }] });
    if (existingPokemon) {
      console.log(`Pokemon with ${existingPokemon.id === id ? 'ID' : 'name'} already exists, deleting...`);
      await Pokemon.deleteOne({ _id: existingPokemon._id });
    }

    // Create new Pokémon
    const pokemon = new Pokemon({
      id,
      name,
      slug,
      types, // This is an array
      abilities,
      weekness, // This is also an array
      description,
      category,
      sprite
    });

    console.log('New Pokemon:', pokemon);

    // Save to the database
    await pokemon.save();

    res.status(201).json({
      success: true,
      message: 'Pokemon saved successfully',
      data: pokemon
    });
  } catch (err) {
    console.error('Error saving Pokemon:', err);
    res.status(500).json({ 
      error: 'Server error while saving Pokemon',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/pokemon - Get the most recent Pokémon
router.get('/last', async (req, res) => {
  try {
    const pokemon = await Pokemon.findOne().sort({ createdAt: -1 }); // Fetch the latest added Pokémon
    if (!pokemon) {
      return res.status(404).json({
        success: false,
        message: 'No Pokémon found'
      });
    }
    res.json({
      success: true,
      data: pokemon
    });
  } catch (err) {
    console.error('Error fetching Pokemon:', err);
    res.status(500).json({ 
      error: 'Server error while fetching Pokemon',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
