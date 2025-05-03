
"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Define User interface matching Firestore structure (or localStorage for this example)
interface UserProfile {
    id: string; // Use UID as ID if using Firestore Auth, or a unique identifier
    fullName: string;
    email?: string;
    isVerified: boolean;
    // Add other fields as needed
}

// Simple check if the current user is an admin (replace with actual logic)
const isAdminUser = (userId: string | undefined): boolean => {
    // In a real app, check against a list of admin UIDs in Firestore or a custom claim
    const ADMIN_UIDS = ["adminUserId", "anotherAdminUid"]; // Replace with actual Admin UIDs
    return !!userId && ADMIN_UIDS.includes(userId);
};

const AdminUsersPage = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, authLoading, authError] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();

    // Redirect if not admin or not logged in
    useEffect(() => {
        if (!authLoading && !isAdminUser(currentUser?.uid)) {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You do not have permission to view this page.",
            });
            router.push('/'); // Redirect to home or login page
        }
    }, [currentUser, authLoading, router, toast]);

    // Fetch users (using localStorage for demo - adapt for Firestore)
    useEffect(() => {
        if (isAdminUser(currentUser?.uid)) { // Only fetch if admin
            setLoading(true);
            // --- Firestore Example (Commented out for localStorage demo) ---
            /*
            const fetchUsers = async () => {
                try {
                    const usersCol = collection(db, 'users'); // Assuming 'users' collection
                    const userSnapshot = await getDocs(usersCol);
                    const userList = userSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as UserProfile));
                    setUsers(userList);
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not fetch user list.",
                    });
                } finally {
                    setLoading(false);
                }
            };
            fetchUsers();
            */

            // --- localStorage Demo ---
            try {
                // Attempt to get user list from a simulated key or individual profiles
                // This is highly dependent on how you'd store multiple users in localStorage
                // For this example, we'll just load the single 'userProfile' if it exists
                const profileRaw = localStorage.getItem('userProfile');
                const fetchedUsers: UserProfile[] = [];
                if (profileRaw) {
                     try {
                         const profileData = JSON.parse(profileRaw);
                         // Simulate a user list with one user for demo
                         fetchedUsers.push({
                             id: profileData.email || 'unknown-id', // Use email as a pseudo-ID
                             fullName: profileData.fullName || 'Unknown User',
                             email: profileData.email,
                             isVerified: profileData.isVerified || false,
                         });
                     } catch (e) {
                         console.error("Failed to parse user profile from localStorage", e);
                     }
                }
                 // In a real scenario, you might iterate through multiple keys
                 // or have a dedicated 'userList' key in localStorage.
                setUsers(fetchedUsers);
             } catch (error) {
                 console.error("Error fetching users from localStorage:", error);
                 toast({ variant: "destructive", title: "Error", description: "Could not load users from local storage." });
             } finally {
                 setLoading(false);
             }
             // --- End localStorage Demo ---

        }
    }, [currentUser, toast]); // Re-fetch if currentUser changes

    const toggleVerification = async (userId: string, currentState: boolean) => {
         // --- Firestore Example ---
        /*
        const userRef = doc(db, 'users', userId);
        try {
            await updateDoc(userRef, {
                isVerified: !currentState
            });
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, isVerified: !currentState } : user
            ));
            toast({
                title: "Success",
                description: `User verification ${!currentState ? 'granted' : 'revoked'}.`,
            });
        } catch (error) {
            console.error("Error updating verification status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update verification status.",
            });
        }
        */

         // --- localStorage Demo ---
         try {
            // Find the user profile, update it, and save back
            const profileRaw = localStorage.getItem('userProfile');
            if (profileRaw) {
                const profileData = JSON.parse(profileRaw);
                // Assuming the 'userId' matches the email or some identifier
                if (profileData.email === userId || 'unknown-id' === userId) { // Adjust matching logic
                    profileData.isVerified = !currentState;
                    localStorage.setItem('userProfile', JSON.stringify(profileData));

                     // Update local state
                    setUsers(prevUsers => prevUsers.map(user =>
                        user.id === userId ? { ...user, isVerified: !currentState } : user
                    ));

                     toast({ title: "Success", description: `User verification ${!currentState ? 'granted' : 'revoked'}.` });
                 } else {
                     toast({ variant: "destructive", title: "Error", description: "User profile not found for update." });
                 }
             } else {
                 toast({ variant: "destructive", title: "Error", description: "User profile not found in local storage." });
             }
         } catch (error) {
             console.error("Error updating verification in localStorage:", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to update local verification status." });
         }
        // --- End localStorage Demo ---
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || loading) {
        return <div className="container mx-auto p-6 text-center">Loading admin panel...</div>;
    }

    if (!isAdminUser(currentUser?.uid)) {
         // Although redirection is handled by useEffect, this provides an immediate fallback UI
        return <div className="container mx-auto p-6 text-center text-red-500">Access Denied.</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <Card className="neumorphic">
                <CardHeader>
                    <CardTitle className="text-2xl">Manage Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-full sm:w-1/3"
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">Verified</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.fullName}</TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                {user.isVerified ? (
                                                    <CheckCircle2 className="h-5 w-5 text-blue-500 inline" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-muted-foreground inline" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant={user.isVerified ? "destructive" : "default"}
                                                    size="sm"
                                                    onClick={() => toggleVerification(user.id, user.isVerified)}
                                                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                                                >
                                                    {user.isVerified ? 'Revoke' : 'Verify'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminUsersPage;

    