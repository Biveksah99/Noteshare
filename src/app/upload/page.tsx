
"use client"

import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {toast} from "@/hooks/use-toast"
import {cn} from "@/lib/utils"
import {useRouter} from "next/navigation"
import {useState, useEffect} from "react"
import {useForm} from "react-hook-form"
import * as z from "zod"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import { File as FileIcon } from "lucide-react"; // Renamed to avoid conflict with File type
import { auth } from '@/lib/firebase'; // Import auth
import { useAuthState } from 'react-firebase-hooks/auth'; // Import useAuthState

// Updated schema: Use z.any() and refine for file-like objects
const formSchema = z.object({
  category: z.string().min(1, {
    message: "Category must be selected.",
  }),
  title: z.string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(200, { // Max characters, approximately 40 words
      message: "Title must be at most 200 characters (approx. 40 words).",
    }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  // Use z.any() and refine the check for file-like properties
  files: z.array(z.any())
    .min(1, { message: "Please upload at least one file." })
    .refine(
      (files) => files.every((file) => typeof file === 'object' && file !== null && 'name' in file && 'size' in file && 'type' in file),
      { message: "Invalid file type detected." }
    )
})

type FormValues = z.infer<typeof formSchema>;

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // State to hold uploaded files
  const [user, authLoading] = useAuthState(auth); // Get current user state

  useEffect(() => {
    // Load categories from local storage on component mount
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      try {
        const parsedCategories = JSON.parse(storedCategories);
        if (Array.isArray(parsedCategories)) {
            setCategories(parsedCategories);
        } else {
            console.error("Stored categories is not an array:", parsedCategories);
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage:", error);
      }
    }
  }, []);

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
      category: "",
      title: "",
      description: "",
      files: []
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    if (authLoading || !user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to upload.",
        });
        setIsLoading(false);
        return;
    }

    // Get user profile from localStorage
    let uploaderName = user.displayName || 'Anonymous'; // Use auth display name first
    let uploaderProfileImage: string | null = user.photoURL || null; // Use auth photo URL first
    let uploaderIsVerified = false; // Default verification status
    const userProfileRaw = localStorage.getItem('userProfile');
    if (userProfileRaw) {
      try {
        const userProfile = JSON.parse(userProfileRaw);
        // Prefer localStorage data if available and matches the logged-in user
        if (userProfile.email === user.email) {
             uploaderName = userProfile.fullName || uploaderName;
             uploaderProfileImage = userProfile.profileImage || uploaderProfileImage;
             uploaderIsVerified = userProfile.isVerified || false;
        }
      } catch (error) {
        console.error("Failed to parse user profile from localStorage for uploader info", error);
      }
    }

    // --- TEMPORARY FOR TESTING BLUE TICK ---
    uploaderIsVerified = true; // Keep forced true for testing
    // --- END TEMPORARY ---


    const fileData = [];
    // Ensure values.files is treated as an array of File objects
    const filesToProcess: File[] = values.files as File[];

    for (const file of filesToProcess) {
      try {
          const fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          fileData.push({ url: fileDataUrl, type: file.type, name: file.name }); // Include file name
      } catch (error) {
          console.error("Error reading file:", file.name, error);
          toast({
            variant: "destructive",
            title: "File Read Error",
            description: `Could not process file: ${file.name}`,
          });
          setIsLoading(false);
          return; // Stop submission if a file fails
      }
    }


    const newNote = {
      id: Date.now().toString(), // Use string ID
      title: values.title,
      description: values.description,
      uploader: uploaderName, // Use actual uploader name
      uploaderId: user.uid, // Add the uploader's user ID
      uploaderProfileImage: uploaderProfileImage, // Include profile image URL
      uploaderIsVerified: uploaderIsVerified, // Include verification status
      timestamp: new Date().toISOString(),
      files: fileData,
      category: values.category, // Include category in the note itself
    };

    // Load existing notes for the category or initialize an empty array
    let existingNotes = [];
    const storedNotes = localStorage.getItem(values.category);
    if (storedNotes) {
        try {
            existingNotes = JSON.parse(storedNotes);
            if (!Array.isArray(existingNotes)) {
                console.warn(`Stored data for category ${values.category} is not an array. Resetting.`);
                existingNotes = [];
            }
        } catch (error) {
            console.error(`Failed to parse notes for category ${values.category}. Resetting.`, error);
            existingNotes = [];
        }
    }


    // Add the new note to the existing notes
    const updatedNotes = [...existingNotes, newNote];

    // Store the updated notes back in local storage
    try {
        localStorage.setItem(values.category, JSON.stringify(updatedNotes));
    } catch (error) {
        console.error(`Failed to save notes for category ${values.category} to localStorage.`, error);
        toast({
          variant: "destructive",
          title: "Save Error",
          description: "Could not save the note locally.",
        });
        setIsLoading(false);
        return; // Stop if saving fails
    }


    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 500)); // Reduced delay
    setIsLoading(false);
    toast({
      title: "Success!",
      description: "Study material uploaded successfully.",
    })
    form.reset(); // Reset form fields
    setUploadedFiles([]); // Clear uploaded files state
    router.push(`/category/${encodeURIComponent(values.category)}`); // Redirect to the category page
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentFiles = form.getValues("files") || [];
    // Combine and cast to File[] for state
    const newFiles = [...currentFiles, ...files] as File[];
    setUploadedFiles(newFiles); // Update state with the combined list
    form.setValue("files", newFiles, { shouldValidate: true }); // Update form's files array and trigger validation
  };

  // Function to remove a file
  const removeFile = (indexToRemove: number) => {
    const currentFiles = form.getValues("files") || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
    setUploadedFiles(updatedFiles as File[]); // Update state
    form.setValue("files", updatedFiles, { shouldValidate: true }); // Update form and trigger validation
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4"> {/* Added padding */}
      <Card className="w-full max-w-lg bg-card text-card-foreground shadow-lg neumorphic"> {/* Adjusted max-width */}
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Upload Study Material</CardTitle>
          <CardDescription>Share your notes and help others learn.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category"/>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.length > 0 ? (
                            categories.map((category) => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))
                         ) : (
                             <SelectItem value="disabled" disabled>No categories available</SelectItem>
                         )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category for your notes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Give your notes a descriptive title." {...field} />
                    </FormControl>
                    <FormDescription>
                       Max 200 characters (approx. 40 words).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Detailed notes on Microeconomics concepts."
                        className="resize-none"
                        rows={4} // Slightly larger textarea
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief summary of the material.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
                control={form.control}
                name="files"
                render={({ fieldState }) => ( // Use fieldState to check for errors
                  <FormItem>
                    <FormLabel>Upload Files</FormLabel>
                    <FormControl>
                      {/* Hidden input triggered by a button */}
                       <Input
                          id="file-upload-input"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden" // Keep input hidden
                          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" // Specify accepted types
                       />
                    </FormControl>
                     {/* Custom Button to trigger file input */}
                     <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload-input')?.click()}>
                       <FileIcon className="mr-2 h-4 w-4" /> Add Files
                     </Button>
                    <FormDescription>
                      Supported files: PDF, Word, PPT, Images. You can add multiple files.
                    </FormDescription>
                    {/* Display error message if validation fails */}
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                    {/* Display list of uploaded files with remove button */}
                     {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected Files:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="truncate mr-2">
                                <FileIcon className="h-4 w-4 inline mr-1" />
                                {file.name} ({ (file.size / 1024).toFixed(1) } KB)
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-destructive hover:text-destructive/80 h-auto p-1"
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              {/* Moved Button outside the last FormField */}
              <CardFooter className="pt-4"> {/* Add padding top */}
                <Button type="submit" className={cn("ml-auto bg-accent text-accent-foreground", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading || uploadedFiles.length === 0}>
                  {isLoading ? "Uploading..." : "Upload"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default UploadPage

