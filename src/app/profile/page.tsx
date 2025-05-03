
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Edit, Check, Crop, User as UserIcon, CheckCircle2 } from "lucide-react" // Import CheckCircle2
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import ReactCrop, { type Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  const form = useForm<FormValues>({
    resolver: async (data, context, options) => {
      // Use Zod resolver
      const result = formSchema.safeParse(data);
      if (!result.success) {
        return { values: {}, errors: result.error.flatten().fieldErrors };
      }
      return { values: result.data, errors: {} };
    },
    defaultValues: {
      fullName: "", // Start with empty or placeholder values
      email: "",
      gender: undefined,
      contactNumber: "",
      address: "",
      section: "",
      bio: "",
      isVerified: false, // Default verification status
    },
  })

  // Load profile data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        // Ensure default values are handled if fields are missing
        const defaults = form.formState.defaultValues;
        form.reset({ ...defaults, ...profileData }); // Update form with saved data, keeping defaults for missing fields
        if (profileData.profileImage) {
            setProfileImage(profileData.profileImage);
        } else {
           // Set a default image if none is saved
           setProfileImage("https://picsum.photos/id/237/200/300");
        }
      } catch (error) {
        console.error("Failed to parse profile data from localStorage", error);
        // Set default image if loading fails
        setProfileImage("https://picsum.photos/id/237/200/300");
      }
    } else {
        // Set default image if no profile exists
        setProfileImage("https://picsum.photos/id/237/200/300");
    }
  }, [form]);


  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    console.log("Updating profile with:", values); // Log values being saved
     // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Save profile data (including the potentially updated image URL) to localStorage
    try {
      // Keep the existing isVerified status unless an admin changes it elsewhere
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const profileToSave = { ...values, profileImage, isVerified: currentProfile.isVerified || false };
      localStorage.setItem('userProfile', JSON.stringify(profileToSave));
      console.log("Profile saved to localStorage:", profileToSave);
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
        const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const profileToSave = { ...currentValues, profileImage: croppedImageUrl, isVerified: currentProfile.isVerified || false };
        localStorage.setItem('userProfile', JSON.stringify(profileToSave));

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

  const currentValues = form.watch(); // Use watch to reactively get values for display

  return (
    <div className="container mx-auto p-6">
       <div className="flex justify-between items-center border-b pb-2 mb-6"> {/* Increased margin-bottom */}
          <h1 className="text-2xl font-semibold flex items-center">
             {currentValues.fullName || "User"}
             {currentValues.isVerified && <CheckCircle2 className="ml-2 h-5 w-5 text-blue-500" />} {/* Blue tick */}
          </h1>
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
                          <Input type="email" placeholder="your.email@gmail.com" {...field} />
                        </FormControl>
                         <FormDescription>
                           Must be a @gmail.com address.
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
                   {/* Submit button needs to be outside the scrollable form area but inside the DialogFooter */}
                   <DialogFooter>
                      <Button type="submit" className={cn("ml-auto bg-accent text-accent-foreground", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Profile"}
                      </Button>
                   </DialogFooter>
                </form>
              </Form>

            </DialogContent>
          </Dialog>
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
                {currentValues.fullName || 'N/A'}
                {currentValues.isVerified && <CheckCircle2 className="ml-1 h-4 w-4 text-blue-500" />} {/* Blue tick */}
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
