
"use client";

import React, {useState, useEffect} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {Book, Brain, Calendar, Loader2} from "lucide-react"; // Added Loader2
import {useRouter} from "next/navigation";
import { useAuthState } from 'react-firebase-hooks/auth'; // Import auth state hook
import { auth } from '@/lib/firebase'; // Import auth instance

const CategoriesPage = () => {
  const [categories, setCategories] = useState([
    'English',
    'Nepali',
    'Basic Maths',
    'Economics',
    'Accountancy',
    'Business Studies',
    'Computer',
    'Social Studies',
    'Business Maths',
  ]);
  const [newCategory, setNewCategory] = useState('');
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth); // Get auth state

   // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);


  useEffect(() => {
    if (user) { // Only load/save categories if logged in
      // Load categories from local storage on component mount
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
         try {
            const parsedCategories = JSON.parse(storedCategories);
            if (Array.isArray(parsedCategories)) {
               setCategories(parsedCategories);
            }
         } catch (e) {
            console.error("Failed to parse categories from localStorage", e);
         }
      }
    }
  }, [user]); // Rerun when user state changes

  useEffect(() => {
     if (user) { // Only load/save categories if logged in
      // Save categories to local storage whenever it changes
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }, [categories, user]); // Rerun when categories or user state changes

  const addCategory = () => {
    if (newCategory.trim() !== '') {
      setCategories((prevCategories) => [...prevCategories, newCategory.trim()]); // Trim input
      setNewCategory('');
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/category/${encodeURIComponent(category)}`); // Ensure category is encoded
  };

   if (authLoading) {
     return (
       <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         <span className="ml-2">Loading...</span>
       </div>
     );
   }

   // If user is not logged in (and not loading), show redirecting message or null
   if (!user) {
      return (
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Redirecting to login...</span>
        </div>
     );
   }

  return (
    <div className="container mx-auto p-6">
      {/* Removed Calendar button */}
      {/* <div className="flex justify-end">
        <Button variant="ghost" size="icon">
          <Calendar className="h-5 w-5"/>
        </Button>
      </div> */}
      <h1 className="text-3xl font-semibold mb-6 text-center">Categories</h1>

      <Accordion type="single" collapsible className="w-full max-w-2xl mx-auto">
        {categories.map((category, index) => (
          <AccordionItem key={index} value={`category-${index}`} className="neumorphic mb-3 rounded-lg border border-border overflow-hidden">
            <AccordionTrigger onClick={() => handleCategoryClick(category)} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center">
                <Book className="mr-3 h-5 w-5 text-primary"/> {/* Added color */}
                <span className="font-medium text-lg">{category}</span> {/* Larger font */}
              </div>
            </AccordionTrigger>
            {/* Content can be removed or kept simple if detail page shows everything */}
            <AccordionContent className="p-4 pt-0 text-muted-foreground bg-background/50">
              <p>
                Click to view notes and materials for {category}.
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Add Category Input - Consider moving to admin section? */}
      {/* For now, keep it simple */}
      <div className="flex items-center mt-8 max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Add new category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="mr-2 flex-grow"
        />
        <Button variant="secondary" onClick={addCategory} className="neumorphic shadow-sm">
          Add (+)
        </Button>
      </div>
    </div>
  );
};

export default CategoriesPage;
