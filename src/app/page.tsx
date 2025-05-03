
"use client";

import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import {Book, Brain, Calendar, Globe, Upload as UploadIcon } from "lucide-react"; // Renamed Upload icon
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import {format} from 'date-fns';
import Link from "next/link";

// Updated announcements
const announcements = [
  {
    id: '1', // Use string IDs for consistency
    title: 'Welcome to NoteShare!',
    content: 'Start sharing your study materials and collaborate with fellow students. Upload notes, PDFs, images, and more!',
    date: '2024-05-01'
  },
  {
    id: '2',
    title: 'Mid-Term Exam Schedule Updated',
    content: 'The mid-term exam schedule has been updated. Please check the college portal for the latest version. Good luck!',
    date: '2024-04-25'
  },
   {
    id: '3',
    title: 'Library Hours Extended for Exams',
    content: 'Library hours are extended until 9 PM during the exam period starting next week.',
    date: '2024-04-20'
  },
];

// Interface for Note structure including uploader verification and profile image
interface Note {
  id: string; // Ensure ID is string
  title: string;
  description: string;
  uploader: string;
  uploaderId?: string; // Added uploaderId
  uploaderProfileImage?: string | null; // Added for profile image URL
  timestamp: string; // ISO string date
  files: Array<{ url: string; type: string; name?: string }>; // Added optional name
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
      // Skip non-category keys and the profile/admin/firebase keys
      if (key === 'userProfile' || key === 'adminUserProfile' || key === 'categories' || key.startsWith('firebase:')) {
         return;
      }

      try {
        const item = localStorage.getItem(key);
        if (item && typeof item === 'string') { // Check if item is a string
          try {
            const parsedItem = JSON.parse(item);
            // Ensure it's an array of notes
            if (Array.isArray(parsedItem)) {
               parsedItem.forEach((note: any) => {
                 // Basic validation for note structure
                 if(note && typeof note === 'object' && note.id && note.title && note.timestamp && note.files) {
                    // Add category if missing (might happen with older data)
                    if (!note.category) {
                       note.category = key;
                    }
                     // Add uploaderProfileImage and uploaderIsVerified if missing
                     if (note.uploaderIsVerified === undefined) {
                       // --- TEMPORARY FOR TESTING BLUE TICK ---
                       // note.uploaderIsVerified = false; // Default to false
                       note.uploaderIsVerified = true; // Keep forced true for testing
                       // --- END TEMPORARY ---
                     }
                     if (note.uploaderProfileImage === undefined) {
                         note.uploaderProfileImage = null; // Default to null
                     }
                    uploads.push(note as Note); // Add validated note
                 } else {
                   console.warn(`Skipping invalid note structure in category ${key}:`, note);
                 }
               });
            } else {
                // Handle cases where the item is not an array but valid JSON (e.g., a single object)
                // You might want to wrap it in an array or handle it differently based on your logic
                console.warn(`Item with key ${key} is not an array, skipping.`);
            }
          } catch (e) {
            // Gracefully handle non-JSON items or parsing errors
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

    // Sort uploads by timestamp (newest first)
    uploads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentUploads(uploads.slice(0, 2)); // Display only the 2 most recent uploads

  }, []);


  useEffect(() => {
    // Function to get Nepali date - using browser's locale for simplicity
    const getFormattedDate = () => {
        try {
            // Attempt to use Nepali locale if supported by the browser
            return new Intl.DateTimeFormat('ne-NP', {
                year: 'numeric',
                month: 'long', // Use long month name
                day: 'numeric',
                weekday: 'long' // Add weekday
            }).format(new Date());
        } catch (e) {
            console.warn("Nepali locale 'ne-NP' not supported, falling back to default.", e);
            // Fallback to default locale with a similar format
            return new Date().toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
        }
    };
    setNepaliDate(getFormattedDate());
  }, []);


  const handleUploadClick = () => {
    router.push('/upload'); // Navigate to the /upload route
  };

  return (
    <div className="container mx-auto p-4 md:p-6"> {/* Adjusted padding */}
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" className="neumorphic flex items-center text-sm px-3 py-1 h-auto"> {/* Custom padding */}
          <Calendar className="mr-1.5 h-4 w-4"/> {/* Slightly more margin */}
          {nepaliDate || "Loading date..."}
        </Button>
      </div>

      {/* Announcements Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center">
          <Globe className="mr-2 h-6 w-6"/> {/* Slightly larger icon */}
          Notice Board
        </h2>
        {/* Removed max-h and overflow for full view */}
        <div className="space-y-4 p-1">
            {announcements.length > 0 ? announcements
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date desc
              .map((announcement) => (
              <Card key={announcement.id} className="neumorphic bg-card shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-2 pt-4 px-4"> {/* Adjusted padding */}
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                   <CardDescription className="text-xs pt-1">
                      Posted on: {format(new Date(announcement.date), 'MMM d, yyyy')}
                   </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0"> {/* Adjusted padding */}
                  <CardDescription>{announcement.content}</CardDescription>
                </CardContent>
              </Card>
            )) : (
              <p className="text-muted-foreground text-center py-4">No announcements available.</p>
            )}
        </div>
      </section>

      {/* Recent Uploads Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Uploads</h2>
         {recentUploads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentUploads.map((upload) => (
                  // Link wrapping the card, directs to the specific note view
                  <Link key={upload.id} href={`/view-note?id=${upload.id}&category=${encodeURIComponent(upload.category)}`} className="block group">
                    <Card className="neumorphic h-full transition-shadow duration-200 group-hover:shadow-lg overflow-hidden"> {/* Added overflow hidden */}
                      <CardHeader className="flex flex-row items-start space-x-3 p-4"> {/* Use items-start */}
                        {/* Avatar displayed directly, not wrapped in a Link */}
                        <div className="flex-shrink-0 mt-1">
                          <Avatar className="h-10 w-10 group-hover:opacity-80 transition-opacity">
                            <AvatarImage
                                src={upload.uploaderProfileImage || `https://picsum.photos/seed/${upload.uploader}/40/40`}
                                alt={upload.uploader}
                                data-ai-hint="user avatar"
                              />
                            <AvatarFallback className="group-hover:bg-muted/80 transition-colors">{upload.uploader ? upload.uploader.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-1">{upload.title}</CardTitle>
                          <CardDescription className="text-xs flex items-center flex-wrap mt-1"> {/* Added margin top */}
                             Uploaded by&nbsp;
                             {/* Uploader name displayed directly, not wrapped in a Link */}
                              <span className="font-medium mr-0.5">
                                  <span>{upload.uploader}</span>
                                   {/* Adjusted badge size and margin */}
                                   {upload.uploaderIsVerified && <VerifiedBadge className="h-3.5 w-3.5 ml-0.5 flex-shrink-0 inline-block align-middle" />}
                              </span>
                             <span className="mx-1">&middot;</span>
                             {format(new Date(upload.timestamp), 'MMM d, yyyy')}
                             <span className="mx-1">&middot;</span>
                             <span className="font-semibold capitalize">{upload.category}</span> {/* Show category */}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <CardDescription className="text-sm line-clamp-2">
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
        <Button onClick={handleUploadClick} className="bg-accent text-accent-foreground shadow-md hover:bg-accent/90 neumorphic">
            <UploadIcon className="mr-2 h-4 w-4" /> Upload Study Materials {/* Added icon */}
        </Button>
      </div>
    </div>
  );
};

export default Home;
