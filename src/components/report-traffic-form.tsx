'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { reportFormSchema, ReportFormValues } from '@/lib/types';
import { useFirebase, useUser, initiateAnonymousSignIn, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


export default function ReportTrafficForm() {
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { auth, firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!isUserLoading && !user) {
            initiateAnonymousSignIn(auth);
        }
    }, [user, isUserLoading, auth]);

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            location: '',
            description: '',
        },
    });

    function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    }

    async function onSubmit(data: ReportFormValues) {
        if (!user) {
            toast({
                title: 'Erreur',
                description: "Vous devez être connecté pour signaler un incident. Veuillez patienter...",
                variant: 'destructive',
            });
            if (!isUserLoading) {
                initiateAnonymousSignIn(auth);
            }
            return;
        }

        setIsSubmitting(true);
        
        try {
            const eventData = {
                ...data,
                userId: user.uid,
                user: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur Anonyme"),
                userAvatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
                picture: imagePreview || '',
                createdAt: serverTimestamp(),
            };

            const eventsCollection = collection(firestore, 'events');
            await addDocumentNonBlocking(eventsCollection, eventData);

            toast({
                title: 'Rapport envoyé !',
                description: "Merci pour votre contribution. Votre rapport a été soumis avec succès.",
                variant: 'default',
            });
            
            form.reset();
            setImagePreview(null);
        } catch (error) {
            console.error("Error submitting report:", error);
            toast({
                title: 'Oh oh! Une erreur est survenue.',
                description: "Impossible de soumettre votre rapport. Veuillez réessayer.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Signaler un incident</CardTitle>
                <CardDescription>Aidez les autres conducteurs en partageant des informations en temps réel.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lieu de l'incident</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Rond-point Victoire" {...field} disabled={isSubmitting || isUserLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                        placeholder="Décrivez ce qui se passe..."
                                        className="resize-none"
                                        {...field}
                                        disabled={isSubmitting || isUserLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sévérité</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isUserLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le niveau de sévérité" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="low">Faible</SelectItem>
                                    <SelectItem value="medium">Moyen</SelectItem>
                                    <SelectItem value="high">Élevé</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="picture"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ajouter une photo</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input 
                                                id="picture"
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handlePictureChange}
                                                disabled={isSubmitting || isUserLoading}
                                            />
                                            <label htmlFor="picture" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                                {imagePreview ? (
                                                     <div className="relative w-28 h-28">
                                                        <Image src={imagePreview} alt="Aperçu" fill style={{ objectFit: 'cover' }} className="rounded-md" />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <Camera className="w-8 h-8" />
                                                        <span>Ajouter une image</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting ? 'Envoi en cours...' : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Soumettre le rapport
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
