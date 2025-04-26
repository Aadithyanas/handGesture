import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import GestureDetector from './GestureDetector';
import axios from 'axios';

const SimpleViewer = () => {
  const webcamRef = useRef(null);
  const [gestureDetector, setGestureDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [pokemon, setPokemon] = useState(null);
  const [message, setMessage] = useState('Loading model...');
  const [currentGesture, setCurrentGesture] = useState('none');
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      const detector = new GestureDetector();
      await detector.load();
      setGestureDetector(detector);
      setMessage('Show 3+ open fingers to view a Pokémon');
    };

    loadModels();
  }, []);

  const checkGesture = async () => {
    if (!gestureDetector || !webcamRef.current) return;

    setIsDetecting(true);
    try {
      const video = webcamRef.current.video;
      const predictions = await gestureDetector.detectHands(video);

      let detectedGesture = 'none';
      if (predictions && predictions.length > 0) {
        const releaseResult = gestureDetector.isHandReleaseGesture(predictions[0].landmarks);
        setDebugInfo({
          openFingers: releaseResult.openFingers,
          distances: releaseResult.distances
        });
        if (releaseResult.isRelease) {
          detectedGesture = 'free';
          
          if (!loading) {
            setLoading(true);
            setMessage('Searching for Pokémon...');
            
            try {
              const response = await axios.get('https://handgesture-6mtp.onrender.com/api/last', {
                timeout: 5000
              });
              if (response.data && response.data.data) {
                setPokemon(response.data.data);
                setMessage('Pokémon found!');
              }
            } catch (error) {
              if (error.code === 'ECONNABORTED') {
                setMessage('Request timeout - check backend');
              } else if (error.response) {
                setMessage(`Server error: ${error.response.status}`);
              } else if (error.request) {
                setMessage('No response from server - is it running?');
              } else {
                setMessage('Error: ' + error.message);
              }
            } finally {
              setLoading(false);
            }
          }
        } else {
          detectedGesture = 'hold';
        }
      }
      setCurrentGesture(detectedGesture);
    } catch (error) {
      console.error('Gesture detection error:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  useEffect(() => {
    if (!gestureDetector) return;

    const interval = setInterval(() => {
      if (!isDetecting) {
        checkGesture();
      }
    }, 300);

    return () => clearInterval(interval);
  }, [gestureDetector, isDetecting, loading]);

  // Get type color for the Pokémon
  const getTypeColor = (type) => {
    const typeColors = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    
    return typeColors[type?.toLowerCase()] || '#68A090'; // Default color if type not found
  };

  // Get the primary type from abilities string
  const getPrimaryType = (abilities) => {
    const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 
                  'fighting', 'poison', 'ground', 'flying', 'psychic', 
                  'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    
    if (!abilities) return 'normal';
    
    for (const type of types) {
      if (abilities.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return 'normal';
  };

  const primaryType = pokemon ? getPrimaryType(pokemon.abilities) : 'normal';
  const backgroundColor = getTypeColor(primaryType);

  return (
    <div style={{ 
      textAlign: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      padding: '20px',
      color: '#333'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>
        <header style={{
          background: '#E3350D',
          padding: '15px',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '24px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'white',
            border: '3px solid #333',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
          }}></div>
          Pokédex Gesture Viewer
        </header>
        
        <div style={{ 
          background: 'white', 
          padding: '20px',
          borderBottom: '1px solid #eee' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            alignItems: 'center' 
          }}>
            <div style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '3px solid #333',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                style={{ width: '320px', height: '240px', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '15px',
                fontSize: '14px'
              }}>
                Open fingers: {debugInfo.openFingers ?? '-'}
              </div>
            </div>
            
            <div style={{
              background: '#f0f0f0',
              padding: '15px',
              borderRadius: '10px',
              maxWidth: '320px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                fontSize: '18px',
                marginBottom: '10px',
                color: loading ? '#E3350D' : '#333',
                fontWeight: 'bold'
              }}>
                {message}
              </div>
              <div style={{
                fontSize: '16px',
                color: '#555'
              }}>
                <p>Show your hand to the camera</p>
                <p style={{ fontWeight: 'bold' }}>Show 3+ fingers to search for Pokémon</p>
              </div>
              {loading && (
                <div style={{ margin: '10px 0' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    margin: '0 auto',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #E3350D',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {pokemon && (
          <div style={{ 
            background: `linear-gradient(135deg, ${backgroundColor} 0%, white 100%)`,
            padding: '25px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <h2 style={{
                fontSize: '32px',
                margin: '0',
                color: '#333',
                textTransform: 'capitalize',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(255,255,255,0.7)'
              }}>
                {pokemon.name}
              </h2>
              
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '50%',
                padding: '20px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                transform: 'scale(1.2)',
                marginBottom: '10px'
              }}>
                <img 
                  src={pokemon.sprite} 
                  alt={pokemon.name} 
                  style={{ 
                    width: '180px',
                    height: '180px',
                    objectFit: 'contain'
                  }}
                />
              </div>
              
              <div style={{
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '10px',
                padding: '20px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    flex: '1 1 200px',
                  }}>
                    <h4 style={{ 
                      margin: '0 0 5px 0',
                      color: '#555',
                      fontSize: '14px'
                    }}>CATEGORY</h4>
                    <p style={{ 
                      margin: '0',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>{pokemon.category}</p>
                  </div>
                  
                  <div style={{
                    flex: '1 1 200px',
                  }}>
                    <h4 style={{ 
                      margin: '0 0 5px 0',
                      color: '#555',
                      fontSize: '14px'
                    }}>ABILITIES</h4>
                    <p style={{ 
                      margin: '0',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>{pokemon.abilities}</p>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ 
                    margin: '0 0 5px 0',
                    color: '#555',
                    fontSize: '14px'
                  }}>POKÉDEX ENTRY</h4>
                  <p style={{
                    margin: '0',
                    fontSize: '16px',
                    lineHeight: '1.5'
                  }}>{pokemon.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer style={{
          background: '#333',
          color: 'white',
          padding: '10px',
          fontSize: '12px'
        }}>
          Hand Gesture Pokédex - Show 3+ open fingers to view Pokémon
        </footer>
      </div>
    </div>
  );
};

export default SimpleViewer;