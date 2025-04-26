import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import GestureDetector from './GestureDetector';
import axios from 'axios';

const SimpleViewer = () => {
  const webcamRef = useRef(null);
  const [gestureDetector, setGestureDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [message, setMessage] = useState('Loading model...');
  const [currentGesture, setCurrentGesture] = useState('none');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      const detector = new GestureDetector();
      await detector.load();
      setGestureDetector(detector);
      setMessage('Model loaded - Show 3 or more open fingers to view latest screenshot');
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
          // Show image immediately when 3+ fingers are open
          try {
            const response = await axios.get('http://localhost:5000/api/screenshots/latest', {
              timeout: 5000 // 5 second timeout
            });
            if (response.data.imageUrl) {
              setScreenshot(response.data.imageUrl);
              setMessage('Latest screenshot displayed');
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
    }, 300); // Check every 300ms for faster response

    return () => clearInterval(interval);
  }, [gestureDetector, isDetecting]);

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '20px',
      backgroundColor: 'white',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2>Screenshot Viewer</h2>
      <p>{message}</p>
      <Webcam
        audio={false}
        ref={webcamRef}
        style={{ width: '320px', height: '240px' }}
      />
      <div style={{ marginTop: '10px', color: 'blue', fontSize: '1.2em' }}>
        Open fingers: {debugInfo.openFingers ?? '-'}
      </div>
      {screenshot && (
        <div style={{ marginTop: '20px' }}>
          <h3>Latest Screenshot:</h3>
          <img 
            src={screenshot} 
            alt="Latest screenshot" 
            style={{ maxWidth: '100%', maxHeight: '500px' }}
          />
        </div>
      )}
    </div>
  );
};

export default SimpleViewer;