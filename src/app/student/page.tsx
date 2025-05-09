
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/common/header';
import { PageTitle } from '@/components/common/page-title';
import { QrScanner } from '@/components/student/qr-scanner';
import { FaceVerifier } from '@/components/student/face-verifier';
import { useToast } from "@/hooks/use-toast";
import type { VerifyStudentFaceOutput } from '@/ai/flows/verify-student-face';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, CheckSquare, AlertTriangle, Loader2, ScanLine } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase/firebase'; 
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription as ShadAlertDescription } from '@/components/ui/alert';


interface ClassSession {
  id: string; 
  teacherId: string; // Firebase UID of the teacher
  teacherMongoId: string; // MongoDB ObjectId of the teacher 
  className?: string;
  activeQrToken: string;
  qrTokenGeneratedAt: Timestamp;
  qrTokenExpiresAt: Timestamp;
  isActive: boolean;
}

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

function StudentDashboardInternal() {
  const [scannedQrData, setScannedQrData] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [currentStep, setCurrentStep] = useState<'scan_qr' | 'verify_face' | 'show_result'>('scan_qr');
  const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'success' | 'failure' | 'processing' | 'session_invalid' | 'no_backend_profile'>('idle');
  const [verificationDetails, setVerificationDetails] = useState<VerifyStudentFaceOutput | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const { toast } = useToast();
  const { userProfile, authToken, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role === 'student' && !userProfile.uid) {
      // userProfile.uid should be the MongoDB _id
      setAttendanceStatus('no_backend_profile');
    } else if (attendanceStatus === 'no_backend_profile' && userProfile?.uid) {
        setAttendanceStatus('idle');
    }
  }, [userProfile, authLoading, attendanceStatus]);


  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!scannedQrData || !db) {
        setActiveSession(null);
        return;
      }
      setIsLoadingSession(true);
      setAttendanceStatus('processing'); // Indicates processing QR
      setActiveSession(null);
      try {
        const sessionsRef = collection(db, 'classSessions');
        const q = query(sessionsRef, where('activeQrToken', '==', scannedQrData), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast({ title: "Invalid QR Code", description: "No active session found for this QR code.", variant: "destructive" });
          setAttendanceStatus('session_invalid');
          setCurrentStep('scan_qr'); setScannedQrData(null);
          return;
        }
        
        const sessionDoc = querySnapshot.docs[0];
        const sessionData = sessionDoc.data() as Omit<ClassSession, 'id'>;

        if (sessionData.qrTokenExpiresAt.toDate() < new Date()) {
          toast({ title: "Expired QR Code", description: "This QR code has expired. Please scan a new one.", variant: "destructive" });
          setAttendanceStatus('session_invalid');
          setCurrentStep('scan_qr'); setScannedQrData(null);
          return;
        }
        
        if (!sessionData.teacherMongoId) {
            toast({ title: "Session Config Error", description: "Teacher details missing in session. Cannot record attendance.", variant: "destructive" });
            setAttendanceStatus('session_invalid');
            setCurrentStep('scan_qr'); setScannedQrData(null);
            return;
        }

        setActiveSession({ id: sessionDoc.id, ...sessionData });
        setAttendanceStatus('idle'); // Ready for next step
        setCurrentStep('verify_face');
        toast({
          title: "QR Code Validated",
          description: `Session for ${sessionData.className || 'class'} found. Proceed to facial verification.`,
        });

      } catch (error) {
        console.error("Error fetching session:", error);
        toast({ title: "Error Validating QR", description: "Could not validate QR code. Please try again.", variant: "destructive" });
        setAttendanceStatus('session_invalid');
        setCurrentStep('scan_qr'); setScannedQrData(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (scannedQrData && currentStep === 'scan_qr') { // Only fetch if QR scanned and we are in scan_qr step
        fetchSessionDetails();
    }
  }, [scannedQrData, currentStep, toast]);


  const handleScanSuccess = (decodedText: string) => {
    setVerificationDetails(null);
    setAttendanceStatus('idle');
    setActiveSession(null);
    setCurrentStep('scan_qr'); // Set to scan_qr to trigger useEffect for session fetching
    setScannedQrData(decodedText);
  };

  const handleScanFailure = (error: any) => {
    console.error("QR Scan Failed:", error);
    const errorMessage = typeof error === 'string' ? error : (error?.message || "Could not scan QR code. Please try again.");
    toast({ title: "QR Scan Error", description: errorMessage, variant: "destructive" });
    setAttendanceStatus('idle'); // Reset status but keep on QR scan step
    setCurrentStep('scan_qr');
  };

  const handleVerificationComplete = async (result: VerifyStudentFaceOutput) => {
    if (!userProfile || !activeSession || !scannedQrData || !authToken) {
      toast({ title: "Error", description: "Missing required information for attendance.", variant: "destructive" });
      setAttendanceStatus('failure'); setCurrentStep('show_result');
      return;
    }
     if (!BACKEND_API_URL) {
      toast({ title: "Config Error", description: "Backend API URL not configured.", variant: "destructive" });
      setAttendanceStatus('failure'); setCurrentStep('show_result');
      return;
    }
    
    setAttendanceStatus('processing'); // Indicates processing attendance record
    setVerificationDetails(result);

    if (result.isMatch) {
      try {
        const attendancePayload = {
          sessionFirebaseId: activeSession.id,
          sessionName: activeSession.className || 'Class Session',
          teacherMongoId: activeSession.teacherMongoId,
          qrTokenUsed: scannedQrData,
          verificationConfidence: result.confidence,
        };

        const response = await fetch(`${BACKEND_API_URL}/attendance/record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(attendancePayload),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || `Failed to record (status: ${response.status})`);

        setAttendanceStatus('success');
        toast({
          title: "Attendance Recorded!",
          description: `Marked attendance with ${(result.confidence * 100).toFixed(1)}% confidence.`,
        });
      } catch (error: any) {
        console.error("Error recording attendance:", error);
        setAttendanceStatus('failure');
        toast({ title: "Recording Error", description: error.message || "Could not save attendance.", variant: "destructive" });
      }
    } else {
      setAttendanceStatus('failure');
      toast({
        title: "Verification Failed",
        description: "Face verification was not successful. Attendance not recorded.",
        variant: "destructive",
      });
    }
    setCurrentStep('show_result');
  };

  const resetProcess = () => {
    setScannedQrData(null);
    setActiveSession(null);
    setVerificationDetails(null);
    setCurrentStep('scan_qr');
    setAttendanceStatus('idle');
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (attendanceStatus === 'no_backend_profile') {
     return (
      <div className="flex flex-col min-h-screen bg-secondary">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <Card className="w-full max-w-lg text-center p-8 shadow-lg">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Profile Incomplete</CardTitle>
            <CardDescription className="mb-6">
              Your user profile is not fully set up, or your backend ID is missing. Please try logging out and signing up again, ensuring all steps including face capture (if applicable) are completed.
            </CardDescription>
             <Button onClick={async () => { if(userProfile?.logout) await userProfile.logout(); else if (auth && auth.signOut) { const { auth } = await import('@/lib/firebase/firebase'); auth.signOut(); } router.push('/login'); }} variant="outline">Logout and Retry Signup</Button>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <PageTitle
          title="Student Attendance"
          description={
            currentStep === 'scan_qr' ? "Scan the QR code provided by your teacher." :
            currentStep === 'verify_face' ? "Verify your identity using facial recognition." :
            "Attendance process complete. See result below."
          }
          icon={
            currentStep === 'scan_qr' ? <ScanLine className="h-10 w-10" /> :
            currentStep === 'verify_face' ? <User className="h-10 w-10" /> :
            attendanceStatus === 'success' ? <CheckSquare className="h-10 w-10 text-green-500" /> :
            <AlertTriangle className="h-10 w-10 text-red-500" />
          }
        />
        
        <div className="max-w-md mx-auto mt-8">
          {currentStep === 'scan_qr' && (
            <QrScanner 
              onScanSuccess={handleScanSuccess} 
              onScanFailure={handleScanFailure}
              isScanningDisabled={isLoadingSession || attendanceStatus === 'processing'} 
            />
          )}

          {currentStep === 'verify_face' && activeSession && (
            <FaceVerifier 
              scannedQrData={scannedQrData} // Pass QR data to enable verification
              onVerificationComplete={handleVerificationComplete}
              isVerificationDisabled={!activeSession || attendanceStatus === 'processing' || isLoadingSession || attendanceStatus === 'session_invalid'}
            />
          )}

          {currentStep === 'show_result' && verificationDetails && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {attendanceStatus === 'success' ? <CheckSquare className="text-green-500 h-6 w-6" /> : <AlertTriangle className="text-red-500 h-6 w-6" />}
                  Attendance Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {attendanceStatus === 'success' && (
                  <Alert variant="default" className="bg-green-50 border-green-300">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-700">Attendance Marked Successfully!</AlertTitle>
                    <ShadAlertDescription className="text-green-700">
                      <p>Session: {activeSession?.className || 'Class Session'}</p>
                      <p>Face Match: {verificationDetails.isMatch ? 'Yes' : 'No'}</p>
                      <p>Confidence: {(verificationDetails.confidence * 100).toFixed(1)}%</p>
                    </ShadAlertDescription>
                  </Alert>
                )}
                {attendanceStatus === 'failure' && (
                   <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Attendance Marking Failed</AlertTitle>
                    <ShadAlertDescription>
                      <p>Session: {activeSession?.className || 'Class Session'}</p>
                      <p>Face Match: {verificationDetails.isMatch ? 'Yes' : 'No'}</p>
                      { verificationDetails.confidence !== undefined &&  <p>Confidence: {(verificationDetails.confidence * 100).toFixed(1)}%</p> }
                      <p className="mt-2">Reason: {verificationDetails.isMatch === false ? "Face verification failed or confidence too low." : "An error occurred while recording attendance."}</p>
                    </ShadAlertDescription>
                  </Alert>
                )}
                <Button onClick={resetProcess} className="w-full" variant="outline">
                  Scan Another QR / Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {(isLoadingSession || (attendanceStatus === 'processing' && !verificationDetails && currentStep !== 'show_result')) && (
            <div className="mt-8 flex items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
              <p className="text-muted-foreground">
                {isLoadingSession ? "Validating QR Code..." : (currentStep === 'verify_face' ? "Preparing for verification..." : "Processing...")}
              </p>
            </div>
          )}

          {attendanceStatus === 'session_invalid' && !isLoadingSession && currentStep === 'scan_qr' && (
               <Alert variant="destructive" className="mt-8">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>QR Code Invalid or Expired</AlertTitle>
                  <ShadAlertDescription>
                  The scanned QR code is invalid, expired, or does not belong to an active session. Please try scanning again or get a new code.
                  </ShadAlertDescription>
              </Alert>
          )}
        </div>
      </main>
       <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} QRoll. All rights reserved.
      </footer>
    </div>
  );
}

export default function StudentPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentDashboardInternal />
    </ProtectedRoute>
  );
}
