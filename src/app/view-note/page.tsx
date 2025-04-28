"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Book} from "lucide-react";
import {format} from 'date-fns';

const ViewNotePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get('id');
  const category = searchParams.get('category');
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    if (category && noteId) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          const notes = JSON.parse(storedNotes);
          const foundNote = notes.find((n: any) => n.id === parseInt(noteId));
          if (foundNote) {
            setNote(foundNote);
          } else {
            // If note not found, redirect back to category page
            router.push(`/category/${category}`);
          }
        } catch (error) {
          console.error("Error parsing stored notes:", error);
        }
      } else {
        // If no notes in category, redirect back to category page
        router.push(`/category/${category}`);
      }
    } else {
      // If missing params, redirect to home page
      router.push('/');
    }
  }, [category, noteId, router]);

  if (!note) {
    return <div>Loading...</div>;
  }

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
          <CardDescription className="mb-4">{note.description}</CardDescription>
          {note.file && note.type && note.type.startsWith('image/') && (
            <div className="flex justify-center">
              <img
                src={note.file}
                alt={note.title}
                className="max-w-full h-auto rounded-md shadow-md"
              />
            </div>
          )}
          {note.file && note.type && note.type === 'application/pdf' && (
            <div className="flex justify-center">
              <embed
                src={note.file}
                type="application/pdf"
                className="w-full h-[500px] rounded-md shadow-md"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewNotePage;
