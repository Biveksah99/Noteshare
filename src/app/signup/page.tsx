
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Added FormDescription import
import { auth, db } from '@/lib/firebase'; // Import db if needed for Firestore
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore'; // Import if storing extra data in Firestore
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' })
    .refine(email => email.endsWith('@gmail.com'), { message: "Email must be a @gmail.com address." }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

const SignupPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  // Redirect if user is already logged in
   useEffect(() => {
    if (!loading && user) {
      router.replace('/'); // Redirect to home page if logged in
    }
  }, [user, loading, router]);

  const onSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile display name
      await updateProfile(firebaseUser, { displayName: values.fullName });

      // Prepare profile data for localStorage
      const profileData = {
        id: firebaseUser.uid, // Store Firebase UID
        fullName: values.fullName,
        email: values.email,
        isVerified: false, // Default verification status
        profileImage: null, // Default profile image
        // Add other default fields if needed (gender, contactNumber, etc.)
        gender: '',
        contactNumber: '',
        address: '',
        section: '',
        bio: '',
      };

       // Save initial profile to localStorage (as per existing app pattern)
      try {
          localStorage.setItem('userProfile', JSON.stringify(profileData));
          console.log("Initial profile saved to localStorage for user:", firebaseUser.uid);
      } catch (localError) {
          console.error("Failed to save initial profile to localStorage", localError);
          // Non-critical error, proceed with signup feedback
      }


      // --- Firestore (Optional - Keep commented if sticking to localStorage for now) ---
      /*
      // Store additional user info in Firestore (recommended for scalability)
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        fullName: values.fullName,
        email: values.email,
        isVerified: false, // Default verification status
        createdAt: serverTimestamp(), // Optional: Track creation time
      });
      */
      // --- End Firestore ---

      toast({
        title: 'Signup Successful',
        description: 'Your account has been created. Please log in.',
      });
      router.push('/login'); // Redirect to login page after successful signup

    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the form if loading or already logged in
  if (loading || user) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }


  return (
    <div className="container mx-auto p-6 flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md neumorphic bg-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-center">
            <UserPlus className="mr-2 h-6 w-6" /> Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your details to sign up for NoteShare.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@gmail.com" {...field} />
                    </FormControl>
                     <FormDescription>
                       Must be a @gmail.com address.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Choose a password (min. 6 characters)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
