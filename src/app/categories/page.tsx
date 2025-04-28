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
import {Book, Brain} from "lucide-react";
import {useRouter} from "next/navigation";

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

  const handleCategoryClick = (category: string) => {
    router.push(`/category/${category}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-4">Categories</h1>

      <Accordion type="single" collapsible>
        {categories.map((category, index) => (
          <AccordionItem key={index} value={`category-${index}`} className="neumorphic mb-2">
            <AccordionTrigger onClick={() => handleCategoryClick(category)}>
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
    </div>
  );
};

export default CategoriesPage;
