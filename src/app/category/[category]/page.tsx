"use client";

import React, {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Book} from "lucide-react";

const CategoryDetailPage = () => {
  const params = useParams();
  const category = params.category as string;
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    // Load notes from local storage based on the category
    const storedNotes = localStorage.getItem(category);
    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch (error) {
        console.error("Error parsing stored notes:", error);
        setNotes([]); // Set to empty array to prevent further errors
      }
    } else {
      setNotes([]); // Ensure notes are empty if nothing is in local storage
    }
  }, [category]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">{category} Notes</h1>

      {notes.map((note) => (
        <Card key={note.id} className="mb-4 neumorphic">
          <CardHeader className="flex flex-row items-center">
            <Avatar className="mr-4 h-8 w-8">
              <AvatarImage src="https://picsum.photos/id/237/200/300" alt={note.uploader}/>
              <AvatarFallback>{note.uploader.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{note.title}</CardTitle>
              <CardDescription>
                Uploaded by {note.uploader} on {new Date(note.timestamp).toLocaleDateString()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{note.description}</CardDescription>
            {note.file && (
              <a href={URL.createObjectURL(note.file)} download={note.title} className="underline text-blue-500">
                Download File
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CategoryDetailPage;
