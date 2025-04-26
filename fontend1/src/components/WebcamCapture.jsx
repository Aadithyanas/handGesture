import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import GestureDetector from './GestureDetector';
import axios from 'axios';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [gestureDetector, setGestureDetector] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [message, setMessage] = useState('Loading model...');
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  const [handState, setHandState] = useState('none'); // 'none', 'free', 'hold'
  const [freeHandStartTime, setFreeHandStartTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});
  const [captureIndicator, setCaptureIndicator] = useState(false);
  
  const CAPTURE_COOLDOWN = 10000; // 10 seconds cooldown between captures
  const FREE_HAND_WAIT_TIME = 3000; // 3 seconds to wait for hold gesture

  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      const detector = new GestureDetector();
      await detector.load();
      setGestureDetector(detector);
      setMessage('Model loaded - Show open hand to start');
    };

    loadModels();
  }, []);

  const capture = async () => {
    if (!gestureDetector || !webcamRef.current) return;

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
        setMessage('Open hand detected - Wait for hold gesture');
      } else if (holdResult.isHold) {
        if (handState === 'free' && currentTime - freeHandStartTime >= FREE_HAND_WAIT_TIME) {
          if (currentTime - lastCaptureTime >= CAPTURE_COOLDOWN) {
            // Capture screenshot
            const imageSrc = webcamRef.current.getScreenshot();
            
            try {
              const formData = new FormData();
              const blob = await fetch(imageSrc).then(res => res.blob());
              formData.append('screenshot', blob, 'screenshot.png');
              
              await axios.post('https://handgesture-6mtp.onrender.com/api/screenshots/upload', formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              });
              
              setMessage('Screenshot captured! Next capture available in 10 seconds');
              setLastCaptureTime(currentTime);
              setHandState('none');
              setCaptureIndicator(true);
              setTimeout(() => setCaptureIndicator(false), 2000);
            } catch (error) {
              console.error('Error uploading screenshot:', error);
              setMessage('Error saving screenshot');
            }
          } else {
            const remainingTime = Math.ceil((CAPTURE_COOLDOWN - (currentTime - lastCaptureTime)) / 1000);
            setMessage(`Please wait ${remainingTime} seconds before next capture`);
          }
        } else if (handState === 'free') {
          const waitTime = Math.ceil((FREE_HAND_WAIT_TIME - (currentTime - freeHandStartTime)) / 1000);
          setMessage(`Keep hand open for ${waitTime} more seconds`);
        }
      } else if (!freeResult.isFree && !holdResult.isHold) {
        setHandState('none');
        setMessage('Show open hand to start');
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
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [gestureDetector, isDetecting, lastCaptureTime, handState, freeHandStartTime]);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Screenshot Capture</h2>
      <p>{message}</p>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/png"
        style={{ width: '640px', height: '480px' }}
      />
      {handState === 'free' && (
        <div style={{ marginTop: '10px', color: 'green' }}>
          Open hand detected - Waiting for hold gesture
        </div>
      )}
      {debugInfo && (
        <div style={{ marginTop: '10px', color: 'blue' }}>
          <div>Open fingers: {debugInfo.openFingers ?? '-'}</div>
          <div>Closed fingers: {debugInfo.closedFingers ?? '-'}</div>
          <div>Distances: {debugInfo.distances ? debugInfo.distances.map(d => d.toFixed(2)).join(', ') : '-'}</div>
        </div>
      )}
      {captureIndicator && (
        <div style={{ marginTop: '10px', color: 'red', fontWeight: 'bold' }}>
          Screenshot captured!
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;