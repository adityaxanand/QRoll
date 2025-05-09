
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData } from 'canvas'; // Polyfills for node environment
import dotenv from 'dotenv';

dotenv.config();

// Patch face-api.js environment to use canvas
faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as { new (): HTMLCanvasElement; prototype: HTMLCanvasElement },
  Image: Image as unknown as { new (): HTMLImageElement; prototype: HTMLImageElement },
  ImageData: ImageData as any,
});

let modelsLoaded = false;
const MODEL_URL = process.env.FACE_API_MODEL_URL || './models'; // Ensure models are here relative to dist/services if running compiled, or src/services if using ts-node

export const loadModels = async () => {
  if (modelsLoaded) return;
  try {
    console.log('Loading face-api models for backend from:', MODEL_URL);
    // For backend processing, especially descriptor generation, full models are usually better.
    // Tiny models can be used if speed is critical and slight accuracy trade-off is acceptable.
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL), // Full landmark model
      faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL), // Recognition model for descriptors
      // Optional: tiny models if you want to offer a faster option
      // faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_URL),
      // faceapi.nets.faceLandmark68TinyNet.loadFromDisk(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face-api models loaded successfully for backend.');
  } catch (error) {
    console.error('Error loading face-api models for backend:', error);
    // Depending on application requirements, you might want to prevent startup
    // process.exit(1); 
    throw new Error('Could not load face recognition models for backend.');
  }
};

// Using SsdMobilenetv1 for more robust detection on the backend by default
export const getFaceDetectorOptions = (useTiny: boolean = false) => {
  return useTiny
    ? new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }) // Example for tiny
    : new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }); // Default full model
};

export const imageToCanvas = async (imageDataUri: string): Promise<Image> => {
  return new Promise((resolve, reject) => {
    if (!imageDataUri || !imageDataUri.startsWith('data:image')) {
        return reject(new Error('Invalid image data URI format.'));
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => {
        console.error("Error loading image in imageToCanvas:", err);
        reject(new Error('Failed to load image from data URI.'));
    };
    img.src = imageDataUri;
  });
};

/**
 * Detects faces, landmarks, and generates descriptors.
 * For backend, typically use the more accurate (non-tiny) models.
 * @param imageDataUri The image as a base64 data URI.
 * @param useTinyModelForDetection If true, uses TinyFaceDetector. Landmarks will also be tiny.
 * @returns Array of detections with descriptors.
 */
export const detectAndGetDescriptors = async (
  imageDataUri: string,
  useTinyModelForDetection: boolean = false // Backend default to false for accuracy
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>>[]> => {
  if (!modelsLoaded) {
    await loadModels(); // Ensure models are loaded
  }

  const imgCanvas = await imageToCanvas(imageDataUri);

  // Create a canvas and draw the image onto it
  const canvas = faceapi.createCanvasFromMedia(imgCanvas as unknown as HTMLImageElement);

  const detections = await faceapi
    .detectAllFaces(canvas, getFaceDetectorOptions(useTinyModelForDetection))
    .withFaceLandmarks(!useTinyModelForDetection) // Use full landmarks if not using tiny detector
    .withFaceDescriptors();
  
  return detections;
};


export const compareFaces = (
  descriptor1: Float32Array | number[],
  descriptor2: Float32Array | number[]
): number => {
  if (!modelsLoaded) {
      throw new Error("Face models not loaded. Cannot compare faces.");
  }
  // Ensure descriptors are Float32Array for face-api.js
  const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  
  return faceapi.euclideanDistance(desc1, desc2);
};
