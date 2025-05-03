
"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react'; // Added Suspense
import { useRouter, useParams } from 'next/navigation'; // Correct import for useParams
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import Link from "next/link";
import { File, Image as ImageIcon, Loader2 } from "lucide-react"; // Added Loader2
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge

// Interface for Note structure including uploader verification and profile image
interface Note {
  id: string; // Ensure ID is string
  title: string;
  description: string;
  uploader: string;
  uploaderId?: string; // Added uploaderId
  uploaderProfileImage?: string | null; // Added for profile image URL
  timestamp: string; // ISO string date
  files: Array<{ url: string; type: string; name?: string }>; // Added optional name
  category: string; // Category is essential here
  uploaderIsVerified?: boolean; // Added for verification status
}

const DESCRIPTION_PREVIEW_LIMIT = 100; // Limit for description preview

// Separate component to handle Suspense logic if needed, or keep within main component
function CategoryDetailContent() {
  const params = useParams(); // Use useParams hook
  const router = useRouter();


  // Directly access params.category, no need for Promise.resolve + React.use here
  const categoryParam = params?.category;


   const category = useMemo(() => {
     // Ensure categoryParam is correctly derived and is a string
     if (!categoryParam || typeof categoryParam !== 'string') {
       return '';
     }
     try {
       return decodeURIComponent(categoryParam);
     } catch (e) {
       console.error("Failed to decode category param:", e);
       return categoryParam; // Fallback
     }
   }, [categoryParam]);


  const [notes, setNotes] = useState<Note[]>([]); // Use Note interface
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    setIsLoading(true); // Start loading
    if (category) {
      const storedNotesRaw = localStorage.getItem(category);
      let foundNotes: Note[] = [];
      if (storedNotesRaw) {
        try {
          const parsedNotes = JSON.parse(storedNotesRaw);
          if (Array.isArray(parsedNotes)) {
             // Basic validation for each note
            foundNotes = parsedNotes.filter(note =>
                note && typeof note === 'object' && note.id && note.title && note.timestamp && note.files && note.uploader
            ).map(note => ({ ...note, category: category })) as Note[]; // Ensure category is set

          } else {
            console.warn(`Stored data for category ${category} is not an array.`);
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
        }
      }
       // Sort notes by timestamp (newest first)
      foundNotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotes(foundNotes);
    } else {
        setNotes([]); // Clear notes if category is invalid
    }
    setIsLoading(false); // Finish loading
  }, [category]);

  const renderFilePreview = (files: Array<{ url: string; type: string; name?: string }>) => {
    if (!files || files.length === 0) {
      return <p className="text-sm text-muted-foreground p-4 text-center">No preview available.</p>;
    }
    const firstFile = files[0];
    const fileType = firstFile.type || '';

    if (fileType.startsWith('image/')) {
      return (
        <div className="mt-2 relative aspect-video overflow-hidden rounded-md border bg-muted"> {/* Added bg-muted */}
          <img
            src={firstFile.url}
            alt={firstFile.name || "Note preview"} // Use file name if available
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" // Added hover effect
            loading="lazy"
            data-ai-hint="note preview image"
          />
          {files.length > 1 && (
            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-md backdrop-blur-sm">
              +{files.length - 1} more
            </span>
          )}
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return <div className="mt-2 flex items-center text-sm text-muted-foreground p-4"><File className="h-4 w-4 mr-1.5 flex-shrink-0"/> PDF Document {files.length > 1 ? `(+${files.length - 1})` : ''}</div>;
    } else {
      // Generic file icon and name
       const fileName = firstFile.name || `File ${files.length > 1 ? `(+${files.length - 1})` : ''}`;
      return <div className="mt-2 flex items-center text-sm text-muted-foreground p-4 truncate"><File className="h-4 w-4 mr-1.5 flex-shrink-0"/> {fileName}</div>;
    }
  };

   if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Loading notes...</span>
        </div>
      );
   }

  return (
    <>
      <h1 className="text-3xl font-semibold mb-6 text-center capitalize">{category} Notes</h1>
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map((note) => (
            // Link wrapping the card, includes category and note ID
            <Link key={note.id} href={`/view-note?id=${note.id}&category=${encodeURIComponent(category)}`} className="block group">
              <Card className="h-full neumorphic bg-card shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden rounded-lg">
                {/* File Preview Area */}
                {renderFilePreview(note.files)}

                {/* Content Area */}
                <CardHeader className="p-4 flex-shrink-0">
                  <CardTitle className="text-lg mb-1 line-clamp-2">{note.title}</CardTitle>
                  <CardDescription className="text-xs flex items-center flex-wrap mt-1"> {/* Allow wrapping */}
                   {/* Link wrapping Avatar and uploader name */}
                    <Link href={`/profile/${note.uploaderId}`} className="flex items-center group mr-1" onClick={(e) => e.stopPropagation()}> {/* Prevent card link navigation */}
                       <Avatar className="h-5 w-5 mr-1.5 flex-shrink-0 group-hover:opacity-80 transition-opacity">
                          <AvatarImage
                            src={note.uploaderProfileImage || `https://picsum.photos/seed/${note.uploader}/20/20`}
                            alt={note.uploader}
                            data-ai-hint="user avatar tiny"
                          />
                         <AvatarFallback className="text-xs group-hover:bg-muted/80 transition-colors">{note.uploader ? note.uploader.substring(0, 1).toUpperCase() : '?'}</AvatarFallback>
                       </Avatar>
                       <span className="font-medium group-hover:underline">{note.uploader}</span>
                       {note.uploaderIsVerified && <VerifiedBadge className="h-3.5 w-3.5 ml-0.5 flex-shrink-0" />}
                    </Link>
                    <span className="mx-1">·</span>
                    <span title={new Date(note.timestamp).toLocaleString()}> {/* Add title for exact time */}
                        {format(new Date(note.timestamp), 'MMM d, yyyy')}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <CardDescription className="text-sm line-clamp-3">
                    {note.description && note.description.length > DESCRIPTION_PREVIEW_LIMIT
                      ? `${note.description.substring(0, DESCRIPTION_PREVIEW_LIMIT)}...`
                      : note.description || 'No description provided.' // Handle empty description
                    }
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground mt-10">No notes found in the "{category}" category yet. Be the first to upload!</p>
      )}
    </>
  );
}


// Main component wrapping the content with Suspense
const CategoryDetailPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
       <Suspense fallback={
         <div className="flex justify-center items-center h-64">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           <span className="ml-2">Loading category...</span>
         </div>
       }>
         <CategoryDetailContent />
       </Suspense>
    </div>
  );
};


export default CategoryDetailPage;
