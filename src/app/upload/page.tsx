
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
import { File as FileIcon, UploadCloud } from "lucide-react"; // Added UploadCloud icon
import { auth } from '@/lib/firebase'; // Import auth
import { useAuthState } from 'react-firebase-hooks/auth'; // Import useAuthState

// Updated schema: Use z.instanceof(File) for robust validation
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
  // Use z.array(z.instanceof(File)) for multiple files
  files: z.array(z.instanceof(File))
    .min(1, { message: "Please upload at least one file." })
    // Ensure it's an array of File objects. This should work if the input provides File objects.
    // z.instanceof(File) might not work reliably across environments, let's use a custom check
    // .refine((files) => files.every(file => file instanceof File), {
    //   message: "Expected an array of files.", // Additional check
    // }),
    // More reliable check using typeof and name
    .refine((files) => files.every(file => typeof file === 'object' && file !== null && 'name' in file && 'size' in file && 'type' in file), {
       message: "Expected an array of file-like objects.",
     }),
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
      console.log("Validating data:", data);
       // Ensure files is always an array before validation
       // The custom refine in the schema should handle the check, but this is a safeguard
      const dataToValidate = {
         ...data,
         files: Array.isArray(data.files) ? data.files.filter(f => typeof f === 'object' && f !== null) : [],
      };

      const result = formSchema.safeParse(dataToValidate);
      if (!result.success) {
        console.error("Validation failed:", result.error.flatten().fieldErrors);
        // Log the raw error object for more details if flatten doesn't work as expected
        console.error("Raw Zod error:", result.error);
        return { values: {}, errors: result.error.flatten().fieldErrors };
      }
       console.log("Validation successful:", result.data);
      return { values: result.data, errors: {} };
    },
    defaultValues: {
      category: "",
      title: "",
      description: "",
      files: [] // Initialize with an empty array
    },
  })

  async function onSubmit(values: FormValues) {
    console.log("Form submitted with values:", values);
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
    // If validation passed, values.files should already be File[]
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
        // Double-check if it's a File object before processing
        // Using a more robust check since instanceof might fail
         if (!(typeof file === 'object' && file !== null && 'name' in file && 'size' in file && 'type' in file)) {
            console.warn("Skipping non-File item:", file);
            continue;
        }
      try {
          console.log(`Processing file: ${file.name}`);
          const fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          fileData.push({ url: fileDataUrl, type: file.type, name: file.name }); // Include file name
          console.log(`Successfully processed file: ${file.name}`);
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
        setIsLoading(false); // Ensure loading state is reset on save error
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
    console.log("Files selected:", files);
    // Allow adding more files to the existing selection
    const currentFiles = form.getValues("files") || [];
    // Filter out any non-File objects just in case
    const currentValidFiles = Array.isArray(currentFiles) ? currentFiles.filter(f => typeof f === 'object' && f !== null) : [];

    const combinedFiles = [...currentValidFiles, ...files]; // Combine
    console.log("Combined files:", combinedFiles);

    setUploadedFiles(combinedFiles); // Update state with the combined list
    // Update form's files array and trigger validation
    form.setValue("files", combinedFiles, { shouldValidate: true });

    // Clear the input value to allow selecting the same file again if needed
    if (e.target) {
      e.target.value = '';
    }
  };


  // Function to remove a file
  const removeFile = (indexToRemove: number) => {
    const currentFiles = form.getValues("files") || [];
    const updatedFiles = Array.isArray(currentFiles) ? currentFiles.filter((_, index) => index !== indexToRemove) : [];
    console.log("Files after removal:", updatedFiles);
    setUploadedFiles(updatedFiles); // Update state
    form.setValue("files", updatedFiles, { shouldValidate: true }); // Update form and trigger validation
  };


  return (
    <div className="container mx-auto p-6 flex justify-center items-start pt-10"> {/* Added padding-top */}
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
                render={({ fieldState }) => (
                  <FormItem>
                    {/* Wrap the label and description in a clickable label */}
                    <Label htmlFor="file-upload-input" className="cursor-pointer">
                      <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-6 text-center hover:border-accent transition-colors">
                          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm font-medium text-foreground">
                            Click to upload files
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            PDF, Word, PPT, Images allowed. Add multiple files.
                          </p>
                      </div>
                    </Label>
                    <FormControl>
                      {/* Hidden input remains the same */}
                       <Input
                          id="file-upload-input" // ID matches the label's htmlFor
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden" // Keep input hidden
                          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" // Specify accepted types
                       />
                    </FormControl>
                    {/* Remove the separate "Add Files" button */}
                    {/* <FormDescription>
                      Supported files: PDF, Word, PPT, Images. You can add multiple files.
                    </FormDescription> */}
                    {/* Display error message if validation fails */}
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}

                    {/* Display list of uploaded files with remove button */}
                     {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium">Selected Files:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded-md p-2">
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="truncate mr-2 flex items-center">
                                <FileIcon className="h-4 w-4 inline mr-1.5 flex-shrink-0" />
                                {file.name} <span className="text-xs ml-1">({ (file.size / 1024).toFixed(1) } KB)</span>
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="text-destructive hover:text-destructive/80 h-auto p-1 ml-2 flex-shrink-0" // Added margin
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
              {/* Moved Button inside the form element */}
              <CardFooter className="pt-4"> {/* Add padding top */}
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
