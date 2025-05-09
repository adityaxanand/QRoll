
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import attendanceRoutes from './routes/attendanceRoutes'; // Import attendance routes
import { loadModels as loadFaceApiModels } from './services/faceService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Load Face Recognition Models
loadFaceApiModels().catch(err => {
  console.error("Failed to load face-api models on startup:", err);
  // Decide if you want to exit or continue with face features disabled
  // process.exit(1); 
});

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, increase limit for image data
app.use(express.urlencoded({ extended: false, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send('QRoll Backend API Running');
});
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes); // Add attendance routes

// Error Handling Middleware (basic)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
