
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
import { File as FileIcon, UploadCloud } from "lucide-react";
import { auth } from '@/lib/firebase'; // Import auth
import { useAuthState } from 'react-firebase-hooks/auth'; // Import useAuthState

// Schema for a single file-like object
const fileLikeSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  // Add other File properties if needed by Zod internally, though often not required for basic validation
}).passthrough(); // Allow other properties that might exist on File objects


// Updated schema: Use fileLikeSchema within the array
const formSchema = z.object({
  category: z.string().min(1, {
    message: "Category must be selected.",
  }),
  title: z.string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(200, { // Approx 40 words assuming 5 chars/word
      message: "Title must be at most 200 characters (approx. 40 words).",
    }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  files: z.array(fileLikeSchema) // Use the specific file-like schema
    .min(1, { message: "Please upload at least one file." }),
})

type FormValues = z.infer<typeof formSchema>;

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // State to hold actual File objects for display/upload logic
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
            // Optionally set default categories if loading fails
             setCategories([
                'English', 'Nepali', 'Basic Maths', 'Economics', 'Accountancy',
                'Business Studies', 'Computer', 'Social Studies', 'Business Maths'
             ]);
        }
      } catch (error) {
        console.error("Failed to parse categories from localStorage:", error);
         setCategories([
            'English', 'Nepali', 'Basic Maths', 'Economics', 'Accountancy',
            'Business Studies', 'Computer', 'Social Studies', 'Business Maths'
         ]);
      }
    } else {
        // Set default categories if none are stored
        setCategories([
           'English', 'Nepali', 'Basic Maths', 'Economics', 'Accountancy',
           'Business Studies', 'Computer', 'Social Studies', 'Business Maths'
        ]);
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: async (data, context, options) => {
      console.log("Validating raw data:", data);

      // Ensure 'files' is an array and contains only objects that *look like* Files
      // Zod needs plain objects for validation, not actual File instances sometimes
       const plainFileObjects = Array.isArray(data.files)
         ? data.files
             .filter(f => typeof f === 'object' && f !== null && 'name' in f && 'size' in f && 'type' in f)
             .map(file => ({ // Convert File instances to plain objects for Zod
               name: file.name,
               size: file.size,
               type: file.type,
               // Copy other relevant properties if your schema expects them
             }))
         : [];


      const dataToValidate = {
         ...data,
         files: plainFileObjects, // Use the plain objects for validation
      };

      console.log("Data being validated by Zod:", dataToValidate);

      const result = formSchema.safeParse(dataToValidate);
      if (!result.success) {
        console.error("Validation failed:", result.error.flatten().fieldErrors);
        // Log the raw error object for more details
        console.error("Raw Zod error:", result.error);
        return { values: data, errors: result.error.flatten().fieldErrors }; // Return original data with errors
      }
      console.log("Validation successful:", result.data);
      // Important: Return the *original* data (with File instances) if validation passes,
      // otherwise onSubmit will receive plain objects instead of File objects.
      return { values: data, errors: {} };
    },
    defaultValues: {
      category: "",
      title: "",
      description: "",
      files: [] // Initialize with an empty array
    },
  })

  async function onSubmit(values: FormValues) {
    console.log("Form submitted with values (containing File objects):", values);
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
    let uploaderName = user.displayName || 'Anonymous';
    let uploaderProfileImage: string | null = user.photoURL || null;
    let uploaderIsVerified = false;
    const userProfileRaw = localStorage.getItem('userProfile');
    if (userProfileRaw) {
      try {
        const userProfile = JSON.parse(userProfileRaw);
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
    uploaderIsVerified = true;
    // --- END TEMPORARY ---


    const fileDataForStorage = [];
    // values.files should contain the actual File objects here because the resolver returns the original data on success
    const filesToProcess: File[] = Array.isArray(values.files) ? values.files : [];

    if (filesToProcess.length === 0) {
        toast({
          variant: "destructive",
          title: "No Files",
          description: "Please select at least one file to upload.",
        });
        setIsLoading(false);
        return;
    }


    for (const file of filesToProcess) {
         // Double-check it's a File instance (or File-like enough)
         if (!(file instanceof File)) {
             if (typeof file === 'object' && file !== null && 'name' in file && 'size' in file && 'type' in file) {
                 console.warn("Item is not a File instance but looks like one, attempting to process:", file.name);
             } else {
                console.warn("Skipping non-File item during submission:", file);
                continue;
             }
        }
      try {
          console.log(`Processing file: ${file.name}`);
          const fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          fileDataForStorage.push({ url: fileDataUrl, type: file.type, name: file.name });
          console.log(`Successfully processed file: ${file.name}`);
      } catch (error) {
          console.error("Error reading file:", file.name, error);
          toast({
            variant: "destructive",
            title: "File Read Error",
            description: `Could not process file: ${file.name}`,
          });
          setIsLoading(false);
          return;
      }
    }


    const newNote = {
      id: Date.now().toString(),
      title: values.title,
      description: values.description,
      uploader: uploaderName,
      uploaderId: user.uid,
      uploaderProfileImage: uploaderProfileImage,
      uploaderIsVerified: uploaderIsVerified,
      timestamp: new Date().toISOString(),
      files: fileDataForStorage, // Array of { url, type, name }
      category: values.category,
    };

    // Load existing notes for the category or initialize an empty array
    let existingNotes = [];
    const storedNotes = localStorage.getItem(values.category);
    if (storedNotes) {
        try {
            const parsedNotes = JSON.parse(storedNotes);
            if (Array.isArray(parsedNotes)) {
                existingNotes = parsedNotes;
            } else {
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
        console.log(`Saving notes for category: ${values.category}`);
        localStorage.setItem(values.category, JSON.stringify(updatedNotes));
        console.log(`Successfully saved notes for category: ${values.category}`);
    } catch (error) {
        console.error(`Failed to save notes for category ${values.category} to localStorage.`, error);
        toast({
          variant: "destructive",
          title: "Save Error",
          description: "Could not save the note locally.",
        });
        setIsLoading(false);
        return;
    }


    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
    toast({
      title: "Success!",
      description: "Study material uploaded successfully.",
    })
    form.reset();
    setUploadedFiles([]); // Clear local state for display
    router.push(`/category/${encodeURIComponent(values.category)}`);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return; // No files selected

    console.log("Files selected:", files);
    // Get current files from the form state (these should be File objects)
    const currentFiles = form.getValues("files") || [];
    // Ensure currentFiles is an array of File objects
    const validCurrentFiles = Array.isArray(currentFiles) ? currentFiles.filter(f => f instanceof File) : [];

    // Combine and ensure no duplicates based on name and size (simple check)
    const combinedFilesMap = new Map<string, File>();
    [...validCurrentFiles, ...files].forEach(file => {
        combinedFilesMap.set(`${file.name}-${file.size}`, file);
    });
    const combinedFiles = Array.from(combinedFilesMap.values());

    console.log("Combined files:", combinedFiles);

    setUploadedFiles(combinedFiles); // Update state with the actual File objects for display
    // Update form's files array with the actual File objects and trigger validation
    form.setValue("files", combinedFiles, { shouldValidate: true });

    // Clear the input value to allow selecting the same file again if needed
    if (e.target) {
      e.target.value = '';
    }
  };


  // Function to remove a file
  const removeFile = (indexToRemove: number) => {
    // Get current File objects from the form state
    const currentFiles = form.getValues("files") || [];
    const validCurrentFiles = Array.isArray(currentFiles) ? currentFiles.filter(f => f instanceof File) : [];

    const updatedFiles = validCurrentFiles.filter((_, index) => index !== indexToRemove);
    console.log("Files after removal:", updatedFiles);
    setUploadedFiles(updatedFiles); // Update display state
    form.setValue("files", updatedFiles, { shouldValidate: true }); // Update form state
  };


  return (
    <div className="container mx-auto p-6 flex justify-center items-start pt-10">
      <Card className="w-full max-w-lg bg-card text-card-foreground shadow-lg neumorphic">
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
                      <Input placeholder="Give your notes a descriptive title." {...field} maxLength={200}/>
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
                        rows={4}
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
                render={({ fieldState }) => (
                  <FormItem>
                    {/* Clickable area for file input */}
                    <Label htmlFor="file-upload-input" className="cursor-pointer block"> {/* Make label block */}
                      <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-6 text-center hover:border-accent transition-colors">
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium text-foreground">
                            Click to upload or select files
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PDF, Word, PPT, Images allowed. Add multiple files.
                          </p>
                      </div>
                    </Label>
                    <FormControl>
                       {/* Hidden File Input */}
                       <Input
                          id="file-upload-input"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                       />
                    </FormControl>

                    {/* Display error message for the files field */}
                    <FormMessage />

                    {/* Display list of selected files */}
                     {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected Files:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded-md p-2">
                          {uploadedFiles.map((file, index) => (
                              <li key={`${file.name}-${index}`} className="flex items-center justify-between">
                                <span className="truncate mr-2 flex items-center">
                                  <FileIcon className="h-4 w-4 inline mr-1.5 flex-shrink-0" />
                                  {file.name} <span className="text-xs ml-1">({ (file.size / 1024).toFixed(1) } KB)</span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="text-destructive hover:text-destructive/80 h-auto p-1 ml-2 flex-shrink-0"
                                  aria-label={`Remove ${file.name}`}
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
              <CardFooter className="pt-4">
                <Button type="submit" className={cn("w-full bg-accent text-accent-foreground shadow-md hover:bg-accent/90 neumorphic", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading || uploadedFiles.length === 0}>
                  {isLoading ? "Uploading..." : "Upload Material"}
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
