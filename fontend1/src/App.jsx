import React, { useState } from 'react';
import WebcamCapture from './components/WebcamCapture';

import PokemonGallery from './components/PokemonList';

function App() {
  const [currentPokemon, setCurrentPokemon] = useState(null);

  return (
    <div className="App">
      <WebcamCapture currentPokemon={currentPokemon} />
      {/* <PokemonGallery currentPokemon={currentPokemon} setCurrentPokemon={setCurrentPokemon} /> */}
    </div>
  );
}

export default App;