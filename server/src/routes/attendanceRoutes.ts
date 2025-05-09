
import express from 'express';
import {
  recordAttendance,
  getAttendanceBySession,
  getAttendanceByTeacher,
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Student records their own attendance
router.post('/record', protect, authorize('student'), recordAttendance);

// Teacher views attendance for a specific session
router.get('/session/:sessionFirebaseId', protect, authorize('teacher'), getAttendanceBySession);

// Teacher views all their attendance records (across all their sessions)
router.get('/teacher', protect, authorize('teacher'), getAttendanceByTeacher);

export default router;
