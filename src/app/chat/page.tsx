
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth'; // Correct import path for v5
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Image as ImageIcon, File as FileIcon, Users, Loader2 } from 'lucide-react'; // Added Users icon & Loader2
import { VerifiedBadge } from '@/components/ui/verified-badge'; // Import the new badge
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

interface Message {
    id: string;
    text?: string;
    senderId: string;
    // receiverId is removed for group chat
    timestamp: Timestamp | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    senderPhotoURL?: string | null;
    senderDisplayName?: string | null;
    senderIsVerified?: boolean; // Added sender verification status
}

// Define a fixed group chat ID
const GROUP_CHAT_ID = "global_group_chat";

// Interface for minimal user profile data to store with messages or fetch
interface UserProfileInfo {
    fullName?: string;
    profileImage?: string | null;
    isVerified?: boolean;
}

// Helper function to get user profile info (simplified - prefers localStorage)
const getUserProfileInfo = async (userId: string): Promise<UserProfileInfo> => {
    // Prioritize localStorage 'userProfile' if it matches the userId (e.g., by email or stored ID)
    // In a real app, you'd likely fetch from Firestore for accuracy.
    const profileRaw = localStorage.getItem('userProfile');
    let profileData: UserProfileInfo = { fullName: 'User', profileImage: null, isVerified: false };
    let currentUserAuth = auth.currentUser; // Get current auth user

    if (profileRaw) {
        try {
            const parsedProfile = JSON.parse(profileRaw);
            // Match using user ID if available (check if stored ID matches current auth user ID)
            if (currentUserAuth && parsedProfile.id === currentUserAuth.uid) {
                 profileData = {
                    fullName: parsedProfile.fullName || currentUserAuth.displayName || 'User',
                    profileImage: parsedProfile.profileImage || currentUserAuth.photoURL || null,
                    isVerified: parsedProfile.isVerified || false,
                 };
            } else {
                // TODO: Implement Firestore fetch for other users if needed
                 console.warn(`Fetching profile for user ${userId} from localStorage failed or didn't match. Using defaults or auth data.`);
                 // Attempt to get display name/photo from auth object if it's the current user
                 if (currentUserAuth && currentUserAuth.uid === userId) {
                     profileData.fullName = currentUserAuth.displayName || 'User';
                     profileData.profileImage = currentUserAuth.photoURL || null;
                     // Fetch isVerified status from Firestore for the current user if needed,
                     // or rely on the potentially outdated localStorage version for now.
                 }
                  // For now, keep isVerified false for others if not found in localStorage
            }
        } catch (e) {
            console.error("Failed to parse user profile for info", e);
             if (currentUserAuth && currentUserAuth.uid === userId) {
                 profileData.fullName = currentUserAuth.displayName || 'User';
                 profileData.profileImage = currentUserAuth.photoURL || null;
             }
        }
    } else if (currentUserAuth && currentUserAuth.uid === userId) {
         // Fallback to auth object if no localStorage profile
         profileData.fullName = currentUserAuth.displayName || 'User';
         profileData.profileImage = currentUserAuth.photoURL || null;
          // Fetch isVerified status from Firestore here if crucial
    }

    // --- TEMPORARY FOR TESTING BLUE TICK ---
    // Only apply to the current user for testing
    if (currentUserAuth && currentUserAuth.uid === userId) {
         profileData.isVerified = true; // Force verified for current user for testing
    }
    // --- END TEMPORARY ---

    return profileData;
}


const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, authLoading] = useAuthState(auth);
    const [uploading, setUploading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter(); // Initialize router

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
        }
    }, [user, authLoading, router]);


    const scrollToBottom = useCallback(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
           requestAnimationFrame(() => {
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           });
        }
    }, []);


    // Fetch messages from the global group chat
    useEffect(() => {
        // Only fetch if user is authenticated
        if (user) {
            const messagesRef = collection(db, 'chats', GROUP_CHAT_ID, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const msgs = querySnapshot.docs.map(doc => {
                     const data = doc.data();
                    // Message data should already contain sender info (name, photo, verified status)
                    return {
                        id: doc.id,
                        ...data,
                    } as Message;
                });
                setMessages(msgs);
                 setTimeout(scrollToBottom, 100); // Scroll after messages update
            }, (error) => {
                console.error("Error fetching messages: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load chat messages.",
                });
            });

            return () => unsubscribe();
        } else {
            // Clear messages if user logs out
            setMessages([]);
        }
    }, [user, scrollToBottom, toast]); // Depend on user


    const sendMessage = async () => {
        if (!newMessage.trim() || !user || authLoading) {
             if (!user && !authLoading) toast({ variant: "destructive", title: "Error", description: "Please log in to send messages." });
             return;
        }

        // Fetch sender's current profile info to store with the message
        const senderInfo = await getUserProfileInfo(user.uid);

        const messagesRef = collection(db, 'chats', GROUP_CHAT_ID, 'messages');

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                timestamp: serverTimestamp(),
                senderPhotoURL: senderInfo.profileImage,
                senderDisplayName: senderInfo.fullName,
                senderIsVerified: senderInfo.isVerified // Include current verification status
            });
            setNewMessage('');
            // scrollToBottom(); // Let useEffect handle scrolling on message update
        } catch (error) {
            console.error("Error sending message: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send message.",
            });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
         if (!file || !user || authLoading) {
             if (!user && !authLoading) toast({ variant: "destructive", title: "Error", description: "Please log in to upload files." });
             setUploading(false); // Ensure uploading is reset
            return;
        }

        setUploading(true);

         // Fetch sender's current profile info to store with the message
        const senderInfo = await getUserProfileInfo(user.uid);

        const filePath = `chats/${GROUP_CHAT_ID}/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const messagesRef = collection(db, 'chats', GROUP_CHAT_ID, 'messages');
             await addDoc(messagesRef, {
                senderId: user.uid,
                timestamp: serverTimestamp(),
                fileUrl: downloadURL,
                fileName: file.name,
                fileType: file.type,
                senderPhotoURL: senderInfo.profileImage,
                senderDisplayName: senderInfo.fullName,
                senderIsVerified: senderInfo.isVerified // Include verification status when sending file
            });
            // scrollToBottom(); // Let useEffect handle scrolling
        } catch (error) {
            console.error("Error uploading file or sending message: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to upload file.",
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUploadClick = () => {
         if (!user && !authLoading) {
             toast({ variant: "destructive", title: "Error", description: "Please log in to upload files." });
             return;
         }
        fileInputRef.current?.click();
    };

     // Show loading indicator while auth is checking
     if (authLoading) {
        return (
          <div className="container mx-auto p-6 flex justify-center items-center min-h-[calc(100vh-8rem)]">
             <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             <span className="ml-2">Loading chat...</span>
          </div>
        );
    }

     // Show login prompt if not logged in after loading
     if (!user) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center h-[calc(100vh-10rem)]">
                 <Card className="w-full max-w-md neumorphic">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/> Group Chat</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p>Please log in to participate in the group chat.</p>
                        <Link href="/login"> {/* Changed link to /login */}
                            <Button className="mt-4">Go to Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-8rem)] bg-secondary/30 rounded-lg shadow-md neumorphic">
            {/* Chat Header - Changed to static Group Chat */}
             <div className="border-b p-4 bg-secondary rounded-t-lg flex items-center">
                <Users className="h-6 w-6 mr-3 text-secondary-foreground flex-shrink-0"/>
                <h1 className="text-xl font-semibold text-secondary-foreground flex items-center flex-shrink min-w-0">
                    <span className="truncate">Group Chat</span>
                </h1>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 space-y-4 bg-background/50">
                 {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`} // Check against optional user.uid
                    >
                        <div
                            className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${msg.senderId === user?.uid ? 'flex-row-reverse' : ''}`}
                        >
                             {/* Link Avatar to sender's profile */}
                             <Link href={`/profile/${msg.senderId}`} passHref>
                                 <Avatar className={`h-6 w-6 ${msg.senderId === user?.uid ? 'ml-2' : 'mr-2'} self-end flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}>
                                    <AvatarImage src={msg.senderPhotoURL || undefined} data-ai-hint="chat user avatar small" />
                                    <AvatarFallback>{msg.senderDisplayName ? msg.senderDisplayName.substring(0, 1).toUpperCase() : '?'}</AvatarFallback>
                                </Avatar>
                             </Link>
                            <div
                                className={`rounded-lg p-3 shadow ${
                                    msg.senderId === user?.uid // Check against optional user.uid
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                             >
                                {/* Sender Name and Verification */}
                                <p className={`text-xs font-semibold mb-1 flex items-center ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                    {/* Link name to sender's profile */}
                                     <Link href={`/profile/${msg.senderId}`} className="hover:underline">
                                        <span>{msg.senderDisplayName || 'User'}</span>
                                     </Link>
                                     {/* Adjusted badge size and margin - Use h-3.5 w-3.5 */}
                                     {msg.senderIsVerified && <VerifiedBadge className="ml-1 h-3.5 w-3.5 flex-shrink-0" />}
                                </p>

                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                {msg.fileUrl && (
                                    msg.fileType?.startsWith('image/') ? (
                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                            <img
                                                src={msg.fileUrl}
                                                alt={msg.fileName || 'Uploaded image'}
                                                className="max-w-full h-auto rounded max-h-60 cursor-pointer border"
                                                data-ai-hint="chat image file"
                                                loading="lazy" // Lazy load images
                                            />
                                         </a>
                                    ) : (
                                        <a
                                            href={msg.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={msg.fileName}
                                            className="mt-2 flex items-center text-sm underline hover:text-primary break-all" // Allow link to break
                                        >
                                            <FileIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                                            <span className="truncate">{msg.fileName || 'Download File'}</span> {/* Truncate long names */}
                                        </a>
                                    )
                                )}
                                <p className="text-xs opacity-70 mt-1 text-right">
                                    {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'Sending...'}
                                </p>
                             </div>
                        </div>
                     </div>
                 ))}
            </ScrollArea>

             {/* Input Area */}
            <div className="border-t p-4 flex items-center space-x-2 bg-secondary rounded-b-lg">
                <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx"
                    disabled={uploading || !user} // Disable if not logged in
                />
                 <Button variant="ghost" size="icon" onClick={handleUploadClick} disabled={uploading || !user} title="Attach file">
                    <Paperclip className="h-5 w-5"/>
                </Button>
                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-grow"
                    disabled={uploading || !user} // Disable if not logged in
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || uploading || !user} title="Send message">
                    <Send className="h-5 w-5"/>
                </Button>
            </div>
        </div>
    );
};

export default ChatPage;
