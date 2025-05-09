
import mongoose, { Schema, Document, Model } from 'mongoose';

interface IFaceDescriptor {
  descriptor: number[]; // Storing as a plain array of numbers
  // Could add timestamp or device info if multiple descriptors are allowed per user
}

export interface IUser extends Document {
  email: string;
  password?: string; // Optional for social logins if implemented later
  displayName: string;
  role: 'student' | 'teacher';
  profilePictureUrl?: string; // URL to profile picture (optional)
  faceDescriptors: IFaceDescriptor[]; // Array of face descriptors
  createdAt: Date;
  updatedAt: Date;
}

const FaceDescriptorSchema: Schema<IFaceDescriptor> = new Schema({
  descriptor: {
    type: [Number],
    required: true,
  },
}, {_id: false}); // Don't create separate _id for each descriptor object

const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Make required: true if not using social logins that bypass password.
      // For this app, it's required.
      required: true, 
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    profilePictureUrl: {
      type: String,
      trim: true,
    },
    faceDescriptors: [FaceDescriptorSchema], // Array of face descriptors
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
