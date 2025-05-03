
"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import {ChevronLeft, ChevronRight, Download, Expand, X, CheckCircle2 } from "lucide-react"; // Import X and CheckCircle2 icons
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Removed unused Footer, Header, Title
import Link from "next/link";

const DESCRIPTION_CHAR_LIMIT = 150; // Define the character limit for the description preview

interface NoteFile {
    url: string;
    type: string;
}

interface Note {
    id: number | string;
    title: string;
    description: string;
    uploader: string;
    timestamp: string; // ISO string date
    files: NoteFile[];
    category?: string; // Optional category info if needed
    uploaderIsVerified?: boolean; // Added for verification status
}

const ViewNotePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract parameters directly using searchParams.get()
  const noteId = searchParams?.get('id');
  const category = searchParams?.get('category');
  const fileIndexParam = searchParams?.get('fileIndex');

  const [note, setNote] = useState<Note | null>(null); // Use Note interface
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // State for description expansion

  useEffect(() => {
    if (category && noteId) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          const notes: Note[] = JSON.parse(storedNotes);
          const foundNote = notes.find((n: any) => n.id.toString() === noteId); // Compare as strings

          if (foundNote) {
             // Fetch uploader verification status from userProfile (if exists)
             const userProfileRaw = localStorage.getItem('userProfile');
             let uploaderIsVerified = false;
             if(userProfileRaw) {
               try {
                 const userProfile = JSON.parse(userProfileRaw);
                 // Assuming uploader name matches fullName in profile
                 if (userProfile.fullName === foundNote.uploader) {
                   uploaderIsVerified = userProfile.isVerified || false;
                 }
               } catch (profileError) {
                 console.warn("Could not parse user profile for verification status", profileError);
               }
             }
             setNote({ ...foundNote, uploaderIsVerified }); // Add verification status to note state

            const initialFileIndex = fileIndexParam ? parseInt(fileIndexParam, 10) : 0;
             // Ensure the index is within bounds
             const validIndex = Math.max(0, Math.min(initialFileIndex, (foundNote.files?.length || 1) - 1));
            setCurrentFileIndex(validIndex);
          } else {
            console.warn(`Note with ID ${noteId} not found in category ${category}. Redirecting.`);
            router.push(`/categories`);
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
           router.push(`/categories`);
        }
      } else {
         console.warn(`No notes found for category ${category}. Redirecting.`);
         router.push(`/categories`);
      }
    } else {
      console.warn(`Missing category or noteId in query params. Redirecting.`);
      router.push('/');
    }
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
     router.replace(`/view-note?id=${noteId}&category=${category}&fileIndex=${newIndex}`, { scroll: false });
  };


  const handlePreviewClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  const getFileExtension = (mimeType: string | undefined): string => {
    if (!mimeType) return 'file';
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
    const simpleType = mimeType.split(';')[0];
    return mimeMap[simpleType] || simpleType.split('/')[1] || 'file';
  };


  if (!note) {
    return <div className="container mx-auto p-6 text-center">Loading note details...</div>;
  }

  const file = note.files && note.files.length > currentFileIndex ? note.files[currentFileIndex] : null;
  const baseFileName = note.title ? note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : `note_${note.id}`;
  const fileExtension = file ? getFileExtension(file.type) : 'bin';
  const fileName = `${baseFileName}_${currentFileIndex + 1}.${fileExtension}`;

  const description = note.description || 'No description provided.';
  const isLongDescription = description.length > DESCRIPTION_CHAR_LIMIT;
  const displayDescription = isDescriptionExpanded || !isLongDescription
    ? description
    : `${description.substring(0, DESCRIPTION_CHAR_LIMIT)}...`;


  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4 neumorphic bg-card shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="flex flex-row items-center p-4 border-b bg-muted/30">
          <Avatar className="mr-4 h-10 w-10">
            <AvatarImage src={`https://picsum.photos/seed/${note.uploader}/40/40`} alt={note.uploader || 'Uploader'} data-ai-hint="user avatar"/>
            <AvatarFallback>{note.uploader ? note.uploader.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">{note.title || 'Untitled Note'}</CardTitle>
            <CardDescription className="text-xs flex items-center">
              Uploaded by {note.uploader || 'Unknown User'}
              {note.uploaderIsVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-blue-500" />} {/* Blue tick */}
              {' on '} {format(new Date(note.timestamp), 'PPp')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Description Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-wrap font-serif text-base font-bold text-foreground/80">
              {displayDescription}
            </p>
            {isLongDescription && (
               <Button
                 variant="link"
                 className="p-0 h-auto text-accent font-semibold text-sm"
                 onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
               >
                 {isDescriptionExpanded ? "See less" : "See more"}
               </Button>
             )}
          </div>

          {/* File Display Area */}
          {note.files && note.files.length > 0 ? (
            <div className="mb-4 relative">
              {file ? (
                <>
                  {file.type && file.type.startsWith('image/') ? (
                    <div className="flex justify-center items-center relative group bg-muted rounded-md overflow-hidden border aspect-video">
                      <img
                        src={file.url}
                        alt={`${note.title || 'Note'} - File ${currentFileIndex + 1}`}
                        className="max-w-full max-h-full h-auto object-contain cursor-pointer"
                        onClick={() => handlePreviewClick(file.url)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handlePreviewClick(file.url)}
                        title="Expand Image"
                      >
                        <Expand className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : file.type && file.type === 'application/pdf' ? (
                    <div className="flex justify-center relative border rounded-md overflow-hidden h-[70vh] bg-muted">
                       <iframe
                         src={file.url}
                         title={`${note.title || 'Note'} - PDF ${currentFileIndex + 1}`}
                         className="w-full h-full border-none"
                       />
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
                    <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                      <p className="mb-3 text-lg text-muted-foreground">Cannot preview this file type directly.</p>
                      <p className="mb-4 text-sm text-muted-foreground">File Type: {file.type || 'Unknown'}</p>
                      <a
                        href={file.url}
                        download={fileName}
                        target="_blank"
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
                <div className="flex flex-col items-center justify-center p-6 border rounded-md bg-muted min-h-[200px]">
                  <p className="text-muted-foreground">File preview not available.</p>
                </div>
              )}

              {/* File Navigation Buttons */}
              {note.files.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handlePrevClick} variant="outline" size="icon" className="neumorphic rounded-full" aria-label="Previous File">
                    <ChevronLeft/>
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums font-medium">{currentFileIndex + 1} / {note.files.length}</span>
                  <Button onClick={handleNextClick} variant="outline" size="icon" className="neumorphic rounded-full" aria-label="Next File">
                    <ChevronRight/>
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
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 flex items-center justify-center bg-transparent border-none shadow-none overflow-hidden">
            {/* Custom Close Button */}
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/75 rounded-full z-50"
            onClick={() => setIsPreviewOpen(false)}
            title="Close Preview"
            aria-label="Close image preview"
          >
             <X className="h-6 w-6"/>
          </Button>

          {previewImageUrl && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={previewImageUrl}
                alt="Preview"
                className="block max-w-full max-h-full object-contain" // Use max-w/max-h for contain effect
                style={{ maxWidth: 'calc(95vw - 4rem)', maxHeight: 'calc(95vh - 4rem)' }}
              />
               {/* Download Button - Positioned at bottom right */}
               <a
                 href={previewImageUrl}
                 download={fileName}
                 className="absolute bottom-4 right-4 z-50"
               >
                 <Button variant="default" size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary rounded-full shadow-lg" title="Download Image">
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

    