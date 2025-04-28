"use client";

import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Book} from "lucide-react";
import Link from "next/link";
import {format} from 'date-fns';

const CategoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const category = React.useMemo(() => {
    if (!params || !params.category) {
      return '';
    }
    return params.category as string;
  }, [params]);

  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    // Load notes from local storage based on the category
    if (category) {
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
    }
  }, [category]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">{category} Notes</h1>

      <div className="overflow-x-auto whitespace-nowrap">
        {notes.map((note) => (
          <div key={note.id} className="inline-block w-full md:w-1/2 lg:w-1/3 px-2">
            <Card className="mb-4 neumorphic">
              <CardHeader className="flex flex-row items-center">
                <Link href={`/view-note?id=${note.id}&category=${category}`} className="flex items-center">
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
                </Link>
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryDetailPage;
