"use client";

import * as React from "react";

import {cn} from "@/lib/utils";

const Footer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({className, ...props}, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-t bg-secondary text-secondary-foreground shadow-sm",
      className
    )}
    {...props}
  >
    <p className="text-center p-2">
      © {new Date().getFullYear()} NoteShare. All rights reserved.
    </p>
  </div>
));
Footer.displayName = "Footer";

export {Footer};
