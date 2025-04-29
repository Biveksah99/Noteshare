"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import {ChevronLeft, ChevronRight, Expand} from "lucide-react";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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
            setCurrentFileIndex(Math.max(0, Math.min(initialFileIndex, foundNote.files.length - 1)));
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
    setCurrentFileIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : (note?.files?.length || 1) - 1));
  };

  const handleNextClick = () => {
    setCurrentFileIndex((prevIndex) => (prevIndex < (note?.files?.length || 1) - 1 ? prevIndex + 1 : 0));
  };

  const handlePreviewClick = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
    setIsPreviewOpen(true);
  };

  if (!note) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  const file = note.files?.[currentFileIndex];

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-4 neumorphic">
        <CardHeader className="flex flex-row items-center">
          <Avatar className="mr-4 h-8 w-8">
            <AvatarImage src="https://picsum.photos/id/237/200/300" alt={note.uploader}/>
            <AvatarFallback>{note.uploader.substring(0, 2)}</AvatarFallback>
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
                <div className="flex justify-center items-center relative">
                  <img
                    src={file.url}
                    alt={note.title + ` - ${currentFileIndex + 1}`}
                    className="max-w-full max-h-[60vh] h-auto rounded-md shadow-md object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/75"
                    onClick={() => handlePreviewClick(file.url)}
                  >
                    <Expand className="h-5 w-5" />
                  </Button>
                </div>
              )}
              {file && file.type && file.type === 'application/pdf' && (
                <div className="flex justify-center">
                  <embed
                    src={file.url}
                    type="application/pdf"
                    className="w-full h-[70vh] rounded-md shadow-md"
                  />
                </div>
              )}
              {file && file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf' && (
                <div className="flex flex-col items-center justify-center p-4 border rounded-md">
                   <p className="mb-2 text-muted-foreground">Unsupported file type for inline preview.</p>
                  <a
                    href={file.url}
                    download={`${note.title}_${currentFileIndex+1}`} // Add index to filename
                    className="underline text-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download File
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
        <DialogContent className="max-w-4xl p-2">
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Preview"
              className="max-w-full max-h-[85vh] h-auto object-contain mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewNotePage;
