"use client";

import * as React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils";

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
      <Link href="/" className="text-xl font-bold">
        NoteShare
      </Link>
    </div>
  </div>
));
Navbar.displayName = "Navbar";

export {Navbar};
