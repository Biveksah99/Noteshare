
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, storage, auth } from '@/lib/firebase'; // Assuming you have firebase config here
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from 'react-firebase-hooks/auth'; // Need to install react-firebase-hooks
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
    receiverId: string;
    timestamp: Timestamp | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string; // e.g., 'image/png', 'application/pdf'
}

const ADMIN_ID = "adminUserId"; // Replace with actual admin ID later

const ChatPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user] = useAuthState(auth); // Get current user
    const [uploading, setUploading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollAreaRef.current) {
             const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
             if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
             }
        }
    }, []);


    useEffect(() => {
        if (user) {
            const chatId = user.uid < ADMIN_ID ? `${user.uid}_${ADMIN_ID}` : `${ADMIN_ID}_${user.uid}`;
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const msgs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Message));
                setMessages(msgs);
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
    }, [user]);

     // Scroll to bottom when messages change
     useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);


    const sendMessage = async () => {
        if (!newMessage.trim() || !user) return;

        const chatId = user.uid < ADMIN_ID ? `${user.uid}_${ADMIN_ID}` : `${ADMIN_ID}_${user.uid}`;
        const messagesRef = collection(db, 'chats', chatId, 'messages');

        try {
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                receiverId: ADMIN_ID,
                timestamp: serverTimestamp(),
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
        const chatId = user.uid < ADMIN_ID ? `${user.uid}_${ADMIN_ID}` : `${ADMIN_ID}_${user.uid}`;
        const filePath = `chats/${chatId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Add message to Firestore
            const messagesRef = collection(db, 'chats', chatId, 'messages');
             await addDoc(messagesRef, {
                senderId: user.uid,
                receiverId: ADMIN_ID,
                timestamp: serverTimestamp(),
                fileUrl: downloadURL,
                fileName: file.name,
                fileType: file.type,
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
                 <Card className="w-full max-w-md">
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
        <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-8rem)] bg-secondary/30 rounded-lg shadow-md">
            {/* Chat Header */}
             <div className="border-b p-4 bg-secondary rounded-t-lg">
                <h1 className="text-xl font-semibold text-secondary-foreground">Chat with Admin</h1>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 space-y-4 bg-background">
                 {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex items-end max-w-xs md:max-w-md lg:max-w-lg ${msg.senderId === user.uid ? 'flex-row-reverse' : ''}`}
                        >
                            <Avatar className={`h-6 w-6 mx-2 ${msg.senderId === user.uid ? 'ml-2' : 'mr-2'}`}>
                                 {/* Placeholder avatar - replace with actual user/admin avatars */}
                                <AvatarImage src={msg.senderId === user.uid ? user.photoURL || undefined : "https://picsum.photos/id/10/32/32"} />
                                <AvatarFallback>{msg.senderId === user.uid ? user.displayName?.substring(0, 1) || 'U' : 'A'}</AvatarFallback>
                            </Avatar>
                            <div
                                className={`rounded-lg p-3 shadow ${
                                    msg.senderId === user.uid
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                             >
                                {msg.text && <p className="text-sm break-words">{msg.text}</p>}
                                {msg.fileUrl && (
                                    msg.fileType?.startsWith('image/') ? (
                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                            <img
                                                src={msg.fileUrl}
                                                alt={msg.fileName || 'Uploaded image'}
                                                className="max-w-full h-auto rounded mt-2 max-h-60 cursor-pointer"
                                            />
                                         </a>
                                    ) : (
                                        <a
                                            href={msg.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={msg.fileName}
                                            className="mt-2 flex items-center text-sm underline"
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
