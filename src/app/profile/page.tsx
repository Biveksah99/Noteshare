"use client"

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {toast} from "@/hooks/use-toast"
import {cn} from "@/lib/utils"
import {useRouter} from "next/navigation"
import {useState} from "react"
import {useForm} from "react-hook-form"
import * as z from "zod"
import {Edit, Check} from "lucide-react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from "@/components/ui/dialog";

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

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
    setOpen(false); // Close the dialog after submitting
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-[500px] bg-card text-card-foreground shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-semibold">Your Profile</CardTitle>
            <CardDescription>Manage your profile information.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit className="h-5 w-5"/>
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
                    render={({field}) => (
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
                    render={({field}) => (
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
                    render={({field}) => (
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
                    render={({field}) => (
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
              <Label htmlFor="profile-image-upload">
                <Avatar className="h-12 w-12 cursor-pointer">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarImage src="https://picsum.photos/id/237/200/300" alt="Profile" />
                  )}
                  <AvatarFallback>JD</AvatarFallback>
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
    </div>
  )
}

export default ProfilePage
