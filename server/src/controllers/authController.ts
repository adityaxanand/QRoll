
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { detectAndGetDescriptors, compareFaces, loadModels as loadFaceApiServiceModels } from '../services/faceService';
import dotenv from 'dotenv';
import * as faceapi from 'face-api.js'; // For euclideanDistance

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const generateToken = (user: IUser) => {
  return jwt.sign({ id: user._id, role: user.role, email: user.email, displayName: user.displayName }, JWT_SECRET!, {
    expiresIn: '30d', // Token expiration
  });
};

// Ensure face-api models are loaded on startup or before first use
loadFaceApiServiceModels().catch(err => console.error("Auth Controller: Failed to pre-load face models", err));

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, displayName, role, faceImage } = req.body;

  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ message: 'Please provide all required fields: email, password, displayName, role' });
  }
  if (role === 'student' && !faceImage) {
    return res.status(400).json({ message: 'Student role requires faceImage (data URI) for registration' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let faceDescriptorsForDb: { descriptor: number[] }[] = [];
    if (role === 'student' && faceImage) {
      try {
        // Backend uses more accurate models by default for descriptor generation
        const detections = await detectAndGetDescriptors(faceImage, false); 
        if (detections.length === 0) {
          return res.status(400).json({ message: 'No face detected in the provided image. Please ensure your face is clear and well-lit.' });
        }
        if (detections.length > 1) {
          return res.status(400).json({ message: 'Multiple faces detected. Please provide an image with only your face.' });
        }
        // Convert Float32Array to plain array of numbers for MongoDB
        faceDescriptorsForDb = detections.map(d => ({ descriptor: Array.from(d.descriptor) }));
      } catch (faceError: any) {
        console.error('Face processing error during registration:', faceError);
        return res.status(500).json({ message: `Error processing face image: ${faceError.message || 'Unknown face processing error'}` });
      }
    }

    const user = await User.create({
      email,
      password: hashedPassword,
      displayName,
      role,
      faceDescriptors: faceDescriptorsForDb, // Store descriptors
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl, // If you decide to store/link profile pic
        token: generateToken(user),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data during creation' });
    }
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: `Server error during registration: ${error.message}` });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ message: `Server error during login: ${error.message}` });
  }
};


export const verifyUserFace = async (req: Request, res: Response) => {
  const { userId, faceImage } = req.body; 

  if (!userId || !faceImage) {
    return res.status(400).json({ message: 'UserId and faceImage (data URI) are required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role !== 'student' || !user.faceDescriptors || user.faceDescriptors.length === 0) {
      return res.status(400).json({ message: 'No registered face data found for this student.' });
    }

    // Use non-tiny model for detection and descriptor generation for accuracy
    const detections = await detectAndGetDescriptors(faceImage, false); 
    if (detections.length === 0) {
      return res.status(400).json({ message: 'No face detected in the provided image for verification.' });
    }
    if (detections.length > 1) {
        return res.status(400).json({ message: 'Multiple faces detected in verification image. Please use an image with one clear face.' });
    }
    const queryDescriptor = detections[0].descriptor; // This is a Float32Array

    let bestMatchDistance = Infinity;
    // Compare with all stored descriptors for the user (though usually there's one primary)
    for (const storedDesc of user.faceDescriptors) {
        // Ensure storedDesc.descriptor is Float32Array for comparison
        const distance = faceapi.euclideanDistance(queryDescriptor, new Float32Array(storedDesc.descriptor));
        if (distance < bestMatchDistance) {
            bestMatchDistance = distance;
        }
    }
    
    // Threshold for face matching (0.6 is common, might need tuning)
    // Lower distance means more similar.
    const MATCH_THRESHOLD = 0.6; 
    const isMatch = bestMatchDistance < MATCH_THRESHOLD;

    // Calculate a simplistic confidence score (0-1 range)
    // This is a basic way; more sophisticated methods exist.
    // Confidence is higher when distance is much lower than threshold.
    let confidence = 0;
    if (isMatch) {
      confidence = Math.max(0, 1 - (bestMatchDistance / MATCH_THRESHOLD));
    }
    
    res.json({
      isMatch,
      confidence: isMatch ? parseFloat(confidence.toFixed(4)) : 0,
      distance: parseFloat(bestMatchDistance.toFixed(4)), // Send distance for debugging/logging
    });

  } catch (error: any) {
    console.error('Face verification error:', error);
    res.status(500).json({ message: `Error verifying face: ${error.message || 'Unknown server error'}` });
  }
};

// Optional: Endpoint to get current user's profile based on JWT
// This is useful for the AuthContext to fetch profile after login or on app load
export const getMe = async (req: any, res: Response) => { // req should be AuthRequest after middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  // req.user is populated by the 'protect' middleware
  // Exclude password and potentially other sensitive fields if necessary
  const { password, ...userProfile } = req.user.toObject(); 
  res.json(userProfile);
};
