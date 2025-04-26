import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

class GestureDetector {
  constructor() {
    this.model = null;
    this.isHandHolding = false;
  }

  async load() {
    await tf.ready();
    this.model = await handpose.load();
    console.log('Handpose model loaded');
  }

  async detectHands(video) {
    if (!this.model) return null;
    const predictions = await this.model.estimateHands(video);
    return predictions;
  }

  isHandReleaseGesture(landmarks) {
    // Simple gesture detection - check if hand is open
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb to Pinky tips
    const fingerJoints = [3, 6, 10, 14, 18]; // Finger joints
    let openFingers = 0;
    let distances = [];
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const joint = landmarks[fingerJoints[i]];
      const distance = Math.sqrt(
        Math.pow(tip[0] - joint[0], 2) +
        Math.pow(tip[1] - joint[1], 2) +
        Math.pow(tip[2] - joint[2], 2)
      );
      distances.push(distance);
      if (distance > 50) { // Pixel space threshold (adjusted from 0.15)
        openFingers++;
      }
    }
    console.log('Open fingers:', openFingers, 'Distances:', distances);
    return { isRelease: openFingers >= 3, openFingers, distances };
  }
}

export default GestureDetector;