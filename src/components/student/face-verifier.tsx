
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { verifyStudentFace, type VerifyStudentFaceOutput, type VerifyStudentFaceInput } from '@/ai/flows/verify-student-face';
import { Camera, CheckCircle, XCircle, Loader2, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface FaceVerifierProps {
  scannedQrData: string | null;
  onVerificationComplete: (result: VerifyStudentFaceOutput) => void;
  isVerificationDisabled?: boolean;
}

const MODEL_URL = '/models'; // Path to models in public folder for client-side

export function FaceVerifier({ scannedQrData, onVerificationComplete, isVerificationDisabled }: FaceVerifierProps) {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // For direct video element manipulation if needed
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyStudentFaceOutput | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const studentIdForBackend = userProfile?.uid; // MongoDB _id

  // Ensure userProfile (and thus studentIdForBackend) is available
  const hasBackendProfileSetup = !!studentIdForBackend;

  // Combined condition to enable starting verification process
  const canStartVerificationProcess = 
    !!scannedQrData && 
    hasBackendProfileSetup && 
    !isVerificationDisabled && 
    modelsLoaded;

  useEffect(() => {
    const loadFaceApiModels = async () => {
      setIsLoadingModels(true);
      try {
        // Load only necessary models for client-side detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          // faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL), // Optional for client pre-check
        ]);
        setModelsLoaded(true);
        toast({ title: "Face Models Loaded (Client)", description: "Ready for client-side face detection check."});
      } catch (err) {
        console.error("Error loading client-side face-api.js models:", err);
        setError("Could not load client face detection models. Refresh may be needed.");
        toast({ title: "Client Model Load Error", variant: "destructive"});
      } finally {
        setIsLoadingModels(false);
      }
    };
    loadFaceApiModels();
  }, [toast]);

  // Reset component state when QR data changes or student ID becomes unavailable
  useEffect(() => {
    setCapturedImage(null);
    setVerificationResult(null);
    setShowWebcam(false); // Important: hide webcam to force re-initiation of camera
    setHasCameraPermission(null); // Reset camera permission status
    setFaceDetected(false);
    if (error && !error.includes("models")) setError(null);
    
    if (!scannedQrData || !studentIdForBackend) {
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    }
  }, [scannedQrData, studentIdForBackend]);


  const handleFaceDetection = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4 || !modelsLoaded || isVerifying || capturedImage || !showWebcam || hasCameraPermission !== true) {
      setFaceDetected(false);
      return;
    }

    const video = webcamRef.current.video;
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));

    if (detections && detections.length === 1) {
      setFaceDetected(true);
      // Optional: Check if face is centered and of decent size before auto-capturing
      // For simplicity, we'll capture immediately if one face is detected.
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current); // Stop further detections
      
      const imageSrc = webcamRef.current.getScreenshot({ width: 640, height: 480 });
      if (!imageSrc) {
        setError("Could not capture image from webcam.");
        setShowWebcam(false); return;
      }
      setCapturedImage(imageSrc);
      
      if (!studentIdForBackend) {
        setError("Student ID not available for verification.");
        setIsVerifying(false); return;
      }
      
      setIsVerifying(true); setError(null); setVerificationResult(null);

      try {
        const verificationInput: VerifyStudentFaceInput = {
          studentId: studentIdForBackend,
          capturedFaceDataUri: imageSrc,
        };
        const result = await verifyStudentFace(verificationInput);
        setVerificationResult(result);
        onVerificationComplete(result);
      } catch (err: any) {
        console.error("Backend Verification failed:", err);
        setError(err.message || "An unknown error occurred during backend verification.");
        onVerificationComplete({ isMatch: false, confidence: 0, distance: undefined });
      } finally {
        setIsVerifying(false);
        // setShowWebcam(false); // Optionally hide webcam after verification attempt
      }
    } else {
      setFaceDetected(false); // No face or multiple faces
    }
  }, [modelsLoaded, studentIdForBackend, onVerificationComplete, isVerifying, capturedImage, showWebcam, hasCameraPermission]);

  // Start/stop face detection interval
  useEffect(() => {
    if (showWebcam && modelsLoaded && hasCameraPermission === true && !isVerifying && !capturedImage) {
      detectionIntervalRef.current = setInterval(handleFaceDetection, 700); // Check for face ~1.5 times/sec
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [showWebcam, modelsLoaded, hasCameraPermission, handleFaceDetection, isVerifying, capturedImage]);

  // Function to initiate the verification process (show webcam, get permissions)
  const initiateVerification = async () => {
    if (!canStartVerificationProcess) {
      if (isLoadingModels) toast({ title: "Models Loading", description: "Please wait..."});
      else if (!modelsLoaded) setError("Client face models not loaded.");
      else if (!scannedQrData) setError("Please scan a QR code first.");
      else if (!hasBackendProfileSetup) setError("Student profile setup is incomplete for verification.");
      else if (isVerificationDisabled) setError("Verification is currently disabled.");
      return;
    }

    setCapturedImage(null); setVerificationResult(null); setError(null); setFaceDetected(false);

    if (hasCameraPermission === false) {
        setError("Camera access was denied. Please enable it in browser settings and refresh.");
        toast({ title: "Camera Denied", description: "Enable camera access in browser settings.", variant: "destructive"});
        return;
    }

    if (hasCameraPermission === null || !showWebcam) { // Request permission or show webcam
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            setShowWebcam(true);
            if (webcamRef.current && webcamRef.current.video) { // Ensure video element gets the stream
              webcamRef.current.video.srcObject = stream;
            }
            toast({ title: "Camera Activated", description: "Position your face in the center. Verification will be automatic." });
        } catch (err) {
            setError("Camera access denied or webcam not found. Check browser permissions.");
            setHasCameraPermission(false); setShowWebcam(false);
            toast({ title: "Camera Error", description: "Could not access camera.", variant: "destructive"});
        }
    } else if (hasCameraPermission === true && !showWebcam) {
        setShowWebcam(true); // If permission granted but webcam hidden, show it.
    }
  };
  
  const handleRetry = () => {
    setCapturedImage(null); setVerificationResult(null); setError(null); setFaceDetected(false);
    setIsVerifying(false); // Reset verifying state
    if (!showWebcam) {
        initiateVerification();
    } else {
        // If webcam is already showing, just clear interval and it should restart via useEffect
        if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    }
  };

  const videoConstraints = { width: 320, height: 240, facingMode: "user" };

  let statusMessage = "Ready for verification.";
  if (isLoadingModels) statusMessage = "Loading client face models...";
  else if (!modelsLoaded) statusMessage = "Client models failed. Refresh may be needed.";
  else if (!scannedQrData) statusMessage = "Scan a QR code to enable verification.";
  else if (!hasBackendProfileSetup) statusMessage = "Student profile setup incomplete.";
  else if (isVerificationDisabled) statusMessage = "Verification currently disabled by system.";
  else if (showWebcam && hasCameraPermission === true && !capturedImage && !isVerifying) {
    statusMessage = faceDetected ? "Face detected, capturing..." : "Position face in center...";
  }
  else if (isVerifying) statusMessage = "Verifying with backend...";
  else if (capturedImage && verificationResult) statusMessage = `Verification ${verificationResult.isMatch ? 'successful' : 'failed'}.`;
  else if (hasCameraPermission === false) statusMessage = "Camera permission denied. Check settings.";


  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserCheck className="h-6 w-6 text-primary" />
          Facial Verification
        </CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border border-border relative">
          {showWebcam && hasCameraPermission === true && (
            <Webcam
              audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints} className="w-full h-full object-cover" mirrored={true}
              onUserMediaError={(err) => { setError(`Webcam error: ${err.name}. Please allow access.`); setHasCameraPermission(false); setShowWebcam(false); }}
            />
          )}
          {capturedImage && !showWebcam && ( // Show captured image if webcam is hidden post-capture
             <Image src={capturedImage} alt="Captured face for verification" layout="fill" objectFit="cover" data-ai-hint="person face snapshot"/>
          )}
          {!showWebcam && hasCameraPermission !== true && ( // Placeholder before camera starts or if error
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              {isLoadingModels ? <Loader2 size={32} className="mb-2 animate-spin text-primary" /> : 
               !modelsLoaded ? <AlertTriangle size={32} className="mb-2 text-destructive"/> :
               hasCameraPermission === false ? <AlertTriangle size={32} className="mb-2 text-destructive"/> :
               (!studentIdForBackend || !hasBackendProfileSetup) ? <UserX size={32} className="mb-2 text-destructive" /> : 
               <Camera size={32} className="mb-2" /> }
              <p className="text-sm">
                {isLoadingModels ? "Loading models..." :
                 !modelsLoaded ? "Models failed." :
                 hasCameraPermission === false ? "Camera denied." :
                 (!studentIdForBackend || !hasBackendProfileSetup) ? "Profile Setup Incomplete." : 
                 scannedQrData ? "Click 'Start Verification'" : "Awaiting QR scan."}
              </p>
            </div>
          )}
          {showWebcam && hasCameraPermission === true && !capturedImage && !isVerifying && (
            <div className={`absolute inset-0 border-4 ${faceDetected ? 'border-green-500' : 'border-transparent'} transition-colors duration-300 pointer-events-none`}></div>
          )}
        </div>

        {!capturedImage && !isVerifying && (
          <Button onClick={initiateVerification} disabled={!canStartVerificationProcess || showWebcam || isLoadingModels} className="w-full">
            {isLoadingModels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {isLoadingModels ? 'Models Loading...' : (showWebcam ? 'Camera Active' : 'Start Verification')}
          </Button>
        )}
        
        {(capturedImage || error) && !isVerifying && ( 
           <Button onClick={handleRetry} variant="outline" className="w-full" disabled={isLoadingModels || !modelsLoaded}>
            <Camera className="mr-2 h-4 w-4" /> {error ? 'Retry Verification' : 'Verify Again'}
          </Button>
        )}

        {isVerifying && (
          <div className="flex items-center text-primary mt-2">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> <p>Verifying your face...</p>
          </div>
        )}
        
        {error && !isVerifying && ( // Show error only if not currently verifying
          <Alert variant="destructive" className="mt-4 w-full">
            <XCircle className="h-4 w-4" /> <AlertTitle>Error</AlertTitle> <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verificationResult && !isVerifying && (
          <Alert variant={verificationResult.isMatch ? "default" : "destructive"} className="mt-4 w-full">
            {verificationResult.isMatch ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{verificationResult.isMatch ? "Verification Successful" : "Verification Failed"}</AlertTitle>
            <AlertDescription>
              Match: {verificationResult.isMatch ? "Yes" : "No"}<br/>
              Confidence: {verificationResult.confidence !== undefined ? (verificationResult.confidence * 100).toFixed(2) + "%" : "N/A"}
              {verificationResult.distance !== undefined && <><br/>Distance: {verificationResult.distance.toFixed(4)}</> }
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
