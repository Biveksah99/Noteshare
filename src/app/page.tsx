
"use client";

import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Book, Brain, Calendar, Globe } from "lucide-react";
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import {format} from 'date-fns';
import Link from "next/link";

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

// Interface for Note structure including uploader verification
interface Note {
  id: number | string;
  title: string;
  description: string;
  uploader: string;
  timestamp: string; // ISO string date
  files: Array<{ url: string; type: string }>;
  category: string;
  uploaderIsVerified?: boolean; // Added for verification status
}


const Home = () => {
  const router = useRouter();
  const [recentUploads, setRecentUploads] = useState<Note[]>([]); // Use Note interface
  const [nepaliDate, setNepaliDate] = useState('');

  useEffect(() => {
    // Load recent uploads from local storage
    const allKeys = Object.keys(localStorage);
    const uploads: Note[] = [];

    allKeys.forEach(key => {
      // Skip non-category keys and the profile key
      if (key === 'userProfile' || key === 'categories' || key.startsWith('firebase:')) {
         return;
      }

      try {
        const item = localStorage.getItem(key);
        if (item && typeof item === 'string') { // Check if item is a string
          try {
            const parsedItem = JSON.parse(item);
            if (Array.isArray(parsedItem) && parsedItem.length > 0 && parsedItem[0]?.hasOwnProperty('timestamp')) {
              // Add category to each note and push to uploads
               parsedItem.forEach((note: any) => {
                 if(note.id && note.title && note.description && note.uploader && note.timestamp && note.files) {
                   // Fetch uploader verification status from userProfile (if exists)
                   const userProfileRaw = localStorage.getItem('userProfile');
                   let uploaderIsVerified = false;
                   if(userProfileRaw) {
                     try {
                       const userProfile = JSON.parse(userProfileRaw);
                       // Assuming uploader name matches fullName in profile
                       // NOTE: This comparison might be fragile. Ideally, use a unique user ID.
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

                   uploads.push({ ...note, category: key, uploaderIsVerified });
                 } else {
                   console.warn(`Skipping invalid note structure in category ${key}:`, note);
                 }
               });
            }
          } catch (e) {
            // Gracefully handle non-JSON items in localStorage
            if (!(e instanceof SyntaxError)) {
              console.error(`Failed to process item from localStorage for key ${key}.`, e);
            } else {
              // console.warn(`Item with key ${key} is not valid JSON, skipping.`);
            }
          }
        } else {
          // console.warn(`Item with key ${key} is not a string or is null, skipping.`);
        }
      } catch (e) {
        console.error("Failed to retrieve or process item from localStorage", e);
      }
    });

    // Sort uploads by timestamp and take the most recent ones
    uploads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentUploads(uploads.slice(0, 2)); // Display the 2 most recent uploads

  }, []);


  useEffect(() => {
    // Function to get Nepali date - using browser's locale for simplicity
    // Note: This doesn't guarantee a Bikram Sambat calendar.
    // For accurate BS date, a library like 'nepali-date-converter' would be needed,
    // but it requires installation and might have compatibility issues (as seen before).
    // Using Intl.DateTimeFormat as a fallback for now.
    const getFormattedDate = () => {
        try {
            // Attempt to use Nepali locale if supported by the browser
            return new Intl.DateTimeFormat('ne-NP', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            }).format(new Date());
        } catch (e) {
            console.warn("Nepali locale 'ne-NP' not supported, falling back to default.", e);
            // Fallback to default locale
            return new Date().toLocaleDateString();
        }
    };
    setNepaliDate(getFormattedDate());
  }, []);


  const handleUploadClick = () => {
    router.push('/upload'); // Navigate to the /upload route
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" className="neumorphic flex items-center text-sm">
          <Calendar className="mr-1 h-4 w-4"/>
          {nepaliDate || "Loading date..."}
        </Button>
      </div>

      {/* Announcements Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center">
          <Globe className="mr-2"/>
          Notice Board
        </h2>
        <div className="space-y-4 max-h-80 overflow-y-auto p-1"> {/* Added scroll for long notice boards */}
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="neumorphic bg-card">
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{announcement.content}</CardDescription>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      {/* Recent Uploads Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Uploads</h2>
         {recentUploads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentUploads.map((upload) => (
                  <Link key={upload.id} href={`/view-note?id=${upload.id}&category=${upload.category}`} className="block group">
                    <Card className="neumorphic h-full transition-shadow duration-200 group-hover:shadow-lg">
                      <CardHeader className="flex flex-row items-center space-x-3 p-4"> {/* Adjust padding */}
                        <Avatar className="h-10 w-10">
                          {/* Placeholder image - Consider fetching user's actual avatar */}
                          <AvatarImage src={`https://picsum.photos/seed/${upload.uploader}/40/40`} alt={upload.uploader} data-ai-hint="user avatar"/>
                          <AvatarFallback>{upload.uploader.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{upload.title}</CardTitle> {/* Ensure title doesn't wrap excessively */}
                          <CardDescription className="text-xs flex items-center flex-wrap"> {/* Allow wrapping for long names/dates */}
                             Uploaded by&nbsp;
                             <span className="font-medium">{upload.uploader}</span>
                             {upload.uploaderIsVerified && <VerifiedBadge className="ml-1 h-3 w-3 flex-shrink-0" />} {/* Blue tick */}
                             <span className="mx-1">&middot;</span>
                             {format(new Date(upload.timestamp), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0"> {/* Adjust padding */}
                        <CardDescription className="text-sm line-clamp-2"> {/* Limit description lines */}
                            {upload.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
         ) : (
            <p className="text-muted-foreground">No recent uploads yet.</p>
         )}
      </section>

      {/* Upload Button - Consider making it a FAB */}
      <div className="text-center mt-6">
        <Button onClick={handleUploadClick} className="bg-accent text-accent-foreground shadow-md hover:bg-accent/90">
            Upload Study Materials
        </Button>
      </div>
    </div>
  );
};

export default Home;
