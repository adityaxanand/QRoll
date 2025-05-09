
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut, getIdToken } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase'; // db is less relevant here now
import type { DocumentData } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation'; // For redirecting after logout

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;
const JWT_TOKEN_COOKIE = 'qrollUserToken';
const FIREBASE_ID_TOKEN_COOKIE = 'firebaseIdToken'; // Still used if Firebase sign-in is part of flow

// UserProfile now primarily reflects data from your custom backend
export interface UserProfile extends DocumentData {
  uid: string; // This will be the MongoDB _id from your backend
  email: string | null;
  role: 'student' | 'teacher' | null;
  displayName?: string;
  profilePictureUrl?: string;
  // Add other fields from your backend's User model as needed
}

interface AuthContextType {
  user: FirebaseUser | null; // Firebase user object (can be null if only backend auth is used)
  userProfile: UserProfile | null; // Profile from your custom backend
  authToken: string | null; // JWT from custom backend
  loading: boolean;
  logout: () => Promise<void>;
  loginWithBackend: (email: string, pass: string) => Promise<boolean>;
  // updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>; // Future backend update
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null); // Firebase auth user
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // Backend user profile
  const [authToken, setAuthToken] = useState<string | null>(() => Cookies.get(JWT_TOKEN_COOKIE) || null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchBackendProfile = useCallback(async (token: string) => {
    if (!BACKEND_API_URL) return;
    setLoading(true);
    try {
      const profileRes = await fetch(`${BACKEND_API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const backendProfile = await profileRes.json();
        setUserProfile({
          uid: backendProfile._id, // Important: uid is now MongoDB _id
          email: backendProfile.email,
          role: backendProfile.role,
          displayName: backendProfile.displayName,
          profilePictureUrl: backendProfile.profilePictureUrl,
          // include other fields from your backend user model
        });
      } else {
        // Token might be invalid or expired
        Cookies.remove(JWT_TOKEN_COOKIE);
        setAuthToken(null);
        setUserProfile(null);
        if (auth) await firebaseSignOut(auth); // Also sign out from Firebase if session is linked
        setUser(null);
        console.warn("Failed to fetch profile from custom backend, token might be invalid.");
      }
    } catch (e) {
      console.error("Error fetching profile from custom backend:", e);
      // Potentially handle network errors differently
       Cookies.remove(JWT_TOKEN_COOKIE);
       setAuthToken(null);
       setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect for handling Firebase Auth state changes (if Firebase is still used for part of auth)
  useEffect(() => {
    if (!auth) { // If Firebase is not configured/initialized
      if (!authToken) setLoading(false); // If no backend token either, stop loading
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser); // Set Firebase user
      if (firebaseUser) {
        const fbIdToken = await getIdToken(firebaseUser);
        Cookies.set(FIREBASE_ID_TOKEN_COOKIE, fbIdToken, { expires: 1, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        // If there's a Firebase user but no backend authToken, it implies a state mismatch or
        // that Firebase login happened but backend session hasn't been established or fetched.
        // The primary profile source should be the backend.
        if (!authToken) {
             // Potentially attempt to link/login to backend here if Firebase is primary IdP
             // For now, if no authToken, profile remains null or fetched by authToken effect.
             // setLoading(false); // Might be set by fetchBackendProfile
        }
      } else {
        // Firebase user logged out
        Cookies.remove(FIREBASE_ID_TOKEN_COOKIE);
        // If custom backend auth is primary, this Firebase logout might be redundant or
        // part of a larger logout flow. The main logout is handled by clearing JWT_TOKEN_COOKIE.
        if (!authToken) { // If backend token also gone, then truly logged out
            setUserProfile(null);
            setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [authToken]); // Rerun if authToken changes to handle sync

   // Effect for fetching backend profile when authToken changes or on initial load
  useEffect(() => {
    const currentToken = Cookies.get(JWT_TOKEN_COOKIE);
    if (currentToken) {
      setAuthToken(currentToken); // Ensure state is sync with cookie
      fetchBackendProfile(currentToken);
    } else {
      setUserProfile(null); // No token, no backend profile
      if(!user) setLoading(false); // If no Firebase user either, stop loading
    }
  }, [fetchBackendProfile, user]); // Depend on fetchBackendProfile and Firebase user state

  const loginWithBackend = useCallback(async (email: string, pass: string): Promise<boolean> => {
    if (!BACKEND_API_URL) {
      console.error("Backend API URL not configured");
      return false;
    }
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        Cookies.set(JWT_TOKEN_COOKIE, data.token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
        setAuthToken(data.token); // This will trigger the useEffect to fetch profile
        // Profile is set by the fetchBackendProfile triggered by authToken change
        // Optionally, sign into Firebase here if you want to link sessions
        // e.g., using custom token flow if backend provides one
        return true;
      } else {
        throw new Error(data.message || "Backend login failed");
      }
    } catch (error) {
      console.error("Backend login error:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchBackendProfile]);

  const logout = async () => {
    setLoading(true);
    if (auth) {
        try { await firebaseSignOut(auth); } catch (e) { console.error("Firebase signout error", e); }
    }
    Cookies.remove(JWT_TOKEN_COOKIE);
    Cookies.remove(FIREBASE_ID_TOKEN_COOKIE);
    setAuthToken(null);
    setUser(null);
    setUserProfile(null);
    // Optional: Call a /logout endpoint on your backend
    // await fetch(`${BACKEND_API_URL}/auth/logout`, { method: 'POST', headers: {'Authorization': `Bearer ${authToken}`} });
    setLoading(false);
    router.push('/login'); // Redirect to login page after logout
  };

  if (loading) { 
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check for Firebase specific config issues if Firebase is intended to be used
  const firebaseNotConfigured = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
                                process.env.NEXT_PUBLIC_FIREBASE_API_KEY.startsWith("YOUR_");
  // Check for backend URL config issues
  const backendNotConfigured = !BACKEND_API_URL;

  if (firebaseNotConfigured && backendNotConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive">App Not Configured</h1>
        <p className="text-muted-foreground mt-2">
          Neither Firebase nor the Backend API URL are configured.
          Please ensure environment variables (e.g., in `.env.local`) are correctly set up.
        </p>
      </div>
    )
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, authToken, loading, logout, loginWithBackend }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
