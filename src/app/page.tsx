"use client";

import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Book, Brain, Calendar} from "lucide-react";
import {format} from 'date-fns';
// import {Calendar as NepaliCalendar} from 'nepali-date-converter';

const announcements = [
  {
    id: 1,
    title: 'Welcome to NoteShare!',
    content: 'We are excited to launch our shared notes and study materials app for the college. Start sharing and collaborating today!',
  },
  {
    id: 2,
    title: 'Upcoming Exam Schedule',
    content: 'Please check the updated exam schedule posted by the administration. All the best for your preparations!',
  },
];

const Home = () => {
  const router = useRouter();
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  useEffect(() => {
    // Load recent uploads from local storage
    const allKeys = Object.keys(localStorage);
    const uploads: any[] = [];

    allKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item && typeof item === 'string') { // Check if item is a string
          try {
            const parsedItem = JSON.parse(item);
            if (Array.isArray(parsedItem) && parsedItem.length > 0 && parsedItem[0].hasOwnProperty('timestamp')) {
              uploads.push(...parsedItem);
            }
          } catch (parseError) {
            console.error("Failed to parse item from localStorage", parseError);
          }
        }
      } catch (e) {
        console.error("Failed to retrieve item from localStorage", e);
      }
    });

    // Sort uploads by timestamp and take the most recent ones
    uploads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentUploads(uploads.slice(0, 5)); // Display the 5 most recent uploads

  }, []);

  const handleUploadClick = () => {
    router.push('/upload'); // Navigate to the /upload route
  };

  const getNepaliDate = () => {
    const today = new Date();
    const nepaliDate = today.toLocaleDateString('en-NP', { // Use Nepali locale
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    return nepaliDate;
  };


  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-end">
      <Button variant="ghost" size="icon">
          {getNepaliDate()}
        </Button>
      </div>

      {/* Announcements Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Notice Board</h2>
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="mb-4 neumorphic">
            <CardHeader>
              <CardTitle>{announcement.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{announcement.content}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Uploads Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Uploads</h2>
        {recentUploads.map((upload) => (
          <Card key={upload.id} className="mb-4 neumorphic">
            <CardHeader className="flex flex-row items-center">
              <Avatar className="mr-4 h-8 w-8">
                <AvatarImage src="https://picsum.photos/id/237/200/300" alt={upload.uploader}/>
                <AvatarFallback>{upload.uploader.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{upload.title}</CardTitle>
                <CardDescription>
                  Uploaded by {upload.uploader} on{' '}
                  {format(new Date(upload.timestamp), 'yyyy-MM-dd HH:mm')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{upload.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Upload Button */}
      <Button onClick={handleUploadClick} className="bg-accent text-accent-foreground">
        Upload Study Materials
      </Button>
    </div>
  );
};

export default Home;
