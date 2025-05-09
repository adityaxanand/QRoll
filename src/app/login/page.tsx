
"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
// import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase login might be secondary
// import { auth } from '@/lib/firebase/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QrCode, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context'; // Import new useAuth

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { loginWithBackend, user, loading: authLoading } = useAuth(); // Use loginWithBackend

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await loginWithBackend(email, password);

    if (success) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      const redirectedFrom = searchParams.get('redirectedFrom');
      router.push(redirectedFrom || '/');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Please check your credentials and try again.', // Generic error for now
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <QrCode className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl">QRoll Login</CardTitle>
          </div>
          <CardDescription>Sign in to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || authLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || authLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
              {(isLoading || authLoading) ? <Loader2 className="animate-spin" /> : <LogIn />}
              {(isLoading || authLoading) ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
