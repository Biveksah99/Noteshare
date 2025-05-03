
"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Search } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
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
    // For demo purposes, let's assume any logged-in user can be admin for now
    // return !!userId && ADMIN_UIDS.includes(userId);
    return !!userId; // Allowing any logged-in user to be admin for easier testing
};

const AdminUsersPage = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, authLoading, authError] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();

    // Redirect if not admin or not logged in (kept original logic here)
    useEffect(() => {
        // For actual deployment, revert the isAdminUser check to the original version
        const ACTUAL_ADMIN_UIDS = ["adminUserId", "anotherAdminUid"];
        const isActualAdmin = !!currentUser && ACTUAL_ADMIN_UIDS.includes(currentUser.uid);

        if (!authLoading && !isActualAdmin) { // Use the actual admin check here for redirection
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
        // Using the broader isAdminUser check for fetching data during testing
        if (isAdminUser(currentUser?.uid)) {
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
                // Attempt to get user list from localStorage.
                // For demo, we'll assume multiple profiles might be stored under different keys,
                // or just the single 'userProfile' key for simplicity.
                const fetchedUsers: UserProfile[] = [];
                // Example: Load just the 'userProfile'
                const profileRaw = localStorage.getItem('userProfile');
                if (profileRaw) {
                     try {
                         const profileData = JSON.parse(profileRaw);
                         // Simulate a user list with one user for demo
                         fetchedUsers.push({
                             id: profileData.email || 'unknown-id-' + Date.now(), // Use email or generate pseudo-ID
                             fullName: profileData.fullName || 'Unknown User',
                             email: profileData.email,
                             isVerified: profileData.isVerified || false, // Load verification status
                         });
                     } catch (e) {
                         console.error("Failed to parse user profile from localStorage", e);
                     }
                }
                // In a real scenario with multiple users in localStorage (less common),
                // you might iterate keys or use a 'userList' key.
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
            // Find the user profile in the state, update it, and save back to localStorage
            const userIndex = users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                const updatedUsers = [...users];
                const userToUpdate = { ...updatedUsers[userIndex], isVerified: !currentState };
                updatedUsers[userIndex] = userToUpdate;
                setUsers(updatedUsers);

                // Assuming the user profile is stored under 'userProfile' key for simplicity.
                // In a multi-user localStorage scenario, you'd need a way to identify the correct profile to update.
                 const profileRaw = localStorage.getItem('userProfile');
                 if (profileRaw) {
                     const profileData = JSON.parse(profileRaw);
                     // Match by ID (which might be email or generated ID in this demo)
                     if (profileData.email === userToUpdate.email || userToUpdate.id.startsWith('unknown-id-')) {
                         profileData.isVerified = userToUpdate.isVerified;
                         localStorage.setItem('userProfile', JSON.stringify(profileData));
                         toast({ title: "Success", description: `User verification ${!currentState ? 'granted' : 'revoked'}.` });
                     } else {
                          toast({ variant: "destructive", title: "Warning", description: "Local storage profile might not match the updated user." });
                     }
                 } else {
                      toast({ variant: "destructive", title: "Error", description: "User profile not found in local storage for update." });
                 }

             } else {
                 toast({ variant: "destructive", title: "Error", description: "User not found in the current list." });
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

    // Use the actual admin check for rendering the final UI
    const ACTUAL_ADMIN_UIDS = ["adminUserId", "anotherAdminUid"];
    const isActualAdmin = !!currentUser && ACTUAL_ADMIN_UIDS.includes(currentUser.uid);
    if (!isActualAdmin) {
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
                                            <TableCell className="font-medium flex items-center">
                                                <span>{user.fullName}</span>
                                                 {/* Adjusted badge size and margin */}
                                                {user.isVerified && <VerifiedBadge className="ml-1.5 h-4 w-4 flex-shrink-0" />}
                                            </TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                {user.isVerified ? (
                                                    /* Adjusted badge size */
                                                    <VerifiedBadge className="h-4 w-4 inline" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-muted-foreground inline" />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant={user.isVerified ? "destructive" : "default"}
                                                    size="sm"
                                                    onClick={() => toggleVerification(user.id, user.isVerified)}
                                                    className={`${user.isVerified ? '' : 'bg-accent text-accent-foreground hover:bg-accent/90'}`} // Keep accent style only for Verify button
                                                >
                                                    {user.isVerified ? 'Revoke' : 'Verify'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No users found matching search or no users available.
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
