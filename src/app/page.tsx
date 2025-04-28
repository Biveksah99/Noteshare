"use client";

import React from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useEffect, useState} from 'react';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {useRouter} from 'next/navigation';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Book, Brain} from "lucide-react";

const categoriesData = [
  'English',
  'Nepali',
  'Basic Maths',
  'Economics',
  'Accountancy',
  'Business Studies',
  'Computer',
  'Social Studies',
  'Business Maths',
];

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

const recentUploads = [
  {
    id: 1,
    title: 'Economics Notes - Chapter 3',
    description: 'Detailed notes on Microeconomics concepts.',
    uploader: 'John Doe',
    timestamp: '2024-07-15T12:30:00',
  },
  {
    id: 2,
    title: 'Maths Cheat Sheet',
    description: 'Quick formulas for the upcoming exam.',
    uploader: 'Jane Smith',
    timestamp: '2024-07-14T18:00:00',
  },
];

const Home = () => {
  const router = useRouter();
  const [categories, setCategories] = useState(categoriesData);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    // Load categories from local storage on component mount
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
      setCategories(JSON.parse(storedCategories));
    }
  }, []);

  useEffect(() => {
    // Save categories to local storage whenever it changes
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = () => {
    if (newCategory.trim() !== '') {
      setCategories((prevCategories) => [...prevCategories, newCategory]);
      setNewCategory('');
    }
  };

  const handleUploadClick = () => {
    router.push('/upload'); // Navigate to the /upload route
  };

  return (
    <div className="container mx-auto p-6">
      {/* Search Bar */}
      <Input type="search" placeholder="Search study materials..." className="mb-4"/>

      {/* Announcements Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Announcements</h2>
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
                  {new Date(upload.timestamp).toLocaleDateString()}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{upload.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Categories Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        <Accordion type="single" collapsible>
          {categories.map((category, index) => (
            <AccordionItem key={index} value={`category-${index}`} className="neumorphic mb-2">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Book className="mr-2 h-5 w-5"/>
                  {category}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p>
                  Materials related to {category} will be displayed here.
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add Category Input */}
        <div className="flex items-center mt-4">
          <Input
            type="text"
            placeholder="Add new category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="mr-2"
          />
          <Button variant="secondary" onClick={addCategory}>
            Add (+)
          </Button>
        </div>
      </section>

      {/* Upload Button */}
      <Button onClick={handleUploadClick} className="bg-accent text-accent-foreground">
        Upload Study Materials
      </Button>
    </div>
  );
};

export default Home;
