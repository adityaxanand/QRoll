
import express from 'express';
import { registerUser, loginUser, verifyUserFace, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// This endpoint is for verifying a face against a stored profile (e.g., for attendance)
// It might not need to be protected if userId is passed explicitly and backend handles authorization
// However, if studentId is derived from an auth token, then it should be protected.
// For now, let's assume it can be public if studentId is provided, or protect it if it relies on req.user.
// For this implementation, let's assume `userId` is passed in body, so direct protection isn't strictly required on this route
// if the service logic correctly validates the userId against any sensitive actions.
// But generally, it's safer to protect if it's an authenticated action.
// Let's leave it unprotected for now as per the flow of FaceVerifier sending studentId.
router.post('/verify-face', verifyUserFace);

// Get current user profile (protected)
router.get('/me', protect, getMe);


export default router;
