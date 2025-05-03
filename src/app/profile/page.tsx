
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card" // Added CardFooter
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Edit, Check, Crop, User as UserIcon, LogOut, Loader2 } from "lucide-react" // Added LogOut icon & Loader2
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import ReactCrop, { type Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut function
import { useAuthState } from 'react-firebase-hooks/auth'; // Import useAuthState

// ~60 words * 5 chars/word = 300 characters
const BIO_MAX_LENGTH = 300;

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full Name must be at least 2 characters.",
  }),
  email: z.string()
    .email({ message: "Invalid email format." }) // Basic email format check
    .refine(email => email.endsWith('@gmail.com'), { // Custom refinement for @gmail.com
      message: "Email must end with @gmail.com",
    })
    .optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(), // Use enum for gender
  contactNumber: z.string().optional(), // Renamed from phone for consistency
  address: z.string().optional(),
  section: z.string().optional(), // Represents Classroom
  bio: z.string().max(BIO_MAX_LENGTH, { // Updated bio validation to max characters
    message: `Bio must be at most ${BIO_MAX_LENGTH} characters (approx. 60 words).`,
  }).optional(), // Make bio optional as it's not in target UI
  isVerified: z.boolean().optional().default(false), // Added isVerified field
})

type FormValues = z.infer<typeof formSchema>;

// Helper function to generate cropped image
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      },
      'image/png', // Adjust type if needed
      1 // Quality
    );
  });
}

// Simple component to display profile details
const ProfileDetail = ({ label, value, children }: { label: string, value?: string, children?: React.ReactNode }) => (
  value || children ? (
    <div className="flex justify-between items-center py-1">
      <span className="font-semibold text-sm">{label}</span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
      {children}
    </div>
  ) : null
);


const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null); // Initialize as null
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [newProfileImageSrc, setNewProfileImageSrc] = useState<string | null>(null); // Source for cropper
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input
  const aspect = 1; // For square profile picture
  const [user, authLoading] = useAuthState(auth); // Get user state

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Use zod resolver directly
    defaultValues: {
      fullName: "",
      email: "",
      gender: undefined,
      contactNumber: "",
      address: "",
      section: "",
      bio: "",
      isVerified: false,
    },
  })

   // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login'); // Redirect to login page
    }
  }, [user, authLoading, router]);


  // Load profile data from localStorage when authenticated user is available
  useEffect(() => {
    if (user) { // Only load if user is authenticated
      const savedProfile = localStorage.getItem('userProfile');
      let loadedData = { ...form.formState.defaultValues, isVerified: false }; // Start with defaults

      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile);
          // Basic check if loaded profile likely belongs to current user (e.g., by email)
          if (profileData.email === user.email) {
            const defaults = form.formState.defaultValues;
            loadedData = {
              ...defaults,
              ...profileData,
              // Ensure fullName and email from auth are prioritized if missing/different
              fullName: profileData.fullName || user.displayName || '',
              email: profileData.email || user.email || '',
              isVerified: profileData.isVerified || false // Load actual or default verification
            };
            setProfileImage(profileData.profileImage || null); // Load saved image or null
          } else {
            // Profile in localStorage doesn't match current user, reset to defaults based on auth user
            console.warn("localStorage profile does not match logged-in user. Initializing from auth data.");
             loadedData = {
                ...form.formState.defaultValues,
                fullName: user.displayName || '',
                email: user.email || '',
                isVerified: false, // Default for new/mismatched profile
                // id: user.uid, // Optionally store UID here too
             };
            setProfileImage(user.photoURL || null); // Use auth photoURL or null
            // Optionally clear the mismatched localStorage entry
            // localStorage.removeItem('userProfile');
          }
        } catch (error) {
          console.error("Failed to parse profile data from localStorage", error);
          // Initialize with auth data if parsing fails
           loadedData = {
               ...form.formState.defaultValues,
               fullName: user.displayName || '',
               email: user.email || '',
               isVerified: false,
           };
          setProfileImage(user.photoURL || null);
        }
      } else {
          // No profile in localStorage, initialize with auth data
           loadedData = {
               ...form.formState.defaultValues,
               fullName: user.displayName || '',
               email: user.email || '',
               isVerified: false, // Default for new profile
           };
          setProfileImage(user.photoURL || null);
      }

      // --- TEMPORARY FOR TESTING BLUE TICK ---
      loadedData.isVerified = true; // Force verified status for testing
      // --- REMOVE THIS LINE AFTER TESTING ---

      form.reset(loadedData); // Update form with loaded or initialized data
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form]); // Depend on user


  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to update your profile." });
      return;
    }

    setIsLoading(true)
    console.log("Updating profile with:", values); // Log values being saved
     // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save profile data (including the potentially updated image URL) to localStorage
    try {
      // Keep the existing isVerified status unless an admin changes it elsewhere
      const currentProfileRaw = localStorage.getItem('userProfile');
      const currentProfile = currentProfileRaw ? JSON.parse(currentProfileRaw) : {};
      // Preserve the current isVerified status when saving other updates
      const profileToSave = {
         ...values,
         profileImage,
         id: user.uid, // Ensure UID is saved
         // --- TEMPORARY FOR TESTING BLUE TICK ---
         // isVerified: currentProfile.isVerified || values.isVerified || false // Preserve existing or use form value, default false
         isVerified: true // Keep forced true for testing, revert later
         // --- END TEMPORARY ---
       };
      localStorage.setItem('userProfile', JSON.stringify(profileToSave));
      console.log("Profile saved to localStorage:", profileToSave);

      // Optionally update Firebase Auth profile too (displayName, photoURL)
       try {
         await updateProfile(user, {
           displayName: values.fullName,
           photoURL: profileImage, // Update photoURL in Auth
         });
         console.log("Firebase Auth profile updated.");
       } catch (authError) {
         console.error("Failed to update Firebase Auth profile:", authError);
         // Optionally notify user, but saving to localStorage already succeeded
       }


      form.reset(profileToSave); // Update form state after saving
    } catch (error) {
      console.error("Failed to save profile data to localStorage", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile locally.",
      })
    }

    setIsLoading(false)
    toast({
      title: "Success!",
      description: "Profile updated successfully.",
    })
    setOpenEditDialog(false); // Close the dialog after submitting
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProfileImageSrc(reader.result as string);
        setIsCropDialogOpen(true); // Open crop dialog
        if (event.target) {
          event.target.value = ""; // Reset input value
        }
      };
      reader.readAsDataURL(file);
    }
  };

   // Trigger file input click when Avatar is clicked
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };


  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Initial crop selection size
        },
        aspect,
        width,
        height
      ),
      width,
      height
    ));
  }

  const handleCropAndSave = async () => {
     if (!user) return; // Need user context

    if (completedCrop?.width && completedCrop?.height && imgRef.current) {
      try {
        const croppedImageUrl = await getCroppedImg(
          imgRef.current,
          completedCrop,
          'profile.png' // You might want a dynamic name
        );
        setProfileImage(croppedImageUrl); // Update profile image state
        // Immediately save the updated image URL with the rest of the profile data
        const currentValues = form.getValues();
        // Preserve existing verification status when updating image
        const currentProfileRaw = localStorage.getItem('userProfile');
        const currentProfile = currentProfileRaw ? JSON.parse(currentProfileRaw) : {};
        const profileToSave = {
           ...currentValues,
           profileImage: croppedImageUrl,
           id: user.uid,
           // --- TEMPORARY FOR TESTING BLUE TICK ---
           // isVerified: currentProfile.isVerified || currentValues.isVerified || false
           isVerified: true // Keep forced true for testing
           // --- END TEMPORARY ---
        };
        localStorage.setItem('userProfile', JSON.stringify(profileToSave));

         // Optionally update Firebase Auth photoURL immediately after crop
         try {
           await updateProfile(user, { photoURL: croppedImageUrl });
           console.log("Firebase Auth photoURL updated after crop.");
         } catch (authError) {
           console.error("Failed to update Firebase Auth photoURL after crop:", authError);
         }


        setIsCropDialogOpen(false);
        setNewProfileImageSrc(null); // Clear the source image
        setCrop(undefined); // Reset crop state
        setCompletedCrop(undefined);
        toast({
          title: "Success!",
          description: "Profile picture updated successfully.",
        });
      } catch (e) {
        console.error("Error cropping image:", e);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to crop image.",
        });
      }
    } else {
       toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a crop area.",
        });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Clear local storage (optional, but often good practice on logout)
      localStorage.removeItem('userProfile');
      // Redirect to home page or login page
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const currentValues = form.watch(); // Use watch to reactively get values for display

  if (authLoading) {
     return (
       <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <span className="ml-2">Loading profile...</span>
       </div>
     );
   }

   // If user is not logged in (and not loading), show redirecting message or null
   if (!user) {
      return (
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Redirecting to login...</span>
        </div>
     );
   }


  return (
    <div className="container mx-auto p-6">
       <div className="flex justify-between items-center border-b pb-2 mb-6"> {/* Increased margin-bottom */}
          <h1 className="text-2xl font-semibold flex items-center">
             <span>{currentValues.fullName || "User"}</span>
             {/* Adjusted badge size and margin - Use h-5 w-5 */}
             {currentValues.isVerified && <VerifiedBadge className="ml-1.5 h-5 w-5 flex-shrink-0" />}
          </h1>
          <div className="flex items-center space-x-2">
             <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                   <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]"> {/* Slightly wider dialog */}
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                   {/* Form needs to be inside DialogContent but outside DialogFooter if using default footer */}
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Form Fields */}
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Full Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            {/* Make email read-only as it's used for login */}
                            <Input type="email" placeholder="your.email@gmail.com" {...field} readOnly disabled className="bg-muted/50 cursor-not-allowed"/>
                          </FormControl>
                           <FormDescription>
                             Email cannot be changed.
                           </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your gender" />
                                </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               <SelectItem value="Male">Male</SelectItem>
                               <SelectItem value="Female">Female</SelectItem>
                               <SelectItem value="Other">Other</SelectItem>
                             </SelectContent>
                           </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Contact Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* "Section" maps to "Classroom" */}
                    <FormField
                      control={form.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Classroom</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Section/Classroom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* Bio field */}
                     <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write a short bio about yourself (max 60 words)."
                              className="resize-none"
                              {...field}
                              maxLength={BIO_MAX_LENGTH} // Enforce in textarea as well
                            />
                          </FormControl>
                           <FormDescription>
                             {`${field.value?.length || 0}/${BIO_MAX_LENGTH} characters`}
                           </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     {/* Submit button needs to be inside the DialogFooter */}
                     <DialogFooter>
                        <Button type="submit" className={cn("ml-auto bg-accent text-accent-foreground", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading}>
                          {isLoading ? "Updating..." : "Update Profile"}
                        </Button>
                     </DialogFooter>
                  </form>
                </Form>

              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
       </div>

      {/* Center the profile image and details vertically */}
      <div className="flex flex-col items-center">
        {/* Profile Picture */}
        <div className="mb-6"> {/* Add margin below the avatar */}
           <Label htmlFor="profile-image-upload" className="cursor-pointer relative group">
              <Avatar className="h-40 w-40 border-2 border-muted p-1 neumorphic"> {/* Increased size */}
                 {/* Add placeholder if no image */}
                 <AvatarImage src={profileImage || undefined} alt={currentValues.fullName || "User"} data-ai-hint="user avatar profile"/>
                 <AvatarFallback className="bg-secondary">
                    <UserIcon className="h-20 w-20 text-muted-foreground" /> {/* Increased icon size */}
                 </AvatarFallback>
              </Avatar>
               {/* Overlay for edit icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <Edit className="h-10 w-10 text-white" /> {/* Increased edit icon size */}
                </div>
              <Input
                type="file"
                id="profile-image-upload"
                ref={fileInputRef} // Add ref
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
           </Label>
        </div>

        {/* Profile Details */}
        <div className="w-full md:w-3/4 border rounded-md p-4 neumorphic bg-card">
          <ProfileDetail label="Full Name">
             <span className="text-sm text-muted-foreground flex items-center">
                 <span>{currentValues.fullName || 'N/A'}</span>
                  {/* Adjusted badge size and margin - Use h-4 w-4 */}
                  {currentValues.isVerified && <VerifiedBadge className="ml-1 h-4 w-4 flex-shrink-0" />}
             </span>
          </ProfileDetail>
          <ProfileDetail label="Email" value={currentValues.email || 'N/A'} />
          <ProfileDetail label="Gender" value={currentValues.gender || 'N/A'} />
          <ProfileDetail label="Phone" value={currentValues.contactNumber || 'N/A'} />
          <ProfileDetail label="Address" value={currentValues.address || 'N/A'} />
          <Separator className="my-2"/> {/* Separator like in image */}
          <ProfileDetail label="Classroom" value={currentValues.section || 'N/A'} />

          {/* Optional Bio Display */}
          {currentValues.bio && (
            <>
             <Separator className="my-2"/>
             <div className="pt-2">
                <h3 className="font-semibold text-sm mb-1">Bio</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentValues.bio}</p>
             </div>
            </>
          )}
        </div>
      </div>


      {/* Crop Image Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[600px]"> {/* Adjust width as needed */}
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the selection to crop your profile picture.
            </DialogDescription>
          </DialogHeader>
          {newProfileImageSrc && (
            <div className="flex justify-center items-center max-h-[60vh] overflow-auto my-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={100} // Optional: minimum crop dimensions
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={newProfileImageSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '50vh', objectFit: 'contain' }} // Constrain image display size
                />
              </ReactCrop>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setIsCropDialogOpen(false); setNewProfileImageSrc(null); setCrop(undefined); setCompletedCrop(undefined); }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCropAndSave}>
              <Crop className="mr-2 h-4 w-4" /> Crop and Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfilePage
