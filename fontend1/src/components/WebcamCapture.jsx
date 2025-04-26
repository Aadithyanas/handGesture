import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import GestureDetector from './GestureDetector';
import axios from 'axios';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [gestureDetector, setGestureDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [message, setMessage] = useState('Loading model...');
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  const [handState, setHandState] = useState('none');
  const [freeHandStartTime, setFreeHandStartTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const CAPTURE_COOLDOWN = 5000; // 5 seconds cooldown
  const FREE_HAND_WAIT_TIME = 1000; // 1 second to capture
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      const detector = new GestureDetector();
      await detector.load();
      setGestureDetector(detector);
      setMessage('Model loaded - Show open hand to capture');
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchPokemons = async () => {
      try {
        const response = await axios.get('https://handgesture-1-91uu.onrender.com/pokemon');
        setPokemons(response.data);
        if (response.data.length > 0) {
          setCurrentPokemon(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching pokemons:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemons();
  }, []);

  const handleNext = () => {
    if (pokemons.length === 0) return;
    const nextIndex = (currentIndex + 1) % pokemons.length;
    setCurrentIndex(nextIndex);
    setCurrentPokemon(pokemons[nextIndex]);
  };

  const handlePrev = () => {
    if (pokemons.length === 0) return;
    const prevIndex = (currentIndex - 1 + pokemons.length) % pokemons.length;
    setCurrentIndex(prevIndex);
    setCurrentPokemon(pokemons[prevIndex]);
  };

  const capturePokemon = async () => {
    if (!currentPokemon) return;
    try {
      await axios.post('https://handgesture-6mtp.onrender.com/api/pokemon', currentPokemon);
      setMessage(`${currentPokemon.name} captured successfully!`);
      setLastCaptureTime(Date.now());
      handleNext(); // Move to next Pokémon after capture
    } catch (error) {
      setMessage('Error saving Pokémon data');
      console.error('Capture error:', error);
    }
  };

  const capture = async () => {
    if (!gestureDetector || !webcamRef.current || !currentPokemon) return;
    if (Date.now() - lastCaptureTime < CAPTURE_COOLDOWN) return;
    
    setIsDetecting(true);
    const video = webcamRef.current.video;
    const predictions = await gestureDetector.detectHands(video);
    const currentTime = Date.now();

    if (predictions && predictions.length > 0) {
      const freeResult = gestureDetector.isHandFree(predictions[0].landmarks);
      const holdResult = gestureDetector.isHandHoldGesture(predictions[0].landmarks);
      
      setDebugInfo({
        openFingers: freeResult.openFingers,
        closedFingers: holdResult.closedFingers,
        distances: holdResult.distances
      });

      if (freeResult.isFree && handState !== 'free') {
        setHandState('free');
        setFreeHandStartTime(currentTime);
        setMessage('Open hand detected - Close to capture');
      } else if (holdResult.isHold) {
        if (handState === 'free' && currentTime - freeHandStartTime >= FREE_HAND_WAIT_TIME) {
          await capturePokemon();
          setHandState('none');
        }
      } else if (!freeResult.isFree && !holdResult.isHold) {
        setHandState('none');
        setMessage('Show open hand to capture');
      }
    } else {
      setHandState('none');
      setMessage('No hand detected');
      setDebugInfo({});
    }
    setIsDetecting(false);
  };

  useEffect(() => {
    if (!gestureDetector) return;
    const interval = setInterval(() => {
      if (!isDetecting) {
        capture();
      }
    }, 500); // Check every 500ms for faster response
    return () => clearInterval(interval);
  }, [gestureDetector, isDetecting, lastCaptureTime, handState, currentPokemon]);

  if (loading) {
    return <div className="loading">Loading Pokémon data...</div>;
  }

  return (
    <div className="capture-container">
      <h1>Pokémon Capture</h1>
      <p className="message">{message}</p>
      
      <div className="main-content">
        <div className="pokemon-display">
          <div className="navigation">
            <button onClick={handlePrev} className="nav-button">
              <FaArrowLeft />
            </button>
            
            {currentPokemon && (
              <div className="pokemon-card">
                <img 
                  src={currentPokemon.sprite} 
                  alt={currentPokemon.name} 
                  className="pokemon-image"
                />
                <div className="pokemon-info">
                  <h2>{currentPokemon.name}</h2>
                  <p>Type: {currentPokemon.type}</p>
                  <p>Category: {currentPokemon.category}</p>
                </div>
              </div>
            )}
            
            <button onClick={handleNext} className="nav-button">
              <FaArrowRight />
            </button>
          </div>
        </div>
        
        <div className="webcam-section">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/png"
            className="webcam"
          />
          {handState === 'free' && (
            <div className="hand-status">
              Open hand detected - Close to capture
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .capture-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        
        .main-content {
          display: flex;
          gap: 40px;
          margin-top: 30px;
          align-items: flex-start;
        }
        
        .pokemon-display {
          flex: 2;
        }
        
        .webcam-section {
          flex: 1;
          position: sticky;
          top: 20px;
        }
        
        .webcam {
          width: 100%;
          max-width: 320px;
          border-radius: 12px;
          border: 3px solid #eee;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .nav-button {
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .nav-button:hover {
          background: #357ab8;
          transform: scale(1.1);
        }
        
        .pokemon-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.1);
          max-width: 400px;
          margin: 0 auto;
        }
        
        .pokemon-image {
          width: 200px;
          height: 200px;
          object-fit: contain;
          margin-bottom: 15px;
        }
        
        .pokemon-info {
          padding: 10px;
        }
        
        .pokemon-info h2 {
          margin: 0 0 10px 0;
          color: #333;
        }
        
        .pokemon-info p {
          margin: 5px 0;
          color: #666;
        }
        
        .hand-status {
          margin-top: 10px;
          padding: 8px;
          background: rgba(46, 204, 113, 0.2);
          border-radius: 4px;
          color: #27ae60;
        }
        
        .message {
          font-size: 18px;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
          .main-content {
            flex-direction: column-reverse;
          }
          
          .webcam-section {
            margin-bottom: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default WebcamCapture;