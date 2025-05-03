
"use client";

import React, {useEffect, useState, useMemo, Suspense} from 'react'; // Added Suspense
import {useRouter, useSearchParams, useParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import {ChevronLeft, ChevronRight, Download, Expand, X, Loader2 } from "lucide-react"; // Added Loader2
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Link from "next/link";

const DESCRIPTION_CHAR_LIMIT = 150; // Define the character limit for the description preview

interface NoteFile {
    url: string;
    type: string;
    name?: string; // Added optional name
}

// Updated Note interface
interface Note {
    id: string; // Ensure ID is string
    title: string;
    description: string;
    uploader: string;
    uploaderProfileImage?: string | null; // Added for profile image URL
    timestamp: string; // ISO string date
    files: NoteFile[];
    category: string; // Make category mandatory
    uploaderIsVerified?: boolean; // Added for verification status
}

// Separate component to handle fetching and display logic
function ViewNoteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

   // Extract parameters using React.use() within Suspense boundary
   const noteId = React.use(searchParams?.get('id'));
   const categoryParam = React.use(searchParams?.get('category'));
   const fileIndexParam = React.use(searchParams?.get('fileIndex'));


  const [note, setNote] = useState<Note | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Decode category once, using useMemo
  const category = useMemo(() => {
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

  useEffect(() => {
    setIsLoading(true); // Start loading
    if (category && noteId) {
      const storedNotesRaw = localStorage.getItem(category);
      if (storedNotesRaw) {
        try {
          const notes: Note[] = JSON.parse(storedNotesRaw);
          const foundNote = notes.find((n) => n.id.toString() === noteId.toString()); // Compare as strings

          if (foundNote) {
             // Ensure category is part of the found note
             const noteWithCategory = { ...foundNote, category: category };
             setNote(noteWithCategory); // Set the full note object

             // --- TEMPORARY FOR TESTING BLUE TICK ---
             // Temporarily set verified status if not present in data
             if (noteWithCategory.uploaderIsVerified === undefined) {
                noteWithCategory.uploaderIsVerified = true; // Force verified for testing
             }
             // --- REMOVE THIS LINE AFTER TESTING ---


            const initialFileIndex = fileIndexParam ? parseInt(fileIndexParam as string, 10) : 0;
            const validIndex = Math.max(0, Math.min(initialFileIndex, (noteWithCategory.files?.length || 1) - 1));
            setCurrentFileIndex(validIndex);
          } else {
            console.warn(`Note with ID ${noteId} not found in category ${category}. Redirecting.`);
            router.push(`/categories`); // Redirect if note not found
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
           router.push(`/categories`); // Redirect on error
        }
      } else {
         console.warn(`No notes found for category ${category}. Redirecting.`);
         router.push(`/categories`); // Redirect if category storage is empty
      }
    } else if (noteId && !category) {
        console.warn(`Missing category in query params for note ID ${noteId}. Redirecting.`);
        router.push('/'); // Redirect if category is missing
    } else if (!noteId) {
        console.warn(`Missing noteId in query params. Redirecting.`);
        router.push('/'); // Redirect if noteId is missing
    }
    setIsLoading(false); // Finish loading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, noteId, fileIndexParam]); // Keep router out of dependencies

  const handlePrevClick = () => {
    setCurrentFileIndex((prevIndex) => {
      const newIndex = prevIndex > 0 ? prevIndex - 1 : (note?.files?.length || 1) - 1;
      updateUrl(newIndex);
      return newIndex;
    });
  };

  const handleNextClick = () => {
    setCurrentFileIndex((prevIndex) => {
        const newIndex = prevIndex < (note?.files?.length || 1) - 1 ? prevIndex + 1 : 0;
        updateUrl(newIndex);
        return newIndex;
    });
  };

  const updateUrl = (newIndex: number) => {
     const encodedCategory = typeof category === 'string' ? encodeURIComponent(category) : '';
     router.replace(`/view-note?id=${noteId}&category=${encodedCategory}&fileIndex=${newIndex}`, { scroll: false });
  };


  const handlePreviewClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  const getFileExtension = (mimeType: string | undefined): string => {
    if (!mimeType) return 'bin'; // Default extension
    const mimeMap: {[key: string]: string} = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'text/plain': 'txt', // Added text files
    };
    const simpleType = mimeType.split(';')[0];
    return mimeMap[simpleType] || simpleType.split('/')[1] || 'file';
  };

  // Loading state display
   if (isLoading || !note) { // Check isLoading and if note is still null
       return (
         <div className="flex justify-center items-center h-screen">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
           <span className="ml-2">Loading note details...</span>
         </div>
       );
   }

  const currentFile = note.files && note.files.length > currentFileIndex ? note.files[currentFileIndex] : null;
  // Handle cases where file might be null before accessing properties
  const baseFileName = currentFile?.name || (note.title ? note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `note_${note.id}`);
  const fileExtension = currentFile ? getFileExtension(currentFile.type) : 'bin';
  const fileName = `${baseFileName}.${fileExtension}`;


  const description = note.description || 'No description provided.';
  const isLongDescription = description.length > DESCRIPTION_CHAR_LIMIT;
  const displayDescription = isDescriptionExpanded || !isLongDescription
    ? description
    : `${description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`;


  return (
    <div className="container mx-auto p-4 md:p-6"> {/* Adjusted padding */}
      <Card className="mb-4 neumorphic bg-card shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-start p-4 border-b bg-muted/30"> {/* items-start */}
          <Avatar className="mr-4 h-10 w-10 flex-shrink-0 mt-1"> {/* Added margin-top */}
             {/* Use uploaderProfileImage if available */}
             <AvatarImage
                src={note.uploaderProfileImage || `https://picsum.photos/seed/${note.uploader}/40/40`}
                alt={note.uploader || 'Uploader'}
                data-ai-hint="user avatar"
              />
            <AvatarFallback>{note.uploader ? note.uploader.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate">{note.title || 'Untitled Note'}</CardTitle>
            <CardDescription className="text-xs flex items-center flex-wrap mt-1"> {/* Added mt-1 */}
              Uploaded by&nbsp;
              <span className="font-medium mr-0.5">{note.uploader || 'Unknown User'}</span>
               {/* Adjusted badge size and margin */}
               {note.uploaderIsVerified && <VerifiedBadge className="h-3.5 w-3.5 ml-0.5 flex-shrink-0" />}
              <span className="mx-1">&middot;</span>
              {format(new Date(note.timestamp), 'MMM d, yyyy, p')}
               {/* Link back to category */}
               <span className="mx-1">&middot;</span>
               <Link href={`/category/${encodeURIComponent(note.category)}`} className="text-accent hover:underline capitalize font-medium">
                 {note.category}
               </Link>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Description Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            {/* Added font styles for description */}
            <p className="whitespace-pre-wrap font-serif text-base font-bold text-foreground/80">
              {displayDescription}
            </p>
            {isLongDescription && (
               <Button
                 variant="link"
                 className="p-0 h-auto text-accent font-semibold text-sm hover:underline" // Added hover effect
                 onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
               >
                 {isDescriptionExpanded ? "See less" : "See more"}
               </Button>
             )}
          </div>

          {/* File Display Area */}
          {note.files && note.files.length > 0 ? (
            <div className="mb-4 relative">
              {currentFile ? (
                <>
                  {currentFile.type && currentFile.type.startsWith('image/') ? (
                    <div className="flex justify-center items-center relative group bg-muted rounded-md overflow-hidden border aspect-video">
                      <img
                        src={currentFile.url}
                        alt={fileName} // Use generated filename
                        className="max-w-full max-h-[70vh] h-auto object-contain cursor-pointer" // Limit height
                        onClick={() => handlePreviewClick(currentFile.url)}
                        data-ai-hint="note image content"
                        loading="lazy"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handlePreviewClick(currentFile.url)}
                        title="Expand Image"
                      >
                        <Expand className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : currentFile.type && currentFile.type === 'application/pdf' ? (
                    <div className="flex justify-center relative border rounded-md overflow-hidden h-[70vh] bg-muted">
                       <iframe
                         src={`${currentFile.url}#toolbar=0&navpanes=0&scrollbar=0`} // Basic PDF viewer params
                         title={fileName}
                         className="w-full h-full border-none"
                         // sandbox="allow-scripts allow-same-origin" // Consider security implications
                       />
                       <a
                         href={currentFile.url}
                         download={fileName}
                         className="absolute top-2 right-2 z-10"
                       >
                         <Button variant="secondary" size="icon" className="bg-black/60 text-white hover:bg-black/80 rounded-full shadow-md" title="Download PDF">
                           <Download className="h-5 w-5" />
                         </Button>
                       </a>
                    </div>
                  ) : (
                    // Generic file display with download button
                    <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                      <p className="mb-3 text-lg text-muted-foreground">Cannot preview this file type directly.</p>
                      <p className="mb-1 text-sm text-muted-foreground">File: {fileName}</p>
                      <p className="mb-4 text-xs text-muted-foreground">Type: {currentFile.type || 'Unknown'}</p>
                      <a
                        href={currentFile.url}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="inline-flex items-center gap-2 bg-background hover:bg-secondary">
                           <Download className="h-4 w-4" /> Download File
                        </Button>
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                  <p className="text-muted-foreground">File preview not available.</p>
                </div>
              )}

              {/* File Navigation Buttons */}
              {note.files.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handlePrevClick} variant="outline" size="icon" className="neumorphic rounded-full disabled:opacity-50" aria-label="Previous File" disabled={note.files.length <= 1}>
                    <ChevronLeft className="h-5 w-5"/> {/* Slightly larger icon */}
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums font-medium">{currentFileIndex + 1} / {note.files.length}</span>
                  <Button onClick={handleNextClick} variant="outline" size="icon" className="neumorphic rounded-full disabled:opacity-50" aria-label="Next File" disabled={note.files.length <= 1}>
                    <ChevronRight className="h-5 w-5"/> {/* Slightly larger icon */}
                  </Button>
                </div>
              )}
            </div>
          ) : (
             <p className="text-muted-foreground text-center p-4 border rounded-md bg-muted">No files attached to this note.</p>
          )}
        </CardContent>
      </Card>

       {/* Image Preview Dialog (Modal) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 flex items-center justify-center bg-black/80 border-none shadow-none overflow-hidden"> {/* Semi-transparent background */}
            {/* Custom Close Button */}
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/75 rounded-full z-50 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50" // Added focus ring
            onClick={() => setIsPreviewOpen(false)}
            title="Close Preview"
            aria-label="Close image preview"
          >
             <X className="h-6 w-6"/>
          </Button>

          {previewImageUrl && currentFile && ( // Ensure currentFile exists for download name
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={previewImageUrl}
                alt="Preview"
                className="block max-w-full max-h-full object-contain"
                // Style directly for max dimensions based on viewport
                style={{ maxWidth: 'calc(95vw - 3rem)', maxHeight: 'calc(95vh - 3rem)' }} // Adjusted padding calculation
                data-ai-hint="preview image fullscreen"
              />
               {/* Download Button - Positioned at bottom right */}
               <a
                 href={previewImageUrl}
                 // Use the specific file's name for download
                 download={fileName}
                 className="absolute bottom-4 right-4 z-50"
                 target="_blank" // Optional: Open in new tab before download
                 rel="noopener noreferrer"
               >
                 <Button variant="default" size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary rounded-full shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50" title="Download Image"> {/* Added focus ring */}
                   <Download className="h-6 w-6" />
                 </Button>
               </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main component wrapping content with Suspense
const ViewNotePage = () => {
  return (
    // Wrap the component that uses React.use() in Suspense
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading...</span>
      </div>
    }>
      <ViewNoteContent />
    </Suspense>
  );
};


export default ViewNotePage;
