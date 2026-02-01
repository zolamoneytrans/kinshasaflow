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
import { LoginValues, loginSchema } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import Link from 'next/link';

const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.658-3.356-11.303-7.962l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.433,36.368,48,31,48,24C48,22.659,47.862,21.35,47.611,20.083z"></path>
    </svg>
)

export function LoginForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
    
    const { auth } = useFirebase();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(data: LoginValues) {
        setIsSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password);
            toast({
                title: 'Connexion réussie!',
                description: "Vous êtes maintenant connecté.",
                variant: 'default',
            });
            router.push('/');
        } catch (error) {
            console.error("Error signing in:", error);
            toast({
                title: 'Erreur de connexion',
                description: "Veuillez vérifier votre e-mail et votre mot de passe.",
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
            await signInWithPopup(auth, provider);
            toast({
                title: 'Connexion réussie!',
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
                <CardTitle>Se connecter</CardTitle>
                <CardDescription>Accédez à votre compte pour continuer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
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
                            Se connecter
                        </Button>
                    </form>
                </Form>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Ou continuer avec
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
                    Vous n'avez pas de compte?{" "}
                    <Link href="/signup" className="text-primary hover:underline">
                        S'inscrire
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
