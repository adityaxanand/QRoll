# QRoll Setup Instructions

## 1. Environment Variables

Ensure you have a `.env.local` file in the root of your Next.js project and a `.env` file in the root of your `server` directory.

**Next.js Frontend (`.env.local`):**

```env
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID" # Optional for Analytics

# URL of your running Node.js backend
NEXT_PUBLIC_BACKEND_API_URL="http://localhost:5001/api"
```

**Node.js Backend (`server/.env`):**

```env
PORT=5001
MONGO_URI="YOUR_MONGODB_CONNECTION_STRING"
JWT_SECRET="YOUR_VERY_STRONG_JWT_SECRET_FOR_BACKEND_AUTH" # Used for signing tokens by the backend for its own user sessions.

# Optional: If you want to serve models from a custom URL for the backend
# FACE_API_MODEL_URL=""
```
Replace placeholders with your actual Firebase and MongoDB credentials, and generate a strong JWT secret.

## 2. Face Recognition Models (face-api.js)

This application uses `face-api.js` for facial detection and recognition. You need to download the pre-trained models and place them in the correct directories for both the frontend and backend.

**Steps:**

1.  **Download Models:**
    *   The `face-api.js` library (version 0.22.2 is used in this project) requires specific weight files.
    *   You can download these models directly from the `face-api.js` GitHub repository. Navigate to the `weights` folder in the repository: [https://github.com/justadudewhohacks/face-api.js/tree/master/weights](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
    *   Download all files from this `weights` directory. These include:
        *   `ssd_mobilenetv1_model-weights_manifest.json` and associated shard files (`ssd_mobilenetv1_model-shard*`)
        *   `face_landmark_68_model-weights_manifest.json` and associated shard files (`face_landmark_68_model-shard*`)
        *   `face_recognition_model-weights_manifest.json` and associated shard files (`face_recognition_model-shard*`)
        *   `tiny_face_detector_model-weights_manifest.json` and associated shard files (`tiny_face_detector_model-shard*`)
        *   `face_landmark_68_tiny_model-weights_manifest.json` and associated shard files (`face_landmark_68_tiny_model-shard*`)
        *   (And any other models present like `age_gender_model`, `mtcnn_model`, etc., though not all might be strictly required by this specific app configuration, it's good to have them).

2.  **Place Models for Frontend:**
    *   Create a directory `public/models` in your Next.js project root (if it doesn't exist).
    *   Copy all the downloaded model files (the `.json` manifest and the `.shard*` binary files) into this `public/models` directory.
    *   The frontend `FaceVerifier` component (`src/components/student/face-verifier.tsx`) is configured to load models from `/models`, which Next.js serves from the `public/models` directory.

3.  **Place Models for Backend:**
    *   Create a directory `server/models` in your Node.js backend project root (i.e., `qroll-app/server/models`, if `qroll-app` is your main project folder).
    *   Copy all the same downloaded model files into this `server/models` directory.
    *   The backend `faceService` (`server/src/services/faceService.ts`) is configured to load models from `./models` relative to its own location (which resolves to `server/models`).
    *   If you set the `FACE_API_MODEL_URL` environment variable in `server/.env`, the backend will attempt to load models from that URL instead. For local disk usage, keep it unset.

**Example Directory Structure:**

```
qroll-app/
├── public/
│   └── models/  <-- Frontend models here (e.g., ssd_mobilenetv1_model-weights_manifest.json, .shard files)
├── server/
│   ├── models/  <-- Backend models here (e.g., ssd_mobilenetv1_model-weights_manifest.json, .shard files)
│   ├── src/
│   └── .env     <-- Backend environment variables
├── src/
└── .env.local   <-- Frontend environment variables
```

## 3. Running the Application

1.  **Backend:**
    *   Navigate to the `server` directory: `cd server`
    *   Install dependencies: `npm install`
    *   Run the backend server: `npm run dev` (or `npm start` for production build)

2.  **Frontend:**
    *   Navigate to the project root (e.g., `qroll-app`): `cd ..` (if you were in `server`)
    *   Install dependencies: `npm install`
    *   Run the Next.js development server: `npm run dev`

The frontend should now be accessible (usually at `http://localhost:9002` or similar) and the backend at `http://localhost:5001`.

## Important Notes:
*   The `teacherMongoId` (MongoDB `_id` of the teacher) is now stored in the Firebase `classSessions` documents when a teacher starts a new session. This ID is crucial for linking attendance records in MongoDB to the correct teacher.
*   Student registration now includes face capture and stores face descriptors in the MongoDB backend.
*   Student attendance recording now involves face verification against the stored descriptors in the backend before marking attendance.
*   Ensure your MongoDB database is running and accessible via the `MONGO_URI` you provided.
