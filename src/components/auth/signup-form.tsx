'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SignupValues, signupSchema } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.658-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.433,36.368,48,31,48,24C48,22.659,47.862,21.35,47.611,20.083z"></path>
    </svg>
)

export function SignupForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
    
    const { auth, firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const form = useForm<SignupValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
        },
    });

    async function saveUserToFirestore(user: FirebaseUser) {
        const userRef = doc(firestore, 'users', user.uid);
        const userData = {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL || ''
        };
        return setDoc(userRef, userData, { merge: true });
    }

    async function onSubmit(data: SignupValues) {
        setIsSubmitting(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            await updateProfile(userCredential.user, { displayName: data.name });
            await saveUserToFirestore({ ...userCredential.user, displayName: data.name });

            toast({
                title: 'Inscription réussie!',
                description: "Votre compte a été créé.",
                variant: 'default',
            });
            router.push('/');
        } catch (error: any) {
            console.error("Error signing up:", error);
            const description = error.code === 'auth/email-already-in-use' 
                ? "Cette adresse e-mail est déjà utilisée."
                : "Une erreur s'est produite. Veuillez réessayer.";
            toast({
                title: "Erreur d'inscription",
                description,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function onGoogleSignIn() {
        setIsGoogleSubmitting(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await saveUserToFirestore(result.user);
            toast({
                title: 'Inscription réussie!',
                description: "Vous êtes maintenant connecté avec Google.",
                variant: 'default',
            });
            router.push('/');
        } catch (error) {
             console.error("Error with Google sign in:", error);
            toast({
                title: 'Erreur de connexion',
                description: "Impossible de se connecter avec Google. Veuillez réessayer.",
                variant: 'destructive',
            });
        } finally {
            setIsGoogleSubmitting(false);
        }
    }
    
    if (isUserLoading || user) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Créer un compte</CardTitle>
                <CardDescription>Entrez vos informations pour vous inscrire.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom complet</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} disabled={isSubmitting || isGoogleSubmitting} />
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
                                            <Input type="email" placeholder="nom@exemple.com" {...field} disabled={isSubmitting || isGoogleSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mot de passe</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="********" {...field} disabled={isSubmitting || isGoogleSubmitting} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting || isGoogleSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer mon compte
                        </Button>
                    </form>
                </Form>
                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Ou s'inscrire avec
                        </span>
                    </div>
                </div>
                 <Button variant="outline" className="w-full" onClick={onGoogleSignIn} disabled={isSubmitting || isGoogleSubmitting}>
                    {isGoogleSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    Google
                </Button>
            </CardContent>
             <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Vous avez déjà un compte?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                        Se connecter
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}