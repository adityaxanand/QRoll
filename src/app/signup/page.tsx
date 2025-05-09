
"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QrCode, UserPlus, Loader2, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import Webcam from 'react-webcam';
import { Alert, AlertTitle, AlertDescription as ShadAlertDescription } from "@/components/ui/alert";


const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | ''>('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null); // Stores base64 data URI
  const [showWebcam, setShowWebcam] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const router = useRouter();
  const { toast } = useToast();

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: "user"
  };

  useEffect(() => {
    // Attempt to get camera permission when webcam is shown for student role
    if (role === 'student' && showWebcam && hasCameraPermission === null) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setHasCameraPermission(true))
        .catch(() => {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to register as a student.',
          });
          setShowWebcam(false); // Hide webcam if permission denied
        });
    }
  }, [role, showWebcam, hasCameraPermission, toast]);

  const captureFace = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({width: 640, height: 480}); // Capture a slightly larger image
      if (imageSrc) {
        setFaceImage(imageSrc);
        setShowWebcam(false); // Hide webcam after capture
        toast({ title: "Face Captured!", description: "Your face image has been captured for registration." });
      } else {
        toast({ title: "Capture Failed", description: "Could not capture image. Please try again.", variant: "destructive" });
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!role) {
      toast({ title: 'Error', description: 'Please select a role (Student or Teacher).', variant: 'destructive' });
      return;
    }
    if (!displayName.trim()) {
      toast({ title: 'Error', description: 'Please enter your full name.', variant: 'destructive' });
      return;
    }
    if (role === 'student' && !faceImage) {
      toast({ title: 'Error', description: 'Students must capture a face image for registration.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    if (!BACKEND_API_URL) {
      toast({ title: 'Configuration Error', description: 'Backend API URL not configured.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const signupData: any = {
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName.trim(),
        role,
      };
      if (role === 'student' && faceImage) {
        signupData.faceImage = faceImage; // Send base64 data URI
      }

      const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Signup failed with status: ${response.status}`);
      }

      toast({ title: 'Signup Successful!', description: 'Your account has been created. Please log in.' });
      router.push('/login'); 
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'Could not create account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
           <div className="inline-flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">Create QRoll Account</CardTitle>
          </div>
          <CardDescription>Join QRoll to manage or mark attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Full Name</Label>
              <Input
                id="displayName" type="text" placeholder="John Doe"
                value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                required disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" placeholder="•••••••• (min. 6 characters)"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword" type="password" placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={6} disabled={isLoading}
              />
            </div>
            <div>
              <Label>I am a:</Label>
              <RadioGroup
                value={role}
                onValueChange={(value) => {
                  setRole(value as 'student' | 'teacher');
                  if (value !== 'student') {
                    setFaceImage(null); setShowWebcam(false); setHasCameraPermission(null);
                  } else {
                    // Prompt for camera if student is selected and not already shown/denied
                    if (!showWebcam && hasCameraPermission !== false) setShowWebcam(true);
                  }
                }}
                className="flex gap-4 mt-1"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="role-teacher" />
                  <Label htmlFor="role-teacher">Teacher</Label>
                </div>
              </RadioGroup>
            </div>

            {role === 'student' && (
              <div className="space-y-2">
                <Label>Face Capture for Registration</Label>
                {faceImage ? (
                  <div className="flex flex-col items-center gap-2 p-2 border rounded-md bg-muted">
                    <img src={faceImage} alt="Captured face" className="rounded-md h-32 w-auto" data-ai-hint="person face"/>
                    <p className="text-sm text-green-600 flex items-center"><CheckCircle className="mr-1 h-4 w-4" /> Face captured!</p>
                    <Button variant="outline" size="sm" onClick={() => { setFaceImage(null); setShowWebcam(true); }} disabled={isLoading}>
                      Retake Picture
                    </Button>
                  </div>
                ) : showWebcam && hasCameraPermission === true ? (
                  <div className="flex flex-col items-center gap-2 p-2 border rounded-md">
                    <Webcam
                      audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                      className="rounded-md w-full" videoConstraints={videoConstraints}
                      mirrored={true}
                      onUserMediaError={() => {
                        setHasCameraPermission(false);
                        toast({variant: "destructive", title:"Camera Error", description:"Could not access webcam."})
                      }}
                    />
                    <Button onClick={captureFace} disabled={isLoading} className="w-full">
                      <Camera className="mr-2 h-4 w-4" /> Capture Face
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowWebcam(false)} disabled={isLoading}>Cancel</Button>
                  </div>
                ) : (
                  <>
                  <Button 
                    variant="outline" className="w-full" 
                    onClick={() => {
                        setHasCameraPermission(null); // Reset permission status to re-trigger useEffect or prompt
                        setShowWebcam(true);
                    }} 
                    disabled={isLoading || hasCameraPermission === false}
                   >
                    <Camera className="mr-2 h-4 w-4" /> Capture Face for Verification
                  </Button>
                  {hasCameraPermission === false && (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Camera Access Denied</AlertTitle>
                        <ShadAlertDescription>
                          Please enable camera permissions in your browser settings and refresh the page to register as a student.
                        </ShadAlertDescription>
                    </Alert>
                  )}
                  </>
                )}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
               {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
