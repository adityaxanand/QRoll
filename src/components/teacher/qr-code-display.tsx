
"use client";

import { useState, useEffect, useCallback } from 'react';
import QRCodeStyling from 'qrcode.react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw, Loader2, PlayCircle, StopCircle, AlertTriangle, QrCode as QrCodeIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, Timestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/auth-context';

interface QrCodeDisplayProps {
  teacherFirebaseId: string; // Firebase UID, still useful for querying Firebase if needed
  teacherName: string;
}

const QR_CODE_VALIDITY_SECONDS = 180; // 3 minutes

export function QrCodeDisplay({ teacherFirebaseId, teacherName }: QrCodeDisplayProps) {
  const [className, setClassName] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); 
  const [token, setToken] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(QR_CODE_VALIDITY_SECONDS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const { toast } = useToast();
  const { userProfile } = useAuth(); // Get userProfile which contains MongoDB _id as `uid`

  // teacherMongoId is the MongoDB _id of the teacher from the custom backend user record
  const teacherMongoId = userProfile?.uid; 

  const invalidateOldSessions = useCallback(async () => {
    if (!db) return;
    const sessionsRef = collection(db, 'classSessions');
    // Query for sessions by teacher's Firebase UID to invalidate their old Firebase sessions
    const q = query(sessionsRef, where('teacherId', '==', teacherFirebaseId), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, { isActive: false, activeQrToken: null });
        });
        await batch.commit();
    }
  }, [teacherFirebaseId]);


  const generateNewTokenAndSession = useCallback(async () => {
    if (!db) {
        toast({ title: "Service Unavailable", description: "Database service is not ready.", variant: "destructive" });
        return;
    }
    if (!className.trim()) {
      toast({ title: "Class Name Required", description: "Please enter a name for your class session.", variant: "destructive" });
      return;
    }
    if (!teacherMongoId) {
      toast({ title: "User Profile Error", description: "Teacher's backend ID not found. Please re-login or check profile.", variant: "destructive" });
      return;
    }
    if(!teacherFirebaseId) {
      toast({ title: "User Profile Error", description: "Teacher's Firebase ID not found. Please re-login.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    await invalidateOldSessions();

    const newToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    
    try {
      const sessionEndsAt = new Date();
      sessionEndsAt.setSeconds(sessionEndsAt.getSeconds() + QR_CODE_VALIDITY_SECONDS);

      const sessionRef = await addDoc(collection(db, 'classSessions'), {
        teacherId: teacherFirebaseId, // Store Firebase UID (who created it in Firebase)
        teacherMongoId: teacherMongoId, // Store MongoDB _id (for linking in backend DB)
        teacherName,
        className: className.trim(),
        activeQrToken: newToken,
        qrTokenGeneratedAt: serverTimestamp(),
        qrTokenExpiresAt: Timestamp.fromDate(sessionEndsAt),
        isActive: true,
        createdAt: serverTimestamp(),
      });
      setActiveSessionId(sessionRef.id);
      setToken(newToken);
      setCountdown(QR_CODE_VALIDITY_SECONDS);
      setIsSessionActive(true);
      toast({ title: "Session Started", description: `QR code generated for ${className.trim()}. It will expire.` });
    } catch (error) {
      console.error("Error creating session:", error);
      toast({ title: "Error Starting Session", description: "Could not start new session. Please try again.", variant: "destructive" });
      setToken(''); 
    } finally {
      setIsProcessing(false);
    }
  }, [className, teacherFirebaseId, teacherName, teacherMongoId, toast, invalidateOldSessions]);

  const stopCurrentSession = useCallback(async (showToast = true) => {
    if (!db) {
        if (showToast) toast({ title: "Service Unavailable", description: "Database service is not ready.", variant: "destructive" });
        return;
    }
    if (activeSessionId) {
      setIsProcessing(true);
      try {
        const sessionDocRef = doc(db, 'classSessions', activeSessionId);
        await updateDoc(sessionDocRef, {
          isActive: false,
          activeQrToken: null,
          sessionEndedAt: serverTimestamp()
        });
        if (showToast) toast({ title: "Session Ended", description: "The current class session has been stopped." });
      } catch (error) {
        console.error("Error stopping session:", error);
        if (showToast) toast({ title: "Error Stopping Session", description: "Could not stop the session.", variant: "destructive" });
      } finally {
        setActiveSessionId(null);
        setToken('');
        setIsSessionActive(false);
        setCountdown(QR_CODE_VALIDITY_SECONDS);
        setIsProcessing(false);
      }
    } else { // If no active session ID, just reset UI state
        setToken('');
        setIsSessionActive(false);
        setCountdown(QR_CODE_VALIDITY_SECONDS);
    }
  }, [activeSessionId, toast]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isSessionActive && token && countdown > 0) { // Ensure countdown is positive
      intervalId = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(intervalId); // Clear interval before stopping session
            stopCurrentSession(false); 
            toast({ title: "Session Expired", description: "The QR code has expired. Start a new session if needed.", variant: "default"});
            return 0; 
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isSessionActive, token, countdown, stopCurrentSession, toast]);

  if (!db) {
    return (
        <Card className="w-full max-w-lg shadow-xl text-center">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center justify-center"><AlertTriangle className="text-destructive mr-2 h-6 w-6"/> Service Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">The QR code generation service is currently unavailable because the database is not connected. Please ensure Firebase is configured correctly and try again later.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Attendance QR Code</CardTitle>
        <CardDescription>
          {isSessionActive && className ? `Session for "${className}" is active.` : "Enter class name and start a session to generate a QR code."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 p-6">
        {!isSessionActive && (
          <div className="w-full space-y-4">
            <div>
              <Label htmlFor="className">Class/Session Name</Label>
              <Input
                id="className"
                placeholder="e.g., Math 101 - Section A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <Button onClick={generateNewTokenAndSession} className="w-full" disabled={isProcessing || !className.trim() || !teacherMongoId || !teacherFirebaseId}>
              {isProcessing ? <Loader2 className="animate-spin" /> : <PlayCircle />}
              {isProcessing ? 'Starting Session...' : 'Start New Session'}
            </Button>
             {(!teacherMongoId || !teacherFirebaseId) && <p className="text-xs text-destructive text-center">Teacher account details missing or incomplete. Please re-login.</p>}
          </div>
        )}

        {isSessionActive && token && (
          <>
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <QRCodeStyling
                value={token}
                size={256}
                level="H"
                fgColor="hsl(var(--primary))"
                bgColor="hsl(var(--background))"
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className={`h-5 w-5 ${countdown > 0 && countdown <= QR_CODE_VALIDITY_SECONDS ? 'animate-spin-slow' : ''}`} style={{ animationDuration: '3s' }} />
              <span>{countdown > 0 ? `Expires in ${countdown}s` : "Token Expired"}</span>
            </div>
            <Button onClick={() => stopCurrentSession(true)} variant="destructive" className="w-full" disabled={isProcessing && !!activeSessionId}>
              {isProcessing && activeSessionId ? <Loader2 className="animate-spin" /> : <StopCircle />}
              {isProcessing && activeSessionId ? 'Stopping...' : 'Stop Current Session'}
            </Button>
          </>
        )}
        {(isSessionActive && !token && !isProcessing) && ( 
             <div className="w-64 h-64 bg-muted flex items-center justify-center rounded-lg text-center p-4">
                <p className="text-muted-foreground">Session ended or token expired. <br/> Start a new session or re-enter class name above if you wish to restart.</p>
             </div>
        )}
         {!isSessionActive && !token && !isProcessing && (
             <div className="w-64 h-64 bg-muted flex flex-col items-center justify-center rounded-lg p-4 text-center">
                <QrCodeIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">QR Code will appear here once a session is started.</p>
             </div>
        )}
      </CardContent>
    </Card>
  );
}
