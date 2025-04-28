"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {Home, List} from "lucide-react";

const Navbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-b bg-secondary text-secondary-foreground shadow-sm",
      className
    )}
    {...props}
  >
    <div className="container flex items-center justify-between p-4">
      <Link href="/" className="text-xl font-bold flex items-center">
        <Home className="mr-2"/>
        NoteShare
      </Link>
      <Link href="/categories" className="text-xl font-bold flex items-center">
        <List className="mr-2"/>
        Categories
      </Link>
    </div>
  </div>
));
Navbar.displayName = "Navbar";

export {Navbar};
