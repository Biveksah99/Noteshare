
"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import {ChevronLeft, ChevronRight, Download, Expand, X} from "lucide-react"; // Import X icon
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from "next/link"; // Import Link

const DESCRIPTION_CHAR_LIMIT = 150; // Define the character limit for the description preview

const ViewNotePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract parameters directly using searchParams.get()
  const noteId = searchParams?.get('id');
  const category = searchParams?.get('category');
  const fileIndexParam = searchParams?.get('fileIndex');

  const [note, setNote] = useState<any>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // State for description expansion

  useEffect(() => {
    if (category && noteId) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          const notes = JSON.parse(storedNotes);
          const foundNote = notes.find((n: any) => n.id === parseInt(noteId as string));
          if (foundNote) {
            setNote(foundNote);
            const initialFileIndex = fileIndexParam ? parseInt(fileIndexParam, 10) : 0;
             // Ensure the index is within bounds
             const validIndex = Math.max(0, Math.min(initialFileIndex, (foundNote.files?.length || 1) - 1));
            setCurrentFileIndex(validIndex);
          } else {
            // Note not found in this category, redirect
            console.warn(`Note with ID ${noteId} not found in category ${category}. Redirecting.`);
            router.push(`/categories`); // Or a more appropriate error page/redirect
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
          // Redirect on error
           router.push(`/categories`);
        }
      } else {
         // No notes found for this category, redirect
         console.warn(`No notes found for category ${category}. Redirecting.`);
         router.push(`/categories`);
      }
    } else {
      // Missing category or noteId, redirect to a sensible default
      console.warn(`Missing category or noteId in query params. Redirecting.`);
      router.push('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, noteId, fileIndexParam]); // Removed router from dependencies as it can cause loops if not memoized

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
     // Use replace to avoid polluting browser history with intermediate file indices
     router.replace(`/view-note?id=${noteId}&category=${category}&fileIndex=${newIndex}`, { scroll: false });
  };


  const handlePreviewClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  const getFileExtension = (mimeType: string | undefined): string => {
    if (!mimeType) return 'file'; // Default extension if type is unknown
    // Simple mapping for common types, can be expanded
    const mimeMap: {[key: string]: string} = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    };
    const simpleType = mimeType.split(';')[0]; // Ignore parameters like charset
    return mimeMap[simpleType] || simpleType.split('/')[1] || 'file'; // Fallback logic
  };


  if (!note) {
    // Added a loading state for better UX
    return <div className="container mx-auto p-6 text-center">Loading note details...</div>;
  }

  // Ensure note.files exists and has items before accessing
  const file = note.files && note.files.length > currentFileIndex ? note.files[currentFileIndex] : null;
  // Generate a more robust filename, handling potential missing titles or types
  const baseFileName = note.title ? note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `note_${note.id}`;
  const fileExtension = file ? getFileExtension(file.type) : 'bin'; // Use '.bin' for unknown binary
  const fileName = `${baseFileName}_${currentFileIndex + 1}.${fileExtension}`;

  const description = note.description || 'No description provided.';
  const isLongDescription = description.length > DESCRIPTION_CHAR_LIMIT;
  const displayDescription = isDescriptionExpanded || !isLongDescription
    ? description
    : `${description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`;


  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4 neumorphic">
        <CardHeader className="flex flex-row items-center">
          <Avatar className="mr-4 h-8 w-8">
            {/* Use a placeholder or logic to get actual user avatar */}
            <AvatarImage src="https://picsum.photos/id/1/32/32" alt={note.uploader || 'Uploader'}/>
            <AvatarFallback>{note.uploader ? note.uploader.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{note.title || 'Untitled Note'}</CardTitle> {/* Fallback title */}
            <CardDescription>
              Uploaded by {note.uploader || 'Unknown User'} on {format(new Date(note.timestamp), 'yyyy-MM-dd HH:mm')} {/* Fallback uploader */}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Use whitespace-pre-wrap to respect newlines and spacing in description */}
          {/* Apply serif font for a different style */}
          <CardDescription className="mb-4 whitespace-pre-wrap font-serif text-base">
            {displayDescription}
            {isLongDescription && !isDescriptionExpanded && (
              <Button
                variant="link"
                className="p-0 h-auto ml-1 text-accent font-semibold"
                onClick={() => setIsDescriptionExpanded(true)}
              >
                See more
              </Button>
            )}
             {isLongDescription && isDescriptionExpanded && (
              <Button
                variant="link"
                className="p-0 h-auto ml-1 text-accent font-semibold"
                onClick={() => setIsDescriptionExpanded(false)}
              >
                See less
              </Button>
            )}
          </CardDescription>

          {/* File Display Area */}
          {note.files && note.files.length > 0 ? (
            <div className="mb-4 relative">
              {file ? ( // Check if file exists at the current index
                <>
                  {file.type && file.type.startsWith('image/') ? (
                    // Image Display
                    <div className="flex justify-center items-center relative group bg-muted rounded-md overflow-hidden border">
                      <img
                        src={file.url}
                        alt={`${note.title || 'Note'} - File ${currentFileIndex + 1}`}
                        className="max-w-full max-h-[60vh] h-auto object-contain cursor-pointer" // Constrained height for page layout
                        onClick={() => handlePreviewClick(file.url)} // Open preview on image click
                      />
                      {/* Expand button on hover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handlePreviewClick(file.url)}
                        title="Expand Image"
                      >
                        <Expand className="h-5 w-5" />
                      </Button>
                       {/* Download button for image (moved to preview dialog) */}
                    </div>
                  ) : file.type && file.type === 'application/pdf' ? (
                     // PDF Display
                    <div className="flex justify-center relative border rounded-md overflow-hidden">
                       <embed
                         src={file.url}
                         type="application/pdf"
                         className="w-full h-[70vh]" // Fixed height for PDF embed
                       />
                       {/* Download button for PDF */}
                       <a
                         href={file.url}
                         download={fileName}
                         className="absolute top-2 right-2 z-10"
                       >
                         <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/75" title="Download PDF">
                           <Download className="h-5 w-5" />
                         </Button>
                       </a>
                    </div>
                  ) : (
                     // Fallback for other file types
                    <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                      <p className="mb-3 text-lg text-muted-foreground">Cannot preview this file type directly.</p>
                      <p className="mb-4 text-sm text-muted-foreground">File Type: {file.type || 'Unknown'}</p>
                      {/* Download link */}
                      <a
                        href={file.url}
                        download={fileName}
                        target="_blank" // Open in new tab might be safer for unknown types
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="inline-flex items-center gap-2">
                           <Download className="h-4 w-4" /> Download File ({fileName})
                        </Button>
                      </a>
                    </div>
                  )}
                </>
              ) : (
                 // Case where file at current index is somehow null/undefined (shouldn't happen with validation)
                <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                  <p className="text-muted-foreground">File preview not available.</p>
                </div>
              )}

              {/* File Navigation Buttons - only show if there are multiple files */}
              {note.files.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handlePrevClick} variant="outline" size="icon" className="neumorphic" aria-label="Previous File">
                    <ChevronLeft/>
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">{currentFileIndex + 1} / {note.files.length}</span>
                  <Button onClick={handleNextClick} variant="outline" size="icon" className="neumorphic" aria-label="Next File">
                    <ChevronRight/>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Message when no files are attached
             <p className="text-muted-foreground text-center p-4 border rounded-md bg-muted">No files attached to this note.</p>
          )}
        </CardContent>
      </Card>

       {/* Image Preview Dialog (Modal) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 flex items-center justify-center bg-background/90 backdrop-blur-sm border-none shadow-none overflow-hidden">
           {/* Explicit Close Button */}
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-foreground bg-background/50 hover:bg-background/75 rounded-full z-50" // Changed styling slightly
            onClick={() => setIsPreviewOpen(false)}
            title="Close Preview"
            aria-label="Close image preview"
          >
             <X className="h-6 w-6"/> {/* Use X icon */}
          </Button>

          {/* Image Container */}
          {previewImageUrl && (
             // Added container to center the image within the dialog content area
            <div className="relative w-full h-full flex items-center justify-center p-4"> {/* Added padding */}
              <img
                src={previewImageUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain block" // Ensures image scales down correctly
                style={{ maxWidth: 'calc(95vw - 4rem)', maxHeight: 'calc(95vh - 4rem)' }} // Explicit max size with padding considered
              />
               {/* Download Button - Positioned at bottom right */}
               <a
                 href={previewImageUrl}
                 download={fileName} // Use the derived filename
                 className="absolute bottom-4 right-4 z-50" // Ensure button is on top
               >
                 <Button variant="default" size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary" title="Download Image">
                   <Download className="h-6 w-6" />
                 </Button>
               </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewNotePage;
