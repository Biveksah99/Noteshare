
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage, auth } from '@/lib/firebase'; // Assuming you have firebase config here
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth'; // Correct import path for v5
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Paperclip, Send, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface Message {
    id: string;
    text?: string;
    senderId: string;
    receiverId: string; // Should always be ADMIN_ID for user -> admin chats
    timestamp: Timestamp | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string; // e.g., 'image/png', 'application/pdf'
    senderPhotoURL?: string | null; // Added sender photo URL
    senderDisplayName?: string | null; // Added sender display name
}

const ADMIN_ID = "adminUserId"; // Replace with actual admin ID or fetch dynamically
const ADMIN_PHOTO_URL = "https://picsum.photos/id/10/32/32"; // Placeholder Admin Avatar
const ADMIN_DISPLAY_NAME = "Admin"; // Placeholder Admin Name

const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user] = useAuthState(auth); // Get current user
    const [uploading, setUploading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getChatId = useCallback((userId: string) => {
        // Ensure consistent chat ID regardless of who initiates
        return userId < ADMIN_ID ? `${userId}_${ADMIN_ID}` : `${ADMIN_ID}_${userId}`;
    }, []);

    const scrollToBottom = useCallback(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
           // Use requestAnimationFrame to ensure scrolling happens after layout updates
           requestAnimationFrame(() => {
               scrollViewport.scrollTop = scrollViewport.scrollHeight;
           });
        }
    }, []);


    useEffect(() => {
        if (user) {
            const chatId = getChatId(user.uid);
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const msgs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Message));
                setMessages(msgs);
                 // Ensure scroll happens after messages state update
                 setTimeout(scrollToBottom, 0);
            }, (error) => {
                console.error("Error fetching messages: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load chat messages.",
                });
            });

            return () => unsubscribe(); // Cleanup listener on unmount
        }
    }, [user, getChatId, scrollToBottom]);


    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        const chatId = getChatId(user.uid);
        const messagesRef = collection(db, 'chats', chatId, 'messages');

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                receiverId: ADMIN_ID, // Messages from user go to admin
                timestamp: serverTimestamp(),
                senderPhotoURL: user.photoURL,
                senderDisplayName: user.displayName,
            });
            setNewMessage('');
            scrollToBottom(); // Scroll after sending
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
        // Store files in a user-specific path within the chat
        const filePath = `chats/${chatId}/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Add message to Firestore
            const messagesRef = collection(db, 'chats', chatId, 'messages');
             await addDoc(messagesRef, {
                senderId: user.uid,
                receiverId: ADMIN_ID, // Files from user go to admin
                timestamp: serverTimestamp(),
                fileUrl: downloadURL,
                fileName: file.name,
                fileType: file.type,
                senderPhotoURL: user.photoURL,
                senderDisplayName: user.displayName,
            });
            scrollToBottom(); // Scroll after sending file
        } catch (error) {
            console.error("Error uploading file or sending message: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to upload file.",
            });
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

     if (!user) {
        // Optionally, show a loading state or a prompt to log in
        return (
            <div className="container mx-auto p-6 flex justify-center items-center h-[calc(100vh-10rem)]">
                 <Card className="w-full max-w-md neumorphic">
                    <CardHeader>
                        <CardTitle>Chat</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p>Please log in to view the chat.</p>
                        {/* Add a Link to your login page */}
                        <Link href="/profile">
                            <Button className="mt-4">Go to Profile/Login</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-8rem)] bg-secondary/30 rounded-lg shadow-md neumorphic">
            {/* Chat Header */}
             <div className="border-b p-4 bg-secondary rounded-t-lg flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                   <AvatarImage src={ADMIN_PHOTO_URL} />
                   <AvatarFallback>{ADMIN_DISPLAY_NAME.substring(0,1)}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-semibold text-secondary-foreground">{ADMIN_DISPLAY_NAME}</h1>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 space-y-4 bg-background/50">
                 {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}
                        >
                            {/* Avatar shown only for received messages */}
                             {msg.senderId !== user.uid && (
                                <Avatar className={`h-6 w-6 mx-2 self-end`}>
                                    <AvatarImage src={msg.senderPhotoURL || ADMIN_PHOTO_URL} />
                                    <AvatarFallback>{msg.senderDisplayName ? msg.senderDisplayName.substring(0, 1) : 'A'}</AvatarFallback>
                                </Avatar>
                             )}
                            <div
                                className={`rounded-lg p-3 shadow ${
                                    msg.senderId === user.uid
                                        ? 'bg-primary text-primary-foreground ml-8' // Add margin for own messages to align opposite avatar
                                        : 'bg-muted text-foreground mr-8' // Add margin for received messages
                                }`}
                             >
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
                    accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx" // Specify acceptable file types
                />
                 <Button variant="ghost" size="icon" onClick={handleUploadClick} disabled={uploading} title="Attach file">
                    <Paperclip className="h-5 w-5"/>
                </Button>
                <Input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()} // Send on Enter
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

