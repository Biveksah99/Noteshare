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
import { Edit, Check, Crop } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import ReactCrop, { type Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full Name must be at least 2 characters.",
  }),
  section: z.string().optional(),
  contactNumber: z.string().optional(),
  bio: z.string().min(10, {
    message: "Bio must be at least 10 characters.",
  }),
})

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

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>("https://picsum.photos/id/237/200/300");
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [newProfileImageSrc, setNewProfileImageSrc] = useState<string | null>(null); // Source for cropper
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const aspect = 1; // For square profile picture

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      fullName: "John Doe",
      section: "A",
      contactNumber: "123-456-7890",
      bio: "Passionate about sharing knowledge and helping others learn.",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
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
        setIsCropDialogOpen(true); // Open crop dialog instead of confirmation
        // Reset the input value so the same file can be selected again
        if (event.target) {
          event.target.value = "";
        }
      };
      reader.readAsDataURL(file);
    }
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
        setProfileImage(croppedImageUrl);
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-[500px] bg-card text-card-foreground shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-semibold">Your Profile</CardTitle>
            <CardDescription>Manage your profile information.</CardDescription>
          </div>
          <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Full Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is how your name will appear on shared notes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Section (e.g., A, B)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Specify your class section.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Contact Number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter your contact number.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write a short bio about yourself."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe yourself and your interests.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className={cn("ml-auto bg-accent text-accent-foreground", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading}>
                      {isLoading ? "Updating..." : "Update Profile"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Label htmlFor="profile-image-upload" className="cursor-pointer">
              <Avatar className="h-12 w-12">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarImage src="https://picsum.photos/id/237/200/300" alt="Default Profile" /> // Ensure default is always present
                )}
                <AvatarFallback>JD</AvatarFallback> {/* Update dynamically if possible */}
              </Avatar>
              <Input
                type="file"
                id="profile-image-upload"
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
            </Label>
            <div>
              <div className="text-lg font-semibold">{form.getValues("fullName")}</div>
              <div className="text-sm text-muted-foreground">{form.getValues("contactNumber")}</div>
              <div className="text-sm text-muted-foreground">{form.getValues("section")}</div>
            </div>
          </div>

          <CardDescription>
            {form.getValues("bio")}
          </CardDescription>
        </CardContent>
      </Card>

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
