"use client";

import {Home, Upload, List, User, MessageSquare} from "lucide-react"; // Import MessageSquare icon
import Link from "next/link";
import React from "react";

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-secondary/75 text-secondary-foreground border-t shadow-sm">
      <div className="container flex items-center justify-around p-4">
        <Link href="/" className="flex flex-col items-center neumorphic">
          <Home className="h-6 w-6"/>
          Home
        </Link>
        <Link href="/upload" className="flex flex-col items-center">
          <Upload className="h-6 w-6"/>
          Upload
        </Link>
        <Link href="/categories" className="flex flex-col items-center neumorphic">
          <List className="h-6 w-6"/>
          Categories
        </Link>
         {/* Add Chat link */}
         <Link href="/chat" className="flex flex-col items-center">
          <MessageSquare className="h-6 w-6"/>
          Chat
        </Link>
        <Link href="/profile" className="flex flex-col items-center">
          <User className="h-6 w-6"/>
          Profile
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
