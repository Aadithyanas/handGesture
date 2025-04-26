const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: [true, 'ID is required'],
    unique: true,
    min: [1, 'ID must be positive']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Slug cannot exceed 50 characters']
  },
  types: { 
    type: [String], // <-- array of String
    required: [true, 'Types are required'],
    enum: {
      values: ['Fire', 'Water', 'Grass', 'Electric', 'Psychic', 'Fighting', 'Dark', 'Dragon', 'Fairy', 'Flying', 'Ground', 'Rock', 'Steel', 'Ice', 'Bug', 'Poison', 'Ghost', 'Normal'],
      message: '{VALUE} is not a valid Pokémon type'
    }
  },
  abilities: {
    type: String,
    required: [true, 'Abilities are required'],
    trim: true,
    maxlength: [100, 'Abilities cannot exceed 100 characters']
  },
  weekness: {
    type: [String], // <-- array of String
    required: [true, 'Weeknesses are required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: { 
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  sprite: {
    type: String,
    required: [true, 'Sprite URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
PokemonSchema.index({ id: 1 });
PokemonSchema.index({ name: 1 });
PokemonSchema.index({ slug: 1 });

module.exports = mongoose.model('Pokemon', PokemonSchema);
