
"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Search, Loader2, ShieldAlert } from 'lucide-react'; // Added Loader2, ShieldAlert
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Define User interface matching Firestore structure
interface UserProfile {
    id: string; // Firestore Document ID (usually UID)
    fullName: string;
    email?: string;
    isVerified: boolean;
    // Add other fields as needed
}

// Fetch admin status for the current user from Firestore
const checkAdminStatus = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const adminDocRef = doc(db, 'admins', userId); // Assuming 'admins' collection with UIDs as doc IDs
    const adminDoc = await getDoc(adminDocRef);
    return adminDoc.exists(); // User is an admin if their UID exists in the 'admins' collection
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};


const AdminUsersPage = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false); // State to hold admin status
    const [checkingAdmin, setCheckingAdmin] = useState(true); // State for admin check loading
    const [currentUser, authLoading, authError] = useAuthState(auth);
    const { toast } = useToast();
    const router = useRouter();

    // Check admin status and redirect if necessary
    useEffect(() => {
        const verifyAdmin = async () => {
            if (authLoading) return; // Wait for auth state to load

            if (!currentUser) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Please log in to view this page.",
                });
                router.replace('/login'); // Redirect to login if not logged in
                return;
            }

            setCheckingAdmin(true);
            const isAdminResult = await checkAdminStatus(currentUser.uid);
            setIsAdmin(isAdminResult);
            setCheckingAdmin(false);

            if (!isAdminResult) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You do not have permission to view this page.",
                });
                router.replace('/'); // Redirect to home if not admin
            }
        };

        verifyAdmin();
    }, [currentUser, authLoading, router, toast]);


    // Fetch users from Firestore only if the current user is confirmed as admin
    useEffect(() => {
        if (isAdmin) { // Only fetch if isAdmin is true
            setLoading(true);
            const fetchUsers = async () => {
                try {
                    const usersCol = collection(db, 'users'); // Assuming 'users' collection in Firestore
                    const userSnapshot = await getDocs(usersCol);
                    const userList = userSnapshot.docs.map(doc => ({
                        id: doc.id, // Use Firestore document ID
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
        } else {
            // If not admin, ensure user list is empty and loading is false
            setUsers([]);
            setLoading(false);
        }
    }, [isAdmin, toast]); // Re-fetch if isAdmin status changes


    const toggleVerification = async (userId: string, currentState: boolean) => {
        if (!isAdmin) return; // Extra check

        const userRef = doc(db, 'users', userId); // Reference to the user document in Firestore
        try {
            await updateDoc(userRef, {
                isVerified: !currentState
            });
            // Update local state optimistically
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, isVerified: !currentState } : user
            ));
            toast({
                title: "Success",
                description: `User verification ${!currentState ? 'granted' : 'revoked'}.`,
            });

             // Also update localStorage 'userProfile' if the modified user is the *current* user
             if (currentUser && currentUser.uid === userId) {
                 try {
                     const profileRaw = localStorage.getItem('userProfile');
                     if (profileRaw) {
                         const profileData = JSON.parse(profileRaw);
                         profileData.isVerified = !currentState;
                         localStorage.setItem('userProfile', JSON.stringify(profileData));
                         console.log("Updated current user's verification status in localStorage.");
                     }
                 } catch (e) {
                     console.error("Failed to update current user's verification status in localStorage:", e);
                 }
             }

        } catch (error) {
            console.error("Error updating verification status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update verification status.",
            });
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || checkingAdmin) {
        return (
          <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <span className="ml-2">Loading admin panel...</span>
          </div>
        );
    }

    // If finished checking and not admin, show access denied (though redirect should have happened)
    if (!isAdmin) {
         return (
           <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
              <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
              <h1 className="text-2xl font-semibold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You do not have permission to view this page.</p>
              <Button onClick={() => router.push('/')} className="mt-6">Go to Home</Button>
           </div>
         );
    }

     // Show loading indicator for user data fetching
    if (loading) {
       return (
          <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <span className="ml-2">Loading users...</span>
          </div>
        );
    }


    return (
        <div className="container mx-auto p-6">
            <Card className="neumorphic bg-card">
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
                                                 {/* Link name to user's profile page */}
                                                <Link href={`/profile/${user.id}`} className="hover:underline flex items-center">
                                                   <span>{user.fullName}</span>
                                                    {/* Adjusted badge size and margin - Use h-4 w-4 */}
                                                   {user.isVerified && <VerifiedBadge className="ml-1.5 h-4 w-4 flex-shrink-0" />}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                {user.isVerified ? (
                                                    /* Adjusted badge size - Use h-4 w-4 */
                                                    <VerifiedBadge className="h-4 w-4 inline-block" />
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
