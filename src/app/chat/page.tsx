
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage, auth } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Image as ImageIcon, File as FileIcon, CheckCircle2 } from 'lucide-react'; // Import CheckCircle2
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: string;
    text?: string;
    senderId: string;
    receiverId: string;
    timestamp: Timestamp | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    senderPhotoURL?: string | null;
    senderDisplayName?: string | null;
    senderIsVerified?: boolean; // Added sender verification status
}

// Assume admin details are fetched or predefined
// Fetching admin details including verification status
const ADMIN_ID = "adminUserId"; // Replace with actual admin ID
const [adminDetails, setAdminDetails] = useState<{ photoURL: string; displayName: string; isVerified: boolean } | null>(null);

useEffect(() => {
    // Example: Fetch admin details (replace with your actual fetching logic)
    const fetchAdminDetails = async () => {
        // Simulating fetching admin data
        // In a real app, fetch from Firestore or your backend
        setAdminDetails({
            photoURL: "https://picsum.photos/id/10/32/32", // Placeholder
            displayName: "Admin", // Placeholder
            isVerified: true // Assuming admin is always verified
        });
    };
    fetchAdminDetails();
}, []);


const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user] = useAuthState(auth);
    const [uploading, setUploading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [userIsVerified, setUserIsVerified] = useState<boolean>(false); // State for current user's verification

    // Fetch current user's verification status
     useEffect(() => {
        if (user) {
            const profile = localStorage.getItem('userProfile');
            if (profile) {
                try {
                    const parsedProfile = JSON.parse(profile);
                    if(parsedProfile.fullName === user.displayName) { // Basic check
                         setUserIsVerified(parsedProfile.isVerified || false);
                    }
                } catch (e) {
                    console.error("Failed to parse user profile for verification status", e);
                }
            }
        }
     }, [user]);


    const getChatId = useCallback((userId: string) => {
        return userId < ADMIN_ID ? `${userId}_${ADMIN_ID}` : `${ADMIN_ID}_${userId}`;
    }, []);

    const scrollToBottom = useCallback(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
           requestAnimationFrame(() => {
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           });
        }
    }, []);


    useEffect(() => {
        if (user && adminDetails) { // Ensure admin details are loaded
            const chatId = getChatId(user.uid);
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const msgs = querySnapshot.docs.map(doc => {
                     const data = doc.data();
                     // Add senderIsVerified based on senderId
                     const senderIsVerified = data.senderId === ADMIN_ID
                        ? adminDetails.isVerified
                        : (data.senderId === user.uid ? userIsVerified : false); // Fallback for safety

                    return {
                        id: doc.id,
                        ...data,
                        senderIsVerified // Add the verification status
                    } as Message;
                });
                setMessages(msgs);
                 setTimeout(scrollToBottom, 100); // Increased delay slightly
            }, (error) => {
                console.error("Error fetching messages: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load chat messages.",
                });
            });

            return () => unsubscribe();
        }
    }, [user, adminDetails, getChatId, scrollToBottom, toast, userIsVerified]); // Add adminDetails and userIsVerified to dependencies


    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        const chatId = getChatId(user.uid);
        const messagesRef = collection(db, 'chats', chatId, 'messages');

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                receiverId: ADMIN_ID,
                timestamp: serverTimestamp(),
                senderPhotoURL: user.photoURL,
                senderDisplayName: user.displayName,
                // senderIsVerified: userIsVerified // Include verification status when sending
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
        if (!file || !user) return;

        setUploading(true);
        const chatId = getChatId(user.uid);
        const filePath = `chats/${chatId}/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            const messagesRef = collection(db, 'chats', chatId, 'messages');
             await addDoc(messagesRef, {
                senderId: user.uid,
                receiverId: ADMIN_ID,
                timestamp: serverTimestamp(),
                fileUrl: downloadURL,
                fileName: file.name,
                fileType: file.type,
                senderPhotoURL: user.photoURL,
                senderDisplayName: user.displayName,
                // senderIsVerified: userIsVerified // Include verification status when sending file
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
        fileInputRef.current?.click();
    };

     if (!user) {
        return (
            <div className="container mx-auto p-6 flex justify-center items-center h-[calc(100vh-10rem)]">
                 <Card className="w-full max-w-md neumorphic">
                    <CardHeader>
                        <CardTitle>Chat</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p>Please log in to view the chat.</p>
                        <Link href="/profile">
                            <Button className="mt-4">Go to Profile/Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

     if (!adminDetails) {
          return <div className="container mx-auto p-6 text-center">Loading chat...</div>; // Loading state for admin details
     }


    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-8rem)] bg-secondary/30 rounded-lg shadow-md neumorphic">
            {/* Chat Header */}
             <div className="border-b p-4 bg-secondary rounded-t-lg flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                   <AvatarImage src={adminDetails.photoURL} />
                   <AvatarFallback>{adminDetails.displayName.substring(0,1)}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-semibold text-secondary-foreground flex items-center">
                    {adminDetails.displayName}
                    {adminDetails.isVerified && <CheckCircle2 className="ml-1.5 h-4 w-4 text-blue-500" />} {/* Blue tick for admin */}
                </h1>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 space-y-4 bg-background/50">
                 {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}
                        >
                             <Avatar className={`h-6 w-6 ${msg.senderId === user.uid ? 'ml-2' : 'mr-2'} self-end flex-shrink-0`}>
                                <AvatarImage src={msg.senderPhotoURL || undefined} />
                                <AvatarFallback>{msg.senderDisplayName ? msg.senderDisplayName.substring(0, 1).toUpperCase() : '?'}</AvatarFallback>
                            </Avatar>
                            <div
                                className={`rounded-lg p-3 shadow ${
                                    msg.senderId === user.uid
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                             >
                                {/* Sender Name and Verification */}
                                <p className={`text-xs font-semibold mb-1 flex items-center ${msg.senderId === user.uid ? 'text-right' : 'text-left'}`}>
                                    {msg.senderDisplayName || 'User'}
                                    {msg.senderIsVerified && <CheckCircle2 className="ml-1 h-3 w-3 text-blue-500" />} {/* Blue tick */}
                                </p>

                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                {msg.fileUrl && (
                                    msg.fileType?.startsWith('image/') ? (
                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                            <img
                                                src={msg.fileUrl}
                                                alt={msg.fileName || 'Uploaded image'}
                                                className="max-w-full h-auto rounded max-h-60 cursor-pointer border"
                                            />
                                         </a>
                                    ) : (
                                        <a
                                            href={msg.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={msg.fileName}
                                            className="mt-2 flex items-center text-sm underline hover:text-primary"
                                        >
                                            <FileIcon className="h-4 w-4 mr-1" />
                                            {msg.fileName || 'Download File'}
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
                />
                 <Button variant="ghost" size="icon" onClick={handleUploadClick} disabled={uploading} title="Attach file">
                    <Paperclip className="h-5 w-5"/>
                </Button>
                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="flex-grow"
                    disabled={uploading}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || uploading} title="Send message">
                    <Send className="h-5 w-5"/>
                </Button>
            </div>
        </div>
    );
};

export default ChatPage;


    