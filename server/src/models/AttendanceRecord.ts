
import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IUser } from './User';

export interface IAttendanceRecord extends Document {
  student: IUser['_id']; // Reference to the User model (student)
  studentName: string; // Denormalized for easier querying/display
  sessionFirebaseId: string; // Firebase ID of the ClassSession
  sessionName: string; // Name of the class/session
  teacher: IUser['_id']; // Reference to the User model (teacher)
  qrTokenUsed: string;
  verificationConfidence?: number;
  status: 'present' | 'absent' | 'late'; // Example statuses
  timestamp: Date;
}

const AttendanceRecordSchema: Schema<IAttendanceRecord> = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    sessionFirebaseId: { // ID from Firestore classSessions collection
      type: String,
      required: true,
      index: true,
    },
    sessionName: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: { // The teacher who created the session
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qrTokenUsed: {
      type: String,
      required: true,
    },
    verificationConfidence: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

const AttendanceRecord: Model<IAttendanceRecord> = mongoose.model<IAttendanceRecord>(
  'AttendanceRecord',
  AttendanceRecordSchema
);

export default AttendanceRecord;
