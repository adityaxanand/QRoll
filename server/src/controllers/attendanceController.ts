
import { Request, Response } from 'express';
import AttendanceRecord, { IAttendanceRecord } from '../models/AttendanceRecord';
import User from '../models/User'; // To verify teacher for session association

interface AuthRequest extends Request {
  user?: any; // from authMiddleware
}

// Record new attendance
export const recordAttendance = async (req: AuthRequest, res: Response) => {
  const {
    sessionFirebaseId,
    sessionName,
    teacherMongoId, // MongoDB ObjectId of the teacher who owns the session
    qrTokenUsed,
    verificationConfidence,
  } = req.body;

  const studentId = req.user?._id;
  const studentName = req.user?.displayName;

  if (!studentId || !studentName) {
    return res.status(400).json({ message: 'Student information not found in token.' });
  }

  if (!sessionFirebaseId || !sessionName || !teacherMongoId || !qrTokenUsed) {
    return res.status(400).json({ message: 'Missing required attendance data: sessionFirebaseId, sessionName, teacherMongoId, qrTokenUsed.' });
  }

  // Optional: Validate teacherMongoId exists
  const teacherExists = await User.findById(teacherMongoId);
  if (!teacherExists || teacherExists.role !== 'teacher') {
    return res.status(400).json({ message: 'Invalid teacher ID provided for the session.' });
  }

  try {
    // Check if attendance for this student in this session already exists
    const existingRecord = await AttendanceRecord.findOne({
      student: studentId,
      sessionFirebaseId: sessionFirebaseId,
    });

    if (existingRecord) {
      return res.status(409).json({ message: 'Attendance already recorded for this student in this session.' });
    }

    const newRecord = await AttendanceRecord.create({
      student: studentId,
      studentName,
      sessionFirebaseId,
      sessionName,
      teacher: teacherMongoId,
      qrTokenUsed,
      verificationConfidence,
      status: 'present', // Default to present
      timestamp: new Date(),
    });

    res.status(201).json(newRecord);
  } catch (error: any) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// Get attendance records for a specific session (Firebase ID)
export const getAttendanceBySession = async (req: AuthRequest, res: Response) => {
  const { sessionFirebaseId } = req.params;
  const requestingTeacherId = req.user?._id;

  if (!sessionFirebaseId) {
    return res.status(400).json({ message: 'Session Firebase ID is required.' });
  }

  try {
    // Ensure the requesting teacher is the one who owns the session for which attendance is being fetched
    // This check might be better if session details (owner) are also stored/retrieved from MongoDB
    // For now, we rely on the frontend to pass correct sessionFirebaseId, and authorization middleware
    const records = await AttendanceRecord.find({ sessionFirebaseId })
      .populate('student', 'displayName email profilePictureUrl') // Populate basic student info
      .sort({ timestamp: -1 }); // Sort by most recent

    if (!records.length) {
        // Check if the first record's teacher matches the requesting teacher
        // This is a simplified check; ideally, the session itself would be checked.
        // return res.status(404).json({ message: 'No attendance records found for this session.' });
    }
    
    // Authorization check: Ensure the logged-in teacher is associated with these records
    // This is a basic check assuming the first record's teacher is representative.
    // A more robust check would be to ensure the sessionFirebaseId belongs to a session created by req.user._id.
    // This requires session data to be queryable by teacher from MongoDB or more complex logic.
    if (records.length > 0 && (records[0].teacher as string).toString() !== requestingTeacherId.toString()) {
        return res.status(403).json({ message: 'You are not authorized to view attendance for this session.' });
    }


    res.json(records);
  } catch (error: any) {
    console.error('Error fetching attendance by session:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// Get all attendance records for all sessions run by the logged-in teacher
export const getAttendanceByTeacher = async (req: AuthRequest, res: Response) => {
  const teacherId = req.user?._id;

  if (!teacherId) {
    return res.status(400).json({ message: 'Teacher ID not found in token.' });
  }

  try {
    const records = await AttendanceRecord.find({ teacher: teacherId })
      .populate('student', 'displayName email')
      .sort({ timestamp: -1 });
    res.json(records);
  } catch (error: any) {
    console.error('Error fetching attendance by teacher:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};
