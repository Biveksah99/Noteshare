"use client";

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';

const ViewNotePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract parameters using React.use()
  const noteId = React.useMemo(() => searchParams.get('id'), [searchParams]);
  const category = React.useMemo(() => searchParams.get('category'), [searchParams]);

  const [note, setNote] = useState<any>(null);


  useEffect(() => {
    if (category && noteId) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          const notes = JSON.parse(storedNotes);
          const foundNote = notes.find((n: any) => n.id === parseInt(noteId as string));
          if (foundNote) {
            setNote(foundNote);
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
          {note.files && note.files.map((file, index) => (
            <div key={index} className="mb-4">
              {file.type && file.type.startsWith('image/') && (
                <div className="flex justify-center">
                  <img
                    src={file.url}
                    alt={note.title}
                    className="max-w-full h-auto rounded-md shadow-md"
                  />
                </div>
              )}
              {file.type && file.type === 'application/pdf' && (
                <div className="flex justify-center">
                  <embed
                    src={file.url}
                    type="application/pdf"
                    className="w-full h-[500px] rounded-md shadow-md"
                  />
                </div>
              )}
              {file.type && !file.type.startsWith('image/') && file.type !== 'application/pdf' && (
                <div className="flex justify-center">
                  <a
                    href={file.url}
                    download={`${note.title}-${index + 1}`}
                    className="underline text-blue-500"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download File {index + 1}
                  </a>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewNotePage;
