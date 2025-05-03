
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation'; // Removed useParams import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import Link from "next/link";
import { File, Image as ImageIcon } from "lucide-react";
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge

// Interface for Note structure including uploader verification
interface Note {
  id: number | string;
  title: string;
  description: string;
  uploader: string;
  timestamp: string; // ISO string date
  files: Array<{ url: string; type: string }>;
  category?: string; // Keep category if needed elsewhere
  uploaderIsVerified?: boolean; // Added for verification status
}

const DESCRIPTION_PREVIEW_LIMIT = 100; // Limit for description preview

// Changed component signature to accept params prop
const CategoryDetailPage = ({ params }: { params: { category: string } }) => {
  const router = useRouter();

  // Use React.use to unwrap the promise/value from params
   const categoryParam = React.use(params.category);

   const category = useMemo(() => {
     if (!categoryParam || typeof categoryParam !== 'string') {
       return ''; // Return empty string if param is invalid
     }
     try {
       return decodeURIComponent(categoryParam);
     } catch (e) {
       console.error("Failed to decode category param:", e);
       return categoryParam; // Fallback to original if decoding fails
     }
   }, [categoryParam]); // Dependency is the unwrapped value


  const [notes, setNotes] = useState<Note[]>([]); // Use Note interface

  useEffect(() => {
    if (category) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          const parsedNotes: Note[] = JSON.parse(storedNotes);
          // Fetch verification status for each note's uploader
          const notesWithVerification = parsedNotes.map(note => {
            const userProfileRaw = localStorage.getItem('userProfile');
            let uploaderIsVerified = false;
            if (userProfileRaw) {
              try {
                const userProfile = JSON.parse(userProfileRaw);
                // Use email or a unique ID if available in the note data
                // Assuming uploader name matches fullName for now (fragile)
                // Ideally, notes should store uploader's unique ID (e.g., email or Firebase UID)
                if (userProfile.fullName === note.uploader) {
                  uploaderIsVerified = userProfile.isVerified || false;
                }
              } catch (profileError) {
                console.warn("Could not parse user profile for verification status", profileError);
              }
            }
             // --- TEMPORARY FOR TESTING BLUE TICK ---
             uploaderIsVerified = true; // Force verified for testing
             // --- REMOVE THIS LINE AFTER TESTING ---
            return { ...note, uploaderIsVerified };
          });
          setNotes(notesWithVerification);
        } catch (error) {
          console.error("Error parsing stored notes:", error);
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
    }
  }, [category]);

  const renderFilePreview = (files: Array<{ url: string; type: string }>) => {
    if (!files || files.length === 0) {
      return <p className="text-sm text-muted-foreground">No preview available.</p>;
    }
    const firstFile = files[0];
    const fileType = firstFile.type || '';

    if (fileType.startsWith('image/')) {
      return (
        <div className="mt-2 relative aspect-video overflow-hidden rounded-md border">
          <img
            src={firstFile.url}
            alt="Note preview"
            className="w-full h-full object-cover"
            loading="lazy"
            data-ai-hint="note preview image"
          />
          {files.length > 1 && (
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              +{files.length - 1} more
            </span>
          )}
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return <div className="mt-2 flex items-center text-sm text-muted-foreground"><File className="h-4 w-4 mr-1"/> PDF Document {files.length > 1 ? `(+${files.length - 1})` : ''}</div>;
    } else {
      return <div className="mt-2 flex items-center text-sm text-muted-foreground"><File className="h-4 w-4 mr-1"/> File {files.length > 1 ? `(+${files.length - 1})` : ''}</div>;
    }
  };


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center capitalize">{category} Notes</h1>
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map((note) => (
            <Link key={note.id} href={`/view-note?id=${note.id}&category=${encodeURIComponent(category)}`} className="block group">
              <Card className="h-full neumorphic bg-card shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden">
                {/* File Preview Area */}
                {renderFilePreview(note.files)}

                {/* Content Area */}
                <CardHeader className="p-4 flex-shrink-0">
                  <CardTitle className="text-lg mb-1 line-clamp-2">{note.title}</CardTitle>
                  <CardDescription className="text-xs flex items-center flex-wrap"> {/* Allow wrapping */}
                    <Avatar className="h-5 w-5 mr-1.5 flex-shrink-0">
                      <AvatarImage src={`https://picsum.photos/seed/${note.uploader}/20/20`} alt={note.uploader} data-ai-hint="user avatar tiny"/>
                      <AvatarFallback className="text-xs">{note.uploader.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium mr-0.5">{note.uploader}</span> {/* Add small margin */}
                    {note.uploaderIsVerified && <VerifiedBadge className="h-3 w-3 flex-shrink-0" />} {/* Blue tick */}
                    <span className="mx-1">·</span>
                    {format(new Date(note.timestamp), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                  <CardDescription className="text-sm line-clamp-3">
                    {note.description.length > DESCRIPTION_PREVIEW_LIMIT
                      ? `${note.description.substring(0, DESCRIPTION_PREVIEW_LIMIT)}...`
                      : note.description
                    }
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground mt-10">No notes found in this category yet.</p>
      )}
    </div>
  );
};

export default CategoryDetailPage;

    