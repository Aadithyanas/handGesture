import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PokemonGallery.css'; // We will create this CSS file

const PokemonGallery = () => {
  const [pokemons, setPokemons] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        const response = await axios.get('http://localhost:5002/pokemon');
        console.log(response)
        setPokemons(response.data);
      } catch (error) {
        console.error('Error fetching pokemons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPokemons();
  }, []);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % pokemons.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + pokemons.length) % pokemons.length);
  };

  if (loading) return <p>Loading...</p>;

  if (pokemons.length === 0) return <p>No Pokemons found.</p>;

  const currentPokemon = pokemons[currentIndex];

  return (
    <div className="gallery-container">
      <h1>Pokemon Gallery</h1>
      <div className="gallery">
        <button className="arrow left" onClick={goToPrev}>
          &#8592;
        </button>

        <div className="pokemon-display">
          <img src={currentPokemon.sprite} alt={currentPokemon.name} />
          <h2>{currentPokemon.name}</h2>
          <p>{currentPokemon.category}</p>
        </div>

        <button className="arrow right" onClick={goToNext}>
          &#8594;
        </button>
      </div>
    </div>
  );
};

export default PokemonGallery;
