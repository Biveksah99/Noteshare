
"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Home, List, UserCog } from "lucide-react"; // Added UserCog for admin
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

// Simple check if the current user is an admin (replace with actual logic)
const isAdminUser = (userId: string | undefined): boolean => {
    // In a real app, check against a list of admin UIDs in Firestore or a custom claim
    const ADMIN_UIDS = ["adminUserId", "anotherAdminUid"]; // Replace with actual Admin UIDs
    return !!userId && ADMIN_UIDS.includes(userId);
};


const Navbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const [user, loading] = useAuthState(auth);
    const isAdmin = !loading && isAdminUser(user?.uid);

    return (
        <div
            ref={ref}
            className={cn(
                "fixed top-0 left-0 w-full z-50 border-b bg-secondary/80 backdrop-blur-sm text-secondary-foreground shadow-sm", // Make navbar fixed and slightly transparent
                className
            )}
            {...props}
        >
            <div className="container flex items-center justify-between p-4">
                <Link href="/" className="text-xl font-bold flex items-center gap-2 hover:text-primary transition-colors">
                    <Home className="h-5 w-5" />
                    NoteShare
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/categories" className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors">
                        <List className="h-4 w-4" />
                        Categories
                    </Link>
                    {/* Conditionally render Admin link */}
                    {isAdmin && (
                        <Link href="/admin/users" className="text-sm font-medium flex items-center gap-1 hover:text-primary transition-colors text-blue-600">
                            <UserCog className="h-4 w-4" />
                            Admin
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
});
Navbar.displayName = "Navbar";

export { Navbar };

    