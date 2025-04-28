"use client";

import React from 'react';
import {useParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Book} from "lucide-react";

const CategoryDetailPage = () => {
  const params = useParams();
  const category = params.category as string;

  // Mock data for notes
  const notes = [
    {
      id: 1,
      title: `${category} Notes - Chapter 1`,
      description: 'Detailed notes for chapter 1.',
      uploader: 'John Doe',
      timestamp: '2024-07-16T10:00:00',
    },
    {
      id: 2,
      title: `${category} Summary`,
      description: 'A quick summary of key concepts.',
      uploader: 'Jane Smith',
      timestamp: '2024-07-15T14:30:00',
    },
  ];

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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CategoryDetailPage;
