
"use client";

import { useState, useEffect } from 'react';
import { useAuth, type UserProfile } from '@/contexts/auth-context';
import { db, storage } from '@/lib/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Header } from '@/components/common/header';
import { PageTitle } from '@/components/common/page-title';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { UserCircle, UploadCloud, Save, Loader2 } from 'lucide-react';

function StudentProfilePageContent() {
  const { user, userProfile, updateUserProfile, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setProfilePicturePreview(userProfile.profilePictureUrl || null);
    }
  }, [userProfile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for image type and size (optional)
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        toast({ title: 'Invalid File Type', description: 'Please select an image (JPEG, PNG, GIF).', variant: 'destructive'});
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
         toast({ title: 'File Too Large', description: 'Image size should not exceed 5MB.', variant: 'destructive'});
        return;
      }

      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Error', description: 'You are not logged in.', variant: 'destructive' });
      return;
    }
    if (!db || !storage) {
      toast({ title: 'Service Error', description: 'Database or storage service is not available.', variant: 'destructive'});
      return;
    }
    
    setIsSaving(true);
    let newProfilePictureUrl = userProfile?.profilePictureUrl || '';

    if (profilePictureFile) {
      setIsUploading(true);
      try {
        const storageRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}_${profilePictureFile.name}`);
        const snapshot = await uploadBytes(storageRef, profilePictureFile);
        newProfilePictureUrl = await getDownloadURL(snapshot.ref);
        toast({ title: 'Success', description: 'Profile picture uploaded.' });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast({ title: 'Upload Error', description: 'Failed to upload profile picture.', variant: 'destructive' });
        setIsUploading(false);
        setIsSaving(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    try {
      const updatedProfileData: Partial<UserProfile> = {
        displayName: displayName.trim() || userProfile?.displayName, // Keep old name if new one is empty
        profilePictureUrl: newProfilePictureUrl,
      };
      await updateUserProfile(updatedProfileData);
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: 'Update Error', description: 'Failed to update profile information in the database.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length-1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  if (authLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <PageTitle
          title="Your Profile"
          description="Manage your personal information and profile picture."
          icon={<UserCircle className="h-10 w-10" />}
        />
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your display name and profile picture. Your profile picture will be used for facial verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32 border-2 border-primary shadow-md">
                  <AvatarImage src={profilePicturePreview || undefined} alt={displayName || "User"} data-ai-hint="profile avatar placeholder"/>
                  <AvatarFallback className="text-4xl">{getInitials(displayName || user?.email || undefined)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center w-full max-w-xs">
                    <Label htmlFor="profilePicture" className="mb-1 text-sm font-medium text-gray-700 self-start">Change Profile Picture</Label>
                    <Input id="profilePicture" type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFileChange} className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isUploading || isSaving}/>
                </div>
                {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading image...
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={isSaving}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isUploading || isSaving || (!db || !storage)}>
                {isSaving || isUploading ? <Loader2 className="animate-spin" /> : <Save />}
                {isSaving ? 'Saving Profile...' : (isUploading ? 'Uploading...' : 'Save Profile')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border">
        © {new Date().getFullYear()} QRoll. All rights reserved.
      </footer>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <StudentProfilePageContent />
    </ProtectedRoute>
  )
}
