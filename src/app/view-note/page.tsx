
"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import {ChevronLeft, ChevronRight, Download, Expand} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from "next/link"; // Import Link

const ViewNotePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract parameters using React.use()
  const noteId = React.useMemo(() => searchParams.get('id'), [searchParams]);
  const category = React.useMemo(() => searchParams.get('category'), [searchParams]);
  const fileIndexParam = React.useMemo(() => searchParams.get('fileIndex'), [searchParams]);

  const [note, setNote] = useState<any>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
            router.push(`/category/${category}`);
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
        }
      } else {
        router.push(`/category/${category}`);
      }
    } else {
      router.push('/');
    }
  }, [category, noteId, router, fileIndexParam]);

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
    const parts = mimeType.split('/');
    return parts.length > 1 ? parts[1] : 'file';
  };

  if (!note) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  const file = note.files?.[currentFileIndex];
  const fileName = `${note.title}_${currentFileIndex + 1}.${getFileExtension(file?.type)}`;

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4 neumorphic">
        <CardHeader className="flex flex-row items-center">
          <Avatar className="mr-4 h-8 w-8">
            {/* Use a placeholder or logic to get actual user avatar */}
            <AvatarImage src="https://picsum.photos/id/1/32/32" alt={note.uploader}/>
            <AvatarFallback>{note.uploader ? note.uploader.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{note.title}</CardTitle>
            <CardDescription>
              Uploaded by {note.uploader} on {format(new Date(note.timestamp), 'yyyy-MM-dd HH:mm')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 whitespace-pre-wrap">{note.description}</CardDescription>
          {note.files && note.files.length > 0 && (
            <div className="mb-4 relative">
              {file && file.type && file.type.startsWith('image/') && (
                <div className="flex justify-center items-center relative group bg-muted rounded-md overflow-hidden">
                  <img
                    src={file.url}
                    alt={`${note.title} - File ${currentFileIndex + 1}`}
                    className="max-w-full max-h-[60vh] h-auto object-contain cursor-pointer"
                    onClick={() => handlePreviewClick(file.url)} // Open preview on image click too
                  />
                   <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handlePreviewClick(file.url)}
                    title="Expand Image"
                  >
                    <Expand className="h-5 w-5" />
                  </Button>
                </div>
              )}
              {file && file.type && file.type === 'application/pdf' && (
                <div className="flex justify-center relative">
                  <embed
                    src={file.url}
                    type="application/pdf"
                    className="w-full h-[70vh] rounded-md shadow-md"
                  />
                 {/* Add download button for PDF */}
                  <a
                    href={file.url}
                    download={fileName}
                    className="absolute top-2 right-2"
                  >
                     <Button variant="ghost" size="icon" className="bg-black/50 text-white hover:bg-black/75" title="Download PDF">
                        <Download className="h-5 w-5" />
                    </Button>
                  </a>
                </div>
              )}
              {file && file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf' && (
                <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                   <p className="mb-2 text-muted-foreground">Unsupported file type for inline preview.</p>
                  <a
                    href={file.url}
                    download={fileName}
                    className="underline text-primary inline-flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </a>
                </div>
              )}
              {note.files.length > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handlePrevClick} variant="outline" size="icon" className="neumorphic">
                    <ChevronLeft/>
                  </Button>
                  <span className="text-sm text-muted-foreground">{currentFileIndex + 1} / {note.files.length}</span>
                  <Button onClick={handleNextClick} variant="outline" size="icon" className="neumorphic">
                    <ChevronRight/>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

       {/* Image Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm relative">
           {/* Close button remains at top right */}
           <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-foreground hover:bg-muted/50 z-20"
            onClick={() => setIsPreviewOpen(false)}
            title="Close Preview"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </Button>
          {previewImageUrl && (
            <div className="flex-grow flex items-center justify-center overflow-hidden w-full h-full">
              <img
                src={previewImageUrl}
                alt="Preview"
                className="max-w-full max-h-full h-auto w-auto object-contain" // Ensure image fits within dialog
              />
            </div>
          )}
          {/* Download Button - Positioned at bottom right */}
           {previewImageUrl && (
                <a
                    href={previewImageUrl}
                    download={fileName}
                    className="absolute bottom-4 right-4 z-20" // Positioned bottom right
                 >
                    <Button variant="default" size="icon" className="bg-primary/80 text-primary-foreground hover:bg-primary" title="Download Image">
                        <Download className="h-6 w-6" />
                    </Button>
                </a>
             )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewNotePage;

