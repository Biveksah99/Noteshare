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
import { File } from "lucide-react";

const formSchema = z.object({
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }).max(200, {message: "Title must be at most 40 words."}),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  files: z.array(z.any()).min(1, {message: "Please upload at least one file."})
})

type FormValues = z.infer<typeof formSchema>;

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // State to hold uploaded files

  useEffect(() => {
    // Load categories from local storage on component mount
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }
  }, []);

  const form = useForm<FormValues>({
    defaultValues: {
      category: "",
      title: "",
      description: "",
      files: []
    },
  })

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    const fileDataUrls = [];
    for (const file of values.files) {
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      fileDataUrls.push({ url: fileDataUrl, type: file.type });
    }

    const newNote = {
      id: Date.now(),
      title: values.title,
      description: values.description,
      uploader: 'CurrentUser', // Replace with actual user info
      timestamp: new Date().toISOString(),
      files: fileDataUrls,
    };

    // Load existing notes for the category or initialize an empty array
    const storedNotes = localStorage.getItem(values.category);
    const existingNotes = storedNotes ? JSON.parse(storedNotes) : [];

    // Add the new note to the existing notes
    const updatedNotes = [...existingNotes, newNote];

    // Store the updated notes back in local storage
    localStorage.setItem(values.category, JSON.stringify(updatedNotes));

    // Simulate a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast({
      title: "Success!",
      description: "Study material uploaded successfully.",
    })
    router.push('/');
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]); // Append new files to the existing state
    form.setValue("files", [...uploadedFiles, ...files]); // Update form's files array
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-[500px] bg-card text-card-foreground shadow-lg">
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
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
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
                      <Input placeholder="Give your notes a descriptive title." {...field} maxLength={200} />
                    </FormControl>
                    <FormDescription>
                      Give your notes a descriptive title.
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Files</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileChange} // Use the custom handler
                      />
                    </FormControl>
                    <FormDescription>
                      Supported files: PDF, Word, PPT, Images
                    </FormDescription>
                    <FormMessage />
                     {uploadedFiles.length > 0 && (
                      <div className="mt-2">
                        Uploaded Files:
                        <ul>
                          {uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <File className="h-4 w-4" />
                              <span>{file.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <CardFooter>
                <Button type="submit" className={cn("ml-auto bg-accent text-accent-foreground", isLoading && "cursor-not-allowed opacity-50")} disabled={isLoading}>
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
