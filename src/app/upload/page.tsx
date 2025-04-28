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

const formSchema = z.object({
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  file: z.any()
})

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter()
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    // Load categories from local storage on component mount
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      category: "",
      title: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    // Convert file to data URL
    const file = values.file;
    let fileDataUrl = null;
    if (file) {
      fileDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const newNote = {
      id: Date.now(),
      title: values.title,
      description: values.description,
      uploader: 'CurrentUser', // Replace with actual user info
      timestamp: new Date().toISOString(),
      file: fileDataUrl, // Store the data URL
      type: file?.type, // Store the MIME type
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

  return (
    <div className="flex justify-center items-center h-screen bg-background">
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
                      <Input placeholder="Give your notes a descriptive title." {...field} />
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
                name="file"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        onChange={(e) => {
                          field.onChange(e.target.files?.[0])
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Supported files: PDF, Word, PPT, Images
                    </FormDescription>
                    <FormMessage />
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
