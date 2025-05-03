
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { User as UserIcon, Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast";

// Define interface for user profile data (similar to profile/page.tsx)
interface UserProfileData {
  fullName?: string;
  email?: string;
  gender?: string;
  contactNumber?: string;
  address?: string;
  section?: string; // Classroom
  bio?: string;
  profileImage?: string | null;
  isVerified?: boolean;
}

// Simple component to display profile details (similar to profile/page.tsx)
const ProfileDetail = ({ label, value, children }: { label: string, value?: string, children?: React.ReactNode }) => (
  value || children ? (
    <div className="flex justify-between items-center py-1">
      <span className="font-semibold text-sm">{label}</span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
      {children}
    </div>
  ) : null
);

const UserProfilePage = () => {
  const params = useParams();
  const userId = params?.userId as string | undefined; // Get userId from route params
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (userId) {
      // Fetch user profile data based on userId
      // In a real app, this would fetch from Firestore:
      // const userDocRef = doc(db, 'users', userId);
      // getDoc(userDocRef).then(...)

      // --- Simulate fetching from localStorage ---
      // This is a simplification. In a real multi-user app, you wouldn't store all profiles in localStorage.
      // We'll try to find a profile matching the userId (which might be an email or a generated ID in the demo).
      const allKeys = Object.keys(localStorage);
      let foundProfile: UserProfileData | null = null;

      // Try finding by 'userProfile' key if the ID matches email or generated ID
      const mainProfileRaw = localStorage.getItem('userProfile');
      if (mainProfileRaw) {
        try {
          const mainProfile = JSON.parse(mainProfileRaw);
          // Check if the stored profile's email or generated ID matches the userId param
          if (mainProfile.email === userId || (mainProfile.id && mainProfile.id === userId)) {
            foundProfile = mainProfile;
          }
        } catch (e) { console.error("Error parsing main profile", e); }
      }

       // If not found in main profile, check 'adminUserProfile' (assuming admin might be viewed)
       if (!foundProfile) {
           const adminProfileRaw = localStorage.getItem('adminUserProfile');
           if (adminProfileRaw) {
               try {
                 const adminProfile = JSON.parse(adminProfileRaw);
                  if (adminProfile.email === userId || (adminProfile.id && adminProfile.id === userId) || userId === "adminUserId") { // Example admin ID check
                      foundProfile = adminProfile;
                  }
               } catch (e) { console.error("Error parsing admin profile", e); }
           }
       }

      // If still not found, iterate through potential category storage (less likely but for robustness)
       if (!foundProfile) {
           allKeys.forEach(key => {
               if (key === 'userProfile' || key === 'adminUserProfile' || key === 'categories' || key.startsWith('firebase:')) {
                   return;
               }
               const item = localStorage.getItem(key);
               if (item) {
                   try {
                       const notesInCategory = JSON.parse(item);
                       if (Array.isArray(notesInCategory)) {
                           const noteWithUser = notesInCategory.find(note => note.uploaderId === userId);
                           if (noteWithUser) {
                               foundProfile = {
                                   fullName: noteWithUser.uploader,
                                   profileImage: noteWithUser.uploaderProfileImage,
                                   isVerified: noteWithUser.uploaderIsVerified,
                                   // Other details might be missing
                               };
                               // Stop searching once found
                               return;
                           }
                       }
                   } catch (e) { /* Ignore parsing errors for non-profile keys */ }
               }
           });
       }


      if (foundProfile) {
        // --- TEMPORARY FOR TESTING BLUE TICK ---
        // foundProfile.isVerified = true; // Force verified for testing
        // --- REMOVE THIS LINE AFTER TESTING ---
        setProfileData(foundProfile);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User profile not found.",
        });
        // Optionally redirect back or show a 'not found' message
        // router.push('/');
      }
      // --- End localStorage Simulation ---

    } else {
       toast({
         variant: "destructive",
         title: "Error",
         description: "User ID is missing.",
       });
    }
    setIsLoading(false);
  }, [userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-destructive">User profile could not be loaded.</p>
      </div>
    );
  }

  // Use data from profileData for display
  const {
    fullName,
    email,
    gender,
    contactNumber,
    address,
    section, // Classroom
    bio,
    profileImage,
    isVerified
  } = profileData;


  return (
    <div className="container mx-auto p-6">
       <div className="flex justify-between items-center border-b pb-2 mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
             <span>{fullName || "User"}</span>
             {/* Adjusted badge size and margin */}
             {isVerified && <VerifiedBadge className="ml-1.5 h-5 w-5 flex-shrink-0" />} {/* Slightly larger badge */}
          </h1>
          {/* No Edit button on other users' profiles */}
       </div>

      {/* Center the profile image and details vertically */}
      <div className="flex flex-col items-center">
        {/* Profile Picture */}
        <div className="mb-6">
           {/* Non-editable avatar */}
           <Avatar className="h-40 w-40 border-2 border-muted p-1 neumorphic">
             <AvatarImage src={profileImage || undefined} alt={fullName || "User"} data-ai-hint="user avatar profile"/>
             <AvatarFallback className="bg-secondary">
                <UserIcon className="h-20 w-20 text-muted-foreground" />
             </AvatarFallback>
           </Avatar>
        </div>

        {/* Profile Details */}
        <div className="w-full md:w-3/4 border rounded-md p-4 neumorphic bg-card">
          <ProfileDetail label="Full Name">
             <span className="text-sm text-muted-foreground flex items-center">
                 <span>{fullName || 'N/A'}</span>
                  {/* Adjusted badge size and margin */}
                  {isVerified && <VerifiedBadge className="ml-1 h-4 w-4 flex-shrink-0" />}
             </span>
          </ProfileDetail>
          <ProfileDetail label="Email" value={email || 'N/A'} />
          <ProfileDetail label="Gender" value={gender || 'N/A'} />
          {/* Optionally hide contact number for privacy */}
          {/* <ProfileDetail label="Phone" value={contactNumber || 'N/A'} /> */}
          <ProfileDetail label="Address" value={address || 'N/A'} />
          <Separator className="my-2"/>
          <ProfileDetail label="Classroom" value={section || 'N/A'} />

          {/* Optional Bio Display */}
          {bio && (
            <>
             <Separator className="my-2"/>
             <div className="pt-2">
                <h3 className="font-semibold text-sm mb-1">Bio</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{bio}</p>
             </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfilePage;
