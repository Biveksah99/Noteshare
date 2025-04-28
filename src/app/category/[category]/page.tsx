"use client";

import React, {useEffect, useState} from 'react';
import {useParams, useRouter, useSearchParams} from 'next/navigation';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {format} from 'date-fns';
import Link from "next/link";
import {File} from "lucide-react";

const CategoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = React.useMemo(() => {
    if (!params || !params.category) {
      return '';
    }
    return params.category as string;
  }, [params]);

  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (category) {
      const storedNotes = localStorage.getItem(category);
      if (storedNotes) {
        try {
          setNotes(JSON.parse(storedNotes));
        } catch (error) {
          console.error("Error parsing stored notes:", error);
          setNotes([]);
        }
      } else {
        setNotes([]);
      }
    }
  }, [category]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">{category} Notes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {notes.map((note, index) => (
          <Card key={note.id} className="mb-4 neumorphic">
            <CardHeader className="flex flex-col items-start">
              <Link
                href={`/view-note?id=${note.id}&category=${category}`}
                className="w-full"
              >
                <CardTitle>{note.title}</CardTitle>
              </Link>
              <CardDescription>
                Uploaded by {note.uploader} on {format(new Date(note.timestamp), 'yyyy-MM-dd HH:mm')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardDescription>{note.description.substring(0, 50)}...</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoryDetailPage;
